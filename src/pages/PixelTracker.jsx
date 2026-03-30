import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Copy, CheckCircle, Eye, Globe, Clock, Mail, Smartphone, Plus, ChevronDown, ChevronUp } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

export default function PixelTracker() {
  const { currentUser } = useAuth();
  const [pixels, setPixels] = useState([]);
  const [label, setLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [openPixel, setOpenPixel] = useState(null);
  const [activeTab, setActiveTab] = useState({});

  // Real-time listener for pixel hits
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
    setGenerating(true); setError("");
    try {
      const res = await fetch(BACKEND_URL + "/api/links/pixel/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid, label: label || "Pixel Tracker" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLabel("");
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
    return `<!-- Paste inside your email HTML body -->
<img src="${pixelUrl}" width="1" height="1" border="0" alt="" style="display:none!important;visibility:hidden;overflow:hidden;width:1px;height:1px;mso-hide:all;" />`;
  }

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="mb-8">
          <h1 className="font-display text-4xl tracking-wider">PIXEL <span className="text-primary">TRACKER</span></h1>
          <p className="font-body text-sm text-text-secondary mt-1">
            Invisible 1×1 tracking pixels — embed in emails, pages, or documents to silently log opens.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
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
          <p className="font-body text-xs text-text-muted mb-4">Free — no credits needed. Generates a unique invisible tracking pixel.</p>

          {error && (
            <div className="text-red-400 font-body text-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
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

        {/* Pixel List */}
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
                  {/* Header */}
                  <div
                    className="p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-primary/5 transition-all"
                    onClick={() => setOpenPixel(openPixel === pixel.id ? null : pixel.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-body text-base font-semibold text-text-primary">{pixel.label}</span>
                        {pixel.totalOpens > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse">
                            ● LIVE
                          </span>
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

                      {/* Embed codes with tabs */}
                      <div>
                        <div className="flex gap-2 mb-3">
                          {["html", "email"].map(tab => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(t => ({ ...t, [pixel.id]: tab }))}
                              className={`px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${(activeTab[pixel.id] || "html") === tab ? "bg-primary text-surface font-bold" : "bg-surface border border-surface-border text-text-muted hover:border-primary/40"}`}
                            >
                              {tab === "html" ? "HTML Embed" : "Email Embed"}
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
                          ↑ Paste this into your email HTML. When opened, IP + device + email client will be captured instantly.
                        </p>
                      </div>

                      {/* Hit log */}
                      {pixel.hits?.length > 0 ? (
                        <div>
                          <p className="font-body text-xs text-primary uppercase tracking-wider mb-3 pb-1 border-b border-surface-border">
                            📬 {pixel.hits.length} Open{pixel.hits.length > 1 ? "s" : ""} — latest first
                          </p>
                          <div className="space-y-2">
                            {[...pixel.hits].reverse().map((hit, i) => (
                              <div key={i} className="bg-surface-card border border-surface-border rounded-xl p-4">
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className="font-body text-sm font-semibold text-text-primary">
                                        {hit.emailClient || "Unknown Client"}
                                      </span>
                                      {hit.isRepeatOpen && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-mono">🔁 Repeat Open</span>
                                      )}
                                      {hit.isForwarded && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">↗ Forwarded</span>
                                      )}
                                      {hit.isProxy && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">🛡 VPN/Proxy</span>
                                      )}
                                    </div>
                                    <div className="font-mono text-xs text-text-muted">
                                      {hit.ip} &nbsp;·&nbsp; {hit.city || "?"}, {hit.country || "?"}
                                    </div>
                                    <div className="font-mono text-xs text-text-muted mt-0.5">
                                      ISP: {hit.isp || "Unknown"}
                                    </div>
                                    {hit.referer && (
                                      <div className="font-mono text-xs text-text-muted mt-0.5 truncate max-w-xs">
                                        Ref: {hit.referer}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className="font-mono text-xs text-text-muted">
                                      {hit.openedAt ? new Date(hit.openedAt).toLocaleString("en-IN") : ""}
                                    </div>
                                    {hit.timezone && (
                                      <div className="font-mono text-xs text-text-muted">{hit.timezone}</div>
                                    )}
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
                          <p className="font-body text-xs text-text-muted mt-1">Embed the pixel in an email and send it — opens will appear here in real time</p>
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