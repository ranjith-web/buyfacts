# Production Deployment Guide

## 🌐 Deploy Backend to Cloud (Free Options)

### Option 1: Render.com (Recommended - Easy & Free)

1. **Prepare your code:**
```bash
cd backend
# Make sure package.json has start script
```

2. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

3. **Deploy on Render:**
- Go to https://render.com and sign up
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Configure:
  - **Name:** product-tracker-api
  - **Environment:** Node
  - **Build Command:** `npm install`
  - **Start Command:** `npm start`
  - **Instance Type:** Free

4. **Add Environment Variables:**
- Click "Environment" tab
- Add these variables:
  ```
  MONGODB_URI=<your-mongodb-atlas-url>
  USE_REDIS=false
  PORT=5001
  NODE_ENV=production
  ```

5. **Deploy:**
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Copy your API URL (e.g., `https://product-tracker-api.onrender.com`)

6. **Update Extension:**
- Edit `extension/src/content.js`
- Change `API_BASE_URL` to your Render URL
- Rebuild extension: `npm run build`

**Free Tier Limits:**
- 750 hours/month
- Sleeps after 15 min inactivity
- Wakes up on first request (15-30 seconds)

---

### Option 2: Railway.app (Fast Deploy)

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login and Deploy:**
```bash
cd backend
railway login
railway init
railway up
```

3. **Add Environment Variables:**
```bash
railway variables set MONGODB_URI="<your-url>"
railway variables set USE_REDIS=false
railway variables set NODE_ENV=production
```

4. **Get URL:**
```bash
railway domain
# Copy the generated URL
```

**Free Tier:**
- $5 credit/month
- Good for hobby projects

---

### Option 3: Vercel (Serverless)

**Note:** Vercel works best with serverless functions. You'll need to modify the structure slightly.

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy:**
```bash
cd backend
vercel
```

3. **Follow prompts** and add environment variables via dashboard

---

### Option 4: Heroku (Still Popular)

**Note:** Free tier removed, but Eco plan is $5/month

1. **Install Heroku CLI:**
```bash
# Download from https://devcli.heroku.com/install
```

2. **Login and Create App:**
```bash
cd backend
heroku login
heroku create product-tracker-api
```

3. **Set Environment Variables:**
```bash
heroku config:set MONGODB_URI="<your-url>"
heroku config:set USE_REDIS=false
heroku config:set NODE_ENV=production
```

4. **Deploy:**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

---

## 🗄️ Database Setup (Free Cloud Options)

### MongoDB Atlas (Recommended - Free Forever)

1. **Create Account:**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up with Google/Email

2. **Create Cluster:**
   - Choose "Shared" (Free M0)
   - Select region closest to you
   - Cluster Name: "product-tracker"

3. **Setup Access:**
   - Click "Database Access"
   - Add new user with password
   - Note down username and password

4. **Network Access:**
   - Click "Network Access"
   - Add IP: `0.0.0.0/0` (allow all - for development)
   - For production, add your Render/Railway IP

5. **Get Connection String:**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your actual password
   - Example: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/product_tracker`

**Free Tier:**
- 512 MB storage (good for ~50,000 products)
- Shared RAM
- No credit card required

---

### Redis Cloud (Optional - For Better Performance)

1. **Create Account:**
   - Go to https://redis.com/try-free/
   - Sign up

2. **Create Database:**
   - Choose "Fixed" plan (Free)
   - Select region
   - Database name: "product-cache"

3. **Get Connection URL:**
   - Click on your database
   - Copy "Public endpoint"
   - Format: `redis://default:password@endpoint:port`

4. **Update Backend:**
   - Set `USE_REDIS=true` in environment
   - Add `REDIS_URL=<your-redis-url>`

**Free Tier:**
- 30 MB storage
- No credit card required

---

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# NEVER commit these to Git!
.env
.env.local
.env.production
```

### 2. Add .gitignore
```gitignore
# Backend
node_modules/
.env
.env.local
.env.production
npm-debug.log
.DS_Store

