import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import "./index.css";
import AuthModal from './AuthModal';

const products = [
  {
    id: 1,
    name: "Lavendra Noir",
    subtitle: "Fresh • Elegant • Calming",
    color: "#6B46C1",
    image: "/images/lavendra-noir.jpg",
  },
  {
    id: 2,
    name: "Blush Noir",
    subtitle: "Romantic • Floral • Soft",
    color: "#B76E79",
    image: "/images/blush-noir.jpg",
    outOfStock: true,
  },
  {
    id: 3,
    name: "Ivory Oudh",
    subtitle: "Rich • Woody • Royal",
    color: "#F2E8D5",
    image: "/images/ivory-oudh.jpg",
    outOfStock: true,
  },
  {
    id: 4,
    name: "Velvet Ember",
    subtitle: "Floral • Mysterious • Luxurious",
    color: "#6D1F2F",
    image: "/images/velvet-ember.jpg",
  },
  {
    id: 5,
    name: "Azure Oud",
    subtitle: "Fresh • Woody • Modern ",
    color: "#0F3D6E",
    image: "/images/azure-oud.jpg",
  },
  {
    id: 6,
    name: "Velvet Bloom",
    subtitle: "Soft • Powdery • Timeless",
    color: "#D8A7B1",
    image: "/images/velvet-bloom.jpg",
  },
  {
    id: 7,
    name: "Legacy",
    subtitle: "Signature • Bold • Unforgettable",
    color: "#0F7B5A",
    image: "/images/legacy.jpg",
  },
];

const fragranceFamilies = [
  "Floral",
  "Woody",
  "Woody Floral",
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function App() {
  const [activeMenu, setActiveMenu] = useState(null);
  const location = useLocation();
  
  // SEARCH STATE
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("houseOfARWishlist");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
const [cartItems, setCartItems] = useState(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("user"));
      const storageKey = savedUser ? `cart_${savedUser.email}` : "houseOfARCart_guest";
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isCheckoutView, setIsCheckoutView] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  
  const [checkoutData, setCheckoutData] = useState({
    name: "", email: "", phone: "", address: "", pincode: "",
  });
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
const [loggedInUser, setLoggedInUser] = useState(JSON.parse(localStorage.getItem("user")) || null);

// AUTO-FILL CHECKOUT WHEN LOGGED IN
  useEffect(() => {
    if (loggedInUser) {
      setCheckoutData(prevData => ({
        ...prevData,
        name: loggedInUser.name || "",
        email: loggedInUser.email || ""
      }));
    } else {
      setCheckoutData(prevData => ({
        ...prevData,
        name: "",
        email: ""
      }));
    }
  }, [loggedInUser]);

// REFRESH CART WHEN LOGIN STATE CHANGES
  useEffect(() => {
    const storageKey = loggedInUser ? `cart_${loggedInUser.email}` : "houseOfARCart_guest";
    const saved = localStorage.getItem(storageKey);
    setCartItems(saved ? JSON.parse(saved) : []);
  }, [loggedInUser]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveMenu(null);
    setIsSearchOpen(false);
    setSearchQuery("");
  }, [location]);

  useEffect(() => {
    if (isCartOpen || selectedProduct || isSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isCartOpen, selectedProduct, isSearchOpen]);

const toggleWishlist = (id) => {
    setWishlist((current) => {
      const newWishlist = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      
      // Safely sync to cloud ONLY when a user explicitly clicks a heart
      if (loggedInUser) {
        fetch("https://house-of-ar-backend.onrender.com/api/wishlist", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loggedInUser.email, wishlist: newWishlist })
        }).catch(err => console.error("Cloud sync failed:", err));
      }
      
      return newWishlist;
    });
  };

  const removeFromWishlist = (id) => setWishlist((current) => current.filter((item) => item !== id));
  
  const clearWishlist = () => {
    setWishlist([]);
    // Sync the cleared list to the database
    if (loggedInUser) {
        fetch("https://house-of-ar-backend.onrender.com/api/wishlist", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loggedInUser.email, wishlist: [] })
        });
    }
  };

  useEffect(() => {
    localStorage.setItem("houseOfARWishlist", JSON.stringify(wishlist));
  }, [wishlist]);
useEffect(() => {
    const storageKey = loggedInUser ? `cart_${loggedInUser.email}` : "houseOfARCart_guest";
    localStorage.setItem(storageKey, JSON.stringify(cartItems));
  }, [cartItems, loggedInUser]);

