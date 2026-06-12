export default function Marquee() {
  const items = [
    "Electricians",
    "Plumbers",
    "AC Technicians",
    "Generator Repair",
    "Carpenters",
    "Home Cleaning",
    "TV Installation",
    "Suit Makers",
    "Hair Stylists",
    "Chefs",
    "Shoe Makers",
  ];

  // Repeat items list to maintain continuous infinite loop illusion
  const fullTrack = [...items, ...items, "Drivers"];

  return (
    <div className="marquee-wrap">
      <div className="marquee-track">
        {fullTrack.map((item, index) => (
          <div key={index} className="marquee-item">
            <div className="marquee-dot"></div> {item}
          </div>
        ))}
      </div>
    </div>
  );
}
