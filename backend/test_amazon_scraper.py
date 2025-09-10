#!/usr/bin/env python3
import asyncio
from app.services.amazon_scraper import AmazonScraper

async def test_scraper():
    scraper = AmazonScraper()
    
    # Test with a real Amazon product URL
    test_url = "https://www.amazon.com/dp/B0B7CPSN2K"
    
    print(f"Testing Amazon scraper with URL: {test_url}")
    print("-" * 50)
    
    try:
        product_info = await scraper.fetch_product_info(test_url)
        
        print(f"✅ Successfully fetched product information:")
        print(f"Title: {product_info.get('title', 'N/A')}")
        print(f"Price: ${product_info.get('price', 'N/A')}")
        print(f"ASIN: {product_info.get('asin', 'N/A')}")
        print(f"Image URL: {product_info.get('image_url', 'N/A')[:100] if product_info.get('image_url') else 'N/A'}...")
        print(f"Availability: {product_info.get('availability', 'N/A')}")
        print(f"Rating: {product_info.get('rating', 'N/A')}")
        print(f"Review Count: {product_info.get('review_count', 'N/A')}")
        print(f"Description preview: {product_info.get('description', 'N/A')[:200] if product_info.get('description') else 'N/A'}...")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_scraper())