import { useState } from "react";
import { Link } from "react-router-dom";

export default function Signup() {
  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // 1. Connection Point! Vite proxy forwards this to localhost:5000/api/auth/signup
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");

      console.log("Signup success! JWT Cookie is set:", data);
      // Usually, we would redirect the user or update global state here
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
          <h2>Join X Clone Today.</h2>
          <input type="email" placeholder="Email" name="email" value={formData.email} onChange={handleInputChange} style={{ padding: "10px", borderRadius: "5px" }} />
          <input type="text" placeholder="Username" name="username" value={formData.username} onChange={handleInputChange} style={{ padding: "10px", borderRadius: "5px" }} />
          <input type="text" placeholder="Full Name" name="fullname" value={formData.fullname} onChange={handleInputChange} style={{ padding: "10px", borderRadius: "5px" }} />
          <input type="password" placeholder="Password" name="password" value={formData.password} onChange={handleInputChange} style={{ padding: "10px", borderRadius: "5px" }} />
          
          <button className="btn-primary" type="submit">Sign Up</button>
          
          {error && <p style={{ color: "var(--error-color)" }}>{error}</p>}
          <p>Already have an account? <Link to="/login" style={{ color: "var(--accent-color)" }}>Login</Link></p>
        </form>
      </div>
    </div>
  );
}
