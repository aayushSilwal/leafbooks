import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  BookOpen,
  ShoppingBag,
  PenSquare,
  LayoutDashboard,
  User,
  Menu,
} from "lucide-react";
import "../css/Siderbar.css";

export default function Sidebar({ user }) {
  const [expanded, setExpanded] = useState(false);

  const navItems = [
    { icon: <Home size={20} />, label: "Home", to: "/home" },
    { icon: <ShoppingBag size={20} />, label: "Store", to: "/store" },
    { icon: <BookOpen size={20} />, label: "Library", to: "/library" },
    { icon: <User size={20} />, label: "Profile", to: "/profile" },
  ];

  const publisherItem = user?.role === "publisher"
    ? { icon: <LayoutDashboard size={20} />, label: "Dashboard", to: "/publisher-dashboard" }
    : { icon: <PenSquare size={20} />, label: "Become Publisher", to: "/become-publisher" };

  return (
    <aside className={`sidebar ${expanded ? "expanded" : "collapsed"}`}>

      {/* Hamburger Toggle */}
      <button className="sidebar-hamburger" onClick={() => setExpanded(!expanded)}>
        <Menu size={20} />
      </button>

      <div className="sidebar-divider" />

      {/* Main Nav */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            {expanded && <span className="sidebar-label">{item.label}</span>}
          </NavLink>
        ))}

        <div className="sidebar-divider" />

        {/* Publisher item */}
        <NavLink
          to={publisherItem.to}
          className={({ isActive }) =>
            `sidebar-item publisher-item ${isActive ? "active" : ""}`
          }
        >
          <span className="sidebar-icon">{publisherItem.icon}</span>
          {expanded && <span className="sidebar-label">{publisherItem.label}</span>}
        </NavLink>
      </nav>



    </aside>
  );
}