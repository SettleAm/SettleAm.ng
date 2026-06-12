"use client";

import { useState } from "react";
import Link from "next/link";

export default function Booking() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "",
    location: "",
    desc: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.service || !formData.location) {
      alert("Please fill in all required fields.");
      return;
    }

    const phoneNum = "2348120674396";
    const text = `*New Booking Request on SettleAm* 🔧\n\n` +
      `*Name:* ${formData.name}\n` +
      `*Phone Number:* ${formData.phone}\n` +
      `*Service Needed:* ${formData.service}\n` +
      `*Location:* ${formData.location}\n` +
      `*Job Details:* ${formData.desc || "_None provided_"}`;

    const whatsappUrl = `https://wa.me/${phoneNum}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
    setSubmitted(true);
  };

  return (
    <section className="booking" id="booking">
      <div className="booking-wrap">
        <div className="form-card reveal visible">
          <h3>Book an Artisan</h3>
          <p>Fill this form and we'll match you with a verified professional in your area.</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fname">Your Full Name</label>
              <input
                type="text"
                id="fname"
                placeholder="e.g. Chukwuemeka Obi"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fphone">Phone Number</label>
              <input
                type="tel"
                id="fphone"
                placeholder="e.g. 0801 234 5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fservice">Service Needed</label>
              <select
                id="fservice"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                required
              >
                <option value="">Select a service...</option>
                <option value="Electrician">Electrician</option>
                <option value="Plumber">Plumber</option>
                <option value="AC Technician">AC Technician</option>
                <option value="Generator Repair">Generator Repair</option>
                <option value="Carpenter / Handyman">Carpenter / Handyman</option>
                <option value="Home Cleaning">Home Cleaning</option>
                <option value="TV Installation">TV Installation</option>
                <option value="Driver">Driver</option>
                <option value="Tailor / Suit Maker">Tailor / Suit Maker</option>
                <option value="Hair Stylist">Hair Stylist</option>
                <option value="Chef / Caterer">Chef / Caterer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="flocation">Location (LGA or Area)</label>
              <input
                type="text"
                id="flocation"
                placeholder="e.g. Abeokuta, Sagamu, Ijebu-Ode"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fdesc">Describe the Job</label>
              <textarea
                id="fdesc"
                placeholder="Tell us what needs to be done..."
                value={formData.desc}
                onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              ></textarea>
            </div>
            <button
              type="submit"
              className="form-submit"
              disabled={submitted}
              style={submitted ? { background: "#1DB069" } : {}}
            >
              {submitted ? "✅ Booking Submitted" : "🔧 Submit Booking Request"}
            </button>
          </form>

          {submitted && (
            <div className="success-msg" style={{ display: "block" }}>
              ✅ Booking received! We'll reach out via WhatsApp within the hour.
            </div>
          )}
        </div>

        <div className="booking-info reveal visible">
          <h3>Or reach us directly</h3>
          <p>Prefer to talk? We're available on WhatsApp, by phone, or via email. We respond fast.</p>
          <div className="contact-options">
            <a href="https://wa.me/2348120674396" className="contact-opt" target="_blank" rel="noopener noreferrer">
              <div className="contact-opt-icon" style={{ background: "#E8F5EC" }}>
                <img src="/Icons/06_chat2.svg" alt="WhatsApp" width="24" height="24" />
              </div>
              Chat on WhatsApp
            </a>
            <a href="tel:+2348000000000" className="contact-opt">
              <div className="contact-opt-icon" style={{ background: "#EAF0FF" }}>
                📞
              </div>
              Call Us Directly
            </a>
            <a href="mailto:settleam.ng@gmail.com" className="contact-opt">
              <div className="contact-opt-icon" style={{ background: "#FFF4E0" }}>
                ✉️
              </div>
              settleam.ng@gmail.com
            </a>
          </div>
          <br />
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px 24px", marginTop: "8px" }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>🚀 Are you an artisan?</p>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: 300, marginBottom: "12px" }}>Join SettleAm and get access to verified job opportunities in your area.</p>
            <Link href="/signup" style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--green)", textDecoration: "none" }}>
              Apply to join as an artisan →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
