import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, List, BookOpen, ShoppingBag, Clock } from "lucide-react";
import { ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../css/Library.css";

const TABS = [
  { key: "purchased", label: "Purchased",       icon: <ShoppingBag size={15} /> },
  { key: "borrowed",  label: "Borrowed",        icon: <BookOpen size={15} /> },
  { key: "history",   label: "Reading History", icon: <Clock size={15} /> },
];

function GridCard({ book, lastRead, timesRead, onClick, inShelf, onToggleShelf }) {
  return (
    <div className="lib-grid-card" onClick={() => onClick(book)}>
      <div className="lib-grid-cover">
        <img src={book.coverImage?.url} alt={book.title} />
        <div className="lib-grid-overlay">
          <BookOpen size={20} />
          <span>Read</span>
        </div>
      </div>
      <div className="lib-grid-info">
        <h4 className="lib-grid-title">{book.title}</h4>
        <p className="lib-grid-author">{book.author}</p>
        {lastRead && (
          <p className="lib-grid-meta">
            {timesRead > 1 ? `Read ${timesRead}x · ` : ""}
            {new Date(lastRead).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
        <button
          className={`lib-shelf-btn ${inShelf ? "in-shelf" : ""}`}
          onClick={(e) => onToggleShelf(book._id, e)}
        >
          {inShelf ? "✓ In Bookshelf" : "+ Bookshelf"}
        </button>
      </div>
    </div>
  );
}

function ListCard({ book, lastRead, timesRead, onClick, inShelf, onToggleShelf }) {
  return (
    <div className="lib-list-card" onClick={() => onClick(book)}>
      <div className="lib-list-cover">
        <img src={book.coverImage?.url} alt={book.title} />
      </div>
      <div className="lib-list-info">
        <div className="lib-list-genre">{book.genre}</div>
        <h4 className="lib-list-title">{book.title}</h4>
        <p className="lib-list-author">by {book.author}</p>
        <p className="lib-list-publisher">{book.publisher?.publisherName}</p>
        {lastRead && (
          <div className="lib-list-meta">
            <Clock size={12} />
            Last read {new Date(lastRead).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {timesRead > 1 && <span className="times-read">· {timesRead}x</span>}
          </div>
        )}
      </div>
      <div className="lib-list-actions">
        <button
          className={`lib-shelf-btn ${inShelf ? "in-shelf" : ""}`}
          onClick={(e) => onToggleShelf(book._id, e)}
        >
          {inShelf ? "✓ Shelf" : "+ Shelf"}
        </button>
        <button className="lib-read-btn">
          <BookOpen size={15} /> Read
        </button>
      </div>
    </div>
  );
}

function EmptyState({ tab }) {
  return (
    <div className="lib-empty">
      <span>{tab === "purchased" ? "🛒" : "📖"}</span>
      <p>{tab === "purchased"
        ? "You haven't purchased any books yet."
        : "You haven't read any books yet."
      }</p>
      <p className="lib-empty-sub">
        {tab === "purchased"
          ? "Head to the store to find your next great read!"
          : "Start reading to build your history."}
      </p>
    </div>
  );
}

export default function Library({ user, handleLogout }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("purchased");
  const [viewMode, setViewMode] = useState("grid");
  const [purchasedBooks, setPurchasedBooks] = useState([]);
  const [bookshelf, setBookshelf] = useState([]);
  const [readingHistory, setReadingHistory] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const token = localStorage.getItem("token");
        const [libRes, shelfRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/books/library`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${import.meta.env.VITE_API_URL}/api/books/bookshelf`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [libData, shelfData] = await Promise.all([libRes.json(), shelfRes.json()]);
        if (libData.success) {
          setPurchasedBooks(libData.purchasedBooks);
          setReadingHistory(libData.readingHistory);
        }
        if (shelfData.success) setBookshelf(shelfData.bookshelf.map(b => b._id));

        // Fetch borrowed books
        const borrowedRes = await fetch(`${import.meta.env.VITE_API_URL}/api/gifting/borrowed`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const borrowedData = await borrowedRes.json();
        if (borrowedData.success) setBorrowedBooks(borrowedData.lends);
      } catch (err) {
        console.error("Failed to fetch library:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLibrary();
  }, []);

  const handleBookClick = (book) => navigate(`/book/${book._id}`);

  const handleToggleBookshelf = async (bookId, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    const inShelf = bookshelf.includes(bookId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/bookshelf/${inShelf ? 'remove' : 'add'}`, {
        method: inShelf ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId })
      });
      const data = await res.json();
      if (data.success) {
        setBookshelf(prev => inShelf ? prev.filter(id => id !== bookId) : [...prev, bookId]);
      }
    } catch (err) {
      console.error("Bookshelf toggle failed:", err);
    }
  };

  const currentBooks = activeTab === "purchased"
    ? purchasedBooks
    : activeTab === "borrowed"
    ? borrowedBooks.map(l => ({ ...l.book, expiresAt: l.expiresAt, lender: l.lender }))
    : readingHistory
      .filter(h => purchasedBooks.some(p => p._id === h.book?._id))
      .map(h => ({ ...h.book, lastRead: h.lastRead, timesRead: h.timesRead }));

  const Skeleton = () => (
    <div className={viewMode === "grid" ? "lib-grid" : "lib-list"}>
      {[...Array(8)].map((_, i) => (
        viewMode === "grid"
          ? <div key={i} className="lib-grid-skeleton">
              <div className="lib-skeleton-cover loading-shimmer" />
              <div className="lib-skeleton-line loading-shimmer" style={{ width: '80%', height: '11px', marginTop: '8px' }} />
              <div className="lib-skeleton-line loading-shimmer" style={{ width: '55%', height: '9px', marginTop: '5px' }} />
            </div>
          : <div key={i} className="lib-list-skeleton loading-shimmer" />
      ))}
    </div>
  );

  return (
    <div className={`lib-layout ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Navbar handleLogout={handleLogout} user={user} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar user={user} isOpen={isSidebarOpen} />

      <main className="lib-main">

        {/* Header */}
        <div className="lib-header">
          <div>
            <h1 className="lib-title">My Library</h1>
            <p className="lib-subtitle">Your personal reading collection</p>
          </div>

          {/* View toggle */}
          <div className="lib-view-toggle">
            <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>
              <LayoutGrid size={16} />
            </button>
            <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="lib-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`lib-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon} {tab.label}
              <span className="lib-tab-count">
                {tab.key === "purchased" ? purchasedBooks.length : tab.key === "borrowed" ? borrowedBooks.length : readingHistory.length}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? <Skeleton /> : currentBooks.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <div className={viewMode === "grid" ? "lib-grid" : "lib-list"}>
            {currentBooks.map(book => (
              viewMode === "grid"
                ? <GridCard
                    key={book._id || Math.random()}
                    book={book}
                    lastRead={book.lastRead}
                    timesRead={book.timesRead}
                    onClick={handleBookClick}
                    inShelf={bookshelf.includes(book._id)}
                    onToggleShelf={handleToggleBookshelf}
                  />
                : <ListCard
                    key={book._id || Math.random()}
                    book={book}
                    lastRead={book.lastRead}
                    timesRead={book.timesRead}
                    onClick={handleBookClick}
                    inShelf={bookshelf.includes(book._id)}
                    onToggleShelf={handleToggleBookshelf}
                  />
            ))}
          </div>
        )}

      </main>

      <ToastContainer position="bottom-right" />
    </div>
  );
}