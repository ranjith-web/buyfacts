# Installation Guide - Product Tracker

## 📋 Prerequisites

Before starting, make sure you have:
- Node.js (v16 or higher) - [Download here](https://nodejs.org/)
- Chrome Browser
- Code editor (VS Code recommended)

## 🚀 Step-by-Step Installation

### Part 1: Setup MongoDB

#### Option A: Local MongoDB (Recommended for Development)

**Windows:**
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer (choose "Complete" setup)
3. MongoDB will start automatically as a Windows service
4. Test: Open Command Prompt and type `mongosh` - you should connect successfully

**Mac:**
```bash
# Install MongoDB using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Test connection
mongosh
```

**Linux (Ubuntu/Debian):**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Test connection
mongosh
```

#### Option B: MongoDB Atlas (Free Cloud Database)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like: `mongodb+srv://...`)
6. Replace `<password>` with your database password
7. Use this connection string in your `.env` file

### Part 2: Setup Redis (Optional - Improves Performance)

#### Option A: Local Redis

**Windows:**
- Download from https://github.com/microsoftarchive/redis/releases
- Run the installer
- Redis will start automatically

**Mac:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

#### Option B: Redis Cloud (Free Tier)
1. Go to https://redis.com/try-free/
2. Create free account
3. Create a database
4. Copy the connection URL
5. Use in `.env` file

**Note:** Redis is optional. The app works without it, just slower.

### Part 3: Setup Backend

```bash
# 1. Navigate to backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Edit .env file with your database URLs
# Use any text editor
notepad .env   # Windows
nano .env      # Mac/Linux
code .env      # VS Code

# 5. Start the backend server
npm start

# You should see:
# ✓ Connected to MongoDB
# 🚀 Server running on port 5001
```

**Important:** Keep this terminal window open while using the extension!

### Part 4: Build Chrome Extension

```bash
# 1. Open a NEW terminal window
# Navigate to extension folder
cd extension

# 2. Install dependencies
npm install

# 3. Build the extension
npm run build

# This creates a 'build' folder with the extension files
```

### Part 5: Load Extension in Chrome

1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Navigate to your project folder
6. Select the `extension/build` folder
7. Click "Select Folder"

✅ The extension icon should now appear in your Chrome toolbar!

## 🧪 Testing the Extension

1. Make sure backend server is running (from Part 3)
2. Visit any of these sites:
   - Amazon India: https://www.amazon.in
   - Flipkart: https://www.flipkart.com
   - Myntra: https://www.myntra.com

3. Search for any product (e.g., "laptop", "shoes", "phone")
4. Wait for search results to load
5. Click the extension icon
6. You should see:
   - Product count in the stats
   - "Last Scrape" information
   - Total products tracked

7. Test manual scraping:
   - Click "🔍 Scrape Current Page"
   - Should show success message
   - Product count should increase

## 🔍 Verify Everything is Working

### Check Backend
```bash
# Test health endpoint
curl http://localhost:5001/api/health

# Should return:
# {"status":"healthy","mongodb":"connected",...}
```

### Check Database
```bash
# Open MongoDB shell
mongosh

# Use the database
use product_tracker

# Count products
db.products.countDocuments()

# View recent products
db.products.find().limit(5).pretty()
```

### Check Extension
1. Open browser console (F12)
2. Go to a shopping site
3. Look for messages like:
   - "Detected site: amazon"
   - "Found X products"
   - "Data sent successfully"

## 🐛 Common Issues & Solutions

### Issue: "MongoDB connection error"
**Solution:**
- Check if MongoDB is running
- Windows: Open Services → Find "MongoDB Server" → Start
- Mac/Linux: `brew services start mongodb-community` or `sudo systemctl start mongod`
- Check MONGODB_URI in `.env` file

### Issue: "Redis connection failed"
**Solution:**
- Set `USE_REDIS=false` in `.env` file
- App will work without Redis (just slower)

### Issue: "Extension not scraping products"
**Solution:**
- Check if backend is running (`http://localhost:5001/api/health`)
- Open browser console (F12) and check for errors
- Make sure you're on a product search page
- Try clicking "Scrape Current Page" manually

### Issue: "Cannot find module 'express'"
**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Webpack build failed"
**Solution:**
```bash
cd extension
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: "Port 5001 already in use"
**Solution:**
- Change PORT in `.env` file to 5001 or any free port
- Update API_BASE_URL in `extension/src/content.js`

## 📁 Project Structure After Setup

```
product-tracker/
├── backend/
│   ├── node_modules/
│   ├── server.js
│   ├── package.json
│   ├── .env              ← Your database credentials
│   └── .env.example
│
└── extension/
    ├── node_modules/
    ├── build/            ← Load this in Chrome
    │   ├── manifest.json
    │   ├── popup.html
    │   ├── popup.js
    │   ├── content.js
    │   ├── background.js
    │   └── icons/
    ├── public/
    ├── src/
    ├── package.json
    └── webpack.config.js
```

## ✅ Checklist

- [ ] Node.js installed
- [ ] MongoDB installed/setup
- [ ] Redis installed/setup (optional)
- [ ] Backend dependencies installed (`npm install`)
- [ ] Backend `.env` file created and configured
- [ ] Backend server running (port 5001)
- [ ] Extension dependencies installed
- [ ] Extension built successfully
- [ ] Extension loaded in Chrome
- [ ] Tested on a shopping site
- [ ] Products appearing in database

## 🎉 Next Steps

Once everything is working:

1. **Test thoroughly** on all three sites
2. **Check MongoDB** to see stored products
3. **View statistics** in the extension popup
4. **Try different searches** to collect more data
5. **Monitor backend logs** for any errors

## 🆘 Need Help?

If you're still stuck:
1. Check all error messages carefully
2. Make sure all services are running
3. Verify `.env` configuration
4. Check firewall/antivirus settings
5. Try restarting everything

## 📚 Useful Commands

```bash
# Backend
cd backend
npm start           # Start server
npm run dev         # Start with auto-reload

# Extension
cd extension
npm run build       # Production build
npm run dev         # Development build with watch mode

# MongoDB
mongosh                              # Connect to MongoDB
use product_tracker                  # Switch to database
db.products.countDocuments()         # Count products
db.products.find().pretty()          # View products

# Redis (if using)
redis-cli           # Connect to Redis
KEYS *             # List all keys
GET key_name       # Get value
```

---

**Congratulations!** 🎉 Your product tracker is now ready to use!