import { useState } from "react";

export default function AuthModal({ isOpen, onClose, setLoggedInUser, setWishlist, setCartItems }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    const endpoint = isSignUp ? "/api/signup" : "/api/login";
    const url = `https://house-of-ar-backend.onrender.com${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Something went wrong");

      if (isSignUp) {
        alert("Account created! Please log in.");
        setIsSignUp(false);
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setLoggedInUser(data.user);
        if (setWishlist && data.user.wishlist) setWishlist(data.user.wishlist);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // STEP 1: Ask backend to send the email
  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch("https://house-of-ar-backend.onrender.com/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Something went wrong");
      
      setResetCodeSent(true); // Switches UI to Step 2
    } catch (err) {
      setError(err.message);
    }
  };

  // STEP 2: Submit the 6-digit code and new password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch("https://house-of-ar-backend.onrender.com/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to reset password");
      
      alert("Password updated successfully! Please log in.");
      setIsForgotPassword(false);
      setResetCodeSent(false);
      setResetCode("");
      setNewPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div style={{ backgroundColor: "#1a1a1a", padding: "30px", borderRadius: "8px", width: "90%", maxWidth: "400px", color: "#fff", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "10px", right: "15px", background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}>✕</button>
        
        {error && <p style={{ color: "#ff4444", textAlign: "center", fontSize: "14px", marginBottom: "15px" }}>{error}</p>}

        {isForgotPassword ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <h2 style={{ marginBottom: "15px", fontFamily: "serif" }}>Reset Password</h2>
            
            {!resetCodeSent ? (
              <>
                <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "20px" }}>Enter your email address to receive a 6-digit reset code.</p>
                <form onSubmit={handleSendResetCode} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <input type="email" placeholder="Email Address" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #333", background: "#2a2a2a", color: "#fff", boxSizing: "border-box" }} required />
                  <button type="submit" style={{ padding: "12px", background: "#cfa968", color: "#000", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>SEND CODE</button>
                </form>
              </>
            ) : (
              <>
                <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "20px" }}>We sent a code to <strong>{resetEmail}</strong>.</p>
                <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  <input type="text" placeholder="Enter 6-Digit Code" value={resetCode} onChange={(e) => setResetCode(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #333", background: "#2a2a2a", color: "#fff", boxSizing: "border-box", textAlign: "center", letterSpacing: "2px", fontSize: "18px" }} required maxLength="6" />
                  <input type="password" placeholder="Enter New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #333", background: "#2a2a2a", color: "#fff", boxSizing: "border-box" }} required />
                  <button type="submit" style={{ padding: "12px", background: "#cfa968", color: "#000", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>UPDATE PASSWORD</button>
                </form>
              </>
            )}

            <button onClick={() => { setIsForgotPassword(false); setResetCodeSent(false); setError(""); }} style={{ marginTop: "20px", background: "none", border: "none", color: "#aaa", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}>Back to Login</button>
          </div>
        ) : (
          <>
            <h2 style={{ textAlign: "center", marginBottom: "20px", fontFamily: "serif" }}>{isSignUp ? "Create Account" : "Welcome Back"}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {isSignUp && <input type="text" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #333", background: "#2a2a2a", color: "#fff" }} />}
              <input type="email" placeholder="Email Address" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: "10px", borderRadius: "4px", border: "1px solid #333", background: "#2a2a2a", color: "#fff" }} />
              
              <div style={{ position: "relative", width: "100%" }}>
                <input type={showPassword ? "text" : "password"} placeholder="Password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #333", background: "#2a2a2a", color: "#fff", boxSizing: "border-box" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#aaa" }}>{showPassword ? "👁️" : "👁️‍🗨️"}</button>
              </div>

              {!isSignUp && (
                <div style={{ textAlign: "right", marginTop: "-5px" }}>
                  <button type="button" onClick={() => { setIsForgotPassword(true); setError(""); }} style={{ background: "none", border: "none", color: "#cfa968", fontSize: "12px", cursor: "pointer", textDecoration: "underline", padding: 0 }}>Forgot Password?</button>
                </div>
              )}
              
              <button type="submit" style={{ padding: "12px", background: "#cfa968", color: "#000", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", marginTop: "5px" }}>{isSignUp ? "Sign Up" : "Log In"}</button>
            </form>

            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#aaa" }}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <span onClick={() => setIsSignUp(!isSignUp)} style={{ color: "#cfa968", cursor: "pointer", textDecoration: "underline" }}>{isSignUp ? "Log In" : "Sign Up"}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}