# Extension
build/
dist/
*.zip
```

### 3. Enable CORS Properly
In production, update `server.js`:
```javascript
app.use(cors({
  origin: 'chrome-extension://*',  // Only allow extensions
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));
```

### 4. Add Rate Limiting
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 5. Add Helmet for Security Headers
```bash
npm install helmet
```

```javascript
const helmet = require('helmet');
app.use(helmet());
```

---

## 📦 Chrome Web Store Publication

### 1. Prepare Extension

```bash
cd extension
npm run build

# Create production zip
cd build
zip -r ../product-tracker-v1.0.zip .
```

### 2. Create Developer Account

- Go to https://chrome.google.com/webstore/devcenter
- Pay $5 one-time registration fee
- Fill in account details

### 3. Upload Extension

1. Click "New Item"
2. Upload `product-tracker-v1.0.zip`
3. Fill in details:

**Required Information:**
- **Name:** Shopping Product Tracker
- **Summary:** Track products from Amazon, Flipkart & Myntra
- **Description:** (Write detailed description)
- **Category:** Productivity
- **Language:** English
- **Icon:** 128x128 PNG (create using Canva)
- **Screenshots:** 1280x800 or 640x400 (5 images)
- **Promotional Images:** 440x280

**Privacy:**
- Privacy Policy URL (required) - create one
- Permissions justification
- Host permissions explanation

4. **Review Information:**
- Test thoroughly before submitting
- Review all permissions
- Check all links work

5. **Submit for Review:**
- Review takes 1-7 days
- Check email for updates
- May need to answer questions

### 4. Privacy Policy (Required)

Create a simple privacy policy:

```markdown
# Privacy Policy for Shopping Product Tracker

## Data Collection
- We collect product information (title, price, images) from shopping sites you visit
- All data is stored in your personal MongoDB database
- We do NOT collect personal information
- We do NOT sell data to third parties

## Data Storage
- Data is stored in MongoDB database specified by you
- You have full control over your data
- You can delete data anytime

## Third-Party Services
- MongoDB Atlas (database hosting)
- Your chosen backend hosting service

## Contact
- Email: your-email@example.com

Last Updated: [Date]
```

Host this on:
- GitHub Pages (free)
- Netlify (free)
- Your own website

---

## 🚀 Update Extension Config for Production

### Update API URL

**Option 1: Hardcode (Simple)**
```javascript
// extension/src/content.js
const API_BASE_URL = 'https://your-render-app.onrender.com/api';
```

**Option 2: Make it Configurable (Better)**
```javascript
// extension/src/popup/Popup.jsx
// Add settings to save API URL
const [apiUrl, setApiUrl] = useState('');

useEffect(() => {
  chrome.storage.sync.get(['apiUrl'], (result) => {
    setApiUrl(result.apiUrl || 'http://localhost:5001/api');
  });
}, []);

// Save button
const saveSettings = () => {
  chrome.storage.sync.set({ apiUrl });
};
```

---

## 📊 Monitor Your Production App

### 1. Backend Monitoring

**Free Tools:**
- **UptimeRobot:** https://uptimerobot.com (Free tier: 50 monitors)
- **Cronitor:** https://cronitor.io (Free tier available)

### 2. Error Tracking

**Sentry (Free Tier):**
```bash
npm install @sentry/node
```

```javascript
// Add to server.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

### 3. Logs

**Render:** Check "Logs" tab in dashboard
**Railway:** Use `railway logs`
**Heroku:** Use `heroku logs --tail`

---

## 💰 Cost Estimate

### Free Tier (Perfect for Starting)
- **MongoDB Atlas:** Free (512 MB)
- **Redis Cloud:** Free (30 MB) - Optional
- **Render/Railway:** Free tier
- **Chrome Store:** $5 one-time
- **Total:** $5 one-time fee

### Light Usage (~1000 products, 100 users)
- **MongoDB Atlas:** Free
- **Redis Cloud:** Free
- **Render:** Free (with cold starts)
- **Total:** $0/month

### Medium Usage (~10,000 products, 1000 users)
- **MongoDB Atlas:** $9/month (M2 cluster)
- **Redis Cloud:** $5/month
- **Render/Railway:** $7/month
- **Total:** ~$21/month

---

## ✅ Pre-Launch Checklist

- [ ] Backend deployed and accessible
- [ ] MongoDB Atlas setup and tested
- [ ] Redis configured (optional)
- [ ] Extension rebuilt with production API URL
- [ ] All features tested on production
- [ ] Privacy policy created and hosted
- [ ] Chrome Web Store listing prepared
- [ ] Screenshots and icons ready
- [ ] Error handling tested
- [ ] Rate limiting enabled
- [ ] Security headers added
- [ ] .env files NOT in git
- [ ] README updated with production URLs

---

## 🐛 Troubleshooting Production Issues

### Extension not connecting to API
- Check API URL is correct (https://, not http://)
- Verify CORS is enabled on backend
- Check Chrome console for errors
- Test API endpoint manually

### Backend crashes/restarts
- Check logs on hosting platform
- Verify MongoDB connection string
- Check memory usage
- Add error handling for all routes

### Slow performance
- Enable Redis caching
- Add database indexes
- Optimize MongoDB queries
- Use CDN for static assets

---

## 🎉 You're Ready for Production!

Your product tracker is now:
✅ Deployed to cloud
✅ Using free/cheap services
✅ Secure and monitored
✅ Ready for users

**Next Steps:**
1. Share with friends for beta testing
2. Collect feedback
3. Iterate and improve
4. Submit to Chrome Web Store
5. Market your extension!

---

**Questions?** Check logs, documentation, or create an issue on GitHub!