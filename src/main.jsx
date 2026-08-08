import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createRoot } from "react-dom/client";
import { QRCodeCanvas } from "qrcode.react";

import "./App.css";

/* =========================================================
   HOUSE OF A&R
   MAIN WEBSITE
   ========================================================= */

const WHATSAPP_NUMBER = "9335743731";

/*
  Used internally only for the UPI QR.
  It is NOT displayed anywhere on the website.
*/
const PAYMENT_VPA = "hasanzaidi7949-2@okhdfcbank";

const DELIVERY_UNDER_7KM = 59;
const DELIVERY_ABOVE_7KM = 99;

/*
  Pickup area supplied for the business.
  This is used as the delivery origin.
*/
const PICKUP_QUERY =
  "5/1/5/3, C-5/1, River Bank Colony, Kaiser Bagh, Lucknow, Uttar Pradesh 226018";

/*
  Approximate fallback for River Bank Colony / Kaiser Bagh.
  Normally the app tries to geocode the pickup location first.
*/
const PICKUP_FALLBACK = {
  lat: 26.8515,
  lon: 80.9356,
};


/* =========================================================
   PRODUCTS
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
    price: 399,
    originalPrice: 599,
    available: true,
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
    price: 399,
    originalPrice: 599,
    available: true,
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
    price: 399,
    originalPrice: 599,
    available: true,
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
    price: 399,
    originalPrice: 599,
    available: true,
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
    price: 399,
    originalPrice: 599,
    available: true,
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
    price: 399,
    originalPrice: 599,
    available: true,
    accent: "bloom",
  },

  {
    id: 7,
    number: "07",
    name: "Legacy",
    family: "Elegant · Deep · Timeless",
    description:
      "A distinctive signature fragrance created to leave a lasting impression.",
    image: "/products/legacy.png",
    price: 399,
    originalPrice: 599,
    available: true,
    accent: "legacy",
  },
];


/* =========================================================
   ADDRESS SEARCH
   ========================================================= */

async function searchNominatim(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: query,
      format: "jsonv2",
      addressdetails: "1",
      limit: "6",
      countrycodes: "in",
    });

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Address search failed");
  }

  const data = await response.json();

  return data
    .filter((item) => {
      const text =
        item.display_name?.toLowerCase() || "";

      return text.includes("lucknow");
    })
    .map((item) => ({
      id: `n-${item.place_id}`,
      display_name: item.display_name,
      lat: Number(item.lat),
      lon: Number(item.lon),
    }));
}


async function searchPhoton(query) {
  const url =
    "https://photon.komoot.io/api/?" +
    new URLSearchParams({
      q: query,
      limit: "6",
    });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Photon search failed");
  }

  const data = await response.json();

  return (data.features || [])
    .map((feature, index) => {
      const properties =
        feature.properties || {};

      const coordinates =
        feature.geometry?.coordinates || [];

      const text = [
        properties.name,
        properties.street,
        properties.district,
        properties.city,
        properties.state,
        properties.postcode,
      ]
        .filter(Boolean)
        .join(", ");

      return {
        id: `p-${index}-${coordinates.join("-")}`,
        display_name: text,
        lat: Number(coordinates[1]),
        lon: Number(coordinates[0]),
      };
    })
    .filter((item) =>
      item.display_name
        .toLowerCase()
        .includes("lucknow")
    );
}


function buildSearchQueries(address) {
  const clean =
    address
      .replace(/\s+/g, " ")
      .trim();

  return [
    `${clean}, Lucknow, Uttar Pradesh, India`,
    `${clean}, Lucknow, India`,
    `${clean}, Uttar Pradesh, India`,
    clean,
  ];
}


async function findAddress(address) {
  const queries =
    buildSearchQueries(address);

  /* Nominatim */
  for (const query of queries) {
    try {
      const results =
        await searchNominatim(query);

      if (results.length > 0) {
        return results;
      }
    } catch {
      // Continue.
    }
  }

  /* Photon fallback */
  for (const query of queries) {
    try {
      const results =
        await searchPhoton(query);

      if (results.length > 0) {
        return results;
      }
    } catch {
      // Continue.
    }
  }

  return [];
}


/* =========================================================
   REVERSE GEOCODING
   ========================================================= */

