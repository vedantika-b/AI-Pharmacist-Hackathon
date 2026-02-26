"""
Prescription Scan repository for database operations on prescription_scans table.
Stores OCR results from prescription image processing.
"""

from supabase import Client
from uuid import UUID
from models.schemas import PrescriptionScanCreate, PrescriptionScanResponse, MedicationItem
from typing import Optional, List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class PrescriptionScanRepository:
    """Repository for prescription scan database operations."""
    
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
        self.table = "prescription_scans"
    
    async def create(self, scan_data: PrescriptionScanCreate) -> Optional[PrescriptionScanResponse]:
        """
        Create a new prescription scan record.
        
        Args:
            scan_data: PrescriptionScanCreate object with OCR results
            
        Returns:
            PrescriptionScanResponse if successful, None otherwise
        """
        try:
            # Convert medications to JSON-serializable format
            medications_json = [
                {
                    "name": med.name,
                    "dosage": med.dosage,
                    "frequency": med.frequency,
                    "duration": med.duration,
                    "quantity": med.quantity,
                    "instructions": med.instructions,
                    "confidence": med.confidence
                }
                for med in scan_data.medications
            ]
            
            # Prepare data for insertion
            insert_data = {
                "extracted_text": scan_data.extracted_text,
                "medications": medications_json,
                "metadata": scan_data.metadata,
                "confidence": scan_data.confidence,
                "image_quality": scan_data.image_quality,
                "has_handwriting": scan_data.has_handwriting,
                "status": "processed"
            }
            
            # Optional fields
            if scan_data.user_id:
                insert_data["user_id"] = str(scan_data.user_id)
            if scan_data.image_url:
                insert_data["image_url"] = scan_data.image_url
            if scan_data.image_filename:
                insert_data["image_filename"] = scan_data.image_filename
            if scan_data.prescription_date:
                insert_data["prescription_date"] = scan_data.prescription_date.isoformat()
            if scan_data.doctor_name:
                insert_data["doctor_name"] = scan_data.doctor_name
            if scan_data.patient_name:
                insert_data["patient_name"] = scan_data.patient_name
            if scan_data.processing_time_ms:
                insert_data["processing_time_ms"] = scan_data.processing_time_ms
            if scan_data.notes:
                insert_data["notes"] = scan_data.notes
            
            logger.info(f"Inserting prescription scan: {len(scan_data.medications)} medications")
            
            result = self.client.table(self.table).insert(insert_data).execute()
            
            if result.data and len(result.data) > 0:
                created = result.data[0]
                logger.info(f"Created prescription scan with ID: {created['id']}")
                return self._to_response(created)
            
            logger.error("No data returned from insert")
            return None
            
        except Exception as e:
            logger.error(f"Error creating prescription scan: {e}")
            return None
    
    async def get_by_id(self, scan_id: UUID) -> Optional[PrescriptionScanResponse]:
        """Get prescription scan by ID."""
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .eq("id", str(scan_id))\
                .single()\
                .execute()
            
            if result.data:
                return self._to_response(result.data)
            return None
        
        except Exception as e:
            logger.error(f"Error fetching prescription scan {scan_id}: {e}")
            return None
    
    async def get_user_scans(
        self,
        user_id: UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[PrescriptionScanResponse]:
        """Get all prescription scans for a user."""
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .eq("user_id", str(user_id))\
                .order("created_at", desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            
            if result.data:
                return [self._to_response(scan) for scan in result.data]
            return []
        
        except Exception as e:
            logger.error(f"Error fetching scans for user {user_id}: {e}")
            return []
    
    async def get_recent_scans(
        self,
        limit: int = 20
    ) -> List[PrescriptionScanResponse]:
        """Get recent prescription scans (for dashboard)."""
        try:
            result = self.client.table(self.table)\
                .select("*")\
                .order("created_at", desc=True)\
                .limit(limit)\
                .execute()
            
            if result.data:
                return [self._to_response(scan) for scan in result.data]
            return []
        
        except Exception as e:
            logger.error(f"Error fetching recent scans: {e}")
            return []
    
    async def update_status(
        self,
        scan_id: UUID,
        status: str
    ) -> bool:
        """Update the status of a prescription scan."""
        try:
            result = self.client.table(self.table)\
                .update({"status": status})\
                .eq("id", str(scan_id))\
                .execute()
            
            return bool(result.data)
        
        except Exception as e:
            logger.error(f"Error updating scan status {scan_id}: {e}")
            return False
    
    async def delete(self, scan_id: UUID) -> bool:
        """Delete a prescription scan."""
        try:
            result = self.client.table(self.table)\
                .delete()\
                .eq("id", str(scan_id))\
                .execute()
            
            return bool(result.data)
        
        except Exception as e:
            logger.error(f"Error deleting scan {scan_id}: {e}")
            return False
    
    def _to_response(self, data: dict) -> PrescriptionScanResponse:
        """Convert database record to response model."""
        # Parse medications from JSON
        medications = []
        if data.get("medications"):
            for med in data["medications"]:
                medications.append(MedicationItem(
                    name=med.get("name", ""),
                    dosage=med.get("dosage"),
                    frequency=med.get("frequency"),
                    duration=med.get("duration"),
                    quantity=med.get("quantity"),
                    instructions=med.get("instructions"),
                    confidence=med.get("confidence", 0.0)
                ))
        
        # Parse prescription_date
        prescription_date = None
        if data.get("prescription_date"):
            from datetime import date
            if isinstance(data["prescription_date"], str):
                prescription_date = date.fromisoformat(data["prescription_date"])
            else:
                prescription_date = data["prescription_date"]
        
        # Parse created_at
        created_at = data.get("created_at")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        
        return PrescriptionScanResponse(
            id=UUID(data["id"]),
            user_id=UUID(data["user_id"]) if data.get("user_id") else None,
            image_url=data.get("image_url"),
            extracted_text=data.get("extracted_text", ""),
            medications=medications,
            metadata=data.get("metadata", {}),
            confidence=data.get("confidence", 0.0),
            image_quality=data.get("image_quality", "unknown"),
            has_handwriting=data.get("has_handwriting", False),
            status=data.get("status", "processed"),
            prescription_date=prescription_date,
            doctor_name=data.get("doctor_name"),
            patient_name=data.get("patient_name"),
            created_at=created_at
        )
