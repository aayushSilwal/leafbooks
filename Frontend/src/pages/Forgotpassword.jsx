import { useState } from "react";
import { notifySuccess, notifyError } from "../components/utils.jsx";
import "../css/ForgotPages.css";
import { useNavigate, Link } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/password/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      notifySuccess(data.message || "If this email exists, a reset link was sent.");
      setTimeout(() => navigate("/login"), 1500);

    } catch (error) {
      notifyError("Something went wrong. Try again!");
    }
  };

  return (
    <div className="auth-container">
      <img 
        src="/LogoTwo.png"
        className="login-logo"
        alt="LeafBooks Logo"
        onClick={() => navigate("/")}
      />
      <div className="auth-box">
        <h2 className="auth-title">Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            required
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="forgot-reset-link">
          Remember your password? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
