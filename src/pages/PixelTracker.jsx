import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Copy, CheckCircle, Eye, Globe, Mail, Plus,
  ChevronDown, ChevronUp, AlertCircle, Send, Shield, Zap
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

const EMAIL_TEMPLATES = [
  {
    name: "🔵 Google",
    fromName: "Google Security",
    fromEmail: "security@accounts.google.com",
    subject: "⚠️ Suspicious sign-in attempt on your Google Account",
    body: (pixelUrl) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f3f4;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f4;padding:40px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.12)">
<tr><td style="background:#fff;padding:32px 40px 0;text-align:center">
  <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" width="100" alt="Google" style="margin-bottom:24px" />
</td></tr>
<tr><td style="padding:0 40px 32px">
  <h2 style="color:#202124;font-size:22px;font-weight:400;margin:0 0 16px">New sign-in to your Google Account</h2>
  <p style="color:#5f6368;font-size:14px;line-height:1.6;margin:0 0 20px">We detected a new sign-in to your Google Account from an unrecognised device. To keep your account secure, we need to verify this activity.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:1px solid #dadce0;border-radius:8px;margin-bottom:24px">
  <tr><td style="padding:20px">
    <p style="margin:0 0 8px;color:#202124;font-size:14px"><strong>📱 Device:</strong> Unknown Device</p>
    <p style="margin:0 0 8px;color:#202124;font-size:14px"><strong>📍 Location:</strong> Unknown Location</p>
    <p style="margin:0;color:#202124;font-size:14px"><strong>🕐 Time:</strong> ${new Date().toLocaleString("en-IN")}</p>
  </td></tr></table>
  <p style="color:#5f6368;font-size:14px;line-height:1.6;margin:0 0 24px">If this was you, no action is needed. If you don't recognise this activity, secure your account immediately by clicking below.</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
  <tr><td style="background:#1a73e8;border-radius:4px;text-align:center">
    <a href="#" style="display:inline-block;padding:12px 32px;color:#fff;font-size:14px;font-weight:500;text-decoration:none">Check Activity</a>
  </td></tr></table>
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px">
  <tr><td style="border:1px solid #dadce0;border-radius:4px;text-align:center">
    <a href="#" style="display:inline-block;padding:12px 32px;color:#1a73e8;font-size:14px;font-weight:500;text-decoration:none">No, it wasn't me</a>
  </td></tr></table>
  <hr style="border:none;border-top:1px solid #e8eaed;margin:0 0 24px" />
  <p style="color:#9aa0a6;font-size:12px;text-align:center;margin:0">Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043</p>
  <p style="color:#9aa0a6;font-size:12px;text-align:center;margin:8px 0 0">You're receiving this email to let you know about important changes to your Google Account and services.</p>
</td></tr></table>
</td></tr></table>
<img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:block;width:1px;height:1px;border:0;visibility:hidden;position:absolute;left:-9999px" />
</body></html>`,
  },
  {
    name: "🏦 SBI Bank",
    fromName: "SBI Security",
    fromEmail: "alerts@sbi.co.in",
    subject: "🔔 URGENT: Your SBI account has been temporarily suspended",
    body: (pixelUrl) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.12)">
<tr><td style="background:#22409a;padding:24px 40px;text-align:center">
  <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:1px">STATE BANK OF INDIA</h1>
  <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:12px">Internet Banking Services</p>
</td></tr>
<tr><td style="padding:32px 40px">
  <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:16px;margin-bottom:24px">
    <p style="margin:0;color:#856404;font-size:14px;font-weight:600">⚠️ Security Alert — Immediate Action Required</p>
  </div>
  <p style="color:#333;font-size:14px;line-height:1.6;margin:0 0 12px">Dear Valued Customer,</p>
  <p style="color:#333;font-size:14px;line-height:1.6;margin:0 0 20px">We have detected <strong>multiple failed login attempts</strong> on your SBI account. As a security precaution, your account access has been <strong style="color:#d93025">temporarily suspended</strong>.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:6px;margin-bottom:24px">
  <tr><td style="padding:20px">
    <p style="margin:0 0 8px;color:#333;font-size:13px"><strong>Account Status:</strong> <span style="color:#d93025">Suspended</span></p>
    <p style="margin:0 0 8px;color:#333;font-size:13px"><strong>Reason:</strong> Suspicious Login Activity</p>
    <p style="margin:0 0 8px;color:#333;font-size:13px"><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
    <p style="margin:0;color:#333;font-size:13px"><strong>Action Required By:</strong> ${new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString("en-IN")}</p>
  </td></tr></table>
  <p style="color:#333;font-size:14px;line-height:1.6;margin:0 0 24px">Please verify your identity within <strong>48 hours</strong> to restore access. Failure to verify will result in permanent account suspension.</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
  <tr><td style="background:#22409a;border-radius:4px">
    <a href="#" style="display:inline-block;padding:14px 40px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Verify My Identity</a>
  </td></tr></table>
  <hr style="border:none;border-top:1px solid #e8eaed;margin:0 0 20px" />
  <p style="color:#666;font-size:12px;margin:0 0 4px">SBI Customer Care: <strong>1800-11-2211</strong> (Toll Free)</p>
  <p style="color:#666;font-size:12px;margin:0">Do not share your OTP, PIN or Password with anyone.</p>
</td></tr>
<tr><td style="background:#f8f9fa;padding:16px 40px;text-align:center">
  <p style="color:#999;font-size:11px;margin:0">State Bank of India. Corporate Centre, Madame Cama Road, Mumbai - 400 021</p>
</td></tr></table>
</td></tr></table>
<img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:block;width:1px;height:1px;border:0;visibility:hidden;position:absolute;left:-9999px" />
</body></html>`,
  },
  {
    name: "📱 WhatsApp",
    fromName: "WhatsApp Team",
    fromEmail: "verify@whatsapp.com",
    subject: "Your WhatsApp account has been suspended — Appeal required",
    body: (pixelUrl) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.12)">
