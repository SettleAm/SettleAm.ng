"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../utils/supabase";
import { profileService, ArtisanProfile } from "../../utils/profileService";
import {
  uploadPortfolioImage,
  deleteStorageImage,
  UploadProgress,
} from "../../utils/imageUpload";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioItem {
  url: string;         // Cloudinary URL (permanent)
  previewUrl?: string; // Local objectURL (temporary, during upload)
  isUploading?: boolean;
  progress?: UploadProgress;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ArtisanProfile | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Drag-over state for drop zone
  const [dragOver, setDragOver] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [toastVisible, setToastVisible] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3500);
  };

  // ── Auth + profile load ───────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) { router.push("/login"); return; }
        setUser(user);

        const p = await profileService.ensureProfileForUser(user.id, user.email || "", user.user_metadata);
        setProfile(p);
        setItems((p.portfolio || []).map((url) => ({ url })));
      } catch {
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    }
    init();
  }, [router]);

  // ── Save portfolio URLs back to Supabase ─────────────────────────────────

  const savePortfolio = useCallback(async (updatedItems: PortfolioItem[], prof: ArtisanProfile) => {
    setSaving(true);
    const updatedProfile: ArtisanProfile = {
      ...prof,
      portfolio: updatedItems.filter((i) => i.url && !i.isUploading).map((i) => i.url),
    };
    const success = await profileService.saveProfile(updatedProfile);
    setSaving(false);
    if (success) {
      setProfile(updatedProfile);
    }
    return success;
  }, []);

  // ── Upload handler ────────────────────────────────────────────────────────

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || !user || !profile) return;
    const fileArray = Array.from(fileList);

    // Instant local previews
    const localPreviews = fileArray.map((f) => URL.createObjectURL(f));
    const placeholders: PortfolioItem[] = fileArray.map((f, i) => ({
      url: "",
      previewUrl: localPreviews[i],
      isUploading: true,
      progress: { fileName: f.name, stage: "compressing", originalSizeKB: Math.round(f.size / 1024) },
    }));

    setItems((prev) => {
      const next = [...prev, ...placeholders];
      return next;
    });

    const startIndex = items.length;

    await Promise.all(
      fileArray.map(async (file, i) => {
        const idx = startIndex + i;
        try {
          const url = await uploadPortfolioImage(file, user.id, (progress) => {
            setItems((prev) => {
              const u = [...prev];
              if (u[idx]) u[idx] = { ...u[idx], progress };
              return u;
            });
          });

          URL.revokeObjectURL(localPreviews[i]);
          setItems((prev) => {
            const u = [...prev];
            if (u[idx]) u[idx] = { url, previewUrl: undefined, isUploading: false };
            // Auto-save after each successful upload
            const finalItems = u;
            if (profile) savePortfolio(finalItems, profile).then((ok) => {
              if (ok) showToast("✅ Photo uploaded & saved!");
            });
            return u;
          });
        } catch (err: any) {
          setItems((prev) => {
            const u = [...prev];
            if (u[idx]) u[idx] = {
              ...u[idx],
              url: "",
              isUploading: false,
              progress: { ...u[idx].progress!, stage: "error", error: err.message },
            };
            return u;
          });
          showToast(`❌ Failed to upload ${file.name}`, "error");
        }
      })
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (index: number) => {
    if (!profile) return;
    const item = items[index];
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    if (item.url) deleteStorageImage(item.url);

    const next = items.filter((_, i) => i !== index);
    setItems(next);

    // Close lightbox if deleting the open image
    if (lightboxIndex === index) setLightboxIndex(null);
    else if (lightboxIndex !== null && lightboxIndex > index) setLightboxIndex(lightboxIndex - 1);

    const ok = await savePortfolio(next, profile);
    if (ok) showToast("🗑️ Photo removed.");
    else showToast("❌ Failed to remove photo.", "error");
  };

  // ── Lightbox navigation ───────────────────────────────────────────────────

  const viewableItems = items.filter((i) => (i.url || i.previewUrl) && !i.isUploading);

  const openLightbox = (item: PortfolioItem) => {
    const realIndex = viewableItems.findIndex((i) => i.url === item.url && i.url !== "");
    if (realIndex >= 0) setLightboxIndex(realIndex);
  };

  const lightboxPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + viewableItems.length) % viewableItems.length);
  };
  const lightboxNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % viewableItems.length);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, viewableItems.length]);

  // ── Drop zone ─────────────────────────────────────────────────────────────

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060F0A", color: "#FAFFF8", fontFamily: "var(--font-syne), sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "16px" }}>🖼️</div>
          <div>Loading portfolio…</div>
        </div>
      </div>
    );
  }

  const uploadedCount = items.filter((i) => i.url && !i.isUploading).length;
  const uploadingCount = items.filter((i) => i.isUploading).length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Page shell ── */
        .pf-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 6vw; background: rgba(10,31,21,0.95);
          border-bottom: 1px solid rgba(200,232,212,0.1); backdrop-filter: blur(16px);
        }
        .pf-logo-text { font-family: var(--font-syne),sans-serif; font-weight: 800; font-size: 1.4rem; color: #FAFFF8; }
        .pf-logo-text span { color: #1DB069; }

        .pf-container {
          min-height: 100vh; background: #060F0A; color: #FAFFF8;
          padding: 96px 6vw 80px;
        }
        .pf-grid { display: grid; grid-template-columns: 260px 1fr; gap: 40px; }

        /* ── Sidebar ── */
        .pf-aside {
          background: rgba(14,107,69,0.04); border: 1px solid rgba(200,232,212,0.1);
          border-radius: 20px; padding: 28px; height: fit-content; position: sticky; top: 100px;
        }
        .pf-sidebar-title {
          font-family: var(--font-syne),sans-serif; font-weight: 800; font-size: 1rem;
          margin-bottom: 20px; color: rgba(250,255,248,0.5); text-transform: uppercase;
          letter-spacing: 0.5px; font-size: 0.75rem;
        }
        .pf-menu { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .pf-menu-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 10px;
          color: rgba(250,255,248,0.7); text-decoration: none; font-size: 0.9rem; font-weight: 500;
          transition: all 0.2s; background: transparent; font-family: var(--font-dm-sans),sans-serif;
        }
        .pf-menu-item.active, .pf-menu-item:hover { background: rgba(29,176,105,0.1); color: #1DB069; }

        /* ── Main content ── */
        .pf-main {
          background: rgba(14,107,69,0.03); border: 1px solid rgba(200,232,212,0.08);
          border-radius: 24px; padding: 40px;
        }

        /* ── Header bar ── */
        .pf-header-row {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 32px; gap: 20px; flex-wrap: wrap;
        }
        .pf-title { font-family: var(--font-syne),sans-serif; font-weight: 800; font-size: 1.7rem; }
        .pf-sub { font-size: 0.88rem; color: rgba(250,255,248,0.45); margin-top: 4px; font-weight: 300; }

        /* ── Stats bar ── */
        .pf-stats {
          display: flex; gap: 20px; margin-bottom: 28px; flex-wrap: wrap;
        }
        .pf-stat-chip {
          display: flex; align-items: center; gap: 8px;
          background: rgba(29,176,105,0.08); border: 1px solid rgba(29,176,105,0.2);
          border-radius: 100px; padding: 8px 18px; font-size: 0.82rem; font-weight: 600;
          color: rgba(250,255,248,0.8);
        }
        .pf-stat-chip span { color: #1DB069; font-size: 1rem; font-weight: 800; }

        /* ── Drop zone ── */
        .pf-dropzone {
          border: 2px dashed rgba(200,232,212,0.2); border-radius: 20px;
          padding: 40px 24px; text-align: center; cursor: pointer;
          transition: all 0.25s; background: rgba(255,255,255,0.02);
          margin-bottom: 36px; position: relative;
        }
        .pf-dropzone.dragging { border-color: #1DB069; background: rgba(29,176,105,0.06); }
        .pf-dropzone:hover { border-color: rgba(29,176,105,0.5); background: rgba(29,176,105,0.03); }
        .pf-dropzone-icon { font-size: 2.8rem; margin-bottom: 12px; }
        .pf-dropzone-title { font-family: var(--font-syne),sans-serif; font-weight: 700; font-size: 1.05rem; margin-bottom: 6px; }
        .pf-dropzone-sub { font-size: 0.78rem; color: rgba(250,255,248,0.4); line-height: 1.6; }
        .pf-dropzone-sub strong { color: rgba(29,176,105,0.8); }
        .pf-upload-btn {
          margin-top: 16px; display: inline-block; padding: 11px 28px;
          background: #1DB069; color: #fff; border: none; border-radius: 100px;
          font-family: var(--font-syne),sans-serif; font-weight: 700; font-size: 0.88rem;
          cursor: pointer; transition: all 0.2s;
        }
        .pf-upload-btn:hover { background: #138A58; transform: translateY(-1px); }

        /* ── Gallery grid ── */
        .pf-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 16px;
        }

        .pf-card {
          position: relative; aspect-ratio: 1; border-radius: 16px; overflow: hidden;
          border: 1.5px solid rgba(200,232,212,0.12); background: rgba(255,255,255,0.03);
          cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;
          animation: pfFadeIn 0.35s ease both;
        }
        .pf-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
        .pf-card img { width: 100%; height: 100%; object-fit: cover; display: block; transition: opacity 0.3s; }

        /* Upload-in-progress overlay */
        .pf-card-overlay {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 8px; padding: 12px;
          pointer-events: none;
        }
        .pf-card-overlay.uploading { background: rgba(6,15,10,0.55); }
        .pf-card-overlay.error { background: rgba(30,5,5,0.88); }
        .pf-spinner {
          width: 34px; height: 34px; border: 3px solid rgba(29,176,105,0.25);
          border-top-color: #1DB069; border-radius: 50%;
          animation: pfSpin 0.85s linear infinite;
        }
        .pf-stage { font-size: 0.6rem; color: #1DB069; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; }
        .pf-err-icon { font-size: 1.5rem; }
        .pf-err-text { font-size: 0.62rem; color: #FF6B6B; text-align: center; }

        /* Hover actions */
        .pf-card-actions {
          position: absolute; inset: 0; background: rgba(6,15,10,0.62);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
          opacity: 0; transition: opacity 0.2s; pointer-events: none;
        }
        .pf-card:hover .pf-card-actions { opacity: 1; pointer-events: auto; }
        .pf-action-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 100px; border: none;
          font-family: var(--font-dm-sans),sans-serif; font-weight: 700;
          font-size: 0.78rem; cursor: pointer; transition: all 0.2s;
        }
        .pf-action-view { background: rgba(29,176,105,0.9); color: #fff; }
        .pf-action-view:hover { background: #1DB069; }
        .pf-action-delete { background: rgba(255,107,107,0.88); color: #fff; }
        .pf-action-delete:hover { background: #FF6B6B; }

        /* Compression badge */
        .pf-badge {
          position: absolute; bottom: 0; left: 0; right: 0; padding: 6px 8px;
          background: rgba(6,15,10,0.75); font-size: 0.58rem; font-weight: 600;
          color: rgba(29,176,105,0.9); text-align: center; backdrop-filter: blur(4px);
          transform: translateY(100%); transition: transform 0.2s;
        }
        .pf-card:hover .pf-badge { transform: translateY(0); }

        /* ── Empty state ── */
        .pf-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 60px 20px; text-align: center;
        }
        .pf-empty-icon { font-size: 4rem; margin-bottom: 16px; opacity: 0.5; }
        .pf-empty-title { font-family: var(--font-syne),sans-serif; font-weight: 700; font-size: 1.2rem; margin-bottom: 8px; }
        .pf-empty-sub { font-size: 0.85rem; color: rgba(250,255,248,0.4); max-width: 320px; line-height: 1.6; }

        /* ── Lightbox ── */
        .pf-lightbox-overlay {
          position: fixed; inset: 0; z-index: 900; background: rgba(0,0,0,0.92);
          display: flex; align-items: center; justify-content: center;
          animation: pfFadeIn 0.2s ease;
        }
        .pf-lightbox-img {
          max-width: 90vw; max-height: 85vh; border-radius: 16px;
          object-fit: contain; box-shadow: 0 24px 80px rgba(0,0,0,0.7);
          animation: pfScaleIn 0.2s ease;
        }
        .pf-lightbox-close {
          position: absolute; top: 20px; right: 24px;
          background: rgba(255,255,255,0.1); border: none; color: #fff;
          width: 44px; height: 44px; border-radius: 50%; font-size: 1.2rem;
          cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center;
        }
        .pf-lightbox-close:hover { background: rgba(255,255,255,0.2); }
        .pf-lightbox-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.1); border: none; color: #fff;
          width: 48px; height: 48px; border-radius: 50%; font-size: 1.4rem;
          cursor: pointer; transition: background 0.2s; display: flex; align-items: center; justify-content: center;
        }
        .pf-lightbox-nav:hover { background: rgba(29,176,105,0.5); }
        .pf-lightbox-prev { left: 20px; }
        .pf-lightbox-next { right: 20px; }
        .pf-lightbox-counter {
          position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: rgba(0,0,0,0.5); padding: 6px 20px; border-radius: 100px;
          font-size: 0.82rem; color: rgba(255,255,255,0.7); backdrop-filter: blur(8px);
        }

        /* ── Toast ── */
        .pf-toast {
          position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%) translateY(20px);
          padding: 14px 28px; border-radius: 100px; font-family: var(--font-syne),sans-serif;
          font-weight: 600; font-size: 0.9rem; box-shadow: 0 8px 30px rgba(0,0,0,0.3);
          opacity: 0; transition: all 0.35s ease; pointer-events: none; white-space: nowrap;
          z-index: 1000; color: #fff;
        }
        .pf-toast.success { background: #1DB069; box-shadow: 0 8px 30px rgba(29,176,105,0.4); }
        .pf-toast.error { background: #c0392b; box-shadow: 0 8px 30px rgba(192,57,43,0.4); }
        .pf-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        /* ── Saving indicator ── */
        .pf-saving-pill {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(29,176,105,0.1); border: 1px solid rgba(29,176,105,0.25);
          border-radius: 100px; padding: 7px 16px; font-size: 0.78rem; color: #1DB069;
          font-weight: 600; animation: pfPulse 1.4s ease-in-out infinite;
        }
        .pf-save-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #1DB069;
          animation: pfPulse 1.4s ease-in-out infinite;
        }

        @keyframes pfSpin { to { transform: rotate(360deg); } }
        @keyframes pfFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes pfScaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes pfPulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }

        @media (max-width: 900px) {
          .pf-grid { grid-template-columns: 1fr; }
          .pf-aside { position: static; }
          .pf-container { padding-top: 92px; }
        }
        @media (max-width: 560px) {
          .pf-gallery { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
          .pf-main { padding: 24px 16px; }
        }
      `}} />

      <Header variant="simple" theme="dark" onLogout={async () => { await supabase.auth.signOut(); router.push("/login"); }} />

      <div className="pf-container">
        <div className="pf-grid">

          {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
          <aside className="pf-aside">
            <div className="pf-sidebar-title">Artisan Dashboard</div>
            <ul className="pf-menu">
              <li>
                <Link href="/dashboard" className="pf-menu-item">
                  👤 Edit Profile
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="pf-menu-item active">
                  🖼️ My Portfolio
                </Link>
              </li>
              <li>
                <Link href="/settings" className="pf-menu-item">
                  ⚙️ Settings
                </Link>
              </li>
              <li>
                <Link href="/artisans" className="pf-menu-item">
                  🌍 View Public Directory
                </Link>
              </li>
            </ul>
          </aside>

          {/* ── MAIN ────────────────────────────────────────────────────────── */}
          <main className="pf-main">

            {/* Header row */}
            <div className="pf-header-row">
              <div>
                <h1 className="pf-title">My Portfolio</h1>
                <p className="pf-sub">
                  Manage your work showcase. Photos are optimised and stored automatically.
                </p>
              </div>
              {saving && (
                <div className="pf-saving-pill">
                  <div className="pf-save-dot" />
                  Saving…
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="pf-stats">
              <div className="pf-stat-chip">
                📸 <span>{uploadedCount}</span> photo{uploadedCount !== 1 ? "s" : ""} uploaded
              </div>
              {uploadingCount > 0 && (
                <div className="pf-stat-chip" style={{ color: "#1DB069" }}>
                  ⏳ <span>{uploadingCount}</span> uploading…
                </div>
              )}
            </div>

            {/* Drop zone */}
            <div
              className={`pf-dropzone${dragOver ? " dragging" : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload portfolio photos"
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleInputChange}
                id="pf-upload-input"
              />
              <div className="pf-dropzone-icon">🖼️</div>
              <div className="pf-dropzone-title">Drag & drop photos here, or click to browse</div>
              <p className="pf-dropzone-sub">
                Images are automatically compressed before upload<br />
                <strong>JPG, PNG, WEBP · Multiple files OK</strong>
              </p>
              <button
                type="button"
                className="pf-upload-btn"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                + Upload Photos
              </button>
            </div>

            {/* Gallery */}
            {items.length > 0 ? (
              <div className="pf-gallery">
                {items.map((item, idx) => (
                  <div className="pf-card" key={idx}>

                    {/* Image — show local preview immediately while uploading */}
                    {(item.previewUrl || item.url) && (
                      <img
                        src={item.previewUrl || item.url}
                        alt={`Portfolio photo ${idx + 1}`}
                        style={{ opacity: item.isUploading ? 0.5 : 1 }}
                      />
                    )}

                    {/* Uploading overlay */}
                    {item.isUploading && item.progress?.stage !== "error" && (
                      <div className="pf-card-overlay uploading">
                        <div className="pf-spinner" />
                        <div className="pf-stage">
                          {item.progress?.stage === "compressing" ? "Compressing…" : "Uploading…"}
                        </div>
                      </div>
                    )}

                    {/* Error overlay */}
                    {item.progress?.stage === "error" && (
                      <div className="pf-card-overlay error">
                        <div className="pf-err-icon">⚠️</div>
                        <div className="pf-err-text">Upload failed</div>
                      </div>
                    )}

                    {/* Hover actions — only on completed uploads */}
                    {item.url && !item.isUploading && (
                      <>
                        <div className="pf-card-actions">
                          <button
                            type="button"
                            className="pf-action-btn pf-action-view"
                            onClick={(e) => { e.stopPropagation(); openLightbox(item); }}
                            aria-label="View full size"
                          >
                            🔍 View
                          </button>
                          <button
                            type="button"
                            className="pf-action-btn pf-action-delete"
                            onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
                            aria-label="Delete photo"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                        {item.progress?.compressedSizeKB && (
                          <div className="pf-badge">
                            ✅ {item.progress.originalSizeKB}KB → {item.progress.compressedSizeKB}KB
                          </div>
                        )}
                      </>
                    )}

                    {/* Delete button for error items */}
                    {item.progress?.stage === "error" && (
                      <button
                        type="button"
                        className="pf-action-btn pf-action-delete"
                        style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)" }}
                        onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="pf-empty">
                <div className="pf-empty-icon">📷</div>
                <div className="pf-empty-title">No portfolio photos yet</div>
                <p className="pf-empty-sub">
                  Upload photos of your best work above to showcase your skills to clients browsing SettleAm.
                </p>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ── LIGHTBOX ──────────────────────────────────────────────────────── */}
      {lightboxIndex !== null && viewableItems[lightboxIndex] && (
        <div className="pf-lightbox-overlay" onClick={() => setLightboxIndex(null)}>
          <img
            className="pf-lightbox-img"
            src={viewableItems[lightboxIndex].url}
            alt={`Portfolio full view ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          <button className="pf-lightbox-close" onClick={() => setLightboxIndex(null)} aria-label="Close">✕</button>
          {viewableItems.length > 1 && (
            <>
              <button className="pf-lightbox-nav pf-lightbox-prev" onClick={(e) => { e.stopPropagation(); lightboxPrev(); }} aria-label="Previous">‹</button>
              <button className="pf-lightbox-nav pf-lightbox-next" onClick={(e) => { e.stopPropagation(); lightboxNext(); }} aria-label="Next">›</button>
              <div className="pf-lightbox-counter">{lightboxIndex + 1} / {viewableItems.length}</div>
            </>
          )}
        </div>
      )}

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      <div className={`pf-toast ${toastType} ${toastVisible ? "show" : ""}`}>{toastMsg}</div>

      <Footer />
    </>
  );
}
