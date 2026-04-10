import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Shield, Zap, Eye, Lock, Globe, ChevronRight, Activity } from "lucide-react";

const statsConfig = [
  { rawValue: 2400,  display: (n) => `${n.toLocaleString()}+`, label: "Active Officers" },
  { rawValue: 18900, display: (n) => `${n.toLocaleString()}+`, label: "Suspects Tracked" },
  { rawValue: 94,    display: (n) => `${n}%`,                  label: "Case Closure Rate" },
  { rawValue: 2,     display: () => `< 2S`,                    label: "Capture Speed", noCount: true },
];

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setHasStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!hasStarted) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [hasStarted, target, duration]);
  return { count, ref };
}

function StatCard({ rawValue, display, label, noCount }) {
  const { count, ref } = useCountUp(rawValue, 2000);
  return (
    <div ref={ref} className="bg-surface-card border border-surface-border rounded-xl p-4">
      <div className="font-display text-3xl text-primary">
        {noCount ? display() : display(count)}
      </div>
      <div className="font-body text-xs text-text-muted mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

// ── TERMINAL LINES ─────────────────────────────────────────────────────────
// type: "cmd" | "info" | "success" | "warn" | "error" | "progress" | "blank"
// pause: extra ms to wait after this line (default LINE_PAUSE)
const LINES = [
  { c: "text-cyan-400",   t: '$ traxelon --generate-link --case "Suspect-047"' },
  { c: "text-slate-400",  t: "→ Initialising secure channel..." },
  { c: "text-slate-400",  t: "→ Generating disguised tracking link..." },
  { c: "text-green-400",  t: "✓ Link created: https://traxelon.com/t/x9k2p8r..." },
  { c: "text-slate-400",  t: "→ Encrypting payload with AES-256..." },
  { c: "text-green-400",  t: "✓ Payload encrypted. Link armed." },
  // progress bar line — special
  { c: "text-cyan-400",   t: "PROGRESS", special: "progress" },
  { c: "text-cyan-400",   t: '$ traxelon --monitor --case "Suspect-047"' },
  { c: "text-slate-400",  t: "→ Listening on endpoint..." },
  { c: "text-slate-400",  t: "→ Waiting for target to open link..." },
  // scanning animation
  { c: "text-yellow-400", t: "SCANNING", special: "scanning" },
  { c: "text-yellow-400", t: "⚠  Connection received — capturing data..." },
  { c: "text-green-400",  t: "✓ IP captured: 49.36.xx.xx" },
  { c: "text-green-400",  t: "✓ Location: Mangaluru, Karnataka, India" },
  { c: "text-green-400",  t: "✓ Device: Android Mobile — Chrome v124" },
  { c: "text-green-400",  t: "✓ ISP: Bharti Airtel Ltd." },
  { c: "text-green-400",  t: "✓ GPS: 12.8698°N, 74.8431°E  ±18m" },
  { c: "text-green-400",  t: "✓ RAM: 6GB  CPU Cores: 8  Battery: 74%" },
  { c: "text-green-400",  t: "✓ Network: 4G LTE  Downlink: 18.4 Mbps" },
  { c: "text-cyan-400",   t: '$ traxelon --export --case "Suspect-047"' },
  { c: "text-slate-400",  t: "→ Packaging evidence bundle..." },
  // export progress
  { c: "text-cyan-400",   t: "EXPORT", special: "export" },
  { c: "text-green-400",  t: "✓ Evidence package ready for download" },
  { c: "text-cyan-400",   t: "$ _" },
];

const CHAR_DELAY  = 12;   // ms per character — fast
const LINE_PAUSE  = 160;  // ms between lines
const END_PAUSE   = 1200; // ms before loop

// ── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ label = "Uploading", onDone }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v += Math.random() * 14 + 4;
      if (v >= 100) { v = 100; setPct(100); clearInterval(t); setTimeout(onDone, 200); }
      else setPct(Math.floor(v));
    }, 60);
    return () => clearInterval(t);
  }, []);
  const filled = Math.round(pct / 5); // out of 20 chars
  const bar = "█".repeat(filled) + "░".repeat(20 - filled);
  return (
    <div className="text-cyan-400 font-mono text-xs">
      {label} [{bar}] {pct}%
    </div>
  );
}

