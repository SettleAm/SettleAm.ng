export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: "/Icons/11_booking_calendar.svg",
      iconAlt: "Book",
      title: "Browse & Book",
      desc: "Search for the service you need. Pick a time and location that works for you.",
    },
    {
      num: "02",
      icon: "/Icons/09_verified_shield.svg",
      iconAlt: "Match",
      title: "Get Matched",
      desc: "We connect you with a verified, rated artisan near you within the hour.",
    },
    {
      num: "03",
      icon: "/Icons/07_analytics_chart.svg",
      iconAlt: "Rate",
      title: "Rate & Review",
      desc: "Leave a review to help the community find great artisans.",
    },
  ];

  return (
    <section className="how" id="how">
      <div className="section-tag reveal">How it Works</div>
      <h2 className="section-title reveal">From booking to done — in 3 steps.</h2>
      <p className="section-sub reveal">
        No phone calls, no haggling, no chasing. Just tap, book, relax.
      </p>
      <div className="steps reveal">
        {steps.map((step) => (
          <div className="step" key={step.num}>
            <div className="step-num">{step.num}</div>
            <div className="step-icon">
              <img src={step.icon} alt={step.iconAlt} width="32" height="32" />
            </div>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
