import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthDark.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email required");
      return;
    }

    // ✅ DIRECT RESET PAGE
    navigate("/reset-password", { state: { email } });
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
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
