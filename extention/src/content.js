// Content script to extract product data from shopping sites

const API_BASE_URL = 'http://localhost:5001/api';

// Detect which site we're on
function detectSite() {
  const hostname = window.location.hostname;
  if (hostname.includes('amazon')) return 'amazon';
  if (hostname.includes('flipkart')) return 'flipkart';
  if (hostname.includes('myntra')) return 'myntra';
  return null;
}

// Extract product data based on site
function extractProductData(site) {
  const products = [];
  
  try {
    switch(site) {
      case 'amazon':
        products.push(...extractAmazonProducts());
        break;
      case 'flipkart':
        products.push(...extractFlipkartProducts());
        break;
      case 'myntra':
        products.push(...extractMyntraProducts());
        break;
    }
  } catch (error) {
    console.error('Error extracting product data:', error);
  }
  
  return products;
}

function extractAmazonProducts() {
  const products = [];
  const items = document.querySelectorAll('[data-component-type="s-search-result"]');
  
  items.forEach(item => {
    try {
      const title = item.querySelector('h2 a span')?.textContent?.trim();
      const price = item.querySelector('.a-price-whole')?.textContent?.trim();
      const image = item.querySelector('img.s-image')?.src;
      const link = item.querySelector('h2 a')?.href;
      const rating = item.querySelector('.a-icon-star-small span')?.textContent?.trim();
      
      if (title && link) {
        products.push({
          title,
          price: price ? `₹${price}` : 'N/A',
          image,
          url: link,
          rating: rating || 'N/A',
          site: 'Amazon',
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Error parsing Amazon product:', e);
    }
  });
  
  return products;
}

function extractFlipkartProducts() {
  const products = [];
  const items = document.querySelectorAll('[data-id]');
  
  items.forEach(item => {
    try {
      const title = item.querySelector('a[title], .s1Q9rs')?.textContent?.trim();
      const price = item.querySelector('._30jeq3, ._1_WHN1')?.textContent?.trim();
      const image = item.querySelector('img')?.src;
      const link = item.querySelector('a')?.href;
      const rating = item.querySelector('.XQDdHH')?.textContent?.trim();
      
      if (title && link) {
        products.push({
          title,
          price: price || 'N/A',
          image,
          url: link.startsWith('http') ? link : `https://www.flipkart.com${link}`,
          rating: rating || 'N/A',
          site: 'Flipkart',
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Error parsing Flipkart product:', e);
    }
  });
  
  return products;
}

function extractMyntraProducts() {
  const products = [];
  const items = document.querySelectorAll('.product-base');
  
  items.forEach(item => {
    try {
      const title = item.querySelector('.product-product')?.textContent?.trim();
      const brand = item.querySelector('.product-brand')?.textContent?.trim();
      const price = item.querySelector('.product-discountedPrice')?.textContent?.trim();
      const image = item.querySelector('img')?.src;
      const link = item.querySelector('a')?.href;
      const rating = item.querySelector('.product-rating')?.textContent?.trim();
      
      if (title && link) {
        products.push({
          title: `${brand} - ${title}`,
          price: price || 'N/A',
          image,
          url: link.startsWith('http') ? link : `https://www.myntra.com${link}`,
          rating: rating || 'N/A',
          site: 'Myntra',
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Error parsing Myntra product:', e);
    }
  });
  
  return products;
}

// Send data to backend
async function sendToBackend(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    console.log('Data sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending data to backend:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const site = detectSite();
  
  if (!site) {
    console.log('Not on a supported shopping site');
    return;
  }
  
  console.log(`Detected site: ${site}`);
  
  // Wait for page to load completely
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', extractAndSend);
  } else {
    extractAndSend();
  }
}

async function extractAndSend() {
  console.log('called extractAndSend');
  const site = detectSite();
  const products = extractProductData(site);
  
  if (products.length > 0) {
    console.log(`Found ${products.length} products`);
    
    // Get search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('k') || urlParams.get('q') || urlParams.get('query') || 'unknown';
    
    const data = {
      searchQuery,
      site,
      products,
      url: window.location.href,
      scrapedAt: new Date().toISOString()
    };
    
    try {
      await sendToBackend(data);
      
      // Notify background script
      chrome.runtime.sendMessage({
        type: 'PRODUCTS_SCRAPED',
        count: products.length,
        site
      });
    } catch (error) {
      console.error('Failed to send data:', error);
    }
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('called addListener', request);
  if (request.action === 'SCRAPE_NOW') {
    console.log('called SCRAPE_NOW Listner');
    extractAndSend().then(() => {
      sendResponse({ success: true });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open
  }
});

// Initialize
main();