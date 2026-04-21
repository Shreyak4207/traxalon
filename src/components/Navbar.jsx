import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Shield, Menu, X, LogOut, Zap, User, ChevronDown,
  Edit3, Save, Mail, BadgeCheck, Building2,
  CheckCircle, AlertCircle, Loader, ArrowLeft, RefreshCw
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

// ── OTP HELPER — sends 6-digit code via your backend email sender ─────────────
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

async function sendOTP(toEmail, code) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0d1117;padding:32px;border-radius:12px;border:1px solid #1f2937">
      <div style="text-align:center;margin-bottom:24px">
        <h2 style="color:#00d4ff;font-size:22px;letter-spacing:4px;margin:0">TRAXELON</h2>
        <p style="color:#6b7280;font-size:12px;margin:4px 0 0">Law Enforcement Intelligence Tool</p>
      </div>
      <p style="color:#d1d5db;font-size:14px">Your email verification code is:</p>
      <div style="background:#111827;border:1px solid #00d4ff33;border-radius:8px;padding:24px;text-align:center;margin:16px 0">
        <span style="font-family:monospace;font-size:40px;font-weight:bold;color:#00d4ff;letter-spacing:12px">${code}</span>
      </div>
      <p style="color:#6b7280;font-size:12px">This code expires in <strong style="color:#d1d5db">10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#6b7280;font-size:11px;margin-top:24px">If you did not request this, ignore this email.</p>
    </div>`;

  await fetch(BACKEND_URL + "/api/links/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fromName: "Traxelon Security",
      fromEmail: "security@traxelon.app",
      toEmail,
      subject: "🔐 Your Traxelon Email Verification Code",
      htmlBody: html,
    }),
  });
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── PROFILE DROPDOWN ──────────────────────────────────────────────────────────
function ProfileDropdown({ userProfile, currentUser, onClose, onLogout, fetchUserProfile }) {
  // view | edit | otp
  const [mode, setMode] = useState("view");

  // edit fields
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [badgeId, setBadgeId]         = useState(userProfile?.badgeId || "");
  const [department, setDepartment]   = useState(userProfile?.department || "");
  const [newEmail, setNewEmail]       = useState(userProfile?.email || "");

  // OTP state
  const [otpSent, setOtpSent]         = useState("");      // the code we generated
  const [otpInput, setOtpInput]       = useState("");      // what user typed
  const [otpExpiry, setOtpExpiry]     = useState(null);    // Date
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [pendingEmail, setPendingEmail] = useState("");    // email waiting for OTP

  const [saving, setSaving]   = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg]         = useState(null);

  const dropRef    = useRef(null);
  const otpRefs    = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const timerRef   = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // OTP countdown timer
  useEffect(() => {
    if (!otpExpiry) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((otpExpiry - Date.now()) / 1000));
      setOtpCountdown(remaining);
      if (remaining === 0) clearInterval(timerRef.current);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [otpExpiry]);

  function resetAll() {
    setMode("view");
    setDisplayName(userProfile?.displayName || "");
    setBadgeId(userProfile?.badgeId || "");
    setDepartment(userProfile?.department || "");
    setNewEmail(userProfile?.email || "");
    setOtpSent(""); setOtpInput(""); setOtpExpiry(null); setOtpCountdown(0);
    setPendingEmail("");
    setMsg(null);
  }

  // OTP input auto-advance
  function handleOtpKey(e, idx) {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const arr = otpInput.split("");
    arr[idx] = val;
    const joined = arr.join("").slice(0, 6);
    setOtpInput(joined.padEnd(6, "").slice(0, 6).replace(/ /g, ""));
    // advance focus
    if (val && idx < 5) otpRefs[idx + 1].current?.focus();
    if (!val && idx > 0) otpRefs[idx - 1].current?.focus();
  }

  // Send OTP to email
  async function handleSendOTP() {
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setMsg({ type: "error", text: "Enter a valid email address first." }); return;
    }
    setSending(true); setMsg(null);
    try {
      const code = generateOTP();
      await sendOTP(newEmail.trim(), code);
      setOtpSent(code);
      setPendingEmail(newEmail.trim());
      setOtpInput("");
      setOtpExpiry(Date.now() + 10 * 60 * 1000);
      setMode("otp");
      setMsg({ type: "success", text: `OTP sent to ${newEmail.trim()}` });
    } catch (err) {
      setMsg({ type: "error", text: "Failed to send OTP. Check backend SMTP config." });
    }
    setSending(false);
  }

  // Verify OTP + save everything
  async function handleVerifyOTP() {
    if (otpInput.length < 6) { setMsg({ type: "error", text: "Enter the 6-digit code." }); return; }
    if (otpCountdown === 0)   { setMsg({ type: "error", text: "OTP expired. Please resend." }); return; }
    if (otpInput !== otpSent) { setMsg({ type: "error", text: "Incorrect code. Try again." }); return; }

    setSaving(true); setMsg(null);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        displayName: displayName.trim(),
        badgeId: badgeId.trim(),
        department: department.trim(),
        email: pendingEmail,
      });
      await fetchUserProfile(currentUser.uid);
      setMsg({ type: "success", text: "Profile updated successfully!" });
      setMode("view");
      setOtpSent(""); setOtpInput(""); setOtpExpiry(null);
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to save." });
    }
    setSaving(false);
  }

  // Save without email change
  async function handleSaveNoEmailChange() {
    setSaving(true); setMsg(null);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        displayName: displayName.trim(),
        badgeId: badgeId.trim(),
        department: department.trim(),
      });
      await fetchUserProfile(currentUser.uid);
      setMsg({ type: "success", text: "Profile updated successfully!" });
      setMode("view");
    } catch (err) {
      setMsg({ type: "error", text: err.message || "Failed to save." });
    }
    setSaving(false);
  }

  const emailChanged = newEmail.trim() !== (userProfile?.email || currentUser?.email || "");

  return (
    <div
      ref={dropRef}
      className="absolute right-0 top-full mt-2 w-88 bg-surface-elevated border border-surface-border rounded-2xl z-50 overflow-hidden"
      style={{ width: 360, boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.08)" }}
    >
      {/* Header */}
      <div className="bg-primary/10 border-b border-surface-border px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm text-text-primary tracking-wider truncate">
              {userProfile?.displayName || "Officer"}
            </div>
            <div className="font-mono text-xs text-text-muted truncate">{currentUser?.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-full px-2.5 py-1 text-xs text-primary font-mono">
            <Zap className="w-3 h-3" />{userProfile?.credits ?? 0}
          </span>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* Message */}
        {msg && (
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 font-body text-xs ${
            msg.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
            {msg.type === "success"
              ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
            <span>{msg.text}</span>
          </div>
        )}

        {/* ── VIEW MODE ── */}
        {mode === "view" && (
          <div className="space-y-2.5">
            <ProfileRow icon={<User className="w-3.5 h-3.5" />}       label="Name"       value={userProfile?.displayName} />
            <ProfileRow icon={<Mail className="w-3.5 h-3.5" />}       label="Email"      value={currentUser?.email} />
            <ProfileRow icon={<BadgeCheck className="w-3.5 h-3.5" />} label="Badge ID"   value={userProfile?.badgeId} />
            <ProfileRow icon={<Building2 className="w-3.5 h-3.5" />}  label="Department" value={userProfile?.department} />
            <ProfileRow icon={<Zap className="w-3.5 h-3.5" />}        label="Credits"    value={userProfile?.credits} />
            <ProfileRow icon={<Shield className="w-3.5 h-3.5" />}     label="Role"       value={userProfile?.role} />

            <button
              onClick={() => { setMode("edit"); setMsg(null); }}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-primary/10 border border-primary/30 text-primary rounded-xl font-body text-sm hover:bg-primary/20 transition-colors"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {mode === "edit" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-surface-border">
              <button onClick={resetAll} className="text-text-muted hover:text-text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <p className="font-body text-xs text-text-muted uppercase tracking-wider">Edit Profile</p>
            </div>

            <EditField
              label="Display Name" icon={<User className="w-3.5 h-3.5" />}
              value={displayName} onChange={setDisplayName} placeholder="Your name"
            />
            <EditField
              label="Badge ID" icon={<BadgeCheck className="w-3.5 h-3.5" />}
              value={badgeId} onChange={setBadgeId} placeholder="Badge number"
            />
            <EditField
              label="Department" icon={<Building2 className="w-3.5 h-3.5" />}
              value={department} onChange={setDepartment} placeholder="Your department"
            />

            {/* Email field */}
            <div>
              <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => { setNewEmail(e.target.value); setMsg(null); }}
                  placeholder="New email"
                  className="flex-1 bg-surface border border-surface-border rounded-xl px-3 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                {emailChanged && (
                  <button
                    onClick={handleSendOTP}
                    disabled={sending}
                    className="px-3 py-2 bg-primary/10 border border-primary/30 text-primary rounded-xl font-body text-xs hover:bg-primary/20 transition-colors disabled:opacity-60 whitespace-nowrap flex items-center gap-1.5"
                  >
                    {sending ? <Loader className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                    {sending ? "Sending..." : "Send OTP"}
                  </button>
                )}
              </div>
              {emailChanged && (
                <p className="font-body text-xs text-yellow-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  OTP verification required to change email
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              {!emailChanged ? (
                <button
                  onClick={handleSaveNoEmailChange}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-surface font-body font-bold text-sm rounded-xl hover:bg-primary-dark transition-all shadow-glow disabled:opacity-60"
                >
                  {saving ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              ) : (
                <button
                  onClick={handleSendOTP}
                  disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-surface font-body font-bold text-sm rounded-xl hover:bg-primary-dark transition-all shadow-glow disabled:opacity-60"
                >
                  {sending ? <><Loader className="w-4 h-4 animate-spin" /> Sending OTP...</> : <><Mail className="w-4 h-4" /> Send OTP & Continue</>}
                </button>
              )}
              <button
                onClick={resetAll}
                className="px-4 py-2.5 bg-surface border border-surface-border text-text-muted font-body text-sm rounded-xl hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── OTP MODE ── */}
        {mode === "otp" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-surface-border">
              <button onClick={() => { setMode("edit"); setMsg(null); }} className="text-text-muted hover:text-text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <p className="font-body text-xs text-text-muted uppercase tracking-wider">Verify Email</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <p className="font-body text-sm text-text-primary font-semibold">Check your email</p>
              <p className="font-body text-xs text-text-muted mt-1">
                We sent a 6-digit code to
              </p>
              <p className="font-mono text-xs text-primary mt-0.5">{pendingEmail}</p>
            </div>

            {/* 6-digit OTP boxes */}
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 6 }).map((_, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otpInput[idx] || ""}
                  onChange={e => handleOtpKey(e, idx)}
                  onKeyDown={e => {
                    if (e.key === "Backspace" && !otpInput[idx] && idx > 0) {
                      otpRefs[idx - 1].current?.focus();
                    }
                  }}
                  className="w-11 h-12 text-center font-mono text-lg font-bold bg-surface border-2 rounded-xl text-text-primary focus:outline-none transition-colors"
                  style={{
                    borderColor: otpInput[idx] ? "rgba(0,212,255,0.8)" : "rgba(255,255,255,0.1)",
                    background: otpInput[idx] ? "rgba(0,212,255,0.08)" : undefined,
                  }}
                />
              ))}
            </div>

            {/* Countdown */}
            <div className="text-center">
              {otpCountdown > 0 ? (
                <p className="font-mono text-xs text-text-muted">
                  Code expires in{" "}
                  <span className={`font-bold ${otpCountdown < 60 ? "text-red-400" : "text-primary"}`}>
                    {Math.floor(otpCountdown / 60)}:{String(otpCountdown % 60).padStart(2, "0")}
                  </span>
                </p>
              ) : (
                <p className="font-mono text-xs text-red-400">Code expired</p>
              )}
            </div>

            {/* Resend */}
            <div className="text-center">
              <button
                onClick={handleSendOTP}
                disabled={sending || otpCountdown > 540} // allow resend after 1 min
                className="font-body text-xs text-text-muted hover:text-primary transition-colors disabled:opacity-40 flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="w-3 h-3" />
                {sending ? "Sending..." : "Resend OTP"}
              </button>
            </div>

            {/* Verify button */}
            <button
              onClick={handleVerifyOTP}
              disabled={saving || otpInput.replace(/\s/g, "").length < 6}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-surface font-body font-bold text-sm rounded-xl hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50"
            >
              {saving
                ? <><Loader className="w-4 h-4 animate-spin" /> Verifying...</>
                : <><CheckCircle className="w-4 h-4" /> Verify & Save Changes</>}
            </button>
          </div>
        )}

        {/* Logout */}
        <div className="border-t border-surface-border pt-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-body text-sm hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function ProfileRow({ icon, label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-text-muted flex-shrink-0">{icon}</span>
      <span className="font-body text-xs text-text-muted uppercase tracking-wider w-20 flex-shrink-0">{label}</span>
      <span className="font-mono text-xs text-text-primary flex-1 truncate">{String(value)}</span>
    </div>
  );
}

function EditField({ label, icon, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="font-body text-xs text-text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        {icon}{label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}

// ── NAVBAR ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { isAuthenticated, userProfile, currentUser, logout, fetchUserProfile } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  async function handleLogout() {
    setProfileOpen(false);
    await logout();
    navigate("/");
  }

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-primary" />
              <div className="absolute inset-0 w-8 h-8 text-primary opacity-50 blur-sm group-hover:opacity-100 transition-opacity">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            <span className="font-display text-2xl text-text-primary tracking-widest">
              TRAX<span className="text-primary">ELON</span>
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-body text-sm tracking-wider uppercase transition-colors duration-200 ${
                  location.pathname === link.to
                    ? "text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && userProfile ? (
              <div className="relative">
                {/* Profile pill */}
                <button
                  onClick={() => setProfileOpen(v => !v)}
                  className={`flex items-center gap-2 bg-surface-card border rounded-full px-4 py-1.5 transition-all ${
                    profileOpen ? "border-primary/60 shadow-glow" : "border-surface-border hover:border-primary/40"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-body text-sm text-text-secondary">
                    {userProfile?.displayName || "Officer"}
                  </span>
                  {userProfile?.credits !== undefined && (
                    <span className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-full px-2 py-0.5 text-xs text-primary font-mono">
                      <Zap className="w-3 h-3" />
                      {userProfile.credits}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <ProfileDropdown
                    userProfile={userProfile}
                    currentUser={currentUser}
                    onClose={() => setProfileOpen(false)}
                    onLogout={handleLogout}
                    fetchUserProfile={fetchUserProfile}
                  />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="font-body text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Login
                </Link>
                <Link to="/signup"
                  className="px-4 py-2 bg-primary text-surface font-body text-sm font-semibold rounded-lg hover:bg-primary-dark transition-all shadow-glow hover:shadow-glow-strong">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-text-secondary hover:text-text-primary"
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-surface-elevated border-b border-surface-border px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
              className="block font-body text-sm tracking-wider uppercase text-text-secondary hover:text-primary py-2">
              {link.label}
            </Link>
          ))}
          {isAuthenticated && userProfile ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm text-primary py-2">
                Dashboard
              </Link>
              <button
                onClick={() => { setMobileOpen(false); setProfileOpen(true); }}
                className="block text-sm text-text-secondary hover:text-primary py-2 w-full text-left"
              >
                My Profile
              </button>
              <button onClick={handleLogout} className="block text-sm text-red-400 py-2">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-text-secondary py-2">Login</Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="block text-sm text-primary py-2">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