async function reverseGeocode(lat, lon) {
  try {
    const url =
      "https://nominatim.openstreetmap.org/reverse?" +
      new URLSearchParams({
        lat,
        lon,
        format: "jsonv2",
        zoom: "18",
        addressdetails: "1",
      });

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Reverse lookup failed");
    }

    const data =
      await response.json();

    return data.display_name || "";
  } catch {
    return "";
  }
}


/* =========================================================
   PICKUP LOCATION
   ========================================================= */

async function geocodePickup() {
  const queries = [
    PICKUP_QUERY,
    "River Bank Colony, Kaiser Bagh, Lucknow",
    "River Bank Colony, Lucknow, Uttar Pradesh",
    "Kaiser Bagh, Lucknow, Uttar Pradesh",
  ];

  for (const query of queries) {
    try {
      const results =
        await searchNominatim(query);

      if (results.length > 0) {
        return {
          lat: results[0].lat,
          lon: results[0].lon,
        };
      }
    } catch {
      // Continue.
    }
  }

  return PICKUP_FALLBACK;
}


/* =========================================================
   DRIVING DISTANCE
   ========================================================= */

async function calculateDrivingDistance(
  destination,
  pickupRef
) {
  if (
    !destination ||
    !Number.isFinite(destination.lat) ||
    !Number.isFinite(destination.lon)
  ) {
    throw new Error(
      "Invalid destination."
    );
  }

  if (!pickupRef.current) {
    pickupRef.current =
      await geocodePickup();
  }

  const pickup =
    pickupRef.current;

  const routeUrl =
    "https://router.project-osrm.org/route/v1/driving/" +
    `${pickup.lon},${pickup.lat};` +
    `${destination.lon},${destination.lat}` +
    "?overview=false";

  const response =
    await fetch(routeUrl);

  if (!response.ok) {
    throw new Error(
      "Route calculation failed."
    );
  }

  const data =
    await response.json();

  if (
    data.code !== "Ok" ||
    !data.routes ||
    data.routes.length === 0
  ) {
    throw new Error(
      "No driving route found."
    );
  }

  return (
    data.routes[0].distance / 1000
  );
}


/* =========================================================
   UPI QR
   ========================================================= */

function createUPILink(amount, orderText) {
  const params = new URLSearchParams({
    pa: PAYMENT_VPA,
    pn: "House Of A&R",
    am: Number(amount).toFixed(2),
    cu: "INR",
    tn: orderText,
  });

  return `upi://pay?${params.toString()}`;
}


