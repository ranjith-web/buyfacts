const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const redis = require('redis');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Redis Setup (Optional)
let redisClient = null;
const REDIS_URL = `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB}`;
redisClient = redis.createClient({
  url: REDIS_URL
});

redisClient.on('error', (err) => {
  console.error('Redis Error:', err);
  console.log('⚠️  Running without Redis cache');
  redisClient = null;
});

redisClient.on('connect', () => console.log('✓ Connected to Redis'));

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Redis connection failed:', err);
    redisClient = null;
  }
})();


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/product_tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.error('Make sure MongoDB is running!');
    process.exit(1);
  });

// Product Schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: String,
  originalPrice: String,
  discount: String,
  image: String,
  url: { type: String, required: true },
  rating: String,
  reviews: String,
  site: { type: String, enum: ['Amazon', 'Flipkart', 'Myntra'], required: true },
  searchQuery: String,
  category: String,
  brand: String,
  availability: { type: Boolean, default: true },
  scrapedAt: { type: Date, default: Date.now },
  firstSeenAt: { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  scrapedCount: { type: Number, default: 0 },
  priceHistory: [{
    price: String,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for performance
productSchema.index({ url: 1 }, { unique: true });
productSchema.index({ site: 1, scrapedAt: -1 });
productSchema.index({ searchQuery: 1 });
productSchema.index({ title: 'text', brand: 'text' });

const Product = mongoose.model('Product', productSchema);

// Search Query Schema
const searchQuerySchema = new mongoose.Schema({
  query: { type: String, required: true },
  site: String,
  url: String,
  productCount: Number,
  scrapedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

searchQuerySchema.index({ createdAt: -1 });
const SearchQuery = mongoose.model('SearchQuery', searchQuerySchema);

// Cache Helper Functions
async function getCache(key) {
  if (!redisClient || !redisClient.isOpen) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Cache get error:', err);
    return null;
  }
}

async function setCache(key, data, ttl = 300) {
  if (!redisClient || !redisClient.isOpen) return;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (err) {
    console.error('Cache set error:', err);
  }
}

// Routes

// Health Check
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: (redisClient && redisClient.isOpen) ? 'connected' : 'disabled',
    uptime: process.uptime(),
    version: '1.0.0'
  };
  res.json(health);
});

// Save Products
app.post('/api/products', async (req, res) => {
  try {
    const { searchQuery, site, products, url, scrapedAt } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid products data' });
    }

    console.log(`📦 Received ${products.length} products from ${site}`);

    // Save search query
    const searchQueryDoc = await SearchQuery.create({
      query: searchQuery || 'unknown',
      site,
      url,
      productCount: products.length,
      scrapedAt: scrapedAt || new Date()
    });

    // Process products with bulk operations
    const bulkOps = [];

    for (const product of products) {
      if (!product.url) continue;

      bulkOps.push({
        updateOne: {
          filter: { url: product.url },
          update: {
            $set: {
              title: product.title,
              price: product.price,
              originalPrice: product.originalPrice,
              discount: product.discount,
              image: product.image,
              rating: product.rating,
              reviews: product.reviews,
              site: product.site,
              searchQuery: searchQuery || 'unknown',
              category: product.category,
              brand: product.brand,
              availability: product.availability !== false,
              lastSeenAt: new Date()
            },
            $setOnInsert: {
              firstSeenAt: new Date()
            },
            $inc: {
              scrapedCount: 1
            },
            $push: {
              priceHistory: {
                $each: [{
                  price: product.price,
                  date: new Date()
                }],
                $slice: -100
              }
            }
          },
          upsert: true
        }
      });
    }

    // Execute bulk operations
    let result = { insertedCount: 0, modifiedCount: 0, upsertedCount: 0 };
    if (bulkOps.length > 0) {
      result = await Product.bulkWrite(bulkOps);
    }

    // Clear relevant cache
    if (redisClient && redisClient.isOpen) {
      try {
        await redisClient.del('stats:general');
      } catch (err) {
        console.error('Cache clear error:', err);
      }
    }

    console.log(`✅ Saved ${products.length} products successfully`);

    res.status(201).json({
      success: true,
      message: 'Products saved successfully',
      searchQueryId: searchQueryDoc._id,
      productsCount: products.length,
      inserted: result.upsertedCount || 0,
      updated: result.modifiedCount || 0
    });

  } catch (error) {
    console.error('❌ Error saving products:', error);
    res.status(500).json({
      error: 'Failed to save products',
      details: error.message
    });
  }
});

