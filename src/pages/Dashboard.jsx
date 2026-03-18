import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import {
  Link2, Zap, Copy, Shield, Activity, ChevronRight,
  AlertCircle, Clock, Smartphone, Globe, Eye, CreditCard,
  X, FileText, ExternalLink, CheckCircle, ChevronDown, ChevronUp
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
  const [credits, setCredits] = useState(userProfile?.credits ?? 0);
  const [selectedLink, setSelectedLink] = useState(null);
  const [openCapture, setOpenCapture] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [serverReady, setServerReady] = useState(false);
  const [serverWaking, setServerWaking] = useState(true);

  // Wake up Render backend on page load
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

  async function handleGenerate(e) {
    e.preventDefault();
    if (credits < 1) { setShowPayment(true); return; }
    if (!destinationUrl.trim()) { setError("Please enter a destination URL"); return; }
    setGenerating(true); setError(""); setSuccess("");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(BACKEND_URL + "/api/links/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: currentUser.uid,
          label: label || "Tracking Link",
          destinationUrl: normalizeUrl(destinationUrl)
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(data.trackingUrl);
      setLabel(""); setDestinationUrl("");
      await fetchUserProfile(currentUser.uid);
    } catch (err) {
      if (err.name === "AbortError") setError("Server timeout — please try again.");
      else setError(err.message);
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

        {/* Server banner */}
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

        {/* Header */}
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

        {/* Stats */}
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

        {/* ── GENERATE LINK — full width on top ── */}
        <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 mb-6">
          <h2 className="font-display text-xl tracking-wider mb-1">GENERATE <span className="text-primary">LINK</span></h2>
          <p className="font-body text-xs text-text-muted mb-6">
            Paste any URL — we generate a short tracking link. When opened, it silently captures 200+ data points then redirects to your URL.
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5 font-body text-sm mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
            </div>
          )}

          {success && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
              <p className="font-body text-xs text-primary mb-3 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Tracking link generated successfully!
              </p>
              <div className="flex items-center gap-3 bg-surface rounded-lg px-4 py-3">
                <Link2 className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-mono text-sm text-text-primary flex-1 truncate">{success}</span>
                <button onClick={() => copyToClipboard(success, "new")}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors flex-shrink-0">
                  {copiedId === "new" ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleGenerate}>
            <div className="flex flex-col md:flex-row gap-3 mb-3">
              <div className="flex-1 relative">
                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input type="text" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="Enter destination URL — e.g. google.com, amazon.in, youtube.com"
                  className="w-full bg-surface border border-surface-border rounded-xl pl-10 pr-4 py-3.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
              </div>
              <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                placeholder="Case label (optional)"
                className="md:w-52 bg-surface border border-surface-border rounded-xl px-4 py-3.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
              <button type="submit" disabled={generating || serverWaking}
                className="px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-xl hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
                <Link2 className="w-4 h-4" />
                {serverWaking ? "Waking server..." : generating ? "Generating..." : "Generate Link"}
              </button>
            </div>
            <p className="font-body text-xs text-text-muted">
              No https:// needed · works with any domain · <span className="text-primary">google.com</span>, <span className="text-primary">instagram.com</span>, <span className="text-primary">amazon.in</span>, etc.
            </p>
          </form>
        </div>

        {/* ── TRACKING LINKS — full width below ── */}
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

                  {/* Link header */}
                  <div className="p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-primary/5 transition-all"
                    onClick={() => setSelectedLink(selectedLink?.id === link.id ? null : link)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-body text-base font-semibold text-text-primary">{link.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono border ${link.active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-surface-border text-text-muted border-surface-border"}`}>
                          {link.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      {/* Tracking URL — styled like Grabify */}
                      <div className="flex items-center gap-2 bg-surface-card rounded-lg px-3 py-2 mb-2">
                        <Link2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="font-mono text-xs text-primary flex-1 truncate">{link.trackingUrl}</span>
                        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(link.trackingUrl, link.id); }}
                          className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded font-body text-xs hover:bg-primary/20 transition-colors flex-shrink-0">
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

                  {/* Link stats */}
                  <div className="px-5 pb-4 flex items-center gap-6 text-xs text-text-muted font-body border-t border-surface-border/40 pt-3">
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{link.clicks || 0} clicks</span>
                    <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" />{link.captures?.length || 0} captures</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{link.createdAt ? new Date(link.createdAt.toMillis()).toLocaleDateString("en-IN") : "-"}</span>
                  </div>

                  {/* Captures — each as separate tab */}
                  {selectedLink?.id === link.id && (
                    <div className="border-t border-surface-border">
                      {(!link.captures || link.captures.length === 0) ? (
                        <div className="p-6 text-center">
                          <p className="font-body text-sm text-text-muted">No captures yet — share the link above to start tracking.</p>
                        </div>
                      ) : (
                        <div className="p-4 space-y-3">
                          <p className="font-body text-xs text-text-secondary uppercase tracking-widest mb-4">
                            {link.captures.length} Device Capture{link.captures.length > 1 ? "s" : ""}
                          </p>
                          {link.captures.map((capture, i) => {
                            const tabKey = link.id + "-" + i;
                            const isOpen = openCapture === tabKey;
                            const hasGPS = capture.gpsLat && capture.gpsLon;
                            return (
                              <div key={i} className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? "border-primary/50 shadow-glow" : "border-surface-border"}`}>

                                {/* Tab header */}
                                <button className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
                                  onClick={() => setOpenCapture(isOpen ? null : tabKey)}>
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isOpen ? "bg-primary text-surface" : "bg-surface-border text-text-muted"}`}>
                                      {i + 1}
                                    </div>
                                    <div className="text-left">
                                      <div className="font-body text-sm font-semibold text-text-primary mb-0.5">
                                        Visitor #{i + 1} &nbsp;·&nbsp; {capture.device || "Unknown"} &nbsp;·&nbsp; {capture.os || "?"}
                                      </div>
                                      <div className="font-mono text-xs text-text-muted">
                                        {capture.ip || "IP unknown"} &nbsp;·&nbsp; {capture.browser || "?"} &nbsp;·&nbsp; {capture.city ? capture.city + ", " + capture.country : capture.country || "Location unknown"}
                                      </div>
                                      <div className="font-mono text-xs text-text-muted mt-0.5">
                                        {capture.capturedAt ? new Date(capture.capturedAt).toLocaleString("en-IN") : ""}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-mono border ${hasGPS ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                                      {hasGPS ? "📍 GPS" : "🌐 IP"}
                                    </span>
                                    {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                                  </div>
                                </button>

                                {/* Tab content */}
                                {isOpen && (
                                  <div className="border-t border-surface-border">
                                    <div className="flex justify-end p-3 border-b border-surface-border/50 bg-surface/50">
                                      <button onClick={() => exportPDF(capture, link.label)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors">
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

// ── PDF Export — ALL fields ───────────────────────────────────────────────────
function exportPDF(capture, linkLabel) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  let y = 20;
  const check = () => { if (y > 270) { doc.addPage(); y = 20; } };

  // Header
  doc.setFillColor(0, 180, 216); doc.rect(0, 0, pw, 18, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("TRAXELON — FULL DEVICE CAPTURE REPORT", pw / 2, 12, { align: "center" });
  y = 26;
  doc.setTextColor(40, 40, 40); doc.setFontSize(9); doc.setFont("helvetica", "normal");
  doc.text(`Case / Label : ${linkLabel || "N/A"}`, 14, y); y += 6;
  doc.text(`Captured At  : ${capture.capturedAt || "N/A"}`, 14, y); y += 6;
  doc.text(`GPS Status   : ${capture.gpsLat ? "GPS EXACT (" + capture.gpsLat + ", " + capture.gpsLon + ")" : "IP Location Only"}`, 14, y); y += 10;
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

  sec("1. NETWORK & IP INTELLIGENCE", [
    ["IP Address", capture.ip],
    ["ISP", capture.isp],
    ["Organisation", capture.org],
    ["ASN", capture.asn],
    ["Hostname / rDNS", capture.hostname],
    ["Is Proxy/VPN", capture.isProxy != null ? String(capture.isProxy) : null],
    ["Is Hosting/DC", capture.isHosting != null ? String(capture.isHosting) : null],
    ["Mobile Network", capture.isMobileNetwork != null ? String(capture.isMobileNetwork) : null],
    ["WebRTC Local IP", capture.webrtcLocalIP],
    ["WebRTC Public IP", capture.webrtcPublicIP],
    ["WebRTC Support", capture.webrtcSupport],
    ["Connection Type", capture.connectionType],
    ["Downlink Speed", capture.connectionDownlink ? capture.connectionDownlink + " Mbps" : null],
    ["RTT Latency", capture.connectionRtt ? capture.connectionRtt + " ms" : null],
    ["Max Downlink", capture.connectionDownlinkMax ? capture.connectionDownlinkMax + " Mbps" : null],
    ["Save Data Mode", capture.connectionSaveData != null ? String(capture.connectionSaveData) : null],
  ]);

  sec("2. IP-BASED LOCATION (APPROXIMATE)", [
    ["City", capture.city],
    ["Region / State", capture.region],
    ["Country", capture.country],
    ["Country Code", capture.countryCode],
    ["ZIP / Postal Code", capture.zip],
    ["Coordinates", capture.lat ? capture.lat + ", " + capture.lon : null],
    ["Timezone (IP)", capture.timezone],
  ]);

  if (capture.gpsLat && capture.gpsLon) {
    sec("3. GPS LOCATION (EXACT — USER PERMITTED)", [
      ["GPS Coordinates", capture.gpsLat + ", " + capture.gpsLon],
      ["Accuracy", capture.gpsAccuracy ? capture.gpsAccuracy + " metres" : null],
      ["Altitude", capture.gpsAltitude ? capture.gpsAltitude + " metres" : null],
      ["Speed", capture.gpsSpeed ? capture.gpsSpeed + " m/s" : null],
      ["Heading / Direction", capture.gpsHeading],
      ["Full Address", capture.gpsAddress],
      ["City", capture.gpsCity],
      ["State", capture.gpsState],
      ["Pincode", capture.gpsPincode],
      ["Country", capture.gpsCountry],
    ]);
  }

  sec("4. DEVICE HARDWARE", [
    ["Device Type", capture.device],
    ["Operating System", capture.os],
    ["Browser", capture.browser],
    ["Browser Version", capture.browserVersion],
    ["Platform", capture.platform],
    ["Architecture", capture.architecture],
    ["CPU Cores", capture.cpuCores],
    ["RAM (GB)", capture.ram ? capture.ram + " GB" : null],
    ["GPU Renderer", capture.gpu],
    ["GPU Vendor", capture.gpuVendor],
    ["Max Touch Points", capture.maxTouchPoints],
    ["Touch Support", capture.touchSupport != null ? String(capture.touchSupport) : null],
    ["Pointer Type", capture.pointerType],
    ["Java Enabled", capture.javaEnabled != null ? String(capture.javaEnabled) : null],
    ["PDF Viewer", capture.pdfViewerEnabled != null ? String(capture.pdfViewerEnabled) : null],
    ["Browser Vendor", capture.vendor],
    ["App Name", capture.appName],
    ["Product", capture.product],
    ["Build ID", capture.buildID],
  ]);

  sec("5. WEBGL / GPU DETAILS", [
    ["WebGL Version", capture.webglVersion],
    ["WebGL Renderer", capture.webglRenderer],
    ["WebGL Vendor", capture.webglVendor],
    ["Shading Language", capture.webglShadingLanguage],
    ["Max Texture Size", capture.maxTextureSize],
    ["Max Viewport Dims", capture.maxViewportDims],
    ["Max Anisotropy", capture.maxAnisotropy],
    ["Max Vertex Attribs", capture.maxVertexAttribs],
    ["Max Vertex Uniforms", capture.maxVertexUniformVectors],
    ["Max Fragment Uniforms", capture.maxFragmentUniformVectors],
    ["Point Size Range", capture.aliasedPointSizeRange],
    ["Line Width Range", capture.aliasedLineWidthRange],
    ["Extensions Count", capture.webglExtensionsCount],
    ["WebGL2 Support", capture.webgl2Support != null ? String(capture.webgl2Support) : null],
    ["Shader Precision", capture.shaderPrecision],
    ["WebGL Hash", capture.webglHash],
  ]);

  sec("6. SCREEN & DISPLAY", [
    ["Screen Resolution", capture.screenWidth ? capture.screenWidth + "x" + capture.screenHeight : null],
    ["Available Size", capture.screenAvailWidth ? capture.screenAvailWidth + "x" + capture.screenAvailHeight : null],
    ["Window Inner Size", capture.windowWidth ? capture.windowWidth + "x" + capture.windowHeight : null],
    ["Window Outer Size", capture.outerWidth ? capture.outerWidth + "x" + capture.outerHeight : null],
    ["Color Depth", capture.colorDepth ? capture.colorDepth + " bit" : null],
    ["Pixel Depth", capture.pixelDepth ? capture.pixelDepth + " bit" : null],
    ["Device Pixel Ratio", capture.pixelRatio],
    ["CSS Pixel Density", capture.cssPxDensity],
    ["Orientation", capture.orientation],
    ["Orientation Angle", capture.orientationAngle],
    ["HDR Support", capture.hdrSupport],
    ["Color Gamut", capture.colorGamut],
    ["Forced Colors", capture.forcedColors],
    ["Inverted Colors", capture.invertedColors],
    ["Prefers Dark Mode", capture.prefersColorScheme],
    ["Prefers Reduced Motion", capture.prefersReducedMotion],
  ]);

  sec("7. BATTERY", [
    ["Battery Level", capture.batteryLevel != null ? capture.batteryLevel + "%" : null],
    ["Charging", capture.batteryCharging != null ? (capture.batteryCharging ? "Yes" : "No") : null],
    ["Charging Time", capture.batteryChargingTime ? capture.batteryChargingTime + " seconds" : null],
    ["Discharging Time", capture.batteryDischargingTime ? capture.batteryDischargingTime + " seconds" : null],
  ]);

  sec("8. DATE, TIME & TIMEZONE", [
    ["Local Time", capture.localTime],
    ["Client Timezone", capture.clientTimezone],
    ["UTC Offset", capture.timezoneOffset != null ? capture.timezoneOffset + " minutes" : null],
    ["DST Active", capture.dstActive],
  ]);

  sec("9. BROWSER & USER AGENT", [
    ["User Agent", capture.userAgent],
    ["Language", capture.language],
    ["All Languages", capture.languages],
    ["Cookies Enabled", capture.cookiesEnabled != null ? (capture.cookiesEnabled ? "Yes" : "No") : null],
    ["Do Not Track", capture.doNotTrack],
    ["History Length", capture.historyLength],
    ["Referrer URL", capture.referrer],
    ["Incognito Mode", capture.incognito != null ? (capture.incognito ? "Yes" : "No") : null],
    ["Ad Blocker", capture.adBlockDetected != null ? (capture.adBlockDetected ? "Detected" : "Not detected") : null],
    ["App Version", capture.appVersion],
  ]);

  sec("10. FINGERPRINTS", [
    ["Canvas Fingerprint", capture.canvasHash],
    ["Canvas Geometry Hash", capture.canvasGeometryHash],
    ["Audio Fingerprint", capture.audioFingerprint],
    ["WebGL Fingerprint", capture.webglHash],
    ["Font Fingerprint", capture.fontFingerprint],
    ["CSS Media Hash", capture.cssHash],
  ]);

  sec("11. MEDIA DEVICES", [
    ["Cameras", capture.cameras != null ? String(capture.cameras) : null],
    ["Microphones", capture.microphones != null ? String(capture.microphones) : null],
    ["Speakers", capture.speakers != null ? String(capture.speakers) : null],
    ["Speech Voices Count", capture.speechVoicesCount != null ? String(capture.speechVoicesCount) : null],
    ["Speech Voice Names", capture.speechVoices],
  ]);

  sec("12. STORAGE", [
    ["Storage Quota", capture.storageQuota],
    ["Storage Used", capture.storageUsage],
    ["LocalStorage", capture.localStorageEnabled != null ? String(capture.localStorageEnabled) : null],
    ["SessionStorage", capture.sessionStorageEnabled != null ? String(capture.sessionStorageEnabled) : null],
    ["IndexedDB", capture.indexedDBEnabled != null ? String(capture.indexedDBEnabled) : null],
    ["Cache API", capture.cacheAPIEnabled],
    ["Cookies Count", capture.cookiesCount != null ? String(capture.cookiesCount) : null],
  ]);

  sec("13. FONTS & PLUGINS", [
    ["Fonts Detected", capture.fontsDetected != null ? String(capture.fontsDetected) : null],
    ["Font List", capture.fontsList],
    ["Plugins Count", capture.pluginsCount != null ? String(capture.pluginsCount) : null],
    ["Plugin Names", capture.plugins],
    ["MIME Types", capture.mimeTypes],
  ]);

  sec("14. PERFORMANCE & MEMORY", [
    ["Page Load Time", capture.pageLoadTime],
    ["DOM Content Loaded", capture.domContentLoaded],
    ["DNS Lookup Time", capture.dnsLookupTime],
    ["TCP Connect Time", capture.tcpConnectTime],
    ["Time to First Byte", capture.ttfb],
    ["JS Heap Used", capture.memoryUsed],
    ["JS Heap Total", capture.memoryTotal],
    ["JS Heap Limit", capture.memoryLimit],
  ]);

  sec("15. PERMISSIONS & SENSORS", [
    ["Geolocation", capture.geolocationPermission],
    ["Notifications", capture.notificationsPermission],
    ["Camera", capture.cameraPermission],
    ["Microphone", capture.microphonePermission],
    ["Accelerometer", capture.accelerometerPermission],
    ["Gyroscope", capture.gyroscopePermission],
    ["Magnetometer", capture.magnetometerPermission],
    ["Clipboard Read", capture.clipboardReadPermission],
    ["Clipboard Write", capture.clipboardWritePermission],
  ]);

  sec("16. BROWSER FEATURE SUPPORT", [
    ["WebSocket", capture.webSocketSupport != null ? String(capture.webSocketSupport) : null],
    ["Web Worker", capture.webWorkerSupport != null ? String(capture.webWorkerSupport) : null],
    ["Service Worker", capture.serviceWorkerSupport != null ? String(capture.serviceWorkerSupport) : null],
    ["WebAssembly", capture.webAssemblySupport != null ? String(capture.webAssemblySupport) : null],
    ["Bluetooth API", capture.bluetoothSupport != null ? String(capture.bluetoothSupport) : null],
    ["USB API", capture.usbSupport != null ? String(capture.usbSupport) : null],
    ["Gamepad API", capture.gamepadSupport],
    ["WebXR / VR / AR", capture.xrSupport],
    ["WebRTC", capture.webrtcSupport],
    ["WebGL2", capture.webgl2Support != null ? String(capture.webgl2Support) : null],
    ["OffscreenCanvas", capture.offscreenCanvasSupport],
    ["SharedArrayBuffer", capture.sharedArrayBufferSupport],
    ["BroadcastChannel", capture.broadcastChannelSupport],
    ["Payment Request", capture.paymentRequestSupport],
    ["Credential Mgmt", capture.credentialMgmtSupport],
    ["Presentation API", capture.presentationSupport],
  ]);

  // Footer on every page
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    doc.text(`TRAXELON  ·  Page ${i} of ${total}  ·  CONFIDENTIAL — For Authorised Use Only`, pw / 2, 292, { align: "center" });
  }
  doc.save(`traxelon_${(linkLabel || "capture").replace(/\s+/g, "_")}_${Date.now()}.pdf`);
}

// ── CaptureCard — all sections ────────────────────────────────────────────────
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
        <DataRow label="Country Code" value={capture.countryCode} />
        <DataRow label="ZIP" value={capture.zip} />
        <DataRow label="Coordinates" value={capture.lat ? capture.lat + ", " + capture.lon : null} />
        <DataRow label="Timezone" value={capture.timezone} />
      </Section>

      {hasGPS && (
        <Section title="🛰️ GPS Location (Exact)">
          <DataRow label="GPS Coords" value={capture.gpsLat + ", " + capture.gpsLon} />
          <DataRow label="Accuracy" value={capture.gpsAccuracy ? capture.gpsAccuracy + " metres" : null} />
          <DataRow label="Altitude" value={capture.gpsAltitude ? capture.gpsAltitude + " m" : null} />
          <DataRow label="Speed" value={capture.gpsSpeed ? capture.gpsSpeed + " m/s" : null} />
          <DataRow label="Heading" value={capture.gpsHeading} />
          <DataRow label="Address" value={capture.gpsAddress} />
          <DataRow label="City" value={capture.gpsCity} />
          <DataRow label="State" value={capture.gpsState} />
          <DataRow label="Pincode" value={capture.gpsPincode} />
          <DataRow label="Country" value={capture.gpsCountry} />
          <div className="col-span-2 mt-2">
            <div className="rounded-xl overflow-hidden border border-surface-border mb-3" style={{ height: 200 }}>
              <iframe title={"map-" + index} width="100%" height="100%" frameBorder="0"
                src={"https://maps.google.com/maps?q=" + capture.gpsLat + "," + capture.gpsLon + "&z=16&output=embed"} allowFullScreen />
            </div>
            <a href={"https://www.google.com/maps?q=" + capture.gpsLat + "," + capture.gpsLon}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors">
              📍 Open in Google Maps
            </a>
          </div>
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

      <Section title="⚙️ WebGL / GPU Details">
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
        <DataRow label="Point Size Range" value={capture.aliasedPointSizeRange} />
        <DataRow label="Line Width Range" value={capture.aliasedLineWidthRange} />
        <DataRow label="Shader Precision" value={capture.shaderPrecision} />
        <DataRow label="Extensions Count" value={capture.webglExtensionsCount} />
        <DataRow label="WebGL2 Support" value={capture.webgl2Support != null ? String(capture.webgl2Support) : null} />
        <DataRow label="WebGL Hash" value={capture.webglHash} />
      </Section>

      <Section title="🖥️ Screen & Display">
        <DataRow label="Resolution" value={capture.screenWidth ? capture.screenWidth + "x" + capture.screenHeight : null} />
        <DataRow label="Available Size" value={capture.screenAvailWidth ? capture.screenAvailWidth + "x" + capture.screenAvailHeight : null} />
        <DataRow label="Window Size" value={capture.windowWidth ? capture.windowWidth + "x" + capture.windowHeight : null} />
        <DataRow label="Outer Size" value={capture.outerWidth ? capture.outerWidth + "x" + capture.outerHeight : null} />
        <DataRow label="Color Depth" value={capture.colorDepth ? capture.colorDepth + " bit" : null} />
        <DataRow label="Pixel Depth" value={capture.pixelDepth ? capture.pixelDepth + " bit" : null} />
        <DataRow label="Device Pixel Ratio" value={capture.pixelRatio} />
        <DataRow label="CSS px Density" value={capture.cssPxDensity} />
        <DataRow label="Orientation" value={capture.orientation} />
        <DataRow label="Orientation Angle" value={capture.orientationAngle} />
        <DataRow label="HDR Support" value={capture.hdrSupport} />
        <DataRow label="Color Gamut" value={capture.colorGamut} />
        <DataRow label="Forced Colors" value={capture.forcedColors} />
        <DataRow label="Inverted Colors" value={capture.invertedColors} />
        <DataRow label="Dark Mode" value={capture.prefersColorScheme} />
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

      <Section title="🕐 Date, Time & Timezone">
        <DataRow label="Local Time" value={capture.localTime} />
        <DataRow label="Timezone" value={capture.clientTimezone} />
        <DataRow label="UTC Offset" value={capture.timezoneOffset != null ? capture.timezoneOffset + " min" : null} />
        <DataRow label="DST Active" value={capture.dstActive} />
      </Section>

      <Section title="🔍 Browser Details">
        <DataRow label="Language" value={capture.language} />
        <DataRow label="All Languages" value={capture.languages} />
        <DataRow label="Cookies Enabled" value={capture.cookiesEnabled != null ? (capture.cookiesEnabled ? "Yes" : "No") : null} />
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
        <DataRow label="CSS Media Hash" value={capture.cssHash} />
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

      <Section title="⚡ Performance & Memory">
        <DataRow label="Page Load Time" value={capture.pageLoadTime} />
        <DataRow label="DOM Content Loaded" value={capture.domContentLoaded} />
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

      <Section title="✅ Browser Feature Support">
        <DataRow label="WebSocket" value={capture.webSocketSupport != null ? String(capture.webSocketSupport) : null} />
        <DataRow label="Web Worker" value={capture.webWorkerSupport != null ? String(capture.webWorkerSupport) : null} />
        <DataRow label="Service Worker" value={capture.serviceWorkerSupport != null ? String(capture.serviceWorkerSupport) : null} />
        <DataRow label="WebAssembly" value={capture.webAssemblySupport != null ? String(capture.webAssemblySupport) : null} />
        <DataRow label="Bluetooth API" value={capture.bluetoothSupport != null ? String(capture.bluetoothSupport) : null} />
        <DataRow label="USB API" value={capture.usbSupport != null ? String(capture.usbSupport) : null} />
        <DataRow label="Gamepad API" value={capture.gamepadSupport} />
        <DataRow label="WebXR / VR" value={capture.xrSupport} />
        <DataRow label="WebRTC" value={capture.webrtcSupport} />
        <DataRow label="WebGL2" value={capture.webgl2Support != null ? String(capture.webgl2Support) : null} />
        <DataRow label="OffscreenCanvas" value={capture.offscreenCanvasSupport} />
        <DataRow label="SharedArrayBuffer" value={capture.sharedArrayBufferSupport} />
        <DataRow label="BroadcastChannel" value={capture.broadcastChannelSupport} />
        <DataRow label="Payment Request" value={capture.paymentRequestSupport} />
        <DataRow label="Credential Mgmt" value={capture.credentialMgmtSupport} />
        <DataRow label="Presentation API" value={capture.presentationSupport} />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-2">
      <div className="font-body text-xs text-primary uppercase tracking-wider mb-2 pb-1.5 border-b border-surface-border flex items-center gap-2">
        {title}
      </div>
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
            <p className="font-body text-text-secondary text-sm">{plans[selected].credits} credits added to your account.</p>
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