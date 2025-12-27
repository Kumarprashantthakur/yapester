import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./AuthDark.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await API.post("/auth/forgot-password", { email });

      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Email not found");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Forgot Password</h1>
        <p className="auth-subtitle">Enter your registered email</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button className="auth-btn" type="submit">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
