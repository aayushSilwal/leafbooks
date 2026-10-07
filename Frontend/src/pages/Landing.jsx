import { useNavigate } from "react-router-dom";
import "../css/Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">

      {/* Logo */}
      <img src="/LogoTwo.png" alt="LeafBooks Logo" className="landing-logo" />

      {/* Buttons top right */}
      <div className="landing-topbar">
        <button className="landing-btn outline" onClick={() => navigate("/signup")}>
          Sign Up
        </button>
        <button className="landing-btn primary" onClick={() => navigate("/login")}>
          Sign In
        </button>
      </div>

      {/* LEFT: Hero Image */}
      <div className="landing-hero">
        <img src="/hero.png" alt="Hero" />
      </div>

      {/* RIGHT: Text */}
      <div className="landing-right">
        <p className="landing-eyebrow">Your digital reading companion</p>
        <h1 className="landing-title">Discover, Share<br />& Read eBooks</h1>
        <p className="landing-subtitle">
          LeafBooks makes reading social and fun. Explore your favorite books,
          borrow from friends, and share stories instantly.
        </p>
        <div className="landing-cta">
          <button className="landing-btn primary large" onClick={() => navigate("/signup")}>
            Get Started Free
          </button>
          <button className="landing-btn ghost large" onClick={() => navigate("/store")}>
            Browse Books
          </button>
        </div>

        {/* Feature pills */}
        <div className="landing-pills">
          <span className="pill">📖 Read Online</span>
          <span className="pill">🔄 Borrow & Share</span>
          <span className="pill">🛒 Buy & Sell</span>
        </div>
      </div>

      {/* Floating shapes */}
      <div className="floating-shape" style={{ top: "10%", left: "5%" }}></div>
      <div className="floating-shape" style={{ bottom: "15%", right: "10%" }}></div>

    </div>
  );
}