import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Heart, User, MapPin, Monitor, Database, CheckCircle } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function App() {
  // Database sản phẩm
  const products = [
    { id: 1, name: 'iPhone 15 Pro Max', price: 29990000, image: '📱', category: 'Điện thoại', rating: 4.8, sold: 1234 },
    { id: 2, name: 'Samsung Galaxy S24', price: 22990000, image: '📱', category: 'Điện thoại', rating: 4.7, sold: 987 },
    { id: 3, name: 'MacBook Pro M3', price: 45990000, image: '💻', category: 'Laptop', rating: 4.9, sold: 456 },
    { id: 4, name: 'AirPods Pro 2', price: 6490000, image: '🎧', category: 'Âm thanh', rating: 4.6, sold: 2341 },
    { id: 5, name: 'Apple Watch Ultra', price: 21990000, image: '⌚', category: 'Đồng hồ', rating: 4.8, sold: 678 },
    { id: 6, name: 'iPad Pro 12.9"', price: 32990000, image: '📱', category: 'Máy tính bảng', rating: 4.7, sold: 543 },
    { id: 7, name: 'Sony WH-1000XM5', price: 8990000, image: '🎧', category: 'Âm thanh', rating: 4.9, sold: 892 },
    { id: 8, name: 'Dell XPS 15', price: 38990000, image: '💻', category: 'Laptop', rating: 4.6, sold: 321 },
    { id: 9, name: 'Canon EOS R6', price: 54990000, image: '📷', category: 'Máy ảnh', rating: 4.8, sold: 234 },
    { id: 10, name: 'Nintendo Switch', price: 7990000, image: '🎮', category: 'Gaming', rating: 4.7, sold: 1567 },
    { id: 11, name: 'Xiaomi Mi Band 8', price: 990000, image: '⌚', category: 'Đồng hồ', rating: 4.5, sold: 3421 },
    { id: 12, name: 'Logitech MX Master 3', price: 2490000, image: '🖱️', category: 'Phụ kiện', rating: 4.8, sold: 1234 },
  ];

  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [userSession, setUserSession] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState('');

  // Khởi tạo session và lưu vào Firestore
  useEffect(() => {
    const initSession = async () => {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'PC';
      const browser = navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/)?.[1] || 'Unknown';
      
      const session = {
        sessionId,
        deviceType,
        browser,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        startTime: new Date().toISOString(),
        location: 'Cầu Giấy, Hanoi, VN'
      };

      setUserSession(session);
      
      // Lưu session vào Firestore
      try {
        await addDoc(collection(db, 'sessions'), {
          ...session,
          createdAt: serverTimestamp()
        });
        console.log('✅ Session saved to Firestore');
      } catch (error) {
        console.error('❌ Error saving session:', error);
      }

      // Track session start event
      trackEvent('session_start', { sessionData: session });
    };

    initSession();

    const handleBeforeUnload = () => {
      if (userSession) {
        trackEvent('session_end', { 
          duration: (Date.now() - new Date(userSession.startTime).getTime()) / 1000 
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Hàm theo dõi sự kiện và lưu vào Firestore
  const trackEvent = async (eventType, eventData) => {
    const event = {
      eventType,
      timestamp: new Date().toISOString(),
      sessionId: userSession?.sessionId,
      deviceType: userSession?.deviceType,
      browser: userSession?.browser,
      location: userSession?.location,
      ...eventData
    };

    setEventCount(prev => prev + 1);
    console.log('📊 Event tracked:', event);

    // Lưu event vào Firestore
    try {
      setSaveStatus('saving');
      await addDoc(collection(db, 'analytics_events'), {
        ...event,
        createdAt: serverTimestamp()
      });
      setSavedCount(prev => prev + 1);
      setSaveStatus('saved');
      console.log('✅ Event saved to Firestore');
      
      // Reset status sau 2 giây
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('❌ Error saving event to Firestore:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleProductView = (product) => {
    trackEvent('product_view', {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price
    });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      trackEvent('search', { 
        query,
        resultsCount: products.filter(p => 
          p.name.toLowerCase().includes(query.toLowerCase())
        ).length
      });
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    trackEvent('add_to_cart', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      category: product.category
    });
  };

  const toggleFavorite = (product) => {
    const isFavorite = favorites.includes(product.id);
    
    if (isFavorite) {
      setFavorites(prev => prev.filter(id => id !== product.id));
      trackEvent('remove_favorite', {
        productId: product.id,
        productName: product.name
      });
    } else {
      setFavorites(prev => [...prev, product.id]);
      trackEvent('add_favorite', {
        productId: product.id,
        productName: product.name,
        category: product.category
      });
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    trackEvent('category_filter', { category });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Tất cả', ...new Set(products.map(p => p.category))];
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold">🛒 ShopVN</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/20 rounded-lg">
                <Database size={20} />
                <span className="hidden sm:inline">Cloud DB</span>
                <div className="flex items-center gap-1">
                  <span className="bg-yellow-400 text-gray-900 text-xs px-2 py-0.5 rounded-full font-bold">
                    {savedCount}
                  </span>
                  {saveStatus === 'saved' && (
                    <CheckCircle size={16} className="text-green-300 animate-pulse" />
                  )}
                  {saveStatus === 'saving' && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>
              <div className="relative">
                <Heart size={24} className="cursor-pointer hover:scale-110 transition" />
                {favorites.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs rounded-full w-5 h-5 flex items-center justify-center text-gray-900 font-bold">
                    {favorites.length}
                  </span>
                )}
              </div>
              <div className="relative">
                <ShoppingCart size={24} className="cursor-pointer hover:scale-110 transition" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-xs rounded-full w-5 h-5 flex items-center justify-center text-gray-900 font-bold">
                    {cart.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>
      </header>

      {/* User Info Banner */}
      <div className="bg-blue-50 border-b border-blue-200 py-2">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center gap-4 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <Monitor size={16} />
            <span className="font-semibold">{userSession?.deviceType}</span>
          </div>
          <div className="flex items-center gap-2">
            <User size={16} />
            <span className="font-semibold">{userSession?.browser}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span className="font-semibold">{userSession?.location}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
            <span className="text-green-600 font-semibold">
              ☁️ {savedCount} events đã lưu vào Cloud
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Info Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                <Database size={20} />
                🎯 Analytics đang lưu vào Firebase Firestore!
              </h3>
              <p className="text-sm opacity-90">
                Mọi hành động của bạn được lưu real-time vào NoSQL cloud database. 
                Truy cập Firebase Console để xem dữ liệu.
              </p>
            </div>
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-lg">
                <CheckCircle size={20} />
                <span className="font-semibold">Đã lưu!</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition shadow-sm ${
                selectedCategory === category
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1"
              onClick={() => handleProductView(product)}
            >
              <div className="relative">
                <div className="text-6xl flex items-center justify-center h-48 bg-gray-50 rounded-t-lg">
                  {product.image}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product);
                  }}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:scale-110 transition"
                >
                  <Heart
                    size={20}
                    className={favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                  />
                </button>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-2 line-clamp-2 h-10">
                  {product.name}
                </h3>
                
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm text-gray-600 font-semibold">{product.rating}</span>
                  <span className="text-xs text-gray-400 ml-2">Đã bán {product.sold}</span>
                </div>

                <div className="text-orange-500 font-bold text-lg mb-3">
                  {product.price.toLocaleString('vi-VN')}₫
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
                >
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t-2 border-orange-500 p-4 z-40">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                </div>
                <div className="text-xl font-bold text-orange-500">
                  {cartTotal.toLocaleString('vi-VN')}₫
                </div>
              </div>
              <button
                onClick={() => {
                  trackEvent('checkout_initiated', {
                    cartItems: cart,
                    total: cartTotal,
                    itemCount: cart.reduce((sum, item) => sum + item.quantity, 0)
                  });
                  alert('🎉 Chức năng thanh toán đang phát triển!\n\n✅ Dữ liệu đã được lưu vào Cloud Database.');
                }}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold"
              >
                Thanh toán →
              </button>
            </div>
          </div>
        )}
      </div>

      {cart.length > 0 && <div className="h-20"></div>}
    </div>
  );
}

export default App;