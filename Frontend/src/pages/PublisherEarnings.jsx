import { useEffect, useState } from "react";
import { DollarSign, Clock, CheckCircle, Mail, TrendingUp } from "lucide-react";
import Navbar from "../components/Navbar";
import PublisherSidebar from "../components/PublisherSidebar";
import "../css/PublisherEarnings.css";

const ADMIN_EMAIL = "np03cs4a230192@heraldcollege.edu.np";

export default function PublisherEarnings({ user, handleLogout }) {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/publisher-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setEarnings(data.stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  const totalEarnings = earnings?.totalEarnings ?? 0;
  // Dummy split: assume 60% paid out, 40% pending
  const paidOut = parseFloat((totalEarnings * 0.6).toFixed(2));
  const pending = parseFloat((totalEarnings * 0.4).toFixed(2));

  const handleRequestPayment = () => {
    const subject = encodeURIComponent("Payment Request – Leaf Books Publisher");
    const body = encodeURIComponent(
      `Hello,\n\nI would like to request a payment for my pending earnings on Leaf Books.\n\nPublisher: ${user?.name || ""}\nEmail: ${user?.email || ""}\nPending Amount: Rs. ${pending}\n\nPlease process at your earliest convenience.\n\nThank you.`
    );
    window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="pub-layout">
      <Navbar handleLogout={handleLogout} user={user} />
      <PublisherSidebar user={user} />

      <main className="pub-main">
        <div className="pub-hero">
          <p className="pub-eyebrow">Publisher Studio</p>
          <h1 className="pub-title">Earnings</h1>
          <p className="pub-subtitle">Track your revenue and request payouts.</p>
        </div>

        {/* Cards */}
        <div className="earn-cards">

          <div className="earn-card earn-card--total">
            <div className="earn-card-icon"><TrendingUp size={22} /></div>
            <div className="earn-card-body">
              <span className="earn-card-label">Total Earnings</span>
              <span className="earn-card-value">
                {loading ? <span className="earn-shimmer" /> : `Rs. ${totalEarnings.toFixed(2)}`}
              </span>
            </div>
          </div>

          <div className="earn-card earn-card--paid">
            <div className="earn-card-icon"><CheckCircle size={22} /></div>
            <div className="earn-card-body">
              <span className="earn-card-label">Paid Out</span>
              <span className="earn-card-value">
                {loading ? <span className="earn-shimmer" /> : `Rs. ${paidOut.toFixed(2)}`}
              </span>
            </div>
          </div>

          <div className="earn-card earn-card--pending">
            <div className="earn-card-icon"><Clock size={22} /></div>
            <div className="earn-card-body">
              <span className="earn-card-label">Pending Payout</span>
              <span className="earn-card-value">
                {loading ? <span className="earn-shimmer" /> : `Rs. ${pending.toFixed(2)}`}
              </span>
            </div>
          </div>

        </div>

        {/* Request Payment */}
        <div className="earn-request-card">
          <div className="earn-request-left">
            <Mail size={28} className="earn-request-icon" />
            <div>
              <h3 className="earn-request-title">Request Payment</h3>
              <p className="earn-request-desc">
                Send a payment request to the Leaf Books admin. We'll process your pending balance of{" "}
                <strong>Rs. {pending.toFixed(2)}</strong> within 3–5 business days.
              </p>
            </div>
          </div>
          <button
            className="earn-request-btn"
            onClick={handleRequestPayment}
            disabled={pending <= 0}
          >
            <Mail size={16} />
            Request via Email
          </button>
        </div>

        {/* Info note */}
        <p className="earn-note">
          Payouts are processed manually. Once your request is received, the admin will confirm via email.
        </p>

      </main>
    </div>
  );
}