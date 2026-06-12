import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      <div>
        <Link href="/" className="footer-logo-img">
          <img
            src="/SettleAm logo/SettleAm_logo_dark.svg"
            alt="SettleAm"
            className="footer-logo-svg"
            style={{ height: "44px", maxWidth: "100%", display: "block", marginBottom: "16px" }}
          />
        </Link>
        <p style={{ marginTop: "8px", fontSize: "0.82rem" }}>Nigeria's trusted artisan marketplace. Starting in Ogun State.</p>
        <a
          href="mailto:settleam.ng@gmail.com"
          style={{
            display: "inline-block",
            marginTop: "8px",
            fontSize: "0.82rem",
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
        >
          ✉ settleam.ng@gmail.com
        </a>
      </div>
      <div className="footer-links">
        <Link href="/artisans">Services</Link>
        <Link href="#how">How it Works</Link>
        <Link href="#verify">Trust & Safety</Link>
        <Link href="#booking">Book Now</Link>
        <Link href="/login">Login</Link>
        <Link href="/signup">Join as Artisan</Link>
      </div>
      <p style={{ fontSize: "0.8rem" }}>© 2025 SettleAm. All rights reserved.</p>
    </footer>
  );
}
