import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { TrendingUp, Sparkles, BookOpen, Library, X } from "lucide-react";
import { notifySuccess, notifyError } from "../components/utils.jsx";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../css/Home.css";

function BookCard({ book, onClick }) {
  return (
    <div className="book-card" onClick={() => onClick(book)}>
      <div className="book-card-cover">
        <img src={book.coverImage?.url} alt={book.title} />
        {book.isFree
          ? <span className="book-badge free">Free</span>
          : <span className="book-badge price">Rs. {book.price}</span>
        }
      </div>
      <div className="book-card-info">
        <h4 className="book-card-title">{book.title}</h4>
        <p className="book-card-author">{book.author}</p>
        <p className="book-card-publisher">{book.publisher?.publisherName}</p>
      </div>
    </div>
  );
}

function BookSection({ title, icon, books, onBookClick, emptyText, loading }) {
  return (
    <section className="home-section">
      <div className="section-header">
        <h2>{icon} {title}</h2>
      </div>
      {loading ? (
        <div className="books-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="book-card-skeleton">
              <div className="skeleton-cover loading-shimmer" />
              <div className="skeleton-line loading-shimmer" style={{ width: '80%', height: '12px', marginTop: '8px' }} />
              <div className="skeleton-line loading-shimmer" style={{ width: '55%', height: '10px', marginTop: '6px' }} />
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <span>📚</span>
          <p>{emptyText}</p>
        </div>
      ) : (
        <div className="books-grid">
          {books.map(book => (
            <BookCard key={book._id} book={book} onClick={onBookClick} />
          ))}
        </div>
      )}
    </section>
  );
}

function BookshelfCard({ book, onRead, onRemove }) {
  return (
    <div className="shelf-card">
      <button className="shelf-remove" onClick={(e) => { e.stopPropagation(); onRemove(book._id); }}>
        <X size={13} />
      </button>
      <div className="shelf-cover" onClick={() => onRead(book)}>
        <img src={book.coverImage?.url} alt={book.title} />
      </div>
      <div className="shelf-info">
        <p className="shelf-title">{book.title}</p>
        <p className="shelf-author">{book.author}</p>
      </div>
    </div>
  );
}

export default function Home({ user, handleLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [books, setBooks] = useState({ trending: [], freeBooks: [], recommended: [] });
  const [bookshelf, setBookshelf] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingShelf, setLoadingShelf] = useState(true);
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const username = user?.name || "Reader";

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchBooks = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/home`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setBooks({ trending: data.trending, freeBooks: data.freeBooks, recommended: data.recommended });
      } catch (err) {
        console.error("Failed to fetch books:", err);
      } finally {
        setLoadingBooks(false);
      }
    };

    const fetchBookshelf = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/bookshelf`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setBookshelf(data.bookshelf);
      } catch (err) {
        console.error("Failed to fetch bookshelf:", err);
      } finally {
        setLoadingShelf(false);
      }
    };

    fetchBooks();
    fetchBookshelf();
  }, []);

  const handleBookClick = (book) => navigate(`/book/${book._id}`);

  const handleRemoveFromShelf = async (bookId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/bookshelf/remove`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ bookId })
      });
      const data = await res.json();
      if (data.success) {
        setBookshelf(prev => prev.filter(b => b._id !== bookId));
        notifySuccess("Removed from bookshelf.");
      }
    } catch (err) {
      notifyError("Failed to remove.");
    }
  };

  return (
    <div className={`home-layout ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Navbar handleLogout={handleLogout} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} user={user} />
      <Sidebar isOpen={isSidebarOpen} user={user} />

      <main className="home-main">

        {/* Greeting */}
        <section className="home-hero">
          <p className="home-greeting-label">{greeting} 👋</p>
          <h1 className="home-greeting">Welcome back, <span>{username}</span>!</h1>
          <p className="home-subtext">Pick up where you left off, or discover something new today.</p>
        </section>

        {/* Bookshelf */}
        <section className="home-section">
          <div className="section-header">
            <h2><Library size={18} /> My Bookshelf</h2>
            {bookshelf.length > 0 && (
              <span className="section-count">{bookshelf.length} book{bookshelf.length > 1 ? "s" : ""}</span>
            )}
          </div>

          {loadingShelf ? (
            <div className="shelf-row">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="shelf-card-skeleton loading-shimmer" />
              ))}
            </div>
          ) : bookshelf.length === 0 ? (
            <div className="empty-state shelf-empty">
              <span>🗂️</span>
              <p>Your bookshelf is empty. Purchase books to add them here!</p>
              <button className="empty-cta" onClick={() => navigate("/store")}>Browse Store</button>
            </div>
          ) : (
            <div className="shelf-row">
              {bookshelf.map(book => (
                <BookshelfCard
                  key={book._id}
                  book={book}
                  onRead={handleBookClick}
                  onRemove={handleRemoveFromShelf}
                />
              ))}
            </div>
          )}
        </section>

        {/* Book sections */}
        <BookSection
          title="Trending"
          icon={<TrendingUp size={18} />}
          books={books.trending}
          onBookClick={handleBookClick}
          emptyText="No trending books yet."
          loading={loadingBooks}
        />
        <BookSection
          title="Recommended for You"
          icon={<Sparkles size={18} />}
          books={books.recommended}
          onBookClick={handleBookClick}
          emptyText="Recommendations will appear as you read more."
          loading={loadingBooks}
        />
        <BookSection
          title="Free Books"
          icon={<BookOpen size={18} />}
          books={books.freeBooks}
          onBookClick={handleBookClick}
          emptyText="No free books available yet."
          loading={loadingBooks}
        />

      </main>

      <ToastContainer position="bottom-right" />
    </div>
  );
}