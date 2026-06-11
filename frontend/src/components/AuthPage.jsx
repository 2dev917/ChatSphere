import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, LogIn, UserPlus } from "lucide-react";
import { auth } from "../firebase";

import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default function AuthPage() {
  const { login, register, saveAuth } = useAuth();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(e.target.email.value, e.target.password.value);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(e.target.username.value, e.target.email.value, e.target.password.value);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(
        auth,
        provider
      );
      console.log("GOOGLE LOGIN SUCCESS");
      console.log(result.user);
      console.log("EMAIL:", result.user.email);
      console.log("NAME:", result.user?.displayName);
      console.log("UID:", result.user.uid);
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: result.user.email,
          name: result.user?.displayName,
          uid: result.user.uid,
          photoURL: result.user.photoURL,
        }),
      });

      const data = await response.json();

      console.log("BACKEND RESPONSE:", data);
      saveAuth(data.token, data.user);


    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🌐</div>
          <h1>ChatSphere</h1>
          <p>Connect instantly, anywhere</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 4 }}>Welcome back</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>
              Sign in to your account
            </p>

            <div className="auth-input-group">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <Mail size={16} />
                <input type="email" name="email" required placeholder="alice@example.com" />
              </div>
            </div>

            <div className="auth-input-group">
              <label>Password</label>
              <div className="auth-input-wrap">
                <Lock size={16} />
                <input type="password" name="password" required placeholder="••••••••" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 4 }}
            >

              <LogIn size={16} />
              {loading ? "Signing in…" : "Sign In"}
            </button>
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                background: "#fff",
                color: "#000",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Continue with Google
            </button>

            <div className="auth-toggle-link">
              Don't have an account?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(""); }}>
                Sign Up
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: 4 }}>Create account</h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 20 }}>
              Get started with ChatSphere
            </p>

            <div className="auth-input-group">
              <label>Username</label>
              <div className="auth-input-wrap">
                <User size={16} />
                <input type="text" name="username" required placeholder="johndoe" />
              </div>
            </div>

            <div className="auth-input-group">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <Mail size={16} />
                <input type="email" name="email" required placeholder="name@example.com" />
              </div>
            </div>

            <div className="auth-input-group">
              <label>Password</label>
              <div className="auth-input-wrap">
                <Lock size={16} />
                <input type="password" name="password" required placeholder="••••••••" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 4 }}
            >
              <UserPlus size={16} />
              {loading ? "Creating account…" : "Sign Up"}
            </button>

            <div className="auth-toggle-link">
              Already have an account?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(""); }}>
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
