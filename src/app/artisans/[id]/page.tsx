"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ARTISANS } from "../page";
import { profileService } from "../../../utils/profileService";
import { reviewService, Review } from "../../../utils/reviewService";
import { useAuth } from "../../../utils/authContext";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";

// ─── Star Rating Picker ───────────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "6px", margin: "8px 0" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "2rem",
            color: star <= (hovered || value) ? "#F5A623" : "#d1d5db",
            transition: "color 0.15s, transform 0.15s",
            transform: star <= (hovered || value) ? "scale(1.2)" : "scale(1)",
            padding: 0,
            lineHeight: 1,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
  const date = new Date(review.created_at).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <div className="review-card">
      <div className="review-card-header">
        <div>
          <span className="review-author">{review.reviewer_name}</span>
          <span className="review-stars" style={{ marginLeft: "10px" }}>{stars}</span>
        </div>
        <span className="review-date">{date}</span>
      </div>
      {review.comment && (
        <p className="review-comment">{review.comment}</p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArtisanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const idStr = resolvedParams.id;
  const { user, profile: viewerProfile, loading: authLoading } = useAuth();

  const [artisan, setArtisan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);

  // ── Reviews state ────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [hasReviewed, setHasReviewed] = useState(false);

  // ── Review form state ────────────────────────────────────────────────────
  const [starRating, setStarRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewToast, setReviewToast] = useState({ msg: "", type: "success" as "success" | "error", visible: false });

  const showReviewToast = (msg: string, type: "success" | "error" = "success") => {
    setReviewToast({ msg, type, visible: true });
    setTimeout(() => setReviewToast(t => ({ ...t, visible: false })), 3500);
  };

  // ── Lightbox keyboard/swipe ───────────────────────────────────────────────
  useEffect(() => {
    if (zoomedIndex === null) return;
    const portfolioLength = artisan?.portfolio?.length || 0;
    if (portfolioLength === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setZoomedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : portfolioLength - 1));
      } else if (e.key === "ArrowRight") {
        setZoomedIndex((prev) => (prev !== null && prev < portfolioLength - 1 ? prev + 1 : 0));
      } else if (e.key === "Escape") {
        setZoomedIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomedIndex, artisan?.portfolio]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (zoomedIndex === null) return;
    const portfolioLength = artisan?.portfolio?.length || 0;
    setZoomedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : portfolioLength - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (zoomedIndex === null) return;
    const portfolioLength = artisan?.portfolio?.length || 0;
    setZoomedIndex((prev) => (prev !== null && prev < portfolioLength - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) { handleNext(); } else { handlePrev(); }
    }
  };

  // ── Load artisan ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchArtisan() {
      try {
        const parsedId = parseInt(idStr, 10);
        if (idStr.startsWith("custom-") || isNaN(parsedId)) {
          const rawId = idStr.replace("custom-", "");
          const profile = await profileService.getProfile(rawId);
          if (profile) {
            const emojiMap: Record<string, string> = {
              Electrician: "⚡", Plumber: "🔧", Tailor: "✂️",
              "AC Tech": "❄️", Carpenter: "🪚", Cleaner: "🧹",
              "Hair Stylist": "💇", Chef: "👨‍🍳", Painter: "🖌️",
              Driver: "🚗", "Shoe Maker": "👞",
            };
            setArtisan({
              id: idStr,
              rawId,
              initials: `${profile.first_name[0] || ""}${profile.last_name[0] || ""}`.toUpperCase() || "A",
              name: `${profile.first_name} ${profile.last_name}`,
              trade: profile.craft,
              tradeEmoji: emojiMap[profile.craft] || "🛠️",
              experience: profile.experience || "1 yr exp",
              rating: profile.rating || 5.0,
              reviews: profile.reviews || 0,
              skills: profile.services && profile.services.length > 0 ? profile.services : [profile.craft],
              location: profile.location,
              distance: "Nearby",
              price: profile.price || "₦5,000",
              available: true,
              featured: false,
              avatarClass: "a1",
              bandClass: "b1",
              description: profile.description,
              profile_image: profile.profile_image || "",
              portfolio: profile.portfolio || [],
              jobsCompleted: 14,
            });
          }
        } else {
          const staticArtisan = ARTISANS.find((a) => a.id === parsedId);
          if (staticArtisan) {
            setArtisan({
              ...staticArtisan,
              rawId: String(parsedId),
              jobsCompleted: staticArtisan.reviews + 8,
              description: `${staticArtisan.name} is a top-tier verified ${staticArtisan.trade} on SettleAm offering premium services to clients in ${staticArtisan.location} and surrounding areas. Equipped with professional tools and extensive experience.`,
              portfolio: [],
            });
          }
        }
      } catch (err) {
        console.error("Error loading artisan profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchArtisan();
  }, [idStr]);

  // ── Load reviews ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!artisan?.rawId) return;
    async function fetchReviews() {
      setReviewsLoading(true);
      const data = await reviewService.getReviewsForArtisan(artisan.rawId);
      setReviews(data);
      setReviewsLoading(false);
    }
    fetchReviews();
  }, [artisan?.rawId]);

  // ── Check if viewer has already reviewed ─────────────────────────────────
  useEffect(() => {
    if (!user || !artisan?.rawId || authLoading) return;
    reviewService.hasUserReviewed(artisan.rawId, user.id).then(setHasReviewed);
  }, [user, artisan?.rawId, authLoading]);

  // ── Submit review ─────────────────────────────────────────────────────────
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !artisan?.rawId) return;
    if (starRating === 0) {
      showReviewToast("Please select a star rating.", "error");
      return;
    }

    setSubmitting(true);
    const reviewerName = viewerProfile
      ? `${viewerProfile.first_name} ${viewerProfile.last_name}`.trim() || "Customer"
      : "Customer";

    const { success, review, error } = await reviewService.submitReview(
      artisan.rawId,
      user.id,
      reviewerName,
      starRating,
      comment
    );

    if (success && review) {
      setReviews((prev) => [review, ...prev]);
      // Update displayed aggregate
      setArtisan((prev: any) => ({
        ...prev,
        rating: Math.round(((prev.rating * prev.reviews + starRating) / (prev.reviews + 1)) * 10) / 10,
        reviews: prev.reviews + 1,
      }));
      setHasReviewed(true);
      setStarRating(0);
      setComment("");
      showReviewToast("✅ Review submitted! Thank you.");
    } else {
      showReviewToast(`❌ ${error || "Failed to submit review."}`, "error");
    }
    setSubmitting(false);
  };

  const handleBook = () => {
    if (!artisan) return;
    const params = new URLSearchParams({ name: artisan.name, trade: artisan.trade });
    router.push(`/book?${params.toString()}`);
  };

  // ── Auth-derived display variables ────────────────────────────────────────
  const isAuthedCustomer = !authLoading && !!user && viewerProfile?.role === "customer";
  const isViewingOwnProfile = !authLoading && !!user && artisan?.rawId === user.id;

  // ── Computed aggregate ────────────────────────────────────────────────────
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : artisan?.rating || 5.0;
  const starsFilled = "★".repeat(Math.round(avgRating));
  const starsEmpty  = "☆".repeat(5 - Math.round(avgRating));

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060F0A", color: "#FAFFF8", fontFamily: "var(--font-syne), sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>⚡</div>
          <div>Loading artisan profile…</div>
        </div>
      </div>
    );
  }

  if (!artisan) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#060F0A", color: "#FAFFF8", fontFamily: "var(--font-syne), sans-serif", padding: "20px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📍</div>
        <h2 style={{ marginBottom: "12px" }}>Artisan Profile Not Found</h2>
        <p style={{ color: "rgba(250,255,248,0.5)", marginBottom: "24px" }}>The requested artisan is not active or has been removed.</p>
        <Link href="/artisans" style={{ padding: "12px 28px", background: "var(--green-bright)", color: "#fff", borderRadius: "100px", textDecoration: "none", fontWeight: 700 }}>
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .prof-banner {
          background: linear-gradient(160deg, #071F13 0%, #0E3A24 50%, #0A2819 100%);
          padding: 140px 6vw 64px; position: relative; overflow: hidden;
        }
        .prof-banner::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 75% 20%, rgba(29,176,105,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(245,166,35,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .prof-header-inner { max-width: 1000px; margin: 0 auto; position: relative; z-index: 2; display: flex; align-items: center; gap: 32px; }
        .prof-avatar {
          width: 100px; height: 100px; border-radius: 28px; background: var(--green);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-syne), sans-serif; font-weight: 800; font-size: 2rem; color: #fff;
          position: relative; flex-shrink: 0; box-shadow: 0 12px 36px rgba(0,0,0,0.3);
        }
        .prof-avatar .verified-mark {
          position: absolute; bottom: -6px; right: -6px; width: 28px; height: 28px;
          background: var(--green-bright); border-radius: 50%; border: 3px solid #0E3A24;
          display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: #fff;
          z-index: 10;
        }
        .prof-title-wrap { flex: 1; min-width: 0; }
        .prof-breadcrumb { font-size: 0.8rem; color: rgba(250,255,248,0.4); margin-bottom: 12px; }
        .prof-breadcrumb a { color: rgba(250,255,248,0.5); text-decoration: none; }
        .prof-breadcrumb a:hover { color: var(--green-bright); }
        .prof-name { font-family: var(--font-syne), sans-serif; font-weight: 800; font-size: 2.2rem; color: #fff; margin-bottom: 12px; letter-spacing: -0.5px; }
        .prof-meta-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .prof-meta-tag {
          display: inline-flex; align-items: center; gap: 6px; background: rgba(29,176,105,0.15);
          color: var(--green-bright); border-radius: 100px; padding: 6px 16px; font-size: 0.82rem; font-weight: 600;
        }

        .prof-body-wrap { max-width: 1000px; margin: -28px auto 0; padding: 0 6vw 80px; position: relative; z-index: 3; }
        .prof-grid { display: grid; grid-template-columns: 1fr 320px; gap: 40px; }
        
        .prof-left-side { display: flex; flex-direction: column; gap: 32px; }
        .prof-card-block {
          background: #fff; border: 1.5px solid var(--border); border-radius: 24px; padding: 36px;
          box-shadow: 0 8px 32px rgba(14,107,69,0.06);
        }
        .prof-card-block h3 {
          font-family: var(--font-syne), sans-serif; font-weight: 800; font-size: 1.25rem;
          color: var(--dark); margin-bottom: 16px; border-bottom: 1.5px solid var(--border); padding-bottom: 10px;
        }
        .prof-desc-text { font-size: 0.96rem; color: var(--muted); font-weight: 300; line-height: 1.7; }
        
        .prof-skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        
        /* Portfolio Grid */
        .prof-portfolio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 16px; }
        .prof-portfolio-item { aspect-ratio: 1; border-radius: 16px; overflow: hidden; border: 1.5px solid var(--border); transition: all 0.25s ease; cursor: pointer; }
        .prof-portfolio-item:hover { transform: scale(1.04); box-shadow: 0 10px 20px rgba(14,107,69,0.12); filter: brightness(1.05); }
        .prof-portfolio-item img { width: 100%; height: 100%; object-fit: cover; }

        /* Lightbox Portfolio Zoom */
        .lightbox-overlay {
          position: fixed; inset: 0; background: rgba(6, 15, 10, 0.92);
          backdrop-filter: blur(12px); z-index: 9999; display: flex;
          align-items: center; justify-content: center; animation: fadeInLightbox 0.25s ease-out;
          cursor: zoom-out;
        }
        .lightbox-content {
          max-width: 90vw; max-height: 85vh; position: relative;
          display: flex; align-items: center; justify-content: center;
          animation: zoomInLightbox 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: default;
        }
        .lightbox-content img {
          max-width: 100%; max-height: 80vh; object-fit: contain;
          border-radius: 20px; border: 2px solid rgba(200, 232, 212, 0.15);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.7);
        }
        .lightbox-close {
          position: absolute; top: 24px; right: 24px;
          background: rgba(250, 255, 248, 0.08); color: #fff;
          border: 1.5px solid rgba(200, 232, 212, 0.15); border-radius: 50%;
          width: 46px; height: 46px; font-size: 1.1rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; z-index: 10000;
        }
        .lightbox-close:hover { background: rgba(250, 255, 248, 0.18); transform: scale(1.05); }
        @keyframes fadeInLightbox { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomInLightbox { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* ── Reviews aggregate bar ── */
        .reviews-aggregate {
          display: flex; align-items: center; gap: 20px; margin-bottom: 24px;
          padding-bottom: 20px; border-bottom: 1.5px solid var(--border);
          flex-wrap: wrap;
        }
        .reviews-big-score {
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 3.5rem; color: var(--dark); line-height: 1;
        }
        .reviews-stars-label { display: flex; flex-direction: column; gap: 4px; }
        .reviews-stars-display { color: #F5A623; font-size: 1.3rem; letter-spacing: 2px; }
        .reviews-count-label { font-size: 0.82rem; color: var(--muted); font-weight: 300; }
        
        /* Reviews list */
        .reviews-list { display: flex; flex-direction: column; gap: 20px; }
        .review-card { border-bottom: 1px solid var(--border); padding-bottom: 16px; }
        .review-card:last-child { border-bottom: none; padding-bottom: 0; }
        .review-card-header { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center; }
        .review-author { font-weight: 600; font-size: 0.92rem; color: var(--dark); }
        .review-stars { color: #F5A623; font-size: 0.85rem; }
        .review-date { font-size: 0.78rem; color: var(--muted); }
        .review-comment { font-size: 0.88rem; color: var(--muted); line-height: 1.6; font-weight: 300; }

        /* ── Review form ── */
        .review-form-wrap {
          margin-top: 28px; padding-top: 24px;
          border-top: 1.5px solid var(--border);
        }
        .review-form-title {
          font-family: var(--font-syne), sans-serif; font-weight: 700;
          font-size: 1.05rem; color: var(--dark); margin-bottom: 12px;
        }
        .review-textarea {
          width: 100%; padding: 14px 16px;
          background: rgba(14,107,69,0.03); border: 1.5px solid #C8E8D4;
          border-radius: 12px; font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.9rem; color: var(--dark); resize: vertical; min-height: 90px;
          outline: none; transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .review-textarea:focus { border-color: #1DB069; background: rgba(29,176,105,0.04); }
        .review-submit-btn {
          margin-top: 14px; padding: 13px 28px;
          background: #0E6B45; color: #fff; border: none;
          border-radius: 100px; font-family: var(--font-syne), sans-serif;
          font-weight: 700; font-size: 0.9rem; cursor: pointer;
          transition: all 0.2s; box-shadow: 0 4px 16px rgba(14,107,69,0.25);
        }
        .review-submit-btn:hover:not(:disabled) { background: #138A58; transform: translateY(-1px); }
        .review-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Login prompt */
        .review-login-prompt {
          margin-top: 24px; padding: 20px 24px;
          background: rgba(14,107,69,0.05); border: 1.5px dashed rgba(14,107,69,0.25);
          border-radius: 14px; text-align: center;
        }
        .review-login-prompt p { font-size: 0.92rem; color: var(--muted); margin-bottom: 12px; font-weight: 300; }
        .review-login-prompt a {
          display: inline-block; padding: 10px 24px;
          background: #0E6B45; color: #fff; border-radius: 100px;
          text-decoration: none; font-family: var(--font-syne), sans-serif;
          font-weight: 700; font-size: 0.85rem; transition: background 0.2s;
        }
        .review-login-prompt a:hover { background: #138A58; }

        /* Already reviewed notice */
        .review-already-done {
          margin-top: 24px; padding: 16px 20px;
          background: rgba(29,176,105,0.07); border: 1.5px solid rgba(29,176,105,0.2);
          border-radius: 12px; display: flex; align-items: center; gap: 10px;
          font-size: 0.9rem; color: #0E6B45; font-weight: 500;
        }

        /* Review toast */
        .review-toast {
          position: fixed; bottom: 32px; left: 50%;
          transform: translateX(-50%) translateY(20px);
          padding: 13px 28px; border-radius: 100px;
          font-family: var(--font-syne), sans-serif; font-weight: 600;
          font-size: 0.88rem; opacity: 0; transition: all 0.3s ease;
          pointer-events: none; white-space: nowrap; z-index: 1000; color: #fff;
        }
        .review-toast.success { background: #0E6B45; box-shadow: 0 8px 28px rgba(14,107,69,0.35); }
        .review-toast.error   { background: #c0392b; box-shadow: 0 8px 28px rgba(192,57,43,0.35); }
        .review-toast.show    { opacity: 1; transform: translateX(-50%) translateY(0); }

        /* Sidebar booking details card */
        .prof-sticky-card {
          background: var(--green-light); border: 1.5px solid rgba(14,107,69,0.18);
          border-radius: 24px; padding: 28px; position: sticky; top: 100px;
          box-shadow: 0 12px 40px rgba(14,107,69,0.06);
        }
        .side-price-label { font-size: 0.78rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .side-price-val { font-family: var(--font-syne), sans-serif; font-weight: 800; font-size: 2.2rem; color: var(--green); margin: 6px 0 18px; }
        .side-detail-row {
          display: flex; flex-direction: column; gap: 12px;
          border-top: 1px solid rgba(14, 107, 69, 0.12); padding-top: 18px; margin-bottom: 24px;
        }
        .side-detail-item { display: flex; align-items: center; gap: 10px; font-size: 0.88rem; color: var(--text); }
        .side-detail-item span { opacity: 0.7; }
        .side-booking-btn {
          width: 100%; padding: 16px; background: var(--green); color: #fff; border: none;
          border-radius: 100px; font-family: var(--font-syne), sans-serif; font-weight: 700;
          font-size: 1rem; cursor: pointer; transition: all 0.25s; text-align: center; display: block;
          box-shadow: 0 4px 20px rgba(14,107,69,0.3); text-decoration: none;
        }
        .side-booking-btn:hover { background: var(--dark); transform: translateY(-2px); }
        .side-escrow-badge { font-size: 0.75rem; color: var(--muted); text-align: center; margin-top: 14px; font-weight: 500; }

        @media (max-width: 900px) {
          .prof-grid { grid-template-columns: 1fr; }
          .prof-sticky-card { position: static; margin-top: 20px; }
          .prof-banner { padding-top: 110px; }
          .prof-header-inner { flex-direction: column; text-align: center; gap: 20px; }
          .prof-meta-row { justify-content: center; }
        }
        @media (max-width: 600px) {
          .prof-banner { padding-top: 96px; }
          .prof-card-block { padding: 24px 18px; }
          .reviews-big-score { font-size: 2.5rem; }
        }
      ` }} />

      {/* NAVIGATION */}
      <Header
        variant="simple"
        theme="dark"
        backLabel="← Back to Directory"
        backHref="/artisans"
      />

      {/* BANNER HEADER */}
      <div className="prof-banner">
        <div className="prof-header-inner">
          <div className={`prof-avatar ${artisan.avatarClass}`}>
            <div style={{ width: "100%", height: "100%", borderRadius: "inherit", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {artisan.profile_image
                ? <img src={artisan.profile_image} alt={artisan.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : artisan.initials
              }
            </div>
            <div className="verified-mark">✓</div>
          </div>

          <div className="prof-title-wrap">
            <div className="prof-breadcrumb">
              <Link href="/">Home</Link> › <Link href="/artisans">Browse Artisans</Link> › <span>{artisan.name}</span>
            </div>
            <h1 className="prof-name">{artisan.name}</h1>
            <div className="prof-meta-row">
              <span className="prof-meta-tag">{artisan.tradeEmoji} {artisan.trade}</span>
              <span className="prof-meta-link" style={{ fontSize: "0.85rem", color: "rgba(250, 255, 248, 0.75)", fontWeight: 500 }}>
                ⭐ {avgRating.toFixed(1)} ({reviews.length > 0 ? reviews.length : artisan.reviews} reviews)
              </span>
              <span className="prof-meta-link" style={{ fontSize: "0.85rem", color: "rgba(250, 255, 248, 0.75)", fontWeight: 500 }}>
                💼 {artisan.jobsCompleted} Completed Jobs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="prof-body-wrap">
        <div className="prof-grid">
          
          {/* LEFT SIDE DETAILS */}
          <div className="prof-left-side">
            <div className="prof-card-block">
              <h3>About the Artisan</h3>
              <p className="prof-desc-text">{artisan.description}</p>
            </div>

            <div className="prof-card-block">
              <h3>Services Offered</h3>
              <div className="prof-skills-grid">
                {artisan.skills.map((skill: string) => (
                  <span className="skill-chip" key={skill} style={{ margin: "4px" }}>{skill}</span>
                ))}
              </div>
            </div>

            {artisan.portfolio && artisan.portfolio.length > 0 && (
              <div className="prof-card-block">
                <h3>Portfolio Showcase</h3>
                <div className="prof-portfolio-grid">
                  {artisan.portfolio.map((img: string, idx: number) => (
                    <div className="prof-portfolio-item" key={idx} onClick={() => setZoomedIndex(idx)}>
                      <img src={img} alt={`Work project ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── REVIEWS SECTION ── */}
            <div className="prof-card-block">
              <h3>Customer Reviews &amp; Feedback</h3>

              {/* Aggregate score */}
              {(reviews.length > 0 || artisan.reviews > 0) && (
                <div className="reviews-aggregate">
                  <div className="reviews-big-score">{avgRating.toFixed(1)}</div>
                  <div className="reviews-stars-label">
                    <div className="reviews-stars-display">{starsFilled}{starsEmpty}</div>
                    <div className="reviews-count-label">
                      Based on {reviews.length > 0 ? reviews.length : artisan.reviews} review{(reviews.length !== 1) ? "s" : ""}
                    </div>
                  </div>
                </div>
              )}

              {/* Review list */}
              {reviewsLoading ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--muted)" }}>
                  <div style={{ fontSize: "1.4rem", marginBottom: "8px" }}>⏳</div>
                  <p style={{ fontSize: "0.85rem" }}>Loading reviews…</p>
                </div>
              ) : reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "12px" }}>💬</div>
                  <p style={{ fontSize: "0.92rem", fontWeight: 500, marginBottom: "6px", color: "var(--dark)" }}>No reviews yet</p>
                  <p style={{ fontSize: "0.85rem", fontWeight: 300 }}>Be the first to leave a review!</p>
                </div>
              ) : (
                <div className="reviews-list">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}

              {/* ── Write a review ── */}
              {authLoading ? null : !user ? (
                /* Guest: prompt to log in */
                <div className="review-login-prompt">
                  <p>Log in to rate this artisan and leave a review</p>
                  <Link href={`/login?redirect=/artisans/${idStr}`}>Log in to Review</Link>
                </div>
              ) : isViewingOwnProfile ? null : hasReviewed ? (
                /* Already reviewed */
                <div className="review-already-done">
                  <span style={{ fontSize: "1.2rem" }}>✅</span>
                  You've already submitted a review for this artisan. Thank you!
                </div>
              ) : isAuthedCustomer ? (
                /* Customer: show form */
                <form className="review-form-wrap" onSubmit={handleSubmitReview}>
                  <div className="review-form-title">Leave a Review</div>
                  <StarPicker value={starRating} onChange={setStarRating} />
                  <textarea
                    className="review-textarea"
                    placeholder="Share your experience (optional)…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <div>
                    <button
                      type="submit"
                      className="review-submit-btn"
                      disabled={submitting || starRating === 0}
                      id="submit-review-btn"
                    >
                      {submitting ? "Submitting…" : "Submit Review"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Artisan: can view but not review */
                <div style={{ marginTop: "20px", padding: "14px 18px", background: "rgba(14,107,69,0.05)", borderRadius: "10px", fontSize: "0.85rem", color: "var(--muted)", fontWeight: 300 }}>
                  Only customers can leave reviews for artisans.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE STICKY BOOKING CARD */}
          <div className="prof-right-side">
            <div className="prof-sticky-card">
              <div className="side-price-label">Starting Rate</div>
              <div className="side-price-val">{artisan.price}</div>

              <div className="side-detail-row">
                <div className="side-detail-item"><span>📍</span> Location: <strong>{artisan.location}</strong></div>
                <div className="side-detail-item"><span>⏱️</span> Experience: <strong>{artisan.experience}</strong></div>
                <div className="side-detail-item"><span>⚡</span> Availability: <strong>Now / Online</strong></div>
                <div className="side-detail-item"><span>🛡️</span> Guarantee: <strong>100% Quality Assurance</strong></div>
              </div>

              <button className="side-booking-btn" onClick={handleBook}>
                Book {artisan.name.split(" ")[0]} Now →
              </button>
              <div className="side-escrow-badge">🔒 Pay artisan directly after job completion</div>
            </div>
          </div>

        </div>
      </div>

      <Footer />

      {/* Review toast */}
      <div
        className={`review-toast ${reviewToast.type}${reviewToast.visible ? " show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {reviewToast.msg}
      </div>

      {/* Lightbox Overlay */}
      {zoomedIndex !== null && artisan.portfolio && artisan.portfolio[zoomedIndex] && (
        <div
          className="lightbox-overlay"
          onClick={() => setZoomedIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="lightbox-close" onClick={() => setZoomedIndex(null)} aria-label="Close viewer">✕</button>
          
          {artisan.portfolio.length > 1 && (
            <>
              <button className="lightbox-nav lightbox-nav--prev" onClick={handlePrev} aria-label="Previous image">‹</button>
              <button className="lightbox-nav lightbox-nav--next" onClick={handleNext} aria-label="Next image">›</button>
            </>
          )}

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={artisan.portfolio[zoomedIndex]} alt="Zoomed portfolio showcase" />
            {artisan.portfolio.length > 1 && (
              <div className="lightbox-indicator">
                {zoomedIndex + 1} / {artisan.portfolio.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
