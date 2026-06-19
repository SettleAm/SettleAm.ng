"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ARTISANS } from "../page";
import { profileService } from "../../../utils/profileService";
import Footer from "../../../components/Footer";
import Header from "../../../components/Header";

// Generate realistic mock reviews for any craft/name to keep the UI complete and lively
function getMockReviews(name: string, craft: string) {
  return [
    {
      id: 1,
      author: "Chinedu Alao",
      rating: 5,
      date: "2 weeks ago",
      comment: `Highly recommended! ${name} resolved my ${craft.toLowerCase()} issue in under an hour. Very clean and professional work.`
    },
    {
      id: 2,
      author: "Yetunde Soyinka",
      rating: 5,
      date: "1 month ago",
      comment: `Extremely polite and punctual. Came with all required tools and completed the installation without any hassle. Will book again.`
    },
    {
      id: 3,
      author: "Musa Ibrahim",
      rating: 4.8,
      date: "2 months ago",
      comment: "Good quality of work and fair pricing. Cleaned up the site after work. Recommended."
    }
  ];
}

export default function ArtisanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const idStr = resolvedParams.id;
  const [artisan, setArtisan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);

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
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  useEffect(() => {
    async function fetchArtisan() {
      try {
        const parsedId = parseInt(idStr, 10);
        if (idStr.startsWith("custom-") || isNaN(parsedId)) {
          const rawId = idStr.replace("custom-", "");
          const profile = await profileService.getProfile(rawId);
          if (profile) {
            // Format custom profile to match ARTISANS format
            const emojiMap: Record<string, string> = {
              Electrician: "⚡",
              Plumber: "🔧",
              Tailor: "✂️",
              "AC Tech": "❄️",
              Carpenter: "🪚",
              Cleaner: "🧹",
              "Hair Stylist": "💇",
              Chef: "👨‍🍳",
              Painter: "🖌️",
              Driver: "🚗",
              "Shoe Maker": "👞",
            };
            const tradeEmoji = emojiMap[profile.craft] || "🛠️";
            
            setArtisan({
              id: idStr,
              initials: `${profile.first_name[0] || ""}${profile.last_name[0] || ""}`.toUpperCase() || "A",
              name: `${profile.first_name} ${profile.last_name}`,
              trade: profile.craft,
              tradeEmoji: tradeEmoji,
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
              jobsCompleted: 14
            });
          }
        } else {
          // Parse static artisan
          const staticArtisan = ARTISANS.find((a) => a.id === parsedId);
          if (staticArtisan) {
            setArtisan({
              ...staticArtisan,
              jobsCompleted: staticArtisan.reviews + 8, // Realistic job count based on reviews
              description: `${staticArtisan.name} is a top-tier verified ${staticArtisan.trade} on SettleAm offering premium services to clients in ${staticArtisan.location} and surrounding areas. Equipped with professional tools and extensive experience.`,
              portfolio: [] // Static artisans don't have portfolios by default
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

  const handleBook = () => {
    if (!artisan) return;
    const params = new URLSearchParams({
      name: artisan.name,
      trade: artisan.trade,
    });
    router.push(`/book?${params.toString()}`);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#060F0A", color: "#FAFFF8", fontFamily: "var(--font-syne), sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>⚡</div>
          <div>Loading artisan profile…</div>
        </div>
      </div>
    );
  }

  if (!artisan) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "#060F0A", color: "#FAFFF8", fontFamily: "var(--font-syne), sans-serif", padding: "20px"
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📍</div>
        <h2 style={{ marginBottom: "12px" }}>Artisan Profile Not Found</h2>
        <p style={{ color: "rgba(250,255,248,0.5)", marginBottom: "24px" }}>The requested artisan is not active or has been removed.</p>
        <Link href="/artisans" style={{
          padding: "12px 28px", background: "var(--green-bright)", color: "#fff",
          borderRadius: "100px", textDecoration: "none", fontWeight: 700
        }}>
          Back to Directory
        </Link>
      </div>
    );
  }

  const reviewsList = getMockReviews(artisan.name, artisan.trade);

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
        .lightbox-close:hover {
          background: rgba(250, 255, 248, 0.18); transform: scale(1.05);
        }
        @keyframes fadeInLightbox { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomInLightbox { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        
        /* Reviews list */
        .reviews-list { display: flex; flex-direction: column; gap: 20px; }
        .review-card { border-bottom: 1px solid var(--border); padding-bottom: 16px; }
        .review-card:last-child { border-bottom: none; padding-bottom: 0; }
        .review-card-header { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center; }
        .review-author { font-weight: 600; font-size: 0.92rem; color: var(--dark); }
        .review-stars { color: var(--gold); font-size: 0.85rem; }
        .review-date { font-size: 0.78rem; color: var(--muted); }
        .review-comment { font-size: 0.88rem; color: var(--muted); line-height: 1.6; font-weight: 300; }

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
                ⭐ {artisan.rating.toFixed(1)} ({artisan.reviews} reviews)
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
                  <span className="skill-chip" key={skill} style={{ margin: "4px" }}>
                    {skill}
                  </span>
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

            <div className="prof-card-block">
              <h3>Customer Feedbacks & Reviews</h3>
              <div className="reviews-list">
                {reviewsList.map((rev) => (
                  <div className="review-card" key={rev.id}>
                    <div className="review-card-header">
                      <span className="review-author">{rev.author}</span>
                      <span className="review-stars">{"★".repeat(Math.floor(rev.rating))}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                      <span className="review-date">{rev.date}</span>
                      <span style={{ fontSize: "0.78rem", color: "var(--green-bright)", fontWeight: 600 }}>✅ Verified Booking</span>
                    </div>
                    <p className="review-comment">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE STICKY BOOKING CARD */}
          <div className="prof-right-side">
            <div className="prof-sticky-card">
              <div className="side-price-label">Starting Rate</div>
              <div className="side-price-val">{artisan.price}</div>

              <div className="side-detail-row">
                <div className="side-detail-item">
                  <span>📍</span> Location: <strong>{artisan.location}</strong>
                </div>
                <div className="side-detail-item">
                  <span>⏱️</span> Experience: <strong>{artisan.experience}</strong>
                </div>
                <div className="side-detail-item">
                  <span>⚡</span> Availability: <strong>Now / Online</strong>
                </div>
                <div className="side-detail-item">
                  <span>🛡️</span> Guarantee: <strong>100% Quality Assurance</strong>
                </div>
              </div>

              <button className="side-booking-btn" onClick={handleBook}>
                Book {artisan.name.split(" ")[0]} Now →
              </button>
              
              <div className="side-escrow-badge">
                🔒 SettleAm Escrow Secure Protection Enabled
              </div>
            </div>
          </div>

        </div>
      </div>

      <Footer />

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
