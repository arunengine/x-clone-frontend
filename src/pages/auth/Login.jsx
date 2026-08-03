import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "";

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
      <div className="main-content" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", width: "300px" }}>
          <h2>Happening now.</h2>
          <h3>Log in to X Clone.</h3>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px" }}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px" }}
            required
          />

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>

          {error && <p style={{ color: "var(--error-color)" }}>{error}</p>}

          <p>Don't have an account? <Link to="/signup" style={{ color: "var(--accent-color)" }}>Sign up</Link></p>
        </form>
      </div>
    </div>
  );
}
