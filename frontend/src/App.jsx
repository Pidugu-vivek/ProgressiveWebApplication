import React, { useState, useEffect } from 'react';
import { ShoppingCart, Wifi, WifiOff, Bell, BellRing, User, LogOut } from 'lucide-react';

// Mock data directly in the frontend
const mockProducts = [
    { id: 1, name: 'Premium Wireless Headphones', price: 299.99, category: 'Electronics' },
    { id: 2, name: 'Minimalist Smartwatch', price: 199.50, category: 'Accessories' },
    { id: 3, name: 'Ergonomic Office Chair', price: 149.00, category: 'Furniture' },
    { id: 4, name: 'Noise-Canceling Earbuds', price: 99.99, category: 'Electronics' },
    { id: 5, name: 'Mechanical Keyboard', price: 129.00, category: 'Electronics' },
    { id: 6, name: 'Stainless Steel Water Bottle', price: 24.99, category: 'Accessories' },
    { id: 7, name: '4K Ultra HD Monitor', price: 349.99, category: 'Electronics' },
    { id: 8, name: 'Wireless Charging Pad', price: 39.99, category: 'Accessories' },
    { id: 9, name: 'Adjustable Standing Desk', price: 499.00, category: 'Furniture' },
    { id: 10, name: 'Bluetooth Portable Speaker', price: 79.99, category: 'Electronics' },
    { id: 11, name: 'Laptop Backpack', price: 59.95, category: 'Accessories' },
    { id: 12, name: 'Gaming Mouse', price: 89.99, category: 'Electronics' }
];

