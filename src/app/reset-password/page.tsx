"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../utils/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  // Form states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  useEffect(() => {
    let active = true;

    async function checkSession() {
      // Try to get user directly first
      const { data: { user: initialUser } } = await supabase.auth.getUser();
      if (initialUser && active) {
        setUser(initialUser);
        setChecking(false);
        return;
      }

      // Try getSession fallback
      const { data: { session } } = await supabase.auth.getSession();
      if (session && active) {
        setUser(session.user);
        setChecking(false);
        return;
      }

      // Listen for any late auth state change (Supabase processing hash fragments)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!active) return;
        if (session) {
          setUser(session.user);
          setChecking(false);
        } else {
          // If no session after 1.5 seconds, assume there's no valid token
          setTimeout(() => {
            if (active) setChecking(false);
          }, 1500);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPasswordError("");
    setConfirmPasswordError("");

    let valid = true;

    if (newPassword.length < 8) {
      setNewPasswordError("Password must be at least 8 characters.");
      valid = false;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        triggerToast(`❌ ${error.message}`);
        setLoading(false);
        return;
      }

      setSuccess(true);
      triggerToast("🎉 Password reset successfully!");

      // Sign the user out to clear recovery session credentials cleanly
      await supabase.auth.signOut();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
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

        .reset-body-wrapper {
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

        .reset-body-wrapper::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(14,107,69,0.15) 0%, transparent 70%);
          top: -100px; left: -100px;
          pointer-events: none;
        }

        .reset-body-wrapper::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(29,176,105,0.08) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          pointer-events: none;
        }

        .reset-card {
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
          margin-bottom: 20px;
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

        .reset-card input {
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

        .reset-card input:focus {
          border-color: var(--border-focus);
          background: rgba(29,176,105,0.05);
          box-shadow: 0 0 0 3px rgba(29,176,105,0.08);
        }

        .reset-card input.error-input {
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

        .error-box {
          background: rgba(255, 107, 107, 0.06);
          border: 1px dashed rgba(255, 107, 107, 0.4);
          border-radius: 14px;
          padding: 24px;
          text-align: center;
          margin-bottom: 24px;
        }

        .error-box-icon {
          font-size: 2rem;
          margin-bottom: 12px;
          display: block;
        }

        .error-box h4 {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          color: var(--white);
          margin-bottom: 8px;
        }

        .error-box p {
          font-size: 0.85rem;
          color: var(--muted);
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .success-box {
          background: rgba(29, 176, 105, 0.08);
          border: 1px dashed var(--green-bright);
          border-radius: 14px;
          padding: 24px;
          text-align: center;
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
          .reset-card { padding: 32px 24px; }
        }
      ` }} />

      <div className="reset-body-wrapper">
        <div className="reset-card">
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
            <h2>New Password 🔒</h2>
            <p>Please enter your new password below. It must be at least 8 characters long.</p>
          </div>

          {checking ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{
                width: "30px", height: "30px", border: "3px solid rgba(29,176,105,0.2)",
                borderTopColor: "#1DB069", borderRadius: "50%", animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px"
              }}></div>
              <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Checking reset token validity…</p>
            </div>
          ) : !user ? (
            <div className="error-box">
              <span className="error-box-icon">⚠️</span>
              <h4>Invalid or Expired Link</h4>
              <p>Your password reset session could not be established. The link may have expired or already been used.</p>
              <Link href="/forgot-password" style={{
                display: "inline-block", background: "var(--green)", color: "white",
                padding: "10px 20px", borderRadius: "10px", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem"
              }}>
                Request New Link
              </Link>
            </div>
          ) : success ? (
            <div className="success-box">
              <span className="success-box-icon">🎉</span>
              <h4>Password Changed</h4>
              <p>Your password has been successfully reset. Redirecting you to the login page to sign in…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="new-pwd">New Password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    id="new-pwd"
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={newPasswordError ? "error-input" : ""}
                    disabled={loading}
                    required
                  />
                </div>
                {newPasswordError && <div className="error-msg">{newPasswordError}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="confirm-pwd">Confirm New Password</label>
                <div className="input-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    id="confirm-pwd"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={confirmPasswordError ? "error-input" : ""}
                    disabled={loading}
                    required
                  />
                </div>
                {confirmPasswordError && <div className="error-msg">{confirmPasswordError}</div>}
              </div>

              <button
                type="submit"
                className={`btn-submit ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                <span className="btn-text">Reset Password</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <div className={`toast ${showToast ? "show" : ""}`}>
        {toastMessage}
      </div>
    </>
  );
}
