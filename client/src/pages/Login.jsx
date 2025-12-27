import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import "./AuthDark.css";
import logo from "../assets/logo.jpeg";


function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  try {
    const res = await API.post("/auth/login", form);

    // 🔥 DEBUG (temporary)
    console.log("LOGIN RESPONSE:", res.data);

    // 🔥 TOKEN EXTRACT (SAFE)
    const token =
      res.data.token ||
      res.data.accessToken ||
      res.data?.data?.token;

    if (!token) {
      throw new Error("Token not found in response");
    }

    // 🔥 SAVE TOKEN
    sessionStorage.setItem("token", token);

    // 🔥 REDIRECT
    navigate("/chat");
  } catch (err) {
    console.error(err);
    setError(err.response?.data?.message || "Login failed");
  }
};


  return (
    <div className="auth-wrapper">
      <div className="auth-card">
       <div className="auth-logo">
  <img src={logo} alt="App Logo" />
</div>

        <p className="auth-subtitle">
          Login to continue chatting 💬
        </p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button className="auth-btn" type="submit">
            Login
          </button>
        </form>
        <p className="switch-auth">
  <Link to="/forgot-password">Forgot password?</Link>
</p>


        <p className="switch-auth">
          New user?
          <Link to="/register"> Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
