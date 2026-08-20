import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { QRCodeCanvas } from "qrcode.react";
import "./App.css";

/* =========================================================
   HOUSE OF A&R — WEBSITE CONFIG
   ========================================================= */

const WHATSAPP_NUMBER = "9125289227";

/*
  Used only inside the UPI QR.
  The UPI ID is intentionally NOT printed anywhere on the site.
*/
const PAYMENT_VPA = "hasanzaidi7949-2@okhdfcbank";

const PRODUCT_PRICE = 399;
const ORIGINAL_PRICE = 599;
const DELIVERY_CHARGE = 59;

/* =========================================================
   CURRENT COLLECTION
   ========================================================= */

const PRODUCTS = [
  {
    id: 1,
    number: "01",
    name: "Lavendra Noir",
    family: "Calming · Elegant · Timeless",
    description:
      "A refined lavender fragrance with a graceful and sophisticated character.",
    image: "/products/lavendra-noir.png",
    price: PRODUCT_PRICE,
    originalPrice: ORIGINAL_PRICE,
    accent: "lavender",
  },
  {
    id: 2,
    number: "02",
    name: "Blush Noir",
    family: "Floral · Romantic · Alluring",
    description:
      "A romantic floral fragrance created to leave a soft and memorable impression.",
    image: "/products/blush-noir.png",
    price: PRODUCT_PRICE,
    originalPrice: ORIGINAL_PRICE,
    accent: "blush",
  },
  {
    id: 3,
    number: "03",
    name: "Ivory Oudh",
    family: "Woody · Rich · Sophisticated",
    description:
      "A warm and elegant interpretation of timeless oudh with a refined character.",
    image: "/products/ivory-oudh.png",
    price: PRODUCT_PRICE,
    originalPrice: ORIGINAL_PRICE,
    accent: "ivory",
  },
  {
    id: 4,
    number: "04",
    name: "Velvet Ember",
    family: "Warm · Spicy · Intense",
    description:
      "A deep and captivating fragrance with a warm, mysterious and confident character.",
    image: "/products/velvet-ember.png",
    price: PRODUCT_PRICE,
    originalPrice: ORIGINAL_PRICE,
    accent: "ember",
  },
  {
    id: 5,
    number: "05",
    name: "Azure Oud",
    family: "Fresh · Aquatic · Refined",
    description:
      "A fresh and sophisticated oud fragrance with an elegant aquatic character.",
    image: "/products/azure-oud.png",
    price: PRODUCT_PRICE,
    originalPrice: ORIGINAL_PRICE,
    accent: "azure",
  },
  {
    id: 6,
    number: "06",
    name: "Velvet Bloom",
    family: "Floral · Soft · Feminine",
    description:
      "A graceful floral fragrance designed around softness, elegance and charm.",
    image: "/products/velvet-bloom.png",
    price: PRODUCT_PRICE,
    originalPrice: ORIGINAL_PRICE,
    accent: "bloom",
  },
  {
    id: 7,
    number: "07",
    name: "Legacy",
    family: "Classic · Deep · Distinctive",
    description:
      "A composed fragrance built around depth, warmth and a timeless signature.",
    image: "/products/legacy.png",
    price: PRODUCT_PRICE,
    originalPrice: ORIGINAL_PRICE,
    accent: "legacy",
  },
];

/* =========================================================
   FUTURE LAUNCH ADVERTISEMENT
   These are teaser images only — not purchasable yet.
   ========================================================= */

