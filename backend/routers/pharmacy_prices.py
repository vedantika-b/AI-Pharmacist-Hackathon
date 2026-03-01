from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
from typing import List, Optional

router = APIRouter(prefix="/api/v1/pharmacy", tags=["pharmacy"])

class PharmacyPrice(BaseModel):
    pharmacy_name: str
    price: float
    discount: Optional[float] = None
    final_price: float
    availability: str
    delivery_days: int
    url: str

class PriceComparisonRequest(BaseModel):
    medicine_name: str
    base_price: float

class PriceComparisonResponse(BaseModel):
    medicine_name: str
    prices: List[PharmacyPrice]
    lowest_price: float
    highest_price: float
    average_price: float
    savings_vs_highest: float

def generate_pharmacy_url(pharmacy: str, medicine_name: str) -> str:
    """Generate search URL for each pharmacy"""
    medicine_encoded = medicine_name.lower().replace(' ', '-')
    
    urls = {
        "Apollo Pharmacy": f"https://www.apollopharmacy.in/search-medicines/{medicine_encoded}",
        "PharmEasy": f"https://pharmeasy.in/search/all?name={medicine_name}",
        "Netmeds": f"https://www.netmeds.com/catalogsearch/result/{medicine_encoded}/all",
        "Tata 1mg": f"https://www.1mg.com/search/all?name={medicine_name}",
        "MediBuddy": f"https://www.medibuddy.in/medicines/search?q={medicine_name}"
    }
    
    return urls.get(pharmacy, "")

def generate_realistic_prices(base_price: float, medicine_name: str) -> List[PharmacyPrice]:
    """
    Generate realistic pharmacy prices based on base price
    In production, this would call actual pharmacy APIs or scraping service
    """
    
    pharmacies = [
        {
            "name": "Apollo Pharmacy",
            "price_variance": (-10, 15),  # Can be 10% cheaper to 15% expensive
            "discount_range": (5, 15),
            "delivery_range": (2, 4),
            "stock_probability": 0.9
        },
        {
            "name": "PharmEasy",
            "price_variance": (-15, 10),
            "discount_range": (10, 25),
            "delivery_range": (1, 3),
            "stock_probability": 0.95
        },
        {
            "name": "Netmeds",
            "price_variance": (-12, 12),
            "discount_range": (8, 20),
            "delivery_range": (2, 5),
            "stock_probability": 0.85
        },
        {
            "name": "Tata 1mg",
            "price_variance": (-8, 18),
            "discount_range": (5, 18),
            "delivery_range": (1, 3),
            "stock_probability": 0.92
        },
        {
            "name": "MediBuddy",
            "price_variance": (-5, 20),
            "discount_range": (7, 15),
            "delivery_range": (3, 6),
            "stock_probability": 0.80
        }
    ]
    
    prices = []
    
    for pharmacy in pharmacies:
        # Calculate price with variance
        variance_percent = random.uniform(*pharmacy["price_variance"])
        price = base_price * (1 + variance_percent / 100)
        price = round(price, 2)
        
        # Check availability
        is_available = random.random() < pharmacy["stock_probability"]
        
        if is_available:
            # Add discount
            discount_percent = random.uniform(*pharmacy["discount_range"])
            discount_amount = round(price * discount_percent / 100, 2)
            final_price = round(price - discount_amount, 2)
            
            # Delivery days
            delivery_days = random.randint(*pharmacy["delivery_range"])
            
            prices.append(PharmacyPrice(
                pharmacy_name=pharmacy["name"],
                price=price,
                discount=discount_percent,
                final_price=final_price,
                availability="In Stock",
                delivery_days=delivery_days,
                url=generate_pharmacy_url(pharmacy["name"], medicine_name)
            ))
        else:
            prices.append(PharmacyPrice(
                pharmacy_name=pharmacy["name"],
                price=price,
                discount=0,
                final_price=price,
                availability="Out of Stock",
                delivery_days=0,
                url=generate_pharmacy_url(pharmacy["name"], medicine_name)
            ))
    
    return prices

@router.post("/compare-prices", response_model=PriceComparisonResponse)
async def compare_pharmacy_prices(request: PriceComparisonRequest):
    """
    Compare prices across multiple pharmacies for a given medicine
    
    NOTE: This is a DEMO implementation with simulated data.
    In production, this would:
    1. Call actual pharmacy APIs (if available)
    2. Use web scraping with proper permissions
    3. Cache results to avoid excessive requests
    4. Handle rate limiting
    """
    
    try:
        # Generate prices for all pharmacies
        prices = generate_realistic_prices(request.base_price, request.medicine_name)
        
        # Calculate statistics (only for in-stock items)
        available_prices = [p for p in prices if p.availability == "In Stock"]
        
        if not available_prices:
            raise HTTPException(
                status_code=404, 
                detail="Medicine not available in any pharmacy"
            )
        
        final_prices = [p.final_price for p in available_prices]
        lowest_price = min(final_prices)
        highest_price = max(final_prices)
        average_price = round(sum(final_prices) / len(final_prices), 2)
        savings_vs_highest = round(highest_price - lowest_price, 2)
        
        return PriceComparisonResponse(
            medicine_name=request.medicine_name,
            prices=prices,
            lowest_price=lowest_price,
            highest_price=highest_price,
            average_price=average_price,
            savings_vs_highest=savings_vs_highest
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching prices: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "pharmacy_price_comparison"}
