"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../utils/supabase";
import { profileService, ArtisanProfile } from "../../utils/profileService";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ArtisanProfile | null>(null);

  // Profile details state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [craft, setCraft] = useState("");
  const [location, setLocation] = useState("");

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Errors and UI state
  const [authLoading, setAuthLoading] = useState(true);
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // ── Load profile & auth ──────────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push("/login");
          return;
        }

        setUser(user);

        const existingProfile = await profileService.ensureProfileForUser(
          user.id,
          user.email || "",
          user.user_metadata
        );

        setProfile(existingProfile);
        setFirstName(existingProfile.first_name || "");
        setLastName(existingProfile.last_name || "");
        setPhone(existingProfile.phone || "");
        setCraft(existingProfile.craft || "");
        setLocation(existingProfile.location || "");
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ── Update Profile Details ───────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    setProfileErrors({});
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";
    if (!location.trim()) errs.location = "Location is required.";

    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      triggerToast("❌ Please fix profile form errors.", "error");
      return;
    }

    setSaveProfileLoading(true);

    const updatedProfile: ArtisanProfile = {
      ...profile,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      craft,
      location: location.trim(),
    };

    const success = await profileService.saveProfile(updatedProfile);
    setSaveProfileLoading(false);

    if (success) {
      triggerToast("🎉 Account details updated successfully!");
      setProfile(updatedProfile);
    } else {
      triggerToast("❌ Failed to update account details.", "error");
    }
  };

  // ── Update Password ──────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCurrentPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");

    let valid = true;

    if (!currentPassword) {
      setCurrentPasswordError("Current password is required.");
      valid = false;
    }

    if (newPassword.length < 8) {
      setNewPasswordError("New password must be at least 8 characters.");
      valid = false;
    }

    if (newPassword === currentPassword) {
      setNewPasswordError("New password cannot be the same as the current password.");
      valid = false;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("New passwords do not match.");
      valid = false;
    }

    if (!valid) return;

    setChangePasswordLoading(true);

    try {
      // 1. Re-authenticate / verify current password first by signing in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setCurrentPasswordError("Incorrect current password.");
        triggerToast("❌ Incorrect current password.", "error");
        setChangePasswordLoading(false);
        return;
      }

      // 2. Perform the password update
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        triggerToast(`❌ Failed to update password: ${updateError.message}`, "error");
        setChangePasswordLoading(false);
        return;
      }

      triggerToast("🎉 Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      triggerToast(`❌ Error: ${err.message || "Something went wrong."}`, "error");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#060F0A", color: "#FAFFF8", fontFamily: "var(--font-syne), sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⚡</div>
          <div>Verifying credentials...</div>
        </div>
      </div>
    );
  }

  const initials = `${firstName ? firstName[0].toUpperCase() : ""}${lastName ? lastName[0].toUpperCase() : ""}` || "A";

  return (
    <>
      {/* ── STYLES ────────────────────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dash-container { min-height: 100vh; background: #060F0A; color: #FAFFF8; padding: 96px 6vw 80px; }
        .dash-grid { display: grid; grid-template-columns: 300px 1fr; gap: 40px; }

        /* Sidebar */
        .dash-aside {
          background: rgba(14, 107, 69, 0.04); border: 1px solid rgba(200, 232, 212, 0.1);
          border-radius: 20px; padding: 28px; height: fit-content; position: sticky; top: 100px;
        }
        .artisan-preview-card { text-align: center; margin-bottom: 24px; }
        .artisan-preview-avatar {
          width: 90px; height: 90px; border-radius: 22px; background: #0E6B45;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-syne), sans-serif; font-weight: 800; font-size: 1.6rem;
          color: #fff; overflow: hidden; border: 2px solid rgba(29, 176, 105, 0.3);
          margin: 0 auto 16px;
        }
        .artisan-preview-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .artisan-preview-name { font-family: var(--font-syne), sans-serif; font-weight: 700; font-size: 1.1rem; margin-bottom: 4px; }
        .artisan-preview-craft { font-size: 0.8rem; color: #1DB069; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        .dash-menu { list-style: none; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(200, 232, 212, 0.1); padding-top: 20px; }
        .dash-menu-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px;
          color: rgba(250, 255, 248, 0.7); text-decoration: none; font-size: 0.9rem; font-weight: 500;
          transition: all 0.2s; background: transparent; border: none; width: 100%; text-align: left; cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .dash-menu-item.active, .dash-menu-item:hover { background: rgba(29, 176, 105, 0.1); color: #1DB069; }

        /* Main Forms */
        .dash-main {
          display: flex; flex-direction: column; gap: 32px;
        }
        .settings-card {
          background: rgba(14, 107, 69, 0.03); border: 1px solid rgba(200, 232, 212, 0.08);
          border-radius: 24px; padding: 40px;
        }
        .dash-section-title { font-family: var(--font-syne), sans-serif; font-weight: 800; font-size: 1.6rem; margin-bottom: 8px; }
        .dash-section-sub { font-size: 0.9rem; color: rgba(250, 255, 248, 0.5); margin-bottom: 32px; font-weight: 300; }

        .dash-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .dash-form-group { margin-bottom: 20px; }
        .dash-form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: rgba(250, 255, 248, 0.8); margin-bottom: 8px; }
        .dash-form-group input, .dash-form-group select {
          width: 100%; padding: 14px 16px; background: rgba(255, 255, 255, 0.04);
          border: 1.5px solid rgba(200, 232, 212, 0.15); border-radius: 12px; color: #FAFFF8;
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.92rem; outline: none; transition: all 0.2s;
          box-sizing: border-box;
        }
        .dash-form-group input:focus, .dash-form-group select:focus {
          border-color: #1DB069; background: rgba(29, 176, 105, 0.05);
        }
        .dash-form-group select option { background: #0A1F15; color: #fff; }
        .dash-form-group input.error-input { border-color: #FF6B6B; }

        .field-error { font-size: 0.78rem; color: #FF6B6B; margin-top: 6px; }

        .section-divider {
          font-family: var(--font-syne), sans-serif; font-size: 1.05rem; font-weight: 700;
          margin-bottom: 20px; border-bottom: 1px solid rgba(200,232,212,0.1);
          padding-bottom: 8px; color: rgba(250,255,248,0.9);
        }

        .btn-settings {
          width: 100%; padding: 16px; background: #1DB069; color: #fff; border: none;
          border-radius: 12px; font-family: var(--font-syne), sans-serif; font-weight: 700;
          font-size: 1rem; cursor: pointer; transition: all 0.25s; box-shadow: 0 4px 20px rgba(29, 176, 105, 0.35);
          position: relative; overflow: hidden;
        }
        .btn-settings:hover:not(:disabled) { background: #138A58; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(29,176,105,0.45); }
        .btn-settings:disabled { opacity: 0.65; cursor: not-allowed; }
        .btn-settings.loading .btn-text { opacity: 0; }
        .btn-settings.loading::after {
          content: ''; position: absolute;
          width: 22px; height: 22px; border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          top: 50%; left: 50%; transform: translate(-50%,-50%);
          animation: settingsSpin 0.7s linear infinite;
        }

        /* Toast */
        .dash-toast {
          position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(20px);
          padding: 14px 28px; border-radius: 100px;
          font-family: var(--font-syne), sans-serif; font-weight: 600; font-size: 0.9rem;
          box-shadow: 0 8px 30px rgba(0,0,0,0.3); opacity: 0; transition: all 0.35s ease;
          pointer-events: none; white-space: nowrap; z-index: 1000; color: #fff;
        }
        .dash-toast.success { background: #1DB069; box-shadow: 0 8px 30px rgba(29,176,105,0.4); }
        .dash-toast.error { background: #c0392b; box-shadow: 0 8px 30px rgba(192,57,43,0.4); }
        .dash-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        @keyframes settingsSpin { to { transform: rotate(360deg); } }

        @media (max-width: 960px) {
          .dash-grid { grid-template-columns: 1fr; }
          .dash-aside { position: static; }
          .dash-container { padding-top: 92px; }
        }
        @media (max-width: 600px) {
          .dash-form-row { grid-template-columns: 1fr; gap: 0; }
          .settings-card { padding: 24px 16px; }
        }
      `}} />

      <Header
        variant="simple"
        theme="dark"
        onLogout={handleLogout}
      />

      <div className="dash-container">
        <div className="dash-grid">
          {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
          <aside className="dash-aside">
            <div className="artisan-preview-card">
              <div className="artisan-preview-avatar">
                {profile?.profile_image
                  ? <img src={profile.profile_image} alt="Profile" />
                  : initials
                }
              </div>
              <h3 className="artisan-preview-name">{firstName || "Artisan"} {lastName || "Profile"}</h3>
              <div className="artisan-preview-craft">⚙️ {craft || "Service Provider"}</div>
            </div>

            <ul className="dash-menu">
              <li>
                <Link href="/dashboard" className="dash-menu-item">
                  👤 Edit Profile
                </Link>
              </li>
              <li>
                <button className="dash-menu-item active">
                  ⚙️ Settings
                </button>
              </li>
              <li>
                <Link href="/artisans" className="dash-menu-item">
                  🌍 View Public Directory
                </Link>
              </li>
            </ul>
          </aside>

          {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
          <main className="dash-main">
            {/* Account details settings */}
            <div className="settings-card">
              <div>
                <h2 className="dash-section-title">Account Details</h2>
                <p className="dash-section-sub">Update your basic login information and public contact details.</p>
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="section-divider">Profile Details</div>

                <div className="dash-form-group">
                  <label htmlFor="email">Email Address (Read-Only)</label>
                  <input type="email" id="email" value={user?.email || ""} readOnly style={{ opacity: 0.6, cursor: "not-allowed" }} />
                </div>

                <div className="dash-form-row">
                  <div className="dash-form-group">
                    <label htmlFor="fname">First Name</label>
                    <input
                      type="text"
                      id="fname"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      className={profileErrors.firstName ? "error-input" : ""}
                      required
                    />
                    {profileErrors.firstName && <div className="field-error">{profileErrors.firstName}</div>}
                  </div>
                  <div className="dash-form-group">
                    <label htmlFor="lname">Last Name</label>
                    <input
                      type="text"
                      id="lname"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      className={profileErrors.lastName ? "error-input" : ""}
                      required
                    />
                    {profileErrors.lastName && <div className="field-error">{profileErrors.lastName}</div>}
                  </div>
                </div>

                <div className="dash-form-row">
                  <div className="dash-form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input type="text" id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div className="dash-form-group">
                    <label htmlFor="location">Your Location (LGA / Area)</label>
                    <input
                      type="text"
                      id="location"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className={profileErrors.location ? "error-input" : ""}
                      placeholder="e.g. Abeokuta, Sagamu"
                      required
                    />
                    {profileErrors.location && <div className="field-error">{profileErrors.location}</div>}
                  </div>
                </div>

                <div className="dash-form-group">
                  <label htmlFor="craft">Trade / Category</label>
                  <select id="craft" value={craft} onChange={e => setCraft(e.target.value)} required>
                    <option value="">Select craft...</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="AC Tech">AC Tech</option>
                    <option value="Tailor">Tailor</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Hair Stylist">Hair Stylist</option>
                    <option value="Chef">Chef</option>
                    <option value="Painter">Painter</option>
                    <option value="Driver">Driver</option>
                    <option value="Shoe Maker">Shoe Maker</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ marginTop: "24px" }}>
                  <button
                    type="submit"
                    className={`btn-settings ${saveProfileLoading ? "loading" : ""}`}
                    disabled={saveProfileLoading}
                  >
                    <span className="btn-text">
                      {saveProfileLoading ? "" : "💾 Save Settings"}
                    </span>
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password settings */}
            <div className="settings-card" id="change-password-section">
              <div>
                <h2 className="dash-section-title">Security Settings</h2>
                <p className="dash-section-sub">Change your account password. We recommend using a unique password that you do not use on other sites.</p>
              </div>

              <form onSubmit={handleChangePassword}>
                <div className="section-divider">Change Password</div>

                <div className="dash-form-group">
                  <label htmlFor="curr-password">Current Password</label>
                  <input
                    type="password"
                    id="curr-password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className={currentPasswordError ? "error-input" : ""}
                    required
                  />
                  {currentPasswordError && <div className="field-error" id="current-password-error">{currentPasswordError}</div>}
                </div>

                <div className="dash-form-row">
                  <div className="dash-form-group">
                    <label htmlFor="new-password">New Password</label>
                    <input
                      type="password"
                      id="new-password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className={newPasswordError ? "error-input" : ""}
                      required
                    />
                    {newPasswordError && <div className="field-error" id="new-password-error">{newPasswordError}</div>}
                  </div>
                  <div className="dash-form-group">
                    <label htmlFor="confirm-password">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={confirmPasswordError ? "error-input" : ""}
                      required
                    />
                    {confirmPasswordError && <div className="field-error" id="confirm-password-error">{confirmPasswordError}</div>}
                  </div>
                </div>

                <div style={{ marginTop: "24px" }}>
                  <button
                    type="submit"
                    className={`btn-settings ${changePasswordLoading ? "loading" : ""}`}
                    disabled={changePasswordLoading}
                    id="change-password-btn"
                  >
                    <span className="btn-text">
                      {changePasswordLoading ? "" : "🔒 Update Password"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>

      <Footer />

      {/* Toast Notification */}
      <div className={`dash-toast ${toastType} ${showToast ? "show" : ""}`}>
        {toastMessage}
      </div>
    </>
  );
}
