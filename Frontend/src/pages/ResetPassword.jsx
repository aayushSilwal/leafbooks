import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { notifySuccess, notifyError } from "../components/utils.jsx";
import "../css/ForgotPages.css"; // uses the styles you provided

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const token = searchParams.get("token"); // token from the reset link

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      notifyError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:8080/password/reset-password`, {
        token,
        newPassword: password,
      });
      notifySuccess(res.data.message || "Password reset successfully!");
      navigate("/login");
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <img 
        src="/LogoTwo.png"
        className="login-logo"
        alt="LeafBooks Logo"
        onClick={() => navigate("/")}
      />
      <div className="auth-box">
        <h2 className="auth-title">Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
            required
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
