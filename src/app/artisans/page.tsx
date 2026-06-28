"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import { profileService } from "../../utils/profileService";

// ─── Data ────────────────────────────────────────────────────────────────────

export const ARTISANS: any[] = [];

const TABS = [
  { label: "All Artisans", value: "All", count: 247 },
  { label: "Electricians", value: "Electrician", emoji: "⚡", count: 24 },
  { label: "Plumbers", value: "Plumber", emoji: "🔧", count: 18 },
  { label: "Tailors", value: "Tailor", emoji: "✂️", count: 31 },
  { label: "Carpenters", value: "Carpenter", emoji: "🪚", count: 9 },
  { label: "AC Technicians", value: "AC Tech", emoji: "❄️", count: 12 },
  { label: "Cleaners", value: "Cleaner", emoji: "🧹", count: 15 },
  { label: "Chefs", value: "Chef", emoji: "👨‍🍳", count: 7 },
  { label: "Painters", value: "Painter", emoji: "🖌️", count: 11 },
  { label: "Drivers", value: "Driver", emoji: "🚗", count: 22 },
  { label: "Shoe Makers", value: "Shoe Maker", emoji: "👞", count: 14 },
];

function renderStars(rating: number) {
  const full = Math.floor(rating);
  return "★".repeat(full) + (rating % 1 >= 0.5 ? "★" : "");
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function useToast() {
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: "", visible: false });
  let timer: ReturnType<typeof setTimeout>;

  const show = (msg: string) => {
    clearTimeout(timer);
    setToast({ msg, visible: true });
    timer = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2500);
  };

  return { toast, show };
}

// ─── Artisan Card ─────────────────────────────────────────────────────────────

