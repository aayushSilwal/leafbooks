import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/BecomePublisher.css"

export default function BecomePublisherPage({ user, token }) {
  const navigate = useNavigate();
  const [agree, setAgree] = useState(false);
  const [publisherName, setPublisherName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async () => {
    if (!agree) {
      toast.error("You must agree to the publisher terms");
      return;
    }

    if (!publisherName.trim()) {
      toast.error("Publisher Name cannot be empty");
      return;
    }

    const authToken = token || localStorage.getItem("token");

    if (!authToken) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/publisher/become`,
        { publisherName: publisherName.trim(), bio: bio.trim() },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      toast.success("Application submitted! Awaiting admin approval. You'll be notified once approved.");
      setTimeout(() => navigate("/home"), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error becoming publisher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="become-publisher-page">
      <h2>Become a Publisher</h2>
      <p className="page-subtitle">
        Share your stories with the world on Leaf-Books.
      </p>

      {/* Publisher Name */}
      <div className="form-group">
        <label htmlFor="publisherName">Publisher Name *</label>
        <input
          id="publisherName"
          type="text"
          placeholder="Your publisher name"
          value={publisherName}
          onChange={(e) => setPublisherName(e.target.value)}
        />
      </div>

      {/* Optional Bio */}
      <div className="form-group">
        <label htmlFor="bio">Short Bio <span className="optional">(optional)</span></label>
        <textarea
          id="bio"
          placeholder="Tell readers a little about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
        />
      </div>

      {/* Publisher Agreement */}
      <div className="agreement-box">
        <h3>Publisher Terms & Agreement</h3>

        <div className="agreement-text">
          <p>
            <strong>1. Original Content</strong><br />
            You agree to only publish content that you own or have full rights to distribute.
            Plagiarism or unauthorized republishing of others' work is strictly prohibited.
          </p>

          <p>
            <strong>2. Copyright Compliance</strong><br />
            You retain ownership of your work. By publishing on Leaf-Books, you grant us a
            non-exclusive license to display and distribute your content on our platform.
          </p>

          <p>
            <strong>3. Read-Only Access</strong><br />
            All books on Leaf-Books are available for online reading only. Downloads of any
            kind are not permitted. You agree that your content will be protected under this
            policy and that Leaf-Books will enforce this restriction for all users.
          </p>

          <p>
            <strong>4. Borrow & Share Feature</strong><br />
            Readers may borrow or share your book with other users for a limited period.
            You will receive credit for borrows as part of your earnings. Shared and borrowed
            access is temporary and fully controlled by the platform — readers cannot retain
            permanent access outside of a purchase.
          </p>

          <p>
            <strong>5. Earnings & Revenue</strong><br />
            You earn from both purchases and borrows of your books. Payout rates, borrow
            credit calculations, and payment schedules are outlined in your Publisher
            Dashboard once your account is approved.
          </p>

          <p>
            <strong>6. Content Moderation</strong><br />
            Leaf-Books reserves the right to remove, suspend, or restrict any content that
            violates our community guidelines, copyright law, or terms of service — without
            prior notice. Repeated violations may result in permanent removal of publisher
            status.
          </p>

          <p>
            <strong>7. Account Responsibility</strong><br />
            You are solely responsible for all content published under your account.
            Misuse, policy violations, or fraudulent activity may result in suspension or
            permanent termination of your publisher and user account.
          </p>
        </div>
      </div>

      {/* Agreement Checkbox */}
      <div className="checkbox-group">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          id="agree"
        />
        <label htmlFor="agree">
          I have read and agree to the Leaf-Books Publisher Terms & Agreement
        </label>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!agree || !publisherName.trim() || loading}
        className="submit-btn"
      >
        {loading ? "Submitting..." : "Become a Publisher"}
      </button>
      <ToastContainer position="bottom-right" />
    </div>
  );
}