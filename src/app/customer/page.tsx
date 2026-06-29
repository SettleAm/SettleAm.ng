"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabase";
import { profileService, ArtisanProfile } from "../../utils/profileService";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Artisan {
  id: string;
  initials: string;
  avatarClass: string;
  name: string;
  trade: string;
  tradeEmoji: string;
  experience: string;
  rating: number;
  reviews: number;
  price: string;
  location: string;
  distance: string;
}

interface PastJob {
  id: string;
  initials: string;
  avatarClass: string;
  artisanName: string;
  trade: string;
  description: string;
  price: string;
  date: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const QUICK_FILTERS = [
  ["⚡", "Electrician"], ["🔧", "Plumber"], ["❄️", "AC Tech"],
  ["🪚", "Carpenter"],  ["🧹", "Cleaner"], ["✂️", "Tailor"],
];

const TRUST_ITEMS = [
  { icon: "✓",  title: "All artisans verified",        desc: "NIN, ID card, face verification, address check" },
  { icon: "🔐", title: "Direct payment to artisan",    desc: "Pay only when you confirm job is completed" },
  { icon: "⭐", title: "Real customer ratings",         desc: "Only customers who booked can review" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CustomerHomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ArtisanProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [search, setSearch]         = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [toast, setToast]           = useState({ visible: false, msg: "" });
  const [realArtisans, setRealArtisans] = useState<any[]>([]);
  const [artisansLoading, setArtisansLoading] = useState(true);

  const showToast = (msg: string) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast({ visible: false, msg: "" }), 2500);
  };

  const doSearch = () => {
    const q = heroSearch || search;
    if (q.trim()) showToast(`🔍 Searching for "${q}" near ${profile?.location || "Abeokuta"}…`);
    else showToast("Please enter what you need help with");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push("/login");
          return;
        }

        const existingProfile = await profileService.ensureProfileForUser(
          user.id,
          user.email || "",
          user.user_metadata,
          "customer"
        );

        if (existingProfile.role === "artisan") {
          router.push("/dashboard");
          return;
        }

