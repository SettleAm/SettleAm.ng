"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabase";
import { profileService } from "../../utils/profileService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEmailError("");
    setPasswordError("");

    let valid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        triggerToast(`❌ ${error.message}`);
        setLoading(false);
        return;
      }

      if (data?.user) {
        await profileService.ensureProfileForUser(
          data.user.id,
          data.user.email || "",
          data.user.user_metadata
        );
      }

      triggerToast("✅ Welcome back! Redirecting to your dashboard…");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1800);
    } catch (err: any) {
      triggerToast(`❌ ${err.message || "An unexpected error occurred."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    triggerToast(`Connecting with ${provider}…`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleLogin();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [email, password]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --dark:        #0A1F15;
          --darker:      #060F0A;
          --green:       #0E6B45;
          --green-mid:   #138A58;
          --green-bright:#1DB069;
          --green-glow:  rgba(29,176,105,0.15);
          --gold:        #F5A623;
          --gold-dim:    rgba(245,166,35,0.12);
          --white:       #FAFFF8;
          --muted:       rgba(250,255,248,0.45);
          --border:      rgba(200,232,212,0.15);
          --border-focus:rgba(29,176,105,0.6);
          --card:        rgba(14,107,69,0.06);
          --error:       #FF6B6B;
        }

        .login-body-wrapper {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          background: var(--darker);
          color: var(--white);
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow-x: hidden;
        }

        .left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
          background: var(--dark);
          overflow-x: hidden;
          overflow-y: auto;
          max-height: 100vh;
        }

        .left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        .left::after {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(14,107,69,0.18) 0%, transparent 70%);
          bottom: -100px; left: -100px;
          pointer-events: none;
          z-index: 0;
        }

        .left > * { position: relative; z-index: 1; }

        .logo {
          display: flex;
          align-items: center;
          gap: 14px;
          text-decoration: none;
        }

        .logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -0.5px;
          color: var(--white);
        }

        .logo-text span { color: var(--green-bright); }

        .hero-copy {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 0;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--gold-dim);
          border: 1px solid rgba(245,166,35,0.25);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--gold);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 28px;
          width: fit-content;
          animation: fadeUp 0.5s ease both;
        }

        .hero-tag::before {
          content: '';
          width: 6px; height: 6px;
          background: var(--gold);
          border-radius: 50%;
          animation: blink 2s infinite;
        }

        @keyframes blink {
          0%,100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .hero-h1 {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2.4rem, 3.5vw, 3.2rem);
          line-height: 1.05;
          letter-spacing: -2px;
          color: var(--white);
          margin-bottom: 20px;
          animation: fadeUp 0.5s 0.1s ease both;
        }

        .hero-h1 em {
          font-style: normal;
          color: var(--green-bright);
        }

        .hero-p {
          font-size: 1rem;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.7;
          max-width: 380px;
          animation: fadeUp 0.5s 0.2s ease both;
        }

        .stats {
          display: flex;
          gap: 40px;
          margin-top: 48px;
          animation: fadeUp 0.5s 0.3s ease both;
        }

        .stat-num {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.6rem;
          color: var(--green-bright);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.78rem;
          color: var(--muted);
          margin-top: 4px;
          font-weight: 300;
        }

        .craft-strip {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          animation: fadeUp 0.5s 0.4s ease both;
        }

        .craft-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 7px 14px;
          font-size: 0.8rem;
          font-weight: 400;
          color: rgba(250,255,248,0.6);
        }

        .craft-pill span { font-size: 0.9rem; }

        .right {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 48px 40px;
          background: var(--darker);
          position: relative;
          overflow-y: auto;
          max-height: 100vh;
        }

        .right::before {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(29,176,105,0.07) 0%, transparent 70%);
          top: -80px; right: -80px;
          pointer-events: none;
        }

        .form-wrap {
          width: 100%;
          max-width: 420px;
          animation: fadeUp 0.5s 0.15s ease both;
        }

        .form-header {
          margin-bottom: 36px;
        }

        .form-header h2 {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.9rem;
          letter-spacing: -1px;
          color: var(--white);
          margin-bottom: 8px;
        }

        .form-header p {
          font-size: 0.9rem;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.5;
        }

        .or-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
        }

        .or-divider::before,
        .or-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .or-divider span {
          font-size: 0.78rem;
          color: var(--muted);
          font-weight: 400;
          letter-spacing: 0.5px;
        }

        .social-login {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 4px;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(250,255,248,0.75);
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .social-btn:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(200,232,212,0.3);
          color: var(--white);
        }

        .social-icon { font-size: 1.1rem; }

        .form-group {
          margin-bottom: 18px;
        }

        .form-group label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
          font-weight: 500;
          color: rgba(250,255,248,0.7);
          margin-bottom: 8px;
          letter-spacing: 0.2px;
        }

        .form-group label a {
          font-size: 0.78rem;
          color: var(--green-bright);
          text-decoration: none;
          font-weight: 400;
          transition: color 0.2s;
        }

        .form-group label a:hover { color: var(--gold); }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          opacity: 0.4;
          pointer-events: none;
          transition: opacity 0.2s;
        }

        .input-wrap:focus-within .input-icon { opacity: 0.8; }

        .form-group input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 400;
          color: var(--white);
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }

        .form-group input::placeholder { color: rgba(250,255,248,0.25); }

        .form-group input:focus {
          border-color: var(--border-focus);
          background: rgba(29,176,105,0.05);
          box-shadow: 0 0 0 3px rgba(29,176,105,0.08);
        }

        .form-group input.error-input {
          border-color: rgba(255,107,107,0.5);
        }

        .eye-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          opacity: 0.35;
          transition: opacity 0.2s;
          padding: 4px;
          color: var(--white);
        }

        .eye-toggle:hover { opacity: 0.7; }

        .error-msg {
          display: none;
          font-size: 0.78rem;
          color: var(--error);
          margin-top: 6px;
          padding-left: 4px;
        }

        .error-msg.visible {
          display: block;
        }

        .remember-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .custom-check {
          width: 18px; height: 18px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid var(--border);
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .custom-check.checked {
          background: var(--green);
          border-color: var(--green);
        }

        .custom-check.checked::after {
          content: '✓';
          font-size: 0.7rem;
          color: white;
          font-weight: 700;
        }

        .remember-label {
          font-size: 0.84rem;
          color: var(--muted);
          cursor: pointer;
          user-select: none;
        }

        .btn-login {
          width: 100%;
          padding: 16px;
          background: var(--green);
          color: var(--white);
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.97rem;
          letter-spacing: 0.2px;
          cursor: pointer;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(14,107,69,0.35);
        }

        .btn-login::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.06) 100%);
        }

        .btn-login:hover {
          background: var(--green-mid);
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(14,107,69,0.45);
        }

        .btn-login:active { transform: translateY(0); }

        .btn-login.loading {
          pointer-events: none;
          opacity: 0.8;
        }

        .btn-login.loading .btn-text { opacity: 0; }
        .btn-login.loading::after {
          content: '';
          position: absolute;
          width: 20px; height: 20px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }

        .register-row {
          text-align: center;
          margin-top: 24px;
          font-size: 0.85rem;
          color: var(--muted);
          font-weight: 300;
        }

        .register-row a {
          color: var(--green-bright);
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }

        .register-row a:hover { color: var(--gold); }

        .terms-note {
          text-align: center;
          font-size: 0.75rem;
          color: rgba(250,255,248,0.25);
          margin-top: 20px;
          line-height: 1.5;
        }

        .terms-note a {
          color: rgba(250,255,248,0.4);
          text-decoration: underline;
          text-decoration-color: transparent;
          transition: all 0.2s;
        }

        .terms-note a:hover {
          color: rgba(250,255,248,0.65);
          text-decoration-color: rgba(250,255,248,0.4);
        }

        .toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: var(--green);
          color: white;
          padding: 14px 28px;
          border-radius: 100px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 8px 30px rgba(14,107,69,0.4);
          opacity: 0;
          transition: all 0.3s ease;
          pointer-events: none;
          white-space: nowrap;
          z-index: 100;
        }

        .toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .login-body-wrapper {
            grid-template-columns: 1fr;
            overflow: auto;
          }
          .left {
            min-height: auto;
            padding: 36px 28px 40px;
            display: none;
          }
          .right {
            min-height: auto;
            padding: 36px 24px 48px;
          }
          .stats { gap: 28px; }
          .hero-h1 { font-size: 2rem; }
        }
      ` }} />

      <div className="login-body-wrapper">
        {/* ── LEFT PANEL ── */}
        <div className="left">
          {/* Logo */}
          <Link href="/" className="logo">
            <img
              src="/SettleAm logo/SettleAm_logo_dark.svg"
              alt="SettleAm"
              className="footer-logo-svg"
              style={{ height: "44px", maxWidth: "100%", display: "block", marginBottom: "16px" }}
            />
          </Link>

          {/* Hero copy */}
          <div className="hero-copy">
            <div className="hero-tag">Artisan Portal</div>
            <h1 className="hero-h1">Your craft.<br />Your <em>customers.</em><br />Your income.</h1>
            <p className="hero-p">Join thousands of verified Nigerian artisans already getting steady jobs, building their reputation, and getting paid securely through SettleAm.</p>

            <div className="stats">
              <div>
                <div className="stat-num">10%</div>
                <div className="stat-label">Flat commission<br />only when you earn</div>
              </div>
              <div>
                <div className="stat-num">24hr</div>
                <div className="stat-label">Secure escrow<br />payment protection</div>
              </div>
              <div>
                <div className="stat-num">⭐ 4.8</div>
                <div className="stat-label">Average artisan<br />rating on platform</div>
              </div>
            </div>
          </div>

          {/* Craft strip */}
          <div className="craft-strip">
            <div className="craft-pill"><span>⚡</span> Electrician</div>
            <div className="craft-pill"><span>🔧</span> Plumber</div>
            <div className="craft-pill"><span>🪚</span> Carpenter</div>
            <div className="craft-pill"><span>❄️</span> AC Tech</div>
            <div className="craft-pill"><span>👔</span> Tailor</div>
            <div className="craft-pill"><span>💇</span> Barber</div>
            <div className="craft-pill"><span>👞</span> Cobbler</div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right">
          <div className="form-wrap">
            <div className="form-header">
              <h2>Welcome back 👋</h2>
              <p>Log in to your artisan dashboard and manage your jobs, bookings, and earnings.</p>
            </div>

            {/* Social login */}
            <div className="social-login">
              <button className="social-btn" onClick={() => handleSocialLogin("Google")}>
                <span className="social-icon">🌐</span> Google
              </button>
              <button className="social-btn" onClick={() => handleSocialLogin("Phone")}>
                <span className="social-icon">📱</span> Phone
              </button>
            </div>

            <div className="or-divider"><span>or continue with email</span></div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              {/* Email */}
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <div className="input-wrap">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={emailError ? "error-input" : ""}
                  />
                </div>
                <div className={`error-msg ${emailError ? "visible" : ""}`}>{emailError}</div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password">
                  Password
                  <Link href="#">Forgot password?</Link>
                </label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={passwordError ? "error-input" : ""}
                  />
                  <button
                    className="eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
                <div className={`error-msg ${passwordError ? "visible" : ""}`}>{passwordError}</div>
              </div>

              {/* Remember me */}
              <div className="remember-row">
                <div
                  className={`custom-check ${rememberMe ? "checked" : ""}`}
                  id="remember-check"
                  onClick={() => setRememberMe(!rememberMe)}
                  role="checkbox"
                  aria-checked={rememberMe}
                  tabIndex={0}
                ></div>
                <div className="remember-label" onClick={() => setRememberMe(!rememberMe)}>
                  Keep me logged in
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className={`btn-login ${loading ? "loading" : ""}`}
                id="login-btn"
                disabled={loading}
              >
                <span className="btn-text">Log In to Dashboard</span>
              </button>
            </form>

            {/* Register */}
            <div className="register-row">
              New artisan? <Link href="/signup">Create your free account →</Link>
            </div>

            {/* Terms */}
            <div className="terms-note">
              By logging in you agree to SettleAm's
              <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast ${showToast ? "show" : ""}`} id="toast">
        {toastMessage}
      </div>
    </>
  );
}
