import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, Shield } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", badge: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-surface text-text-primary pt-16">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-6xl tracking-wider text-text-primary mb-4">
            CONTACT <span className="text-primary">US</span>
          </h1>
          <p className="font-body text-text-secondary max-w-xl mx-auto">
            For technical support, new registrations, or partnership inquiries.
            Our team is available Monday–Saturday, 9AM–6PM IST.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 space-y-5">
              <h3 className="font-display text-xl tracking-wider text-text-primary">
                GET IN <span className="text-primary">TOUCH</span>
              </h3>
              {[
                { icon: <Mail className="w-5 h-5" />, label: "Email", value: "support@traxalon.gov.in" },
                { icon: <Phone className="w-5 h-5" />, label: "Hotline", value: "+91 1800-TRAXALON" },
                { icon: <MapPin className="w-5 h-5" />, label: "Office", value: "Cyber Crime Bureau, New Delhi" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-body text-xs text-text-muted uppercase tracking-wider">{item.label}</div>
                    <div className="font-body text-sm text-text-primary mt-0.5">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
              <Shield className="w-6 h-6 text-primary mb-3" />
              <p className="font-body text-sm text-text-secondary leading-relaxed">
                All communications are encrypted and logged for security purposes.
                Please use your official government email when contacting us.
              </p>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
              {sent ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="font-display text-2xl text-primary tracking-wider mb-2">MESSAGE SENT</h3>
                  <p className="font-body text-text-secondary">
                    We'll respond to your query within 24 working hours.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-6 px-6 py-2.5 border border-surface-border rounded-lg font-body text-sm text-text-secondary hover:border-primary hover:text-primary transition-colors"
                  >
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
                    <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">
                      Message
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      rows={5}
                      required
                      placeholder="Describe your issue or query..."
                      className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormInput({ label, name, type = "text", value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}