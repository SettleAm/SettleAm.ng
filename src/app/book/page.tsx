"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Footer from "../../components/Footer";
import Header from "../../components/Header";

// ─── Avatar colour map (same palette as the listing cards) ───────────────────
const AVATAR_COLOURS: Record<string, string> = {
  Electrician:    "#1DB069",
  Plumber:        "#2563EB",
  Tailor:         "#7C3AED",
  "AC Tech":      "#0EA5E9",
  Carpenter:      "#D97706",
  Cleaner:        "#EC4899",
  "Hair Stylist": "#F59E0B",
  Chef:           "#EF4444",
  Painter:        "#10B981",
  Driver:         "#6366F1",
  "Shoe Maker":   "#8B5A2B",
};

const TRADE_EMOJI: Record<string, string> = {
  Electrician:    "⚡",
  Plumber:        "🔧",
  Tailor:         "✂️",
  "AC Tech":      "❄️",
  Carpenter:      "🪚",
  Cleaner:        "🧹",
  "Hair Stylist": "💇",
  Chef:           "👨‍🍳",
  Painter:        "🖌️",
  Driver:         "🚗",
  "Shoe Maker":   "👞",
};

// ─── Inner form (needs Suspense because it calls useSearchParams) ─────────────

function BookingForm() {
  const params    = useSearchParams();
  const artisanName  = params.get("name")  ?? "";
  const artisanTrade = params.get("trade") ?? "";

  const [formData, setFormData] = useState({
    clientName: "",
    phone:      "",
    service:    artisanTrade || "",
    location:   "",
    desc:       "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  useEffect(() => {
    if (artisanTrade) {
      setFormData((prev) => ({ ...prev, service: artisanTrade }));
    }
  }, [artisanTrade]);

  const currentService = artisanTrade || formData.service;
  const avatarBg = AVATAR_COLOURS[currentService] ?? "#1DB069";
  const emoji    = TRADE_EMOJI[currentService]    ?? "🔧";
  const initials = artisanName
    ? artisanName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.clientName.trim()) e.clientName = "Full name is required.";
    if (!formData.phone.trim())      e.phone      = "Phone number is required.";
    if (!formData.location.trim())   e.location   = "Location is required.";
    if (!artisanName && !formData.service)   e.service    = "Service needed is required.";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const phone = "2348120674396";
    const text  =
      `*New Booking Request — SettleAm* 🔧\n\n` +
      (artisanName 
        ? `*Selected Artisan:* ${artisanName}\n*Profession:* ${emoji} ${artisanTrade || "—"}\n\n`
        : `*Request:* General Booking\n*Profession Needed:* ${emoji} ${formData.service || "—"}\n\n`) +
      `*Client Name:* ${formData.clientName}\n` +
      `*Client Phone:* ${formData.phone}\n` +
      `*Location:* ${formData.location}\n` +
      `*Job Details:* ${formData.desc || "_None provided_"}`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
    setSubmitted(true);
  };

  return (
    <div className="book-page-inner">
      {/* ── Artisan summary card ── */}
      {artisanName && (
        <div className="book-artisan-card">
          <div className="book-artisan-avatar" style={{ background: avatarBg }}>
            {initials}
            <div className="verified-mark">✓</div>
          </div>
          <div className="book-artisan-info">
            <div className="book-artisan-label">You are booking</div>
            <div className="book-artisan-name">{artisanName}</div>
            <div className="book-artisan-trade">
              <span className="trade-tag">{emoji} {artisanTrade}</span>
            </div>
          </div>
          <div className="book-artisan-badge">✅ Verified</div>
        </div>
      )}

      {/* ── Form card ── */}
      <div className="form-card book-form-card">
        <h3>{artisanName ? "Complete your Booking" : "Book an Artisan"}</h3>
        <p>
          {artisanName 
            ? "Fill in your details and we'll send your request directly to our team via WhatsApp."
            : "Fill this form and we'll match you with a verified professional in your area."}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Read-only artisan fields */}
          {artisanName && (
            <div className="book-readonly-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Artisan Name</label>
                <input type="text" value={artisanName} readOnly className="book-readonly-input" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Profession</label>
                <input type="text" value={`${emoji} ${artisanTrade}`} readOnly className="book-readonly-input" />
              </div>
            </div>
          )}

          {!artisanName && (
            <div className="form-group">
              <label htmlFor="bService">Service Needed *</label>
              <select
                id="bService"
                value={formData.service}
                onChange={(e) => {
                  setFormData({ ...formData, service: e.target.value });
                  setErrors({ ...errors, service: "" });
                }}
              >
                <option value="">Select a service...</option>
                <option value="Electrician">Electrician ⚡</option>
                <option value="Plumber">Plumber 🔧</option>
                <option value="Tailor">Tailor ✂️</option>
                <option value="AC Tech">AC Technician ❄️</option>
                <option value="Carpenter">Carpenter 🪚</option>
                <option value="Cleaner">Cleaner 🧹</option>
                <option value="Hair Stylist">Hair Stylist 💇</option>
                <option value="Chef">Chef 👨‍🍳</option>
                <option value="Painter">Painter 🖌️</option>
                <option value="Driver">Driver 🚗</option>
                <option value="Shoe Maker">Shoe Maker 👞</option>
              </select>
              {errors.service && <div className="book-field-error">{errors.service}</div>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="bClientName">Your Full Name *</label>
            <input
              id="bClientName"
              type="text"
              placeholder="e.g. Chukwuemeka Obi"
              value={formData.clientName}
              onChange={(e) => { setFormData({ ...formData, clientName: e.target.value }); setErrors({ ...errors, clientName: "" }); }}
            />
            {errors.clientName && <div className="book-field-error">{errors.clientName}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="bPhone">Phone Number *</label>
            <input
              id="bPhone"
              type="tel"
              placeholder="e.g. 0801 234 5678"
              value={formData.phone}
              onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }}
            />
            {errors.phone && <div className="book-field-error">{errors.phone}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="bLocation">Your Location (LGA or Area) *</label>
            <input
              id="bLocation"
              type="text"
              placeholder="e.g. Abeokuta, Sagamu, Ijebu-Ode"
              value={formData.location}
              onChange={(e) => { setFormData({ ...formData, location: e.target.value }); setErrors({ ...errors, location: "" }); }}
            />
            {errors.location && <div className="book-field-error">{errors.location}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="bDesc">Describe the Job</label>
            <textarea
              id="bDesc"
              placeholder="Tell us what needs to be done — the more detail the better…"
              value={formData.desc}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="form-submit"
            disabled={submitted}
            style={submitted ? { background: "#1DB069", cursor: "default" } : {}}
          >
            {submitted ? "✅ Booking Sent via WhatsApp" : "📲 Confirm Booking on WhatsApp"}
          </button>
        </form>

        {submitted && (
          <div className="success-msg" style={{ display: "block", marginTop: "20px" }}>
            ✅ Your booking request has been sent! We'll reach out via WhatsApp within the hour.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function BookPage() {
  return (
    <>
      {/* NAV */}
      <Header
        variant="simple"
        theme="light"
        darkAtTop
        backLabel="← Browse Artisans"
        backHref="/artisans"
      />

      {/* HEADER BANNER */}
      <div className="book-page-header">
        <div className="header-inner">
          <div className="header-breadcrumb">
            <Link href="/">Home</Link> ›{" "}
            <Link href="/artisans">Browse Artisans</Link> ›{" "}
            <span>Book Now</span>
          </div>
          <h1 className="header-title">
            Book your <em>artisan</em>
          </h1>
          <p className="header-sub">
            Complete the form below and your request will be sent directly to the SettleAm team via WhatsApp.
            We'll confirm your booking within the hour.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="book-page-wrap">
        <Suspense fallback={<div className="book-loading">Loading booking form…</div>}>
          <BookingForm />
        </Suspense>
      </div>

      <Footer />
    </>
  );
}