const syncCartToCloud = (updatedCart) => {
    if (loggedInUser) {
      fetch("https://house-of-ar-backend.onrender.com/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loggedInUser.email, cart: updatedCart })
      }).catch(err => console.error("Cloud cart sync failed:", err));
    }
  };

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      const newCart = existingItem 
        ? prevItems.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...prevItems, { ...product, quantity: 1 }];
      
      syncCartToCloud(newCart);
      return newCart;
    });
    
    // Close the product window
    setSelectedProduct(null);
    
    // Trigger the animated popup
    setToastMessage(`${product.name} added to your cart.`);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const updateCartQuantity = (id, change) => {
    setCartItems((prevItems) => {
      const newCart = prevItems.map((item) => {
        if (item.id === id) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      });
      syncCartToCloud(newCart);
      return newCart;
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prevItems) => {
      const newCart = prevItems.filter((item) => item.id !== id);
      syncCartToCloud(newCart);
      if (newCart.length === 0) setIsCheckoutView(false); // Fixed logic for empty cart
      return newCart;
    });
  };

  const closeDrawer = () => {
    setIsCartOpen(false);
    setTimeout(() => {
      setIsCheckoutView(false);
      if (isOrderComplete) {
        setIsOrderComplete(false);
        setCheckoutData({ name: "", email: "", phone: "", address: "", pincode: "" });
      }
    }, 400); 
  };

  const deliveryCharges = 59;
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((total, item) => total + (399 * item.quantity), 0);
  const cartTotal = cartItems.length > 0 ? cartSubtotal + deliveryCharges : 0;

  const handlePaymentProceed = async (e) => {
    e.preventDefault();
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return;
    }

    try {
      const orderResponse = await fetch("https://house-of-ar-backend.onrender.com/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cartTotal }), 
      });
      const orderData = await orderResponse.json();

      const options = {
        key: "rzp_live_TV8GkbN95RSm9F",
        amount: orderData.amount, 
        currency: orderData.currency,
        name: "House of A&R",
        description: "Fine Fragrances Purchase",
        image: "/images/logo.png",
        order_id: orderData.id,  
        
          notes: {
          order_details: cart.map(item => `${item.quantity}x ${item.name}`).join(", "),
          customer_name: "Customer Name", // Replace with your actual state variable
          phone: "Customer Phone",       // Replace with your actual state variable
          address: "Customer Address",   // Replace with your actual state variable
          pincode: "Customer Pincode"    // Replace with your actual state variable
        },

        handler: async function (response) {
          try {
            await fetch("https://house-of-ar-backend.onrender.com/confirm-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: checkoutData.name,
                email: checkoutData.email,
                phone: checkoutData.phone,
                address: checkoutData.address,
                pincode: checkoutData.pincode,
                amount: cartTotal, 
                orderId: response.razorpay_order_id,     // Explicitly grabs Razorpay's Order ID
                paymentId: response.razorpay_payment_id, // Required for your backend signature check
                signature: response.razorpay_signature,   // Required for your backend signature check
                cartItems: cartItems
              }),
            });
          } catch (err) {
            console.error("Failed to trigger email notification", err);
          }
          setIsOrderComplete(true);
          setCartItems([]); 
        },
        prefill: {
          name: checkoutData.name,
          email: checkoutData.email,
          contact: checkoutData.phone,
        },
        theme: { color: "#102943" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (response){
        alert(`Payment Failed: ${response.error.description}`);
      });
      paymentObject.open();

    } catch (error) {
      console.error("Error fetching order ID:", error);
      alert("Could not initiate payment. Is your backend server running?");
    }
  };

  const closeMenus = () => setActiveMenu(null);
  const openProduct = (product) => setSelectedProduct(product);
  const closeProduct = () => setSelectedProduct(null);

  const pageProps = {
    products, wishlist, toggleWishlist, addToCart, openProduct
  };

  return (
    <div className="site">

      <div className="announcement-bar">
        <span>HOUSE OF A&amp;R</span><span className="announcement-dot">•</span>
        <span>NOW DELIVERING IN LUCKNOW</span><span className="announcement-dot">•</span>
        <span>30 ML • LAUNCH OFFER • ₹399</span>
      </div>

      <header className="main-header">
        <div className="header-inner">
          <Link to="/" className="brand-logo" onClick={closeMenus}>
            <img src="/images/logo.png" alt="House of A&R" />
          </Link>

          <nav className="desktop-nav">
            <div className="nav-item" onMouseEnter={() => setActiveMenu("shop")}>
              <button className="nav-button" onClick={() => setActiveMenu(activeMenu === "shop" ? null : "shop")}>
                SHOP <span className="chevron">⌄</span>
              </button>
            </div>
            <div className="nav-item" onMouseEnter={() => setActiveMenu("perfumes")}>
              <button className="nav-button" onClick={() => setActiveMenu(activeMenu === "perfumes" ? null : "perfumes")}>
                PERFUMES <span className="chevron">⌄</span>
              </button>
            </div>
            <a href="/#home-fragrances" className="nav-link" onClick={closeMenus}>HOME FRAGRANCES</a>
            <Link to="/gifting" className="nav-link" onClick={closeMenus}>GIFTING</Link>
            <Link to="/story" className="nav-link" onClick={closeMenus}>OUR STORY</Link>
          </nav>

          <div className="header-actions">
{loggedInUser ? (
<div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <Link 
              to="/my-orders" 
              style={{ textDecoration: "none", color: "#000", cursor: "pointer", fontSize: "13px", fontWeight: "500", letterSpacing: "1px" }}
            >
              MY ORDERS
            </Link>
            <button 
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                setLoggedInUser(null);
                setWishlist([]);
                setCartItems([]);
              }}
              style={{ background: "none", border: "none", color: "#000", cursor: "pointer", fontSize: "13px", fontWeight: "500", letterSpacing: "1px" }}
            >
              LOGOUT ({loggedInUser.name.split(" ")[0]})
            </button>
          </div>
) : (
  <button 
    onClick={() => setIsAuthOpen(true)}
    style={{ background: "none", border: "none", color: "#000", cursor: "pointer", fontSize: "13px", fontWeight: "500", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "inherit", whiteSpace: "nowrap" }}
  >
    LOGIN
  </button>
)}
            <button className="icon-button" aria-label="Search" onClick={() => setIsSearchOpen(true)}>
              <SearchIcon />
            </button>
            <Link to="/wishlist" className="icon-button wishlist-button" aria-label="Wishlist">
              <HeartIcon />
              {wishlist.length > 0 && <span className="icon-badge">{wishlist.length}</span>}
            </Link>
            <button className="icon-button cart-button" aria-label="Cart" onClick={() => setIsCartOpen(true)}>
              <BagIcon />
              {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
            </button>
<button className="mobile-menu-button" aria-label="Open menu" onClick={() => setIsMobileMenuOpen(true)}>
              <MenuIcon />
            </button>
          </div>
        </div>

        {activeMenu === "shop" && (
          <div className="mega-menu" onMouseLeave={() => setActiveMenu(null)}>
            <div className="mega-menu-grid">
              <MenuColumn title="SHOP" items={[{label: "All Products", path: "/shop"}]} />
              <MenuColumn title="SHOP BY MOOD" items={[{label: "Everyday", path: "/shop"}, {label: "Date Night", path: "/shop"}]} />
              <MenuColumn title="DISCOVER" items={[{label: "Our Story", path: "/story"}, {label: "Gift Fragrances", path: "/gifting"}]} />
              <div className="menu-feature">
                <div className="menu-feature-image"><img src="/images/menu-fragrance.jpg" alt="House of A&R fragrance" /></div>
                <div className="menu-feature-content">
                  <span>HOUSE OF A&amp;R</span>
                  <strong>Beautiful things for the way you live.</strong>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeMenu === "perfumes" && (
          <div className="mega-menu" onMouseLeave={() => setActiveMenu(null)}>
            <div className="mega-menu-grid">
              <MenuColumn title="PERFUMES" items={[{label: "All Perfumes", path: "/shop"}]} />
              <MenuColumn title="FRAGRANCE FAMILY" items={fragranceFamilies.map(f => ({label: f, path: "/shop"}))} />
              <MenuColumn title="SHOP BY OCCASION" items={[{label: "Everyday", path: "/shop"}, {label: "Romantic Date", path: "/shop"}]} />
              <div className="menu-feature">
                <div className="menu-feature-image"><img src="/images/velvet-ember.jpg" alt="Velvet Ember" /></div>
                <div className="menu-feature-content">
                  <span>LAUNCH COLLECTION</span>
                  <strong>Elevating everyday moments, beautifully.</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
       {/* MOBILE MENU DRAWER */}
        <div className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`}>
          <div className="mobile-menu-header">
            <img src="/images/logo.png" alt="House of A&R" style={{ height: "40px", width: "auto", objectFit: "contain" }} />
            <button className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
          </div>
          <nav className="mobile-nav-links">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>HOME</Link>
            <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)}>SHOP ALL</Link>
            <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)}>PERFUMES</Link>
            <a href="/#home-fragrances" onClick={() => setIsMobileMenuOpen(false)}>HOME FRAGRANCES</a>
            <Link to="/gifting" onClick={() => setIsMobileMenuOpen(false)}>GIFTING</Link>
            <Link to="/story" onClick={() => setIsMobileMenuOpen(false)}>OUR STORY</Link>
          </nav>
          {/* MOBILE BOTTOM NAV: My Orders & Auth */}
        <div style={{ marginTop: "auto", borderTop: "1px solid #eee6d8", paddingTop: "25px", display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "20px", paddingLeft: "20px" }}>
          {loggedInUser ? (
            <>
              <Link 
                to="/my-orders" 
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ textDecoration: "none", color: "#000", fontSize: "14px", fontWeight: "500", letterSpacing: "1px" }}
              >
                MY ORDERS
              </Link>
              <button 
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  setLoggedInUser(null);
                  setWishlist([]);
                  setCartItems([]);
                  setIsMobileMenuOpen(false);
                }}
                style={{ background: "none", border: "none", color: "#000", cursor: "pointer", fontSize: "14px", fontWeight: "500", letterSpacing: "1px", textAlign: "left", padding: 0 }}
              >
                LOGOUT ({loggedInUser.name.split(" ")[0]})
              </button>
            </>
          ) : (
            <button 
              onClick={() => {
                setIsAuthOpen(true); 
                setIsMobileMenuOpen(false);
              }}
              style={{ background: "none", border: "none", color: "#000", cursor: "pointer", fontSize: "14px", fontWeight: "500", letterSpacing: "1px", textAlign: "left", padding: 0 }}
            >
              LOGIN
            </button>
          )}
        </div>
        </div>
      <main>
        <Routes>
          <Route path="/" element={<HomePage {...pageProps} />} />
          <Route path="/shop" element={<ShopPage {...pageProps} />} />
          <Route path="/wishlist" element={<WishlistPage {...pageProps} clearWishlist={clearWishlist} />} />
          <Route path="/gifting" element={<GiftingPage />} />
          <Route path="/story" element={<StoryPage />} />
          
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/images/logo.png" alt="House of A&R" />
            <p>Fine fragrances crafted for moments worth remembering.</p>
          </div>
          <FooterColumn title="SHOP" links={[{label: "Perfumes", path:"/shop"}, {label: "Home Fragrances", path:"/"}, {label: "Gifting", path:"/gifting"}]} />
          
          <FooterColumn title="HELP" links={[
            {label: "Contact Us", path:"mailto:houseofaandr@gmail.com"}, 
            {label: "Shipping", path:"/shipping"}, 
            {label: "Returns", path:"/returns"}, 
            {label: "FAQ", path:"/faq"}
          ]} />
          
          <FooterColumn title="INFORMATION" links={[
            {label: "Our Story", path:"/story"}, 
            {label: "Privacy Policy", path:"/privacy"}, 
            {label: "Terms of Service", path:"/terms"}
          ]} />
          
          <div className="footer-contact">
            <h4>CONTACT</h4>
            <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "13px", marginBottom: "15px" }}>
              Currently delivering in Lucknow.
            </p>
            <a href="https://wa.me/919125289227" target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,0.62)", fontSize: "13px", display: "block", marginBottom: "8px", textDecoration: "none" }}>
              WhatsApp
            </a>
            <a href="https://www.instagram.com/houseofaandr?igsi=emszODB2b3VneTJ0" target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,0.62)", fontSize: "13px", display: "block", marginBottom: "8px", textDecoration: "none" }}>
              Instagram
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 House of A&amp;R</span><span>FINE FRAGRANCES</span>
        </div>
      </footer>
      <AuthModal 
  isOpen={isAuthOpen} 
  onClose={() => setIsAuthOpen(false)} 
  setLoggedInUser={setLoggedInUser}
  setWishlist={setWishlist}
  setCartItems={setCartItems} 
/>

      {/* SEARCH OVERLAY */}
      <div className={`search-overlay ${isSearchOpen ? "open" : ""}`}>
        <button className="search-close" onClick={() => setIsSearchOpen(false)}>✕</button>
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Search fragrances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus={isSearchOpen}
          />
        </div>
        <div className="search-results-grid">
          {searchQuery && products
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(p => (
              <button 
                className="search-result-card page-transition" 
                key={p.id} 
                onClick={() => { openProduct(p); setIsSearchOpen(false); setSearchQuery(""); }}
              >
                <img src={p.image} alt={p.name} />
                <h4>{p.name}</h4>
                <p>{p.subtitle}</p>
              </button>
          ))}
        </div>
      </div>

      {/* MODALS & DRAWERS */}
      {selectedProduct && (
        <div className="product-detail-modal-wrapper" style={{position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.4)', overflowY: 'auto'}}>
          <section className="product-detail-section product-detail-modal-content" style={{minHeight: '100vh', margin: 0, border: 0}}>
            <div className="product-detail-shell">
              <button className="product-detail-back" onClick={closeProduct}><span>←</span> BACK</button>
              <div className="product-detail-grid">
                <div className="product-detail-image" style={{ "--product-accent": selectedProduct.color }}>
                  <img src={selectedProduct.image} alt={selectedProduct.name} />
                  <span className="product-detail-size">30 ML</span>
                </div>
                <div className="product-detail-info">
                  <div className="section-label">HOUSE OF A&amp;R • FINE FRAGRANCES</div>
                  <h2>{selectedProduct.name}</h2>
                  <p className="product-detail-subtitle">{selectedProduct.subtitle}</p>
                  <div className="product-detail-price"><span className="old-price">₹799</span><span className="sale-price">₹399</span></div>
                  <div className="product-detail-divider"></div>
                  <p className="product-detail-description">A refined fragrance created to complement your mood, your moment and your individuality. Designed for everyday elegance with a lasting impression.</p>
                  <div className="product-detail-facts">
                    <div><span>SIZE</span><strong>30 ML</strong></div>
                    <div><span>PRICE</span><strong>₹399</strong></div>
                    <div><span>DELIVERY</span><strong>LUCKNOW</strong></div>
                  </div>
<div className="product-detail-actions">
                    {selectedProduct.outOfStock ? (
                      <button className="product-detail-add out-of-stock-btn" disabled>OUT OF STOCK</button>
                    ) : (
                      <button className="product-detail-add" onClick={() => addToCart(selectedProduct)}>ADD TO CART <span>+</span></button>
                    )}
                    <button className={`product-detail-wishlist ${wishlist.includes(selectedProduct.id) ? "active" : ""}`} onClick={() => toggleWishlist(selectedProduct.id)}>
                      <HeartIcon filled={wishlist.includes(selectedProduct.id)} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <div className={`cart-overlay ${isCartOpen ? "open" : ""}`} onClick={closeDrawer}></div>
      <div className={`cart-drawer ${isCartOpen ? "open" : ""}`}>
        <div className="cart-header">
          {!isOrderComplete && isCheckoutView ? (
            <button className="checkout-back" onClick={() => setIsCheckoutView(false)}><span>←</span> BACK TO CART</button>
          ) : !isOrderComplete ? (
            <h2>Your Cart ({cartCount})</h2>
          ) : (
            <h2>Thank You</h2>
          )}
          <button className="cart-close" onClick={closeDrawer}>✕</button>
        </div>

        {isOrderComplete ? (
          <div className="order-success-container">
            <div className="success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <h3>Your order is confirmed.</h3>
            <p>A little luxury is on its way to you.<br />We have sent the receipt to <strong>{checkoutData.email}</strong>.</p>
            <button className="primary-button" onClick={closeDrawer}>RETURN TO SHOP</button>
          </div>
        ) : isCheckoutView ? (
          <div className="checkout-form-container">
            <h3>Delivery Details</h3>
            <p className="checkout-subtitle">Currently delivering only in Lucknow.</p>
            <form id="checkout-form" onSubmit={handlePaymentProceed}>
              <div className="form-group"><label>Full Name</label><input type="text" placeholder="Enter your name" required value={checkoutData.name} onChange={e => setCheckoutData({...checkoutData, name: e.target.value})} /></div>
              <div className="form-group"><label>Email Address</label><input type="email" placeholder="For your order receipt" required value={checkoutData.email} onChange={e => setCheckoutData({...checkoutData, email: e.target.value})} /></div>
              <div className="form-group"><label>Mobile Number</label><input type="tel" pattern="[0-9]{10}" placeholder="10-digit mobile number" required value={checkoutData.phone} onChange={e => setCheckoutData({...checkoutData, phone: e.target.value})} /></div>
              <div className="form-group"><label>Complete Address (Lucknow)</label><textarea rows="3" placeholder="House No, Street, Landmark" required value={checkoutData.address} onChange={e => setCheckoutData({...checkoutData, address: e.target.value})}></textarea></div>
              <div className="form-group"><label>PIN Code</label><input type="text" pattern="226[0-9]{3}" title="Delivery restricted to Lucknow. PIN must start with 226." placeholder="e.g. 226001" required value={checkoutData.pincode} onChange={e => setCheckoutData({...checkoutData, pincode: e.target.value})} /></div>
            </form>
            <div className="checkout-order-summary">
              <h3>Order Summary</h3>
              <div className="cart-summary-row"><span>{cartCount} Items</span><span>₹{cartSubtotal}</span></div>
              <div className="cart-summary-row"><span>Delivery Charges</span><span>₹{deliveryCharges}</span></div>
            </div>
          </div>
        ) : (
          <div className="cart-items">
            {cartItems.length === 0 ? (
              <div className="cart-empty"><BagIcon /><p>Your cart is empty.</p><button className="primary-button" onClick={closeDrawer}>CONTINUE SHOPPING</button></div>
            ) : (
              cartItems.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-image"><img src={item.image} alt={item.name} /></div>
                  <div className="cart-item-info">
                    <h3>{item.name}</h3><span className="cart-item-size">30 ML</span>
                    <div className="cart-item-controls">
                      <div className="quantity-selector"><button onClick={() => updateCartQuantity(item.id, -1)}>−</button><span>{item.quantity}</span><button onClick={() => updateCartQuantity(item.id, 1)}>+</button></div>
                      <button className="remove-item" onClick={() => removeFromCart(item.id)}>Remove</button>
                    </div>
                  </div>
                  <div className="cart-item-price"><strong>₹{399 * item.quantity}</strong></div>
                </div>
              ))
            )}
          </div>
        )}

        {!isOrderComplete && cartItems.length > 0 && (
          <div className="cart-footer">
            {!isCheckoutView && (
              <>
                <div className="cart-summary-row"><span>SUBTOTAL</span><span>₹{cartSubtotal}</span></div>
                <div className="cart-summary-row"><span>DELIVERY CHARGES</span><span>₹{deliveryCharges}</span></div>
                <div className="cart-divider-subtle"></div>
              </>
            )}
            <div className="cart-total"><span>TOTAL</span><strong>₹{cartTotal}</strong></div>
            <p className="cart-taxes">Same-day delivery in Lucknow.</p>
            {isCheckoutView ? (
              <button className="checkout-button" type="submit" form="checkout-form">PROCEED TO PAYMENT • ₹{cartTotal}</button>
            ) : (
              <button className="checkout-button" onClick={() => setIsCheckoutView(true)}>CHECKOUT • ₹{cartTotal}</button>
            )}
          </div>
        )}
      </div>

      {/* ANIMATED TOAST NOTIFICATION */}
      <div className={`toast-notification ${toastMessage ? "show" : ""}`}>
        ✓ {toastMessage}
      </div>

    </div>
  );
}

/* =========================================================
   PAGE COMPONENTS
========================================================= */

function HomePage({ products, toggleWishlist, wishlist, addToCart, openProduct }) {
  return (
    <div className="page-transition">
      <section className="hero-section">
        <div className="hero-background"><img src="/images/hero.jpg" alt="House of A&R Fine Fragrances" /></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-eyebrow">HOUSE OF A&amp;R • FINE FRAGRANCES</div>
          <h1>A little luxury<em> for every part of life.</em></h1>
          <p className="hero-description">Discover refined fragrances crafted for moods, moments and memories.</p>
          <div className="hero-buttons">
            <Link to="/shop" className="primary-button">EXPLORE THE COLLECTION <span>→</span></Link>
            <Link to="/story" className="secondary-button">DISCOVER HOUSE OF A&amp;R</Link>
          </div>
        </div>
      </section>

      <section className="intro-section">
        <div className="section-label">HOUSE OF A&amp;R</div>
        <h2>Fine fragrances,<br />made to be remembered.</h2>
        <p>Every fragrance tells a different story. Explore a collection created to complement your mood, your moment and your individuality.</p>
      </section>

      <section className="collection-section">
        <div className="section-heading-row">
          <div><div className="section-label">BESTSELLERS</div><h2>Discover your<em> signature.</em></h2></div>
          <Link to="/shop" className="text-link">VIEW ALL <span>→</span></Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 3).map((product) => ( 
            <ProductCard key={product.id} product={product} toggleWishlist={toggleWishlist} wishlist={wishlist} addToCart={addToCart} openProduct={openProduct} />
          ))}
        </div>
      </section>

      <section id="home-fragrances" className="mist-section">
        <div className="mist-image"><img src="/images/home-mist.jpg" alt="Pillow Mist and Curtain Mist" /></div>
        <div className="mist-content">
          <div className="section-label light-label">THE NEXT CHAPTER</div>
          <h2>Something new<em> is coming home.</em></h2>
          <p>We're expanding the House of A&amp;R experience beyond perfume.</p>
        </div>
      </section>

<section className="families-section">
  <div className="section-label">MADE TO BECOME PART OF YOUR EVERYDAY</div>
  <h2>A fragrance for<em> every mood.</em></h2>
  <div className="family-grid">
    {[{ name: "Woody", image: "/images/woody.jpg" }, { name: "Woody Floral", image: "/images/aquatic.jpg" }, { name: "Floral", image: "/images/floral.jpg" }].map((family) => (
      <Link to="/shop" className="family-card" key={family.name}>
        <img src={family.image} alt={family.name} />
        <div className="family-overlay">
          <span>EXPLORE</span>
          <h3>{family.name}</h3>
          <span className="family-arrow">→</span>
        </div>
      </Link>
    ))}
  </div>
</section>
    </div>
  );
}

function ShopPage({ products, toggleWishlist, wishlist, addToCart, openProduct }) {
  return (
    <div className="page-transition">
      <section className="collection-section" style={{ paddingTop: '60px' }}>
        <div className="section-heading-row">
          <div><div className="section-label">OUR COLLECTION</div><h2>All<em> Perfumes.</em></h2></div>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} toggleWishlist={toggleWishlist} wishlist={wishlist} addToCart={addToCart} openProduct={openProduct} />
          ))}
        </div>
      </section>
    </div>
  );
}

function WishlistPage({ products, wishlist, toggleWishlist, addToCart, openProduct, clearWishlist }) {
  return (
    <div className="page-transition">
      <section className="wishlist-section">
        <div className="wishlist-shell">
          <div className="wishlist-heading-row">
            <div>
              <div className="section-label">HOUSE OF A&amp;R • YOUR COLLECTION</div>
              <h2>Your <em>wishlist.</em></h2>
              <p>Keep the fragrances you love close until you're ready to make them yours.</p>
            </div>
            {wishlist.length > 0 && <button className="wishlist-clear" onClick={clearWishlist}>CLEAR WISHLIST</button>}
          </div>

          {wishlist.length === 0 ? (
            <div className="wishlist-empty">
              <div className="wishlist-empty-icon"><HeartIcon /></div>
              <div className="section-label">NOTHING SAVED YET</div>
              <h3>A scent worth remembering<br />is waiting for you.</h3>
              <Link to="/shop" className="wishlist-shop-button" style={{ display: 'inline-flex' }}>EXPLORE FRAGRANCES <span>→</span></Link>
            </div>
          ) : (
            <div className="wishlist-grid">
              {products.filter((product) => wishlist.includes(product.id)).map((product) => (
                <article className="wishlist-card" key={product.id}>
                  <button className="wishlist-card-image" onClick={() => openProduct(product)}>
                    <img src={product.image} alt={product.name} />
                    <span className="wishlist-card-size">30 ML</span>
                  </button>
                  <div className="wishlist-card-info">
                    <div><h3>{product.name}</h3><p>{product.subtitle}</p></div>
                    <div className="wishlist-card-price"><span className="old-price">₹799</span><strong>₹399</strong></div>
                  </div>
                  <div className="wishlist-card-actions">
                    <button className="wishlist-card-cart" onClick={() => addToCart(product)}>ADD TO CART <span>+</span></button>
                    <button className="wishlist-card-remove" onClick={() => toggleWishlist(product.id)}><HeartIcon filled /></button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function GiftingPage() {
  return (
    <div className="page-transition">
      <section className="gifting-section">
        <div className="gifting-content">
          <div className="section-label">GIFTING</div>
          <h2>A gift made for every kind of celebration.<br /><em>A moment to remember</em></h2>
          <p>Thoughtful fragrances for birthdays, celebrations, special moments and everything in between.</p>
          <Link to="/shop" className="primary-button">EXPLORE FRAGRANCES <span>→</span></Link>
        </div>
        <div className="gifting-image"><img src="/images/gifting.jpg" alt="House of A&R gifting" /></div>
      </section>
    </div>
  );
}

function StoryPage() {
  return (
    <div className="page-transition">
      <section className="story-section">
        <div className="story-image"><img src="/images/story.jpg" alt="House of A&R" /></div>
        <div className="story-content">
          <div className="section-label">OUR STORY</div>
          <h2>More than a fragrance.<br /><em>A feeling.</em></h2>
          <p><b>It started with a simple thought — fragrance should be a part of everyday life.</b></p>
          <p>We believe fragrance is more than just a perfume you wear. It can change the feeling of a room, become part of a memory, make a gift more special, or simply make an ordinary moment feel a little better.

That thought became the beginning of House of A & R.

We started with a passion for creating beautiful fragrances that feel premium, personal, and accessible. Instead of limiting fragrance to traditional attars and perfumes, we wanted to build something broader — a fragrance experience for you, your clothes, your room, your home, and your special moments.

Our journey begins with carefully crafted perfumes, but it doesn't end there.

From perfumes and attars to pillow mists, curtain mists, room fragrances, gifting collections, and more, our aim is to bring fragrance into different parts of everyday life.

<p><b>Our Philosophy</b></p>

We don't want fragrance to feel complicated or unreachable.

We want you to discover a scent that feels like you.

Something you can wear before going out.
Something that makes your room feel welcoming.
Something that turns your bedroom into a relaxing space.
Something you can gift to someone and make the moment memorable.

Every fragrance we create is designed with one simple question in mind:

“How should this moment feel?”

Where We're Going

House of A & R is only at the beginning of its journey.

Our vision is to grow beyond a fragrance brand and create a complete world of scents — where every product has a purpose, every fragrance has a personality, and everyone can find something that belongs to them.

From the person who loves a classic perfume, to the one who wants their home to smell beautiful — there will always be a fragrance for them.

House of A & R
More than a fragrance. A feeling, in every form.</p>
        </div>
      </section>
      <section className="statement-section">
        <div className="section-label light-label">HOUSE OF A&amp;R</div>
        <h2>Leave a lasting<em> impression.</em></h2>
        <p>Fragrance is invisible.<br />The memory it leaves behind isn't.</p>
      </section>
    </div>
  );
}

/* =========================================================
   LEGAL & HELP PAGES
========================================================= */

const legalContainerStyle = {
  maxWidth: "800px",
  margin: "100px auto",
  padding: "0 5vw",
  minHeight: "60vh",
  color: "var(--navy)"
};

const legalHeadingStyle = {
  fontSize: "36px",
  marginBottom: "40px",
  borderBottom: "1px solid var(--border)",
  paddingBottom: "20px"
};

const legalSubHeadingStyle = {
  fontSize: "18px",
  fontFamily: "'Playfair Display', serif",
  marginTop: "30px",
  marginBottom: "15px"
};

const legalTextStyle = {
  fontSize: "14px",
  color: "var(--muted)",
  marginBottom: "20px",
  lineHeight: "1.8"
};

function ShippingPage() {
  return (
    <div className="page-transition" style={legalContainerStyle}>
      <h2 style={legalHeadingStyle}>Shipping Policy</h2>
      
      <h3 style={legalSubHeadingStyle}>Same-Day Delivery in Lucknow</h3>
      <p style={legalTextStyle}>
        House of A&amp;R currently offers exclusive same-day delivery for all orders placed within Lucknow. To qualify for same-day delivery, orders must be placed before 4:00 PM IST. Orders placed after this cutoff will be delivered the following business day.
      </p>

      <h3 style={legalSubHeadingStyle}>Delivery Charges</h3>
      <p style={legalTextStyle}>
        A flat delivery fee of ₹59 applies to all orders within Lucknow. 
      </p>

      <h3 style={legalSubHeadingStyle}>Order Tracking</h3>
      <p style={legalTextStyle}>
        Once your order is confirmed and dispatched, you will receive an automated email receipt and updates via WhatsApp regarding your delivery status.
      </p>
    </div>
  );
}

function ReturnsPage() {
  return (
    <div className="page-transition" style={legalContainerStyle}>
      <h2 style={legalHeadingStyle}>Returns & Refunds</h2>
      
      <h3 style={legalSubHeadingStyle}>Strict No-Return Policy on Opened Items</h3>
      <p style={legalTextStyle}>
        Due to the personal nature and hygiene standards of fine fragrances, <strong>we do not accept returns or exchanges on any opened or used products.</strong> If the protective seal or plastic wrapping has been tampered with, the return request will be automatically rejected.
      </p>

      <h3 style={legalSubHeadingStyle}>3-Day Return Window (Unopened Items)</h3>
      <p style={legalTextStyle}>
        You may request a return within exactly 3 days of receiving your order, provided the item is entirely unopened, unused, and in its original pristine packaging. 
      </p>

      <h3 style={legalSubHeadingStyle}>Damaged or Defective Items</h3>
      <p style={legalTextStyle}>
        In the rare event that your bottle arrives damaged or leaking, please contact us at houseofaandr@gmail.com within 24 hours of delivery with photographic evidence. We will arrange a replacement immediately.
      </p>
    </div>
  );
}

function FAQPage() {
  return (
    <div className="page-transition" style={legalContainerStyle}>
      <h2 style={legalHeadingStyle}>Frequently Asked Questions</h2>
      
      <h3 style={legalSubHeadingStyle}>Where do you deliver?</h3>
      <p style={legalTextStyle}>Currently, House of A&amp;R exclusively serves customers within Lucknow. We are working on expanding our delivery zones nationwide.</p>

      <h3 style={legalSubHeadingStyle}>Are your fragrances long-lasting?</h3>
      <p style={legalTextStyle}>Yes. We use high-quality perfume oils designed for strong projection and longevity. Depending on your skin chemistry and the specific fragrance family, our perfumes last between 6 to 10 hours.</p>

      <h3 style={legalSubHeadingStyle}>Can I return a perfume if I don't like the scent?</h3>
      <p style={legalTextStyle}>Unfortunately, no. Scent is highly subjective. Because we cannot accept opened products for hygiene reasons, we recommend exploring our fragrance families and notes carefully before purchasing.</p>

      <h3 style={legalSubHeadingStyle}>How should I store my fragrance?</h3>
      <p style={legalTextStyle}>To preserve the integrity of the perfume, store your bottle in a cool, dark place away from direct sunlight and humidity. Avoid storing it in the bathroom.</p>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div className="page-transition" style={legalContainerStyle}>
      <h2 style={legalHeadingStyle}>Privacy Policy</h2>
      <p style={legalTextStyle}>Last updated: September 2026</p>

      <h3 style={legalSubHeadingStyle}>Information We Collect</h3>
      <p style={legalTextStyle}>
        When you make a purchase from House of A&amp;R, we collect personal information necessary to fulfill your order, including your name, delivery address, email address, and phone number.
      </p>

      <h3 style={legalSubHeadingStyle}>Payment Security</h3>
      <p style={legalTextStyle}>
        We do not store your credit card details or payment information on our servers. All transactions are securely encrypted and processed through our third-party payment gateway partner (Razorpay), which adheres to strict PCI-DSS compliance standards.
      </p>

      <h3 style={legalSubHeadingStyle}>How We Use Your Information</h3>
      <p style={legalTextStyle}>
        Your data is used strictly for order fulfillment, delivery logistics, and sending transaction receipts. We will never sell or rent your personal information to third parties.
      </p>
    </div>
  );
}

function TermsPage() {
  return (
    <div className="page-transition" style={legalContainerStyle}>
      <h2 style={legalHeadingStyle}>Terms of Service</h2>
      
      <h3 style={legalSubHeadingStyle}>1. General Conditions</h3>
      <p style={legalTextStyle}>
        By visiting our site and purchasing something from us, you engage in our "Service" and agree to be bound by the following terms and conditions. We reserve the right to refuse service to anyone for any reason at any time.
      </p>

      <h3 style={legalSubHeadingStyle}>2. Accuracy of Billing and Account Information</h3>
      <p style={legalTextStyle}>
        You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store. We reserve the right to cancel orders if the delivery address is outside our current service zone (Lucknow) or appears fraudulent.
      </p>

      <h3 style={legalSubHeadingStyle}>3. Modifications to the Service and Prices</h3>
      <p style={legalTextStyle}>
        Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.
      </p>
    </div>
  );
}

function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Safely grab user from local storage
  const savedUser = localStorage.getItem("user");
  const loggedInUser = savedUser ? JSON.parse(savedUser) : null;

  // SECURITY CHECK: Instantly block non-admins
  if (!loggedInUser || loggedInUser.email !== "hasanzaidi7949@gmail.com") {
    return (
      <div className="page-transition" style={legalContainerStyle}>
        <h2 style={legalHeadingStyle}>Access Denied</h2>
        <p style={legalTextStyle}>You do not have authorization to view this secure dashboard.</p>
      </div>
    );
  }

  useEffect(() => {
    fetch("https://house-of-ar-backend.onrender.com/api/orders")
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading orders", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={legalContainerStyle}>Loading orders...</div>;

  return (
    <div className="page-transition" style={legalContainerStyle}>
      <h2 style={legalHeadingStyle}>Admin Dashboard</h2>
      
      {orders.length === 0 ? (
        <p style={legalTextStyle}>No orders found yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {orders.map(order => (
            <div key={order._id} style={{ border: "1px solid #eee6d8", padding: "25px", background: "#fbf9f5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee6d8", paddingBottom: "15px", marginBottom: "15px" }}>
                <strong>Order ID: {order.orderId}</strong>
                <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "14px", color: "var(--muted)", lineHeight: "1.6" }}>
                <div>
                  <strong>Customer Details</strong><br />
                  {order.customerName}<br />
                  {order.email}<br />
                  {order.phone}
                </div>
                <div>
                  <strong>Delivery Address</strong><br />
                  {order.address}<br />
                  Lucknow, {order.pincode}
                </div>
              </div>

              <div style={{ marginTop: "20px", paddingTop: "15px", borderTop: "1px solid #eee6d8" }}>
                <strong style={{ fontSize: "14px", color: "var(--navy)" }}>Items Purchased (Total: ₹{order.amount})</strong>
                <ul style={{ margin: "10px 0 0 0", paddingLeft: "20px", fontSize: "14px", color: "var(--muted)" }}>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <li key={idx}>{item.quantity}x {item.name}</li>
                    ))
                  ) : (
                    <li>Items not recorded for this order</li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Safely grab user from local storage
  const savedUser = localStorage.getItem("user");
  const loggedInUser = savedUser ? JSON.parse(savedUser) : null;

  useEffect(() => {
    if (!loggedInUser) {
      setLoading(false);
      return;
    }
    
    // Fetch only this specific user's orders
    fetch(`https://house-of-ar-backend.onrender.com/api/my-orders/${loggedInUser.email}`)
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading orders", err);
        setLoading(false);
      });
  }, []);

  if (!loggedInUser) {
    return (
      <div className="page-transition" style={legalContainerStyle}>
        <h2 style={legalHeadingStyle}>Please Log In</h2>
        <p style={legalTextStyle}>You need to be logged in to view your order history.</p>
      </div>
    );
  }

  if (loading) return <div style={legalContainerStyle}>Loading your orders...</div>;

  return (
    <div className="page-transition" style={legalContainerStyle}>
      <h2 style={legalHeadingStyle}>My Orders</h2>
      
      {orders.length === 0 ? (
        <p style={legalTextStyle}>You haven't placed any orders yet. Time to add a little luxury to your life!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {orders.map(order => (
            <div key={order._id} style={{ border: "1px solid #eee6d8", padding: "25px", background: "#fbf9f5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee6d8", paddingBottom: "15px", marginBottom: "15px" }}>
                <strong>Order ID: {order.orderId}</strong>
                <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div>
                <strong style={{ fontSize: "14px", color: "var(--navy)" }}>Total Paid: ₹{order.amount}</strong>
                <ul style={{ margin: "10px 0 15px 0", paddingLeft: "20px", fontSize: "14px", color: "var(--muted)" }}>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, idx) => (
                      <li key={idx}>{item.quantity}x {item.name}</li>
                    ))
                  ) : (
                    <li>Items not recorded for this order</li>
                  )}
                </ul>
                <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                  <strong>Shipped to:</strong> {order.address}, Lucknow {order.pincode}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   REUSABLE UTILITY COMPONENTS
