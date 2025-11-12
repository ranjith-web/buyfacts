// Background service worker

let scrapedCount = 0;

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    const hostname = url.hostname;
    
    // Check if it's a shopping site with search results
    const isShoppingSite = hostname.includes('amazon') || 
                          hostname.includes('flipkart') || 
                          hostname.includes('myntra');
    
    if (isShoppingSite) {
      console.log('Shopping site detected:', hostname);
      
      // Badge to show extension is active
      chrome.action.setBadgeText({ text: '●', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
    }
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PRODUCTS_SCRAPED') {
    scrapedCount += request.count;
    
    // Update badge
    if (sender.tab?.id) {
      chrome.action.setBadgeText({ 
        text: request.count.toString(), 
        tabId: sender.tab.id 
      });
    }
    
    // Store in local storage for popup
    chrome.storage.local.set({
      lastScrape: {
        count: request.count,
        site: request.site,
        timestamp: new Date().toISOString()
      },
      totalScraped: scrapedCount
    });
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Products Tracked',
      message: `${request.count} products from ${request.site} saved successfully!`
    });
    
    sendResponse({ success: true });
  }
});

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log('Shopping Product Tracker extension installed');
  
  chrome.storage.local.set({
    totalScraped: 0,
    isEnabled: true
  });
});