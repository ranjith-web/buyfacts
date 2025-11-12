# Shopping Product Tracker - Production Ready

A Chrome extension that tracks products from Amazon, Flipkart, and Myntra with MongoDB storage and Redis caching.

## 📦 Quick Setup (No Docker Required)

### Prerequisites
- Node.js v16+ 
- MongoDB (local or MongoDB Atlas free tier)
- Redis (optional - local or Redis Cloud free tier)

### Installation Steps

#### 1. Install MongoDB Locally (Choose One)

**Windows:**
```bash
# Download from https://www.mongodb.com/try/download/community
# Install and MongoDB will run automatically
```

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**OR Use MongoDB Atlas (Free Cloud):**
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create free cluster
3. Get connection string
4. Use in `.env` file

#### 2. Install Redis Locally (Optional)

**Windows:**
```bash
# Download from https://github.com/microsoftarchive/redis/releases
# Or use Redis Cloud free tier
```

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

**OR Use Redis Cloud (Free):**
1. Go to https://redis.com/try-free/
2. Create free database
3. Get connection details

#### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URLs
npm start
```

#### 4. Build Extension

```bash
cd extension
npm install
npm run build
```

#### 5. Load in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/build` folder

## 📁 Project Structure

```
product-tracker/
├── extension/
│   ├── public/
│   │   ├── manifest.json
│   │   ├── icons/
│   │   └── popup.html
│   ├── src/
│   │   ├── content.js
│   │   ├── background.js
│   │   └── popup/
│   │       ├── Popup.jsx
│   │       ├── Popup.css
│   │       └── index.js
│   ├── package.json
│   └── webpack.config.js
│
├── backend/
│   ├── server.js
│   ├── models/
│   │   └── Product.js
│   ├── routes/
│   │   └── products.js
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## 🔧 Configuration

Create `backend/.env`:

```env
# MongoDB (choose one)
MONGODB_URI=mongodb://localhost:27017/product_tracker
# OR
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/product_tracker

# Redis (optional - remove if not using)
REDIS_URL=redis://localhost:6379
# OR
REDIS_URL=redis://username:password@redis-host:6379

# Server
PORT=5001
NODE_ENV=production

# Features
USE_REDIS=false  # Set to true if using Redis
```

## 🚀 Production Deployment

### Deploy Backend (Free Options)

**1. Render.com (Recommended - Free)**
```bash
# Push code to GitHub
# Connect to Render
# Add environment variables
# Deploy automatically
```

**2. Railway.app (Free)**
```bash
# Connect GitHub repo
# Add env vars
# Deploy
```

**3. Heroku (Free tier removed, but still popular)**

### Publish Extension

1. Create production build:
```bash
cd extension
npm run build
```

2. Zip the build folder:
```bash
zip -r extension.zip build/
```

3. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devcenter)
4. Pay $5 one-time fee
5. Upload extension.zip
6. Fill details and publish

## 📊 Features Included

✅ Automatic product scraping
✅ MongoDB storage with indexing
✅ Redis caching (optional)
✅ Price history tracking
✅ Search history
✅ Statistics dashboard
✅ Manual scrape option
✅ Error handling
✅ Rate limiting

## 🔒 Security Notes

- Never commit `.env` files
- Use environment variables
- Enable CORS properly
- Add rate limiting in production
- Sanitize user inputs
- Use HTTPS in production

## 📈 Performance

- MongoDB indexes for fast queries
- Redis caching (if enabled) - 70% faster
- Bulk operations for efficiency
- Pagination for large datasets

## 🐛 Troubleshooting

**Extension not tracking:**
- Check console errors (F12)
- Verify backend is running
- Check network tab for API calls

**MongoDB connection failed:**
- Check if MongoDB is running
- Verify connection string
- Check firewall settings

**Redis connection failed:**
- Set `USE_REDIS=false` in .env
- App will work without Redis (slower)

## 💰 Cost Breakdown

### Free Tier Options:
- **MongoDB Atlas**: 512MB free forever
- **Redis Cloud**: 30MB free forever
- **Render.com**: Free tier available
- **Vercel**: Free for personal projects

### Paid (If scaling):
- **MongoDB Atlas**: $9/month (M2 cluster)
- **Redis Cloud**: $5/month (100MB)
- **Render.com**: $7/month

## 🎯 What's Removed (Kafka)

Kafka was removed because:
- Overkill for this use case
- Expensive to run ($50+/month)
- Complex setup
- Not needed for product tracking

## 📝 License

MIT License

---

**Support**: Open GitHub issues for help

# 1. Open Chrome
# 2. Go to: chrome://extensions/
# 3. Enable "Developer mode" (top-right toggle)
# 4. Click "Load unpacked"
# 5. Select: /Users/ranjithr/Desktop/Projects/price-track-ext/extention/build