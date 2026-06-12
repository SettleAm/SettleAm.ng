import Link from "next/link";

export default function Services() {
  const services = [
    { icon: "⚡", name: "Electricians" },
    { icon: "🔧", name: "Plumbers" },
    { icon: "❄️", name: "AC Technicians" },
    { icon: "⚙️", name: "Generator Repair" },
    { icon: "🪚", name: "Carpenters" },
    { icon: "img", src: "/Icons/16_home_cleaning.svg", name: "Home Cleaning" },
    { icon: "📺", name: "TV Installation" },
    { icon: "🚗", name: "Drivers" },
    { icon: "👞", name: "Shoe Makers" },
    { icon: "img", src: "/Icons/03_tailor.svg", name: "Suit Tailors" },
    { icon: "💇", name: "Hair Stylists" },
    { icon: "img", src: "/Icons/18_chefs.svg", name: "Chefs" },
    { icon: "img", src: "/Icons/02_painter.svg", name: "Renovation" },
    { icon: "📦", name: "Movers" },
  ];

  return (
    <section id="services">
      <div className="section-tag reveal">Services</div>
      <h2 className="section-title reveal">Your entire home, covered.</h2>
      <p className="section-sub reveal">
        From emergency repairs to lifestyle services — SettleAm has a verified professional for every need.
      </p>
      <div className="services-grid reveal">
        {services.map((s) => (
          <Link href="/artisans" key={s.name} className="service-pill" style={{ textDecoration: "none" }}>
            {s.icon === "img" ? (
              <img src={s.src} alt={s.name} width="32" height="32" style={{ marginBottom: "8px" }} />
            ) : (
              <span className="service-emoji">{s.icon}</span>
            )}
            <span className="service-name">{s.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