<tr><td style="background:#25D366;padding:24px 40px;text-align:center">
  <table cellpadding="0" cellspacing="0" style="margin:0 auto">
  <tr>
    <td style="background:#fff;width:50px;height:50px;border-radius:50%;text-align:center;vertical-align:middle">
      <span style="color:#25D366;font-size:28px;line-height:50px">✓</span>
    </td>
    <td style="padding-left:12px">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">WhatsApp</h1>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:32px 40px">
  <div style="background:#fce8e6;border:1px solid #f28b82;border-radius:6px;padding:16px;margin-bottom:24px;text-align:center">
    <p style="margin:0;color:#c5221f;font-size:15px;font-weight:600">🚫 Account Suspended</p>
  </div>
  <p style="color:#333;font-size:14px;line-height:1.6;margin:0 0 16px">Hello,</p>
  <p style="color:#333;font-size:14px;line-height:1.6;margin:0 0 20px">Your WhatsApp account has been <strong>temporarily suspended</strong> due to a violation of our Terms of Service. All your messages and media have been preserved.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-left:4px solid #d93025;border-radius:0 6px 6px 0;margin-bottom:24px">
  <tr><td style="padding:16px 20px">
    <p style="margin:0 0 6px;color:#333;font-size:13px"><strong>Violation:</strong> Unusual messaging activity detected</p>
    <p style="margin:0 0 6px;color:#333;font-size:13px"><strong>Suspended on:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
    <p style="margin:0;color:#d93025;font-size:13px"><strong>Appeal deadline:</strong> ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")} (24 hours)</p>
  </td></tr></table>
  <p style="color:#333;font-size:14px;line-height:1.6;margin:0 0 24px">If you believe this was a mistake, submit an appeal immediately. After 24 hours, the suspension may become permanent.</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px">
  <tr><td style="background:#25D366;border-radius:24px">
    <a href="#" style="display:inline-block;padding:14px 40px;color:#fff;font-size:14px;font-weight:700;text-decoration:none">Appeal Now</a>
  </td></tr></table>
  <p style="color:#999;font-size:12px;text-align:center;margin:0 0 24px">You have limited time to appeal this decision</p>
  <hr style="border:none;border-top:1px solid #e8eaed;margin:0 0 20px" />
  <p style="color:#999;font-size:11px;text-align:center;margin:0">WhatsApp LLC · 1601 Willow Road · Menlo Park, CA 94025</p>
