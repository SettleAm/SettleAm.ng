"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../utils/supabase";
import { profileService, ArtisanProfile } from "../../utils/profileService";
import {
  uploadPortfolioImage,
  uploadProfileImage,
  deleteStorageImage,
  UploadProgress,
} from "../../utils/imageUpload";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

// ─── Types ───────────────────────────────────────────────────────────────────

interface PortfolioItem {
  url: string;          // Supabase public URL
  isUploading?: boolean;
  progress?: UploadProgress;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ArtisanProfile | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [craft, setCraft] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("1 yr exp");
  const [price, setPrice] = useState("₦5,000");
  const [description, setDescription] = useState("");
  const [newService, setNewService] = useState("");
  const [services, setServices] = useState<string[]>([]);

  // Image state
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [profileImageProgress, setProfileImageProgress] = useState<UploadProgress | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);

  // UI state
  const [authLoading, setAuthLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // ── auth + profile load ──────────────────────────────────────────────────

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) { router.push("/login"); return; }

        setUser(user);

        const existingProfile = await profileService.ensureProfileForUser(
          user.id,
          user.email || "",
          user.user_metadata
        );

        setProfile(existingProfile);
        setFirstName(existingProfile.first_name);
        setLastName(existingProfile.last_name);
        setPhone(existingProfile.phone);
        setCraft(existingProfile.craft);
        setLocation(existingProfile.location);
        setExperience(existingProfile.experience || "1 yr exp");
        setPrice(existingProfile.price || "₦5,000");
        setDescription(existingProfile.description || "");
        setServices(existingProfile.services || []);
        setProfileImageUrl(existingProfile.profile_image || "");
        setPortfolioItems(
          (existingProfile.portfolio || []).map((url) => ({ url }))
        );
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // ── save ─────────────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !user) return;

    if (!firstName.trim() || !lastName.trim()) {
      triggerToast("❌ First and Last names are required.", "error");
      return;
    }

    // Block save while any upload is still in progress
    const anyUploading = portfolioItems.some((item) => item.isUploading) || profileImageUploading;
    if (anyUploading) {
      triggerToast("⏳ Please wait for uploads to finish.", "error");
      return;
    }

    setSaveLoading(true);

    const updatedProfile: ArtisanProfile = {
      ...profile,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      craft,
      location: location.trim(),
      experience,
      price: price.trim(),
      description: description.trim(),
      services,
      profile_image: profileImageUrl,
      portfolio: portfolioItems.map((item) => item.url),
    };

    const success = await profileService.saveProfile(updatedProfile);
    setSaveLoading(false);

    if (success) {
      triggerToast("🎉 Profile updated successfully!");
      setProfile(updatedProfile);
    } else {
      triggerToast("❌ Failed to update profile.", "error");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ── services ─────────────────────────────────────────────────────────────

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (srv: string) => setServices(services.filter((s) => s !== srv));

  // ── profile image upload ──────────────────────────────────────────────────

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Reset input so the same file can be re-selected if needed
    e.target.value = "";

    setProfileImageUploading(true);
    setProfileImageProgress({ fileName: file.name, stage: "compressing", originalSizeKB: Math.round(file.size / 1024) });

    try {
      const url = await uploadProfileImage(file, user.id, (p) => setProfileImageProgress(p));
      setProfileImageUrl(url);
      triggerToast("✅ Profile photo updated!");
    } catch (err: any) {
      triggerToast(`❌ Avatar upload failed: ${err.message}`, "error");
    } finally {
      setProfileImageUploading(false);
      setTimeout(() => setProfileImageProgress(null), 2500);
    }
  };

  // ── portfolio upload ──────────────────────────────────────────────────────

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    e.target.value = "";

    const fileArray = Array.from(files);

    // Add placeholder rows immediately so user sees something happening
    const placeholders: PortfolioItem[] = fileArray.map((f) => ({
      url: "",
      isUploading: true,
      progress: { fileName: f.name, stage: "compressing", originalSizeKB: Math.round(f.size / 1024) },
    }));

    setPortfolioItems((prev) => [...prev, ...placeholders]);
    const startIndex = portfolioItems.length; // capture before update

    // Upload each file in parallel
    await Promise.all(
      fileArray.map(async (file, i) => {
        const itemIndex = startIndex + i;
        try {
          const url = await uploadPortfolioImage(file, user.id, (progress) => {
            setPortfolioItems((prev) => {
              const updated = [...prev];
              if (updated[itemIndex]) {
                updated[itemIndex] = { ...updated[itemIndex], progress };
              }
              return updated;
            });
          });

          // Replace placeholder with real URL
          setPortfolioItems((prev) => {
            const updated = [...prev];
            if (updated[itemIndex]) {
              updated[itemIndex] = { url, isUploading: false, progress: undefined };
            }
            return updated;
          });
        } catch (err: any) {
          // Mark item as error
          setPortfolioItems((prev) => {
            const updated = [...prev];
            if (updated[itemIndex]) {
              updated[itemIndex] = {
                url: "",
                isUploading: false,
                progress: { ...updated[itemIndex].progress!, stage: "error", error: err.message },
              };
            }
            return updated;
          });
          triggerToast(`❌ Failed to upload ${file.name}`, "error");
        }
      })
    );
  };

  const removePortfolioItem = async (index: number) => {
    const item = portfolioItems[index];
    if (item.url) {
      deleteStorageImage(item.url); // fire-and-forget
    }
    setPortfolioItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ── loading state ─────────────────────────────────────────────────────────

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

  // ── render ────────────────────────────────────────────────────────────────

  const initials = `${firstName ? firstName[0].toUpperCase() : ""}${lastName ? lastName[0].toUpperCase() : ""}` || "A";

  return (
    <>
      {/* ── STYLES ────────────────────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dash-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 6vw; background: rgba(10, 31, 21, 0.95);
          border-bottom: 1px solid rgba(200, 232, 212, 0.1);
          backdrop-filter: blur(16px);
        }
        .dash-logo { display: flex; align-items: center; text-decoration: none; }
        .dash-logo-text { font-family: var(--font-syne), sans-serif; font-weight: 800; font-size: 1.4rem; color: #FAFFF8; }
        .dash-logo-text span { color: #1DB069; }
        .dash-logout-btn {
          border: 1.5px solid rgba(255, 107, 107, 0.3); padding: 8px 18px; border-radius: 100px;
          font-weight: 600; color: #FF6B6B; background: transparent; cursor: pointer; transition: all 0.2s;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .dash-logout-btn:hover { background: rgba(255, 107, 107, 0.1); border-color: #FF6B6B; }

        .dash-container { min-height: 100vh; background: #060F0A; color: #FAFFF8; padding: 96px 6vw 80px; }
        .dash-grid { display: grid; grid-template-columns: 300px 1fr; gap: 40px; }

        /* ── Sidebar ── */
        .dash-aside {
          background: rgba(14, 107, 69, 0.04); border: 1px solid rgba(200, 232, 212, 0.1);
          border-radius: 20px; padding: 28px; height: fit-content; position: sticky; top: 100px;
        }
        .artisan-preview-card { text-align: center; margin-bottom: 24px; }

        /* Avatar upload wrapper */
        .avatar-upload-wrapper {
          position: relative; width: 90px; height: 90px; margin: 0 auto 16px; cursor: pointer;
        }
        .avatar-upload-wrapper input[type="file"] {
          position: absolute; inset: 0; opacity: 0; cursor: pointer; border-radius: 50%;
        }
        .artisan-preview-avatar {
          width: 90px; height: 90px; border-radius: 22px; background: #0E6B45;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-syne), sans-serif; font-weight: 800; font-size: 1.6rem;
          color: #fff; overflow: hidden; border: 2px solid rgba(29, 176, 105, 0.3);
          transition: border-color 0.2s;
        }
        .avatar-upload-wrapper:hover .artisan-preview-avatar { border-color: #1DB069; }
        .artisan-preview-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-overlay {
          position: absolute; inset: 0; border-radius: 22px;
          background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s; pointer-events: none;
          font-size: 1.3rem;
        }
        .avatar-upload-wrapper:hover .avatar-overlay { opacity: 1; }

        /* Avatar uploading spinner overlay */
        .avatar-spinner-overlay {
          position: absolute; inset: 0; border-radius: 22px;
          background: rgba(6,15,10,0.72); display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 4px;
        }
        .avatar-spinner {
          width: 28px; height: 28px; border: 3px solid rgba(29,176,105,0.3);
          border-top-color: #1DB069; border-radius: 50%; animation: dashSpin 0.8s linear infinite;
        }
        .avatar-stage-label {
          font-size: 0.6rem; color: #1DB069; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
        }

        .artisan-preview-name { font-family: var(--font-syne), sans-serif; font-weight: 700; font-size: 1.1rem; margin-bottom: 4px; }
        .artisan-preview-craft { font-size: 0.8rem; color: #1DB069; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        .change-photo-hint {
          font-size: 0.72rem; color: rgba(250,255,248,0.4); margin-top: 8px;
          transition: color 0.2s;
        }
        .avatar-upload-wrapper:hover ~ .change-photo-hint { color: rgba(29,176,105,0.8); }

        .dash-menu { list-style: none; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid rgba(200, 232, 212, 0.1); padding-top: 20px; }
        .dash-menu-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px;
          color: rgba(250, 255, 248, 0.7); text-decoration: none; font-size: 0.9rem; font-weight: 500;
          transition: all 0.2s; background: transparent; border: none; width: 100%; text-align: left; cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .dash-menu-item.active, .dash-menu-item:hover { background: rgba(29, 176, 105, 0.1); color: #1DB069; }

        /* ── Main form ── */
        .dash-main {
          background: rgba(14, 107, 69, 0.03); border: 1px solid rgba(200, 232, 212, 0.08);
          border-radius: 24px; padding: 40px;
        }
        .dash-section-title { font-family: var(--font-syne), sans-serif; font-weight: 800; font-size: 1.6rem; margin-bottom: 8px; }
        .dash-section-sub { font-size: 0.9rem; color: rgba(250, 255, 248, 0.5); margin-bottom: 32px; font-weight: 300; }

        .dash-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .dash-form-group { margin-bottom: 20px; }
        .dash-form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: rgba(250, 255, 248, 0.8); margin-bottom: 8px; }
        .dash-form-group input, .dash-form-group select, .dash-form-group textarea {
          width: 100%; padding: 14px 16px; background: rgba(255, 255, 255, 0.04);
          border: 1.5px solid rgba(200, 232, 212, 0.15); border-radius: 12px; color: #FAFFF8;
          font-family: var(--font-dm-sans), sans-serif; font-size: 0.92rem; outline: none; transition: all 0.2s;
          box-sizing: border-box;
        }
        .dash-form-group input:focus, .dash-form-group select:focus, .dash-form-group textarea:focus {
          border-color: #1DB069; background: rgba(29, 176, 105, 0.05);
        }
        .dash-form-group select option { background: #0A1F15; color: #fff; }

        .section-divider {
          font-family: var(--font-syne), sans-serif; font-size: 1.05rem; font-weight: 700;
          margin-top: 16px; margin-bottom: 16px; border-bottom: 1px solid rgba(200,232,212,0.1);
          padding-bottom: 8px; color: rgba(250,255,248,0.9);
        }

        /* Service tags */
        .service-entry-row { display: flex; gap: 10px; }
        .service-entry-row input { flex: 1; }
        .btn-add-service {
          background: #0E6B45; color: #fff; border: none; padding: 0 20px; border-radius: 12px;
          font-weight: 600; cursor: pointer; transition: background 0.2s; white-space: nowrap;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .btn-add-service:hover { background: #138A58; }
        .service-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .service-chip {
          display: inline-flex; align-items: center; gap: 6px; background: rgba(29, 176, 105, 0.12);
          border: 1px solid rgba(29, 176, 105, 0.25); border-radius: 100px; padding: 6px 14px;
          font-size: 0.8rem; color: #1DB069; font-weight: 500;
        }
        .service-chip button { background: none; border: none; color: #FF6B6B; cursor: pointer; font-size: 0.85rem; padding: 0; }

        /* ── Portfolio upload area ── */
        .portfolio-upload-area {
          border: 2px dashed rgba(200, 232, 212, 0.2); border-radius: 16px; padding: 32px;
          text-align: center; cursor: pointer; transition: all 0.25s; background: rgba(255, 255, 255, 0.02);
          position: relative;
        }
        .portfolio-upload-area:hover { border-color: #1DB069; background: rgba(29, 176, 105, 0.04); }
        .portfolio-upload-area input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .portfolio-upload-icon { font-size: 2.2rem; margin-bottom: 8px; display: block; }
        .upload-hint { font-size: 0.78rem; color: rgba(250, 255, 248, 0.4); margin-top: 6px; }

        /* ── Portfolio grid ── */
        .portfolio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 16px; margin-top: 20px; }
        .portfolio-item {
          position: relative; aspect-ratio: 1; border-radius: 14px; overflow: hidden;
          border: 1px solid rgba(200, 232, 212, 0.15); background: rgba(255,255,255,0.03);
        }
        .portfolio-item img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* Uploading overlay on each portfolio card */
        .portfolio-uploading-overlay {
          position: absolute; inset: 0; background: rgba(6,15,10,0.82);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          padding: 12px;
        }
        .upload-progress-ring {
          width: 36px; height: 36px; border: 3px solid rgba(29,176,105,0.25);
          border-top-color: #1DB069; border-radius: 50%; animation: dashSpin 0.9s linear infinite;
        }
        .upload-stage-text { font-size: 0.62rem; color: #1DB069; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
        .upload-size-text { font-size: 0.6rem; color: rgba(250,255,248,0.5); }

        /* Error state */
        .portfolio-error-overlay {
          position: absolute; inset: 0; background: rgba(30,5,5,0.88);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
          padding: 10px; text-align: center;
        }
        .portfolio-error-icon { font-size: 1.4rem; }
        .portfolio-error-msg { font-size: 0.62rem; color: #FF6B6B; line-height: 1.3; }

        .portfolio-remove-btn {
          position: absolute; top: 6px; right: 6px; width: 26px; height: 26px; border-radius: 50%;
          background: rgba(255, 107, 107, 0.88); border: none; color: #fff;
          display: flex; align-items: center; justify-content: center; font-size: 0.75rem;
          cursor: pointer; transition: background 0.2s; font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .portfolio-remove-btn:hover { background: #FF6B6B; }

        /* Compression badge on hover */
        .portfolio-size-badge {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(6,15,10,0.75); padding: 5px 8px;
          font-size: 0.6rem; color: rgba(29,176,105,0.9); font-weight: 600;
          text-align: center; backdrop-filter: blur(4px);
          transform: translateY(100%); transition: transform 0.2s;
        }
        .portfolio-item:hover .portfolio-size-badge { transform: translateY(0); }

        /* Avatar progress bar */
        .avatar-progress-bar-wrap {
          height: 3px; background: rgba(29,176,105,0.12); border-radius: 2px;
          margin-top: 10px; overflow: hidden;
        }
        .avatar-progress-bar {
          height: 100%; border-radius: 2px; background: #1DB069;
          transition: width 0.4s ease;
        }

        /* Save button */
        .btn-save-profile {
          width: 100%; padding: 16px; background: #1DB069; color: #fff; border: none;
          border-radius: 12px; font-family: var(--font-syne), sans-serif; font-weight: 700;
          font-size: 1rem; cursor: pointer; transition: all 0.25s; box-shadow: 0 4px 20px rgba(29, 176, 105, 0.35);
          position: relative; overflow: hidden;
        }
        .btn-save-profile:hover:not(:disabled) { background: #138A58; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(29,176,105,0.45); }
        .btn-save-profile:disabled { opacity: 0.65; cursor: not-allowed; }
        .btn-save-profile.loading .btn-text { opacity: 0; }
        .btn-save-profile.loading::after {
          content: ''; position: absolute;
          width: 22px; height: 22px; border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%;
          top: 50%; left: 50%; transform: translate(-50%,-50%);
          animation: dashSpin 0.7s linear infinite;
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

        @keyframes dashSpin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        .portfolio-item { animation: fadeIn 0.3s ease both; }

        @media (max-width: 960px) {
          .dash-grid { grid-template-columns: 1fr; }
          .dash-aside { position: static; }
          .dash-container { padding-top: 92px; }
        }
        @media (max-width: 600px) {
          .dash-form-row { grid-template-columns: 1fr; gap: 0; }
          .dash-main { padding: 24px 16px; }
          .portfolio-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); }
        }
      `}} />

      {/* ── NAVIGATION ──────────────────────────────────────────────────────── */}
      <Header
        variant="simple"
        theme="dark"
        onLogout={handleLogout}
      />

      {/* ── PAGE ────────────────────────────────────────────────────────────── */}
      <div className="dash-container">
        <div className="dash-grid">

          {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
          <aside className="dash-aside">
            <div className="artisan-preview-card">

              {/* Avatar upload */}
              <div className="avatar-upload-wrapper" title="Click to change profile photo">
                <div className="artisan-preview-avatar">
                  {profileImageUrl && !profileImageUploading
                    ? <img src={profileImageUrl} alt="Profile" />
                    : initials
                  }
                  {/* Overlay while uploading */}
                  {profileImageUploading && (
                    <div className="avatar-spinner-overlay">
                      <div className="avatar-spinner" />
                      <span className="avatar-stage-label">
                        {profileImageProgress?.stage === "compressing" ? "Compressing…" : "Uploading…"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="avatar-overlay">📷</div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={profileImageUploading}
                  id="avatar-upload-input"
                  aria-label="Upload profile photo"
                />
              </div>

              {/* Compression feedback for avatar */}
              {profileImageProgress && profileImageProgress.stage === "done" && (
                <div style={{ fontSize: "0.68rem", color: "rgba(29,176,105,0.8)", marginTop: "6px" }}>
                  ✅ {profileImageProgress.originalSizeKB} KB → {profileImageProgress.compressedSizeKB} KB saved
                </div>
              )}

              <p className="change-photo-hint">Click photo to change</p>

              <h3 className="artisan-preview-name">{firstName || "Artisan"} {lastName || "Profile"}</h3>
              <div className="artisan-preview-craft">⚙️ {craft || "Service Provider"}</div>
            </div>

            <ul className="dash-menu">
              <li><button className="dash-menu-item active">👤 Edit Profile</button></li>
              <li>
                <Link href="/artisans" className="dash-menu-item">
                  🌍 View Public Directory
                </Link>
              </li>
            </ul>
          </aside>

          {/* ── MAIN FORM ───────────────────────────────────────────────────── */}
          <main className="dash-main">
            <div>
              <h2 className="dash-section-title">Professional Profile</h2>
              <p className="dash-section-sub">Complete your portfolio to highlight your craft, location, and services to customers.</p>
            </div>

            <form onSubmit={handleSave}>
              {/* Basic Details */}
              <div className="section-divider">Basic Details</div>

              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label htmlFor="fname">First Name</label>
                  <input type="text" id="fname" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                </div>
                <div className="dash-form-group">
                  <label htmlFor="lname">Last Name</label>
                  <input type="text" id="lname" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="dash-form-row">
                <div className="dash-form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="text" id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="dash-form-group">
                  <label htmlFor="location">Your Location (LGA / Area)</label>
                  <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Abeokuta, Sagamu" required />
                </div>
              </div>

              {/* Craft & Rates */}
              <div className="section-divider" style={{ marginTop: "16px" }}>Professional Craft &amp; Rates</div>

              <div className="dash-form-row">
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
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="dash-form-group">
                  <label htmlFor="experience">Years of Experience</label>
                  <select id="experience" value={experience} onChange={e => setExperience(e.target.value)}>
                    <option value="1 yr exp">1 Year</option>
                    <option value="2 yrs exp">2 Years</option>
                    <option value="3 yrs exp">3 Years</option>
                    <option value="4 yrs exp">4 Years</option>
                    <option value="5 yrs exp">5 Years</option>
                    <option value="6 yrs exp">6 Years</option>
                    <option value="8 yrs exp">8 Years</option>
                    <option value="10 yrs exp">10+ Years</option>
                  </select>
                </div>
              </div>

              <div className="dash-form-group">
                <label htmlFor="price">Starting Rate (₦)</label>
                <input type="text" id="price" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. ₦5,000" />
              </div>

              <div className="dash-form-group">
                <label htmlFor="desc">About Me / Description</label>
                <textarea
                  id="desc"
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell customers about your skills, quality of work, and why they should choose you..."
                />
              </div>

              {/* Services */}
              <div className="section-divider" style={{ marginTop: "16px" }}>Services Offered</div>

              <div className="dash-form-group">
                <label>Specific Services</label>
                <div className="service-entry-row">
                  <input
                    type="text"
                    placeholder="e.g. Wiring, Installations, Repairs"
                    value={newService}
                    onChange={e => setNewService(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addService(); } }}
                  />
                  <button type="button" className="btn-add-service" onClick={addService}>Add</button>
                </div>
                <div className="service-chips">
                  {services.map(srv => (
                    <span className="service-chip" key={srv}>
                      {srv}
                      <button type="button" onClick={() => removeService(srv)}>✕</button>
                    </span>
                  ))}
                  {services.length === 0 && (
                    <span style={{ fontSize: "0.82rem", color: "rgba(250,255,248,0.35)", fontStyle: "italic" }}>
                      No services listed yet. Add some above!
                    </span>
                  )}
                </div>
              </div>

              {/* Portfolio */}
              <div className="section-divider" style={{ marginTop: "16px" }}>Portfolio Showcase</div>

              <div className="dash-form-group">
                <label>Upload photos of previous work</label>
                <div
                  className="portfolio-upload-area"
                  onClick={() => portfolioInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload portfolio photos"
                  onKeyDown={e => e.key === "Enter" && portfolioInputRef.current?.click()}
                >
                  <input
                    ref={portfolioInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePortfolioUpload}
                    style={{ display: "none" }}
                    id="portfolio-upload-input"
                  />
                  <span className="portfolio-upload-icon">📷</span>
                  <strong style={{ fontSize: "0.95rem" }}>Click to choose photos</strong>
                  <p className="upload-hint">
                    Images are automatically compressed to ~250 KB before upload<br />
                    <span style={{ color: "rgba(29,176,105,0.7)", fontWeight: 600 }}>JPG, PNG, WEBP supported · Multiple files OK</span>
                  </p>
                </div>

                {/* Portfolio grid */}
                {portfolioItems.length > 0 && (
                  <div className="portfolio-grid">
                    {portfolioItems.map((item, idx) => (
                      <div className="portfolio-item" key={idx}>

                        {/* Uploaded image */}
                        {item.url && !item.isUploading && (
                          <>
                            <img src={item.url} alt={`Work showcase ${idx + 1}`} />
                            {item.progress?.compressedSizeKB && (
                              <div className="portfolio-size-badge">
                                ✅ {item.progress.originalSizeKB}KB → {item.progress.compressedSizeKB}KB
                              </div>
                            )}
                          </>
                        )}

                        {/* Uploading overlay */}
                        {item.isUploading && item.progress?.stage !== "error" && (
                          <div className="portfolio-uploading-overlay">
                            <div className="upload-progress-ring" />
                            <div className="upload-stage-text">
                              {item.progress?.stage === "compressing" ? "Compressing…" : "Uploading…"}
                            </div>
                            {item.progress?.originalSizeKB && (
                              <div className="upload-size-text">
                                {item.progress.originalSizeKB} KB original
                              </div>
                            )}
                          </div>
                        )}

                        {/* Error overlay */}
                        {item.progress?.stage === "error" && (
                          <div className="portfolio-error-overlay">
                            <span className="portfolio-error-icon">⚠️</span>
                            <span className="portfolio-error-msg">Upload failed</span>
                          </div>
                        )}

                        {/* Remove button (always visible for done/error states) */}
                        {!item.isUploading && (
                          <button
                            type="button"
                            className="portfolio-remove-btn"
                            onClick={() => removePortfolioItem(idx)}
                            aria-label={`Remove photo ${idx + 1}`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {portfolioItems.length === 0 && (
                  <p style={{ fontSize: "0.82rem", color: "rgba(250,255,248,0.3)", fontStyle: "italic", marginTop: "12px", textAlign: "center" }}>
                    No portfolio photos yet. Upload some to showcase your work!
                  </p>
                )}
              </div>

              {/* Save */}
              <div style={{ marginTop: "40px" }}>
                <button
                  type="submit"
                  id="save-profile-btn"
                  className={`btn-save-profile ${saveLoading ? "loading" : ""}`}
                  disabled={saveLoading}
                >
                  <span className="btn-text">
                    {saveLoading ? "" : "💾 Save Profile Changes"}
                  </span>
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>

      {/* Toast */}
      <div className={`dash-toast ${toastType} ${showToast ? "show" : ""}`}>
        {toastMessage}
      </div>

      <Footer />
    </>
  );
}
