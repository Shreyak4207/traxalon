import React, { useRef, useEffect, useState } from "react";
import { Mail, Phone, MapPin, Send, Shield, Activity, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", badge: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
    }));
    let raf;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${p.alpha})`;
        ctx.fill();
      });
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,212,255,${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }
  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  const LAT = 12.86754;
  const LON = 74.84250;
  const MAPS_URL = `https://www.google.com/maps?q=SurePass+Academy+Mangalore&ll=${LAT},${LON}&z=17`;

  return (
    <div className="min-h-screen bg-surface text-text-primary overflow-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-[45vh] flex items-center justify-center pt-24 pb-12">
        {/* Background layers — all behind z-0 */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" style={{ zIndex: 2 }} />
        {/* Scan line — BEHIND text using z-index 3, text is z-10 */}
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 animate-scan-line pointer-events-none" style={{ zIndex: 3 }} />

        {/* Content — always on top */}
        <div className="relative max-w-5xl mx-auto px-6 text-center" style={{ zIndex: 10 }}>
          <div className="inline-flex items-center gap-2 bg-surface-card border border-primary/30 rounded-full px-5 py-2 mb-8">
            <Activity className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="font-mono text-xs text-primary tracking-wider uppercase whitespace-nowrap">
              Support · Mon–Sat · 9AM–6PM IST
            </span>
          </div>
          <h1 className="font-display text-7xl md:text-9xl text-text-primary leading-none mb-6 tracking-wider">
            CONTACT<br />
            <span className="text-primary" style={{ textShadow: "0 0 40px rgba(0,212,255,0.5)" }}>
              US.
            </span>
          </h1>
          <p className="font-body text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
            For technical support, new registrations, or partnership inquiries.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-5 gap-8">

          {/* ── Left ── */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 space-y-5">
              <h3 className="font-display text-xl tracking-wider text-text-primary">
                GET IN <span className="text-primary">TOUCH</span>
              </h3>
              {[
                { icon: <Mail className="w-5 h-5" />, label: "Email", value: "educatorananth@gmail.com", href: "mailto:educatorananth@gmail.com" },
                { icon: <Phone className="w-5 h-5" />, label: "Hotline", value: "+91 8951511111", href: "tel:+918951511111" },
                { icon: <MapPin className="w-5 h-5" />, label: "Office", value: "SurePass Academy, #7-9, II Floor, Manasa Towers, MG Road, Mangalore 575003", href: MAPS_URL },
              ].map((item, i) => (
                <a key={i} href={item.href} target={i === 2 ? "_blank" : undefined} rel="noreferrer"
                  className="flex items-start gap-3 group hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-all">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-body text-xs text-text-muted uppercase tracking-wider">{item.label}</div>
                    <div className="font-body text-sm text-text-primary mt-0.5">{item.value}</div>
                  </div>
                </a>
              ))}
            </div>

            {/* ── Map ── */}
            <div className="bg-surface-elevated border border-primary/20 rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-mono text-xs text-primary uppercase tracking-wider">Live Location</span>
                </div>
                <a href={MAPS_URL} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-text-muted hover:text-primary transition-colors">
                  <ExternalLink className="w-3 h-3" /> Open Maps
                </a>
              </div>

              <div className="relative mx-4 mb-4 rounded-xl overflow-hidden border border-surface-border" style={{ height: 220 }}>
                <iframe
                  title="SurePass Academy Location"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ filter: "invert(90%) hue-rotate(180deg) saturate(0.7) brightness(0.85)" }}
                  src={`https://maps.google.com/maps?q=SurePass+Academy+Mangalore&ll=${LAT},${LON}&z=17&output=embed`}
                  allowFullScreen
                />
              </div>

              <a href={MAPS_URL} target="_blank" rel="noreferrer"
                className="mx-4 mb-4 flex items-center justify-between bg-surface border border-surface-border hover:border-primary/40 rounded-xl px-4 py-3 group transition-all">
                <div>
                  <p className="font-body text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">SurePass Academy</p>
                  <p className="font-mono text-xs text-text-muted mt-0.5">{LAT}°N, {LON}°E · Mangalore, KA</p>
                </div>
                <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary/20 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </a>
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="md:col-span-3">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
              <h3 className="font-display text-xl tracking-wider text-text-primary mb-6">
                SEND A <span className="text-primary">MESSAGE</span>
              </h3>
              {sent ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="font-display text-2xl text-primary tracking-wider mb-2">MESSAGE SENT</h3>
                  <p className="font-body text-text-secondary">We'll respond to your query within 24 working hours.</p>
                  <button onClick={() => setSent(false)}
                    className="mt-6 px-6 py-2.5 border border-surface-border rounded-lg font-body text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors">
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormInput label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="Officer Name" required />
                    <FormInput label="Badge ID" name="badge" value={form.badge} onChange={handleChange} placeholder="KA-2024-001" />
                  </div>
                  <FormInput label="Official Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="officer@police.gov.in" required />
                  <FormInput label="Subject" name="subject" value={form.subject} onChange={handleChange} placeholder="Technical issue / New registration / Other" required />
                  <div>
                    <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">Message</label>
                    <textarea name="message" value={form.message} onChange={handleChange} rows={5} required
                      placeholder="Describe your issue or query..."
                      className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none" />
                  </div>

                  <button type="submit"
                    className="w-full px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> Send Message
                  </button>

                  {/* Security note below button */}
                  <div className="flex items-start gap-3 bg-surface border border-surface-border rounded-xl px-4 py-3">
                    <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="font-body text-xs text-text-muted leading-relaxed">
                      All communications are encrypted and logged for security purposes.
                      Please use your official government email when contacting us.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-border py-8 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display text-lg tracking-widest text-text-primary">
              TRAX<span className="text-primary">ELON</span>
            </span>
          </div>
          <p className="font-body text-xs text-text-muted">© 2026 Traxelon. Authorized law enforcement use only.</p>
          <div className="flex gap-6">
            <Link to="/" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Home</Link>
            <Link to="/about" className="font-body text-xs text-text-muted hover:text-primary transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FormInput({ label, name, type = "text", value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
    </div>
  );
}