import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, BookOpen, ShoppingCart, Tag, Library, Check, Lock, Star, Trash2, Gift } from "lucide-react";
import { notifySuccess, notifyError } from "../components/utils.jsx";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../css/BookDetail.css";
import { GiftModal, LendModal } from "../components/GiftLendModals.jsx";

export default function BookDetail({ user, handleLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [owned, setOwned] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [inBookshelf, setInBookshelf] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [userReview, setUserReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showLendModal, setShowLendModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [bookRes, ownedRes, shelfRes, reviewRes, accessRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/books/${id}`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/books/owned`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/books/bookshelf`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${id}`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL}/api/gifting/check-access/${id}`, { headers }),
        ]);

        const [bookData, ownedData, shelfData, reviewData, accessData] = await Promise.all([
          bookRes.json(), ownedRes.json(), shelfRes.json(), reviewRes.json(), accessRes.json()
        ]);

        if (bookData.success) setBook(bookData.book);
        else navigate("/home");

        if (ownedData.success) setOwned(ownedData.purchasedBooks.includes(id));
        if (shelfData.success) setInBookshelf(shelfData.bookshelf.some(b => b._id === id));
        if (accessData.success) setHasAccess(accessData.hasAccess);
        if (reviewData.success) {
          setReviews(reviewData.reviews);
          setAvgRating(reviewData.avgRating);
          setTotalReviews(reviewData.total);
          const mine = user?._id ? reviewData.reviews.find(r => r.user?._id === user._id) : null;
          if (mine) { setUserReview(mine); setReviewRating(mine.rating); setReviewComment(mine.comment); }
        }

      } catch (err) {
        console.error(err);
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAll();
  }, [id, navigate]);

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/initiate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: id })
      });
      const data = await res.json();

      if (!data.success) {
        notifyError(data.message);
        return;
      }

      // Build eSewa form and submit it
      const { paymentData, esewaUrl } = data;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = esewaUrl;

      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();

    } catch (err) {
      notifyError("Payment initiation failed. Try again.");
      setPurchasing(false);
    }
  };

  const handleBookshelf = async () => {
    try {
      const token = localStorage.getItem("token");
      if (inBookshelf) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/bookshelf/remove`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: id })
        });
        const data = await res.json();
        if (data.success) { setInBookshelf(false); notifySuccess("Removed from bookshelf."); }
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/books/bookshelf/add`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: id })
        });
        const data = await res.json();
        if (data.success) { setInBookshelf(true); notifySuccess("Added to bookshelf!"); }
      }
    } catch (err) {
      notifyError("Something went wrong.");
    }
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    notifySuccess(bookmarked ? "Bookmark removed" : "Bookmarked!");
  };

  const handleSubmitReview = async () => {
    if (!reviewRating) { notifyError("Please select a rating."); return; }
    if (!reviewComment.trim()) { notifyError("Please write a comment."); return; }
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      const data = await res.json();
      if (data.success) {
        notifySuccess(data.message);
        setUserReview(data.review);
        setReviews(prev => {
          const exists = prev.find(r => r._id === data.review._id);
          return exists ? prev.map(r => r._id === data.review._id ? data.review : r) : [data.review, ...prev];
        });
        setShowReviewForm(false);
      } else { notifyError(data.message); }
    } catch (err) { notifyError("Failed to submit review."); }
    finally { setSubmittingReview(false); }
  };

  const handleDeleteReview = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        notifySuccess("Review deleted.");
        setUserReview(null);
        setReviewRating(0);
        setReviewComment("");
        setReviews(prev => prev.filter(r => r.user._id !== user?._id));
      }
    } catch (err) { notifyError("Failed to delete review."); }
  };

  const handleRead = () => navigate(`/book/${id}/read`);
  const handleSample = () => navigate(`/book/${id}/read?sample=true`);

  if (loading) return (
    <div className="bookdetail-layout">
      <div className="bookdetail-skeleton">
        <div className="skeleton-cover" />
        <div className="skeleton-info">
          <div className="skeleton-line wide" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line short" />
        </div>
      </div>
    </div>
  );

  if (!book) return null;

  return (
    <div className={`bookdetail-layout ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Navbar handleLogout={handleLogout} user={user} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar user={user} isOpen={isSidebarOpen} />

      <main className="bookdetail-main">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="bookdetail-container">

          {/* LEFT — Cover + Actions */}
          <div className="bookdetail-left">
            <div className="bookdetail-cover">
              <img src={book.coverImage?.url} alt={book.title} />
              {book.isFree && <span className="cover-free-badge">Free</span>}
            </div>

            <div className="bookdetail-actions">

              {/* FREE BOOK — not owned */}
              {book.isFree && !owned && (
                <button className="btn-primary" onClick={() => setShowPurchaseModal(true)}>
                  <BookOpen size={17} /> Get for Free
                </button>
              )}

              {/* FREE BOOK — owned */}
              {book.isFree && owned && (
                <>
                  <div className="owned-badge">
                    <Check size={15} /> In your library
                  </div>
                  <button className="btn-primary" onClick={handleRead}>
                    <BookOpen size={17} /> Read Now
                  </button>
                </>
              )}

              {/* BORROWED ACCESS */}
              {!owned && hasAccess && (
                <>
                  <div className="owned-badge" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
                    <BookOpen size={15} /> Borrowed Access
                  </div>
                  <button className="btn-primary" onClick={handleRead}>
                    <BookOpen size={17} /> Read Now
                  </button>
                </>
              )}

              {/* PAID — OWNED */}
              {!book.isFree && owned && (
                <>
                  <div className="owned-badge">
                    <Check size={15} /> You own this book
                  </div>
                  <button className="btn-primary" onClick={handleRead}>
                    <BookOpen size={17} /> Read Now
                  </button>
                </>
              )}

              {/* PAID — NOT OWNED */}
              {!book.isFree && !owned && (
                <>
                  <button className="btn-primary" onClick={() => setShowPurchaseModal(true)}>
                    <ShoppingCart size={17} /> Buy — Rs.{book.price}
                  </button>
                  <button className="btn-secondary" onClick={handleSample}>
                    <Lock size={15} /> Read Sample
                  </button>
                </>
              )}

              {/* Bookshelf toggle — for all owned books */}
              {owned && (
                <button
                  className={`btn-shelf ${inBookshelf ? "in-shelf" : ""}`}
                  onClick={handleBookshelf}
                >
                  <Library size={16} />
                  {inBookshelf ? "In Bookshelf" : "Add to Bookshelf"}
                </button>
              )}



              {/* Gift & Lend — only for owned paid books */}
              {owned && !book.isFree && (
                <div className="gift-lend-row">
                  <button className="btn-gift" onClick={() => setShowGiftModal(true)}>
                    <Gift size={15} /> Gift
                  </button>
                  <button className="btn-lend" onClick={() => setShowLendModal(true)}>
                    <BookOpen size={15} /> Lend
                  </button>
                </div>
              )}

              {/* Bookmark */}
              <button
                className={`btn-bookmark ${bookmarked ? "bookmarked" : ""}`}
                onClick={handleBookmark}
              >
                <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
                {bookmarked ? "Bookmarked" : "Bookmark"}
              </button>

            </div>
          </div>

          {/* RIGHT — Info */}
          <div className="bookdetail-right">
            <span className="genre-badge">{book.genre}</span>
            <h1 className="bookdetail-title">{book.title}</h1>
            <p className="bookdetail-author">by <strong>{book.author}</strong></p>

            {book.publisher?.publisherName && (
              <p className="bookdetail-publisher">
                Published by <span>{book.publisher.publisherName}</span>
              </p>
            )}

            <div className="bookdetail-price">
              {book.isFree
                ? <span className="price-free">Free</span>
                : owned
                  ? <span className="price-owned"><Check size={16} /> Purchased</span>
                  : <span className="price-paid">Rs. {book.price}</span>
              }
            </div>

            <div className="bookdetail-description">
              <h3>About this book</h3>
              <p>{book.description}</p>
            </div>

            {book.tags?.length > 0 && (
              <div className="bookdetail-tags">
                <Tag size={13} />
                {book.tags.map(tag => (
                  <span key={tag} className="detail-tag">{tag}</span>
                ))}
              </div>
            )}

            <div className="bookdetail-stats">
              <div className="detail-stat">
                <span className="detail-stat-num">{book.totalSales}</span>
                <span className="detail-stat-label">Sales</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-num">{book.totalBorrows}</span>
                <span className="detail-stat-label">Borrows</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Reviews Section ─────────────────────────────── */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h2 className="reviews-title">
              Reviews
              {totalReviews > 0 && (
                <span className="reviews-avg">
                  <Star size={16} fill="#f59e0b" color="#f59e0b" /> {avgRating} · {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                </span>
              )}
            </h2>
            {owned && !showReviewForm && (
              <button className="write-review-btn" onClick={() => setShowReviewForm(true)}>
                {userReview ? "Edit Review" : "Write a Review"}
              </button>
            )}
          </div>

          {/* Review Form */}
          {owned && showReviewForm && (
            <div className="review-form">
              <h4>{userReview ? "Edit your review" : "Write your review"}</h4>

              {/* Star Rating */}
              <div className="star-picker">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    className="star-btn"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setReviewRating(star)}
                  >
                    <Star
                      size={28}
                      fill={(hoverRating || reviewRating) >= star ? "#f59e0b" : "none"}
                      color={(hoverRating || reviewRating) >= star ? "#f59e0b" : "#dde4ef"}
                    />
                  </button>
                ))}
                {reviewRating > 0 && (
                  <span className="rating-label">
                    {["","Terrible","Poor","Average","Good","Excellent"][reviewRating]}
                  </span>
                )}
              </div>

              <textarea
                className="review-textarea"
                placeholder="Share your thoughts about this book..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <div className="review-char-count">{reviewComment.length}/1000</div>

              <div className="review-form-actions">
                <button className="review-cancel" onClick={() => setShowReviewForm(false)}>Cancel</button>
                {userReview && (
                  <button className="review-delete" onClick={handleDeleteReview}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
                <button className="review-submit" onClick={handleSubmitReview} disabled={submittingReview}>
                  {submittingReview ? "Submitting..." : userReview ? "Update Review" : "Submit Review"}
                </button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="reviews-empty">
              <p>No reviews yet. {owned ? "Be the first to review!" : "Purchase to leave a review."}</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.filter(r => r.user).map(review => (
                <div key={review._id} className={`review-card ${user?._id && review.user?._id === user._id ? "own-review" : ""}`}>
                  <div className="review-top">
                    <div className="reviewer-info">
                      <img
                        src={review.user?.picture || "/defaultProfile.jpg"}
                        alt={review.user?.name}
                        className="reviewer-avatar"
                      />
                      <div>
                        <p className="reviewer-name">{review.user?.name}</p>
                        <p className="review-date">
                          {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="review-stars">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} fill={s <= review.rating ? "#f59e0b" : "none"} color={s <= review.rating ? "#f59e0b" : "#dde4ef"} />
                      ))}
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Gift Modal */}
      {showGiftModal && book && (
        <GiftModal
          book={book}
          onClose={() => setShowGiftModal(false)}
          notifySuccess={notifySuccess}
          notifyError={notifyError}
        />
      )}

      {/* Lend Modal */}
      {showLendModal && book && (
        <LendModal
          book={book}
          onClose={() => setShowLendModal(false)}
          notifySuccess={notifySuccess}
          notifyError={notifyError}
        />
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="purchase-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-cover">
              <img src={book.coverImage?.url} alt={book.title} />
            </div>
            <div className="modal-info">
              <h3>{book.title}</h3>
              <p className="modal-author">by {book.author}</p>
              <div className="modal-price">${book.price}</div>

              <div className="modal-note">
                <Lock size={13} />
                <span>{book.isFree ? "This book is free — no payment required." : "You will be redirected to eSewa to complete payment."}</span>
              </div>

              <div className="modal-actions">
                <button className="modal-cancel" onClick={() => setShowPurchaseModal(false)}>
                  Cancel
                </button>
                <button
                  className="modal-confirm"
                  onClick={handlePurchase}
                  disabled={purchasing}
                >
                  {purchasing ? "Redirecting to eSewa..." : book.isFree ? "Get for Free" : `Pay Rs. ${book.price} via eSewa`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}