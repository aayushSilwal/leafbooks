import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Check, X, BookOpen } from "lucide-react";
import { notifySuccess, notifyError } from "../components/utils.jsx";
import { ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../css/Notifications.css";

export default function Notifications({ user, handleLogout }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState({});

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gifting/received`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setGifts(data.gifts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (giftId, action) => {
    setResponding(prev => ({ ...prev, [giftId]: action }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gifting/${giftId}/respond`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        notifySuccess(data.message);
        setGifts(prev => prev.filter(g => g._id !== giftId));
      } else {
        notifyError(data.message);
      }
    } catch {
      notifyError("Something went wrong.");
    } finally {
      setResponding(prev => ({ ...prev, [giftId]: null }));
    }
  };

  return (
    <div className={`notif-layout ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Navbar handleLogout={handleLogout} user={user} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar user={user} isOpen={isSidebarOpen} />

      <main className="notif-main">
        <div className="notif-header">
          <h1 className="notif-title">Notifications</h1>
          <p className="notif-subtitle">Pending gift requests</p>
        </div>

        {loading ? (
          <div className="notif-loading">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="notif-skeleton loading-shimmer" />
            ))}
          </div>
        ) : gifts.length === 0 ? (
          <div className="notif-empty">
            <Gift size={40} />
            <p>No pending gifts</p>
            <span>When someone sends you a book, it'll appear here.</span>
          </div>
        ) : (
          <div className="notif-list">
            {gifts.map(gift => (
              <div key={gift._id} className="notif-card">
                <div className="notif-book-cover">
                  <img src={gift.book?.coverImage?.url} alt={gift.book?.title} />
                </div>

                <div className="notif-info">
                  <div className="notif-sender">
                    <img src={gift.sender?.picture || "/defaultProfile.jpg"} alt={gift.sender?.name} />
                    <span><strong>{gift.sender?.name}</strong> wants to gift you a book</span>
                  </div>

                  <h3 className="notif-book-title">{gift.book?.title}</h3>
                  <p className="notif-book-author">by {gift.book?.author}</p>

                  {gift.message && (
                    <div className="notif-message">
                      <span className="quote-mark">"</span>
                      {gift.message}
                      <span className="quote-mark">"</span>
                    </div>
                  )}

                  <p className="notif-note">
                    ⚠️ Accepting will permanently add this book to your library.
                    The sender will lose access.
                  </p>
                </div>

                <div className="notif-actions">
                  <button
                    className="notif-accept"
                    onClick={() => handleRespond(gift._id, "accepted")}
                    disabled={!!responding[gift._id]}
                  >
                    {responding[gift._id] === "accepted" ? "..." : <><Check size={15} /> Accept</>}
                  </button>
                  <button
                    className="notif-decline"
                    onClick={() => handleRespond(gift._id, "declined")}
                    disabled={!!responding[gift._id]}
                  >
                    {responding[gift._id] === "declined" ? "..." : <><X size={15} /> Decline</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ToastContainer position="bottom-right" />
    </div>
  );
}