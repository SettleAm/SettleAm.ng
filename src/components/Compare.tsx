export default function Compare() {
  return (
    <section className="compare reveal">
      <div className="section-tag">Why SettleAm?</div>
      <h2 className="section-title">
        Built for Nigeria.
        <br />
        Better than the rest.
      </h2>
      <br />
      <table className="compare-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th className="highlight-col">✦ SettleAm</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>WhatsApp Booking</td>
            <td className="highlight-col check-yes">✓ Yes</td>
          </tr>
          <tr>
            <td>Direct Payment to Artisan</td>
            <td className="highlight-col check-yes">✓ Pay after completion</td>
          </tr>
          <tr>
            <td>Artisan Digital Profiles</td>
            <td className="highlight-col check-yes">✓ Portfolio + ratings</td>
          </tr>
          <tr>
            <td>Nigerian-native Brand</td>
            <td className="highlight-col check-yes">✓ SettleAm = Nigeria</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
