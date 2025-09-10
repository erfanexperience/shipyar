import re
import json
import requests
from bs4 import BeautifulSoup
from typing import Optional, Dict, Any
from urllib.parse import urlparse, parse_qs
import logging

logger = logging.getLogger(__name__)

class AmazonScraper:
    """Service for extracting product information from Amazon URLs"""
    
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    }
    
    @staticmethod
    def extract_asin(url: str) -> Optional[str]:
        """Extract ASIN (Amazon Standard Identification Number) from URL"""
        # Pattern 1: /dp/ASIN
        dp_pattern = r'/dp/([A-Z0-9]{10})'
        match = re.search(dp_pattern, url)
        if match:
            return match.group(1)
        
        # Pattern 2: /gp/product/ASIN
        gp_pattern = r'/gp/product/([A-Z0-9]{10})'
        match = re.search(gp_pattern, url)
        if match:
            return match.group(1)
        
        # Pattern 3: /exec/obidos/ASIN/
        obidos_pattern = r'/exec/obidos/ASIN/([A-Z0-9]{10})'
        match = re.search(obidos_pattern, url)
        if match:
            return match.group(1)
        
        return None
    
    @staticmethod
    def clean_price(price_str: str) -> Optional[float]:
        """Clean and convert price string to float"""
        if not price_str:
            return None
        
        # Remove currency symbols and extra characters
        price_clean = re.sub(r'[^\d.,]', '', price_str)
        # Replace comma with dot for decimal
        price_clean = price_clean.replace(',', '')
        
        try:
            return float(price_clean)
        except (ValueError, AttributeError):
            return None
    
    async def fetch_product_info(self, url: str) -> Dict[str, Any]:
        """Fetch product information from Amazon URL"""
        
        # Validate URL
        if 'amazon.com' not in url.lower():
            raise ValueError("Invalid Amazon URL")
        
        # Extract ASIN
        asin = self.extract_asin(url)
        if not asin:
            raise ValueError("Could not extract product ID from URL")
        
        try:
            # Make request to Amazon with session for better success rate
            session = requests.Session()
            session.headers.update(self.HEADERS)
            
            response = session.get(url, timeout=15, allow_redirects=True)
            
            # Only check for explicit blocking patterns, not status codes
            if 'Robot Check' in response.text or 'captcha' in response.text.lower():
                logger.warning("Amazon CAPTCHA detected, returning basic info from URL")
                return self._create_basic_product_info(url, asin)
            
            # For 404, it might be a region issue or the product page moved
            if response.status_code == 404:
                logger.warning(f"Product page not found (404), but will try to parse any available data")
            elif response.status_code == 503:
                logger.warning("Amazon service unavailable (503), returning basic info")
                return self._create_basic_product_info(url, asin)
            else:
                response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, 'lxml')
            
            # Extract product information
            product_info = {
                'asin': asin,
                'url': url,
                'title': None,
                'price': None,
                'currency': 'USD',
                'image_url': None,
                'description': None,
                'availability': None,
                'rating': None,
                'review_count': None
            }
            
            # Title
            title_elem = soup.find('span', {'id': 'productTitle'})
            if title_elem:
                product_info['title'] = title_elem.text.strip()
            
            # Price - try multiple selectors in order of likelihood
            price_selectors = [
                'span.a-price-whole',
                'span.a-price.a-text-price.a-size-medium.apexPriceToPay',
                'span.a-price-range',
                'span.a-price.a-text-price.a-size-medium',
                'span.a-price.a-text-price',
                'span.a-color-price',
                'span.a-size-medium.a-color-price',
                'span.a-size-base.a-color-price',
                'span.priceToPay',
                '.a-price-whole',
                'span[class*="price"]'
            ]
            
            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price_text = price_elem.text.strip()
                    product_info['price'] = self.clean_price(price_text)
                    if product_info['price']:
                        break
            
            # Image - try multiple methods
            img_elem = soup.find('img', {'id': 'landingImage'})
            if not img_elem:
                img_elem = soup.find('img', {'data-old-hires': True})
            if not img_elem:
                # Try to find the main product image in different ways
                img_elem = soup.find('img', {'data-a-image-name': 'landingImage'})
            if not img_elem:
                # Look for images in the imageBlock
                img_block = soup.find('div', {'id': 'imageBlock'})
                if img_block:
                    img_elem = img_block.find('img')
            
            if img_elem:
                product_info['image_url'] = img_elem.get('src') or img_elem.get('data-old-hires') or img_elem.get('data-a-dynamic-image')
                # Sometimes the image URL is in a JSON attribute
                if not product_info['image_url'] and img_elem.get('data-a-dynamic-image'):
                    import json
                    try:
                        dynamic_images = json.loads(img_elem.get('data-a-dynamic-image'))
                        if dynamic_images:
                            product_info['image_url'] = list(dynamic_images.keys())[0]
                    except:
                        pass
            
            # Description - get feature bullets
            feature_bullets = soup.find('div', {'id': 'feature-bullets'})
            if feature_bullets:
                bullets = feature_bullets.find_all('span', {'class': 'a-list-item'})
                descriptions = []
                for bullet in bullets[:5]:  # Get first 5 bullet points
                    text = bullet.text.strip()
                    if text and not text.startswith('Make sure'):
                        descriptions.append(text)
                product_info['description'] = '\n'.join(descriptions)
            
            # Availability
            availability_elem = soup.find('div', {'id': 'availability'})
            if availability_elem:
                availability_text = availability_elem.find('span')
                if availability_text:
                    product_info['availability'] = availability_text.text.strip()
            
            # Rating
            rating_elem = soup.find('span', {'class': 'a-icon-alt'})
            if rating_elem:
                rating_text = rating_elem.text
                rating_match = re.search(r'(\d+\.?\d*) out of', rating_text)
                if rating_match:
                    product_info['rating'] = float(rating_match.group(1))
            
            # Review count
            review_elem = soup.find('span', {'id': 'acrCustomerReviewText'})
            if review_elem:
                review_text = review_elem.text
                review_match = re.search(r'(\d+)', review_text.replace(',', ''))
                if review_match:
                    product_info['review_count'] = int(review_match.group(1))
            
            # If we got some data but not everything, fill in the gaps
            if not product_info['title'] or product_info['title'] == 'N/A':
                product_info['title'] = f'Amazon Product (ASIN: {asin})'
            
            if not product_info['image_url']:
                # Use a placeholder that might work
                product_info['image_url'] = f'https://images-na.ssl-images-amazon.com/images/I/{asin}.jpg'
            
            return product_info
            
        except requests.RequestException as e:
            logger.error(f"Error fetching Amazon product: {e}")
            # Try to parse whatever we got
            if 'response' in locals():
                try:
                    soup = BeautifulSoup(response.content, 'lxml')
                    return self._parse_partial_data(soup, url, asin)
                except:
                    pass
            return self._create_basic_product_info(url, asin)
        except Exception as e:
            logger.error(f"Error parsing Amazon product: {e}")
            return self._create_basic_product_info(url, asin)
    
    def _create_basic_product_info(self, url: str, asin: str) -> Dict[str, Any]:
        """Create basic product info when scraping fails"""
        return {
            'asin': asin,
            'url': url,
            'title': f'Amazon Product (ASIN: {asin})',
            'price': None,
            'currency': 'USD',
            'image_url': f'https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN={asin}&Format=_SL250_',
            'description': 'Product details could not be fetched automatically. Please verify the product information on Amazon.',
            'availability': 'Check Amazon for availability',
            'rating': None,
            'review_count': None,
            'scraping_note': 'Limited product details available. Please verify on Amazon.'
        }
    
    def _parse_partial_data(self, soup, url: str, asin: str) -> Dict[str, Any]:
        """Try to extract whatever data we can from a partial response"""
        product_info = self._create_basic_product_info(url, asin)
        
        # Try to get title
        title_elem = soup.find('title')
        if title_elem:
            title_text = title_elem.text.strip()
            if 'Amazon.com' in title_text:
                product_info['title'] = title_text.split(':')[0].strip()
        
        # Try any price selector
        for price_elem in soup.find_all(text=re.compile(r'\$\d+')):
            price_match = re.search(r'\$([\d,]+\.?\d*)', price_elem)
            if price_match:
                product_info['price'] = self.clean_price(price_match.group(0))
                if product_info['price']:
                    break
        
        return product_info
    
    def fetch_product_info_sync(self, url: str) -> Dict[str, Any]:
        """Synchronous version of fetch_product_info for non-async contexts"""
        import asyncio
        
        # Create event loop if needed
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Run async function
        return loop.run_until_complete(self.fetch_product_info(url))