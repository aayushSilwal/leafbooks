import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { BookOpen, ShoppingCart, DollarSign, BookMarked, Plus, Eye, EyeOff, BarChart2, PieChart } from "lucide-react";
import Navbar from "../components/Navbar";
import PublisherSidebar from "../components/PublisherSidebar";
import "../css/PublisherDashboard.css";

// Simple bar chart component
function BarChart({ data, valueKey, labelKey, color = "#2563a8" }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div className="analytics-bar-chart">
      {data.map((item, i) => (
        <div key={i} className="bar-item">
          <div className="bar-label" title={item[labelKey]}>
            {item[labelKey]?.length > 12 ? item[labelKey].slice(0, 12) + "…" : item[labelKey]}
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${(item[valueKey] / max) * 100}%`,
                background: color,
                animationDelay: `${i * 0.08}s`
              }}
            />
          </div>
          <div className="bar-value">{item[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

// Donut/pie chart for genre breakdown
function GenreChart({ data }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const COLORS = ["#2563a8","#4a90d9","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
  let cumulativeAngle = 0;

  const slices = data.slice(0, 8).map((item, i) => {
    const pct = item.count / total;
    const startAngle = cumulativeAngle;
    cumulativeAngle += pct * 360;
    return { ...item, pct, startAngle, endAngle: cumulativeAngle, color: COLORS[i % COLORS.length] };
  });

  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  return (
    <div className="genre-chart">
      <svg viewBox="0 0 120 120" className="donut-svg">
        {slices.map((slice, i) => {
          const start = polarToCartesian(60, 60, 48, slice.startAngle);
          const end   = polarToCartesian(60, 60, 48, slice.endAngle - 0.1);
          const large = (slice.endAngle - slice.startAngle) > 180 ? 1 : 0;
          const iStart = polarToCartesian(60, 60, 32, slice.startAngle);
          const iEnd   = polarToCartesian(60, 60, 32, slice.endAngle - 0.1);
          const d = `M ${start.x} ${start.y} A 48 48 0 ${large} 1 ${end.x} ${end.y} L ${iEnd.x} ${iEnd.y} A 32 32 0 ${large} 0 ${iStart.x} ${iStart.y} Z`;
          return <path key={i} d={d} fill={slice.color} opacity="0.9" />;
        })}
        <circle cx="60" cy="60" r="24" fill="white" />
        <text x="60" y="57" textAnchor="middle" fontSize="8" fill="#1a3a5c" fontWeight="600">{total}</text>
        <text x="60" y="67" textAnchor="middle" fontSize="6" fill="#9aa0af">books</text>
      </svg>
      <div className="genre-legend">
        {slices.map((slice, i) => (
          <div key={i} className="legend-item">
            <span className="legend-dot" style={{ background: slice.color }} />
            <span className="legend-label">{slice.genre}</span>
            <span className="legend-count">{slice.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PublisherDashboard({ user, handleLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [topBySales, setTopBySales] = useState([]);
  const [genreBreakdown, setGenreBreakdown] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    if (user && user.role !== "publisher") { navigate("/home"); return; }

    const fetchStats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/publisher-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setTopBySales(data.topBySales);
          setGenreBreakdown(data.genreBreakdown);
          setRecentBooks(data.recentBooks);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, navigate]);

  const statCards = [
    { icon: <BookOpen size={20} />,     label: "Published",   value: stats?.published     ?? 0, color: "blue"  },
    { icon: <BookMarked size={20} />,   label: "Drafts",      value: stats?.drafts        ?? 0, color: "grey"  },
    { icon: <ShoppingCart size={20} />, label: "Total Sales", value: stats?.totalSales    ?? 0, color: "green" },
    { icon: <DollarSign size={20} />,   label: "Earnings",    value: `Rs. ${(stats?.totalEarnings ?? 0).toFixed(2)}`, color: "gold" },
  ];

  return (
    <div className="pub-layout">
      <Navbar handleLogout={handleLogout} user={user} />
      <PublisherSidebar user={user} />

      <main className="pub-main">

        {/* Hero */}
        <div className="pub-hero">
          <p className="pub-eyebrow">Publisher Studio</p>
          <h1 className="pub-title">Welcome, <span>{user?.name || "Publisher"}</span></h1>
          <p className="pub-subtitle">Manage your books, track earnings, and grow your audience.</p>
        </div>

        {/* Stat Cards */}
        <div className="pub-stats">
          {statCards.map((card, i) => (
            <div key={i} className={`pub-stat-card color-${card.color}`}>
              <div className="pub-stat-icon">{card.icon}</div>
              <span className="pub-stat-number">
                {loading ? <span className="stat-shimmer" /> : card.value}
              </span>
              <span className="pub-stat-label">{card.label}</span>
            </div>
          ))}
        </div>

        {/* Analytics Row */}
        <div className="pub-analytics-row">

          {/* Top Books by Sales */}
          <div className="pub-analytics-card">
            <div className="pub-analytics-header">
              <h3><BarChart2 size={16} /> Top Books by Sales</h3>
            </div>
            {loading ? (
              <div className="analytics-shimmer-list">
                {[...Array(4)].map((_, i) => <div key={i} className="loading-shimmer" style={{ height: '28px', borderRadius: '6px' }} />)}
              </div>
            ) : topBySales.length === 0 ? (
              <div className="analytics-empty">No sales data yet.</div>
            ) : (
              <BarChart data={topBySales} valueKey="totalSales" labelKey="title" color="#2563a8" />
            )}
          </div>

          {/* Genre Breakdown */}
          <div className="pub-analytics-card">
            <div className="pub-analytics-header">
              <h3><PieChart size={16} /> Genre Breakdown</h3>
            </div>
            {loading ? (
              <div className="analytics-shimmer-donut loading-shimmer" />
            ) : genreBreakdown.length === 0 ? (
              <div className="analytics-empty">No published books yet.</div>
            ) : (
              <GenreChart data={genreBreakdown} />
            )}
          </div>

        </div>

        {/* Recent Books */}
        <div className="pub-section">
          <div className="pub-section-header">
            <h2>Recent Books</h2>
            <button className="pub-section-link" onClick={() => navigate("/publisher-dashboard/books")}>
              View All
            </button>
          </div>

          {loading ? (
            <div className="pub-recent-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="pub-recent-skeleton">
                  <div className="pub-skeleton-cover loading-shimmer" />
                  <div className="loading-shimmer" style={{ height: '11px', width: '80%', borderRadius: '6px', marginTop: '10px' }} />
                  <div className="loading-shimmer" style={{ height: '9px', width: '55%', borderRadius: '6px', marginTop: '6px' }} />
                </div>
              ))}
            </div>
          ) : recentBooks.length === 0 ? (
            <div className="pub-empty">
              <span>📚</span>
              <p>You haven't uploaded any books yet.</p>
              <button className="pub-upload-btn" onClick={() => navigate("/publisher-dashboard/upload")}>
                <Plus size={15} /> Upload Your First Book
              </button>
            </div>
          ) : (
            <div className="pub-recent-grid">
              {recentBooks.map(book => (
                <div key={book._id} className="pub-recent-card" onClick={() => navigate(`/publisher-dashboard/edit/${book._id}`)}>
                  <div className="pub-recent-cover">
                    <img src={book.coverImage?.url} alt={book.title} />
                    <span className={`pub-recent-status ${book.status}`}>
                      {book.status === "published" ? <Eye size={11} /> : <EyeOff size={11} />}
                      {book.status}
                    </span>
                  </div>
                  <div className="pub-recent-info">
                    <p className="pub-recent-title">{book.title}</p>
                    <p className="pub-recent-meta">{book.isFree ? "Free" : `Rs. ${book.price}`} · {book.totalSales} sales</p>
                  </div>
                </div>
              ))}
              <div className="pub-recent-card add-new" onClick={() => navigate("/publisher-dashboard/upload")}>
                <div className="pub-add-new">
                  <Plus size={28} />
                  <span>Upload New</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </main>

      <ToastContainer position="bottom-right" />
    </div>
  );
}