export default function PaymentProtection() {
  const steps = [
    { num: "1", title: "Customer Pays",  desc: "Pay via card, bank transfer, USSD, or Opay/Palmpay" },
    { num: "2", title: "Funds Held",     desc: "SettleAm securely holds payment in escrow" },
    { num: "3", title: "Job Completed",  desc: "Artisan finishes and customer confirms" },
    { num: "4", title: "Artisan Paid",   desc: "Funds released directly to artisan's bank account" },
  ];

  return (
    <section>
      <div className="section-tag reveal">Payment</div>
      <h2 className="section-title reveal">
        Your money is protected.
        <br />
        Always.
      </h2>
      <p className="section-sub reveal">
        SettleAm uses an escrow system — we hold your payment until you confirm the job is done right.
      </p>
      <div className="payment-flow reveal">
        {steps.map((step, i) => (
          <>
            <div className="pay-step" key={step.num}>
              <div className="pay-step-num">{step.num}</div>
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <div className="pay-arrow" key={`arrow-${i}`}>→</div>
            )}
          </>
        ))}
      </div>
      <div className="escrow-note reveal">
        <span>⏱️</span>
        <span>
          <strong>24-Hour Dispute Window:</strong> If you're unsatisfied with a job, you have 24 hours after
          completion to raise a dispute — before any payment is released to the artisan.
        </span>
      </div>
    </section>
  );
}
