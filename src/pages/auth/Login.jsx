import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [waking, setWaking] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setWaking(false);

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await apiFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) {
          // Server responded with an error (bad credentials, etc.) — don't retry
          setLoading(false);
          setWaking(false);
          setError(data.error || "Failed to login");
          return;
        }

        console.log("Login success! JWT Cookie is set:", data);
        navigate("/");
        return;
      } catch (err) {
        // Network/fetch error — server may be waking up
        if (attempt < MAX_RETRIES) {
          setWaking(true);
          await sleep(RETRY_DELAY_MS);
        } else {
          setLoading(false);
          setWaking(false);
          setError("Could not reach the server. Please try again in a moment.");
        }
      }
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="layout">
      <div className="main-content" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", width: "300px" }}>
          <h2>Happening now.</h2>
          <h3>Log in to X Clone.</h3>
          <input type="text" placeholder="Username" name="username" value={formData.username} onChange={handleInputChange} style={{ padding: "10px", borderRadius: "5px" }} />
          <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleInputChange} style={{ padding: "10px", borderRadius: "5px" }} />
          
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? (waking ? "⏳ Waking up server…" : "Logging in…") : "Log in"}
          </button>
          
          {error && <p style={{ color: "var(--error-color)" }}>{error}</p>}
          <p>Don't have an account? <Link to="/signup" style={{ color: "var(--accent-color)" }}>Sign up</Link></p>
        </form>
      </div>
    </div>
  );
}
