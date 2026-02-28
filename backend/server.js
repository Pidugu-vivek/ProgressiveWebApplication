require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'vitesecretkey_demo_only';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

// --- MongoDB Connection Setup ---
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));


// --- Mongoose Models ---
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
    id: Number,
    name: String,
    price: Number,
    image: String,
    category: String
});

const Product = mongoose.model('Product', productSchema);

const subscriptionSchema = new mongoose.Schema({
    endpoint: String,
    expirationTime: Date,
    keys: {
        p256dh: String,
        auth: String
    }
});
const Subscription = mongoose.model('Subscription', subscriptionSchema);

// --- API Routes ---

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already in use' });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        // Create token
        const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token, user: { email: newUser.email } });
    } catch (err) {
        console.error('Signup error', err);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        // Check pass
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        // Create token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user: { email: user.email } });
    } catch (err) {
        console.error('Login error', err);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Product Route
app.get('/api/products', async (req, res) => {
    try {
        // Attempt to fetch from DB
        let products = await Product.find({});

        // If DB is empty, let's seed it once with our mock data so the UI isn't empty
        if (products.length === 0) {
            console.log('Seeding initial products to MongoDB...');
            const seedData = [
                { id: 1, name: 'Premium Wireless Headphones', price: 299.99, image: '/images/product-1.jpg', category: 'Electronics' },
                { id: 2, name: 'Minimalist Smartwatch', price: 199.50, image: '/images/product-2.jpg', category: 'Accessories' },
                { id: 3, name: 'Ergonomic Office Chair', price: 149.00, image: '/images/product-3.jpg', category: 'Furniture' },
                { id: 4, name: 'Noise-Canceling Earbuds', price: 99.99, image: '/images/product-4.jpg', category: 'Electronics' },
                { id: 5, name: 'Mechanical Keyboard', price: 129.00, image: '/images/product-5.jpg', category: 'Electronics' },
                { id: 6, name: 'Stainless Steel Water Bottle', price: 24.99, image: '/images/product-6.jpg', category: 'Accessories' },
                { id: 7, name: '4K Ultra HD Monitor', price: 349.99, image: '/images/product-7.jpg', category: 'Electronics' },
                { id: 8, name: 'Wireless Charging Pad', price: 39.99, image: '/images/product-8.jpg', category: 'Accessories' },
                { id: 9, name: 'Adjustable Standing Desk', price: 499.00, image: '/images/product-9.jpg', category: 'Furniture' },
                { id: 10, name: 'Bluetooth Portable Speaker', price: 79.99, image: '/images/product-10.jpg', category: 'Electronics' },
                { id: 11, name: 'Laptop Backpack', price: 59.95, image: '/images/product-11.jpg', category: 'Accessories' },
                { id: 12, name: 'Gaming Mouse', price: 89.99, image: '/images/product-12.jpg', category: 'Electronics' }
            ];
            await Product.insertMany(seedData);
            products = await Product.find({});
        }

        // Simulate slight network delay to make loading state visible
        setTimeout(() => {
            res.json(products);
        }, 800);
    } catch (err) {
        console.error('Error fetching products from MongoDB', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// --- Push Notifications Setup ---

// Replace these with the output from `npx web-push generate-vapid-keys`
// Run it carefully!
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BFE3v_1sVY2X9qmv-nnH4k7RfeCPwpEo97ddO7nD6SfGSWrmuGRroNyiQyF4uT6w5ccle00bMlnyeYW_M3hpmD4';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'RfndfEpYLzV48yR-76H6oEZVc6bYLjahzeI66Lcqo5I';

webpush.setVapidDetails(
    'mailto:test@test.com',
    publicVapidKey,
    privateVapidKey
);

// Get VAPID Public Key
app.get('/api/vapidPublicKey', (req, res) => {
    res.send(publicVapidKey);
});

// Subscribe Route
app.post('/api/subscribe', async (req, res) => {
    try {
        const subscriptionData = req.body;

        // Check if subscription already exists to avoid duplicates
        const existingSub = await Subscription.findOne({ endpoint: subscriptionData.endpoint });
        if (!existingSub) {
            const newSubscription = new Subscription(subscriptionData);
            await newSubscription.save();
            console.log('New push subscription saved to MongoDB.');
        }

        res.status(201).json({});
    } catch (err) {
        console.error('Error saving subscription', err);
        res.status(500).json({ error: 'Failed to save subscription' });
    }
});

// Trigger Notification Route
app.post('/api/sendNotification', async (req, res) => {
    try {
        const notificationPayload = {
            title: req.body.title || 'Flash Sale!',
            body: req.body.body || 'Get 50% off on all accessories for the next hour.',
            icon: '/icons/icon-192x192.png',
            data: {
                url: '/',
            },
        };

        // Fetch all active subscriptions from DB
        const subscriptions = await Subscription.find({});

        const promises = subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(sub, JSON.stringify(notificationPayload));
            } catch (error) {
                console.error('Error sending notification, removing invalid subscription', error);
                // If web-push fails (e.g. 410 Gone), remove the invalid subscription from DB
                await Subscription.deleteOne({ _id: sub._id });
            }
        });

        await Promise.all(promises);
        res.status(200).json({ message: 'Notifications sent successfully.' });
    } catch (err) {
        console.error('Error in notify all', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