// Get Products with Pagination
app.get('/api/products', async (req, res) => {
  try {
    const {
      site,
      searchQuery,
      page = 1,
      limit = 20,
      sortBy = 'scrapedAt',
      order = 'desc'
    } = req.query;

    // Try cache first
    const cacheKey = `products:${site || 'all'}:${searchQuery || 'all'}:${page}:${limit}:${sortBy}:${order}`;
    const cached = await getCache(cacheKey);

    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    // Build query
    const query = {};
    if (site) query.site = site;
    if (searchQuery) query.searchQuery = new RegExp(searchQuery, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    const result = {
      success: true,
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };

    // Cache for 5 minutes
    await setCache(cacheKey, result, 300);

    res.json(result);

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get Single Product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Search Products
app.get('/api/products/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      Product.find({
        $text: { $search: searchTerm }
      })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments({
        $text: { $search: searchTerm }
      })
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// Get Statistics
app.get('/api/stats', async (req, res) => {
  try {
    // Try cache first
    const cached = await getCache('stats:general');
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const [
      totalProducts,
      amazonCount,
      flipkartCount,
      myntraCount,
      recentSearches,
      totalSearches,
      priceTracked
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ site: 'Amazon' }),
      Product.countDocuments({ site: 'Flipkart' }),
      Product.countDocuments({ site: 'Myntra' }),
      SearchQuery.find().sort({ createdAt: -1 }).limit(10).lean(),
      SearchQuery.countDocuments(),
      Product.countDocuments({ 'priceHistory.1': { $exists: true } })
    ]);

    const stats = {
      success: true,
      totalProducts,
      bySite: {
        Amazon: amazonCount,
        Flipkart: flipkartCount,
        Myntra: myntraCount
      },
      recentSearches,
      totalSearches,
      productsWithPriceHistory: priceTracked,
      lastUpdated: new Date().toISOString()
    };

    // Cache for 2 minutes
    await setCache('stats:general', stats, 120);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get Search History
app.get('/api/searches', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [searches, total] = await Promise.all([
      SearchQuery.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SearchQuery.countDocuments()
    ]);

    res.json({
      success: true,
      searches,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching searches:', error);
    res.status(500).json({ error: 'Failed to fetch searches' });
  }
});

// Delete Product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Clear All Data (use carefully!)
app.delete('/api/products', async (req, res) => {
  try {
    if (req.query.confirm !== 'yes') {
      return res.status(400).json({
        error: 'Add ?confirm=yes to delete all products'
      });
    }

    await Product.deleteMany({});
    await SearchQuery.deleteMany({});

    if (redisClient && redisClient.isOpen) {
      await redisClient.flushAll();
    }

    res.json({
      success: true,
      message: 'All data cleared'
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start Server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Product Tracker Backend Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 MongoDB: ${mongoose.connection.readyState === 1 ? '✓ Connected' : '✗ Disconnected'}`);
  console.log(`⚡ Redis: ${(redisClient && redisClient.isOpen) ? '✓ Connected' : '✗ Disabled'}`);
  console.log('='.repeat(50));
  console.log('✨ Ready to track products!\n');
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');

  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('✓ Redis disconnected');
  }

  await mongoose.connection.close();
  console.log('✓ MongoDB disconnected');
  console.log('👋 Goodbye!\n');
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});