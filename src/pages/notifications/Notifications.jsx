import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, showToast } from "../../components/Toast";
import { timeAgo } from "../../utils/timeAgo";
import { Home as HomeIcon, User as UserIcon, LogOut, Bell, Trash2 } from "lucide-react";

// Base URL for API calls — set VITE_API_BASE in .env for production
const API = import.meta.env.VITE_API_BASE || "";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myUsername, setMyUsername] = useState("");

  const navigate = useNavigate();

  // On page load: check if user is logged in, then fetch notifications
  useEffect(() => {
    // Check auth session
    fetch(`${API}/api/auth/me`, { credentials: "include" })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setMyUsername(data.username))
      .catch(() => navigate("/login")); // Redirect to login if not authenticated

    fetchNotifications();
  }, [navigate]);

  // Fetch the list of notifications from the server
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/notifications/`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete all notifications
  const handleClearAll = async () => {
    try {
      const res = await fetch(`${API}/api/notifications/`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        setNotifications([]);
        showToast("Notifications cleared");
      }
    } catch (err) {
      console.error("Clear notifications error:", err);
    }
  };

  // Log the user out and redirect to login page
  const handleLogout = async () => {
    await fetch(`${API}/api/auth/logout`, { method: "POST", credentials: "include" });
    navigate("/login");
  };

  // Return avatar image URL (use dicebear fallback if no profile image)
  const getAvatarUrl = (user) => {
    if (user?.profileImg?.trim()) return user.profileImg;
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || "default"}`;
  };

  return (
    <div className="layout">
      {/* Left sidebar navigation */}
      <div className="sidebar">
        <h2>X Clone</h2>
        <Link to="/" className="sidebar-link"><HomeIcon size={22} /> Home</Link>
        {myUsername && <Link to={`/profile/${myUsername}`} className="sidebar-link"><UserIcon size={22} /> Profile</Link>}
        <Link to="/notifications" className="sidebar-link" style={{ color: "var(--accent-color)" }}>
          <Bell size={22} /> Notifications
        </Link>
        <button onClick={handleLogout} className="sidebar-btn">
          <LogOut size={18} /> Log out
        </button>
      </div>

      {/* Main content area */}
      <div className="main-content">
        <div className="main-header" style={{ justifyContent: "space-between" }}>
          <h3>Notifications</h3>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="delete-post-btn"
              style={{ display: "flex", alignItems: "center", gap: "6px", borderRadius: "8px", padding: "6px 12px" }}
            >
              <Trash2 size={15} /> Clear all
            </button>
          )}
        </div>

        {/* Loading skeleton */}
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="post-card skeleton-card">
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div className="skeleton skeleton-avatar" style={{ width: "40px", height: "40px" }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-line" style={{ width: "60%", height: "14px" }} />
                </div>
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          // Empty state
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
            <Bell size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
            <p style={{ fontSize: "20px", fontWeight: "700" }}>Nothing to see here — yet</p>
            <p style={{ fontSize: "14px", marginTop: "6px" }}>When you get likes or new followers, they'll show up here.</p>
          </div>
        ) : (
          // List of notifications
          notifications.map(n => (
            <div key={n._id} className="notification-item" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <Link
                to={`/profile/${n.from?.username}`}
                className="notification-avatar"
                style={{ backgroundImage: `url(${getAvatarUrl(n.from)})` }}
              />
              <div className="notification-body">
                <Link to={`/profile/${n.from?.username}`} className="post-author">
                  {n.from?.fullname || n.from?.username}
                </Link>
                <span style={{ color: "var(--text-secondary)", marginLeft: "6px" }}>
                  {n.type === "like" ? "❤️ liked your post" : "🔔 followed you"}
                </span>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px", marginLeft: "8px" }}>
                  · {n.createdAt ? timeAgo(n.createdAt) : ""}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <ToastContainer />
    </div>
  );
}
