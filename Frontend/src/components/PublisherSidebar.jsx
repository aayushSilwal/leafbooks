import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Upload,
  BookMarked,
  DollarSign,
  Settings,
  Menu,
} from "lucide-react";
import "../css/PublisherSidebar.css";

export default function PublisherSidebar({ user }) {
  const [expanded, setExpanded] = useState(true);

  const navItems = [
    { icon: <Upload size={20} />,      label: "Upload Books",  to: "/publisher-dashboard/upload" },
    { icon: <BookMarked size={20} />,  label: "My Books",      to: "/publisher-dashboard/books" },
    { icon: <DollarSign size={20} />,  label: "Earnings",      to: "/publisher-dashboard/earnings" },
  ];

  return (
    <aside className={`pub-sidebar ${expanded ? "expanded" : "collapsed"}`}>

      {/* Hamburger */}
      <button className="pub-sidebar-hamburger" onClick={() => setExpanded(!expanded)}>
        <Menu size={20} />
      </button>

      <div className="pub-sidebar-divider" />

      {/* Publisher badge */}
      {expanded && (
        <div className="pub-sidebar-badge">
          <span className="pub-badge-dot" />
          <span className="pub-badge-label">Publisher Studio</span>
        </div>
      )}

      {/* Nav */}
      <nav className="pub-sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `pub-sidebar-item ${isActive ? "active" : ""}`
            }
            title={!expanded ? item.label : ""}
          >
            <span className="pub-sidebar-icon">{item.icon}</span>
            {expanded && <span className="pub-sidebar-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}