const FUTURE_LAUNCH = [
  {
    id: 1,
    image: "/future-launch/launch-01.jpg",
    kicker: "COMING SOON",
    title: "Pillow Mist & Curtain Mist",
    text: "A new way to refresh your everyday spaces.",
  },
  {
    id: 2,
    image: "/future-launch/launch-02.jpg",
    kicker: "THE NEXT CHAPTER",
    title: "Refresh Your Space",
    text: "Designed for pillows, curtains and the atmosphere around you.",
  },
  {
    id: 3,
    image: "/future-launch/launch-03.jpg",
    kicker: "HOUSE OF A&R",
    title: "Something New Is Coming Home",
    text: "Meet the next House of A&R home-fragrance experience soon.",
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function createPaymentQR(total, orderNumber) {
  const params = new URLSearchParams({
    pa: PAYMENT_VPA,
    pn: "House Of A&R",
    am: Number(total).toFixed(2),
    cu: "INR",
    tn: `House Of A&R ${orderNumber}`,
  });

  return `upi://pay?${params.toString()}`;
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [checkout, setCheckout] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const total = subtotal + (cart.length ? DELIVERY_CHARGE : 0);

  const orderNumber = useMemo(
    () => `A&R-${Date.now().toString().slice(-6)}`,
    [cartOpen]
  );

  const upiLink = createPaymentQR(
    total || PRODUCT_PRICE,
    orderNumber
  );

  function updateCheckout(field, value) {
    setCheckout((current) => ({
      ...current,
      [field]: value,
    }));
    setPaymentConfirmed(false);
    setOrderSent(false);
  }

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find(
        (item) => item.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    setCartOpen(true);
    setPaymentConfirmed(false);
    setOrderSent(false);
  }

  function changeQuantity(productId, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity + amount,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
    setPaymentConfirmed(false);
    setOrderSent(false);
  }

  function removeFromCart(productId) {
    setCart((current) =>
      current.filter((item) => item.id !== productId)
    );
    setPaymentConfirmed(false);
    setOrderSent(false);
  }

  function closeCart() {
    setCartOpen(false);
  }

  function validateCheckout() {
    const phone = checkout.phone.replace(/\D/g, "");

    if (!cart.length) {
      alert("Your cart is empty.");
      return false;
    }

    if (!checkout.name.trim()) {
      alert("Please enter your full name.");
      return false;
    }

    if (phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return false;
    }

    if (!checkout.address.trim()) {
      alert("Please enter your complete delivery address.");
      return false;
    }

    if (!paymentConfirmed) {
      alert(
        "Please complete the QR payment and then tap 'Payment completed'."
      );
      return false;
    }

    return true;
  }

  function sendWhatsAppOrder() {
    if (!validateCheckout()) return;

    const orderItems = cart
      .map(
        (item) =>
          `• ${item.name} × ${item.quantity} — ${formatCurrency(
            item.price * item.quantity
          )}`
      )
      .join("\n");

    const message = [
      "HOUSE OF A&R — NEW ORDER",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "CUSTOMER",
      `Name: ${checkout.name.trim()}`,
      `Mobile: ${checkout.phone}`,
      "",
      "DELIVERY ADDRESS",
      checkout.address.trim(),
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "ORDER",
      orderItems,
      "",
      `Products: ${formatCurrency(subtotal)}`,
      `Delivery: ${formatCurrency(DELIVERY_CHARGE)}`,
      `TOTAL: ${formatCurrency(total)}`,
      "",
      "PAYMENT STATUS",
      "✓ Customer confirms payment completed via QR.",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      "",
      "Please confirm the order.",
      "",
      "Thank you.",
      "House of A&R",
      "Same-day delivery in Lucknow.",
    ].join("\n");

    const url =
      `https://wa.me/91${WHATSAPP_NUMBER}` +
      `?text=${encodeURIComponent(message)}`;

    setOrderSent(true);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="site-shell">

      {/* =================================================
          ANNOUNCEMENT
          ================================================= */}

      <div className="top-bar">
        <span>HOUSE OF A&amp;R</span>
        <i>•</i>
        <span>NOW DELIVERING IN LUCKNOW</span>
        <i>•</i>
        <span>30 ML · LAUNCH OFFER · ₹399</span>
      </div>

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="site-header">
        <div className="header-inner">

          <button
            className="header-brand"
            onClick={() => scrollToSection("home")}
            aria-label="Go to House of A&R home"
          >
            <img
              src="/logo.jpeg"
              alt="House of A&R"
            />
          </button>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <button onClick={() => scrollToSection("home")}>
              HOME
            </button>
            <button onClick={() => scrollToSection("collection")}>
              COLLECTION
            </button>
            <button onClick={() => scrollToSection("future")}>
              THE NEXT CHAPTER
            </button>
            <button onClick={() => scrollToSection("story")}>
              OUR STORY
            </button>
            <button onClick={() => scrollToSection("contact")}>
              CONTACT
            </button>
          </nav>

          <div className="header-actions">
            <button
              className="cart-button"
              onClick={() => setCartOpen(true)}
            >
              CART
              {cartCount > 0 && (
                <span className="cart-count">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              className="shop-button"
              onClick={() => scrollToSection("collection")}
            >
              SHOP NOW
            </button>
          </div>

        </div>
      </header>

      <main>

        {/* =================================================
            HERO
            ================================================= */}

        <section id="home" className="hero-section">

          <div className="hero-content">

            <div className="hero-copy">

              <p className="eyebrow">
                HOUSE OF A&amp;R · FINE FRAGRANCES
              </p>

              <h1>
                Find your
                <br />
                <em>signature.</em>
              </h1>

              <p className="hero-subtitle">
                Fine fragrances, made to be remembered.
              </p>

              <p className="hero-description">
                Discover refined fragrances created for
                different moods, moments and personalities.
              </p>

              <button
                className="primary-button"
                onClick={() => scrollToSection("collection")}
              >
                EXPLORE THE COLLECTION
                <span>→</span>
              </button>

              <div className="hero-stats">
                <div>
                  <strong>₹399</strong>
                  <span>30 ML LAUNCH PRICE</span>
                </div>

                <div>
                  <strong>30 ML</strong>
                  <span>FINE FRAGRANCE</span>
                </div>

                <div>
                  <strong>₹59</strong>
                  <span>LUCKNOW DELIVERY</span>
                </div>
              </div>

            </div>

            {/* Refined, centered logo presentation */}
            <div className="hero-visual">

              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />

              <div className="hero-logo-halo">

                <div className="hero-logo-circle">

                  <img
                    src="/logo.jpeg"
                    alt="House of A&R Fine Fragrances"
                  />

                </div>

                <div className="hero-logo-label">
                  <span>THE HOUSE OF</span>
                  <strong>FINE FRAGRANCES</strong>
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            COLLECTION
            ================================================= */}

        <section
          id="collection"
          className="collection-section"
        >

          <div className="section-heading">

            <div>
              <p className="eyebrow">
                THE COLLECTION
              </p>

              <h2>
                Discover your
                <br />
                <em>signature.</em>
              </h2>
            </div>

            <p>
              Refined fragrances for different moods, moments
              and personalities. Every bottle is 30 ml.
            </p>

          </div>

          <div className="collection-grid">

            {PRODUCTS.map((product) => (

              <article
                className={`product-card ${product.accent}`}
                key={product.id}
              >

                <div className="product-image-wrap">

                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image"
                    loading={product.id <= 3 ? "eager" : "lazy"}
                  />

                  <span className="product-badge">
                    30 ML
                  </span>

                </div>

                <div className="product-info">

                  {product.number !== "07" && (
                    <span className="product-number">
                      {product.number}
                    </span>
                  )}

                  <h3>
                    {product.name}
                  </h3>

                  <p className="product-family">
                    {product.family}
                  </p>

                  <p className="product-description">
                    {product.description}
                  </p>

                  <div className="product-bottom">

                    <div className="price-area">

                      <small>
                        LAUNCH OFFER
                      </small>

                      <div>
                        <del>
                          ₹{product.originalPrice}
                        </del>

                        <strong>
                          ₹{product.price}
                        </strong>
                      </div>

                    </div>

                    <button
                      className="add-button"
                      onClick={() => addToCart(product)}
                    >
                      ADD TO CART
                      <span>→</span>
                    </button>

                  </div>

                </div>

              </article>

            ))}

          </div>

          <div className="collection-note">
            <div>
              <strong>30 ML</strong>
              <span>AVAILABLE NOW</span>
            </div>

            <div>
              <strong>₹399</strong>
              <span>LAUNCH PRICE</span>
            </div>

            <div>
              <strong>₹59</strong>
              <span>LUCKNOW DELIVERY</span>
            </div>
          </div>

        </section>

        {/* =================================================
            FUTURE LAUNCH — MOVING ADVERTISEMENT
            ================================================= */}

        <section
          id="future"
          className="future-section"
        >

          <div className="future-heading">

            <div>
              <p className="eyebrow">
                THE NEXT CHAPTER
              </p>

              <h2>
                Something new
                <br />
                <em>is coming home.</em>
              </h2>
            </div>

            <p>
              A first look at what House of A&amp;R is preparing
              next. These preview pieces are not available for
              purchase yet.
            </p>

          </div>

          <div className="future-marquee">

            <div className="future-track">

              {[...FUTURE_LAUNCH, ...FUTURE_LAUNCH].map(
                (item, index) => (

                  <article
                    className="future-ad-card"
                    key={`${item.id}-${index}`}
                  >

                    <div className="future-ad-image">

                      <img
                        src={item.image}
                        alt={item.title}
                        draggable="false"
                      />

                      <span className="future-ad-badge">
                        {item.kicker}
                      </span>

                      <div className="future-ad-overlay">
                        <span>HOUSE OF A&amp;R</span>
                        <strong>{item.title}</strong>
                        <small>{item.text}</small>
                      </div>

                    </div>

                  </article>

                )
              )}

            </div>

          </div>

          <div className="future-launch-strip">

            <div>
              <span>COMING SOON</span>
              <strong>Pillow Mist</strong>
            </div>

            <div className="future-strip-dot">•</div>

            <div>
              <span>COMING SOON</span>
              <strong>Curtain Mist</strong>
            </div>

            <div className="future-strip-dot">•</div>

            <div>
              <span>HOUSE OF A&amp;R</span>
              <strong>A new way to refresh your space.</strong>
            </div>

          </div>

        </section>

        {/* =================================================
            STORY
            ================================================= */}

        <section id="story" className="story-section">

          <div className="story-logo">

            <div className="story-logo-frame">

              <img
                src="/logo.jpeg"
                alt="House of A&R"
              />

            </div>

          </div>

          <div className="story-copy">

            <p className="eyebrow">
              OUR STORY
            </p>

            <h2>
              Fragrance,
              <br />
              <em>beautifully personal.</em>
            </h2>

            <p>
              House of A&amp;R was created around a simple idea:
              fragrance should feel personal, memorable and
              effortlessly elegant.
            </p>

            <p>
              Each fragrance has its own character, mood and
              story — created for different moments and different
              signatures.
            </p>

            <div className="story-signature">
              HOUSE OF A&amp;R
              <span>FINE FRAGRANCES · LUCKNOW</span>
            </div>

          </div>

        </section>

        {/* =================================================
            ORDER EXPERIENCE
            ================================================= */}

        <section className="experience-section">

          <div>
            <span>01</span>
            <strong>Choose your scent</strong>
            <p>
              Explore the collection and add your favourites to cart.
            </p>
          </div>

          <div>
            <span>02</span>
            <strong>Scan &amp; pay</strong>
            <p>
              Complete your payment using the secure QR shown at checkout.
            </p>
          </div>

          <div>
            <span>03</span>
            <strong>WhatsApp confirmation</strong>
            <p>
              Send the prepared order details directly to House of A&amp;R.
            </p>
          </div>

          <div>
            <span>04</span>
            <strong>Same-day delivery</strong>
            <p>
              Orders are prepared for same-day delivery in Lucknow after confirmation.
            </p>
          </div>

        </section>

        {/* =================================================
            CONTACT
            ================================================= */}

        <section id="contact" className="contact-section">

          <div>

            <p className="eyebrow">
              CONTACT HOUSE OF A&amp;R
            </p>

            <h2>
              Need help choosing
              <br />
              <em>your fragrance?</em>
            </h2>

            <p>
              Message us directly for fragrance guidance,
              order assistance or upcoming launch updates.
            </p>

          </div>

          <a
            className="whatsapp-button"
            href={`https://wa.me/91${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
          >
            CHAT ON WHATSAPP
            <span>→</span>
          </a>

        </section>

      </main>

      {/* =================================================
          CART
          ================================================= */}

      {cartOpen && (

        <div
          className="modal-overlay"
          onClick={closeCart}
        >

          <aside
            className="cart-panel"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="panel-header">

              <div>
                <p className="eyebrow">
                  YOUR SELECTION
                </p>

                <h2>
                  Your Cart
                </h2>
              </div>

              <button
                className="close-button"
                onClick={closeCart}
                aria-label="Close cart"
              >
                ×
              </button>

            </div>

            {!cart.length ? (

              <div className="empty-cart">

                <h3>
                  Your cart is empty.
                </h3>

                <p>
                  Discover a fragrance and make it yours.
                </p>

                <button
                  className="primary-button"
                  onClick={() => {
                    closeCart();
                    scrollToSection("collection");
                  }}
                >
                  EXPLORE COLLECTION
                </button>

              </div>

            ) : (

              <div className="cart-content">

                <div className="cart-products">

                  {cart.map((item) => (

                    <div
                      className="cart-product"
                      key={item.id}
                    >

                      <div className="cart-image">
                        <img
                          src={item.image}
                          alt={item.name}
                        />
                      </div>

                      <div className="cart-product-details">

                        <span className="cart-number">
                          {item.number}
                        </span>

                        <h3>
                          {item.name}
                        </h3>

                        <p>
                          30 ML · {formatCurrency(item.price)}
                        </p>

                        <div className="quantity-control">

                          <button
                            onClick={() =>
                              changeQuantity(item.id, -1)
                            }
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>

                          <span>
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              changeQuantity(item.id, 1)
                            }
                            aria-label="Increase quantity"
                          >
                            +
                          </button>

                        </div>

                        <button
                          className="remove-button"
                          onClick={() =>
                            removeFromCart(item.id)
                          }
                        >
                          REMOVE
                        </button>

                      </div>

                      <strong className="cart-item-total">
                        {formatCurrency(
                          item.price * item.quantity
                        )}
                      </strong>

                    </div>

                  ))}

                </div>

                <div className="checkout-section">

                  <div className="checkout-title">

                    <span className="eyebrow">
                      CHECKOUT
                    </span>

                    <h2>
                      Complete your order
                    </h2>

                    <p>
                      Delivery is currently available in Lucknow only.
                    </p>

                  </div>

                  <label>
                    FULL NAME
                    <input
                      type="text"
                      value={checkout.name}
                      onChange={(event) =>
                        updateCheckout(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Enter your full name"
                      autoComplete="name"
                    />
                  </label>

                  <label>
                    MOBILE NUMBER
                    <input
                      type="tel"
                      value={checkout.phone}
                      onChange={(event) =>
                        updateCheckout(
                          "phone",
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10)
                        )
                      }
                      placeholder="10-digit mobile number"
                      autoComplete="tel"
                      inputMode="numeric"
                    />
                  </label>

                  <label>
                    COMPLETE DELIVERY ADDRESS
                    <textarea
                      value={checkout.address}
                      onChange={(event) =>
                        updateCheckout(
                          "address",
                          event.target.value
                        )
                      }
                      placeholder="House / Flat, Street, Colony, Landmark, Lucknow, PIN code"
                      autoComplete="street-address"
                    />
                  </label>

                  <div className="manual-address-note">
                    <span>✓</span>
                    <div>
                      <strong>Enter your address manually</strong>
                      <small>
                        No Google Maps account or paid Maps service is required.
                      </small>
                    </div>
                  </div>

                  <div className="order-summary">

                    <div>
                      <span>Products</span>
                      <strong>{formatCurrency(subtotal)}</strong>
                    </div>

                    <div>
                      <span>Lucknow delivery</span>
                      <strong>{formatCurrency(DELIVERY_CHARGE)}</strong>
                    </div>

                    <div className="summary-total">
                      <span>TOTAL</span>
                      <strong>{formatCurrency(total)}</strong>
                    </div>

                  </div>

                  <div className="payment-section">

                    <p className="eyebrow">
                      SIMPLE QR PAYMENT
                    </p>

                    <h2>
                      Scan &amp; Pay
                    </h2>

                    <p className="payment-description">
                      Scan this QR code using Google Pay,
                      PhonePe, Paytm or another UPI app.
                    </p>

                    <div className="qr-wrapper">
                      <QRCodeCanvas
                        value={upiLink}
                        size={235}
                        level="H"
                        includeMargin
                      />
                    </div>

                    <div className="payment-amount">
                      <span>AMOUNT TO PAY</span>
                      <strong>{formatCurrency(total)}</strong>
                    </div>

                    <button
                      className={
                        paymentConfirmed
                          ? "payment-confirmed"
                          : "payment-confirm-button"
                      }
                      onClick={() =>
                        setPaymentConfirmed(true)
                      }
                    >
                      {paymentConfirmed
                        ? "✓ PAYMENT COMPLETED"
                        : "I HAVE COMPLETED PAYMENT"}
                    </button>

                    {paymentConfirmed && (
                      <div className="payment-success">
                        <strong>
                          Payment marked as completed.
                        </strong>

                        <span>
                          Your order details are ready to send to House of A&amp;R.
                        </span>
                      </div>
                    )}

                  </div>

                  <button
                    className="whatsapp-order-button"
                    onClick={sendWhatsAppOrder}
                  >
                    SEND ORDER ON WHATSAPP
                    <span>→</span>
                  </button>

                  {orderSent && (
                    <div className="order-sent">
                      <strong>
                        Order details prepared.
                      </strong>

                      <span>
                        WhatsApp has been opened with your order information.
                      </span>
                    </div>
                  )}

                  <p className="checkout-note">
                    After payment, tap “I Have Completed Payment”
                    and then send your order on WhatsApp.
                    Same-day delivery in Lucknow.
                  </p>

                </div>

              </div>
            )}

          </aside>

        </div>
      )}

      {/* =================================================
          FOOTER
          ================================================= */}

      <footer className="site-footer">

        <div className="footer-brand">

          <img
            src="/logo.jpeg"
            alt="House of A&R"
          />

          <p>
            HOUSE OF A&amp;R
            <br />
            FINE FRAGRANCES
          </p>

        </div>

        <div>
          <span>DELIVERY</span>
          <strong>LUCKNOW ONLY</strong>
        </div>

        <div>
          <span>ORDER SUPPORT</span>
          <strong>WHATSAPP</strong>
        </div>

        <div className="copyright">
          © {new Date().getFullYear()} House of A&amp;R · Fine Fragrances · Lucknow
        </div>

      </footer>

    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);