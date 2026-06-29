"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabase";
import { profileService } from "../../utils/profileService";

export default function SignupPage() {
  const router = useRouter();

  // State fields
  const [role, setRole] = useState<"customer" | "artisan" | null>(null);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [craft, setCraft] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fname.trim()) newErrors.fname = "First name is required.";
    if (!lname.trim()) newErrors.lname = "Last name is required.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Please enter a valid phone number.";
    }
    if (role === "artisan" && !craft) newErrors.craft = "Please select your craft.";
    if (!location.trim()) newErrors.location = "Location is required.";
    if (password.length < 8) newErrors.password = "Password must be at least 8 characters.";
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    if (!terms) newErrors.terms = "You must accept the terms to continue.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: fname.trim(),
            last_name: lname.trim(),
            phone: phone.trim(),
            craft: role === "artisan" ? craft : "",
            location: location.trim(),
            role,
          },
        },
      });

      if (error) {
        triggerToast(`❌ ${error.message}`);
        setLoading(false);
        return;
      }

      if (data?.user?.identities?.length === 0) {
        triggerToast("📧 Email already registered. Try logging in.");
      } else {
        // Automatically ensure profile is created
        if (data?.user) {
          await profileService.ensureProfileForUser(
            data.user.id,
            email.trim(),
            {
              first_name: fname.trim(),
              last_name: lname.trim(),
              phone: phone.trim(),
              craft: role === "artisan" ? craft : "",
              location: location.trim(),
              role,
            },
            role || "customer"
          );
        }

        triggerToast("🎉 Account created! Welcome to SettleAm!");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      triggerToast(`❌ ${err.message || "An unexpected error occurred."}`);
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --dark:#0A1F15; --darker:#060F0A; --green:#0E6B45; --green-mid:#138A58;
          --green-bright:#1DB069; --gold:#F5A623; --gold-dim:rgba(245,166,35,0.12);
          --white:#FAFFF8; --muted:rgba(250,255,248,0.45); --border:rgba(200,232,212,0.15);
          --border-focus:rgba(29,176,105,0.6); --card:rgba(14,107,69,0.06); --error:#FF6B6B;
        }

        *, *::before, *::after { box-sizing: border-box; }
        html, body { overflow-x: hidden; max-width: 100%; }

        .signup-body-wrapper {
          min-height: 100vh;
          width: 100%;
          max-width: 100vw;
          font-family: 'DM Sans', sans-serif;
          background: var(--darker);
          color: var(--white);
          display: grid;
          grid-template-columns: 1fr 1fr;
          overflow-x: hidden;
        }

        .left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
          background: var(--dark);
          overflow-x: hidden;
          overflow-y: auto;
          max-height: 100vh;
        }

        .left::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
        }

        .left::after {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(14,107,69,0.18) 0%, transparent 70%);
          bottom: -100px;
          left: -100px;
          pointer-events: none;
          z-index: 0;
        }

        .left > * { position: relative; z-index: 1; }

        .logo { display: flex; align-items: center; text-decoration: none; }

        .logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -0.5px;
          color: var(--white);
        }

        .logo-text span { color: var(--green-bright); }

        .hero-copy {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 0;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--gold-dim);
          border: 1px solid rgba(245,166,35,0.25);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--gold);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 28px;
          width: fit-content;
          animation: fadeUp 0.5s ease both;
        }

        .hero-tag::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--gold);
          border-radius: 50%;
          animation: blink 2s infinite;
        }

        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        .hero-h1 {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2.2rem, 3.2vw, 3rem);
          line-height: 1.05;
          letter-spacing: -2px;
          color: var(--white);
          margin-bottom: 20px;
          animation: fadeUp 0.5s 0.1s ease both;
        }

        .hero-h1 em { font-style: normal; color: var(--green-bright); }

        .hero-p {
          font-size: 1rem;
          font-weight: 300;
          color: var(--muted);
          line-height: 1.7;
          max-width: 380px;
          animation: fadeUp 0.5s 0.2s ease both;
        }

        .steps-list {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: fadeUp 0.5s 0.3s ease both;
        }

        .step-item { display: flex; align-items: flex-start; gap: 16px; }

        .step-num {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--green);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 0.82rem;
          color: #fff;
          flex-shrink: 0;
        }

        .step-text h4 {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.92rem;
          color: var(--white);
          margin-bottom: 4px;
        }

        .step-text p { font-size: 0.82rem; color: var(--muted); font-weight: 300; line-height: 1.5; }

        .craft-strip { display: flex; gap: 10px; flex-wrap: wrap; animation: fadeUp 0.5s 0.4s ease both; }

        .craft-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 6px 12px;
          font-size: 0.78rem;
          color: rgba(250,255,248,0.6);
        }

        .right {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 40px 40px;
          background: var(--darker);
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
          max-height: 100vh;
          box-sizing: border-box;
        }

        .right::before {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(29,176,105,0.07) 0%, transparent 70%);
          top: -80px;
          right: -80px;
          pointer-events: none;
        }

        .form-wrap { width: 100%; max-width: 440px; padding: 40px 0; box-sizing: border-box; animation: fadeUp 0.5s 0.15s ease both; }

        .form-header { margin-bottom: 28px; }

        .form-header h2 {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.8rem;
          letter-spacing: -1px;
          color: var(--white);
          margin-bottom: 6px;
        }

        .form-header p { font-size: 0.9rem; font-weight: 300; color: var(--muted); line-height: 1.5; }



        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        .form-group { margin-bottom: 16px; }

        .form-group label { display: block; font-size: 0.82rem; font-weight: 500; color: rgba(250,255,248,0.7); margin-bottom: 7px; }

        .input-wrap { position: relative; }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.95rem;
          opacity: 0.4;
          pointer-events: none;
          transition: opacity 0.2s;
        }

        .input-wrap:focus-within .input-icon { opacity: 0.8; }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 13px 14px 13px 40px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          color: var(--white);
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }

        .form-group select option { background: #0A1F15; color: var(--white); }

        .form-group textarea { padding-left: 40px; resize: vertical; min-height: 80px; }

        .form-group input::placeholder,
        .form-group select::placeholder,
        .form-group textarea::placeholder { color: rgba(250,255,248,0.25); }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: var(--border-focus);
          background: rgba(29,176,105,0.05);
          box-shadow: 0 0 0 3px rgba(29,176,105,0.08);
        }

        .form-group input.error-input,
        .form-group select.error-input { border-color: rgba(255,107,107,0.5); }

        .eye-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          opacity: 0.35;
          transition: opacity 0.2s;
          padding: 4px;
          color: var(--white);
        }

        .eye-toggle:hover { opacity: 0.7; }

        .error-msg { display: none; font-size: 0.75rem; color: var(--error); margin-top: 5px; padding-left: 2px; }

        .error-msg.visible { display: block; }

        .terms-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 20px; }

        .custom-check {
          width: 18px;
          height: 18px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid var(--border);
          border-radius: 5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .custom-check.checked { background: var(--green); border-color: var(--green); }

        .custom-check.checked::after { content: '✓'; font-size: 0.7rem; color: white; font-weight: 700; }

        .terms-label { font-size: 0.82rem; color: var(--muted); line-height: 1.5; cursor: pointer; user-select: none; }

        .terms-label a { color: var(--green-bright); text-decoration: none; }

        .terms-label a:hover { color: var(--gold); }

        .btn-signup {
          width: 100%;
          padding: 16px;
          background: var(--green);
          color: var(--white);
          border: none;
          border-radius: 12px;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.97rem;
          cursor: pointer;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(14,107,69,0.35);
        }

        .btn-signup::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.06) 100%); }

        .btn-signup:hover { background: var(--green-mid); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(14,107,69,0.45); }

        .btn-signup:active { transform: translateY(0); }

        .btn-signup.loading { pointer-events: none; opacity: 0.8; }

        .btn-signup.loading .btn-text { opacity: 0; }

        .btn-signup.loading::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%,-50%);
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }

        .login-row { text-align: center; margin-top: 20px; font-size: 0.85rem; color: var(--muted); font-weight: 300; }

        .login-row a { color: var(--green-bright); font-weight: 500; text-decoration: none; transition: color 0.2s; }

        .login-row a:hover { color: var(--gold); }

        .toast {
          position: fixed;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%) translateY(20px);
          background: var(--green);
          color: white;
          padding: 14px 28px;
          border-radius: 100px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 8px 30px rgba(14,107,69,0.4);
          opacity: 0;
          transition: all 0.3s ease;
          pointer-events: none;
          white-space: nowrap;
          z-index: 100;
        }

        .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        .role-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin: 32px 0;
        }

        .role-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid var(--border);
          border-radius: 16px;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--white);
          position: relative;
          overflow: hidden;
          outline: none;
        }

        .role-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent 0%, rgba(29,176,105,0.06) 100%);
          opacity: 0;
          transition: opacity 0.25s;
        }

        .role-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: var(--border-focus);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(14,107,69,0.15);
        }

        .role-card:hover::before {
          opacity: 1;
        }

        .role-card-icon {
          font-size: 2.2rem;
          background: rgba(29,176,105,0.1);
          width: 64px;
          height: 64px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(29,176,105,0.2);
          transition: transform 0.25s;
        }

        .role-card:hover .role-card-icon {
          transform: scale(1.05) rotate(-3deg);
          background: rgba(29,176,105,0.2);
        }

        .role-card-content {
          flex: 1;
        }

        .role-card-content h3 {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.15rem;
          color: var(--white);
          margin-bottom: 4px;
        }

        .role-card-content p {
          font-size: 0.85rem;
          color: var(--muted);
          line-height: 1.4;
          font-weight: 300;
        }

        .role-card-arrow {
          font-size: 1.2rem;
          opacity: 0.3;
          transition: transform 0.25s, opacity 0.25s;
        }

        .role-card:hover .role-card-arrow {
          opacity: 1;
          transform: translateX(4px);
          color: var(--green-bright);
        }

        .back-to-role {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: var(--muted);
          background: none;
          border: none;
          cursor: pointer;
          margin-bottom: 24px;
          padding: 0;
          transition: color 0.2s;
          font-family: inherit;
        }

        .back-to-role:hover {
          color: var(--white);
        }

        @media (max-width: 768px) {
          .signup-body-wrapper {
            grid-template-columns: 1fr;
            overflow-x: hidden;
            width: 100%;
          }
          .left { display: none; }
          .right {
            min-height: 100vh;
            max-height: none;
            padding: 40px 20px 56px;
            overflow-x: hidden;
            align-items: flex-start;
          }
          .form-wrap {
            max-width: 100%;
            width: 100%;
            padding: 24px 0;
          }
          .form-row { grid-template-columns: 1fr; }
          .steps-list { display: none; }
          .hero-h1 { font-size: 1.9rem; letter-spacing: -1px; }
          .form-header h2 { font-size: 1.55rem; letter-spacing: -0.5px; }
        }

        @media (max-width: 400px) {
          .right { padding: 32px 16px 48px; }
          .form-header h2 { font-size: 1.35rem; }
        }
      ` }} />

      <div className="signup-body-wrapper">
        <div className="left">
          {/* Logo */}
          <Link href="/" className="logo">
            <img
              src="/SettleAm logo/SettleAm_logo_dark.svg"
              alt="SettleAm"
              className="footer-logo-svg"
              style={{ height: "46px", maxWidth: "100%", display: "block", marginBottom: "16px" }}
            />
          </Link>

          {/* Hero Copy */}
          <div className="hero-copy">
            <div className="hero-tag">Join SettleAm</div>
            {role === "customer" ? (
              <>
                <h1 className="hero-h1">Find help.<br /><em>Get it fixed.</em><br />Settle am!</h1>
                <p className="hero-p">Create your customer account and connect with top verified local artisans in your area.</p>

                <div className="steps-list">
                  <div className="step-item">
                    <div className="step-num">1</div>
                    <div className="step-text"><h4>Find an Artisan</h4><p>Browse qualified professionals near you.</p></div>
                  </div>
                  <div className="step-item">
                    <div className="step-num">2</div>
                    <div className="step-text"><h4>Direct payment</h4><p>Pay the artisan directly after job completion.</p></div>
                  </div>
                  <div className="step-item">
                    <div className="step-num">3</div>
                    <div className="step-text"><h4>Get it done</h4><p>Relax while our expert handles the work.</p></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="hero-h1">Start earning.<br /><em>Get verified.</em><br />Build trust.</h1>
                <p className="hero-p">Create your free artisan account in under 2 minutes and start receiving job bookings from customers near you.</p>

                <div className="steps-list">
                  <div className="step-item">
                    <div className="step-num">1</div>
                    <div className="step-text"><h4>Create your account</h4><p>Fill in your basic info and craft type.</p></div>
                  </div>
                  <div className="step-item">
                    <div className="step-num">2</div>
                    <div className="step-text"><h4>Get verified</h4><p>We verify your skills and ID for trust badges.</p></div>
                  </div>
                  <div className="step-item">
                    <div className="step-num">3</div>
                    <div className="step-text"><h4>Start getting jobs</h4><p>Receive bookings and get paid directly by customers.</p></div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="craft-strip">
            <div className="craft-pill"><span>⚡</span> Electrician</div>
            <div className="craft-pill"><span>🔧</span> Plumber</div>
            <div className="craft-pill"><span>🪚</span> Carpenter</div>
            <div className="craft-pill"><span>❄️</span> AC Tech</div>
            <div className="craft-pill"><span>👔</span> Tailor</div>
            <div className="craft-pill"><span>💇</span> Barber</div>
            <div className="craft-pill"><span>👞</span> Shoe Maker</div>
          </div>
        </div>

        <div className="right">
          {!role ? (
            <div className="form-wrap">
              <div className="form-header">
                <h2>Join SettleAm 🤝</h2>
                <p>Select your account type below to get started with the right platform experience.</p>
              </div>

              <div className="role-cards">
                <button className="role-card" onClick={() => setRole("customer")}>
                  <div className="role-card-icon">🛒</div>
                  <div className="role-card-content">
                    <h3>I'm a Customer</h3>
                    <p>I want to find, book, and hire verified local artisans for my projects.</p>
                  </div>
                  <span className="role-card-arrow">→</span>
                </button>

                <button className="role-card" onClick={() => setRole("artisan")}>
                  <div className="role-card-icon">🛠️</div>
                  <div className="role-card-content">
                    <h3>I'm an Artisan</h3>
                    <p>I want to offer my services, build my profile, and receive job bookings.</p>
                  </div>
                  <span className="role-card-arrow">→</span>
                </button>
              </div>

              <div className="login-row">
                Already have an account? <Link href="/login">Log in here</Link>
              </div>
            </div>
          ) : (
            <div className="form-wrap">
              <button className="back-to-role" onClick={() => { setRole(null); setErrors({}); }}>
                ← Change account type
              </button>

              <div className="form-header">
                {role === "customer" ? (
                  <>
                    <h2>Create customer account 🛒</h2>
                    <p>Register to find and book verified local artisans near you.</p>
                  </>
                ) : (
                  <>
                    <h2>Create artisan account 🛠️</h2>
                    <p>Join thousands of verified artisans already earning on SettleAm.</p>
                  </>
                )}
              </div>



              <form onSubmit={handleSignup}>
                <div className="form-row">
                  {/* First name */}
                  <div className="form-group">
                    <label htmlFor="fname">First name</label>
                    <div className="input-wrap">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        id="fname"
                        placeholder="Emeka"
                        autoComplete="given-name"
                        value={fname}
                        onChange={(e) => setFname(e.target.value)}
                        className={errors.fname ? "error-input" : ""}
                      />
                    </div>
                    <div className={`error-msg ${errors.fname ? "visible" : ""}`}>{errors.fname}</div>
                  </div>

                  {/* Last name */}
                  <div className="form-group">
                    <label htmlFor="lname">Last name</label>
                    <div className="input-wrap">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        id="lname"
                        placeholder="Okafor"
                        autoComplete="family-name"
                        value={lname}
                        onChange={(e) => setLname(e.target.value)}
                        className={errors.lname ? "error-input" : ""}
                      />
                    </div>
                    <div className={`error-msg ${errors.lname ? "visible" : ""}`}>{errors.lname}</div>
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <div className="input-wrap">
                    <span className="input-icon">✉️</span>
                    <input
                      type="email"
                      id="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={errors.email ? "error-input" : ""}
                    />
                  </div>
                  <div className={`error-msg ${errors.email ? "visible" : ""}`}>{errors.email}</div>
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label htmlFor="phone">Phone number</label>
                  <div className="input-wrap">
                    <span className="input-icon">📱</span>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="+234 800 000 0000"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={errors.phone ? "error-input" : ""}
                    />
                  </div>
                  <div className={`error-msg ${errors.phone ? "visible" : ""}`}>{errors.phone}</div>
                </div>

                <div className="form-row">
                  {/* Craft */}
                  {role === "artisan" && (
                    <div className="form-group">
                      <label htmlFor="craft">Your craft / service</label>
                      <div className="input-wrap">
                        <span className="input-icon">🛠️</span>
                        <select
                          id="craft"
                          value={craft}
                          onChange={(e) => setCraft(e.target.value)}
                          className={errors.craft ? "error-input" : ""}
                          style={{ paddingLeft: "40px" }}
                        >
                          <option value="">Select craft...</option>
                          <option value="Electrician">Electrician</option>
                          <option value="Plumber">Plumber</option>
                          <option value="Carpenter">Carpenter</option>
                          <option value="AC Technician">AC Technician</option>
                          <option value="Tailor">Tailor</option>
                          <option value="Barber / Hairdresser">Barber / Hairdresser</option>
                          <option value="Painter">Painter</option>
                          <option value="Welder">Welder</option>
                          <option value="Shoe Maker">Shoe Maker</option>
                          <option value="Mason / Bricklayer">Mason / Bricklayer</option>
                          <option value="Generator Repair">Generator Repair</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className={`error-msg ${errors.craft ? "visible" : ""}`}>{errors.craft}</div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="form-group" style={{ gridColumn: role === "customer" ? "span 2" : "auto" }}>
                    <label htmlFor="location">Your LGA / Area</label>
                    <div className="input-wrap">
                      <span className="input-icon">📍</span>
                      <input
                        type="text"
                        id="location"
                        placeholder="e.g. Abeokuta, Ogun"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className={errors.location ? "error-input" : ""}
                      />
                    </div>
                    <div className={`error-msg ${errors.location ? "visible" : ""}`}>{errors.location}</div>
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="password">Create a password</label>
                  <div className="input-wrap">
                    <span className="input-icon">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={errors.password ? "error-input" : ""}
                    />
                    <button
                      className="eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                      aria-label="Toggle password"
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                  <div className={`error-msg ${errors.password ? "visible" : ""}`}>{errors.password}</div>
                </div>

                {/* Confirm password */}
                <div className="form-group">
                  <label htmlFor="confirm">Confirm password</label>
                  <div className="input-wrap">
                    <span className="input-icon">🔒</span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm"
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={errors.confirmPassword ? "error-input" : ""}
                    />
                    <button
                      className="eye-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      type="button"
                      aria-label="Toggle confirm password"
                    >
                      {showConfirmPassword ? "🙈" : "👁"}
                    </button>
                  </div>
                  <div className={`error-msg ${errors.confirmPassword ? "visible" : ""}`}>{errors.confirmPassword}</div>
                </div>

                {/* Terms Checkbox */}
                <div className="terms-row">
                  <div
                    className={`custom-check ${terms ? "checked" : ""}`}
                    id="terms-check"
                    onClick={() => setTerms(!terms)}
                    role="checkbox"
                    aria-checked={terms}
                    tabIndex={0}
                  ></div>
                  <div className="terms-label" onClick={() => setTerms(!terms)}>
                    I agree to SettleAm's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                  </div>
                </div>
                <div className={`error-msg ${errors.terms ? "visible" : ""}`} style={{ marginTop: "-10px", marginBottom: "14px" }}>
                  {errors.terms}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className={`btn-signup ${loading ? "loading" : ""}`}
                  id="signup-btn"
                  disabled={loading}
                >
                  <span className="btn-text">
                    {role === "customer" ? "Create My Customer Account →" : "Create My Artisan Account →"}
                  </span>
                </button>
              </form>

              <div className="login-row">
                Already have an account? <Link href="/login">Log in here</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <div className={`toast ${showToast ? "show" : ""}`} id="toast">
        {toastMessage}
      </div>
    </>
  );
}
