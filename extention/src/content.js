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

// Check if we're on a product detail page
function isProductDetailPage(site) {
  const url = window.location.href;
  const pathname = window.location.pathname;

  switch (site) {
    case 'amazon':
      // Amazon product pages have /dp/ or /gp/product/ in URL
      return /\/dp\/|\/gp\/product\//.test(pathname);
    case 'flipkart':
      // Flipkart product pages have /p/ in URL
      return /\/p\//.test(pathname);
    case 'myntra':
      // Myntra product pages have /p/ in URL
      return /\/p\//.test(pathname);
    default:
      return false;
  }
}

// Extract product data based on site
function extractProductData(site) {
  const products = [];

  try {
    // Check if we're on a product detail page
    if (isProductDetailPage(site)) {
      console.log('Detected product detail page');
      const product = extractSingleProduct(site);
      if (product) {
        products.push(product);
      }
    } else {
      // Extract from search results
      console.log('Detected search results page');
      switch (site) {
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
    }
  } catch (error) {
    console.error('Error extracting product data:', error);
  }

  return products;
}

// Extract single product from detail page
function extractSingleProduct(site) {
  try {
    switch (site) {
      case 'amazon':
        return extractAmazonSingleProduct();
      case 'flipkart':
        return extractFlipkartSingleProduct();
      case 'myntra':
        return extractMyntraSingleProduct();
      default:
        return null;
    }
  } catch (error) {
    console.error('Error extracting single product:', error);
    return null;
  }
}

// Extract single Amazon product from detail page
function extractAmazonSingleProduct() {
  try {
    // Try multiple selectors for title (Amazon has different layouts)
    const titleElement = document.querySelector('#productTitle') ||
      document.querySelector('h1.a-size-large') ||
      document.querySelector('h1 span#productTitle');
    const title = titleElement?.textContent?.trim();

    // Try multiple selectors for price
    const priceElement = document.querySelector('.a-price-whole') ||
      document.querySelector('#priceblock_ourprice') ||
      document.querySelector('#priceblock_dealprice') ||
      document.querySelector('.a-price .a-offscreen') ||
      document.querySelector('.a-price-whole');
    const price = priceElement?.textContent?.trim();

    // Try multiple selectors for image
    const imageElement = document.querySelector('#landingImage') ||
      document.querySelector('#imgBlkFront') ||
      document.querySelector('#main-image') ||
      document.querySelector('img[data-a-image-name="landingImage"]');
    const image = imageElement?.src || imageElement?.getAttribute('data-old-hires');

    // Get rating
    const ratingElement = document.querySelector('#acrPopover .a-icon-alt') ||
      document.querySelector('.a-icon-star .a-icon-alt') ||
      document.querySelector('[data-hook="rating-out-of-text"]');
    const rating = ratingElement?.textContent?.trim() || 'N/A';

    const url = window.location.href;

    if (title) {
      return {
        title,
        price: price ? (price.includes('₹') ? price : `₹${price}`) : 'N/A',
        image: image || 'N/A',
        url: url,
        rating: rating,
        site: 'Amazon',
        timestamp: new Date().toISOString()
      };
    }
  } catch (e) {
    console.error('Error parsing Amazon single product:', e);
  }

  return null;
}

// Extract single Flipkart product from detail page
function extractFlipkartSingleProduct() {
  try {
    const title = document.querySelector('h1 span.B_NuCI')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim();

    const price = document.querySelector('._30jeq3._16Jk6d')?.textContent?.trim() ||
      document.querySelector('._30jeq3')?.textContent?.trim();

    const image = document.querySelector('._396cs4._2amPTt._3qGmMb')?.src ||
      document.querySelector('._2r_T1I._396QI4')?.src ||
      document.querySelector('img[style*="object-fit"]')?.src;

    const rating = document.querySelector('._3LWZlK')?.textContent?.trim() || 'N/A';

    const url = window.location.href;

    if (title) {
      return {
        title,
        price: price || 'N/A',
        image: image || 'N/A',
        url: url,
        rating: rating,
        site: 'Flipkart',
        timestamp: new Date().toISOString()
      };
    }
  } catch (e) {
    console.error('Error parsing Flipkart single product:', e);
  }

  return null;
}

// Extract single Myntra product from detail page
function extractMyntraSingleProduct() {
  try {
    const title = document.querySelector('h1.pdp-name')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim();

    const brand = document.querySelector('.pdp-product-brand')?.textContent?.trim() ||
      document.querySelector('.pdp-brand')?.textContent?.trim();

    const price = document.querySelector('.pdp-price')?.textContent?.trim() ||
      document.querySelector('.pdp-product-price')?.textContent?.trim();

    const image = document.querySelector('.image-grid-image')?.src ||
      document.querySelector('.pdp-product-images img')?.src;

    const rating = document.querySelector('.index-overallRating')?.textContent?.trim() || 'N/A';

    const url = window.location.href;

    if (title) {
      return {
        title: brand ? `${brand} - ${title}` : title,
        price: price || 'N/A',
        image: image || 'N/A',
        url: url,
        rating: rating,
        site: 'Myntra',
        timestamp: new Date().toISOString()
      };
    }
  } catch (e) {
    console.error('Error parsing Myntra single product:', e);
  }

  return null;
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

// Wait for element to appear (for dynamic content)
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
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
    document.addEventListener('DOMContentLoaded', () => {
      // Add additional delay for dynamic content
      setTimeout(extractAndSend, 2000);
    });
  } else {
    // Add delay to ensure dynamic content is loaded
    setTimeout(extractAndSend, 2000);
  }
}

async function extractAndSend() {
  console.log('called extractAndSend');
  const site = detectSite();

  if (!site) {
    console.log('Site not detected in extractAndSend');
    return;
  }

  // For product detail pages, wait a bit more for content to load
  if (isProductDetailPage(site)) {
    console.log('Waiting for product detail page to fully load...');
    // Wait for key elements to appear
    if (site === 'amazon') {
      await waitForElement('#productTitle, h1 span#productTitle', 3000);
    } else if (site === 'flipkart') {
      await waitForElement('h1 span.B_NuCI, h1', 3000);
    } else if (site === 'myntra') {
      await waitForElement('h1.pdp-name, h1', 3000);
    }
    // Additional delay for price and other elements
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const products = extractProductData(site);

  if (products.length > 0) {
    console.log(`Found ${products.length} products`);

    // Get search query from URL or use product title for detail pages
    const urlParams = new URLSearchParams(window.location.search);
    let searchQuery = urlParams.get('k') || urlParams.get('q') || urlParams.get('query');

    // For product detail pages, use product title as search query
    if (!searchQuery && isProductDetailPage(site) && products.length > 0) {
      searchQuery = products[0].title.substring(0, 50); // Use first 50 chars of title
    }

    searchQuery = searchQuery || 'product-detail-page';

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

      console.log('Successfully scraped and sent data');
    } catch (error) {
      console.error('Failed to send data:', error);
    }
  } else {
    console.log('No products found. Page might still be loading or selectors need updating.');
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