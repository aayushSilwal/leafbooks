import { useState } from "react";
import { X, Gift, BookOpen, Mail } from "lucide-react";
import "../css/GiftLendModals.css";

function EmailInput({ label, value, onChange, placeholder }) {
  return (
    <div className="gl-field">
      <label>{label}</label>
      <div className="gl-input-wrap">
        <Mail size={15} />
        <input
          type="email"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

export function GiftModal({ book, onClose, notifySuccess, notifyError }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) { notifyError("Please enter recipient's email."); return; }
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gifting/send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book._id, recipientEmail: email, message })
      });
      const data = await res.json();
      if (data.success) { notifySuccess(data.message); onClose(); }
      else notifyError(data.message);
    } catch { notifyError("Failed to send gift."); }
    finally { setSending(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="gl-modal" onClick={e => e.stopPropagation()}>

        <div className="gl-modal-header gift">
          <div className="gl-modal-icon"><Gift size={22} /></div>
          <div>
            <h3>Gift Book</h3>
            <p>Permanently transfer <strong>{book.title}</strong> to someone</p>
          </div>
          <button className="gl-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="gl-modal-body">
          <div className="gl-warning">
            ⚠️ This is permanent. You will <strong>lose access</strong> to this book once the recipient accepts.
          </div>

          <EmailInput
            label="Recipient's Email"
            value={email}
            onChange={setEmail}
            placeholder="friend@example.com"
          />

          <div className="gl-field">
            <label>Personal Message <span className="optional">(optional)</span></label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enjoy this book! I think you'll love it..."
              rows={3}
              maxLength={300}
            />
            <span className="gl-char-count">{message.length}/300</span>
          </div>
        </div>

        <div className="gl-modal-footer">
          <button className="gl-cancel" onClick={onClose}>Cancel</button>
          <button className="gl-submit gift" onClick={handleSend} disabled={sending}>
            {sending ? "Sending..." : <><Gift size={15} /> Send Gift</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LendModal({ book, onClose, notifySuccess, notifyError }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleLend = async () => {
    if (!email.trim()) { notifyError("Please enter borrower's email."); return; }
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gifting/lend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book._id, borrowerEmail: email })
      });
      const data = await res.json();
      if (data.success) { notifySuccess(data.message); onClose(); }
      else notifyError(data.message);
    } catch { notifyError("Failed to lend book."); }
    finally { setSending(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="gl-modal" onClick={e => e.stopPropagation()}>

        <div className="gl-modal-header lend">
          <div className="gl-modal-icon"><BookOpen size={22} /></div>
          <div>
            <h3>Lend Book</h3>
            <p>Give temporary access to <strong>{book.title}</strong></p>
          </div>
          <button className="gl-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="gl-modal-body">
          <div className="gl-info">
            📅 The borrower gets <strong>7 days</strong> of read access. You keep ownership and the book returns automatically.
          </div>

          <EmailInput
            label="Borrower's Email"
            value={email}
            onChange={setEmail}
            placeholder="friend@example.com"
          />
        </div>

        <div className="gl-modal-footer">
          <button className="gl-cancel" onClick={onClose}>Cancel</button>
          <button className="gl-submit lend" onClick={handleLend} disabled={sending}>
            {sending ? "Lending..." : <><BookOpen size={15} /> Lend for 7 Days</>}
          </button>
        </div>
      </div>
    </div>
  );
}