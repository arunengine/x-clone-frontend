import { Link } from "react-router-dom";
import { Home as HomeIcon, User as UserIcon, LogOut, Bell } from "lucide-react";

export default function Navbar({ currentTab, myUsername, unreadCount = 0, onLogout }) {
  return (
    <>
      {/* Mobile Sticky Top Header */}
      <div className="mobile-top-header">
        <h2 className="mobile-logo">X Clone</h2>
        <div className="mobile-top-actions">
          {myUsername && (
            <Link to={`/profile/${myUsername}`} className="mobile-avatar-link" title="Profile">
              <UserIcon size={20} />
            </Link>
          )}
          <button onClick={onLogout} className="mobile-icon-btn" title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Desktop Left Sidebar */}
      <div className="sidebar">
        <h2>X Clone</h2>
        <Link
          to="/"
          className="sidebar-link"
          style={{ color: currentTab === "home" ? "var(--accent-color)" : undefined }}
        >
          <HomeIcon size={22} /> Home
        </Link>

        {myUsername && (
          <Link
            to={`/profile/${myUsername}`}
            className="sidebar-link"
            style={{ color: currentTab === "profile" ? "var(--accent-color)" : undefined }}
          >
            <UserIcon size={22} /> Profile
          </Link>
        )}

        <div className="sidebar-link-wrapper">
          <Link
            to="/notifications"
            className="sidebar-link"
            style={{ color: currentTab === "notifications" ? "var(--accent-color)" : undefined }}
          >
            <Bell size={22} /> Notifications
          </Link>
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
          )}
        </div>

        <button onClick={onLogout} className="sidebar-btn">
          <LogOut size={18} /> Log out
        </button>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <Link
          to="/"
          className={`mobile-nav-item ${currentTab === "home" ? "active" : ""}`}
          title="Home"
        >
          <HomeIcon size={22} />
          <span>Home</span>
        </Link>

        <div className="mobile-nav-item-wrapper">
          <Link
            to="/notifications"
            className={`mobile-nav-item ${currentTab === "notifications" ? "active" : ""}`}
            title="Notifications"
          >
            <Bell size={22} />
            <span>Notifs</span>
          </Link>
          {unreadCount > 0 && (
            <span className="notif-badge mobile-badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {myUsername && (
          <Link
            to={`/profile/${myUsername}`}
            className={`mobile-nav-item ${currentTab === "profile" ? "active" : ""}`}
            title="Profile"
          >
            <UserIcon size={22} />
            <span>Profile</span>
          </Link>
        )}

        <button onClick={onLogout} className="mobile-nav-item nav-btn" title="Log out">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
}