function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Checking, Supported, Subscribed, Not Supported/Denied
    const [pushStatus, setPushStatus] = useState('Supported (Local Demo)');

    // Auth State
    const [user, setUser] = useState(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isLoginView, setIsLoginView] = useState(true);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        // 1. Network Status Check
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // 2. Fetch Products (Mocked)
        fetchProducts();

        // 3. Check Local Auth
        const storedUser = localStorage.getItem('lumina_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const fetchProducts = () => {
        setLoading(true);
        // Simulate network delay for the skeleton loader effect to show
        setTimeout(() => {
            setProducts(mockProducts);
            setLoading(false);
        }, 800);
    };

    const handleAuthSubmit = (e) => {
        e.preventDefault();
        setAuthError('');

        // Simulate authentication directly on the frontend
        if (!authEmail.includes('@')) {
            setAuthError('Please enter a valid email.');
            return;
        }
        if (authPassword.length < 5) {
            setAuthError('Password too short for this demo.');
            return;
        }

        // Success Mock
        const mockUser = { email: authEmail };
        setUser(mockUser);
        localStorage.setItem('lumina_token', 'mock_token_123');
        localStorage.setItem('lumina_user', JSON.stringify(mockUser));

        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('lumina_token');
        localStorage.removeItem('lumina_user');
    };

    const subscribeToPush = async () => {
        if (!('Notification' in window)) {
            setPushStatus('Not Supported');
            return;
        }
        setPushStatus('Subscribing...');
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setPushStatus('Permission Denied');
                return;
            }
            setPushStatus('Subscribed');
            console.log('Subscribed to local notifications for demo purposes!');
        } catch (error) {
            console.error('Error subscribing to push:', error);
            setPushStatus('Subscription Failed');
        }
    };

    const triggerMockNotification = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification('🔥 Flash Sale Triggered!', {
                body: 'This is a mock local push notification sent without a backend server.',
                icon: '/icons/icon-192x192.png',
                vibrate: [100, 50, 100],
                data: { url: '/' }
            });
            console.log("Local notification triggered.");
        } catch (e) {
            console.error("Failed to trigger mock notification", e);
        }
    };

    return (
        <>
            {/* Navbar Shell */}
            <nav className="navbar glass-panel">
                <div className="brand">
                    <span className="title-gradient">Lumina</span> Tech
                </div>
                <div className="nav-actions">
                    <div className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}>
                        <div className="dot"></div>
                        {isOnline ? (
                            <><Wifi size={16} /> Online</>
                        ) : (
                            <><WifiOff size={16} /> Offline</>
                        )}
                    </div>

                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{user.email}</span>
                            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }} title="Logout">
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setShowAuthModal(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                            <User size={18} /> Login
                        </button>
                    )}

                    <button className="btn btn-outline" style={{ padding: '0.5rem' }}>
                        <ShoppingCart size={20} />
                    </button>
                </div>
            </nav>

            {!isOnline && (
                <div className="offline-banner">
                    <WifiOff size={18} /> You are currently offline. Viewing cached PWA shell.
                </div>
            )}

            {/* Auth Modal Overlay */}
            {showAuthModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowAuthModal(false) }}>
                    <div className="modal-content glass animate-fade-in">
                        <h2>{isLoginView ? 'Welcome Back' : 'Create Account'}</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            {isLoginView ? 'Sign in to access your premium gear. (Mock Backend)' : 'Join Lumina Tech today. (Mock Backend)'}
                        </p>

                        {authError && <div className="error-message">{authError}</div>}

                        <form onSubmit={handleAuthSubmit} className="auth-form">
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={authEmail}
                                    onChange={e => setAuthEmail(e.target.value)}
                                    required
                                    className="form-input"
                                    placeholder="name@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={authPassword}
                                    onChange={e => setAuthPassword(e.target.value)}
                                    required
                                    className="form-input"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem', width: '100%' }}>
                                {isLoginView ? 'Sign In' : 'Sign Up'}
                            </button>
                        </form>

                        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                            {isLoginView ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                className="text-btn"
                                onClick={() => { setIsLoginView(!isLoginView); setAuthError(''); }}
                            >
                                {isLoginView ? 'Sign Up' : 'Log In'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="container animate-fade-in">
                <header className="page-header">
                    <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Premium Gear, <span className="title-gradient">Zero Wait.</span></h1>
                    <p>Experience lightning-fast browsing whether online or offline powered by modern PWA architecture.</p>
                </header>

                {/* Push Notification Promo Card */}
                <section className="push-promo glass">
                    <BellRing size={32} color="#c084fc" className="mb-2" />
                    <h3>Stay in the Loop</h3>
                    <p>Enable local notifications to see how the service worker handles alerts instantly!</p>

                    <div className="push-actions">
                        {pushStatus === 'Subscribed' ? (
                            <button onClick={triggerMockNotification} className="btn btn-primary">
                                <Bell size={18} /> Trigger Local Notification
                            </button>
                        ) : (
                            <button
                                onClick={subscribeToPush}
                                className="btn btn-primary"
                                disabled={pushStatus.includes('Not Supported') || pushStatus.includes('Denied') || pushStatus === 'Subscribing...'}
                            >
                                <Bell size={18} /> {pushStatus === 'Supported (Local Demo)' ? 'Subscribe Now' : pushStatus}
                            </button>
                        )}
                    </div>
                </section>

                {/* Product Grid */}
                <div className="product-grid">
                    {loading ? (
                        // Skeletons
                        Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="product-card glass">
                                <div className="skeleton" style={{ width: '100%', aspectRatio: '4/3' }}></div>
                                <div className="product-info">
                                    <div className="skeleton" style={{ height: '14px', width: '40%', marginBottom: '1rem' }}></div>
                                    <div className="skeleton" style={{ height: '24px', width: '80%', marginBottom: '2rem' }}></div>
                                    <div className="skeleton" style={{ height: '28px', width: '30%', marginTop: 'auto' }}></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        products.map(product => (
                            <div key={product.id} className="product-card glass">
                                <img
                                    src={`https://source.unsplash.com/random/400x300/?${product.category.toLowerCase()},tech&sig=${product.id}`}
                                    alt={product.name}
                                    className="product-image"
                                    loading="lazy"
                                />
                                <div className="product-info">
                                    <span className="product-category">{product.category}</span>
                                    <h3 className="product-title">{product.name}</h3>
                                    <div className="product-footer">
                                        <span className="product-price">${product.price.toFixed(2)}</span>
                                        <button className="btn btn-outline" style={{ padding: '0.5rem' }}>Add</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </>
    );
}

export default App;
