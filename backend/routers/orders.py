"""
Order router - handles order creation endpoint.
Orchestrates all AI agents: LLM, validation, ML prediction, and action execution.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from models.schemas import (
    OrderRequest, OrderResponse, ErrorResponse,
    AILogCreate, OrderItemResponse, OrderStatus, SafetyCheck
)
from core.database import get_supabase_client
from services.llm_service import LLMService
from services.validation_service import ValidationService
from services.ml_service import MLService
from services.inventory_service import InventoryService
from repositories.order_repository import OrderRepository
from repositories.prescription_repository import PrescriptionRepository
from repositories.product_repository import ProductRepository
from repositories.inventory_repository import InventoryRepository
from repositories.ai_log_repository import AILogRepository
from supabase import Client
from datetime import datetime, timedelta
import time
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders", tags=["Orders"])


# Initialize services (singleton pattern)
llm_service = LLMService()
validation_service = ValidationService()
ml_service = MLService()
inventory_service = InventoryService()


@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def create_order(
    order_request: OrderRequest,
    supabase: Client = Depends(get_supabase_client)
):
    """
    **Create a new order with AI-powered processing.**
    
    This endpoint orchestrates multiple AI agents:
    1. **Conversation Agent** (LLM): Extracts intent from order context
    2. **Safety Agent**: Validates prescriptions and dosage requirements
    3. **Refill Prediction Agent** (ML): Predicts next refill dates
    4. **Action Agent**: Updates inventory and creates order
    
    All decisions are logged to the ai_logs table for audit trail.
    
    **Process Flow:**
    - Extract intent using Groq LLM
    - Fetch products and prescriptions from database
    - Validate prescription requirements and safety
    - Check inventory availability
    - Predict refill dates for prescription items
    - Create order and update inventory
    - Log all AI decisions
    
    Returns the created order with AI agent outputs.
    """
    start_time = time.time()
    
    # Initialize repositories
    order_repo = OrderRepository(supabase)
    prescription_repo = PrescriptionRepository(supabase)
    product_repo = ProductRepository(supabase)
    inventory_repo = InventoryRepository(supabase)
    ai_log_repo = AILogRepository(supabase)
    
    try:
        # ==================== STEP 1: LLM INTENT EXTRACTION ====================
        logger.info(f"Processing order for user {order_request.user_id}")
        
        # Build context for LLM
        user_prescriptions = await prescription_repo.get_user_prescriptions(
            order_request.user_id
        )
        
        context = {
            "prescriptions": [
                f"{p.product_id} (refills: {p.refills_remaining})" 
                for p in user_prescriptions
            ]
        }
        
        # Extract intent from order notes/context
        intent_message = order_request.notes or "Customer placing order"
        llm_output = await llm_service.extract_intent(intent_message, context)
        
        logger.info(f"LLM detected intent: {llm_output.intent} (confidence: {llm_output.confidence})")
        
        # ==================== STEP 2: FETCH PRODUCTS ====================
        product_ids = [item.product_id for item in order_request.items]
        products = await product_repo.get_by_ids(product_ids)
        
        if len(products) != len(order_request.items):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more products not found"
            )
        
        # Create product lookup map
        product_map = {p.id: p for p in products}
        
        # ==================== STEP 3: FETCH PRESCRIPTIONS ====================
        prescriptions_map = {}
        
        for item in order_request.items:
            product = product_map[item.product_id]
            
            # If prescription ID provided, fetch it
            if item.prescription_id:
                prescription = await prescription_repo.get_by_id(item.prescription_id)
                if prescription:
                    prescriptions_map[item.product_id] = prescription
            
            # If product requires RX but no prescription provided, try to find one
            elif product.rx_required:
                prescription = await prescription_repo.get_by_user_and_product(
                    order_request.user_id,
                    item.product_id
                )
                if prescription:
                    prescriptions_map[item.product_id] = prescription
        
        # ==================== STEP 4: SAFETY VALIDATION ====================
        validation_items = []
        for item in order_request.items:
            product = product_map[item.product_id]
            prescription = prescriptions_map.get(item.product_id)
            validation_items.append((product, prescription, item.quantity))
        
        safety_check = validation_service.perform_safety_check(validation_items)
        
        if not safety_check.approved:
            # Collect all blocking reasons
            blocking_reasons = []
            if safety_check.prescription_validation:
                blocking_reasons.extend(
                    safety_check.prescription_validation.blocking_reasons
                )
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "Order validation failed",
                    "reasons": blocking_reasons,
                    "warnings": safety_check.interaction_warnings
                }
            )
        
        logger.info("Safety validation passed")
        
        # ==================== STEP 5: INVENTORY CHECK ====================
        inventory_checks = await inventory_service.reserve_inventory(
            [(item.product_id, item.quantity) for item in order_request.items],
            inventory_repo
        )
        
        # Check if all items available
        unavailable_items = []
        for idx, (available, message) in enumerate(inventory_checks):
            if not available:
                product_name = product_map[order_request.items[idx].product_id].name
                unavailable_items.append(f"{product_name}: {message}")
        
        if unavailable_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "Insufficient inventory",
                    "items": unavailable_items
                }
            )
        
        # ==================== STEP 6: REFILL PREDICTIONS ====================
        refill_predictions = []
        
        for item in order_request.items:
            product = product_map[item.product_id]
            prescription = prescriptions_map.get(item.product_id)
            
            if prescription:
                prediction = ml_service.predict_refill_date(prescription)
                refill_predictions.append(prediction)
                logger.info(
                    f"Predicted refill for {product.name}: "
                    f"{prediction.predicted_refill_date} (confidence: {prediction.confidence_score})"
                )
        
        # ==================== STEP 7: CALCULATE TOTALS ====================
        order_items_data = []
        subtotal = 0.0
        
        for item in order_request.items:
            product = product_map[item.product_id]
            item_total = product.price * item.quantity
            subtotal += item_total
            
            order_items_data.append({
                "product_id": str(item.product_id),
                "prescription_id": str(item.prescription_id) if item.prescription_id else None,
                "quantity": item.quantity,
                "unit_price": product.price,
                "total_price": item_total,
                "is_refill": item.product_id in prescriptions_map
            })
        
        tax = subtotal * 0.08  # 8% tax (configurable)
        total = subtotal + tax
        
        # ==================== STEP 8: CREATE ORDER ====================
        order = await order_repo.create_order(
            order_request=order_request,
            order_items_data=order_items_data,
            subtotal=subtotal,
            tax=tax,
            total=total
        )
        
        logger.info(f"Created order {order['order_number']}")
        
        # ==================== STEP 9: UPDATE INVENTORY ====================
        inventory_updated = True
        
        try:
            for item in order_request.items:
                await inventory_service.update_inventory(
                    product_id=item.product_id,
                    quantity_delta=-item.quantity,  # Decrease inventory
                    inventory_repo=inventory_repo,
                    reason=f"order_{order['order_number']}"
                )
            
            logger.info(f"Updated inventory for order {order['order_number']}")
        
        except Exception as e:
            logger.error(f"Error updating inventory: {e}")
            inventory_updated = False
            # Continue - order is created, inventory can be adjusted manually
        
        # ==================== STEP 10: UPDATE PRESCRIPTIONS ====================
        for item in order_request.items:
            prescription = prescriptions_map.get(item.product_id)
            if prescription:
                await prescription_repo.update_refill(
                    prescription_id=prescription.id,
                    new_last_filled_date=datetime.utcnow().date().isoformat()
                )
        
        # ==================== STEP 11: LOG AI DECISIONS ====================
        processing_time = int((time.time() - start_time) * 1000)
        
        ai_log = await ai_log_repo.create_log(
            AILogCreate(
                order_id=order["id"],
                user_id=order_request.user_id,
                agent_type="order_orchestrator",
                intent_detected=llm_output.intent.value,
                llm_raw_output={
                    "intent": llm_output.intent.value,
                    "confidence": llm_output.confidence,
                    "medications": [m.model_dump() for m in llm_output.medications],
                    "summary": llm_output.summary
                },
                validation_result={
                    "approved": safety_check.approved,
                    "prescription_valid": safety_check.prescription_validation.is_valid if safety_check.prescription_validation else None,
                    "warnings": safety_check.interaction_warnings
                },
                prediction_result={
                    "predictions": [p.model_dump() for p in refill_predictions]
                },
                decision_made=f"Order {order['order_number']} created successfully",
                confidence_score=llm_output.confidence,
                processing_time_ms=processing_time
            )
        )
        
        # ==================== STEP 12: BUILD RESPONSE ====================
        response_items = []
        for item_data in order["items"]:
            product = product_map[UUID(item_data["product_id"])]
            response_items.append(
                OrderItemResponse(
                    product_id=item_data["product_id"],
                    product_name=product.name,
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    total_price=item_data["total_price"],
                    prescription_id=item_data.get("prescription_id")
                )
            )
        
        # Calculate estimated ready time (30 minutes for pickup)
        estimated_ready = datetime.utcnow() + timedelta(minutes=30)
        
        # Build user-facing message
        message = f"Order {order['order_number']} confirmed! "
        if order_request.delivery_method == "pickup":
            message += f"Ready for pickup at {estimated_ready.strftime('%I:%M %p')}."
        else:
            message += "Will be delivered soon."
        
        warnings = []
        if safety_check.interaction_warnings:
            warnings.extend(safety_check.interaction_warnings)
        if safety_check.prescription_validation and safety_check.prescription_validation.warnings:
            warnings.extend(safety_check.prescription_validation.warnings)
        
        response = OrderResponse(
            order_id=order["id"],
            order_number=order["order_number"],
            status=OrderStatus(order["status"]),
            user_id=order_request.user_id,
            items=response_items,
            subtotal=subtotal,
            tax=tax,
            total=total,
            delivery_method=order_request.delivery_method,
            estimated_ready_at=estimated_ready,
            created_at=datetime.fromisoformat(order["created_at"]),
            intent_detected=llm_output.intent.value,
            llm_confidence=llm_output.confidence,
            safety_check=safety_check,
            refill_predictions=refill_predictions,
            inventory_updated=inventory_updated,
            ai_log_id=ai_log["id"],
            message=message,
            warnings=warnings
        )
        
        logger.info(
            f"Order {order['order_number']} completed in {processing_time}ms"
        )
        
        return response
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"Error processing order: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/{order_id}", response_model=dict)
async def get_order(
    order_id: str,
    supabase: Client = Depends(get_supabase_client)
):
    """Get order by ID."""
    order_repo = OrderRepository(supabase)
    
    try:
        from uuid import UUID
        order = await order_repo.get_order_by_id(UUID(order_id))
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {order_id} not found"
            )
        
        return order
    
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order ID format"
        )