========================================================= */
function ProductCard({ product, toggleWishlist, wishlist, addToCart, openProduct }) {
  return (
    <article className="product-card" onClick={() => openProduct(product)}>
      <div className="product-image-wrapper">
        <img src={product.image} alt={product.name} />
        
        {/* SOLD OUT BADGE */}
        {product.outOfStock && <span className="product-badge-oos">SOLD OUT</span>}
        
        <span className="product-size">30 ML</span>
        <button
          className={`product-wishlist ${wishlist.includes(product.id) ? "active" : ""}`}
          onClick={(event) => { event.stopPropagation(); toggleWishlist(product.id); }}
        >
          <HeartIcon filled={wishlist.includes(product.id)} />
        </button>
        <div className="product-hover">
          {product.outOfStock ? (
            <button className="quick-add out-of-stock-btn" disabled onClick={(e) => e.stopPropagation()}>
              OUT OF STOCK
            </button>
          ) : (
            <button className="quick-add" onClick={(event) => { event.stopPropagation(); addToCart(product); }}>
              ADD TO CART <span>+</span>
            </button>
          )}
        </div>
      </div>
      <div className="product-info">
        <h3>{product.name}</h3><p>{product.subtitle}</p>
        <div className="price"><span className="old-price">₹799</span><span className="sale-price">₹399</span></div>
      </div>
    </article>
  );
}
function MenuColumn({ title, items }) { 
  return (
    <div className="menu-column">
      <h4>{title}</h4>
      {items.map(i => <Link to={i.path} key={i.label}>{i.label}</Link>)}
    </div>
  ); 
}
function FooterColumn({ title, links }) { 
  return (
    <div className="footer-column">
      <h4>{title}</h4>
      {links.map(l => 
        l.path.startsWith("http") || l.path.startsWith("mailto") ? (
          <a href={l.path} key={l.label} target="_blank" rel="noreferrer" style={{display: 'block', marginBottom: '8px'}}>{l.label}</a>
        ) : (
          <Link to={l.path} key={l.label} style={{display: 'block', marginBottom: '8px'}}>{l.label}</Link>
        )
      )}
    </div>
  ); 
}
function SearchIcon() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>); }
function HeartIcon({ filled = false }) { return (<svg viewBox="0 0 24 24" className={filled ? "heart-filled" : ""} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><path d="M20.8 8.7c0 5.5-8.8 10.3-8.8 10.3S3.2 14.2 3.2 8.7C3.2 5.9 5.1 4 7.7 4c1.5 0 2.8.7 3.7 1.9C12.3 4.7 13.6 4 15.1 4c2.6 0 5.7 1.9 5.7 4.7Z" /></svg>); }
function BagIcon() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 8h14l-1 13H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>); }
function MenuIcon() { return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></svg>); } 
export default App;