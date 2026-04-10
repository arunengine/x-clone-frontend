import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Proxy forwards this to backend login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to login");

      console.log("Login success! JWT Cookie is set:", data);
      navigate("/"); // Navigate to Home Activity Feed
    } catch (err) {
      setError(err.message);
    }
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
          
          <button className="btn-primary" type="submit">Log in</button>
          
          {error && <p style={{ color: "var(--error-color)" }}>{error}</p>}
          <p>Don't have an account? <Link to="/signup" style={{ color: "var(--accent-color)" }}>Sign up</Link></p>
        </form>
      </div>
    </div>
  );
}
