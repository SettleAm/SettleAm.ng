"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navigation() {
  const [isActive, setIsActive] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsActive(!isActive);
  };

  const closeMenu = () => {
    setIsActive(false);
  };

  return (
    <nav className={isScrolled ? "scrolled" : ""}>
      <Link href="/" className="nav-logo" onClick={closeMenu}>
        <img src="/settleam-logo.svg" alt="SettleAm" style={{ height: "100%", width: "auto" }} />
      </Link>

      <button
        className={`mobile-menu-btn ${isActive ? "active" : ""}`}
        aria-label="Toggle menu"
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <ul className={`nav-menu ${isActive ? "active" : ""}`}>
        <li>
          <Link href="/artisans" onClick={closeMenu}>
            Services
          </Link>
        </li>
        <li>
          <Link href="#how" onClick={closeMenu}>
            How it Works
          </Link>
        </li>
        <li>
          <Link href="#verify" onClick={closeMenu}>
            Trust & Safety
          </Link>
        </li>
        <li>
          <Link href="/login" className="nav-login" onClick={closeMenu}>
            Login
          </Link>
        </li>
        <li>
          <Link href="#booking" className="nav-cta" onClick={closeMenu}>
            Book Now
          </Link>
        </li>
      </ul>
    </nav>
  );
}