        setProfile(existingProfile);
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    async function loadArtisans() {
      try {
        const all = await profileService.getAllCustomArtisans();
        const emojiMap: Record<string, string> = {
          Electrician: "⚡", Plumber: "🔧", Tailor: "✂️",
          "AC Tech": "❄️", Carpenter: "🪚", Cleaner: "🧹",
          "Hair Stylist": "💇", Chef: "👨‍🍳", Painter: "🖌️",
          Driver: "🚗", "Shoe Maker": "👞",
        };
        const artisanProfiles = all
          .filter(p => p.role === "artisan" && p.first_name)
          .map((item, index) => ({
            id: item.id,
            initials: `${item.first_name[0] || ""}${item.last_name[0] || ""}`.toUpperCase() || "A",
            avatarClass: `ca-g${(index % 6) + 1}`,
            name: `${item.first_name} ${item.last_name}`.trim(),
            trade: item.craft || "Artisan",
            tradeEmoji: emojiMap[item.craft] || "🛠️",
            experience: item.experience || "1 yr exp",
            rating: item.rating || 5.0,
            reviews: item.reviews || 0,
            price: item.price || "₦5,000",
            location: item.location || "Nigeria",
            profile_image: item.profile_image || "",
          }));
        setRealArtisans(artisanProfiles);
      } catch (err) {
        console.error("Failed to load artisans:", err);
      } finally {
        setArtisansLoading(false);
      }
    }
    loadArtisans();
  }, []);

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

  const getInitials = () => {
    if (!profile) return "US";
    const f = profile.first_name?.[0] || "";
    const l = profile.last_name?.[0] || "";
    return (f + l).toUpperCase() || "US";
  };

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "User";
  const locationText = profile?.location || "Lagos, Nigeria";

  return (
    <>
      {/* ── STYLES ─────────────────────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Tokens ── */
        .cu-page {
          --cu-green:        #0E6B45;
          --cu-green-mid:    #138A58;
          --cu-green-bright: #1DB069;
          --cu-green-light:  #E4F5EC;
          --cu-green-pale:   #F0FAF4;
          --cu-dark:         #0A1F15;
          --cu-gold:         #F5A623;
          --cu-gold-light:   #FFF4E0;
          --cu-cream:        #FAFFF8;
          --cu-white:        #FFFFFF;
          --cu-border:       #C8E8D4;
          --cu-border2:      #DEF0E6;
          --cu-muted:        #5A7A66;
          --cu-muted2:       #8AAF98;
          --cu-text:         #0A1F15;
          --cu-shadow:       0 2px 16px rgba(14,107,69,0.07);
          --cu-shadow-h:     0 8px 32px rgba(14,107,69,0.13);
          min-height: 100vh;
          background: var(--cu-cream);
          color: var(--cu-text);
        }

        /* ── Banner ── */
        .cu-banner {
          background: linear-gradient(160deg, #071F13 0%, #0E3A24 50%, #0A2819 100%);
          padding: 140px 6vw 44px; position: relative; overflow: hidden;
        }
        .cu-banner::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 75% 20%, rgba(29,176,105,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(245,166,35,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .cu-banner-inner {
          max-width: 1100px; margin: 0 auto; position: relative; z-index: 2;
          display: flex; flex-direction: column; gap: 24px;
        }
        .cu-banner-profile-row {
          display: flex; align-items: center; gap: 28px;
        }
        .cu-banner-avatar {
          width: 88px; height: 88px; border-radius: 22px;
          background: linear-gradient(135deg, #0E6B45, #1DB069);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 1.8rem; color: #fff; position: relative; flex-shrink: 0;
          box-shadow: 0 12px 36px rgba(0,0,0,0.3);
        }
        .cu-banner-verified {
          position: absolute; bottom: -5px; right: -5px;
          width: 24px; height: 24px; background: #1DB069;
          border-radius: 50%; border: 3px solid #0E3A24;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.72rem; color: #fff;
        }
        .cu-banner-breadcrumb { font-size: 0.78rem; color: rgba(250,255,248,0.4); margin-bottom: 8px; }
        .cu-banner-breadcrumb a { color: rgba(250,255,248,0.5); text-decoration: none; }
        .cu-banner-breadcrumb a:hover { color: #1DB069; }
        .cu-banner-name {
          font-family: var(--font-syne), sans-serif; font-weight: 800;
          font-size: 2rem; color: #fff; margin-bottom: 10px; letter-spacing: -0.5px;
        }
        .cu-banner-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
        .cu-banner-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(29,176,105,0.15); color: #1DB069;
          border-radius: 100px; padding: 5px 14px; font-size: 0.8rem; font-weight: 600;
        }
        .cu-banner-meta-txt { font-size: 0.82rem; color: rgba(250,255,248,0.72); font-weight: 500; }

        /* ── Banner search row ── */
        .cu-banner-search-area { display: flex; flex-direction: column; gap: 12px; }
        .cu-search-row { display: flex; gap: 10px; max-width: 600px; }
        .cu-search-input {
          flex: 1; display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.1); backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 11px 18px;
          transition: all 0.2s;
        }
        .cu-search-input:focus-within { background: rgba(255,255,255,0.16); border-color: rgba(255,255,255,0.4); }
        .cu-search-input input {
          border: none; outline: none; background: transparent;
          font-family: inherit; font-size: 0.92rem; color: #fff; flex: 1;
        }
        .cu-search-input input::placeholder { color: rgba(255,255,255,0.38); }
        .cu-search-btn {
          padding: 11px 24px; background: #F5A623; color: #0A1F15;
          border: none; border-radius: 12px;
          font-family: var(--font-syne,'Syne'), sans-serif;
          font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .cu-search-btn:hover { background: #e09520; transform: translateY(-1px); }
        .cu-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .cu-chip {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 13px; background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.14); border-radius: 100px;
          font-size: 0.76rem; color: rgba(255,255,255,0.7);
          cursor: pointer; transition: all 0.18s;
        }
        .cu-chip:hover { background: rgba(255,255,255,0.16); color: #fff; border-color: rgba(255,255,255,0.3); }

        /* ── Wrapper ── */
        .cu-wrap {
          max-width: 1100px;
          margin: -20px auto 0;
          padding: 0 6vw 80px;
          position: relative; z-index: 3;
        }



        /* ── STATS ── */
        .cu-stats {
          display:grid; grid-template-columns:repeat(3,1fr); gap:14px;
          margin-bottom:28px; animation:cuFade 0.45s 0.08s ease both;
        }
        .cu-stat {
          background:var(--cu-white); border:1px solid var(--cu-border2);
          border-radius:14px; padding:18px 20px;
          display:flex; align-items:center; gap:14px;
          box-shadow:var(--cu-shadow); transition:all 0.2s;
        }
        .cu-stat:hover { box-shadow:var(--cu-shadow-h); transform:translateY(-2px); border-color:var(--cu-border); }
        .cu-stat-icon {
          width:44px; height:44px; border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          font-size:1.1rem; flex-shrink:0;
        }
        .cu-stat-icon.g  { background:var(--cu-green-light); }
        .cu-stat-icon.gl { background:var(--cu-gold-light); }
        .cu-stat-val {
          font-family:var(--font-syne,'Syne'),sans-serif;
          font-weight:800; font-size:1.45rem; color:var(--cu-dark);
          letter-spacing:-0.5px; line-height:1;
        }
        .cu-stat-lbl { font-size:0.73rem; color:var(--cu-muted); font-weight:300; margin-top:3px; }

        /* ── TWO-COL ── */
        .cu-grid {
          display:grid; grid-template-columns:1fr 300px; gap:22px;
          animation:cuFade 0.45s 0.14s ease both;
        }
        .cu-main { display:flex; flex-direction:column; gap:22px; }
        .cu-side { display:flex; flex-direction:column; gap:22px; }

        /* ── CARD ── */
        .cu-card {
          background:var(--cu-white); border:1px solid var(--cu-border2);
          border-radius:16px; padding:22px 24px; box-shadow:var(--cu-shadow);
        }
        .cu-card-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .cu-card-title {
          font-family:var(--font-syne,'Syne'),sans-serif;
          font-weight:700; font-size:0.97rem; color:var(--cu-dark);
        }
        .cu-card-link {
          font-size:0.78rem; color:var(--cu-green);
          text-decoration:none; font-weight:600; transition:color 0.2s;
          border:none; background:none; cursor:pointer; font-family:inherit;
        }
        .cu-card-link:hover { color:var(--cu-gold); }

        /* ── PAST JOBS ── */
        .cu-pj {
          display:flex; align-items:center; gap:13px;
          padding:13px 0; border-bottom:1px solid var(--cu-border2);
          cursor:pointer; transition:padding-left 0.15s;
        }
        .cu-pj:last-child { border-bottom:none; }
        .cu-pj:hover { padding-left:5px; }
        .cu-pj-av {
          width:40px; height:40px; border-radius:11px; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          font-size:0.8rem; font-weight:800;
          font-family:var(--font-syne,'Syne'),sans-serif; color:#fff;
        }
        .cpj-1 { background:linear-gradient(135deg,#0E6B45,#1DB069); }
        .cpj-2 { background:linear-gradient(135deg,#7A3B10,#F5A623); }
        .cpj-3 { background:linear-gradient(135deg,#0A5C7A,#1DB0A0); }
        .cu-pj-info { flex:1; min-width:0; }
        .cu-pj-name { font-size:0.85rem; font-weight:500; color:var(--cu-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cu-pj-desc { font-size:0.72rem; color:var(--cu-muted); font-weight:300; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .cu-pj-right { text-align:right; flex-shrink:0; }
        .cu-pj-price { font-family:var(--font-syne,'Syne'),sans-serif; font-weight:700; font-size:0.85rem; color:var(--cu-dark); }
        .cu-pj-date  { font-size:0.7rem; color:var(--cu-muted2); font-weight:300; }
        .cu-rebook {
          font-size:0.7rem; color:var(--cu-green); font-weight:600;
          border:none; background:none; cursor:pointer; padding:0;
          font-family:var(--font-syne,'Syne'),sans-serif; transition:color 0.2s;
        }
        .cu-rebook:hover { color:var(--cu-gold); }

        /* ── ARTISAN GRID ── */
        .cu-artisan-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
        .cu-ac {
          border:1.5px solid var(--cu-border2); border-radius:14px;
          padding:18px 16px; cursor:pointer; transition:all 0.25s;
          position:relative; background:var(--cu-cream); overflow:hidden;
        }
        .cu-ac::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,var(--cu-green-pale) 0%,transparent 60%);
          opacity:0; transition:opacity 0.25s;
        }
        .cu-ac:hover { border-color:var(--cu-green); transform:translateY(-3px); box-shadow:var(--cu-shadow-h); }
        .cu-ac:hover::before { opacity:1; }

        .cu-ac-av {
          width:48px; height:48px; border-radius:14px; position:relative;
          display:flex; align-items:center; justify-content:center;
          font-family:var(--font-syne,'Syne'),sans-serif; font-weight:800;
          font-size:1rem; color:#fff; margin-bottom:12px; z-index:1;
        }
        .ca-g1 { background:linear-gradient(135deg,#0E6B45,#1DB069); }
        .ca-g2 { background:linear-gradient(135deg,#0A5C7A,#1DB0A0); }
        .ca-g3 { background:linear-gradient(135deg,#7A3B10,#F5A623); }
        .ca-g4 { background:linear-gradient(135deg,#5C0A7A,#B01DB0); }
        .ca-g5 { background:linear-gradient(135deg,#1A3B7A,#1D6DB0); }
        .ca-g6 { background:linear-gradient(135deg,#3B7A0A,#89B01D); }

        .cu-vbadge {
          position:absolute; bottom:-4px; right:-4px;
          width:18px; height:18px; background:var(--cu-green);
          border-radius:50%; display:flex; align-items:center; justify-content:center;
          font-size:0.55rem; color:#fff; border:2px solid var(--cu-cream);
        }
        .cu-ac-name {
          font-family:var(--font-syne,'Syne'),sans-serif; font-weight:700;
          font-size:0.88rem; color:var(--cu-dark); margin-bottom:3px; position:relative; z-index:1;
        }
        .cu-ac-trade { font-size:0.74rem; color:var(--cu-muted); font-weight:300; margin-bottom:8px; position:relative; z-index:1; }
        .cu-ac-meta { display:flex; align-items:center; justify-content:space-between; position:relative; z-index:1; }
        .cu-ac-rating { display:flex; align-items:center; gap:4px; font-size:0.75rem; font-weight:600; color:var(--cu-dark); }
        .cu-ac-star { color:var(--cu-gold); }
        .cu-ac-price { font-size:0.72rem; color:var(--cu-green); font-weight:600; font-family:var(--font-syne,'Syne'),sans-serif; }
        .cu-ac-loc { font-size:0.7rem; color:var(--cu-muted2); font-weight:300; margin-top:4px; position:relative; z-index:1; }
        .cu-ac-btn {
          width:100%; margin-top:12px; padding:9px;
          background:var(--cu-green-light); color:var(--cu-green);
          border:1.5px solid var(--cu-border); border-radius:10px;
          font-family:var(--font-syne,'Syne'),sans-serif; font-weight:700;
          font-size:0.78rem; cursor:pointer; transition:all 0.2s; position:relative; z-index:1;
        }
        .cu-ac-btn:hover { background:var(--cu-green); color:#fff; border-color:var(--cu-green); }

        /* ── TRUST ── */
        .cu-trust { display:flex; flex-direction:column; gap:10px; }
        .cu-trust-item {
          display:flex; align-items:center; gap:12px;
          padding:10px 14px; background:var(--cu-green-pale);
          border:1px solid var(--cu-border); border-radius:10px; transition:background 0.2s;
        }
        .cu-trust-item:hover { background:var(--cu-green-light); }
        .cu-trust-icon {
          width:32px; height:32px; background:var(--cu-green-light);
          border-radius:8px; display:flex; align-items:center; justify-content:center;
          font-size:0.9rem; flex-shrink:0;
        }
        .cu-trust-title { font-size:0.8rem; font-weight:600; color:var(--cu-dark); }
        .cu-trust-desc  { font-size:0.7rem; color:var(--cu-muted); font-weight:300; }

        /* ── CTA CARD ── */
        .cu-cta-card {
          background:linear-gradient(135deg,var(--cu-dark),#1A4D30);
          border-radius:14px; padding:22px 20px; color:#fff;
          position:relative; overflow:hidden;
        }
        .cu-cta-card::before {
          content:''; position:absolute; inset:0;
          background:radial-gradient(ellipse 70% 60% at 80% 20%,rgba(29,176,105,0.18) 0%,transparent 70%);
          pointer-events:none;
        }
        .cu-cta-inner { position:relative; z-index:1; }
        .cu-cta-tag { font-size:0.72rem; font-weight:600; color:var(--cu-gold); letter-spacing:0.5px; text-transform:uppercase; margin-bottom:8px; }
        .cu-cta-card h3 {
          font-family:var(--font-syne,'Syne'),sans-serif; font-weight:800;
          font-size:1.05rem; margin-bottom:8px; line-height:1.2;
        }
        .cu-cta-card p { font-size:0.78rem; color:rgba(255,255,255,0.55); font-weight:300; line-height:1.5; margin-bottom:16px; }
        .cu-cta-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:10px 20px; background:var(--cu-gold); color:var(--cu-dark);
          border-radius:100px; font-family:var(--font-syne,'Syne'),sans-serif;
          font-weight:700; font-size:0.82rem; text-decoration:none; transition:all 0.2s;
          border:none; cursor:pointer;
        }
        .cu-cta-btn:hover { background:#e09520; transform:translateY(-1px); }

        /* ── TOAST ── */
        .cu-toast {
          position:fixed; bottom:28px; left:50%;
          transform:translateX(-50%) translateY(20px);
          background:var(--cu-dark); color:#fff;
          padding:12px 26px; border-radius:100px;
          font-family:var(--font-syne,'Syne'),sans-serif; font-weight:600;
          font-size:0.85rem; box-shadow:0 8px 28px rgba(10,31,21,0.25);
          opacity:0; transition:all 0.3s; pointer-events:none;
          white-space:nowrap; z-index:500;
        }
        .cu-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }

        /* ── ANIMATIONS ── */
        @keyframes cuFade {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── RESPONSIVE ── */
        @media (max-width:900px) {
          .cu-banner { padding-top: 110px; }
          .cu-banner-profile-row { flex-direction: column; text-align: center; gap: 16px; }
          .cu-banner-meta { justify-content: center; }
          .cu-banner-search-area { align-items: center; }
          .cu-search-row { max-width: 100%; }
          .cu-chips { justify-content: center; }
          .cu-artisan-grid { grid-template-columns: repeat(2,1fr); }
          .cu-grid { grid-template-columns: 1fr; }
          .cu-side { flex-direction: row; flex-wrap: wrap; }
          .cu-side > * { flex: 1; min-width: 260px; }
          .cu-wrap { padding: 0 4vw 60px; }
        }
        @media (max-width:600px) {
          .cu-banner { padding-top: 96px; padding-bottom: 32px; }
          .cu-stats { grid-template-columns: 1fr 1fr; }
          .cu-artisan-grid { grid-template-columns: 1fr 1fr; }
          .cu-search-row { flex-direction: column; }
          .cu-side { flex-direction: column; }
        }
        @media (max-width:480px) {
          .cu-stats { grid-template-columns: 1fr; }
          .cu-artisan-grid { grid-template-columns: 1fr; }
        }
      `}} />

      {/* ── SHARED HEADER ──────────────────────────────────────────────────── */}
      <Header
        variant="simple"
        theme="dark"
        onLogout={handleLogout}
      />

      {/* ── BANNER ─────────────────────────────────────────────────────────── */}
      <div className="cu-banner">
        <div className="cu-banner-inner">

          {/* Profile row */}
          <div className="cu-banner-profile-row">
            <div className="cu-banner-avatar">
              {getInitials()}
              <div className="cu-banner-verified">✓</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cu-banner-breadcrumb">
                <Link href="/">Home</Link> › <span>My Dashboard</span>
              </div>
              <h1 className="cu-banner-name">{fullName}</h1>
              <div className="cu-banner-meta">
                <span className="cu-banner-tag">📍 {locationText}</span>
                <span className="cu-banner-meta-txt">📋 Customer Account</span>
              </div>
            </div>
          </div>

          {/* Search + chips row */}
          <div className="cu-banner-search-area">
            <div className="cu-search-row">
              <div className="cu-search-input">
                <span style={{ fontSize:"1rem", opacity:0.45 }} aria-hidden="true">🔍</span>
                <input
                  type="text"
                  placeholder="What do you need? e.g. 'Fix my AC', 'Tailor a suit'…"
                  value={heroSearch}
                  onChange={e => setHeroSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()}
                  aria-label="Search for an artisan"
                />
              </div>
              <button className="cu-search-btn" onClick={doSearch}>Find Artisan</button>
            </div>
            <div className="cu-chips" role="list" aria-label="Quick service filters">
              {QUICK_FILTERS.map(([icon, label]) => (
                <button
                  key={label}
                  className="cu-chip"
                  role="listitem"
                  onClick={() => showToast(`📍 Showing ${label}s near Abeokuta…`)}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── PAGE ───────────────────────────────────────────────────────────── */}
      <div className="cu-page">
        <div className="cu-wrap">



          {/* STATS */}
          <div className="cu-stats" role="region" aria-label="Your activity">
            <div className="cu-stat">
              <div className="cu-stat-icon g" aria-hidden="true">📋</div>
              <div>
                <div className="cu-stat-val">0</div>
                <div className="cu-stat-lbl">Total bookings made</div>
              </div>
            </div>
            <div className="cu-stat">
              <div className="cu-stat-icon gl" aria-hidden="true">₦</div>
              <div>
                <div className="cu-stat-val">₦0</div>
                <div className="cu-stat-lbl">Total spent on SettleAm</div>
              </div>
            </div>
            <div className="cu-stat">
              <div className="cu-stat-icon g" aria-hidden="true">⭐</div>
              <div>
                <div className="cu-stat-val">0</div>
                <div className="cu-stat-lbl">Favourite artisans saved</div>
              </div>
            </div>
          </div>

          {/* TWO-COL */}
          <div className="cu-grid">

            {/* MAIN COL */}
            <div className="cu-main">

              {/* PAST JOBS — first */}
              <section className="cu-card" aria-label="Past jobs">
                <div className="cu-card-head">
                  <h2 className="cu-card-title">🕐 Past Jobs</h2>
                </div>
                <div style={{ textAlign: "center", padding: "32px 0", color: "var(--cu-muted)" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📋</div>
                  <p style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--cu-dark)", marginBottom: "6px" }}>No jobs yet</p>
                  <p style={{ fontSize: "0.82rem", fontWeight: 300 }}>Book your first artisan to see your job history here.</p>
                </div>
              </section>

              {/* NEARBY ARTISANS — real data from DB */}
              <section className="cu-card" aria-label="Verified artisans near you">
                <div className="cu-card-head">
                  <h2 className="cu-card-title">📍 Verified Artisans Near You</h2>
                  <Link href="/artisans" className="cu-card-link">See all →</Link>
                </div>

                {artisansLoading ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "var(--cu-muted)" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>⏳</div>
                    <p style={{ fontSize: "0.85rem" }}>Loading artisans…</p>
                  </div>
                ) : realArtisans.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: "var(--cu-muted)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🛠️</div>
                    <p style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--cu-dark)", marginBottom: "6px" }}>No artisans registered yet</p>
                    <p style={{ fontSize: "0.82rem", fontWeight: 300 }}>Check back soon — artisans are joining SettleAm every day.</p>
                  </div>
                ) : (
                  <div className="cu-artisan-grid">
                    {realArtisans.slice(0, 6).map((a, index) => (
                      <article
                        className="cu-ac"
                        key={a.id}
                        onClick={() => showToast(`📅 Opening booking form for ${a.name.split(" ")[0]}…`)}
                      >
                        <div className={`cu-ac-av ${a.avatarClass}`}>
                          {a.profile_image ? (
                            <img src={a.profile_image} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                          ) : (
                            a.initials
                          )}
                          <div className="cu-vbadge" aria-label="Verified">✓</div>
                        </div>
                        <div className="cu-ac-name">{a.name}</div>
                        <div className="cu-ac-trade">{a.tradeEmoji} {a.trade} · {a.experience}</div>
                        <div className="cu-ac-meta">
                          <div className="cu-ac-rating">
                            <span className="cu-ac-star" aria-hidden="true">★</span>
                            {a.rating.toFixed(1)}
                            <span style={{ color:"var(--cu-muted)", fontWeight:300 }}>({a.reviews})</span>
                          </div>
                          <div className="cu-ac-price">{a.price}</div>
                        </div>
                        <div className="cu-ac-loc">📍 {a.location}</div>
                        <button
                          className="cu-ac-btn"
                          onClick={e => { e.stopPropagation(); showToast(`📅 Opening booking form for ${a.name.split(" ")[0]}…`); }}
                        >
                          Book Now
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>

            </div>

            {/* SIDE COL */}
            <div className="cu-side">

              {/* TRUST & SAFETY */}
              <section className="cu-card" aria-label="Why SettleAm is safe">
                <div className="cu-card-head">
                  <h2 className="cu-card-title">🛡️ Why SettleAm is Safe</h2>
                </div>
                <div className="cu-trust">
                  {TRUST_ITEMS.map(item => (
                    <div className="cu-trust-item" key={item.title}>
                      <div className="cu-trust-icon" aria-hidden="true">{item.icon}</div>
                      <div>
                        <div className="cu-trust-title">{item.title}</div>
                        <div className="cu-trust-desc">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* BOOK CTA */}
              <div className="cu-cta-card">
                <div className="cu-cta-inner">
                  <div className="cu-cta-tag">NEED HELP NOW?</div>
                  <h3>Book a vetted artisan in under 2 minutes</h3>
                  <p>Direct payment. Pay the artisan only when you're satisfied with the work.</p>
                  <Link href="/artisans" className="cu-cta-btn">Browse Artisans →</Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* TOAST */}
      <div className={`cu-toast${toast.visible ? " show" : ""}`} role="status" aria-live="polite">
        {toast.msg}
      </div>
    </>
  );
}
