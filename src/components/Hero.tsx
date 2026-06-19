import Link from "next/link";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg"></div>
      <div className="hero-badge">
        <div className="hero-badge-dot"></div>
        Now live in Ogun State, Nigeria
      </div>
      <h1>
        Whatever
        <br />
        needs fixing
        <br />
        <span className="highlight">SettleAm</span> handles it.
      </h1>
      <p className="hero-sub">
        Nigeria's trusted marketplace for verified skilled tradespeople. Book an electrician, plumber,
        carpenter and more — in minutes, not days.
      </p>
      <div className="hero-actions">
        <Link href="#booking" className="btn-primary">
          <img
            src="/Icons/06_chat2.svg"
            alt="Book"
            width="20"
            height="20"
            style={{ marginRight: "8px", filter: "brightness(0) invert(1)" }}
          />{" "}
          Book an Artisan
        </Link>
        <Link href="#services" className="btn-secondary">
          <span>🔧</span> Browse Services
        </Link>
      </div>
    </section>
  );
}
