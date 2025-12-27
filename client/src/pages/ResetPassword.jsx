import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import "./AuthDark.css";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await API.post("/auth/reset-password", {
        email,
        password,
      });

      // ✅ premium success message
      setSuccess("Password successfully changed");

      // auto redirect after 2 sec
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Reset Password</h1>
        <p className="auth-subtitle">Create new password</p>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">✅ {success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button className="auth-btn" type="submit">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
