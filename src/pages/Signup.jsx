import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Shield, User, Mail, Lock, BadgeCheck, Building2, Eye, EyeOff } from "lucide-react";

function getPasswordStrength(password) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { label: "Weak", color: "bg-red-500", textColor: "text-red-400", width: "w-1/4" };
  if (score <= 2) return { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-400", width: "w-2/4" };
  if (score <= 3) return { label: "Good", color: "bg-blue-500", textColor: "text-blue-400", width: "w-3/4" };
  return { label: "Strong", color: "bg-green-500", textColor: "text-green-400", width: "w-full" };
}

export default function Signup() {
  const { signup, resendVerification } = useAuth();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    badgeId: "",
    department: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (strength?.label === "Weak") return setError("Password is too weak. Add uppercase letters, numbers or symbols.");
    setLoading(true);
    try {
      await signup(form.email, form.password, form.displayName, form.badgeId, form.department);
      setRegistered(true);
    } catch (err) {
      setError(err.message || "Failed to create account.");
    }
    setLoading(false);
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl top-1/3 left-1/2 -translate-x-1/2" />

        <div className="relative w-full max-w-md">
          <div className="bg-surface-elevated border border-surface-border rounded-3xl p-10 shadow-card text-center backdrop-blur-xl">

            {/* Icon */}
            <div className="flex items-center justify-center w-20 h-20 mx-auto bg-primary/10 border border-primary/30 rounded-2xl mb-6 shadow-glow">
              <Mail className="w-10 h-10 text-primary" />
            </div>

            {/* Title */}
            <h2 className="font-display text-3xl tracking-wider text-text-primary">
              CHECK YOUR <span className="text-primary">EMAIL</span>
            </h2>

            {/* Description */}
            <p className="font-body text-sm text-text-secondary mt-4 leading-relaxed">
              We've sent a verification link to
            </p>

            {/* Highlighted email */}
            <div className="mt-3 px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl text-primary font-mono text-sm break-all">
              {form.email}
            </div>

            <p className="font-body text-xs text-text-muted mt-4">
              Click the link in your inbox to activate your account.
              <br />
              If you don’t see it, check your spam folder.
            </p>

            {/* Buttons */}
            <div className="mt-8 space-y-3">

              <Link
                to="/login"
                className="block w-full px-6 py-3 bg-primary text-surface font-body font-bold rounded-xl hover:bg-primary-dark transition-all shadow-glow"
              >
                Go to Login
              </Link>

              {/* <button
                onClick={() => window.location.reload()}
                className="block w-full px-6 py-3 bg-surface border border-surface-border text-text-secondary font-body rounded-xl hover:border-primary hover:text-primary transition-colors"
              >
                Resend Verification Email
              </button> */}

              <button
                onClick={async () => {
                  setResendLoading(true);
                  setResendStatus("");

                  try {
                    await resendVerification(form.email, form.password);
                    setResendStatus("success");
                  } catch (err) {
                    setResendStatus("error");
                  }

                  setResendLoading(false);
                }}
                disabled={resendLoading}
                className="block w-full px-6 py-3 bg-surface border border-surface-border text-text-secondary font-body rounded-xl hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
              >
                {resendLoading ? "Sending..." : "Resend Verification Email"}
              </button>
              {resendStatus === "success" && (
                <p className="text-green-400 text-xs mt-3">
                  ✅ Verification email sent again. Check your inbox.
                </p>
              )}

              {resendStatus === "error" && (
                <p className="text-red-400 text-xs mt-3">
                  ⚠️ Unable to resend email. Please try again.
                </p>
              )}

            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 pt-16 pb-8">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />
      <div className="relative w-full max-w-lg">
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-8 shadow-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/30 rounded-2xl mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-display text-3xl tracking-wider text-text-primary">
              OFFICER <span className="text-primary">REGISTRATION</span>
            </h1>
            <p className="font-body text-sm text-text-secondary mt-2">Create your secure Traxelon account</p>
            <div className="mt-3 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-xs text-primary font-mono">
              🎁 1 FREE credit on signup
            </div>
          </div>

          {error && (
            <div className="bg-accent/10 border border-accent/30 text-accent rounded-lg px-4 py-3 font-body text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField icon={<User />} label="Full Name" name="displayName" value={form.displayName} onChange={handleChange} placeholder="John Doe" required />
              <InputField icon={<BadgeCheck />} label="Badge ID" name="badgeId" value={form.badgeId} onChange={handleChange} placeholder="KA-2024-001" required />
            </div>
            <InputField icon={<Building2 />} label="Department" name="department" value={form.department} onChange={handleChange} placeholder="Cyber Crime Division" required />
            <InputField icon={<Mail />} label="Official Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="officer@police.gov.in" required />

            <div>
              <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input type={showPass ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                  placeholder="Min. 8 characters" required
                  className="w-full bg-surface border border-surface-border rounded-lg pl-10 pr-10 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`font-body text-xs ${strength.textColor}`}>{strength.label} password</p>
                    <p className="font-body text-xs text-text-muted">Use uppercase, numbers & symbols</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
                <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                  placeholder="Repeat password" required
                  className={`w-full bg-surface border rounded-lg pl-10 pr-10 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${form.confirmPassword && form.confirmPassword !== form.password
                    ? "border-red-500 focus:border-red-500"
                    : form.confirmPassword && form.confirmPassword === form.password
                      ? "border-green-500 focus:border-green-500"
                      : "border-surface-border focus:border-primary"
                    }`} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p className="font-body text-xs text-red-400 mt-1">❌ Passwords do not match</p>
              )}
              {form.confirmPassword && form.confirmPassword === form.password && (
                <p className="font-body text-xs text-green-400 mt-1">✅ Passwords match</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-2 px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Creating Account..." : "Create Officer Account"}
            </button>
          </form>

          <p className="text-center font-body text-sm text-text-muted mt-6">
            Already registered? <Link to="/login" className="text-primary hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function InputField({ icon, label, name, type = "text", value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4">{icon}</div>
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
          className="w-full bg-surface border border-surface-border rounded-lg pl-10 pr-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
      </div>
    </div>
  );
}