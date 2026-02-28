import React, { useState, useEffect } from 'react';
import { ShoppingCart, Wifi, WifiOff, Bell, BellRing, User, LogOut } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const PUBLIC_VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Utility to convert Base64 URL-safe string to Uint8Array for push subscription
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pushStatus, setPushStatus] = useState('Checking...');

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

        // 2. Fetch Products
        fetchProducts();

        // 3. Check Push Notification Status
        checkPushStatus();

        // 4. Check Local Auth
        const storedUser = localStorage.getItem('lumina_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error("Failed to fetch products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        const endpoint = isLoginView ? '/auth/login' : '/auth/signup';

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: authEmail, password: authPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            // Success
            setUser(data.user);
            localStorage.setItem('lumina_token', data.token);
            localStorage.setItem('lumina_user', JSON.stringify(data.user));
            setShowAuthModal(false);
            setAuthEmail('');
            setAuthPassword('');
        } catch (err) {
            setAuthError(err.message);
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('lumina_token');
        localStorage.removeItem('lumina_user');
    };

    const checkPushStatus = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setPushStatus('Not Supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                setPushStatus('Subscribed');
            } else {
                setPushStatus('Supported (Not Subscribed)');
            }
        } catch (e) {
            setPushStatus('Error checking push');
        }
    };

    const subscribeToPush = async () => {
        setPushStatus('Subscribing...');
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setPushStatus('Permission Denied');
                return;
            }

            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            // Send to backend
            await fetch(`${API_BASE_URL}/subscribe`, {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: {
                    'content-type': 'application/json'
                }
            });

            setPushStatus('Subscribed');
            console.log('Subscribed to push notifications!');
        } catch (error) {
            console.error('Error subscribing to push:', error);
            setPushStatus('Subscription Failed');
        }
    };

    const triggerMockNotification = async () => {
        try {
            await fetch(`${API_BASE_URL}/sendNotification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: '🔥 Flash Sale Triggered!',
                    body: 'This is a real push notification sent from the backend through MongoDB subscriptions.'
                })
            });
            console.log("Push notification triggered from backend.");
        } catch (e) {
            console.error("Failed to trigger mock notification", e);
        }
    };

    return (
        <>
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
                    <WifiOff size={18} /> You are currently offline. Viewing cached products.
                </div>
            )}

            {showAuthModal && (
                <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowAuthModal(false) }}>
                    <div className="modal-content glass animate-fade-in">
                        <h2>{isLoginView ? 'Welcome Back' : 'Create Account'}</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            {isLoginView ? 'Sign in to access your premium gear.' : 'Join Lumina Tech today.'}
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

            <main className="container animate-fade-in">
                <header className="page-header">
                    <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Premium Gear, <span className="title-gradient">Zero Wait.</span></h1>
                    <p>Experience lightning-fast browsing whether online or offline powered by modern PWA architecture.</p>
                </header>

                <section className="push-promo glass">
                    <BellRing size={32} color="#c084fc" className="mb-2" />
                    <h3>Stay in the Loop</h3>
                    <p>Enable push notifications to get instantly alerted about flash sales and new premium arrivals. (Requires supported browser)</p>

                    <div className="push-actions">
                        {pushStatus === 'Subscribed' ? (
                            <button onClick={triggerMockNotification} className="btn btn-primary">
                                <Bell size={18} /> Trigger Backend Push Notification
                            </button>
                        ) : (
                            <button
                                onClick={subscribeToPush}
                                className="btn btn-primary"
                                disabled={pushStatus.includes('Not Supported') || pushStatus.includes('Denied') || pushStatus === 'Subscribing...'}
                            >
                                <Bell size={18} /> {pushStatus === 'Supported (Not Subscribed)' ? 'Subscribe Now' : pushStatus}
                            </button>
                        )}
                    </div>
                </section>

                <div className="product-grid">
                    {loading ? (
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
