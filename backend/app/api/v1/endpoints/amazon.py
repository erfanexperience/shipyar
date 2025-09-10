from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from typing import Dict, Any, Optional
from app.services.amazon_scraper import AmazonScraper
from app.api.deps import get_current_user
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class AmazonProductRequest(BaseModel):
    url: HttpUrl
    
class AmazonProductResponse(BaseModel):
    asin: Optional[str]
    url: str
    title: Optional[str]
    price: Optional[float]
    currency: str
    image_url: Optional[str]
    description: Optional[str]
    availability: Optional[str]
    rating: Optional[float]
    review_count: Optional[int]
    
@router.post("/fetch-product", response_model=AmazonProductResponse)
async def fetch_amazon_product(
    request: AmazonProductRequest
):
    """
    Fetch product information from an Amazon URL
    """
    try:
        scraper = AmazonScraper()
        
        # Convert Pydantic HttpUrl to string
        url_str = str(request.url)
        
        # Validate it's an Amazon URL
        if 'amazon.com' not in url_str.lower():
            raise HTTPException(status_code=400, detail="Please provide a valid Amazon.com URL")
        
        # Fetch product information
        product_info = await scraper.fetch_product_info(url_str)
        
        return AmazonProductResponse(**product_info)
        
    except ValueError as e:
        logger.error(f"Error fetching Amazon product: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error fetching Amazon product: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch product information")