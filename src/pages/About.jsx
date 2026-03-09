import React, { useEffect, useRef, useState } from "react";
import { Shield, Target, Lock, Users, BookOpen, Award, Mic, Globe, ChevronDown, ChevronUp, Activity } from "lucide-react";

/* Animated Counter */
function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const triggered = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          let start = 0;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return [count, ref];
}

function StatCard({ numericValue, suffix, label }) {
  const [count, ref] = useCountUp(numericValue);

  return (
    <div
      ref={ref}
      className="bg-surface-elevated border border-surface-border rounded-2xl p-5 text-center hover:border-primary/40 transition-all"
    >
      <div className="font-display text-3xl text-primary mb-1">
        {count}
        {suffix}
      </div>
      <div className="font-body text-xs text-text-muted uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

export default function About() {
  const [expanded, setExpanded] = useState(false);
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
        p.x += p.vx;
        p.y += p.vy;

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
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(0,212,255,${0.1 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      raf = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="min-h-screen bg-surface text-text-primary overflow-hidden">

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-24 pb-16">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-surface-card border border-primary/30 rounded-full px-5 py-2 mb-8">
            <Activity className="w-3 h-3 text-primary flex-shrink-0" />
            <span className="font-mono text-xs text-primary tracking-wider uppercase whitespace-nowrap">
              Intelligence Platform · Est. 2026
            </span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-none mb-6 tracking-wider">
            ABOUT <span className="text-primary">US</span>
          </h1>

          <p className="font-body text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            A specialized intelligence platform built for law enforcement agencies
            to conduct covert digital surveillance operations with precision and legality.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-24">

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          <StatCard numericValue={2400} suffix="+" label="Verified Officers" />

          <StatCard numericValue={18} suffix="" label="States Covered" />

          {/* Mobile centered */}
          <div className="col-span-2 md:col-span-1 flex justify-center md:block">
            <div className="w-full md:w-auto max-w-sm">
              <StatCard numericValue={100} suffix="%" label="Legal Compliant" />
            </div>
          </div>

        </div>

        {/* Purpose Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Target className="w-6 h-6" />,
              title: "Our Mission",
              desc: "Empower law enforcement with cutting-edge tracking technology."
            },
            {
              icon: <Lock className="w-6 h-6" />,
              title: "Our Commitment",
              desc: "Every tool adheres to IT Act 2000 and CrPC guidelines."
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: "Our Users",
              desc: "Serving over 2,400 verified police officers across India."
            }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-surface-elevated border border-surface-border rounded-2xl p-6 hover:border-primary/40 transition-all"
            >
              <div className="text-primary mb-4">{item.icon}</div>
              <h3 className="font-display text-xl mb-2">{item.title}</h3>
              <p className="text-sm text-text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display text-lg tracking-widest text-text-primary">
              TRAX<span className="text-primary">ELON</span>
            </span>
          </div>

          <p className="font-body text-xs text-text-muted">
            © 2026 Traxelon. Authorized law enforcement use only.
          </p>

          <div className="flex gap-6">
            <a href="/" className="text-xs hover:text-primary">Home</a>
            <a href="/contact" className="text-xs hover:text-primary">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
