import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, BookOpen, Library } from "lucide-react";
import "../css/PaymentResult.css";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);

  const bookId   = params.get("bookId");
  const txnId    = params.get("txnId");
  const esewaRef = params.get("esewaRef");
  const amount   = params.get("amount");

  useEffect(() => {
    if (!bookId) return;
    const token = localStorage.getItem("token");
    fetch(`${import.meta.env.VITE_API_URL}/api/books/${bookId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setBook(d.book); });
  }, [bookId]);

  const date = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="payment-result-page">
      <div className="payment-result-card receipt">

        {/* Header — logo + date */}
        <div className="receipt-header">
          <div className="receipt-logo">
            <img src="/LogoThree.png" alt="Leaf" />
          </div>
          <span className="receipt-date">{date}</span>
        </div>

        {/* Status */}
        <div className="receipt-status-block">
          <div className="payment-result-icon success">
            <CheckCircle size={22} strokeWidth={1.8} />
          </div>
          <div>
            <h2>Payment successful</h2>
            <p>
              {book
                ? <><span className="book-name-highlight">{book.title}</span> added to your library.</>
                : "Your book has been added to your Leaf library."}
            </p>
          </div>
        </div>

        {/* Book row */}
        {book && (
          <div className="receipt-book-row">
            <div className="receipt-thumb">
              {book.coverImage?.url
                ? <img src={book.coverImage.url} alt={book.title} />
                : <BookOpen size={20} />}
            </div>
            <div className="receipt-book-info">
              <p className="receipt-book-title">{book.title}</p>
              <p className="receipt-book-author">by {book.author}</p>
              <span className="receipt-book-badge">Digital copy · Leaf library</span>
            </div>
            <span className="receipt-book-price">Rs. {amount ?? book.price}</span>
          </div>
        )}

        {/* Totals */}
        <div className="receipt-totals">
          <div className="receipt-row">
            <span>Subtotal</span>
            <span>Rs. {amount}</span>
          </div>
          <div className="receipt-row">
            <span>Tax</span>
            <span>Rs. 0</span>
          </div>
          <div className="receipt-row grand">
            <span>Total paid</span>
            <span>Rs. {amount}</span>
          </div>
        </div>

        {/* Meta */}
        <div className="receipt-meta">
          <div className="receipt-row">
            <span>Payment method</span>
            <span className="esewa-badge">eSewa</span>
          </div>
          {txnId && (
            <div className="receipt-row">
              <span>Transaction ID</span>
              <code className="receipt-code">{txnId}</code>
            </div>
          )}
          {esewaRef && (
            <div className="receipt-row">
              <span>eSewa ref</span>
              <code className="receipt-code">{esewaRef}</code>
            </div>
          )}
          <div className="receipt-row">
            <span>Status</span>
            <span className="receipt-status-complete">Complete</span>
          </div>
        </div>

        {/* Actions */}
        <div className="payment-result-actions">
          {bookId && (
            <button className="btn-read" onClick={() => navigate(`/book/${bookId}/read`)}>
              <BookOpen size={15} /> Read now
            </button>
          )}
          <button className="btn-library" onClick={() => navigate("/library")}>
            <Library size={15} /> Go to my library
          </button>
        </div>

      </div>
    </div>
  );
}