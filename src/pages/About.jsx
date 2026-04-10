import React, { useEffect, useRef, useState } from "react";
import {
  Shield, Target, Lock, Users, BookOpen, Award, Mic, Globe,
  ChevronDown, ChevronUp, Activity, Zap, Layers, Search,
  Network, Cpu, Eye, Database, GitBranch, Fingerprint,
  ScanLine, RadioTower, MapPin, Wifi, FileSearch, Crosshair, Route
} from "lucide-react";

/* ─── Animated Counter ─── */
function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const triggered = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !triggered.current) {
        triggered.current = true;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return [count, ref];
}

function StatCard({ numericValue, suffix, label }) {
  const [count, ref] = useCountUp(numericValue);
  return (
    <div ref={ref}
      className="bg-surface-elevated border border-surface-border rounded-2xl p-5 text-center"
      style={{ transition: "border-color 0.3s, box-shadow 0.3s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.45)"; e.currentTarget.style.boxShadow = "0 0 24px 2px rgba(0,212,255,0.13)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = "none"; }}>
      <div className="font-display text-3xl text-primary mb-1">{count}{suffix}</div>
      <div className="font-body text-xs text-text-muted uppercase tracking-wider">{label}</div>
    </div>
  );
}

function GlowStyles() {
  return (
    <style>{`
      @keyframes glowPulse {
        0%,100%{box-shadow:0 0 8px 1px rgba(0,212,255,0.18);}
        50%{box-shadow:0 0 22px 5px rgba(0,212,255,0.35),0 0 40px 10px rgba(0,212,255,0.08);}
      }
      @keyframes glowBorder {
        0%,100%{border-color:rgba(0,212,255,0.18);}
        50%{border-color:rgba(0,212,255,0.5);}
      }
      @keyframes fadeSlideUp {
        from{opacity:0;transform:translateY(22px);}
        to{opacity:1;transform:translateY(0);}
      }
      @keyframes waveShimmer {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
      @keyframes iconPing {
        0%,100%{ box-shadow: 0 0 0 0 rgba(0,212,255,0); }
        50%    { box-shadow: 0 0 0 4px rgba(0,212,255,0.12); }
      }
      .glow-pulse{animation:glowPulse 3s ease-in-out infinite;}
      .glow-border{animation:glowBorder 2.8s ease-in-out infinite;}
      .fade-up{animation:fadeSlideUp 0.65s ease forwards;opacity:0;}

      .card-lift{transition:border-color 0.3s,box-shadow 0.3s,transform 0.22s;}
      .card-lift:hover{border-color:rgba(0,212,255,0.45)!important;box-shadow:0 0 30px 4px rgba(0,212,255,0.13),0 6px 28px rgba(0,0,0,0.18)!important;transform:translateY(-3px);}

      .tx-letter {
        display: inline-block;
        font-family: inherit;
        color: #00d4ff;
        cursor: default;
        transition: color 0.2s, text-shadow 0.2s, transform 0.2s;
        text-shadow: 0 0 18px rgba(0,212,255,0.35);
      }
      .tx-letter:hover, .tx-letter.tx-active {
        color: #ffffff;
        transform: scale(1.18) translateY(-3px);
        text-shadow:
          0 0 12px rgba(0,212,255,1),
          0 0 30px rgba(0,212,255,0.8),
          0 0 60px rgba(0,212,255,0.5),
          0 0 90px rgba(0,212,255,0.25);
      }
      .tx-dot {
        display: inline-block;
        color: rgba(0,212,255,0.18);
        margin: 0 6px;
      }

      .word-tag {
        display: inline-block;
        font-size: 11px;
        font-family: var(--font-mono, monospace);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #00d4ff;
        border: 1px solid rgba(0,212,255,0.35);
        border-radius: 999px;
        padding: 4px 14px;
        background: rgba(0,212,255,0.06);
        transition: background 0.2s, border-color 0.2s;
      }
      .word-tag:hover {
        background: rgba(0,212,255,0.14);
        border-color: rgba(0,212,255,0.6);
      }
      .word-tag-link {
        display: inline-block;
        font-size: 11px;
        font-family: var(--font-mono, monospace);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #00d4ff;
        border: 1px solid rgba(0,212,255,0.35);
        border-radius: 999px;
        padding: 4px 14px;
        background: rgba(0,212,255,0.06);
        transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
        text-decoration: none;
        cursor: pointer;
      }
      .word-tag-link:hover {
        background: rgba(0,212,255,0.18);
        border-color: rgba(0,212,255,0.7);
        box-shadow: 0 0 12px rgba(0,212,255,0.25);
        color: #fff;
      }

      .origin-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(0,212,255,0.15);
        border-radius: 16px;
        padding: 28px;
        flex: 1;
        transition: border-color 0.3s, box-shadow 0.3s, background 0.3s;
        display: flex;
        flex-direction: column;
      }
      .origin-card:hover {
        border-color: rgba(0,212,255,0.4);
        box-shadow: 0 0 32px rgba(0,212,255,0.1);
        background: rgba(0,212,255,0.04);
      }

      /* TRAX capability icon tile */
      .trax-icon-tile {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 16px 8px;
        border: 1px solid rgba(0,212,255,0.14);
        border-radius: 12px;
        background: rgba(0,212,255,0.04);
        color: #00d4ff;
        cursor: default;
        transition: border-color 0.25s, background 0.25s, box-shadow 0.25s, transform 0.2s;
        animation: iconPing 4s ease-in-out infinite;
      }
      .trax-icon-tile:nth-child(2) { animation-delay: 0.5s; }
      .trax-icon-tile:nth-child(3) { animation-delay: 1s; }
      .trax-icon-tile:nth-child(4) { animation-delay: 1.5s; }
      .trax-icon-tile:nth-child(5) { animation-delay: 2s; }
      .trax-icon-tile:nth-child(6) { animation-delay: 2.5s; }
      .trax-icon-tile:hover {
        border-color: rgba(0,212,255,0.5);
        background: rgba(0,212,255,0.12);
        box-shadow: 0 0 18px rgba(0,212,255,0.18), inset 0 0 12px rgba(0,212,255,0.06);
        transform: translateY(-2px) scale(1.04);
        animation: none;
      }
      .trax-icon-label {
        font-size: 9px;
        font-family: var(--font-mono, monospace);
        color: rgba(255,255,255,0.3);
        letter-spacing: 0.1em;
        text-transform: uppercase;
        transition: color 0.2s;
      }
      .trax-icon-tile:hover .trax-icon-label { color: rgba(0,212,255,0.8); }

      .musk-banner {
        border: 1px solid rgba(0,212,255,0.2);
        border-radius: 14px;
        padding: 14px 20px;
        background: linear-gradient(105deg, rgba(0,212,255,0.05), rgba(0,212,255,0.02));
        display: flex;
        align-items: center;
        gap: 14px;
        transition: border-color 0.3s, box-shadow 0.3s;
      }
      .musk-banner:hover {
        border-color: rgba(0,212,255,0.4);
        box-shadow: 0 0 24px rgba(0,212,255,0.1);
      }

      /* Acronym rows */
      .ac-row {
        display: flex; align-items: center; gap: 20px;
        border-radius: 14px; padding: 14px 20px;
        border: 1px solid rgba(255,255,255,0.05);
        background: rgba(255,255,255,0.02);
        transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        cursor: default; position: relative; overflow: hidden;
      }
      .ac-row:hover, .ac-row.ac-active {
        border-color: rgba(0,212,255,0.35);
        background: linear-gradient(105deg,rgba(0,212,255,0.08),rgba(0,212,255,0.03));
        box-shadow: 0 0 22px rgba(0,212,255,0.08), inset 0 0 20px rgba(0,212,255,0.03);
      }
      .ac-row .ac-bar {
        position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
        background: linear-gradient(180deg,transparent,#00d4ff,transparent);
        opacity: 0; transform: scaleY(0);
        transition: opacity 0.25s, transform 0.25s;
      }
      .ac-row:hover .ac-bar, .ac-row.ac-active .ac-bar { opacity: 1; transform: scaleY(1); }
      .ac-badge {
        width: 44px; height: 44px; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; font-weight: 700;
        border: 2px solid rgba(0,212,255,0.2);
        background: rgba(0,212,255,0.06);
        color: #00d4ff; flex-shrink: 0;
        transition: border-color 0.25s, background 0.25s, box-shadow 0.25s, color 0.25s, transform 0.25s;
      }
      .ac-row:hover .ac-badge, .ac-row.ac-active .ac-badge {
        border-color: #00d4ff; background: rgba(0,212,255,0.2);
        color: #fff; transform: scale(1.08);
        box-shadow: 0 0 18px rgba(0,212,255,0.4), inset 0 0 10px rgba(0,212,255,0.1);
      }
      .ac-num { font-family: var(--font-mono,monospace); font-size:10px; color:rgba(255,255,255,0.12); width:20px; flex-shrink:0; text-align:center; transition:color 0.25s; }
      .ac-row:hover .ac-num, .ac-row.ac-active .ac-num { color: rgba(0,212,255,0.6); }
      .ac-word { font-size:18px; letter-spacing:0.14em; color:#c8dff0; transition:color 0.25s; }
      .ac-row:hover .ac-word, .ac-row.ac-active .ac-word { color: #00d4ff; }
      .ac-desc { font-size:12px; color:rgba(255,255,255,0.25); line-height:1.55; transition:color 0.25s; }
      .ac-row:hover .ac-desc, .ac-row.ac-active .ac-desc { color: #7aa8c4; }
    `}</style>
  );
}

const ACRONYM_ROWS = [
  { letter: "T", word: "Tactical",    desc: "Precision-driven operations using real-time digital intelligence and covert methodology." },
  { letter: "R", word: "Recovery",    desc: "Retrieval and reconstruction of digital evidence from complex cyber environments." },
  { letter: "A", word: "Analytics",   desc: "Deep-dive forensic data analysis, pattern recognition, and behavioural intelligence." },
  { letter: "X", word: "eXchange",    desc: "Secure inter-agency intelligence sharing protocols with end-to-end encryption." },
  { letter: "E", word: "Enforcement", desc: "Lawful application of cyber tools across all enforcement jurisdictions in India." },
  { letter: "L", word: "Law",         desc: "Full compliance with IT Act 2000, BNSS, and judicial oversight frameworks." },
  { letter: "O", word: "Oriented",    desc: "Mission-oriented deployment engineered for maximum investigative impact." },
  { letter: "N", word: "Networks",    desc: "Interconnected digital infrastructure enabling nationwide coverage and coordination." },
];

/* TRAX capability icons — tracking/trace themed */
const TRAX_ICONS = [
  // { icon: <Fingerprint style={{ width: 20, height: 20 }} />, label: "Fingerprint" },
  // { icon: <ScanLine    style={{ width: 20, height: 20 }} />, label: "Scan" },
  // { icon: <MapPin      style={{ width: 20, height: 20 }} />, label: "Locate" },
  { icon: <Crosshair   style={{ width: 20, height: 20 }} />, label: "Target" },
  { icon: <Route       style={{ width: 20, height: 20 }} />, label: "Trace" },
  { icon: <FileSearch  style={{ width: 20, height: 20 }} />, label: "Forensic" },
];

function activateRow(i)      { document.getElementById(`ac-row-${i}`)?.classList.add("ac-active"); }
function deactivateRow(i)    { document.getElementById(`ac-row-${i}`)?.classList.remove("ac-active"); }
function activateLetter(i)   { document.querySelectorAll(".tx-letter")[i]?.classList.add("tx-active"); }
function deactivateLetter(i) { document.querySelectorAll(".tx-letter")[i]?.classList.remove("tx-active"); }

function NameSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true);
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── TRAX + ELON cards ── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>

        {/* TRAX card */}
        <div className="origin-card">
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div className="glow-pulse" style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00d4ff", flexShrink: 0 }}>
              <Search style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div className="font-display" style={{ fontSize: 44, lineHeight: 1, letterSpacing: "0.06em", color: "#00d4ff", textShadow: "0 0 20px rgba(0,212,255,0.4)" }}>TRAX</div>
              <div className="font-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>/træks/</div>
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {["Trace", "Tracking", "Trajectory"].map(t => <span key={t} className="word-tag">{t}</span>)}
          </div>

          {/* Description */}
          <p className="font-body" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: 20 }}>
            Represents digital traceability and forensic tracking — the investigative following of cyber footprints across dark networks, encrypted channels, and device ecosystems.
          </p>

          {/* ── TRAX Capability Icon Grid ── */}
          <div style={{ marginTop: "auto" }}>
            <div className="font-mono" style={{ fontSize: 9, color: "rgba(0,212,255,0.4)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>
              CORE CAPABILITIES
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {TRAX_ICONS.map((item, i) => (
                <div key={i} className="trax-icon-tile">
                  {item.icon}
                  <span className="trax-icon-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ELON card */}
        <div className="origin-card">
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div className="glow-pulse" style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00d4ff", flexShrink: 0, animationDelay: "0.8s" }}>
              <Layers style={{ width: 22, height: 22 }} />
            </div>
            <div>
              <div className="font-display" style={{ fontSize: 44, lineHeight: 1, letterSpacing: "0.06em", color: "#00d4ff", textShadow: "0 0 20px rgba(0,212,255,0.4)" }}>ELON</div>
              <div className="font-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>/elon/</div>
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {["Electron", "Element", "Echelon"].map(t => <span key={t} className="word-tag">{t}</span>)}
            <a href="https://en.wikipedia.org/wiki/Elon_Musk" target="_blank" rel="noreferrer" className="word-tag-link">Elon Musk</a>
          </div>

          {/* Description */}
          <p className="font-body" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.75 }}>
            Implies precision at the atomic level — layered intelligence architecture and high-level authority. The elemental building blocks of digital investigation and lawful surveillance.
          </p>

          {/* Elon Musk inspiration */}
          <div className="musk-banner" style={{ marginTop: "auto" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
            <p className="font-body" style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: 0 }}>
              We are inspired and motivated by the genius,{" "}
              <a href="https://en.wikipedia.org/wiki/Elon_Musk" target="_blank" rel="noreferrer"
                style={{ color: "#00d4ff", fontWeight: 600, textDecoration: "none", borderBottom: "1px solid rgba(0,212,255,0.4)", paddingBottom: 1, transition: "border-color 0.2s, color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#00d4ff"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#00d4ff"; e.currentTarget.style.borderColor = "rgba(0,212,255,0.4)"; }}>
                Elon Musk
              </a>.
            </p>
          </div>
        </div>
      </div>

      {/* ── Full Designation Banner ── */}
      <div className="glow-border" style={{ border: "1px solid rgba(0,212,255,0.2)", borderRadius: 16, padding: "48px 40px", textAlign: "center", background: "rgba(255,255,255,0.02)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(0,212,255,0.5),transparent)" }} />
        <div className="font-mono" style={{ fontSize: 11, letterSpacing: "0.22em", color: "rgba(0,212,255,0.5)", marginBottom: 20, textTransform: "uppercase" }}>Full Designation</div>
        <div style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 28, maxWidth: 560, margin: "0 auto 28px" }}>
          <span style={{ color: "#00d4ff", fontWeight: 600 }}>Tactical Recovery &amp; Analytics eXchange</span>
          <span style={{ color: "rgba(255,255,255,0.4)", margin: "0 8px" }}>for</span>
          <span style={{ fontWeight: 600, color: "#e2f4ff" }}>Enforcement &amp; Law‑Oriented Networks</span>
        </div>
        <div className="font-display" style={{ fontSize: "clamp(28px,5vw,56px)", letterSpacing: "0.1em", marginBottom: 28, lineHeight: 1.1 }}>
          {ACRONYM_ROWS.map((row, i) => (
            <React.Fragment key={row.letter}>
              <span className="tx-letter" onMouseEnter={() => activateRow(i)} onMouseLeave={() => deactivateRow(i)}>{row.letter}</span>
              {i < ACRONYM_ROWS.length - 1 && <span className="tx-dot">·</span>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(0,212,255,0.25)", borderRadius: 999, padding: "8px 20px", background: "rgba(0,212,255,0.06)" }}>
          <Network style={{ width: 14, height: 14, color: "#00d4ff" }} />
          <span className="font-mono" style={{ fontSize: 11, color: "#00d4ff", letterSpacing: "0.06em" }}>An advanced digital trace &amp; intelligence platform</span>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(0,212,255,0.3),transparent)" }} />
      </div>

      {/* ── Acronym Panel ── */}
      <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00d4ff", boxShadow: "0 0 8px rgba(0,212,255,0.8)", animation: "glowPulse 2s ease-in-out infinite" }} />
            <span className="font-mono" style={{ fontSize: 11, color: "#00d4ff", letterSpacing: "0.15em", textTransform: "uppercase" }}>Full Designation Decoded</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
            <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>SYSTEM ACTIVE</span>
          </div>
        </div>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {ACRONYM_ROWS.map((row, i) => (
            <div key={i} id={`ac-row-${i}`} className="ac-row"
              style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: `opacity 0.5s ${300 + i * 55}ms, transform 0.5s ${300 + i * 55}ms, border-color 0.25s, background 0.25s, box-shadow 0.25s` }}
              onMouseEnter={() => activateLetter(i)} onMouseLeave={() => deactivateLetter(i)}>
              <div className="ac-bar" />
              <div className="ac-num">{String(i + 1).padStart(2, "0")}</div>
              <div className="ac-badge font-display">{row.letter}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                  <span className="ac-word font-display">{row.word.toUpperCase()}</span>
                  <span className="ac-desc font-body" style={{ display: "inline", fontSize: 16 }}>— {row.desc}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 24px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", background: "rgba(255,255,255,0.015)" }}>
          <div className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", textTransform: "uppercase", lineHeight: 1.8 }}>
            Tactical Recovery &amp; Analytics eXchange for Enforcement &amp; Law-Oriented Networks
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(0,212,255,0.2),transparent)", margin: "12px 0" }} />
          <div className="font-body" style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
            "An advanced digital trace and intelligence platform designed for precision cyber investigation and lawful tracking."
          </div>
        </div>
      </div>
    </div>
  );
}

const CAPABILITIES = [
  { icon: <Eye style={{ width: 18, height: 18 }} />,       title: "Cyber Trace",        sub: "Follow digital footprints across encrypted networks and dark channels." },
  { icon: <Database style={{ width: 18, height: 18 }} />,  title: "Intelligence Layer", sub: "Layered analytics with real-time threat signal processing." },
  { icon: <GitBranch style={{ width: 18, height: 18 }} />, title: "Forensic Chain",     sub: "Court-admissible evidence with full, tamper-proof audit trails." },
  { icon: <Zap style={{ width: 18, height: 18 }} />,       title: "Precision Engine",   sub: "Atomic-level accuracy for complex digital investigation workflows." },
];

export default function About() {
  const [expanded, setExpanded] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
    }));
    let raf;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${p.alpha})`; ctx.fill();
      });
      particles.forEach((a, i) => particles.slice(i + 1).forEach(b => {
        const dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,212,255,${0.1 * (1 - dist / 120)})`; ctx.lineWidth = 0.5; ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-text-primary overflow-hidden">
      <GlowStyles />

      {/* ── Hero ── */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-24 pb-16">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-30 animate-scan-line pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-surface-card border border-primary/30 rounded-full px-5 py-2 mb-8">
            <Activity className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="font-mono text-xs text-primary tracking-wider uppercase whitespace-nowrap">Intelligence Platform · Est. 2026</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-none mb-6 tracking-wider">
            ABOUT <span className="text-primary" style={{ textShadow: "0 0 40px rgba(0,212,255,0.5)" }}>US</span>
          </h1>
          <p className="font-body text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            A specialized intelligence platform built for law enforcement agencies to conduct covert digital surveillance operations with precision and legality.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 space-y-24">

        {/* ── Stats ── */}
        <div className="flex flex-col items-center gap-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
            <StatCard numericValue={2400} suffix="+" label="Verified Officers" />
            <StatCard numericValue={28}   suffix=""  label="States Covered" />
            <div className="hidden md:block"><StatCard numericValue={100} suffix="%" label="Legal Compliant" /></div>
          </div>
          <div className="md:hidden w-1/2"><StatCard numericValue={100} suffix="%" label="Legal Compliant" /></div>
        </div>

        {/* ── NAME SECTION ── */}
        <div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 text-xs text-primary font-mono mb-6 tracking-widest">
              ◈ CLASSIFIED DESIGNATION · LEVEL 5
            </div>
            <h2 className="font-display text-5xl md:text-6xl tracking-wider text-text-primary mb-4">
              WHAT IS{" "}
              <span style={{
                display: "inline-block",
                background: "linear-gradient(90deg,#00d4ff 0%,#ffffff 25%,#00d4ff 50%,#7dd4fc 75%,#00d4ff 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text", animation: "waveShimmer 2.5s linear infinite",
              }}>TRAXELON</span>
            </h2>
            <p className="font-body text-text-secondary max-w-2xl mx-auto text-sm leading-relaxed">
              An advanced digital trace and intelligence platform designed for precision cyber investigation and lawful tracking of criminal networks.
            </p>
          </div>
          <NameSection />
        </div>

        {/* ── Capabilities strip ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
          {CAPABILITIES.map((c, i) => (
            <div key={i} className="card-lift text-center"
              style={{ border: "1px solid rgba(0,212,255,0.14)", background: "rgba(0,212,255,0.03)", borderRadius: 20, padding: "22px 18px" }}>
              <div className="glow-pulse"
                style={{ width: 44, height: 44, borderRadius: 14, border: "1px solid rgba(0,212,255,0.28)", background: "rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#00d4ff" }}>
                {c.icon}
              </div>
              <div className="font-display text-text-primary" style={{ fontSize: 13, letterSpacing: "0.13em", marginBottom: 6 }}>{c.title}</div>
              <div className="font-body text-text-muted" style={{ fontSize: 12, lineHeight: 1.6 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Purpose Cards ── */}
        <div>
          <div className="text-center mb-10">
            <h2 className="font-display text-5xl tracking-wider">OUR <span className="text-primary">PURPOSE</span></h2>
            <p className="font-body text-text-secondary mt-3 max-w-xl mx-auto">Built exclusively for law enforcement with strict legal compliance.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Target className="w-6 h-6" />, title: "Our Mission",    desc: "Empower law enforcement with cutting-edge tracking technology to reduce investigation time and improve case closure rates across India." },
              { icon: <Lock   className="w-6 h-6" />, title: "Our Commitment", desc: "Every tool we build adheres to the IT Act 2000 and BNSS (Bharatiya Nagarik Suraksha Sanhita) guidelines. Access is strictly limited to verified government officers with valid badge IDs." },
              { icon: <Users  className="w-6 h-6" />, title: "Our Users",      desc: "We serve over 2,400 verified police officers across 28 states, from cyber crime cells to organized crime units." },
            ].map((item, i) => (
              <div key={i} className="card-lift bg-surface-elevated border border-surface-border rounded-2xl p-6 group"
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 28px 3px rgba(0,212,255,0.12)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-all">{item.icon}</div>
                <h3 className="font-display text-xl text-text-primary tracking-wide mb-2">{item.title}</h3>
                <p className="font-body text-sm text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Curator ── */}
        <div>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-4">🎓 VISION &amp; LEADERSHIP</div>
            <h2 className="font-display text-5xl tracking-wider">MEET THE <span className="text-primary">CURATOR</span></h2>
            <p className="font-body text-sm text-text-muted mt-2">The visionary behind Traxelon's mission</p>
          </div>
          <div className="bg-surface-elevated border border-primary/20 rounded-3xl overflow-hidden glow-border">
            <div className="h-1.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-primary/40 glow-pulse">
                    <img src="/sir.jpg" alt="Dr. Ananth Prabhu G" className="w-full h-full object-cover"
                      onError={e => { e.target.parentElement.innerHTML = `<div class="w-full h-full bg-primary/10 flex items-center justify-center"><span style="font-size:56px;color:#00d4ff">A</span></div>`; }} />
                  </div>
                  <div className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-center">Curator &amp; Resource Person</div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-display text-3xl text-text-primary tracking-wide">Dr. Ananth Prabhu G</h3>
                  <p className="font-body text-primary text-sm font-semibold mt-1">B.E, MBA, MTech, DCL, PhD, Post Doctoral Fellow</p>
                  <p className="font-body text-text-muted text-sm mt-0.5">Professor &amp; Principal Investigator — Sahyadri</p>
                  <p className="font-body text-text-muted text-sm mt-0.5">Cyber Law and Security Expert — National LEA Academies</p>
                  <p className="font-body text-text-muted text-xs mt-0.5">
                    Director — <a href="https://www.torsecure.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">TorSecure Cyber LLP</a>
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                    {["Cyber Security","Digital Forensics","Cyber Law","AI & Ethics","InfoToons"].map(tag => (
                      <span key={tag} className="bg-surface border border-surface-border text-text-muted font-mono text-xs px-3 py-1 rounded-full hover:border-primary/40 hover:text-primary transition-colors">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-px bg-surface-border my-8" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: <BookOpen className="w-4 h-4" />, value: "17",     label: "Books Authored" },
                  { icon: <Globe    className="w-4 h-4" />, value: "32",     label: "Int'l Journals" },
                  { icon: <Award    className="w-4 h-4" />, value: "3",      label: "Patents Held" },
                  { icon: <Mic      className="w-4 h-4" />, value: "3,000+", label: "Lectures Delivered" },
                ].map(stat => (
                  <div key={stat.label} className="card-lift bg-surface border border-surface-border rounded-xl p-4 text-center"
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 16px 2px rgba(0,212,255,0.14)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                    <div className="flex items-center justify-center text-primary mb-2">{stat.icon}</div>
                    <div className="font-display text-2xl text-primary">{stat.value}</div>
                    <div className="font-body text-xs text-text-muted mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-surface border border-surface-border rounded-2xl p-6">
                <p className="font-body text-sm text-text-secondary leading-relaxed">
                  Dr. Ananth Prabhu G is a renowned Professor in the Department of Computer Science and Engineering and serves as the Principal Investigator at the Digital Forensics and Cyber Security Centre of Excellence at Sahyadri College of Engineering and Management. He holds a B.E., MTech, and MBA from Manipal University, a PhD from VTU, and two Post-Doctoral Research Fellowships from the University of Leicester, UK and the University of Houston Downtown, Texas.
                </p>
                {expanded && (
                  <div className="mt-4 space-y-3 text-sm text-text-secondary font-body leading-relaxed">
                    <p>He also holds a Diploma in Cyber Law from Government Law College, Mumbai. Under his guidance, four research scholars have completed their PhDs, and five are currently pursuing their doctoral studies.</p>
                    <p>Dr. Prabhu is the Director of <a href="https://www.torsecure.com/" target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">TorSecure Cyber LLP</a> and <a href="https://thesurepass.com/" target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">SurePass Academy</a>. A dynamic speaker, he has delivered over 3,000 lectures, becoming a leading voice in cyber law and forensics.</p>
                    <p>His acclaimed book <span className="text-primary font-semibold">Cyber Safe Girl v7</span> has been downloaded <span className="text-primary font-semibold">4.5 crore times</span>. A free online certification course developed in partnership with <span className="text-primary font-semibold">ISEA</span> and the <span className="text-primary font-semibold">Ministry of Electronics and IT</span> has empowered citizens across India — especially in rural areas — with cyber literacy.</p>
                  </div>
                )}
                <button onClick={() => setExpanded(!expanded)} className="mt-4 inline-flex items-center gap-1.5 text-primary font-body text-xs hover:underline transition-all">
                  {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Show less</> : <><ChevronDown className="w-3.5 h-3.5" /> Read more</>}
                </button>
              </div>
              <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
                <div className="text-4xl">📘</div>
                <div>
                  <p className="font-display text-lg text-text-primary tracking-wide">Cyber Safe Girl v7</p>
                  <p className="font-body text-sm text-text-secondary mt-0.5">
                    Downloaded <span className="text-primary font-semibold">4.5 crore times</span> · Available in multiple regional languages ·
                    Certified course in partnership with <span className="text-primary font-semibold">MeitY &amp; ISEA</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Legal Notice ── */}
        <div className="bg-surface-elevated border border-accent/20 rounded-2xl p-6 mb-16">
          <h3 className="font-display text-xl text-accent tracking-wide mb-3">⚠️ Legal Notice</h3>
          <p className="font-body text-sm text-text-secondary leading-relaxed">
            Traxelon is intended solely for use by authorized law enforcement personnel in the performance of official duties. Unauthorized use of this tool to track individuals without proper legal authorization constitutes a violation of the IT Act 2000, Section 66 (Computer Related Offences) and may result in criminal prosecution. All activity on this platform is logged and auditable by senior officials.
          </p>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-border py-8 px-6 mt-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display text-lg tracking-widest text-text-primary">TRAX<span className="text-primary">ELON</span></span>
          </div>
          <p className="font-body text-xs text-text-muted">
            © 2026 Traxelon · A project of <a href="https://www.torsecure.com/" target="_blank" rel="noreferrer" className="font-body text-xs text-text-muted hover:text-primary transition-colors">TorSecure</a>.
          </p>
          <div className="flex gap-6">
            <a href="/" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Home</a>
            <a href="/contact" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Contact</a>
            <a href="/terms" className="font-body text-xs text-text-muted hover:text-primary transition-colors">Terms and Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
