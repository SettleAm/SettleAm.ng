"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../utils/authContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HeaderVariant = "landing" | "app" | "simple";
export type HeaderTheme   = "light" | "dark";

interface HeaderProps {
  /** Layout / content variant */
  variant?: HeaderVariant;
  /** Colour theme — light = cream/white bg, dark = deep-green bg */
  theme?: HeaderTheme;
  /** When true the header sticks to the top instead of being fixed */
  sticky?: boolean;
  /** Current search value (only used in "app" variant) */
  search?: string;
  /** Called whenever the search input changes */
  onSearchChange?: (val: string) => void;
  /** Renders a Log Out button and calls this handler when clicked */
  onLogout?: () => void;
  /** Back-link label shown in "simple" variant (defaults to "← Back to Directory") */
  backLabel?: string;
  /** Back-link href shown in "simple" variant (defaults to "/artisans") */
  backHref?: string;
  /** Extra right-side content (rendered after default actions) */
  rightSlot?: React.ReactNode;
  /** Whether the background under the header is dark at the very top (before scroll) */
  darkAtTop?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Header({
  variant  = "simple",
  theme    = "light",
  sticky   = false,
  search,
  onSearchChange,
  onLogout,
  backLabel = "← Back to Directory",
  backHref  = "/artisans",
  rightSlot,
  darkAtTop = false,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, loading } = useAuth();

  const isAuthed = !loading && !!user;
  const isDark   = theme === "dark";
  const isLanding = variant === "landing";
  const isApp     = variant === "app";
  const isSimple  = variant === "simple";

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    // Set initial state in case page loads mid-scroll
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Lock body scroll when mobile overlay is open ──────────────────────────
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);


  // ── Dynamic CSS class list ────────────────────────────────────────────────
  const headerClass = [
    "app-header",
    `app-header--${theme}`,
    sticky ? "app-header--sticky" : "app-header--fixed",
    scrolled ? "app-header--scrolled" : "",
  ].join(" ").trim();

  // ── Determine Logo Source ────────────────────────────────────────────────
  const useDarkLogo = isDark || (darkAtTop && !scrolled);
  const logoSrc = useDarkLogo
    ? "/SettleAm logo/SettleAm_logo_dark.svg"
    : "/SettleAm logo/SettleAm_logo_light.svg";

  // ── Logo ─────────────────────────────────────────────────────────────────
  const logo = (
    <Link href="/" className="app-header__logo" aria-label="SettleAm Home">
      <img
        src={logoSrc}
        alt="SettleAm"
        className="app-header__logo-img"
      />
    </Link>
  );

  // ── Search bar (app variant) ──────────────────────────────────────────────
  const searchBar = isApp && (
    <div className="app-header__search">
      <span className="app-header__search-icon" aria-hidden>🔍</span>
      <input
        type="text"
        placeholder="Search artisans, trades, services…"
        value={search ?? ""}
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="app-header__search-input"
        aria-label="Search artisans"
      />
    </div>
  );

  // ── Resolve dashboard href by role ────────────────────────────────────────
  const dashHref = profile?.role === "artisan" ? "/dashboard" : "/customer";

  // ── Landing nav links (desktop) ───────────────────────────────────────────
  const landingLinks = isLanding && (
    <ul className="app-header__menu" role="list">
      <li><Link href="/artisans"   className="app-header__link">Services</Link></li>
      <li><Link href="#how"        className="app-header__link">How it Works</Link></li>
      <li><Link href="#verify"     className="app-header__link">Trust &amp; Safety</Link></li>
      {!loading && (
        isAuthed ? (
          <li>
            <Link href={dashHref} className="app-header__link app-header__link--login">
              My Dashboard
            </Link>
          </li>
        ) : (
          <li><Link href="/login" className="app-header__link app-header__link--login">Login</Link></li>
        )
      )}
      <li><Link href="#booking" className="app-header__link app-header__link--cta">Book Now</Link></li>
    </ul>
  );

  // ── Mobile full-screen overlay (landing only) ─────────────────────────────
  const mobileOverlay = isLanding && mobileMenuOpen && (
    <div className="app-header__mobile-overlay" role="dialog" aria-modal="true" aria-label="Navigation menu">
      {/* Overlay top bar */}
      <div className="app-header__mobile-topbar">
        <Link href="/" className="app-header__logo" aria-label="SettleAm Home" onClick={() => setMobileMenuOpen(false)}>
          <img src="/SettleAm logo/SettleAm_logo_light.svg" alt="SettleAm" className="app-header__logo-img" />
        </Link>
        <button
          className="app-header__mobile-close"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        >
          ✕
        </button>
      </div>

      {/* Nav links */}
      <div className="app-header__mobile-nav">
        <Link href="/artisans" className="app-header__mobile-link" onClick={() => setMobileMenuOpen(false)}>Services</Link>
        <Link href="#how"      className="app-header__mobile-link" onClick={() => setMobileMenuOpen(false)}>How it Works</Link>
        <Link href="#verify"   className="app-header__mobile-link" onClick={() => setMobileMenuOpen(false)}>Trust &amp; Safety</Link>
      </div>

      {/* CTA buttons — conditional on auth */}
      <div className="app-header__mobile-actions">
        <Link href="#booking" className="app-header__mobile-btn app-header__mobile-btn--primary" onClick={() => setMobileMenuOpen(false)}>Book Now</Link>
        {!loading && (
          isAuthed ? (
            <Link href={dashHref} className="app-header__mobile-btn app-header__mobile-btn--secondary" onClick={() => setMobileMenuOpen(false)}>My Dashboard</Link>
          ) : (
            <Link href="/login" className="app-header__mobile-btn app-header__mobile-btn--secondary" onClick={() => setMobileMenuOpen(false)}>Login</Link>
          )
        )}
      </div>
    </div>
  );

  // ── App nav links (directory) ─────────────────────────────────────────────
  const appLinks = isApp && (
    <div className="app-header__actions">
      <Link href="/"        className="app-header__action-link">Dashboard</Link>
      <Link href="/artisans" className="app-header__action-link">My Bookings</Link>
      <Link href="/book"     className="app-header__action-btn">+ Book Now</Link>
    </div>
  );

  // ── Simple variant right side ─────────────────────────────────────────────
  const simpleRight = isSimple && (
    <div className="app-header__actions">
      {onLogout ? (
        <>
          <Link href="/artisans" className="app-header__action-link">Browse Directory</Link>
          <button className="app-header__logout-btn" onClick={onLogout}>Log Out</button>
        </>
      ) : (
        <Link href={backHref} className="app-header__back-link">
          <span className="app-header__back-full">{backLabel}</span>
          <span className="app-header__back-short">← Back</span>
        </Link>
      )}
      {rightSlot}
    </div>
  );

  // ── Hamburger (landing only) ──────────────────────────────────────────────
  const hamburger = isLanding && (
    <button
      className={`app-header__hamburger${mobileMenuOpen ? " app-header__hamburger--open" : ""}`}
      aria-label="Toggle navigation menu"
      aria-expanded={mobileMenuOpen}
      onClick={() => setMobileMenuOpen((v) => !v)}
    >
      <span /><span /><span />
    </button>
  );

  return (
    <>
      <header className={headerClass} role="banner">
        <div className="app-header__inner">
          {logo}
          {searchBar}
          {landingLinks}
          {appLinks}
          {simpleRight}
          {hamburger}
        </div>
      </header>
      {mobileOverlay}
    </>
  );
}
