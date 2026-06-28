export default function TrustSafety() {
  const checks = [
    "BVN / NIN Identity Verification",
    "Government-issued ID card",
    "Verified face photo",
    "Home / workshop address confirmed",
  ];

  const ratings = [
    { label: "Customer Star Rating", score: "4.8 / 5", width: "96%" },
    { label: "Job Completion Rate",  score: "94%",     width: "94%" },
    { label: "Response Speed",       score: "91%",     width: "91%" },
    { label: "Repeat Customer Score",score: "87%",     width: "87%" },
  ];

  return (
    <section className="verify" id="verify">
      <div className="section-tag reveal">Trust & Safety</div>
      <h2 className="section-title reveal">
        Every artisan is verified.
        <br />
        No exceptions.
      </h2>
      <p className="section-sub reveal">
        We vet every tradesperson before they appear on SettleAm — so you never have to guess.
      </p>
      <div className="verify-grid reveal">
        <div className="verify-list">
          {checks.map((check) => (
            <div className="verify-item" key={check}>
              <div className="verify-check">✓</div>
              <span>{check}</span>
            </div>
          ))}
        </div>
        <div className="rating-card">
          <h3>⭐ Reputation Score — How Artisans Are Rated</h3>
          <div className="rating-bar-wrap">
            {ratings.map((r) => (
              <div className="rating-row" key={r.label}>
                <div className="rating-label">
                  <span>{r.label}</span>
                  <span>{r.score}</span>
                </div>
                <div className="rating-bar-bg">
                  <div className="rating-bar-fill" style={{ width: r.width }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
