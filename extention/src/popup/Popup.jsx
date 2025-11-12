import React, { useState, useEffect } from 'react';
import './Popup.css';

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
      const result = await chrome.storage.local.get(['totalScraped', 'lastScrape', 'isEnabled']);
      setStats({
        totalScraped: result.totalScraped || 0,
        lastScrape: result.lastScrape || null,
        isEnabled: result.isEnabled !== false
      });
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
    if (window.confirm('Clear all statistics?')) {
      await chrome.storage.local.set({ totalScraped: 0, lastScrape: null });
      setStats({ ...stats, totalScraped: 0, lastScrape: null });
      setMessage('✓ Statistics cleared');
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