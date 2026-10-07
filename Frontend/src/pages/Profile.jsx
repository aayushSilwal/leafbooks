import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Eye, EyeOff, Trash2, LogOut, Save, Lock, User, Mail, Shield } from "lucide-react";
import { notifySuccess, notifyError } from "../components/utils.jsx";
import { ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../css/Profile.css";

export default function Profile({ user, setUser, handleLogout }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [savingName, setSavingName] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  const [uploadingPic, setUploadingPic] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── Update Name ───────────────────────────────────────────
  const handleSaveName = async () => {
    if (!name.trim()) return notifyError("Name cannot be empty.");
    setSavingName(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) { setUser(data.user); notifySuccess(data.message); }
      else notifyError(data.message);
    } catch { notifyError("Failed to update name."); }
    finally { setSavingName(false); }
  };

  // ── Change Password ───────────────────────────────────────
  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm)
      return notifyError("All password fields are required.");
    if (passwords.new !== passwords.confirm)
      return notifyError("New passwords do not match.");
    if (passwords.new.length < 8)
      return notifyError("Password must be at least 8 characters.");

    setSavingPw(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/change-password`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new })
      });
      const data = await res.json();
      if (data.success) {
        notifySuccess(data.message);
        setPasswords({ current: "", new: "", confirm: "" });
      } else notifyError(data.message);
    } catch { notifyError("Failed to change password."); }
    finally { setSavingPw(false); }
  };

  // ── Profile Picture ───────────────────────────────────────
  const handlePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append("picture", file);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile-picture`, {
        method: "PUT",
        headers,
        body: formData
      });
      const data = await res.json();
      if (data.success) { setUser(data.user); notifySuccess(data.message); }
      else notifyError(data.message);
    } catch { notifyError("Failed to upload picture."); }
    finally { setUploadingPic(false); }
  };

  // ── Delete Account ────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/user/account`, {
        method: "DELETE", headers
      });
      const data = await res.json();
      if (data.success) {
        handleLogout();
        navigate("/");
      } else notifyError(data.message);
    } catch { notifyError("Failed to delete account."); }
    finally { setDeleting(false); }
  };

  const isGoogleUser = user?.authType === "google";

  return (
    <div className={`profile-layout ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <Navbar handleLogout={handleLogout} user={user} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar user={user} isOpen={isSidebarOpen} />

      <main className="profile-main">
        <div className="profile-page">

          {/* ── Avatar Card ─────────────────────────────────── */}
          <div className="profile-avatar-card">
            <div className="avatar-wrapper">
              <img
                src={user?.picture || "/defaultProfile.jpg"}
                alt="Profile"
                className="avatar-img"
              />
              <button
                className="avatar-edit-btn"
                onClick={() => fileRef.current.click()}
                disabled={uploadingPic}
              >
                {uploadingPic ? <div className="avatar-spinner" /> : <Camera size={15} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePictureChange} hidden />
            </div>

            <div className="avatar-info">
              <h2 className="avatar-name">{user?.name}</h2>
              <p className="avatar-email">{user?.email}</p>
              <span className={`avatar-badge ${user?.role}`}>
                {user?.role === "publisher" ? "Publisher" : "Reader"}
              </span>
            </div>
          </div>

          <div className="profile-sections">

            {/* ── Name & Email ─────────────────────────────── */}
            <div className="profile-card">
              <div className="profile-card-header">
                <User size={17} />
                <h3>Personal Info</h3>
              </div>

              <div className="profile-field">
                <label>Display Name</label>
                <div className="field-row">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                  />
                  <button
                    className="save-btn"
                    onClick={handleSaveName}
                    disabled={savingName || name === user?.name}
                  >
                    {savingName ? "Saving..." : <><Save size={14} /> Save</>}
                  </button>
                </div>
              </div>

              <div className="profile-field">
                <label>Email Address</label>
                <div className="field-row">
                  <input value={user?.email || ""} disabled />
                  {isGoogleUser && <span className="google-tag"><Mail size={12} /> Google</span>}
                </div>
                <p className="field-hint">Email cannot be changed.</p>
              </div>
            </div>

            {/* ── Change Password ──────────────────────────── */}
            <div className="profile-card">
              <div className="profile-card-header">
                <Lock size={17} />
                <h3>Change Password</h3>
              </div>

              {isGoogleUser ? (
                <div className="google-notice">
                  <Shield size={16} />
                  <p>You signed in with Google. Password management is handled by Google.</p>
                </div>
              ) : (
                <>
                  {["current", "new", "confirm"].map(field => (
                    <div className="profile-field" key={field}>
                      <label>
                        {field === "current" ? "Current Password"
                          : field === "new" ? "New Password"
                          : "Confirm New Password"}
                      </label>
                      <div className="field-row">
                        <div className="pw-input-wrap">
                          <input
                            type={showPw[field] ? "text" : "password"}
                            value={passwords[field]}
                            onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                            placeholder="••••••••"
                          />
                          <button
                            className="pw-toggle"
                            onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                            type="button"
                          >
                            {showPw[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    className="save-btn full"
                    onClick={handleChangePassword}
                    disabled={savingPw}
                  >
                    {savingPw ? "Updating..." : <><Lock size={14} /> Update Password</>}
                  </button>
                </>
              )}
            </div>

            {/* ── Account Settings ─────────────────────────── */}
            <div className="profile-card danger-card">
              <div className="profile-card-header">
                <Shield size={17} />
                <h3>Account Settings</h3>
              </div>

              <div className="settings-row">
                <div>
                  <p className="settings-label">Sign Out</p>
                  <p className="settings-hint">Sign out of your account on this device.</p>
                </div>
                <button className="settings-btn outline" onClick={handleLogout}>
                  <LogOut size={15} /> Sign Out
                </button>
              </div>

              <div className="settings-divider" />

              <div className="settings-row">
                <div>
                  <p className="settings-label danger">Delete Account</p>
                  <p className="settings-hint">Permanently delete your account and all data. This cannot be undone.</p>
                </div>
                <button className="settings-btn danger" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon"><Trash2 size={28} /></div>
            <h3>Delete Account?</h3>
            <p>This will permanently delete your account, purchases, and all data. This action <strong>cannot be undone</strong>.</p>
            <div className="delete-modal-actions">
              <button className="modal-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="modal-delete" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" />
    </div>
  );
}