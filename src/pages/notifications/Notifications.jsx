import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import { ToastContainer, showToast } from "../../components/Toast";
import { timeAgo } from "../../utils/timeAgo";
import { Home as HomeIcon, User as UserIcon, LogOut, Bell, Trash2 } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myUsername, setMyUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/api/auth/me")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setMyUsername(data.username))
      .catch(() => navigate("/login"));

    fetchNotifications();
  }, [navigate]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications/");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleClearAll = async () => {
    try {
      const res = await apiFetch("/api/notifications/", { method: "DELETE" });
      if (res.ok) {
        setNotifications([]);
        showToast("Notifications cleared");
      }
    } catch (e) { console.error(e); }
  };

  const getAvatarUrl = (user) => {
    if (user?.profileImg?.trim()) return user.profileImg;
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'default'}`;
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h2>X Clone</h2>
        <Link to="/" className="sidebar-link"><HomeIcon size={22} /> Home</Link>
        {myUsername && <Link to={`/profile/${myUsername}`} className="sidebar-link"><UserIcon size={22} /> Profile</Link>}
        <Link to="/notifications" className="sidebar-link" style={{ color: "var(--accent-color)" }}><Bell size={22} /> Notifications</Link>
        <button onClick={async () => { await apiFetch("/api/auth/logout", { method: "POST" }); navigate("/login"); }} className="sidebar-btn">
          <LogOut size={18} /> Log out
        </button>
      </div>

      <div className="main-content">
        <div className="main-header" style={{ justifyContent: "space-between" }}>
          <h3>Notifications</h3>
          {notifications.length > 0 && (
            <button onClick={handleClearAll} className="delete-post-btn" title="Clear all" style={{ display: "flex", alignItems: "center", gap: "6px", borderRadius: "8px", padding: "6px 12px" }}>
              <Trash2 size={15} /> Clear all
            </button>
          )}
        </div>

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
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
            <Bell size={48} style={{ opacity: 0.3, marginBottom: "12px" }} />
            <p style={{ fontSize: "20px", fontWeight: "700" }}>Nothing to see here — yet</p>
            <p style={{ fontSize: "14px", marginTop: "6px" }}>When you get likes or new followers, they'll show up here.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n._id} className="notification-item" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <Link
                to={`/profile/${n.from?.username}`}
                className="notification-avatar"
                style={{ backgroundImage: `url(${getAvatarUrl(n.from)})` }}
              />
              <div className="notification-body">
                <Link to={`/profile/${n.from?.username}`} className="post-author">{n.from?.fullname || n.from?.username}</Link>
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
