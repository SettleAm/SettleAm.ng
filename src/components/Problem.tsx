export default function Problem() {
  return (
    <section className="problem reveal">
      <div className="section-tag">The Problem</div>
      <h2 className="section-title">Every Nigerian has a story.</h2>
      <p className="section-sub">
        The electrician who took the money and disappeared. The plumber who "fixed" the pipe that burst
        again the next day. It ends now.
      </p>
      <div className="problem-grid">
        <div className="problem-card">
          <span className="problem-icon">💸</span>
          <h3>Paid & No-Show</h3>
          <p>Artisans collect upfront payments and vanish — leaving customers stranded with no recourse.</p>
        </div>
        <div className="problem-card">
          <span className="problem-icon">🔩</span>
          <h3>Shoddy Workmanship</h3>
          <p>Jobs done poorly with no accountability. No ratings, no history, no way to know who you're hiring.</p>
        </div>
        <div className="problem-card">
          <div className="step-icon" style={{ marginBottom: "16px" }}>
            <img src="/Icons/06_chat2.svg" alt="Chart" width="28" height="28" />
          </div>
          <h3>Only Word-of-Mouth</h3>
          <p>Nigerians rely on referrals — but what happens when your network has no one to recommend?</p>
        </div>
        <div className="problem-card">
          <div className="step-icon" style={{ marginBottom: "16px" }}>
            <img src="/Icons/07_analytics_chart.svg" alt="Chart" width="28" height="28" />
          </div>
          <h3>Artisans Stay Invisible</h3>
          <p>Skilled tradespeople can't grow beyond their street. No platform, no reputation, no steady income.</p>
        </div>
      </div>
    </section>
  );
}
