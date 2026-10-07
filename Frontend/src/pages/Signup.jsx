import { useState } from "react";
import "../css/Signup.css";
import { useNavigate } from "react-router-dom";
import { notifySuccess, notifyError } from "../components/utils.jsx";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^[A-Za-z][A-Za-z0-9_]{2,19}$/.test(form.name)) {
      notifyError("Username must be 3–20 characters, start with a letter, and contain no spaces.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      notifyError("Passwords do not match!");
      return;
    }

    if (form.password.length < 8) {
      notifyError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email,
          password: form.password
        })
      });

      const result = await response.json();
      const { success, message } = result;

      if (success) {
        notifySuccess("Signup successful! Please verify your email.");
        setTimeout(() => navigate("/login"), 300);
      } else {
        notifyError(message || "Signup failed");
      }
    } catch (err) {
      notifyError("Server error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google`, {
        credential: credentialResponse.credential
      });

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("loggedInUser", user.name);

      notifySuccess("Google signup successful!");
      navigate("/home");
    } catch (err) {
      notifyError("Google signup failed!");
      console.error(err);
    }
  };

  return (
    <div className="signup-container">

      {/* Logo */}
      <img
        src="/LogoTwo.png"
        className="signup-logo"
        alt="LeafBooks Logo"
        onClick={() => navigate("/")}
      />

      {/* LEFT — Hero */}
      <div className="signup-left">
        <img src="/heroTwo.png" alt="Signup Hero" className="signup-hero-gif" />
      </div>

      {/* RIGHT — Form */}
      <div className="signup-right">
        <div className="signup-box">
          <h2 className="signup-title">Create your account</h2>
          <p className="signup-subtitle">Join Leaf-Books and start reading today.</p>

          <form onSubmit={handleSubmit} className="signup-form">

            <div className="input-group">
              <label htmlFor="name">Username</label>
              <input
                id="name"
                autoFocus
                type="text"
                placeholder="e.g. john_doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value.trimStart() })}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="input-field"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </button>

          </form>

          <p className="signup-link">
            Already have an account? <a href="/login">Log in</a>
          </p>

          <div className="or-separator">
            <hr className="line" />
            <span>or</span>
            <hr className="line" />
          </div>

          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSignup}
              onError={() => notifyError("Google Sign Up Failed")}
              shape="pill"
              size="large"
            />
          </div>

        </div>
      </div>
    </div>
  );
}