// ── SCANNING ANIMATION ────────────────────────────────────────────────────────
function ScanningLine({ onDone }) {
  const frames = ["[■□□□□□□□□□]", "[■■□□□□□□□□]", "[■■■□□□□□□□]", "[■■■■□□□□□□]",
                  "[■■■■■□□□□□]", "[■■■■■■□□□□]", "[■■■■■■■□□□]", "[■■■■■■■■□□]",
                  "[■■■■■■■■■□]", "[■■■■■■■■■■]"];
  const [fi, setFi] = useState(0);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i >= frames.length) { clearInterval(t); setTimeout(onDone, 150); return; }
      setFi(i);
    }, 80);
    return () => clearInterval(t);
  }, []);
  return <div className="text-yellow-400 font-mono text-xs">⟳ Scanning target device... {frames[fi]}</div>;
}

// ── EXPORT PROGRESS ───────────────────────────────────────────────────────────
function ExportBar({ onDone }) {
  return <ProgressBar label="Exporting evidence" onDone={onDone} />;
}

// ── LIVE TERMINAL ─────────────────────────────────────────────────────────────
function LiveTerminal() {
  const [done, setDone]       = useState([]);
  const [current, setCurrent] = useState("");
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [cursor, setCursor]   = useState(true);
  const [specialActive, setSpecialActive] = useState(false);
  const bodyRef = useRef(null);

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setCursor(v => !v), 480);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [done, current, specialActive]);

  // Advance to next line
  function advance() {
    setSpecialActive(false);
    setCurrent("");
    setLineIdx(i => i + 1);
    setCharIdx(0);
  }

  // Main engine
  useEffect(() => {
    if (lineIdx >= LINES.length) {
      const t = setTimeout(() => {
        setDone([]); setCurrent(""); setLineIdx(0); setCharIdx(0); setSpecialActive(false);
      }, END_PAUSE);
      return () => clearTimeout(t);
    }

    const line = LINES[lineIdx];

    // Special animated lines — render component, wait for onDone
    if (line.special) {
      setSpecialActive(true);
      return; // engine pauses; advance() called by the component's onDone
    }

    if (charIdx < line.t.length) {
      const t = setTimeout(() => {
        setCurrent(p => p + line.t[charIdx]);
        setCharIdx(c => c + 1);
      }, CHAR_DELAY);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setDone(p => [...p, { c: line.c, t: line.t }]);
        setCurrent(""); setLineIdx(i => i + 1); setCharIdx(0);
      }, LINE_PAUSE);
      return () => clearTimeout(t);
    }
  }, [lineIdx, charIdx, specialActive]);

  const activeLine = LINES[lineIdx];

  return (
    <div className="bg-black border border-surface-border rounded-xl overflow-hidden flex flex-col h-full"
         style={{ boxShadow: "0 0 30px rgba(0,212,255,0.08)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-card flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="font-mono text-xs text-slate-500 tracking-widest uppercase ml-3">
            Traxelon Console — Live Feed
          </span>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-xs text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        className="flex-1 p-5 font-mono text-xs overflow-y-auto space-y-1.5"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Committed lines */}
        {done.map((line, i) => (
          <div key={i} className={`${line.c} leading-5`}
               style={{ animation: "termFadeIn 0.15s ease-out" }}>
            {line.t}
          </div>
        ))}

        {/* Special animated component */}
        {specialActive && activeLine?.special === "progress" && (
          <ProgressBar label="Uploading link config" onDone={() => {
            setSpecialActive(false);
            setDone(p => [...p, { c: "text-cyan-400", t: "✓ Upload complete" }]);
            advance();
          }} />
        )}
        {specialActive && activeLine?.special === "scanning" && (
          <ScanningLine onDone={() => {
            setSpecialActive(false);
            advance();
          }} />
        )}
        {specialActive && activeLine?.special === "export" && (
          <ExportBar onDone={() => {
            setSpecialActive(false);
            setDone(p => [...p, { c: "text-cyan-400", t: "✓ Bundle compressed: 4.2 MB" }]);
            advance();
          }} />
        )}

        {/* Currently typing line */}
        {!specialActive && lineIdx < LINES.length && (
          <div className={`${activeLine?.c || "text-slate-400"} leading-5`}>
            {current}
            <span
              className="inline-block w-[7px] h-[13px] bg-current ml-[1px] align-middle rounded-sm"
              style={{ opacity: cursor ? 1 : 0 }}
            />
          </div>
        )}

        {/* Idle cursor while restarting */}
        {!specialActive && lineIdx >= LINES.length && (
          <div className="text-cyan-400">
            <span className="inline-block w-[7px] h-[13px] bg-current rounded-sm"
                  style={{ opacity: cursor ? 1 : 0 }} />
          </div>
        )}
      </div>

      {/* Scan-line overlay */}
      <style>{`
        @keyframes termFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanLine {
          0%   { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}

// ── HOME PAGE ─────────────────────────────────────────────────────────────────
export default function Home() {
  const { currentUser } = useAuth();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
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

  const steps = [
    { num: "01", title: "Create Officer Account",
      desc: "Register with your badge ID and department. You'll receive 1 free credit to generate your first tracking link." },
    { num: "02", title: "Generate Tracking Link",
      desc: "A Traxelon tracking link is created instantly that redirects to any URL you choose." },
    { num: "03", title: "Send Link to Suspect",
      desc: "Share the link via WhatsApp, SMS or email. The suspect sees a normal webpage — completely unaware they're being tracked." },
    { num: "04", title: "Capture Device Intelligence",
      desc: "The moment they click, their IP, GPS location, device, browser, OS and ISP are silently captured." },
  ];

  return (
    <div className="min-h-screen bg-surface text-text-primary overflow-hidden">

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-24">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 animate-scan-line pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-surface-card border border-primary/30 rounded-full px-5 py-2 mb-8">
            <Activity className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="font-mono text-xs text-primary tracking-wider uppercase whitespace-nowrap">
              Law Enforcement Intelligence Tool
            </span>
          </div>

          <h1 className="font-display text-7xl md:text-9xl text-text-primary leading-none mb-6 tracking-wider">
            TRACK.<br />
            <span className="text-primary" style={{ textShadow: "0 0 40px rgba(0,212,255,0.5)" }}>
              CAPTURE.
            </span><br />
            CLOSE.
          </h1>

          <p className="font-body text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Traxelon gives law enforcement officers a covert link-based tracking system.
            Generate a disguised link, send it to a suspect — and get their full device
            intelligence the moment they click.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {currentUser ? (
              <Link to="/dashboard"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-surface font-body font-bold rounded-lg text-base hover:bg-primary-dark transition-all shadow-glow hover:shadow-glow-strong">
                Go to Dashboard
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link to="/signup"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-surface font-body font-bold rounded-lg text-base hover:bg-primary-dark transition-all shadow-glow hover:shadow-glow-strong">
                  Register as Officer
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 border border-surface-border text-text-secondary rounded-lg font-body text-base hover:border-primary hover:text-primary transition-all">
                  Officer Login
                </Link>
              </>
            )}
          </div>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {statsConfig.map((s) => <StatCard key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl text-text-primary tracking-wider mb-4">
              HOW IT <span className="text-primary">WORKS</span>
            </h2>
            <p className="font-body text-text-secondary max-w-xl mx-auto">
              Built exclusively for law enforcement. Follow these steps to track a suspect using Traxelon.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Steps */}
            <div className="flex flex-col justify-between">
              {steps.map((step, i) => (
                <div key={i}
                  className="flex gap-6 p-6 border-b border-surface-border hover:bg-surface-card transition-all cursor-pointer group flex-1">
                  <div className="font-display text-4xl text-primary/30 group-hover:text-primary transition-colors leading-none flex-shrink-0 w-12">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-text-primary tracking-wide mb-1 group-hover:text-primary transition-colors">
                      {step.title}
                    </h3>
                    <p className="font-body text-sm text-text-secondary leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Terminal */}
            <LiveTerminal />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pt-4 pb-10 px-10">
        <div className="max-w-3xl mx-auto text-center bg-surface-elevated border border-surface-border rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient opacity-50" />
          <div className="relative z-10">
            <Shield className="w-16 h-16 text-primary mx-auto mb-6 animate-float" />
            <h2 className="font-display text-4xl md:text-5xl text-text-primary tracking-wider mb-4">
              JOIN THE FORCE.<br />
              <span className="text-primary">START TRACKING.</span>
            </h2>
            <p className="font-body text-text-secondary mb-8">
              Sign up as a verified officer and receive 1 free credit to generate
              your first tracking link. Upgrade anytime for continued access.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-surface-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display text-lg tracking-widest text-text-primary">
              TRAX<span className="text-primary">ELON</span>
            </span>
          </div>
          <p className="font-body text-xs text-text-muted">
            © 2026 Traxelon · A project of{" "}
            <a href="https://www.torsecure.com/" target="_blank" rel="noreferrer"
              className="font-body text-xs text-text-muted hover:text-primary transition-colors">
              TorSecure
            </a>.
          </p>
          <div className="flex gap-6">
            <Link to="/about" className="font-body text-xs text-text-muted hover:text-primary transition-colors">About</Link>
            <Link to="/contact" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Contact</Link>
            <Link to="/terms" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Terms and Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
