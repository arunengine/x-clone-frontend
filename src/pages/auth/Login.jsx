import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "";

const DEMO_CREDENTIALS = [
  {
    role: "John Doe",
    badge: "👤",
    username: "johndoe",
    password: "password123",
    bg: "rgba(29, 155, 240, 0.08)",
    border: "rgba(29, 155, 240, 0.25)",
    badgeColor: "#1d9bf0",
  },
  {
    role: "Jane Smith",
    badge: "👩‍💼",
    username: "janedoe",
    password: "password123",
    bg: "rgba(0, 186, 124, 0.08)",
    border: "rgba(0, 186, 124, 0.25)",
    badgeColor: "#00ba7c",
  },
  {
    role: "Guest Account",
    badge: "⚡",
    username: "guest",
    password: "password123",
    bg: "rgba(249, 24, 128, 0.08)",
    border: "rgba(249, 24, 128, 0.25)",
    badgeColor: "#f91880",
  },
];

export default function Login() {
  // Form field values
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Called when the user clicks "Log in"
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // sends the JWT cookie
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Bad credentials — show the error message from server
        setError(data.error || "Login failed. Check your username and password.");
        return;
      }

      // Success — go to the home feed
      navigate("/");
    } catch (err) {
      setError("Could not connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <div className="main-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", width: "340px", padding: "20px" }}>
          <h2>Happening now.</h2>
          <h3>Log in to X Clone.</h3>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", outline: "none" }}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)", outline: "none" }}
            required
          />

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>

          {error && <p style={{ color: "var(--error-color)", fontSize: "14px", textAlign: "center" }}>{error}</p>}

          <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
              ⚡ 1-Click Auto-Fill Demo Credentials:
            </p>
            {DEMO_CREDENTIALS.map((demo) => (
              <div
                key={demo.role}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  backgroundColor: demo.bg,
                  border: `1px solid ${demo.border}`,
                  fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{demo.badge}</span>
                  <div>
                    <span style={{ fontWeight: "700", color: demo.badgeColor }}>{demo.role}: </span>
                    <span style={{ color: "var(--text-secondary)" }}>{demo.username}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUsername(demo.username);
                    setPassword(demo.password);
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: `1px solid ${demo.border}`,
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Auto-Fill
                </button>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", marginTop: "10px", fontSize: "14px", color: "var(--text-secondary)" }}>
            Don't have an account? <Link to="/signup" style={{ color: "var(--accent-color)" }}>Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
