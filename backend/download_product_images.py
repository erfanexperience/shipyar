#!/usr/bin/env python3
import asyncio
import requests
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.amazon_scraper import AmazonScraper

products = [
    ('puma-shoes', 'https://www.amazon.com/PUMA-SOFTRIDE-Symmetry-Running-Dust-Alpine/dp/B0DDTVB6R4/'),
    ('beef-jerky', 'https://www.amazon.com/Jack-Links-Jerky-Multipack-Original/dp/B07NR7694X/'),
    ('apple-watch', 'https://www.amazon.com/Apple-Smartwatch-Aluminium-Fitness-Tracker/dp/B0DGHNXP5Y/'),
    ('stanley-tumbler', 'https://www.amazon.com/Labulabla-Reusable-Stainless-Insulated-Beverages/dp/B0D51GZ5TR/'),
    ('ps5', 'https://www.amazon.com/PlayStation%C2%AE5-Digital-slim-PlayStation-5/dp/B0CL5KNB9M/'),
    ('macbook', 'https://www.amazon.com/Apple-2025-MacBook-13-inch-Laptop/dp/B0DZD91W4F/'),
    ('airpods', 'https://www.amazon.com/Apple-Cancellation-Transparency-Personalized-High-Fidelity/dp/B0D1XD1ZV3/'),
    ('vitamins', 'https://www.amazon.com/Essentials-Multivitamin-Gummies-Raspberry-Natural/dp/B0DVTKP2RH/'),
    ('massage-gun', 'https://www.amazon.com/RENPHO-Handheld-Percussion-Masajeador-Thermacool/dp/B0F2SWWDQJ/')
]

def download_image(url, filename):
    try:
        response = requests.get(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        if response.status_code == 200:
            output_path = f'/Users/shayan/Documents/codes/shipyar/frontend/src/assets/products/{filename}.jpg'
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"✅ Downloaded {filename}")
            return True
    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")
    return False

async def main():
    scraper = AmazonScraper()
    
    for name, url in products:
        print(f"Fetching {name}...")
        try:
            product_info = await scraper.fetch_product_info(url)
            if product_info.get('image_url'):
                download_image(product_info['image_url'], name)
                print(f"  Title: {product_info.get('title', 'N/A')}")
                print(f"  Price: ${product_info.get('price', 'N/A')}")
            else:
                print(f"❌ No image found for {name}")
        except Exception as e:
            print(f"❌ Error fetching {name}: {e}")
        
        # Small delay between requests
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())