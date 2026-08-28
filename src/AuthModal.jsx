import { useState } from "react";

export default function AuthModal({ isOpen, onClose, setLoggedInUser }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Use your live Render backend URL here
    const endpoint = isSignUp ? "/api/signup" : "/api/login";
    const url = `https://house-of-ar-backend.onrender.com${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (isSignUp) {
        alert("Account created! Please log in.");
        setIsSignUp(false);
      } else {
        // Save the token and user data to the browser's permanent memory
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setLoggedInUser(data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ backgroundColor: "#1a1a1a", padding: "30px", borderRadius: "8px", width: "90%", maxWidth: "400px", color: "#fff", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "10px", right: "15px", background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}>✕</button>
        
        <h2 style={{ textAlign: "center", marginBottom: "20px", fontFamily: "serif" }}>
          {isSignUp ? "Create Account" : "Welcome Back"}
        </h2>
        
        {error && <p style={{ color: "#ff4444", textAlign: "center", fontSize: "14px" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {isSignUp && (
            <input type="text" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #333", background: "#2a2a2a", color: "#fff" }} />
          )}
          <input type="email" placeholder="Email Address" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #333", background: "#2a2a2a", color: "#fff" }} />
          <input type="password" placeholder="Password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #333", background: "#2a2a2a", color: "#fff" }} />
          
          <button type="submit" style={{ padding: "12px", background: "#cfa968", color: "#000", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}>
            {isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#aaa" }}>
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <span onClick={() => setIsSignUp(!isSignUp)} style={{ color: "#cfa968", cursor: "pointer", textDecoration: "underline" }}>
            {isSignUp ? "Log In" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
}