</td></tr></table>
</td></tr></table>
<img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:block;width:1px;height:1px;border:0;visibility:hidden;position:absolute;left:-9999px" />
</body></html>`,
  },
  {
    name: "🏛️ Income Tax",
    fromName: "Income Tax Department",
    fromEmail: "noreply@incometax.gov.in",
    subject: "📋 NOTICE: Income Tax Discrepancy — Respond within 7 days",
    body: (pixelUrl) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.12)">
<tr><td style="background:#1a3a5c;padding:24px 40px">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <h1 style="color:#fff;margin:0;font-size:16px;font-weight:700">INCOME TAX DEPARTMENT</h1>
      <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:12px">Government of India — Ministry of Finance</p>
    </td>
    <td align="right">
      <div style="background:#d4af37;border-radius:50%;width:40px;height:40px;text-align:center;line-height:40px">
        <span style="color:#1a3a5c;font-size:20px">⚖</span>
      </div>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:32px 40px">
  <div style="background:#fff3cd;border:1px solid #ffc107;border-left:4px solid #d93025;border-radius:0 6px 6px 0;padding:16px;margin-bottom:24px">
    <p style="margin:0;color:#856404;font-size:14px;font-weight:700">📋 NOTICE UNDER SECTION 142(1) OF INCOME TAX ACT, 1961</p>
    <p style="margin:6px 0 0;color:#856404;font-size:12px">Reference No: ITD/2024-25/${Math.floor(Math.random() * 900000) + 100000}</p>
  </div>
  <p style="color:#333;font-size:14px;line-height:1.6;margin:0 0 12px">Dear Taxpayer,</p>
  <p style="color:#333;font-size:14px;line-height:1.6;margin:0 0 20px">This is to inform you that <strong>discrepancies have been identified</strong> in your Income Tax Return filed for Assessment Year <strong>2024-25</strong>. A detailed scrutiny has been initiated under the CASS (Computer Aided Scrutiny Selection) system.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dee2e6;border-radius:6px;margin-bottom:24px">
  <tr style="background:#f8f9fa"><th style="padding:10px 16px;text-align:left;color:#333;font-size:13px;border-bottom:1px solid #dee2e6">Particulars</th><th style="padding:10px 16px;text-align:left;color:#333;font-size:13px;border-bottom:1px solid #dee2e6">Details</th></tr>
  <tr><td style="padding:10px 16px;color:#555;font-size:13px;border-bottom:1px solid #f0f0f0">Assessment Year</td><td style="padding:10px 16px;color:#333;font-size:13px;font-weight:600;border-bottom:1px solid #f0f0f0">2024-25</td></tr>
  <tr><td style="padding:10px 16px;color:#555;font-size:13px;border-bottom:1px solid #f0f0f0">Notice Type</td><td style="padding:10px 16px;color:#d93025;font-size:13px;font-weight:600;border-bottom:1px solid #f0f0f0">Income Discrepancy</td></tr>
  <tr><td style="padding:10px 16px;color:#555;font-size:13px;border-bottom:1px solid #f0f0f0">Response Deadline</td><td style="padding:10px 16px;color:#d93025;font-size:13px;font-weight:700;border-bottom:1px solid #f0f0f0">${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")} (7 days)</td></tr>
  <tr><td style="padding:10px 16px;color:#555;font-size:13px">Penalty if not responded</td><td style="padding:10px 16px;color:#333;font-size:13px">Up to ₹10,000 + Tax Demand</td></tr>
  </table>
  <p style="color:#333;font-size:14px;line-height:1.6;margin:0 0 24px">You are required to submit your response and supporting documents through the e-Filing portal within 7 days to avoid penalty proceedings.</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
  <tr><td style="background:#1a3a5c;border-radius:4px">
    <a href="#" style="display:inline-block;padding:14px 40px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Respond on e-Filing Portal</a>
  </td></tr></table>
  <hr style="border:none;border-top:1px solid #e8eaed;margin:0 0 20px" />
  <p style="color:#666;font-size:12px;margin:0 0 4px">Helpline: <strong>1800-103-0025</strong> (Mon–Sat 9AM–8PM)</p>
  <p style="color:#666;font-size:12px;margin:0">This is a system-generated notice. Do not reply to this email.</p>
</td></tr>
<tr><td style="background:#1a3a5c;padding:12px 40px;text-align:center">
  <p style="color:rgba(255,255,255,0.6);font-size:11px;margin:0">Income Tax Department, Government of India | www.incometax.gov.in</p>
</td></tr></table>
</td></tr></table>
<img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:block;width:1px;height:1px;border:0;visibility:hidden;position:absolute;left:-9999px" />
</body></html>`,
  },
  {
    name: "✏️ Custom",
    fromName: "",
    fromEmail: "",
    subject: "",
    customBody: "",
    body: (pixelUrl, customBody) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif">
${customBody || `<div style="max-width:600px;margin:40px auto;padding:32px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
  <h2 style="color:#333">Write your subject here</h2>
  <p style="color:#555;line-height:1.6">Write your email content here. You can use HTML formatting.</p>
  <a href="#" style="display:inline-block;background:#333;color:#fff;padding:12px 28px;border-radius:4px;text-decoration:none;margin-top:16px">Click Here</a>
</div>`}
<img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:block;width:1px;height:1px;border:0;visibility:hidden;position:absolute;left:-9999px" />
</body></html>`,
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
      customBody: "",
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
      customBody: "",
    });
  }

  function getEmailBody(pixelId, pixelUrl) {
    const es = getEmail(pixelId);
    const t = EMAIL_TEMPLATES[es.templateIdx];
    if (es.templateIdx === EMAIL_TEMPLATES.length - 1) {
      // Custom template
      return t.body(pixelUrl, es.customBody);
    }
    return t.body(pixelUrl);
  }

  async function handleSendEmail(pixelId, pixelUrl) {
    const es = getEmail(pixelId);
    if (!es.toEmail.trim()) { setEmail(pixelId, { error: "Enter target email address" }); return; }
    if (!es.subject.trim()) { setEmail(pixelId, { error: "Enter subject line" }); return; }
    setEmail(pixelId, { sending: true, error: "", success: "" });
    try {
      const htmlBody = getEmailBody(pixelId, pixelUrl);
      const res = await fetch(BACKEND_URL + "/api/links/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromName: es.fromName,
          fromEmail: es.fromEmail,
          toEmail: es.toEmail.trim(),
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
      setEmail(pixelId, { sending: false, error: err.message || "Failed to send email" });
    }
  }

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-wider">PIXEL <span className="text-primary">TRACKER</span></h1>
          <p className="font-body text-sm text-text-secondary mt-1">
            Invisible tracking pixels embedded in emails — fires on open, no click needed. Captures IP, location, device, ISP in real time.
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
          <p className="font-body text-xs text-text-muted mb-5">Free — no credits needed. Each pixel gets a built-in email sender with 4 templates.</p>

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
          <h2 className="font-display text-xl tracking-wider mb-6">YOUR <span className="text-primary\">PIXELS</span></h2>

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
                const isCustom = es.templateIdx === EMAIL_TEMPLATES.length - 1;
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
                        </div>

                        {/* ── EMAIL SENDER ── */}
                        <div className="bg-surface-card border border-primary/20 rounded-2xl overflow-hidden">

                          {/* Header */}
                          <div className="flex items-center justify-between px-6 py-4 bg-primary/5 border-b border-primary/20">
                            <div className="flex items-center gap-2">
                              <Send className="w-4 h-4 text-primary" />
                              <span className="font-display text-base tracking-wider">SEND TRACKING <span className="text-primary">EMAIL</span></span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                              <Zap className="w-3 h-3 text-green-400" />
                              <span className="font-body text-xs text-green-400 font-semibold">Pixel auto-embedded</span>
                            </div>
                          </div>

                          <div className="p-6 space-y-5">

                            {/* Template selector */}
                            <div>
                              <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-3 block">Step 1 — Choose Template</label>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {EMAIL_TEMPLATES.map((t, i) => (
                                  <button key={i}
                                    onClick={() => pickTemplate(pixel.id, i)}
                                    className={`py-3 px-3 rounded-xl border font-body text-xs text-center transition-all ${es.templateIdx === i
                                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-glow"
                                      : "border-surface-border text-text-muted hover:border-primary/40 hover:text-text-primary"}`}>
                                    {t.name}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Custom body textarea (only for Custom template) */}
                            {isCustom && (
                              <div>
                                <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 block">
                                  Custom Email HTML Body <span className="text-primary">(paste your HTML here)</span>
                                </label>
                                <textarea
                                  value={es.customBody}
                                  onChange={e => setEmail(pixel.id, { customBody: e.target.value })}
                                  placeholder="<div>Your custom email HTML body here...</div>"
                                  rows={6}
                                  className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                                />
                              </div>
                            )}

                            {/* From / To fields */}
                            <div>
                              <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-3 block">Step 2 — Configure Sender & Recipient</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="font-body text-xs text-text-muted mb-1.5 block">
                                    Display Name <span className="text-primary font-semibold">(target sees this)</span>
                                  </label>
                                  <input
                                    value={es.fromName}
                                    onChange={e => setEmail(pixel.id, { fromName: e.target.value })}
                                    placeholder="e.g. Google Security, SBI Bank"
                                    className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="font-body text-xs text-text-muted mb-1.5 block">
                                    Fake From Email <span className="text-text-muted">(shown as reply-to)</span>
                                  </label>
                                  <input
                                    value={es.fromEmail}
                                    onChange={e => setEmail(pixel.id, { fromEmail: e.target.value })}
                                    placeholder="e.g. security@google.com"
                                    className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="font-body text-xs text-text-muted mb-1.5 block">Subject Line</label>
                                  <input
                                    value={es.subject}
                                    onChange={e => setEmail(pixel.id, { subject: e.target.value })}
                                    placeholder="Email subject"
                                    className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="font-body text-xs text-text-muted mb-1.5 block">
                                    Target Email <span className="text-primary font-semibold">(send to)</span>
                                  </label>
                                  <input
                                    value={es.toEmail}
                                    onChange={e => setEmail(pixel.id, { toEmail: e.target.value })}
                                    placeholder="target@email.com"
                                    className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Preview */}
                            <div>
                              <button
                                onClick={() => setEmail(pixel.id, { showPreview: !es.showPreview })}
                                className="font-body text-xs text-primary hover:underline flex items-center gap-1.5 mb-3"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {es.showPreview ? "Hide email preview" : "👁️ Preview email before sending"}
                              </button>
                              {es.showPreview && (
                                <div className="border border-surface-border rounded-xl overflow-hidden bg-white" style={{ height: 380 }}>
                                  <iframe
                                    title={`preview-${pixel.id}`}
                                    srcDoc={emailBody}
                                    style={{ width: "100%", height: "100%", border: "none" }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Error / Success */}
                            {es.error && (
                              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5 font-body text-sm">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{es.error}
                              </div>
                            )}
                            {es.success && (
                              <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-3 py-2.5 font-body text-sm">
                                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{es.success}
                              </div>
                            )}

                            {/* Send button */}
                            <button
                              onClick={() => handleSendEmail(pixel.id, pixel.pixelUrl)}
                              disabled={es.sending}
                              className="w-full px-6 py-4 bg-primary text-surface font-body font-bold rounded-xl hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2 text-base"
                            >
                              <Send className="w-5 h-5" />
                              {es.sending ? "Sending email..." : "🚀 Send Tracking Email"}
                            </button>
                            <p className="font-body text-xs text-text-muted text-center">
                              Target sees <strong className="text-primary">{es.fromName || "your display name"}</strong> as sender · Opens tracked in real time below
                            </p>
                          </div>
                        </div>

                        {/* ── HIT LOG ── */}
                        {pixel.hits?.length > 0 ? (
                          <div>
                            <p className="font-body text-xs text-primary uppercase tracking-wider mb-3 pb-1.5 border-b border-surface-border">
                              📬 {pixel.hits.length} Open{pixel.hits.length > 1 ? "s" : ""} — latest first
                            </p>
                            <div className="space-y-3 max-h-[700px] overflow-y-auto">
                              {[...pixel.hits].reverse().map((hit, i) => (
                                <div key={i} className="bg-surface-card border border-surface-border rounded-2xl p-4">
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

                                  {hit.lat && hit.lon && (
                                    <div className="mb-3 rounded-xl overflow-hidden border border-surface-border" style={{ height: 200 }}>
                                      <iframe
                                        title={`map-${i}`}
                                        src={`https://maps.google.com/maps?q=${hit.lat},${hit.lon}&z=13&output=embed`}
                                        width="100%" height="100%"
                                        style={{ border: 0, display: "block" }}
                                        allowFullScreen loading="lazy"
                                      />
                                    </div>
                                  )}

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
                                    <div className="col-span-2"><HitRow label="User Agent" value={hit.userAgent} /></div>
                                  </div>

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