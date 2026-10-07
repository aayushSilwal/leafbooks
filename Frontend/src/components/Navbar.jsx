import { useState, useEffect, useRef } from "react";
import "../css/Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, User, LogOut, BookOpen, LayoutDashboard } from "lucide-react";

export default function Navbar({ handleLogout, user }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const isPublisherView = location.pathname.startsWith("/publisher");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/store?search=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  return (
    <nav className="navbar">

      {/* LEFT — Logo */}
      <div className="navbar-left">
        <img
          src="/LogoThree.png"
          className="logo-img"
          alt="LeafBooks Logo"
          onClick={() => navigate("/home")}
        />
      </div>

      {/* CENTER — Search */}
      <form className="navbar-search" onSubmit={handleSearch}>
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search books, authors, genres..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
      </form>

      {/* RIGHT — Bell + Profile */}
      <div className="navbar-right">

        {/* Notifications */}
        <button
          className="icon-btn"
          aria-label="Notifications"
          onClick={() => navigate("/notifications")}
        >
          <Bell size={18} />
        </button>

        {/* Profile Dropdown */}
        <div className="profile-circle" ref={dropdownRef} onClick={() => setOpen(!open)}>
          <img
            src={user?.picture || "/defaultProfile.jpg"}
            alt="Profile"
          />

          {open && (
            <div className="profile-dropdown">

              {/* User info header */}
              <div className="dropdown-header">
                <span className="dropdown-name">{user?.name || "Reader"}</span>
                <span className="dropdown-email">{user?.email || ""}</span>
              </div>

              <div className="dropdown-divider" />

              {/* My Profile */}
              <button onClick={() => { setOpen(false); navigate("/profile"); }}>
                <User size={15} /> My Profile
              </button>

              {/* Publisher / Reader view switch */}
              {user?.role === "publisher" && (
                <>
                  <div className="dropdown-divider" />
                  {isPublisherView ? (
                    <button onClick={() => { setOpen(false); navigate("/home"); }}>
                      <BookOpen size={15} /> Switch to Reader View
                    </button>
                  ) : (
                    <button className="publisher-view-btn" onClick={() => { setOpen(false); navigate("/publisher-dashboard"); }}>
                      <LayoutDashboard size={15} /> Switch to Publisher View
                    </button>
                  )}
                </>
              )}

              <div className="dropdown-divider" />

              {/* Sign Out */}
              <button
                className="signout-btn"
                onClick={() => { setOpen(false); handleLogout(); }}
              >
                <LogOut size={15} /> Sign Out
              </button>

            </div>
          )}
        </div>
      </div>

    </nav>
  );
}