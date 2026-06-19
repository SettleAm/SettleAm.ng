"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../utils/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      // Build redirect URL dynamically based on window location
      const redirectTo = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        triggerToast(`❌ ${error.message}`);
        setLoading(false);
        return;
      }

      setSubmitted(true);
      triggerToast("🎉 Reset link sent successfully!");
    } catch (err: any) {
      triggerToast(`❌ ${err.message || "An unexpected error occurred."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --dark:        #0A1F15;
          --darker:      #060F0A;
          --green:       #0E6B45;
          --green-mid:   #138A58;
          --green-bright:#1DB069;
          --white:       #FAFFF8;
          --muted:       rgba(250,255,248,0.45);
          --border:      rgba(200,232,212,0.15);
          --border-focus:rgba(29,176,105,0.6);
          --error:       #FF6B6B;
        }

        .forgot-body-wrapper {
          min-height: 100vh;
          font-family: 'DM Sans', sans-serif;
          background: var(--darker);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          position: relative;
          overflow: hidden;
        }

        .forgot-body-wrapper::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(14,107,69,0.15) 0%, transparent 70%);
          top: -100px; left: -100px;
          pointer-events: none;
        }

        .forgot-body-wrapper::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(29,176,105,0.08) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          pointer-events: none;
        }

        .forgot-card {
          width: 100%;
          max-width: 440px;
          background: rgba(10, 31, 21, 0.7);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 48px;
          backdrop-filter: blur(16px);
          box-shadow: 0 20px 80px rgba(0,0,0,0.5);
          animation: fadeUp 0.5s ease both;
          z-index: 10;
        }

        .logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }

        .logo-img {
          height: 44px;
          max-width: 100%;
          display: block;
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .form-header h2 {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.8rem;
          letter-spacing: -1px;
          color: var(--white);
          margin-bottom: 8px;
        }

        .form-header p {
          font-size: 0.9rem;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.6;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          font-size: 0.82rem;
          font-weight: 500;
          color: rgba(250,255,248,0.7);
          margin-bottom: 8px;
        }

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
        }

        .forgot-card input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          color: var(--white);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .forgot-card input:focus {
          border-color: var(--border-focus);
          background: rgba(29,176,105,0.05);
          box-shadow: 0 0 0 3px rgba(29,176,105,0.08);
        }

        .forgot-card input.error-input {
          border-color: rgba(255,107,107,0.5);
        }

        .error-msg {
          font-size: 0.78rem;
          color: var(--error);
          margin-top: 6px;
          padding-left: 4px;
        }

        .btn-submit {
          width: 100%;
          padding: 16px;
          background: var(--green);
          color: var(--white);
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.97rem;
          cursor: pointer;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(14,107,69,0.35);
        }

        .btn-submit:hover {
          background: var(--green-mid);
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(14,107,69,0.45);
        }

        .btn-submit:disabled {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .btn-submit.loading .btn-text { opacity: 0; }
        .btn-submit.loading::after {
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

        .back-link {
          text-align: center;
          margin-top: 24px;
          font-size: 0.88rem;
        }

        .back-link a {
          color: var(--green-bright);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .back-link a:hover {
          color: var(--white);
        }

        .success-box {
          background: rgba(29, 176, 105, 0.08);
          border: 1px dashed var(--green-bright);
          border-radius: 14px;
          padding: 24px;
          text-align: center;
          margin-bottom: 24px;
          animation: fadeUp 0.4s ease both;
        }

        .success-box-icon {
          font-size: 2rem;
          margin-bottom: 12px;
          display: block;
        }

        .success-box h4 {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 8px;
        }

        .success-box p {
          font-size: 0.85rem;
          color: var(--muted);
          line-height: 1.5;
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

        @keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .forgot-card { padding: 32px 24px; }
        }
      ` }} />

      <div className="forgot-body-wrapper">
        <div className="forgot-card">
          <div className="logo-wrap">
            <Link href="/">
              <img
                src="/SettleAm logo/SettleAm_logo_dark.svg"
                alt="SettleAm"
                className="logo-img"
              />
            </Link>
          </div>

          <div className="form-header">
            <h2>Reset Password 🔒</h2>
            <p>Enter your registered email address below, and we'll send you a secure link to reset your password.</p>
          </div>

          {submitted ? (
            <div className="success-box">
              <span className="success-box-icon">📬</span>
              <h4>Check your Email</h4>
              <p>We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and click the link to proceed.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Registered Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    id="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={emailError ? "error-input" : ""}
                    disabled={loading}
                    required
                  />
                </div>
                {emailError && <div className="error-msg">{emailError}</div>}
              </div>

              <button
                type="submit"
                className={`btn-submit ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                <span className="btn-text">Send Reset Link</span>
              </button>
            </form>
          )}

          <div className="back-link">
            <Link href="/login">← Back to Login</Link>
          </div>
        </div>
      </div>

      <div className={`toast ${showToast ? "show" : ""}`}>
        {toastMessage}
      </div>
    </>
  );
}
