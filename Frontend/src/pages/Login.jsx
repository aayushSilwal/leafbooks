import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../css/Login.css";
import { notifySuccess, notifyError } from "../components/utils.jsx";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ── Admin login ──────────────────────────────────────
      if (form.email === "admin@admin.com") {
        const adminRes = await fetch(`${API_URL}/api/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const adminData = await adminRes.json();
        if (adminData.success) {
          localStorage.setItem("adminToken", adminData.token);
          notifySuccess("Welcome, Admin!");
          setTimeout(() => navigate("/admin"), 300);
        } else {
          notifyError(adminData.message || "Invalid admin credentials.");
        }
        return;
      }

      // ── Regular user login ───────────────────────────────
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      const { success, jwtToken, name, message } = result;

      if (success) {
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("loggedInUser", name);

        // Fetch full user so App has role etc.
        const userRes = await fetch(`${import.meta.env.VITE_API_URL}/api/publisher/me`, {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        const userData = await userRes.json();
        if (userData.success) setUser(userData.user);

        notifySuccess("Login successful!");
        setTimeout(() => navigate("/home"), 300);
      } else {
        notifyError(message || "Invalid login credentials.");
      }
    } catch (err) {
      notifyError("Something went wrong. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google`, {
        credential: credentialResponse.credential,
      });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("loggedInUser", user.name);

      // Fetch full user so App has role etc.
      const userRes = await fetch(`${import.meta.env.VITE_API_URL}/api/publisher/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userRes.json();
      if (userData.success) setUser(userData.user);

      notifySuccess("Google login successful!");
      navigate("/home");
    } catch (err) {
      notifyError("Google login failed!");
      console.error(err);
    }
  };

  return (
    <div className="login-container">

      {/* Logo */}
      <img
        src="/LogoTwo.png"
        className="login-logo"
        alt="LeafBooks Logo"
        onClick={() => navigate("/")}
      />

      {/* LEFT SIDE — Hero */}
      <div className="login-left">
        <div className="login-hero-text">
          <h1>Welcome Back</h1>
          <p>Your reading journey continues here.</p>
          <div className="login-quote">
            <span className="quote-mark">&ldquo;</span>
            <blockquote>
              A reader lives a thousand lives before he dies. The man who never reads lives only one.
            </blockquote>
            <cite>— George R.R. Martin</cite>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — Form */}
      <div className="login-right">
        <div className="login-box">
          <h2 className="login-title">Sign in to Leaf-Books</h2>
          <p className="login-subtitle">Good to see you again.</p>

          <form onSubmit={handleSubmit} className="login-form">

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
                autoFocus
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
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

            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          <p className="login-link">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>

          <div className="or-separator">
            <hr className="line" />
            <span>or</span>
            <hr className="line" />
          </div>

          <div className="google-btn-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => notifyError("Google Sign In Failed")}
              shape="pill"
              size="large"
            />
          </div>

        </div>
      </div>

    </div>
  );
}