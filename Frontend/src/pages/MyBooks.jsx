import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Eye, EyeOff, ShoppingCart, ArrowLeft } from "lucide-react";
import { notifySuccess, notifyError } from "../components/utils.jsx";
import { ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";
import PublisherSidebar from "../components/PublisherSidebar";
import "../css/MyBooks.css";

function BookCard({ book, onToggleStatus, onDelete, onEdit }) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isPublished = book.status === "published";

  const handleToggle = async (e) => {
    e.stopPropagation();
    setToggling(true);
    await onToggleStatus(book._id);
    setToggling(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setDeleting(true);
    await onDelete(book._id);
    setDeleting(false);
    setShowConfirm(false);
  };

  return (
    <div className={`mybook-card ${isPublished ? "published" : "draft"}`}>

      {/* Status badge */}
      <div className={`mybook-status-badge ${isPublished ? "published" : "draft"}`}>
        {isPublished ? "Published" : "Draft"}
      </div>


      {/* Cover */}
      <div className="mybook-cover">
        <img src={book.coverImage?.url} alt={book.title} />
      </div>

      {/* Info */}
      <div className="mybook-info">
        <h4 className="mybook-title">{book.title}</h4>
        <p className="mybook-author">{book.author}</p>
        <div className="mybook-meta">
          <span className="mybook-genre">{book.genre}</span>
          <span className="mybook-price">
            {book.isFree ? "Free" : `Rs.${book.price}`}
          </span>
        </div>
        <div className="mybook-stats">
          <span><ShoppingCart size={12} /> {book.totalSales} sales</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mybook-actions">
        <button
          className="mybook-action-btn edit"
          onClick={(e) => { e.stopPropagation(); onEdit(book._id); }}
          title="Edit"
        >
          <Edit size={14} />
        </button>

        <button
          className={`mybook-action-btn toggle ${isPublished ? "unpublish" : "publish"}`}
          onClick={handleToggle}
          disabled={toggling}
          title={isPublished ? "Unpublish" : "Publish"}
        >
          {toggling
            ? <span className="btn-spinner" />
            : isPublished ? <EyeOff size={14} /> : <Eye size={14} />
          }
        </button>

        <button
          className="mybook-action-btn delete"
          onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Delete confirm overlay */}
      {showConfirm && (
        <div className="mybook-confirm" onClick={e => e.stopPropagation()}>
          <p>Delete this book?</p>
          <div className="confirm-btns">
            <button className="confirm-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
            <button className="confirm-delete" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyBooks({ user, handleLogout }) {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | published | draft

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/my-books`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setBooks(data.books);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (bookId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/${bookId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBooks(prev => prev.map(b =>
          b._id === bookId ? { ...b, status: data.status } : b
        ));
        notifySuccess(data.message);
      } else {
        notifyError(data.message);
      }
    } catch (err) {
      notifyError("Failed to update status.");
    }
  };

  const handleDelete = async (bookId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBooks(prev => prev.filter(b => b._id !== bookId));
        notifySuccess("Book deleted.");
      } else {
        notifyError(data.message);
      }
    } catch (err) {
      notifyError("Failed to delete.");
    }
  };

  const handleEdit = (bookId) => navigate(`/publisher-dashboard/edit/${bookId}`);

  const filtered = filter === "all" ? books
    : books.filter(b => b.status === filter);

  const counts = {
    all: books.length,
    published: books.filter(b => b.status === "published").length,
    draft: books.filter(b => b.status === "draft").length,
  };

  return (
    <div className="mybooks-layout">
      <Navbar handleLogout={handleLogout} user={user} />
      <PublisherSidebar user={user} />

      <main className="mybooks-main">

        {/* Header */}
        <div className="mybooks-header">
          <div>
            <button className="back-btn" onClick={() => navigate("/publisher-dashboard")}>
              <ArrowLeft size={15} /> Dashboard
            </button>
            <h1 className="mybooks-title">My Books</h1>
            <p className="mybooks-subtitle">{books.length} book{books.length !== 1 ? "s" : ""} total</p>
          </div>
          <button className="mybooks-upload-btn" onClick={() => navigate("/publisher-dashboard/upload")}>
            <Plus size={16} /> Upload New Book
          </button>
        </div>

        {/* Filter tabs */}
        <div className="mybooks-tabs">
          {["all", "published", "draft"].map(f => (
            <button
              key={f}
              className={`mybooks-tab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="mybooks-tab-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mybooks-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="mybook-skeleton">
                <div className="mybook-skeleton-cover loading-shimmer" />
                <div className="loading-shimmer" style={{ height: '12px', width: '80%', borderRadius: '6px', marginTop: '10px' }} />
                <div className="loading-shimmer" style={{ height: '10px', width: '55%', borderRadius: '6px', marginTop: '6px' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mybooks-empty">
            <span>{filter === "draft" ? "📝" : filter === "published" ? "📚" : "📦"}</span>
            <p>{filter === "all"
              ? "You haven't uploaded any books yet."
              : `No ${filter} books.`}
            </p>
            {filter === "all" && (
              <button className="empty-cta" onClick={() => navigate("/publisher-dashboard/upload")}>
                Upload Your First Book
              </button>
            )}
          </div>
        ) : (
          <div className="mybooks-grid">
            {filtered.map(book => (
              <BookCard
                key={book._id}
                book={book}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

      </main>

      <ToastContainer position="bottom-right" />
    </div>
  );
}