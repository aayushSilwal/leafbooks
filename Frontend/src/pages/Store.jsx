import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, LayoutGrid, List, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../css/Store.css";

const GENRES = [
  "All", "Fiction", "Non-Fiction", "Mystery", "Romance", "Science Fiction",
  "Fantasy", "Biography", "Self-Help", "History", "Horror",
  "Thriller", "Children", "Academic", "Poetry", "Other"
];

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest" },
  { value: "popular",    label: "Most Popular" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

function GridCard({ book, onClick }) {
  return (
    <div className="store-grid-card" onClick={() => onClick(book)}>
      <div className="store-grid-cover">
        <img src={book.coverImage?.url} alt={book.title} />
        {book.isFree
          ? <span className="store-badge free">Free</span>
          : <span className="store-badge paid">Rs. {book.price}</span>
        }
      </div>
      <div className="store-grid-info">
        <h4 className="store-grid-title">{book.title}</h4>
        <p className="store-grid-author">{book.author}</p>
        <p className="store-grid-publisher">{book.publisher?.publisherName}</p>
      </div>
    </div>
  );
}

function ListCard({ book, onClick }) {
  return (
    <div className="store-list-card" onClick={() => onClick(book)}>
      <div className="store-list-cover">
        <img src={book.coverImage?.url} alt={book.title} />
      </div>
      <div className="store-list-info">
        <div className="store-list-top">
          <span className="store-list-genre">{book.genre}</span>
          {book.isFree
            ? <span className="store-badge free">Free</span>
            : <span className="store-badge paid">Rs. {book.price}</span>
          }
        </div>
        <h4 className="store-list-title">{book.title}</h4>
        <p className="store-list-author">by {book.author}</p>
        <p className="store-list-desc">{book.description?.slice(0, 120)}...</p>
        <p className="store-list-publisher">{book.publisher?.publisherName}</p>
      </div>
    </div>
  );
}

export default function Store({ user, handleLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [genre, setGenre] = useState(searchParams.get("genre") || "All");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);

  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const searchTimeout = useRef(null);

  const fetchBooks = useCallback(async (params) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const query = new URLSearchParams({
        search: params.search || "",
        genre: params.genre === "All" ? "" : (params.genre || ""),
        sort: params.sort || "newest",
        page: params.page || 1,
        limit: 18,
      });

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/store?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBooks(data.books);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch store books:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on filter/sort/page change
  useEffect(() => {
    fetchBooks({ search, genre, sort, page });
    setSearchParams({ search, genre, sort, page });
  }, [genre, sort, page]);

  // Debounce search
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchBooks({ search: val, genre, sort, page: 1 });
      setSearchParams({ search: val, genre, sort, page: 1 });
    }, 400);
  };

  const handleGenreChange = (g) => { setGenre(g); setPage(1); };
  const handleSortChange = (s) => { setSort(s); setPage(1); };
  const handleBookClick = (book) => navigate(`/book/${book._id}`);

  const clearFilters = () => {
    setSearch(""); setGenre("All"); setSort("newest"); setPage(1);
    fetchBooks({ search: "", genre: "All", sort: "newest", page: 1 });
  };

  const hasActiveFilters = genre !== "All" || sort !== "newest" || search !== "";

  return (
    <div className={`store-layout ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Navbar handleLogout={handleLogout} user={user} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar user={user} isOpen={isSidebarOpen} />

      <main className="store-main">

        {/* Header */}
        <div className="store-header">
          <div className="store-header-left">
            <h1 className="store-title">Browse Books</h1>
            <p className="store-subtitle">
              {loading ? "Loading..." : `${total} book${total !== 1 ? "s" : ""} available`}
            </p>
          </div>

          {/* Search */}
          <div className="store-search-bar">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => handleSearchChange("")}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="store-controls">
            <button
              className={`filter-toggle ${showFilters ? "active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={15} />
              Filters
              {hasActiveFilters && <span className="filter-dot" />}
            </button>

            <div className="view-toggle">
              <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>
                <LayoutGrid size={16} />
              </button>
              <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="store-filters">
            <div className="filter-group">
              <label>Genre</label>
              <div className="genre-pills">
                {GENRES.map(g => (
                  <button
                    key={g}
                    className={`genre-pill ${genre === g ? "active" : ""}`}
                    onClick={() => handleGenreChange(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <div className="sort-options">
                {SORT_OPTIONS.map(s => (
                  <button
                    key={s.value}
                    className={`sort-btn ${sort === s.value ? "active" : ""}`}
                    onClick={() => handleSortChange(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button className="clear-filters" onClick={clearFilters}>
                <X size={13} /> Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Books */}
        {loading ? (
          <div className={viewMode === "grid" ? "store-grid" : "store-list"}>
            {[...Array(12)].map((_, i) => (
              viewMode === "grid"
                ? <div key={i} className="store-grid-skeleton">
                    <div className="skeleton-cover loading-shimmer" />
                    <div className="skeleton-line loading-shimmer" style={{ width: '80%', height: '12px', marginTop: '8px' }} />
                    <div className="skeleton-line loading-shimmer" style={{ width: '55%', height: '10px', marginTop: '6px' }} />
                  </div>
                : <div key={i} className="store-list-skeleton loading-shimmer" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="store-empty">
            <span>🔍</span>
            <p>No books found. Try adjusting your filters.</p>
            {hasActiveFilters && (
              <button className="empty-cta" onClick={clearFilters}>Clear Filters</button>
            )}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "store-grid" : "store-list"}>
            {books.map(book =>
              viewMode === "grid"
                ? <GridCard key={book._id} book={book} onClick={handleBookClick} />
                : <ListCard key={book._id} book={book} onClick={handleBookClick} />
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="store-pagination">
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} /> Prev
            </button>

            <div className="page-numbers">
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                  return (
                    <button
                      key={p}
                      className={`page-num ${p === page ? "active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === page - 2 || p === page + 2) {
                  return <span key={p} className="page-ellipsis">...</span>;
                }
                return null;
              })}
            </div>

            <button
              className="page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}

      </main>
      <ToastContainer position="bottom-right" />
    </div>
  );
}