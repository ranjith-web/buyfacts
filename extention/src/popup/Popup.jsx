import React, { useState, useEffect } from 'react';
import './Popup.css';

const API_BASE_URL = 'http://localhost:5001/api';

function Popup() {
  const [stats, setStats] = useState({
    totalScraped: 0,
    lastScrape: null,
    isEnabled: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load from local storage first (for lastScrape and isEnabled)
      const localResult = await chrome.storage.local.get(['lastScrape', 'isEnabled']);
      
      // Fetch actual count from backend API
      let totalScraped = 0;
      try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (response.ok) {
          const data = await response.json();
          totalScraped = data.totalProducts || 0;
        }
      } catch (error) {
        console.error('Error fetching stats from backend:', error);
        // Fallback to local storage if backend is unavailable
        const localStats = await chrome.storage.local.get(['totalScraped']);
        totalScraped = localStats.totalScraped || 0;
      }
      
      setStats({
        totalScraped,
        lastScrape: localResult.lastScrape || null,
        isEnabled: localResult.isEnabled !== false
      });
      
      // Sync local storage with backend count
      await chrome.storage.local.set({ totalScraped });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleScrapeNow = async () => {
    debugger;
    setLoading(true);
    setMessage('');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('tab', tab);
      
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'SCRAPE_NOW' });
      console.log('response', response);
      
      if (response.success) {
        setMessage('✓ Products scraped successfully!');
        // Reload stats from backend after scraping
        setTimeout(() => loadStats(), 1000);
      } else {
        setMessage('✗ Failed to scrape: ' + response.error);
      }
    } catch (error) {
      setMessage('✗ Error: Make sure you\'re on a shopping site');
      console.error('Scrape error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExtension = async () => {
    const newState = !stats.isEnabled;
    await chrome.storage.local.set({ isEnabled: newState });
    setStats({ ...stats, isEnabled: newState });
    setMessage(newState ? '✓ Extension enabled' : '○ Extension disabled');
  };

  const clearData = async () => {
    if (window.confirm('Clear all statistics? This will clear both extension stats and backend data.')) {
      try {
        // Clear local storage
        await chrome.storage.local.set({ totalScraped: 0, lastScrape: null });
        
        // Clear backend data (optional - uncomment if you want to clear backend too)
        // try {
        //   await fetch(`${API_BASE_URL}/products?confirm=yes`, { method: 'DELETE' });
        // } catch (error) {
        //   console.error('Error clearing backend data:', error);
        // }
        
        // Reload stats from backend
        await loadStats();
        setMessage('✓ Statistics cleared');
      } catch (error) {
        console.error('Error clearing data:', error);
        setMessage('✗ Error clearing statistics');
      }
    }
  };

  const openDashboard = () => {
    window.open('http://localhost:3000/dashboard', '_blank');
  };

  return (
    <div className="popup-container">
      <div className="header">
        <h1>🛍️ Product Tracker</h1>
        <p className="subtitle">Amazon • Flipkart • Myntra</p>
      </div>

      <div className="stats-card">
        <div className="stat-item">
          <span className="stat-label">Total Products Tracked</span>
          <span className="stat-value">{stats.totalScraped}</span>
        </div>

        {stats.lastScrape && (
          <div className="last-scrape">
            <p><strong>Last Scrape:</strong></p>
            <p>{stats.lastScrape.count} products from {stats.lastScrape.site}</p>
            <p className="timestamp">
              {new Date(stats.lastScrape.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="actions">
        <button 
          className="btn btn-primary" 
          onClick={handleScrapeNow}
          disabled={loading || !stats.isEnabled}
        >
          {loading ? '⏳ Scraping...' : '🔍 Scrape Current Page'}
        </button>

        <button 
          className={`btn ${stats.isEnabled ? 'btn-warning' : 'btn-success'}`}
          onClick={toggleExtension}
        >
          {stats.isEnabled ? '⏸ Disable' : '▶ Enable'}
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={openDashboard}
        >
          📊 View Dashboard
        </button>

        <button 
          className="btn btn-danger" 
          onClick={clearData}
        >
          🗑️ Clear Stats
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('✓') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="footer">
        <p>Auto-tracking enabled on supported sites</p>
      </div>
    </div>
  );
}

export default Popup;