import { useState, useEffect } from "react";
import {
  Users, BookOpen, Shield, CheckCircle, XCircle, Trash2,
  Search, LogOut, BarChart2, Clock, ShoppingCart, Star,
  Gift, ArrowLeftRight, TrendingUp
} from "lucide-react";
import "../css/AdminPanel.css";

const API = import.meta.env.VITE_API_URL;

const Rs = (v) => v != null ? `Rs. ${Number(v).toLocaleString()}` : "Rs. 0";

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`admin-stat-card ${color}`}>
      <div className="admin-stat-icon">{icon}</div>
      <div className="admin-stat-info">
        <span className="admin-stat-number">{value ?? 0}</span>
        <span className="admin-stat-label">{label}</span>
      </div>
    </div>
  );
}

function FilterTabs({ options, active, onChange }) {
  return (
    <div className="admin-filter-tabs">
      {options.map(f => (
        <button key={f} className={active === f ? "active" : ""} onClick={() => onChange(f)}>
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const [token] = useState(localStorage.getItem("adminToken") || "");
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [lends, setLends] = useState([]);
  const [gifts, setGifts] = useState([]);

  const [userSearch, setUserSearch] = useState("");
  const [publisherFilter, setPublisherFilter] = useState("pending");
  const [bookFilter, setBookFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [lendFilter, setLendFilter] = useState("active");
  const [giftFilter, setGiftFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const h = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}`, "Content-Type": "application/json" });

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/login";
  };

  useEffect(() => { if (token) fetchStats(); }, [token]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "users")      fetchUsers();
    if (activeTab === "publishers") fetchPublishers();
    if (activeTab === "books")      fetchBooks();
    if (activeTab === "orders")     fetchOrders();
    if (activeTab === "revenue")    fetchRevenue();
    if (activeTab === "reviews")    fetchReviews();
    if (activeTab === "lends")      fetchLends();
    if (activeTab === "gifts")      fetchGifts();
  }, [activeTab, publisherFilter, bookFilter, orderFilter, lendFilter, giftFilter, token]);

  const fetchStats      = async () => { const d = await (await fetch(`${API}/api/admin/stats`, { headers: h() })).json(); if (d.success) setStats(d.stats); };
  const fetchUsers      = async () => { setLoading(true); const d = await (await fetch(`${API}/api/admin/users?search=${userSearch}`, { headers: h() })).json(); if (d.success) setUsers(d.users); setLoading(false); };
  const fetchPublishers = async () => { setLoading(true); const d = await (await fetch(`${API}/api/admin/publishers?filter=${publisherFilter}`, { headers: h() })).json(); if (d.success) setPublishers(d.publishers); setLoading(false); };
  const fetchBooks      = async () => { setLoading(true); const d = await (await fetch(`${API}/api/admin/books?filter=${bookFilter}`, { headers: h() })).json(); if (d.success) setBooks(d.books); setLoading(false); };
  const fetchOrders     = async () => { setLoading(true); const d = await (await fetch(`${API}/api/admin/orders?filter=${orderFilter}`, { headers: h() })).json(); if (d.success) setOrders(d.orders); setLoading(false); };
  const fetchRevenue    = async () => { setLoading(true); const d = await (await fetch(`${API}/api/admin/revenue`, { headers: h() })).json(); if (d.success) setRevenue(d); setLoading(false); };
  const fetchReviews    = async () => { setLoading(true); const d = await (await fetch(`${API}/api/admin/reviews`, { headers: h() })).json(); if (d.success) setReviews(d.reviews); setLoading(false); };
  const fetchLends      = async () => { setLoading(true); const d = await (await fetch(`${API}/api/admin/lends?filter=${lendFilter}`, { headers: h() })).json(); if (d.success) setLends(d.lends); setLoading(false); };
  const fetchGifts      = async () => { setLoading(true); const d = await (await fetch(`${API}/api/admin/gifts?filter=${giftFilter}`, { headers: h() })).json(); if (d.success) setGifts(d.gifts); setLoading(false); };

  const handleApprovePublisher = async (id, approved) => {
    const d = await (await fetch(`${API}/api/admin/publishers/${id}/approve`, { method: "PATCH", headers: h(), body: JSON.stringify({ approved }) })).json();
    if (d.success) { fetchPublishers(); fetchStats(); } else alert(d.message);
  };

  const handleDeleteBook   = async (id) => { if (!confirm("Delete this book?")) return; const d = await (await fetch(`${API}/api/admin/books/${id}`, { method: "DELETE", headers: h() })).json(); if (d.success) { setBooks(p => p.filter(b => b._id !== id)); fetchStats(); } };
  const handleDeleteUser   = async (id) => { if (!confirm("Delete this user and all their data?")) return; const d = await (await fetch(`${API}/api/admin/users/${id}`, { method: "DELETE", headers: h() })).json(); if (d.success) { fetchUsers(); fetchStats(); } };
  const handleDeleteReview = async (id) => { if (!confirm("Delete this review?")) return; const d = await (await fetch(`${API}/api/admin/reviews/${id}`, { method: "DELETE", headers: h() })).json(); if (d.success) setReviews(p => p.filter(r => r._id !== id)); };

  const TABS = [
    { key: "overview",   icon: <BarChart2 size={18} />,      label: "Overview" },
    { key: "revenue",    icon: <TrendingUp size={18} />,     label: "Revenue" },
    { key: "publishers", icon: <CheckCircle size={18} />,    label: "Publishers", badge: stats?.pendingPublishers },
    { key: "books",      icon: <BookOpen size={18} />,       label: "Books" },
    { key: "users",      icon: <Users size={18} />,          label: "Users" },
    { key: "orders",     icon: <ShoppingCart size={18} />,   label: "Orders" },
    { key: "reviews",    icon: <Star size={18} />,           label: "Reviews" },
    { key: "lends",      icon: <ArrowLeftRight size={18} />, label: "Lends" },
    { key: "gifts",      icon: <Gift size={18} />,           label: "Gifts" },
  ];

  if (!token) return null;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand"><Shield size={22} /><span>Admin Panel</span></div>
        <nav className="admin-nav">
          {TABS.map(tab => (
            <button key={tab.key} className={`admin-nav-item ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
              {tab.icon}<span>{tab.label}</span>
              {tab.badge > 0 && <span className="admin-badge">{tab.badge}</span>}
            </button>
          ))}
        </nav>
        <button className="admin-logout" onClick={handleLogout}><LogOut size={16} /> Logout</button>
      </aside>

      <main className="admin-main">

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="admin-section">
            <h2>Overview</h2>
            <div className="admin-stats-grid">
              <StatCard icon={<Users size={22} />}        label="Total Users"        value={stats?.totalUsers}        color="blue"   />
              <StatCard icon={<Shield size={22} />}       label="Publishers"         value={stats?.totalPublishers}   color="green"  />
              <StatCard icon={<BookOpen size={22} />}     label="Total Books"        value={stats?.totalBooks}        color="purple" />
              <StatCard icon={<BookOpen size={22} />}     label="Published Books"    value={stats?.publishedBooks}    color="blue"   />
              <StatCard icon={<Clock size={22} />}        label="Pending Publishers" value={stats?.pendingPublishers} color="orange" />
              <StatCard icon={<ShoppingCart size={22} />} label="Total Orders"       value={stats?.totalOrders}       color="green"  />
              <StatCard icon={<TrendingUp size={22} />}   label="Total Revenue"      value={Rs(stats?.totalRevenue)}  color="purple" />
            </div>
          </div>
        )}

        {/* ── Revenue ── */}
        {activeTab === "revenue" && (
          <div className="admin-section">
            <h2>Revenue</h2>
            {loading ? <div className="admin-loading">Loading...</div> : revenue && (
              <>
                <div className="admin-stats-grid" style={{ marginBottom: 28 }}>
                  <StatCard icon={<TrendingUp size={22} />}   label="Total Revenue" value={Rs(revenue.totalRevenue)} color="green" />
                  <StatCard icon={<ShoppingCart size={22} />} label="Total Orders"  value={revenue.totalOrders}      color="blue"  />
                </div>

                <div className="admin-card">
                  <h3>Monthly Revenue</h3>
                  <div className="revenue-chart">
                    {revenue.monthlyRevenue?.map((m, i) => {
                      const max = Math.max(...revenue.monthlyRevenue.map(x => x.revenue), 1);
                      return (
                        <div key={i} className="revenue-bar-item">
                          <div className="revenue-bar-track">
                            <div className="revenue-bar-fill" style={{ height: `${(m.revenue / max) * 100}%` }} />
                          </div>
                          <span className="revenue-bar-value">{Rs(m.revenue)}</span>
                          <span className="revenue-bar-label">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="admin-card" style={{ marginTop: 20 }}>
                  <h3>Top Selling Books</h3>
                  <div className="admin-table">
                    {revenue.topBooks?.map((b, i) => (
                      <div key={i} className="admin-row">
                        <span className="admin-rank">#{i + 1}</span>
                        <div className="admin-row-info">
                          <p className="admin-row-name">{b.title}</p>
                          <p className="admin-row-sub">{b.sales} sales</p>
                        </div>
                        <span className="admin-revenue-amount">{Rs(b.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Publishers ── */}
        {activeTab === "publishers" && (
          <div className="admin-section">
            <h2>Publisher Requests</h2>
            <FilterTabs options={["pending","approved","all"]} active={publisherFilter} onChange={setPublisherFilter} />
            {loading ? <div className="admin-loading">Loading...</div> :
            publishers.length === 0 ? <div className="admin-empty">No publishers found.</div> :
            <div className="admin-table">
              {publishers.map(pub => (
                <div key={pub._id} className="admin-row">
                  <img src={pub.user?.picture || "/defaultProfile.jpg"} alt="" className="admin-avatar" />
                  <div className="admin-row-info">
                    <p className="admin-row-name">{pub.publisherName}</p>
                    <p className="admin-row-sub">{pub.user?.email}</p>
                    {pub.bio && <p className="admin-row-bio">{pub.bio}</p>}
                  </div>
                  <div className="admin-row-meta">
                    <span className={`admin-status ${pub.approved ? "approved" : "pending"}`}>{pub.approved ? "Approved" : "Pending"}</span>
                    <p className="admin-row-date">{new Date(pub.createdAt).toLocaleDateString()}</p>
                  </div>
                  {!pub.approved && (
                    <div className="admin-row-actions">
                      <button className="admin-approve-btn" onClick={() => handleApprovePublisher(pub._id, true)}><CheckCircle size={15} /> Approve</button>
                      <button className="admin-reject-btn"  onClick={() => handleApprovePublisher(pub._id, false)}><XCircle size={15} /> Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>}
          </div>
        )}

        {/* ── Books ── */}
        {activeTab === "books" && (
          <div className="admin-section">
            <h2>Books</h2>
            <FilterTabs options={["all","published","draft"]} active={bookFilter} onChange={setBookFilter} />
            {loading ? <div className="admin-loading">Loading...</div> :
            books.length === 0 ? <div className="admin-empty">No books found.</div> :
            <div className="admin-table">
              {books.map(book => (
                <div key={book._id} className="admin-row">
                  <img src={book.coverImage?.url} alt={book.title} className="admin-book-cover" />
                  <div className="admin-row-info">
                    <p className="admin-row-name">{book.title}</p>
                    <p className="admin-row-sub">by {book.author} · {book.publisher?.publisherName}</p>
                    <div className="admin-row-tags">
                      <span className="admin-tag">{book.genre}</span>
                      <span className="admin-tag">{book.isFree ? "Free" : Rs(book.price)}</span>
                    </div>
                  </div>
                  <div className="admin-row-meta">
                    <span className={`admin-status ${book.status === "published" ? "approved" : "pending"}`}>{book.status}</span>
                    <p className="admin-row-date">{new Date(book.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="admin-row-actions">
                    <button className="admin-delete-btn" onClick={() => handleDeleteBook(book._id)}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === "users" && (
          <div className="admin-section">
            <h2>User Management</h2>
            <div className="admin-search">
              <Search size={15} />
              <input placeholder="Search by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchUsers()} />
              <button onClick={fetchUsers}>Search</button>
            </div>
            {loading ? <div className="admin-loading">Loading...</div> :
            users.length === 0 ? <div className="admin-empty">No users found.</div> :
            <div className="admin-table">
              {users.map(user => (
                <div key={user._id} className="admin-row">
                  <img src={user.picture || "/defaultProfile.jpg"} alt="" className="admin-avatar" />
                  <div className="admin-row-info">
                    <p className="admin-row-name">{user.name}</p>
                    <p className="admin-row-sub">{user.email}</p>
                  </div>
                  <div className="admin-row-meta">
                    <span className={`admin-status ${user.role}`}>{user.role}</span>
                    <span className={`admin-status ${user.isVerified ? "approved" : "pending"}`}>{user.isVerified ? "Verified" : "Unverified"}</span>
                    <p className="admin-row-date">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="admin-row-actions">
                    <button className="admin-delete-btn" onClick={() => handleDeleteUser(user._id)}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )}

        {/* ── Orders ── */}
        {activeTab === "orders" && (
          <div className="admin-section">
            <h2>Orders & Transactions</h2>
            <FilterTabs options={["all","completed","pending","failed"]} active={orderFilter} onChange={setOrderFilter} />
            {loading ? <div className="admin-loading">Loading...</div> :
            orders.length === 0 ? <div className="admin-empty">No orders found.</div> :
            <div className="admin-table">
              {orders.map(order => (
                <div key={order._id} className="admin-row">
                  <img src={order.book?.coverImage?.url} alt="" className="admin-book-cover" />
                  <div className="admin-row-info">
                    <p className="admin-row-name">{order.book?.title}</p>
                    <p className="admin-row-sub">{order.user?.name} · {order.user?.email}</p>
                    <p className="admin-row-sub">Txn: <code className="admin-txn">{order.transactionId}</code></p>
                    <p className="admin-row-sub">via {order.paymentMethod}</p>
                  </div>
                  <div className="admin-row-meta">
                    <span className={`admin-status ${order.status === "completed" ? "approved" : order.status === "failed" ? "rejected" : "pending"}`}>{order.status}</span>
                    <span className="admin-revenue-amount">{Rs(order.amount)}</span>
                    <p className="admin-row-date">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )}

        {/* ── Reviews ── */}
        {activeTab === "reviews" && (
          <div className="admin-section">
            <h2>Reviews</h2>
            {loading ? <div className="admin-loading">Loading...</div> :
            reviews.length === 0 ? <div className="admin-empty">No reviews found.</div> :
            <div className="admin-table">
              {reviews.map(review => (
                <div key={review._id} className="admin-row">
                  <img src={review.book?.coverImage?.url} alt="" className="admin-book-cover" />
                  <div className="admin-row-info">
                    <p className="admin-row-name">{review.book?.title}</p>
                    <div className="admin-stars">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={s <= review.rating ? "star-filled" : "star-empty"}>★</span>
                      ))}
                      <span className="admin-row-sub" style={{ marginLeft: 6 }}>{review.rating}/5</span>
                    </div>
                    {review.comment && <p className="admin-row-bio">"{review.comment}"</p>}
                    <p className="admin-row-sub">by {review.user?.name} · {review.user?.email}</p>
                  </div>
                  <div className="admin-row-meta">
                    <p className="admin-row-date">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="admin-row-actions">
                    <button className="admin-delete-btn" onClick={() => handleDeleteReview(review._id)}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )}

        {/* ── Lends ── */}
        {activeTab === "lends" && (
          <div className="admin-section">
            <h2>Book Lends</h2>
            <FilterTabs options={["active","returned","expired","all"]} active={lendFilter} onChange={setLendFilter} />
            {loading ? <div className="admin-loading">Loading...</div> :
            lends.length === 0 ? <div className="admin-empty">No lends found.</div> :
            <div className="admin-table">
              {lends.map(lend => (
                <div key={lend._id} className="admin-row">
                  <img src={lend.book?.coverImage?.url} alt="" className="admin-book-cover" />
                  <div className="admin-row-info">
                    <p className="admin-row-name">{lend.book?.title}</p>
                    <p className="admin-row-sub">Lender: {lend.lender?.name} · {lend.lender?.email}</p>
                    <p className="admin-row-sub">Borrower: {lend.borrower?.name} · {lend.borrower?.email}</p>
                  </div>
                  <div className="admin-row-meta">
                    <span className={`admin-status ${lend.status === "active" ? "approved" : lend.status === "expired" ? "rejected" : "pending"}`}>{lend.status}</span>
                    <p className="admin-row-date">Expires: {new Date(lend.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )}

        {/* ── Gifts ── */}
        {activeTab === "gifts" && (
          <div className="admin-section">
            <h2>Book Gifts</h2>
            <FilterTabs options={["all","pending","accepted","declined"]} active={giftFilter} onChange={setGiftFilter} />
            {loading ? <div className="admin-loading">Loading...</div> :
            gifts.length === 0 ? <div className="admin-empty">No gifts found.</div> :
            <div className="admin-table">
              {gifts.map(gift => (
                <div key={gift._id} className="admin-row">
                  <img src={gift.book?.coverImage?.url} alt="" className="admin-book-cover" />
                  <div className="admin-row-info">
                    <p className="admin-row-name">{gift.book?.title}</p>
                    <p className="admin-row-sub">From: {gift.sender?.name} · {gift.sender?.email}</p>
                    <p className="admin-row-sub">To: {gift.recipient?.name} · {gift.recipient?.email}</p>
                    {gift.message && <p className="admin-row-bio">"{gift.message}"</p>}
                  </div>
                  <div className="admin-row-meta">
                    <span className={`admin-status ${gift.status === "accepted" ? "approved" : gift.status === "declined" ? "rejected" : "pending"}`}>{gift.status}</span>
                    <p className="admin-row-date">{new Date(gift.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )}

      </main>
    </div>
  );
}