function ArtisanCard({
  artisan,
  listView,
  onToast,
  onBook,
  onSelect,
}: {
  artisan: any;
  listView: boolean;
  onToast: (msg: string) => void;
  onBook: (artisan: any) => void;
  onSelect: (artisan: any) => void;
}) {
  const [faved, setFaved] = useState(artisan.featured);

  return (
    <div
      className={`artisan-card${artisan.featured ? " featured" : ""}${listView ? " list-view-card" : ""}`}
      onClick={() => onSelect(artisan)}
    >
      {artisan.featured && <div className="featured-badge">⭐ Top Rated</div>}
      <div className={`card-band ${artisan.bandClass}`} />
      <div className="card-body">
        <div className="card-top">
          <div className={`card-avatar ${artisan.avatarClass}`}>
            <div style={{ width: "100%", height: "100%", borderRadius: "inherit", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {artisan.profile_image
                ? <img src={artisan.profile_image} alt={artisan.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : artisan.initials
              }
            </div>
            <div className="verified-mark">✓</div>
          </div>
          <div className="card-actions-top">
            <button
              className={`fav-btn${faved ? " faved" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setFaved(!faved);
                onToast(faved ? "Removed from favourites" : "❤️ Added to favourites");
              }}
            >
              {faved ? "❤️" : "🤍"}
            </button>
            <div className={`avail-dot${artisan.available ? "" : " busy"}`}>
              {artisan.available ? "Now" : "Busy"}
            </div>
          </div>
        </div>

        <div className="card-name">{artisan.name}</div>
        <div className="card-trade">
          <span className="trade-tag">
            {artisan.tradeEmoji} {artisan.trade}
          </span>{" "}
          · {artisan.experience}
        </div>
        <div className="card-rating-row">
          <span className="stars">{renderStars(artisan.rating)}</span>
          <span className="rating-val">{artisan.rating.toFixed(1)}</span>
          <span className="rating-count">({artisan.reviews} reviews)</span>
        </div>
        <div className="skills-row">
          {artisan.skills.map((s: string) => (
            <span key={s} className="skill-chip">
              {s}
            </span>
          ))}
        </div>
        <div className="card-divider" />
        <div className="card-footer">
          <div className="card-location">📍 {artisan.location} · {artisan.distance}</div>
          <div className="card-price-block">
            <div className="card-price-label">Starting from</div>
            <div className="card-price">{artisan.price}</div>
          </div>
        </div>
        <button
          className="card-book-btn"
          onClick={(e) => {
            e.stopPropagation();
            onBook(artisan);
          }}
        >
          Book Now →
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── Filter Controls Subcomponent ──────────────────────────────────────────
function FilterControls({
  locationSearch,
  setLocationSearch,
  isLocationSearchValid,
  maxPrice,
  setMaxPrice,
  selectedAvailability,
  setSelectedAvailability,
  selectedExperience,
  setSelectedExperience,
  onClearAll,
  allArtisans = [],
}: {
  locationSearch: string;
  setLocationSearch: (val: string) => void;
  isLocationSearchValid: boolean;
  maxPrice: number;
  setMaxPrice: (val: number) => void;
  selectedAvailability: string[];
  setSelectedAvailability: (val: string[]) => void;
  selectedExperience: string[];
  setSelectedExperience: (val: string[]) => void;
  onClearAll: () => void;
  allArtisans?: any[];
}) {
  const toggleAvailability = (val: string) => {
    if (selectedAvailability.includes(val)) {
      setSelectedAvailability(selectedAvailability.filter(v => v !== val));
    } else {
      setSelectedAvailability([...selectedAvailability, val]);
    }
  };

  const toggleExperience = (val: string) => {
    if (selectedExperience.includes(val)) {
      setSelectedExperience(selectedExperience.filter(v => v !== val));
    } else {
      setSelectedExperience([...selectedExperience, val]);
    }
  };

  const getAvailabilityCount = (label: string) => {
    // Only "Available now" matches 'available: true'. Others are simplified to show the same or similar.
    return allArtisans.filter(a => a.available).length;
  };

  const getExperienceCount = (label: string) => {
    return allArtisans.filter(a => {
      const yrs = parseInt(a.experience.replace(/[^\d]/g, ""), 10) || 0;
      if (label === "1–3 years") return yrs >= 1 && yrs <= 3;
      if (label === "3–6 years") return yrs >= 3 && yrs <= 6;
      if (label === "6+ years") return yrs >= 6;
      return true;
    }).length;
  };

  return (
    <>
      <div className="filter-head">
        <h3>⚙️ Filters</h3>
        <button className="clear-btn" type="button" onClick={onClearAll}>
          Clear all
        </button>
      </div>

      <div className="filter-section">
        <div className="filter-label">📍 Location</div>
        <div className="location-input">
          <span>📍</span>
          <input
            type="text"
            placeholder="e.g. Abeokuta, Sagamu…"
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
          />
        </div>
        {locationSearch && !isLocationSearchValid && (
          <div className="location-status-error">
            ⚠️ Not active in this area yet
          </div>
        )}
      </div>

      <div className="filter-section">
        <div className="filter-label">💰 Price Range</div>
        <div className="price-range-wrap">
          <div className="price-labels">
            <span>From <strong>₦2,000</strong></span>
            <span>Up to <strong>₦{maxPrice.toLocaleString()}</strong></span>
          </div>
          <input
            type="range"
            min={2000}
            max={150000}
            step={1000}
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-label">🕐 Availability</div>
        <div className="checkbox-list">
          {[
            { label: "Available now" },
            { label: "Available today" },
            { label: "Emergency / same day" },
          ].map((item) => (
            <label key={item.label} className="checkbox-item">
              <input
                type="checkbox"
                checked={selectedAvailability.includes(item.label)}
                onChange={() => toggleAvailability(item.label)}
              />
              <div className="custom-cb" />
              {item.label}
              <span className="cb-count">{getAvailabilityCount(item.label)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-label">📏 Experience</div>
        <div className="checkbox-list">
          {[
            { label: "1–3 years" },
            { label: "3–6 years" },
            { label: "6+ years" },
          ].map((item) => (
            <label key={item.label} className="checkbox-item">
              <input
                type="checkbox"
                checked={selectedExperience.includes(item.label)}
                onChange={() => toggleExperience(item.label)}
              />
              <div className="custom-cb" />
              {item.label}
              <span className="cb-count">{getExperienceCount(item.label)}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ArtisansPage() {
  const router = useRouter();
  const [customArtisans, setCustomArtisans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [listView, setListView] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [zoomedIndex, setZoomedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (zoomedIndex === null) return;
    const portfolioLength = selectedProfile?.portfolio?.length || 0;
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
  }, [zoomedIndex, selectedProfile?.portfolio]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (zoomedIndex === null) return;
    const portfolioLength = selectedProfile?.portfolio?.length || 0;
    setZoomedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : portfolioLength - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (zoomedIndex === null) return;
    const portfolioLength = selectedProfile?.portfolio?.length || 0;
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

  // Advanced dynamic filter states
  const [maxPrice, setMaxPrice] = useState(150000);
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const { toast, show: showToast } = useToast();

  useEffect(() => {
    async function loadCustomArtisans() {
      try {
        const list = await profileService.getAllCustomArtisans();
        const formattedList = list.map((item, index) => {
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
          const tradeEmoji = emojiMap[item.craft] || "🛠️";
          
          return {
            id: `custom-${item.id}`,
            initials: `${item.first_name[0] || ""}${item.last_name[0] || ""}`.toUpperCase() || "A",
            name: `${item.first_name} ${item.last_name}`,
            trade: item.craft,
            tradeEmoji: tradeEmoji,
            experience: item.experience || "1 yr exp",
            rating: item.rating || 5.0,
            reviews: item.reviews || 0,
            skills: item.services && item.services.length > 0 ? item.services : [item.craft],
            location: item.location,
            distance: "Nearby",
            price: item.price || "₦5,000",
            available: true,
            featured: false,
            avatarClass: `a${(index % 9) + 1}`,
            bandClass: `b${(index % 9) + 1}`,
            description: item.description,
            profile_image: item.profile_image || "",
            portfolio: item.portfolio || []
          };
        });
        setCustomArtisans(formattedList);
      } catch (err) {
        console.error("Failed to load custom artisans:", err);
      }
    }
    loadCustomArtisans();
  }, []);

  const handleBookArtisan = (artisan: any) => {
    const params = new URLSearchParams({
      name: artisan.name,
      trade: artisan.trade,
    });
    router.push(`/book?${params.toString()}`);
  };

  const knownLocations = ["abeokuta", "sagamu", "ijebu-ode"];
  const allArtisans = [...customArtisans, ...ARTISANS];

  const dynamicKnownLocations = Array.from(new Set([
    ...knownLocations,
    ...allArtisans.map(a => a.location.toLowerCase().trim())
  ]));

  const isLocationSearchValid = !locationSearch || dynamicKnownLocations.some(loc => 
    loc.includes(locationSearch.toLowerCase()) || locationSearch.toLowerCase().includes(loc)
  );

  const handleClearAll = () => {
    setLocationSearch("");
    setMaxPrice(150000);
    setSelectedAvailability([]);
    setSelectedExperience([]);
    showToast("All filters cleared");
  };

  // Active filter count
  const activeFiltersCount = 
    (locationSearch ? 1 : 0) + 
    (maxPrice < 150000 ? 1 : 0) + 
    selectedAvailability.length + 
    selectedExperience.length;

  // Dynamic pills generator
  const activePills = [
    ...(locationSearch && isLocationSearchValid ? [{ type: "location", label: `📍 ${locationSearch}` }] : []),
    ...(maxPrice < 150000 ? [{ type: "price", label: `💰 Under ₦${maxPrice.toLocaleString()}` }] : []),
    ...selectedAvailability.map(av => ({ type: "availability", val: av, label: `🕐 ${av}` })),
    ...selectedExperience.map(exp => ({ type: "experience", val: exp, label: `📏 ${exp}` }))
  ];

  const removePill = (pill: any) => {
    if (pill.type === "location") setLocationSearch("");
    if (pill.type === "price") setMaxPrice(150000);
    if (pill.type === "availability") setSelectedAvailability(selectedAvailability.filter(av => av !== pill.val));
    if (pill.type === "experience") setSelectedExperience(selectedExperience.filter(exp => exp !== pill.val));
  };

  const filtered = allArtisans.filter((a) => {
    const matchesTab = activeTab === "All" || a.trade === activeTab;
    const matchesSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.trade.toLowerCase().includes(search.toLowerCase()) ||
      a.skills.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesLocation =
      !locationSearch ||
      a.location.toLowerCase().includes(locationSearch.toLowerCase());

    const priceVal = parseInt(a.price.replace(/[^\d]/g, ""), 10) || 0;
    const matchesPrice = priceVal <= maxPrice;

    const matchesAvailability =
      selectedAvailability.length === 0 ||
      (selectedAvailability.includes("Available now") && a.available) ||
      !selectedAvailability.includes("Available now");

    const matchesExperience =
      selectedExperience.length === 0 ||
      selectedExperience.some((expRange) => {
        const expYears = parseInt(a.experience.replace(/[^\d]/g, ""), 10) || 0;
        if (expRange === "1–3 years") return expYears >= 1 && expYears <= 3;
        if (expRange === "3–6 years") return expYears >= 3 && expYears <= 6;
        if (expRange === "6+ years") return expYears >= 6;
        return true;
      });

    return matchesTab && matchesSearch && matchesLocation && matchesPrice && matchesAvailability && matchesExperience;
  });

  return (
    <>
      {/* ── NAV ── */}
      <Header
        variant="app"
        theme="light"
        darkAtTop
        search={search}
        onSearchChange={setSearch}
      />

      {/* ── PAGE HEADER ── */}
      <div className="page-header-dark">
        <div className="header-inner">
          <div className="header-breadcrumb">
            <Link href="/">Home</Link> › <span>Browse Artisans</span>
          </div>
          <h1 className="header-title">
            Find a <em>trusted</em>
            <br />
            artisan near you
          </h1>
          <p className="header-sub">
            Every artisan on SettleAm is verified, rated, and ready to work. Browse by trade,
            location, and price — then book in minutes.
          </p>

          {/* Prominent mobile search bar */}
          <div className="mobile-search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search artisans, trades, services…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* TABS */}
          <div className="filter-tabs-row">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                className={`filter-tab${activeTab === tab.value ? " active" : ""}`}
                onClick={() => {
                  setActiveTab(tab.value);
                  if (tab.value !== "All") showToast(`Showing ${tab.label} near Ogun State`);
                }}
              >
                {tab.emoji ? `${tab.emoji} ` : ""}
                {tab.label}{" "}
                <span className="tab-count">
                  {tab.value === "All"
                    ? allArtisans.length
                    : allArtisans.filter(a => a.trade === tab.value).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="artisans-layout">

        {/* SIDEBAR - DESKTOP ONLY */}
        <aside className="filter-sidebar desktop-only-filters">
          <FilterControls
            locationSearch={locationSearch}
            setLocationSearch={setLocationSearch}
            isLocationSearchValid={isLocationSearchValid}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            selectedAvailability={selectedAvailability}
            setSelectedAvailability={setSelectedAvailability}
            selectedExperience={selectedExperience}
            setSelectedExperience={setSelectedExperience}
            onClearAll={handleClearAll}
            allArtisans={allArtisans}
          />
        </aside>

        {/* RESULTS */}
        <div className="results-area">

          {/* TOOLBAR */}
          <div className="results-toolbar">
            <div className="results-count">
              {isLocationSearchValid ? (
                <>
                  <strong>{filtered.length}</strong> artisans found in{" "}
                  <strong>{locationSearch ? locationSearch : "Ogun State"}</strong>
                </>
              ) : (
                <span style={{ color: "#ff5252", fontWeight: "600" }}>
                  📍 {locationSearch} — Location not available
                </span>
              )}
            </div>
            
            <div className="toolbar-right">
              {/* Compact mobile filter button */}
              <button
                className="mobile-filter-trigger"
                onClick={() => setIsMobileFilterOpen(true)}
                type="button"
              >
                ⚙️ Filters ({activeFiltersCount})
              </button>

              <select className="sort-select" onChange={(e) => showToast("Sorted by: " + e.target.value)}>
                <option>Sort: Top Rated</option>
                <option>Sort: Nearest First</option>
                <option>Sort: Price Low–High</option>
                <option>Sort: Price High–Low</option>
                <option>Sort: Most Reviews</option>
                <option>Sort: Newest</option>
              </select>
              <div className="view-toggle">
                <button
                  className={`view-btn${!listView ? " active" : ""}`}
                  onClick={() => setListView(false)}
                  title="Grid view"
                >
                  ⊞
                </button>
                <button
                  className={`view-btn${listView ? " active" : ""}`}
                  onClick={() => setListView(true)}
                  title="List view"
                >
                  ☰
                </button>
              </div>
            </div>
          </div>

          {/* FILTER PILLS */}
          {activePills.length > 0 && (
            <div className="active-filters">
              {activePills.map((pill, idx) => (
                <div
                  key={idx}
                  className="filter-pill"
                  onClick={() => removePill(pill)}
                >
                  {pill.label} <span className="remove">✕</span>
                </div>
              ))}
            </div>
          )}

          {/* CARDS */}
          {filtered.length > 0 ? (
            <div className={`cards-grid${listView ? " list-view" : ""}`}>
              {filtered.map((artisan) => (
                <ArtisanCard
                  key={artisan.id}
                  artisan={artisan}
                  listView={listView}
                  onToast={showToast}
                  onBook={handleBookArtisan}
                  onSelect={(artisan) => router.push("/artisans/" + artisan.id)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📍</div>
              <div className="empty-title">
                {!isLocationSearchValid ? "Location not available" : "No artisans found"}
              </div>
              <div className="empty-sub">
                {!isLocationSearchValid ? (
                  <>
                    SettleAm is currently active in Ogun State (including <strong>Abeokuta</strong>, <strong>Sagamu</strong>, and <strong>Ijebu-Ode</strong>). We are expanding to <strong>{locationSearch}</strong> soon!
                  </>
                ) : (
                  "Try adjusting your filters or search for a different trade or location."
                )}
              </div>
            </div>
          )}

          {/* LOAD MORE */}
          {filtered.length > 12 && (
            <div className="load-more-wrap">
              <button className="load-more-btn" onClick={() => showToast("All artisans loaded")}>
                All artisans loaded
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TOAST */}
      <div className={`artisans-toast${toast.visible ? " visible" : ""}`}>{toast.msg}</div>

      {/* ARTISAN PROFILE DETAIL MODAL */}
      {selectedProfile && (
        <div className="artisan-modal-overlay" onClick={() => setSelectedProfile(null)}>
          <div className="artisan-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="artisan-modal-close" onClick={() => setSelectedProfile(null)}>✕</button>
            
            <div className="artisan-modal-header">
              <div className={`artisan-modal-avatar ${selectedProfile.avatarClass}`}>
                <div style={{ width: "100%", height: "100%", borderRadius: "inherit", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selectedProfile.profile_image
                    ? <img src={selectedProfile.profile_image} alt={selectedProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : selectedProfile.initials
                  }
                </div>
                <div className="verified-mark">✓</div>
              </div>
              <div className="artisan-modal-title-wrap">
                <h2 className="artisan-modal-name">{selectedProfile.name}</h2>
                <div className="artisan-modal-meta">
                  <span className="trade-tag">{selectedProfile.tradeEmoji} {selectedProfile.trade}</span>
                  <span className="exp-tag">⭐ {selectedProfile.rating.toFixed(1)} ({selectedProfile.reviews} reviews)</span>
                  <span className="exp-tag">⏱️ {selectedProfile.experience}</span>
                </div>
              </div>
            </div>

            <div className="artisan-modal-body">
              <div className="artisan-modal-left">
                <h3>About Me</h3>
                <p className="artisan-modal-desc">
                  {selectedProfile.description || `${selectedProfile.name} is a highly skilled and verified ${selectedProfile.trade} on SettleAm offering premium services to clients in Ogun State. Equipped with extensive tools and professional experience, committed to delivering high-quality, speed, and safety on all jobs.`}
                </p>
                
                <h3 style={{ marginTop: "24px" }}>Services Offered</h3>
                <div className="artisan-modal-services">
                  {selectedProfile.skills.map((skill: string) => (
                    <span key={skill} className="skill-chip">{skill}</span>
                  ))}
                </div>

                {selectedProfile.portfolio && selectedProfile.portfolio.length > 0 && (
                  <>
                    <h3 style={{ marginTop: "24px" }}>Portfolio Showcase</h3>
                    <div className="artisan-modal-portfolio">
                      {selectedProfile.portfolio.map((img: string, idx: number) => (
                        <div className="portfolio-showcase-item" key={idx} onClick={() => setZoomedIndex(idx)} style={{ cursor: "pointer" }}>
                          <img src={img} alt={`Work showcase ${idx + 1}`} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="artisan-modal-right">
                <div className="booking-card">
                  <div className="booking-card-price-label">Starting Rate</div>
                  <div className="booking-card-price">{selectedProfile.price}</div>
                  
                  <div className="booking-card-info">
                    <div>📍 Location: <strong>{selectedProfile.location}</strong></div>
                    <div>⚡ Response: <strong>Under 30 mins</strong></div>
                  </div>

                  <button
                    className="booking-card-btn"
                    onClick={() => {
                      handleBookArtisan(selectedProfile);
                      setSelectedProfile(null);
                    }}
                  >
                    Book {selectedProfile.name} Now →
                  </button>
                  <p className="booking-card-hint">🔒 Pay artisan directly after job completion</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FILTERS BOTTOM SHEET / MODAL */}
      {isMobileFilterOpen && (
        <div className="mobile-filter-overlay" onClick={() => setIsMobileFilterOpen(false)}>
          <div className="mobile-filter-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-filter-header">
              <h3>Filter Artisans</h3>
              <button className="mobile-filter-close" onClick={() => setIsMobileFilterOpen(false)} type="button">✕</button>
            </div>
            
            <div className="mobile-filter-scroll-content">
              <FilterControls
                locationSearch={locationSearch}
                setLocationSearch={setLocationSearch}
                isLocationSearchValid={isLocationSearchValid}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                selectedAvailability={selectedAvailability}
                setSelectedAvailability={setSelectedAvailability}
                selectedExperience={selectedExperience}
                setSelectedExperience={setSelectedExperience}
                onClearAll={handleClearAll}
                allArtisans={allArtisans}
              />
            </div>
            
            <div className="mobile-filter-footer">
              <button className="mobile-filter-apply-btn" onClick={() => setIsMobileFilterOpen(false)} type="button">
                Apply Filters ({filtered.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <Footer />

      {/* Lightbox Overlay */}
      {zoomedIndex !== null && selectedProfile?.portfolio && selectedProfile.portfolio[zoomedIndex] && (
        <div
          className="lightbox-overlay"
          onClick={() => setZoomedIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button className="lightbox-close" onClick={() => setZoomedIndex(null)} aria-label="Close viewer">✕</button>
          
          {selectedProfile.portfolio.length > 1 && (
            <>
              <button className="lightbox-nav lightbox-nav--prev" onClick={handlePrev} aria-label="Previous image">‹</button>
              <button className="lightbox-nav lightbox-nav--next" onClick={handleNext} aria-label="Next image">›</button>
            </>
          )}

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={selectedProfile.portfolio[zoomedIndex]} alt="Zoomed portfolio showcase" />
            {selectedProfile.portfolio.length > 1 && (
              <div className="lightbox-indicator">
                {zoomedIndex + 1} / {selectedProfile.portfolio.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
