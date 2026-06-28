export default function PaymentProtection() {
  const steps = [
    { num: "1", title: "Book Artisan",  desc: "Find and book a verified artisan near you" },
    { num: "2", title: "Job Completed", desc: "Artisan finishes the work" },
    { num: "3", title: "Confirm Satisfaction", desc: "Inspect the work to ensure it's done right" },
    { num: "4", title: "Direct Payment", desc: "Pay the artisan directly via cash or bank transfer" },
  ];

  return (
    <section>
      <div className="section-tag reveal">Payment</div>
      <h2 className="section-title reveal">
        Safe and reliable
        <br />
        direct payment.
      </h2>
      <p className="section-sub reveal">
        SettleAm connects you with verified local artisans. Pay the artisan directly after you confirm the job is completed to your satisfaction.
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
    </section>
  );
}