/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const [cart, setCart] = useState([]);

  const [cartOpen, setCartOpen] =
    useState(false);

  const [checkout, setCheckout] =
    useState({
      name: "",
      phone: "",
      address: "",
    });

  const [suggestions, setSuggestions] =
    useState([]);

  const [searching, setSearching] =
    useState(false);

  const [distanceLoading, setDistanceLoading] =
    useState(false);

  const [distanceKm, setDistanceKm] =
    useState(null);

  const [deliveryCharge, setDeliveryCharge] =
    useState(null);

  const [selectedLocation, setSelectedLocation] =
    useState(null);

  const [locationStatus, setLocationStatus] =
    useState("");

  const [locationError, setLocationError] =
    useState("");

  const pickupRef =
    useRef(null);

  const searchTimer =
    useRef(null);


  /* =======================================================
     LIGHT THEME CHANGES ON EACH PAGE LOAD
     ======================================================= */

  useEffect(() => {
    const themes = [
      "theme-cream",
      "theme-lavender",
      "theme-rose",
      "theme-blue",
      "theme-peach",
      "theme-sage",
    ];

    const saved =
      localStorage.getItem(
        "house-ar-theme"
      );

    let nextTheme;

    if (saved) {
      const currentIndex =
        themes.indexOf(saved);

      nextTheme =
        themes[
          (currentIndex + 1) %
            themes.length
        ];
    } else {
      nextTheme = themes[0];
    }

    localStorage.setItem(
      "house-ar-theme",
      nextTheme
    );

    document.body.className =
      nextTheme;

    return () => {
      document.body.className = "";
    };
  }, []);


  /* =======================================================
     CART
     ======================================================= */

  function addToCart(product) {
    setCart((current) => {
      const existing =
        current.find(
          (item) =>
            item.id === product.id
        );

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
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
  }


  function changeQuantity(
    productId,
    amount
  ) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity:
                  item.quantity + amount,
              }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  }


  function removeFromCart(productId) {
    setCart((current) =>
      current.filter(
        (item) =>
          item.id !== productId
      )
    );
  }


  const cartCount = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + item.quantity,
        0
      ),
    [cart]
  );


  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          item.price *
            item.quantity,
        0
      ),
    [cart]
  );


  const total =
    subtotal +
    (deliveryCharge || 0);


  /* =======================================================
     CHECKOUT INPUT
     ======================================================= */

  function updateCheckout(
    field,
    value
  ) {
    setCheckout((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "address") {
      setSelectedLocation(null);
      setDistanceKm(null);
      setDeliveryCharge(null);
      setLocationStatus("");
      setLocationError("");
    }
  }


  /* =======================================================
     ADDRESS SUGGESTIONS
     ======================================================= */

  useEffect(() => {
    const query =
      checkout.address.trim();

    if (
      query.length < 3 ||
      selectedLocation
    ) {
      setSuggestions([]);
      return;
    }

    if (searchTimer.current) {
      clearTimeout(
        searchTimer.current
      );
    }

    searchTimer.current =
      setTimeout(async () => {
        try {
          setSearching(true);

          const results =
            await findAddress(query);

          setSuggestions(
            results.slice(0, 6)
          );
        } catch {
          setSuggestions([]);
        } finally {
          setSearching(false);
        }
      }, 700);

    return () => {
      if (searchTimer.current) {
        clearTimeout(
          searchTimer.current
        );
      }
    };
  }, [
    checkout.address,
    selectedLocation,
  ]);


  /* =======================================================
     SELECT ADDRESS
     ======================================================= */

  async function selectSuggestion(
    suggestion
  ) {
    const destination = {
      lat: Number(
        suggestion.lat
      ),
      lon: Number(
        suggestion.lon
      ),
    };

    setSuggestions([]);

    setSelectedLocation(
      destination
    );

    setCheckout((current) => ({
      ...current,
      address:
        suggestion.display_name,
    }));

    await calculateLocation(
      destination,
      suggestion.display_name
    );
  }


  /* =======================================================
     CALCULATE LOCATION
     ======================================================= */

  async function calculateLocation(
    destination,
    displayAddress = ""
  ) {
    setDistanceLoading(true);
    setLocationError("");

    setLocationStatus(
      "Calculating driving distance..."
    );

    try {
      const km =
        await calculateDrivingDistance(
          destination,
          pickupRef
        );

      const charge =
        km <= 7
          ? DELIVERY_UNDER_7KM
          : DELIVERY_ABOVE_7KM;

      setDistanceKm(km);
      setDeliveryCharge(charge);

      if (displayAddress) {
        setCheckout((current) => ({
          ...current,
          address:
            displayAddress,
        }));
      }

      setLocationStatus(
        `✓ Location confirmed · ${km.toFixed(
          1
        )} km driving distance`
      );
    } catch {
      setDistanceKm(null);
      setDeliveryCharge(null);

      setLocationError(
        "We found the location, but the driving route could not be calculated. Please try again."
      );

      setLocationStatus("");
    } finally {
      setDistanceLoading(false);
    }
  }


  /* =======================================================
     FIND ADDRESS BUTTON
     ======================================================= */

  async function findAndCalculateAddress() {
    const address =
      checkout.address.trim();

    if (address.length < 5) {
      setLocationError(
        "Please enter your delivery address."
      );

      return;
    }

    setLocationError("");
    setDistanceLoading(true);
    setSuggestions([]);

    setLocationStatus(
      "Finding your address..."
    );

    try {
      const results =
        await findAddress(address);

      if (!results.length) {
        throw new Error(
          "Address not found"
        );
      }

      const result =
        results[0];

      const destination = {
        lat: Number(result.lat),
        lon: Number(result.lon),
      };

      setSelectedLocation(
        destination
      );

      setCheckout((current) => ({
        ...current,
        address:
          result.display_name,
      }));

      await calculateLocation(
        destination,
        result.display_name
      );
    } catch {
      setDistanceKm(null);
      setDeliveryCharge(null);
      setSelectedLocation(null);

      setLocationStatus("");

      setLocationError(
        "We couldn't find this address. Please select an address from the suggestions or use your current location."
      );
    } finally {
      setDistanceLoading(false);
    }
  }


  /* =======================================================
     CURRENT GPS LOCATION
     ======================================================= */

  function useCurrentLocation() {
    setLocationError("");
    setLocationStatus(
      "Requesting your current location..."
    );

    if (!navigator.geolocation) {
      setLocationError(
        "Location services are not supported by this browser."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat =
            position.coords.latitude;

          const lon =
            position.coords.longitude;

          const destination = {
            lat,
            lon,
          };

          setSelectedLocation(
            destination
          );

          setLocationStatus(
            "Location found · identifying your address..."
          );

          const address =
            await reverseGeocode(
              lat,
              lon
            );

          if (
            !address
              .toLowerCase()
              .includes("lucknow")
          ) {
            setSelectedLocation(
              null
            );

            throw new Error(
              "Outside Lucknow"
            );
          }

          setCheckout((current) => ({
            ...current,
            address,
          }));

          await calculateLocation(
            destination,
            address
          );
        } catch {
          setDistanceKm(null);
          setDeliveryCharge(null);
          setSelectedLocation(null);

          setLocationError(
            "We could not confirm a Lucknow delivery location. Please search your address manually."
          );

          setLocationStatus("");
        }
      },

      (error) => {
        let message =
          "Unable to get your current location.";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message =
            "Location permission was denied. Please allow location access and try again.";
        }

        if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message =
            "Your device could not determine its location. Please search your address instead.";
        }

        if (
          error.code ===
          error.TIMEOUT
        ) {
          message =
            "Location request timed out. Please try again.";
        }

        setLocationError(message);
        setLocationStatus("");
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }


  /* =======================================================
     PAYMENT
     ======================================================= */

  const orderNumber =
    `A&R-${Date.now()
      .toString()
      .slice(-6)}`;

  const upiLink =
    createUPILink(
      total,
      `House Of A&R Order ${orderNumber}`
    );


  function sendWhatsAppOrder() {
    if (!checkout.name.trim()) {
      alert(
        "Please enter your name."
      );

      return;
    }

    if (
      checkout.phone.replace(
        /\D/g,
        ""
      ).length < 10
    ) {
      alert(
        "Please enter a valid mobile number."
      );

      return;
    }

    if (
      !checkout.address.trim()
    ) {
      alert(
        "Please enter your delivery address."
      );

      return;
    }

    if (
      !selectedLocation ||
      deliveryCharge === null
    ) {
      alert(
        "Please confirm your delivery location first."
      );

      return;
    }

    const productText =
      cart
        .map(
          (item) =>
            `${item.name} × ${item.quantity} = ₹${
              item.price *
              item.quantity
            }`
        )
        .join("\n");

    const message = [
      "HOUSE OF A&R — NEW ORDER",
      "",
      `Customer: ${checkout.name}`,
      `Phone: ${checkout.phone}`,
      "",
      "Products:",
      productText,
      "",
      `Products Total: ₹${subtotal}`,
      `Driving Distance: ${distanceKm.toFixed(
        1
      )} km`,
      `Delivery: ₹${deliveryCharge}`,
      `Order Total: ₹${total}`,
      "",
      "Delivery Address:",
      checkout.address,
      "",
      "Payment: UPI QR",
      "",
      "Customer has completed the order from the website.",
    ].join("\n");

    const url =
      `https://wa.me/91${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        message
      )}`;

    window.open(
      url,
      "_blank"
    );
  }


  /* =======================================================
     NAVIGATION
     ======================================================= */

  function goTo(id) {
    const element =
      document.getElementById(id);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="site-shell">

      {/* ===================================================
          TOP BAR
          =================================================== */}

      <div className="top-bar">
        <span>HOUSE OF A&amp;R</span>
        <span className="top-dot">•</span>
        <span>NOW DELIVERING IN LUCKNOW</span>
        <span className="top-dot">•</span>
        <span>LAUNCH SALE · 30 ML ₹399</span>
      </div>


      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="site-header">

        <button
          className="brand"
          onClick={() =>
            goTo("home")
          }
          aria-label="House of A&R home"
        >
          <img
            src="/logo.jpeg"
            alt="House of A&R"
          />
        </button>


        <nav className="desktop-nav">

          <button
            onClick={() =>
              goTo("home")
            }
          >
            HOME
          </button>

          <button
            onClick={() =>
              goTo("collection")
            }
          >
            COLLECTION
          </button>

          <button
            onClick={() =>
              goTo("story")
            }
          >
            OUR STORY
          </button>

          <button
            onClick={() =>
              goTo("contact")
            }
          >
            CONTACT
          </button>

        </nav>


        <div className="header-actions">

          <button
            className="cart-button"
            onClick={() =>
              setCartOpen(true)
            }
          >
            <span>🛒</span>
            CART

            {cartCount > 0 && (
              <strong className="cart-count">
                {cartCount}
              </strong>
            )}
          </button>

          <button
            className="explore-button"
            onClick={() =>
              goTo("collection")
            }
          >
            EXPLORE
          </button>

        </div>

      </header>


      {/* ===================================================
          DELIVERY NOTICE
          =================================================== */}

      <div className="delivery-notice">

        <span className="notice-label">
          DELIVERY AREA
        </span>

        <span>
          Currently available in
          Lucknow only
        </span>

      </div>


      {/* ===================================================
          HERO
          =================================================== */}

      <main>

        <section
          id="home"
          className="hero-section"
        >

          <div className="hero-content">

            <p className="eyebrow">
              HOUSE OF A&amp;R · FINE FRAGRANCES
            </p>

            <h1>
              Leave a
              <em> lasting </em>
              impression.
            </h1>

            <p className="hero-description">
              Discover thoughtfully
              crafted fragrances
              designed to become
              part of your signature.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                goTo("collection")
              }
            >
              EXPLORE COLLECTION
              <span>→</span>
            </button>

          </div>


          <div className="hero-visual">

            <div className="hero-glow" />

            <div className="logo-orbit">
              <img
                src="/logo.jpeg"
                alt="House of A&R Fine Fragrances"
              />
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
                <em> signature.</em>
              </h2>
            </div>

            <p className="section-intro">
              Seven distinct
              fragrances. One
              signature house.
            </p>

          </div>


          <div className="collection-grid">

            {PRODUCTS.map(
              (product) => (
                <article
                  className={`product-card ${product.accent}`}
                  key={product.id}
                >

                  <div className="product-image-wrap">

                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                      loading={
                        product.id <= 3
                          ? "eager"
                          : "lazy"
                      }
                    />

                  </div>


                  <div className="product-info">

                    <span className="product-number">
                      {product.number}
                    </span>

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

                      <div>

                        <span className="sale-label">
                          30 ML · LAUNCH SALE
                        </span>

                        <div className="price-row">

                          <del>
                            ₹599
                          </del>

                          <strong>
                            ₹399
                          </strong>

                        </div>

                      </div>


                      <button
                        className="add-button"
                        onClick={() =>
                          addToCart(
                            product
                          )
                        }
                      >
                        ADD TO CART →
                      </button>

                    </div>

                  </div>

                </article>
              )
            )}

          </div>


          <div className="sizes-banner">

            <div>
              <strong>
                30 ML
              </strong>
              <span>
                AVAILABLE NOW
              </span>
            </div>

            <div>
              <strong>
                15 ML
              </strong>
              <span>
                COMING SOON
              </span>
            </div>

            <div>
              <strong>
                50 ML
              </strong>
              <span>
                COMING SOON
              </span>
            </div>

          </div>

        </section>


        {/* =================================================
            STORY
            ================================================= */}

        <section
          id="story"
          className="story-section"
        >

          <div className="story-image">
            <img
              src="/logo.jpeg"
              alt="House of A&R"
            />
          </div>

          <div className="story-content">

            <p className="eyebrow">
              OUR STORY
            </p>

            <h2>
              Fragrance,
              <em> beautifully personal.</em>
            </h2>

            <p>
              House of A&amp;R was created
              around a simple idea:
              fragrance should feel
              personal, memorable and
              effortlessly elegant.
            </p>

            <p>
              Each fragrance in our
              collection has its own
              character, mood and story —
              created for different
              moments and different
              signatures.
            </p>

            <div className="story-signature">
              HOUSE OF A&amp;R
              <span>
                FINE FRAGRANCES
              </span>
            </div>

          </div>

        </section>


        {/* =================================================
            CONTACT
            ================================================= */}

        <section
          id="contact"
          className="contact-section"
        >

          <div>

            <p className="eyebrow">
              CONTACT
            </p>

            <h2>
              Need help choosing
              <em> your fragrance?</em>
            </h2>

            <p>
              We currently deliver
              across Lucknow.
              Message us directly
              for fragrance guidance
              or order assistance.
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


      {/* ===================================================
          CART OVERLAY
          =================================================== */}

      {cartOpen && (
        <div
          className="cart-overlay"
          onClick={() =>
            setCartOpen(false)
          }
        >

          <aside
            className="cart-drawer"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="cart-header">

              <div>
                <p className="eyebrow">
                  YOUR SELECTION
                </p>

                <h2>
                  Cart
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() =>
                  setCartOpen(false)
                }
              >
                ×
              </button>

            </div>


            {cart.length === 0 ? (

              <div className="empty-cart">

                <span>
                  ✦
                </span>

                <h3>
                  Your cart is empty.
                </h3>

                <p>
                  Discover a fragrance
                  and make it yours.
                </p>

                <button
                  className="primary-button"
                  onClick={() => {
                    setCartOpen(false);
                    goTo("collection");
                  }}
                >
                  EXPLORE COLLECTION
                </button>

              </div>

            ) : (

              <div className="cart-content">

                {/* CART ITEMS */}

                <div className="cart-items">

                  {cart.map(
                    (item) => (
                      <div
                        className="cart-item"
                        key={item.id}
                      >

                        <img
                          src={item.image}
                          alt={item.name}
                        />

                        <div className="cart-item-info">

                          <span>
                            30 ML
                          </span>

                          <h3>
                            {item.name}
                          </h3>

                          <strong>
                            ₹{item.price}
                          </strong>


                          <div className="quantity-row">

                            <button
                              onClick={() =>
                                changeQuantity(
                                  item.id,
                                  -1
                                )
                              }
                            >
                              −
                            </button>

                            <span>
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                changeQuantity(
                                  item.id,
                                  1
                                )
                              }
                            >
                              +
                            </button>

                            <button
                              className="remove-button"
                              onClick={() =>
                                removeFromCart(
                                  item.id
                                )
                              }
                            >
                              REMOVE
                            </button>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>


                {/* CHECKOUT */}

                <div className="checkout-section">

                  <div className="checkout-title">
                    <span className="eyebrow">
                      DELIVERY DETAILS
                    </span>

                    <h2>
                      Complete your order
                    </h2>

                    <p>
                      Delivery is currently
                      available in Lucknow only.
                    </p>
                  </div>


                  {/* NAME */}

                  <label>
                    FULL NAME

                    <input
                      type="text"
                      value={
                        checkout.name
                      }
                      onChange={(event) =>
                        updateCheckout(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Your full name"
                      autoComplete="name"
                    />

                  </label>


                  {/* PHONE */}

                  <label>
                    MOBILE NUMBER

                    <input
                      type="tel"
                      value={
                        checkout.phone
                      }
                      onChange={(event) =>
                        updateCheckout(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="10-digit mobile number"
                      autoComplete="tel"
                      inputMode="tel"
                    />

                  </label>


                  {/* LOCATION */}

                  <div className="location-box">

                    <p className="eyebrow">
                      DELIVERY LOCATION
                    </p>

                    <h3>
                      Where should we
                      deliver?
                    </h3>


                    <button
                      className="location-button"
                      onClick={
                        useCurrentLocation
                      }
                    >
                      📍 USE MY CURRENT LOCATION
                    </button>


                    <div className="or-divider">
                      <span>
                        OR SEARCH ADDRESS
                      </span>
                    </div>


                    <div className="address-search">

                      <textarea
                        value={
                          checkout.address
                        }
                        onChange={(event) =>
                          updateCheckout(
                            "address",
                            event.target.value
                          )
                        }
                        placeholder="Start typing your delivery address..."
                        rows="3"
                        autoComplete="street-address"
                      />


                      {searching && (
                        <div className="search-status">
                          Searching Lucknow
                          addresses...
                        </div>
                      )}


                      {suggestions.length >
                        0 && (
                        <div className="suggestions">

                          {suggestions.map(
                            (
                              suggestion
                            ) => (
                              <button
                                key={
                                  suggestion.id
                                }
                                onClick={() =>
                                  selectSuggestion(
                                    suggestion
                                  )
                                }
                              >
                                <span>
                                  📍
                                </span>

                                <span>
                                  {
                                    suggestion.display_name
                                  }
                                </span>
                              </button>
                            )
                          )}

                        </div>
                      )}

                    </div>


                    <button
                      className="calculate-button"
                      onClick={
                        findAndCalculateAddress
                      }
                      disabled={
                        distanceLoading
                      }
                    >
                      {distanceLoading
                        ? "CALCULATING..."
                        : "CONFIRM ADDRESS & CALCULATE DELIVERY"}
                    </button>


                    {locationStatus && (
                      <div className="location-success">
                        {locationStatus}
                      </div>
                    )}


                    {locationError && (
                      <div className="location-error">
                        {locationError}
                      </div>
                    )}


                    {distanceKm !== null &&
                      deliveryCharge !==
                        null && (
                        <div className="delivery-result">

                          <div>
                            <span>
                              DRIVING DISTANCE
                            </span>

                            <strong>
                              {distanceKm.toFixed(
                                1
                              )}{" "}
                              km
                            </strong>
                          </div>

                          <div>
                            <span>
                              DELIVERY CHARGE
                            </span>

                            <strong>
                              ₹
                              {
                                deliveryCharge
                              }
                            </strong>
                          </div>

                        </div>
                      )}

                  </div>


                  {/* ORDER SUMMARY */}

                  <div className="order-summary">

                    <div>
                      <span>
                        Products
                      </span>

                      <strong>
                        ₹{subtotal}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Delivery
                      </span>

                      <strong>
                        {deliveryCharge !==
                        null
                          ? `₹${deliveryCharge}`
                          : "—"}
                      </strong>
                    </div>


                    <div className="summary-total">

                      <span>
                        TOTAL
                      </span>

                      <strong>
                        ₹{total}
                      </strong>

                    </div>

                  </div>


                  {/* PAYMENT */}

                  <div className="payment-section">

                    <p className="eyebrow">
                      SECURE UPI PAYMENT
                    </p>

                    <h2>
                      Scan &amp; Pay
                    </h2>

                    <p>
                      Scan the QR code using
                      Google Pay, PhonePe,
                      Paytm or another UPI
                      app.
                    </p>


                    <div className="qr-wrapper">

                      <QRCodeCanvas
                        value={upiLink}
                        size={220}
                        level="H"
                        includeMargin={true}
                      />

                    </div>


                    <div className="payment-note">
                      PAYMENT AMOUNT
                      <strong>
                        ₹{total}
                      </strong>
                    </div>


                    <button
                      className="whatsapp-order-button"
                      onClick={
                        sendWhatsAppOrder
                      }
                    >
                      I HAVE COMPLETED PAYMENT
                      <span>→</span>
                    </button>


                    <p className="payment-small">
                      After completing payment,
                      tap the button above to
                      send your order details
                      on WhatsApp.
                    </p>

                  </div>

                </div>

              </div>
            )}

          </aside>

        </div>
      )}


      {/* ===================================================
          FOOTER
          =================================================== */}

      <footer className="site-footer">

        <div>

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
          <span>
            CURRENTLY DELIVERING IN
          </span>

          <strong>
            LUCKNOW ONLY
          </strong>
        </div>


        <div>
          <span>
            WHATSAPP
          </span>

          <strong>
            +91 {WHATSAPP_NUMBER}
          </strong>
        </div>


        <div className="copyright">
          © {new Date().getFullYear()}
          {" "}
          House of A&amp;R.
          All rights reserved.
        </div>

      </footer>

    </div>
  );
}


/* =========================================================
   START REACT
   ========================================================= */

createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);