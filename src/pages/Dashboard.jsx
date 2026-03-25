import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import {
  Link2, Zap, Copy, Shield, Activity, ChevronRight,
  AlertCircle, Clock, Smartphone, Globe, Eye, CreditCard,
  X, FileText, ExternalLink, CheckCircle, ChevronDown, ChevronUp, Scissors
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

export default function Dashboard() {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const [links, setLinks] = useState([]);
  const [label, setLabel] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [shortening, setShortening] = useState(false);
  const [shortenerProvider, setShortenerProvider] = useState("isgd");
  const [credits, setCredits] = useState(userProfile?.credits ?? 0);
  const [selectedLink, setSelectedLink] = useState(null);
  const [openCapture, setOpenCapture] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [serverReady, setServerReady] = useState(false);
  const [serverWaking, setServerWaking] = useState(true);

  useEffect(() => {
    setServerWaking(true);
    fetch(BACKEND_URL + "/api/links/health")
      .then(() => setServerReady(true))
      .catch(() => setServerReady(false))
      .finally(() => setServerWaking(false));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      if (snap.exists()) setCredits(snap.data().credits ?? 0);
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "trackingLinks"), where("uid", "==", currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setLinks(data);
    });
    return unsub;
  }, [currentUser]);

  function normalizeUrl(raw) {
    const t = raw.trim();
    if (!t) return null;
    if (/^https?:\/\//i.test(t)) return t;
    return "https://" + t;
  }

  async function shortenUrl(longUrl, provider) {
    try {
      const res = await fetch(BACKEND_URL + "/api/links/shorten-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: longUrl, provider }),
      });
      const data = await res.json();
      if (!data.shortUrl || data.shortUrl === longUrl) {
        console.warn("Shortening failed for provider:", provider);
        return null;
      }
      return data.shortUrl;
    } catch { return null; }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (credits < 1) { setShowPayment(true); return; }
    if (!destinationUrl.trim()) { setError("Please enter a destination URL"); return; }
    setGenerating(true); setError(""); setSuccess(""); setShortUrl("");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(BACKEND_URL + "/api/links/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: currentUser.uid,
          label: label || "Tracking Link",
          destinationUrl: normalizeUrl(destinationUrl),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(data.trackingUrl);
      setShortening(true);
      const short = await shortenUrl(data.trackingUrl, shortenerProvider);
      setShortUrl(short || "FAILED");
      setShortening(false);
      setLabel("");
      setDestinationUrl("");
      await fetchUserProfile(currentUser.uid);
    } catch (err) {
      if (err.name === "AbortError") setError("Server timeout — please try again.");
      else setError(err.message);
      setShortening(false);
    }
    setGenerating(false);
  }

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {serverWaking && (
          <div className="mb-4 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl px-4 py-3 font-body text-sm">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
            Waking up server — please wait before generating a link (~30s on first load)
          </div>
        )}
        {!serverWaking && serverReady && (
          <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 font-body text-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
            Server is online — ready to generate links
          </div>
        )}
        {!serverWaking && !serverReady && (
          <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 font-body text-sm">
            <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
            Server offline — refresh the page
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl tracking-wider">COMMAND <span className="text-primary">CENTER</span></h1>
            <p className="font-body text-sm text-text-secondary mt-1">
              Welcome back, <span className="text-primary">{userProfile?.displayName || "Officer"}</span>
              {userProfile?.badgeId && <span className="text-text-muted"> · Badge #{userProfile.badgeId}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-surface-card border border-surface-border rounded-xl px-5 py-3 flex items-center gap-3">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <div className="font-mono text-2xl text-primary leading-none">{credits}</div>
                <div className="font-body text-xs text-text-muted">Credits</div>
              </div>
            </div>
            <button onClick={() => setShowPayment(true)} className="px-4 py-3 bg-primary/10 border border-primary/30 text-primary rounded-xl font-body text-sm hover:bg-primary/20 transition-colors flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Buy Credits
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Links", value: links.length, icon: <Link2 className="w-4 h-4" /> },
            { label: "Total Captures", value: links.reduce((a, l) => a + (l.captures?.length || 0), 0), icon: <Eye className="w-4 h-4" /> },
            { label: "Active Links", value: links.filter((l) => l.active).length, icon: <Activity className="w-4 h-4" /> },
            { label: "Total Clicks", value: links.reduce((a, l) => a + (l.clicks || 0), 0), icon: <Globe className="w-4 h-4" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-card border border-surface-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-text-muted mb-2">{stat.icon}<span className="font-body text-xs uppercase tracking-wider">{stat.label}</span></div>
              <div className="font-display text-3xl text-text-primary">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* GENERATE LINK */}
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 mb-6">
          <h2 className="font-display text-xl tracking-wider mb-1">GENERATE <span className="text-primary">LINK</span></h2>
          <p className="font-body text-xs text-text-muted mb-6">
            Paste any URL — generates a tracking link + short link. Silently captures 200+ data points then redirects instantly.
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5 font-body text-sm mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleGenerate}>
            <div className="flex flex-col md:flex-row gap-3 mb-3">
              <div className="flex-1 relative">
                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="Enter destination URL — e.g. google.com, amazon.in"
                  className="w-full bg-surface border border-surface-border rounded-xl pl-10 pr-4 py-3.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Case label (optional)"
                className="md:w-52 bg-surface border border-surface-border rounded-xl px-4 py-3.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={generating || serverWaking}
                className="px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-xl hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Link2 className="w-4 h-4" />
                {serverWaking ? "Waking server..." : generating ? "Generating..." : "Generate Link"}
              </button>
            </div>
            <p className="font-body text-xs text-text-muted">
              No https:// needed · <span className="text-primary">google.com</span>, <span className="text-primary">instagram.com</span>, <span className="text-primary">amazon.in</span>
            </p>
          </form>

          {success && (
            <div className="mt-6 border-t border-surface-border pt-6 space-y-4">
              <p className="font-body text-xs text-green-400 font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Tracking link generated successfully!
              </p>

              <div className="bg-surface border border-surface-border rounded-xl p-4">
                <p className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">Full Tracking Link</p>
                <div className="flex items-center gap-3">
                  <Link2 className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <span className="font-mono text-xs text-text-secondary flex-1 truncate">{success}</span>
                  <button onClick={() => copyToClipboard(success, "full")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-border text-text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors flex-shrink-0">
                    {copiedId === "full" ? <><CheckCircle className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <p className="font-body text-xs text-primary uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5" /> Short Link
                    {shortening && <span className="text-yellow-400 animate-pulse ml-2">generating...</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-xs text-text-muted">Domain:</span>
                    <select
                      value={shortenerProvider}
                      onChange={(e) => {
                        const prov = e.target.value;
                        setShortenerProvider(prov);
                        if (success) {
                          setShortening(true);
                          setShortUrl("");
                          shortenUrl(success, prov).then(s => {
                            setShortUrl(s || "FAILED");
                            setShortening(false);
                          });
                        }
                      }}
                      className="bg-surface border border-surface-border text-text-primary text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="isgd">is.gd — random (free)</option>
                      <option value="vgd">v.gd — random (free)</option>
                      <option value="tinyurl">tinyurl.com (free)</option>
                      <option value="cleanuri">cleanuri.com (free)</option>
                      <option value="dagd">da.gd (free)</option>
                      <option value="ulvis">ulvis.net (free)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className={`font-mono text-sm font-bold flex-1 truncate ${shortUrl === "FAILED" ? "text-red-400" : "text-primary"}`}>
                    {shortening ? "Shortening..." : shortUrl === "FAILED" ? "Provider unavailable — try another domain" : (shortUrl || success)}
                  </span>
                  {shortUrl !== "FAILED" && (
                    <button onClick={() => copyToClipboard(shortUrl || success, "short")}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors flex-shrink-0">
                      {copiedId === "short" ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                    </button>
                  )}
                </div>
                <p className="font-body text-xs text-text-muted mt-2">
                  ↑ Target only sees the short domain — Traxalon is completely hidden
                </p>
              </div>
            </div>
          )}
        </div>

        {/* TRACKING LINKS */}
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
          <h2 className="font-display text-xl tracking-wider mb-6">TRACKING <span className="text-primary">LINKS</span></h2>

          {links.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <p className="font-body text-text-muted">No links generated yet</p>
              <p className="font-body text-xs text-text-muted mt-1">Generate your first tracking link above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {links.map((link) => (
                <div key={link.id} className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
                  <div
                    className="p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-primary/5 transition-all"
                    onClick={() => setSelectedLink(selectedLink?.id === link.id ? null : link)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-body text-base font-semibold text-text-primary">{link.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono border ${link.active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-surface-border text-text-muted border-surface-border"}`}>
                          {link.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-card rounded-lg px-3 py-2 mb-2">
                        <Link2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="font-mono text-xs text-primary flex-1 truncate">{link.trackingUrl}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(link.trackingUrl, link.id); }}
                          className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded font-body text-xs hover:bg-primary/20 transition-colors flex-shrink-0"
                        >
                          {copiedId === link.id ? <><CheckCircle className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                      {link.destinationUrl && (
                        <div className="flex items-center gap-1.5">
                          <ExternalLink className="w-3 h-3 text-text-muted" />
                          <span className="font-mono text-xs text-text-muted truncate">Redirects to: {link.destinationUrl}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className={`w-5 h-5 text-text-muted transition-transform flex-shrink-0 mt-1 ${selectedLink?.id === link.id ? "rotate-90" : ""}`} />
                  </div>

                  <div className="px-5 pb-4 flex items-center gap-6 text-xs text-text-muted font-body border-t border-surface-border/40 pt-3">
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{link.clicks || 0} clicks</span>
                    <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" />{link.captures?.length || 0} captures</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{link.createdAt ? new Date(link.createdAt.toMillis()).toLocaleDateString("en-IN") : "-"}</span>
                  </div>

                  {selectedLink?.id === link.id && (
                    <div className="border-t border-surface-border">
                      {(!link.captures || link.captures.length === 0) ? (
                        <div className="p-6 text-center">
                          <p className="font-body text-sm text-text-muted">No captures yet — share the link to start tracking.</p>
                        </div>
                      ) : (
                        <div className="p-4 space-y-3">
                          <p className="font-body text-xs text-text-secondary uppercase tracking-widest mb-4">
                            {link.captures.length} Device Capture{link.captures.length > 1 ? "s" : ""} — latest first
                          </p>
                          {[...link.captures].reverse().map((capture, ri) => {
                            const i = link.captures.length - 1 - ri;
                            const tabKey = link.id + "-" + i;
                            const isOpen = openCapture === tabKey;
                            const hasGPS = capture.gpsLat && capture.gpsLon;
                            return (
                              <div key={i} className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? "border-primary/50 shadow-glow" : "border-surface-border"}`}>
                                <button
                                  className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
                                  onClick={() => setOpenCapture(isOpen ? null : tabKey)}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isOpen ? "bg-primary text-surface" : "bg-surface-border text-text-muted"}`}>
                                      {i + 1}
                                    </div>
                                    <div className="text-left">
                                      <div className="font-body text-sm font-semibold text-text-primary mb-0.5">
                                        Visitor #{i + 1} &nbsp;·&nbsp; {capture.device || "Unknown Device"}
                                      </div>
                                      <div className="font-mono text-xs text-text-muted">
                                        {capture.ip || "IP unknown"} &nbsp;·&nbsp; {capture.browser || "Unknown Browser"}
                                      </div>
                                      <div className="font-mono text-xs text-text-muted mt-0.5">
                                        {capture.capturedAt ? new Date(capture.capturedAt).toLocaleString("en-IN") : ""}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {capture.isMoving && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse font-mono">
                                        🚶 MOVING
                                      </span>
                                    )}
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-mono border ${hasGPS ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                                      {hasGPS ? "📍 GPS" : "🌐 IP"}
                                    </span>
                                    {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                                  </div>
                                </button>

                                {isOpen && (
                                  <div className="border-t border-surface-border">
                                    <div className="flex justify-end p-3 border-b border-surface-border/50 bg-surface/50">
                                      <button
                                        onClick={() => exportPDF(capture, link.label)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors"
                                      >
                                        <FileText className="w-3.5 h-3.5" /> Export Full PDF Report
                                      </button>
                                    </div>
                                    <div className="p-4">
                                      <CaptureCard capture={capture} index={i} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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

      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} uid={currentUser?.uid} fetchUserProfile={fetchUserProfile} />}
    </div>
  );
}

function exportPDF(capture, linkLabel) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;
  const check = () => { if (y > 270) { doc.addPage(); y = 20; } };
  doc.setFillColor(0, 180, 216); doc.rect(0, 0, pw, 18, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("TRAXELON — FULL DEVICE CAPTURE REPORT", pw / 2, 12, { align: "center" });
  y = 26;
  doc.setTextColor(40, 40, 40); doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(`Case / Label : ${linkLabel || "N/A"}`, 14, y); y += 6;
  doc.text(`Captured At  : ${capture.capturedAt || "N/A"}`, 14, y); y += 6;
  doc.text(`GPS Status   : ${capture.gpsLat ? "EXACT GPS (" + capture.gpsLat + ", " + capture.gpsLon + ")" : "IP Location Only"}`, 14, y); y += 10;
  doc.setDrawColor(0, 180, 216); doc.setLineWidth(0.5); doc.line(14, y, pw - 14, y); y += 6;

  const sec = (title, rows) => {
    check();
    doc.setFillColor(224, 247, 250); doc.rect(14, y - 4, pw - 28, 8, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(0, 130, 160);
    doc.text(title, 16, y + 1); y += 9;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(30, 30, 30);
    rows.forEach(([l, v]) => {
      if (v == null || v === "" || v === "null" || v === "undefined") return;
      check();
      doc.setFont("helvetica", "bold"); doc.setTextColor(80, 80, 80); doc.text(l + ":", 16, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(20, 20, 20);
      const lines = doc.splitTextToSize(String(v), pw - 78);
      doc.text(lines, 74, y); y += lines.length * 5 + 2;
    }); y += 3;
  };

  sec("1. NETWORK & IP", [["IP Address", capture.ip],["ISP", capture.isp],["Organisation", capture.org],["ASN", capture.asn],["Hostname", capture.hostname],["Is Proxy/VPN", capture.isProxy != null ? String(capture.isProxy) : null],["Is Hosting", capture.isHosting != null ? String(capture.isHosting) : null],["Mobile Network", capture.isMobileNetwork != null ? String(capture.isMobileNetwork) : null],["WebRTC Local IP", capture.webrtcLocalIP],["WebRTC Public IP", capture.webrtcPublicIP],["Connection Type", capture.connectionType],["Downlink", capture.connectionDownlink ? capture.connectionDownlink + " Mbps" : null],["RTT", capture.connectionRtt ? capture.connectionRtt + " ms" : null]]);
  sec("2. IP LOCATION", [["City", capture.city],["Region", capture.region],["Country", capture.country],["ZIP", capture.zip],["Coordinates", capture.lat ? capture.lat + ", " + capture.lon : null],["Timezone", capture.timezone]]);
  if (capture.gpsLat && capture.gpsLon) {
    sec("3. GPS LOCATION (EXACT)", [["GPS Coordinates", capture.gpsLat + ", " + capture.gpsLon],["Accuracy", capture.gpsAccuracy ? capture.gpsAccuracy + " metres" : null],["Altitude", capture.gpsAltitude ? capture.gpsAltitude + " m" : null],["Speed", capture.gpsSpeed ? capture.gpsSpeed + " m/s" : null],["Heading", capture.gpsHeading],["Full Address", capture.gpsAddress],["City", capture.gpsCity],["State", capture.gpsState],["Pincode", capture.gpsPincode],["Country", capture.gpsCountry]]);
  }
  sec("4. DEVICE", [["Device Type", capture.device],["Android Model", capture.androidModel],["OS", capture.os],["Browser", capture.browser],["Browser Version", capture.browserVersion],["Platform", capture.platform],["Architecture", capture.architecture],["CPU Cores", capture.cpuCores],["RAM", capture.ram ? capture.ram + " GB" : null],["GPU", capture.gpu],["GPU Vendor", capture.gpuVendor],["Touch Points", capture.maxTouchPoints],["Vendor", capture.vendor],["App Name", capture.appName],["Product", capture.product],["Build ID", capture.buildID]]);
  sec("5. WEBGL / GPU", [["WebGL Version", capture.webglVersion],["Renderer", capture.webglRenderer],["Vendor", capture.webglVendor],["Shading Language", capture.webglShadingLanguage],["Max Texture Size", capture.maxTextureSize],["Max Viewport", capture.maxViewportDims],["Extensions Count", capture.webglExtensionsCount],["WebGL2", capture.webgl2Support != null ? String(capture.webgl2Support) : null],["Shader Precision", capture.shaderPrecision],["WebGL Hash", capture.webglHash]]);
  sec("6. SCREEN", [["Resolution", capture.screenWidth ? capture.screenWidth + "x" + capture.screenHeight : null],["Available", capture.screenAvailWidth ? capture.screenAvailWidth + "x" + capture.screenAvailHeight : null],["Window", capture.windowWidth ? capture.windowWidth + "x" + capture.windowHeight : null],["Pixel Ratio", capture.pixelRatio],["Color Depth", capture.colorDepth ? capture.colorDepth + " bit" : null],["Orientation", capture.orientation],["HDR", capture.hdrSupport],["Color Gamut", capture.colorGamut],["Dark Mode", capture.prefersColorScheme]]);
  sec("7. BATTERY", [["Level", capture.batteryLevel != null ? capture.batteryLevel + "%" : null],["Charging", capture.batteryCharging != null ? (capture.batteryCharging ? "Yes" : "No") : null],["Charging Time", capture.batteryChargingTime ? capture.batteryChargingTime + "s" : null],["Discharging", capture.batteryDischargingTime ? capture.batteryDischargingTime + "s" : null]]);
  sec("8. DATE & TIME", [["Local Time", capture.localTime],["Timezone", capture.clientTimezone],["UTC Offset", capture.timezoneOffset != null ? capture.timezoneOffset + " min" : null],["DST Active", capture.dstActive]]);
  sec("9. BROWSER", [["User Agent", capture.userAgent],["Language", capture.language],["Languages", capture.languages],["Cookies", capture.cookiesEnabled != null ? (capture.cookiesEnabled ? "Yes" : "No") : null],["Do Not Track", capture.doNotTrack],["History Length", capture.historyLength],["Referrer", capture.referrer],["Incognito", capture.incognito != null ? (capture.incognito ? "Yes" : "No") : null],["Ad Blocker", capture.adBlockDetected != null ? (capture.adBlockDetected ? "Yes" : "No") : null]]);
  sec("10. FINGERPRINTS", [["Canvas", capture.canvasHash],["Canvas Geometry", capture.canvasGeometryHash],["Audio", capture.audioFingerprint],["WebGL", capture.webglHash],["Font", capture.fontFingerprint],["CSS", capture.cssHash]]);
  sec("11. MEDIA DEVICES", [["Cameras", capture.cameras != null ? String(capture.cameras) : null],["Microphones", capture.microphones != null ? String(capture.microphones) : null],["Speakers", capture.speakers != null ? String(capture.speakers) : null],["Speech Voices", capture.speechVoicesCount != null ? String(capture.speechVoicesCount) : null],["Voice Names", capture.speechVoices]]);
  sec("12. STORAGE", [["Quota", capture.storageQuota],["Used", capture.storageUsage],["LocalStorage", capture.localStorageEnabled != null ? String(capture.localStorageEnabled) : null],["SessionStorage", capture.sessionStorageEnabled != null ? String(capture.sessionStorageEnabled) : null],["IndexedDB", capture.indexedDBEnabled != null ? String(capture.indexedDBEnabled) : null],["Cache API", capture.cacheAPIEnabled],["Cookies Count", capture.cookiesCount != null ? String(capture.cookiesCount) : null]]);
  sec("13. FONTS & PLUGINS", [["Fonts Detected", capture.fontsDetected != null ? String(capture.fontsDetected) : null],["Font List", capture.fontsList],["Plugins Count", capture.pluginsCount != null ? String(capture.pluginsCount) : null],["Plugin Names", capture.plugins],["MIME Types", capture.mimeTypes]]);
  sec("14. PERFORMANCE", [["Page Load", capture.pageLoadTime],["DOM Loaded", capture.domContentLoaded],["DNS", capture.dnsLookupTime],["TCP", capture.tcpConnectTime],["TTFB", capture.ttfb],["Mem Used", capture.memoryUsed],["Mem Total", capture.memoryTotal],["Mem Limit", capture.memoryLimit]]);
  sec("15. PERMISSIONS", [["Geolocation", capture.geolocationPermission],["Notifications", capture.notificationsPermission],["Camera", capture.cameraPermission],["Microphone", capture.microphonePermission],["Accelerometer", capture.accelerometerPermission],["Gyroscope", capture.gyroscopePermission],["Magnetometer", capture.magnetometerPermission],["Clipboard Read", capture.clipboardReadPermission],["Clipboard Write", capture.clipboardWritePermission]]);
  sec("16. FEATURES", [["WebSocket", capture.webSocketSupport != null ? String(capture.webSocketSupport) : null],["WebWorker", capture.webWorkerSupport != null ? String(capture.webWorkerSupport) : null],["ServiceWorker", capture.serviceWorkerSupport != null ? String(capture.serviceWorkerSupport) : null],["WebAssembly", capture.webAssemblySupport != null ? String(capture.webAssemblySupport) : null],["Bluetooth", capture.bluetoothSupport != null ? String(capture.bluetoothSupport) : null],["USB", capture.usbSupport != null ? String(capture.usbSupport) : null],["Gamepad", capture.gamepadSupport],["WebXR", capture.xrSupport],["WebRTC", capture.webrtcSupport],["WebGL2", capture.webgl2Support != null ? String(capture.webgl2Support) : null],["OffscreenCanvas", capture.offscreenCanvasSupport],["SharedArrayBuffer", capture.sharedArrayBufferSupport],["BroadcastChannel", capture.broadcastChannelSupport],["PaymentRequest", capture.paymentRequestSupport],["CredentialMgmt", capture.credentialMgmtSupport],["Presentation", capture.presentationSupport]]);

  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) { doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150, 150, 150); doc.text(`TRAXELON  ·  Page ${i} of ${total}  ·  CONFIDENTIAL`, pw / 2, 292, { align: "center" }); }
  doc.save(`traxelon_${(linkLabel || "capture").replace(/\s+/g, "_")}_${Date.now()}.pdf`);
}

function CaptureCard({ capture, index }) {
  const hasGPS = capture.gpsLat && capture.gpsLon;
  const hasIPLocation = capture.lat && capture.lon;
  return (
    <div className="space-y-5">
      <Section title="🌐 Network & IP">
        <DataRow label="IP Address" value={capture.ip} />
        <DataRow label="ISP" value={capture.isp} />
        <DataRow label="Organisation" value={capture.org} />
        <DataRow label="ASN" value={capture.asn} />
        <DataRow label="Hostname" value={capture.hostname} />
        <DataRow label="Is Proxy/VPN" value={capture.isProxy != null ? String(capture.isProxy) : null} />
        <DataRow label="Is Hosting" value={capture.isHosting != null ? String(capture.isHosting) : null} />
        <DataRow label="Mobile Network" value={capture.isMobileNetwork != null ? String(capture.isMobileNetwork) : null} />
        <DataRow label="WebRTC Local IP" value={capture.webrtcLocalIP} />
        <DataRow label="WebRTC Public IP" value={capture.webrtcPublicIP} />
        <DataRow label="Connection Type" value={capture.connectionType} />
        <DataRow label="Downlink" value={capture.connectionDownlink ? capture.connectionDownlink + " Mbps" : null} />
        <DataRow label="RTT" value={capture.connectionRtt ? capture.connectionRtt + " ms" : null} />
        <DataRow label="Max Downlink" value={capture.connectionDownlinkMax ? capture.connectionDownlinkMax + " Mbps" : null} />
        <DataRow label="Save Data" value={capture.connectionSaveData != null ? String(capture.connectionSaveData) : null} />
      </Section>

      <Section title="📡 IP Location (Approximate)">
        <DataRow label="City" value={capture.city} />
        <DataRow label="Region" value={capture.region} />
        <DataRow label="Country" value={capture.country} />
        <DataRow label="ZIP" value={capture.zip} />
        <DataRow label="Coordinates" value={capture.lat ? capture.lat + ", " + capture.lon : null} />
        <DataRow label="Timezone" value={capture.timezone} />
      </Section>

      {hasGPS && (
        <Section title="🛰️ GPS Location (Exact)">
          <DataRow label="GPS Coords" value={capture.gpsLat + ", " + capture.gpsLon} />
          <DataRow label="Accuracy" value={capture.gpsAccuracy ? capture.gpsAccuracy + " metres" : null} />
          <DataRow label="Altitude" value={capture.gpsAltitude ? capture.gpsAltitude + " m" : null} />
          <DataRow label="Speed" value={capture.gpsSpeed ? (capture.gpsSpeed * 3.6).toFixed(1) + " km/h" : null} />
          <DataRow label="Heading" value={capture.gpsHeading} />
          <DataRow label="Is Moving" value={capture.isMoving != null ? (capture.isMoving ? "🚶 Yes — Moving" : "🛑 No — Stationary") : null} />
          <DataRow label="Address" value={capture.gpsAddress} />
          <DataRow label="City" value={capture.gpsCity} />
          <DataRow label="State" value={capture.gpsState} />
          <DataRow label="Pincode" value={capture.gpsPincode} />
          <DataRow label="Country" value={capture.gpsCountry} />
          <div className="col-span-2 mt-2">
            <div className="rounded-xl overflow-hidden border border-surface-border mb-3" style={{ height: 220 }}>
              <iframe
                title={"map-" + index}
                width="100%"
                height="100%"
                frameBorder="0"
                src={"https://maps.google.com/maps?q=" + capture.gpsLat + "," + capture.gpsLon + "&z=16&output=embed"}
                allowFullScreen
              />
            </div>
            <a
              href={"https://www.google.com/maps?q=" + capture.gpsLat + "," + capture.gpsLon}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors"
            >
              📍 Open Exact Location in Google Maps
            </a>
          </div>
          {capture.locationHistory && capture.locationHistory.length > 0 && (
            <div className="col-span-2 mt-3">
              <div className="font-body text-xs text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                🗺️ Movement Trail ({capture.locationHistory.length} location points)
                {capture.isMoving && <span className="text-yellow-400 animate-pulse font-bold">● CURRENTLY MOVING</span>}
              </div>
              <div className="bg-surface border border-surface-border rounded-xl p-3 space-y-1.5 max-h-48 overflow-y-auto">
                {[...capture.locationHistory].reverse().map((loc, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${loc.isMoving ? "bg-yellow-400" : "bg-green-400"}`} />
                    <span className="font-mono text-text-primary">
                      {Number(loc.lat).toFixed(5)}, {Number(loc.lon).toFixed(5)}
                    </span>
                    {loc.speed != null && loc.speed > 0 && (
                      <span className="text-primary font-semibold">{(loc.speed * 3.6).toFixed(1)} km/h</span>
                    )}
                    {loc.accuracy && (
                      <span className="text-text-muted">±{Math.round(loc.accuracy)}m</span>
                    )}
                    <span className="text-text-muted ml-auto flex-shrink-0">
                      {new Date(loc.timestamp).toLocaleTimeString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
              <p className="font-body text-xs text-text-muted mt-1.5">
                🟢 Stationary &nbsp;·&nbsp; 🟡 Moving — Updates every few seconds while target has the page open
              </p>
            </div>
          )}
        </Section>
      )}

      {!hasGPS && hasIPLocation && (
        <Section title="🗺️ Approximate Location Map">
          <div className="col-span-2">
            <div className="rounded-xl overflow-hidden border border-surface-border" style={{ height: 200 }}>
              <iframe title={"map-ip-" + index} width="100%" height="100%" frameBorder="0"
                src={"https://maps.google.com/maps?q=" + capture.lat + "," + capture.lon + "&z=12&output=embed"} allowFullScreen />
            </div>
          </div>
        </Section>
      )}

      <Section title="📱 Device Hardware">
        <DataRow label="Device Type" value={capture.device} />
        <DataRow label="Android Model" value={capture.androidModel} />
        <DataRow label="OS" value={capture.os} />
        <DataRow label="Browser" value={capture.browser} />
        <DataRow label="Browser Version" value={capture.browserVersion} />
        <DataRow label="Platform" value={capture.platform} />
        <DataRow label="Architecture" value={capture.architecture} />
        <DataRow label="CPU Cores" value={capture.cpuCores} />
        <DataRow label="RAM" value={capture.ram ? capture.ram + " GB" : null} />
        <DataRow label="GPU" value={capture.gpu} />
        <DataRow label="GPU Vendor" value={capture.gpuVendor} />
        <DataRow label="Touch Points" value={capture.maxTouchPoints} />
        <DataRow label="Touch Support" value={capture.touchSupport != null ? String(capture.touchSupport) : null} />
        <DataRow label="Pointer Type" value={capture.pointerType} />
        <DataRow label="Java Enabled" value={capture.javaEnabled != null ? String(capture.javaEnabled) : null} />
        <DataRow label="PDF Viewer" value={capture.pdfViewerEnabled != null ? String(capture.pdfViewerEnabled) : null} />
        <DataRow label="Vendor" value={capture.vendor} />
        <DataRow label="App Name" value={capture.appName} />
        <DataRow label="Product" value={capture.product} />
        <DataRow label="Build ID" value={capture.buildID} />
      </Section>

      <Section title="⚙️ WebGL / GPU">
        <DataRow label="WebGL Version" value={capture.webglVersion} />
        <DataRow label="Renderer" value={capture.webglRenderer} />
        <DataRow label="Vendor" value={capture.webglVendor} />
        <DataRow label="Shading Language" value={capture.webglShadingLanguage} />
        <DataRow label="Max Texture Size" value={capture.maxTextureSize} />
        <DataRow label="Max Viewport" value={capture.maxViewportDims} />
        <DataRow label="Max Anisotropy" value={capture.maxAnisotropy} />
        <DataRow label="Vertex Attribs" value={capture.maxVertexAttribs} />
        <DataRow label="Fragment Uniforms" value={capture.maxFragmentUniformVectors} />
        <DataRow label="Vertex Uniforms" value={capture.maxVertexUniformVectors} />
        <DataRow label="Shader Precision" value={capture.shaderPrecision} />
        <DataRow label="Extensions Count" value={capture.webglExtensionsCount} />
        <DataRow label="WebGL2" value={capture.webgl2Support != null ? String(capture.webgl2Support) : null} />
        <DataRow label="WebGL Hash" value={capture.webglHash} />
      </Section>

      <Section title="🖥️ Screen & Display">
        <DataRow label="Resolution" value={capture.screenWidth ? capture.screenWidth + "x" + capture.screenHeight : null} />
        <DataRow label="Available Size" value={capture.screenAvailWidth ? capture.screenAvailWidth + "x" + capture.screenAvailHeight : null} />
        <DataRow label="Window Size" value={capture.windowWidth ? capture.windowWidth + "x" + capture.windowHeight : null} />
        <DataRow label="Outer Size" value={capture.outerWidth ? capture.outerWidth + "x" + capture.outerHeight : null} />
        <DataRow label="Color Depth" value={capture.colorDepth ? capture.colorDepth + " bit" : null} />
        <DataRow label="Pixel Ratio" value={capture.pixelRatio} />
        <DataRow label="Orientation" value={capture.orientation} />
        <DataRow label="HDR Support" value={capture.hdrSupport} />
        <DataRow label="Color Gamut" value={capture.colorGamut} />
        <DataRow label="Dark Mode" value={capture.prefersColorScheme} />
        <DataRow label="Forced Colors" value={capture.forcedColors} />
        <DataRow label="Reduce Motion" value={capture.prefersReducedMotion} />
      </Section>

      {capture.batteryLevel != null && (
        <Section title="🔋 Battery">
          <DataRow label="Battery Level" value={capture.batteryLevel + "%"} />
          <DataRow label="Charging" value={capture.batteryCharging != null ? (capture.batteryCharging ? "Yes ⚡" : "No") : null} />
          <DataRow label="Charging Time" value={capture.batteryChargingTime ? capture.batteryChargingTime + "s" : null} />
          <DataRow label="Discharging Time" value={capture.batteryDischargingTime ? capture.batteryDischargingTime + "s" : null} />
        </Section>
      )}

      <Section title="🕐 Date & Time">
        <DataRow label="Local Time" value={capture.localTime} />
        <DataRow label="Timezone" value={capture.clientTimezone} />
        <DataRow label="UTC Offset" value={capture.timezoneOffset != null ? capture.timezoneOffset + " min" : null} />
        <DataRow label="DST Active" value={capture.dstActive} />
      </Section>

      <Section title="🔍 Browser Details">
        <DataRow label="Language" value={capture.language} />
        <DataRow label="All Languages" value={capture.languages} />
        <DataRow label="Cookies" value={capture.cookiesEnabled != null ? (capture.cookiesEnabled ? "Yes" : "No") : null} />
        <DataRow label="Do Not Track" value={capture.doNotTrack} />
        <DataRow label="History Length" value={capture.historyLength} />
        <DataRow label="Referrer" value={capture.referrer} />
        <DataRow label="Incognito" value={capture.incognito != null ? (capture.incognito ? "Yes 🕵️" : "No") : null} />
        <DataRow label="Ad Blocker" value={capture.adBlockDetected != null ? (capture.adBlockDetected ? "Detected" : "Not detected") : null} />
        <DataRow label="User Agent" value={capture.userAgent} />
      </Section>

      <Section title="🔐 Fingerprints">
        <DataRow label="Canvas Hash" value={capture.canvasHash} />
        <DataRow label="Canvas Geometry" value={capture.canvasGeometryHash} />
        <DataRow label="Audio Fingerprint" value={capture.audioFingerprint} />
        <DataRow label="WebGL Hash" value={capture.webglHash} />
        <DataRow label="Font Fingerprint" value={capture.fontFingerprint} />
        <DataRow label="CSS Hash" value={capture.cssHash} />
      </Section>

      <Section title="🎵 Media Devices">
        <DataRow label="Cameras" value={capture.cameras != null ? String(capture.cameras) : null} />
        <DataRow label="Microphones" value={capture.microphones != null ? String(capture.microphones) : null} />
        <DataRow label="Speakers" value={capture.speakers != null ? String(capture.speakers) : null} />
        <DataRow label="Speech Voices" value={capture.speechVoicesCount != null ? String(capture.speechVoicesCount) : null} />
        <DataRow label="Voice Names" value={capture.speechVoices} />
      </Section>

      <Section title="💾 Storage">
        <DataRow label="Storage Quota" value={capture.storageQuota} />
        <DataRow label="Storage Used" value={capture.storageUsage} />
        <DataRow label="LocalStorage" value={capture.localStorageEnabled != null ? String(capture.localStorageEnabled) : null} />
        <DataRow label="SessionStorage" value={capture.sessionStorageEnabled != null ? String(capture.sessionStorageEnabled) : null} />
        <DataRow label="IndexedDB" value={capture.indexedDBEnabled != null ? String(capture.indexedDBEnabled) : null} />
        <DataRow label="Cache API" value={capture.cacheAPIEnabled} />
        <DataRow label="Cookies Count" value={capture.cookiesCount != null ? String(capture.cookiesCount) : null} />
      </Section>

      <Section title="⚡ Performance">
        <DataRow label="Page Load" value={capture.pageLoadTime} />
        <DataRow label="DOM Loaded" value={capture.domContentLoaded} />
        <DataRow label="DNS Lookup" value={capture.dnsLookupTime} />
        <DataRow label="TCP Connect" value={capture.tcpConnectTime} />
        <DataRow label="TTFB" value={capture.ttfb} />
        <DataRow label="JS Heap Used" value={capture.memoryUsed} />
        <DataRow label="JS Heap Total" value={capture.memoryTotal} />
        <DataRow label="JS Heap Limit" value={capture.memoryLimit} />
      </Section>

      <Section title="🔤 Fonts & Plugins">
        <DataRow label="Fonts Detected" value={capture.fontsDetected != null ? String(capture.fontsDetected) : null} />
        <DataRow label="Font Fingerprint" value={capture.fontFingerprint} />
        <DataRow label="Font List" value={capture.fontsList} />
        <DataRow label="Plugins Count" value={capture.pluginsCount != null ? String(capture.pluginsCount) : null} />
        <DataRow label="MIME Types" value={capture.mimeTypes} />
        <DataRow label="Plugin Names" value={capture.plugins} />
      </Section>

      <Section title="🎮 Sensors & Permissions">
        <DataRow label="Geolocation" value={capture.geolocationPermission} />
        <DataRow label="Notifications" value={capture.notificationsPermission} />
        <DataRow label="Camera" value={capture.cameraPermission} />
        <DataRow label="Microphone" value={capture.microphonePermission} />
        <DataRow label="Accelerometer" value={capture.accelerometerPermission} />
        <DataRow label="Gyroscope" value={capture.gyroscopePermission} />
        <DataRow label="Magnetometer" value={capture.magnetometerPermission} />
        <DataRow label="Clipboard Read" value={capture.clipboardReadPermission} />
        <DataRow label="Clipboard Write" value={capture.clipboardWritePermission} />
      </Section>

      <Section title="✅ Feature Support">
        <DataRow label="WebSocket" value={capture.webSocketSupport != null ? String(capture.webSocketSupport) : null} />
        <DataRow label="Web Worker" value={capture.webWorkerSupport != null ? String(capture.webWorkerSupport) : null} />
        <DataRow label="Service Worker" value={capture.serviceWorkerSupport != null ? String(capture.serviceWorkerSupport) : null} />
        <DataRow label="WebAssembly" value={capture.webAssemblySupport != null ? String(capture.webAssemblySupport) : null} />
        <DataRow label="Bluetooth" value={capture.bluetoothSupport != null ? String(capture.bluetoothSupport) : null} />
        <DataRow label="USB" value={capture.usbSupport != null ? String(capture.usbSupport) : null} />
        <DataRow label="Gamepad" value={capture.gamepadSupport} />
        <DataRow label="WebXR/VR" value={capture.xrSupport} />
        <DataRow label="WebRTC" value={capture.webrtcSupport} />
        <DataRow label="WebGL2" value={capture.webgl2Support != null ? String(capture.webgl2Support) : null} />
        <DataRow label="OffscreenCanvas" value={capture.offscreenCanvasSupport} />
        <DataRow label="SharedArrayBuffer" value={capture.sharedArrayBufferSupport} />
        <DataRow label="BroadcastChannel" value={capture.broadcastChannelSupport} />
        <DataRow label="PaymentRequest" value={capture.paymentRequestSupport} />
        <DataRow label="CredentialMgmt" value={capture.credentialMgmtSupport} />
        <DataRow label="Presentation" value={capture.presentationSupport} />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-2">
      <div className="font-body text-xs text-primary uppercase tracking-wider mb-2 pb-1.5 border-b border-surface-border">{title}</div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  );
}

function DataRow({ label, value }) {
  if (value == null || value === "" || value === "null" || value === "undefined") return null;
  return (
    <div>
      <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-0.5">{label}</div>
      <div className="font-mono text-xs text-text-primary break-all">{String(value)}</div>
    </div>
  );
}

function PaymentModal({ onClose, uid, fetchUserProfile }) {
  const plans = [
    { credits: 5, price: 99, label: "Starter Pack" },
    { credits: 15, price: 249, label: "Investigation Pack", popular: true },
    { credits: 50, price: 699, label: "Department Pack" },
  ];
  const [selected, setSelected] = React.useState(1);
  const [processing, setProcessing] = React.useState(false);
  const [done, setDone] = React.useState(false);

  async function handlePurchase() {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    const { addCredits } = await import("../utils/linkService");
    await addCredits(uid, plans[selected].credits);
    await fetchUserProfile(uid);
    setDone(true); setProcessing(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 w-full max-w-md shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl tracking-wider text-text-primary">BUY <span className="text-primary">CREDITS</span></h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
        </div>
        {done ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-display text-2xl text-primary mb-2">Credits Added!</h3>
            <p className="font-body text-text-secondary text-sm">{plans[selected].credits} credits added.</p>
            <button onClick={onClose} className="mt-6 px-6 py-3 bg-primary text-surface font-body font-bold rounded-lg">Back to Dashboard</button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {plans.map((plan, i) => (
                <button key={i} onClick={() => setSelected(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selected === i ? "border-primary bg-primary/10 shadow-glow" : "border-surface-border bg-surface hover:border-primary/40"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg text-text-primary">{plan.label}</span>
                        {plan.popular && <span className="bg-primary text-surface text-xs px-2 py-0.5 rounded-full font-body font-bold">POPULAR</span>}
                      </div>
                      <div className="font-body text-sm text-text-secondary mt-0.5">{plan.credits} tracking links</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl text-primary">Rs.{plan.price}</div>
                      <div className="font-body text-xs text-text-muted">Rs.{(plan.price / plan.credits).toFixed(0)}/link</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={handlePurchase} disabled={processing}
              className="w-full px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow disabled:opacity-60 flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              {processing ? "Processing..." : "Pay Rs." + plans[selected].price}
            </button>
          </>
        )}
      </div>
    </div>
  );
}