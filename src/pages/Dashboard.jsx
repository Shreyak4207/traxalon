import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { createTrackingLink } from "../utils/linkService";
import {
  Link2, Zap, Copy, Shield, Activity,
  ChevronRight, AlertCircle, Clock, Smartphone,
  Globe, Eye, CreditCard, X, FileText
} from "lucide-react";

export default function Dashboard() {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const [links, setLinks] = useState([]);
  const [label, setLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [credits, setCredits] = useState(userProfile?.credits ?? 0);
  const [selectedLink, setSelectedLink] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

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

  async function handleGenerate(e) {
    e.preventDefault();
    if (credits < 1) { setShowPayment(true); return; }
    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const { trackingUrl } = await createTrackingLink(currentUser.uid, label || "Tracking Link");
      setSuccess(trackingUrl);
      setLabel("");
      await fetchUserProfile(currentUser.uid);
    } catch (err) {
      setError(err.message);
    }
    setGenerating(false);
  }

  function copyToClipboard(text) { navigator.clipboard.writeText(text); }

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">

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
              <div className="flex items-center gap-2 text-text-muted mb-2">
                {stat.icon}
                <span className="font-body text-xs uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="font-display text-3xl text-text-primary">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
              <h2 className="font-display text-xl tracking-wider mb-1">GENERATE <span className="text-primary">LINK</span></h2>
              <p className="font-body text-xs text-text-muted mb-6">Creates a disguised GPay-looking link that captures device data</p>

              {error && (
                <div className="flex items-start gap-2 bg-accent/10 border border-accent/30 text-accent rounded-lg px-3 py-2.5 font-body text-sm mb-4">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
                </div>
              )}

              {success && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4">
                  <p className="font-body text-xs text-primary mb-2 font-semibold">Link Generated!</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-secondary truncate flex-1">{success}</span>
                    <button onClick={() => copyToClipboard(success)} className="text-primary hover:text-primary-dark flex-shrink-0">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block font-body text-xs text-text-secondary uppercase tracking-wider mb-1.5">Case / Label (optional)</label>
                  <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g., Case #2024-078"
                    className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
                </div>
                <button type="submit" disabled={generating}
                  className="w-full px-4 py-3 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2">
                  <Link2 className="w-4 h-4" />
                  {generating ? "Generating..." : credits > 0 ? "Generate Link (1 credit)" : "No Credits - Buy Now"}
                </button>
              </form>

              <div className="mt-4 p-3 bg-surface border border-surface-border rounded-lg">
                <p className="font-body text-xs text-text-muted">
                  <span className="text-primary font-semibold">How it works: </span>
                  The link appears as a Google Pay lucky draw page. When opened, it silently captures IP, GPS, device info and browser fingerprint.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
              <h2 className="font-display text-xl tracking-wider mb-6">TRACKING <span className="text-primary">LINKS</span></h2>

              {links.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="font-body text-text-muted">No links generated yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1">
                  {links.map((link) => (
                    <div key={link.id}
                      className="bg-surface border border-surface-border rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer"
                      onClick={() => setSelectedLink(selectedLink?.id === link.id ? null : link)}>

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="font-body text-sm font-semibold text-text-primary truncate block mb-1">{link.label}</span>
                          <div className="font-mono text-xs text-text-muted truncate">{link.trackingUrl}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(link.trackingUrl); }} className="p-1.5 text-text-muted hover:text-primary transition-colors">
                            <Copy className="w-4 h-4" />
                          </button>
                          <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${selectedLink?.id === link.id ? "rotate-90" : ""}`} />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted font-body">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{link.clicks || 0} clicks</span>
                        <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" />{link.captures?.length || 0} captures</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{link.createdAt ? new Date(link.createdAt.toMillis()).toLocaleDateString() : "-"}</span>
                      </div>

                      {selectedLink?.id === link.id && link.captures?.length > 0 && (
                        <div className="mt-4 border-t border-surface-border pt-4 space-y-4">
                          <h4 className="font-body text-xs text-text-secondary uppercase tracking-wider">Captured Device Data</h4>
                          {link.captures.map((capture, i) => (
                            <CaptureCard key={i} capture={capture} index={i} linkLabel={link.label} />
                          ))}
                        </div>
                      )}

                      {selectedLink?.id === link.id && (!link.captures || link.captures.length === 0) && (
                        <div className="mt-4 border-t border-surface-border pt-4">
                          <p className="font-body text-xs text-text-muted text-center">No captures yet. Link clicked {link.clicks || 0} time(s).</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} uid={currentUser?.uid} fetchUserProfile={fetchUserProfile} />}
    </div>
  );
}

function exportPDF(capture, linkLabel) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const checkPage = () => {
    if (y > 270) { doc.addPage(); y = 20; }
  };

  // Header bar
  doc.setFillColor(0, 180, 216);
  doc.rect(0, 0, pageWidth, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TRAXELON — DEVICE CAPTURE REPORT", pageWidth / 2, 11, { align: "center" });

  y = 24;
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Case / Label : ${linkLabel || "N/A"}`, 14, y); y += 6;
  doc.text(`Captured At  : ${capture.capturedAt || "N/A"}`, 14, y); y += 6;
  doc.text(`Capture Type : ${capture.captureType === "email_pixel" ? "Email Pixel Open" : "Link Click"}`, 14, y); y += 10;

  // Divider
  doc.setDrawColor(0, 180, 216);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  const addSection = (title, rows) => {
    checkPage();
    doc.setFillColor(224, 247, 250);
    doc.rect(14, y - 4, pageWidth - 28, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 130, 160);
    doc.text(title, 16, y + 1);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    rows.forEach(([lbl, val]) => {
      if (!val || val === "null" || val === "undefined" || val === "false") return;
      checkPage();
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text(`${lbl}:`, 16, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(20, 20, 20);
      const lines = doc.splitTextToSize(String(val), pageWidth - 75);
      doc.text(lines, 72, y);
      y += lines.length * 5 + 1.5;
    });
    y += 4;
  };

  addSection("NETWORK & IP", [
    ["IP Address", capture.ip],
    ["ISP", capture.isp],
    ["Organisation", capture.org],
    ["ASN", capture.asn],
    ["Hostname", capture.hostname],
    ["Is Proxy", capture.isProxy != null ? String(capture.isProxy) : null],
    ["Is Hosting", capture.isHosting != null ? String(capture.isHosting) : null],
    ["Mobile Network", capture.isMobileNetwork != null ? String(capture.isMobileNetwork) : null],
    ["WebRTC Local IP", capture.webrtcLocalIP],
    ["Connection Type", capture.connectionType],
    ["Downlink", capture.connectionDownlink ? capture.connectionDownlink + " Mbps" : null],
    ["RTT", capture.connectionRtt ? capture.connectionRtt + " ms" : null],
  ]);

  addSection("IP LOCATION (APPROXIMATE)", [
    ["City", capture.city],
    ["Region", capture.region],
    ["Country", capture.country],
    ["ZIP", capture.zip],
    ["Coordinates", capture.lat ? `${capture.lat}, ${capture.lon}` : null],
    ["Timezone", capture.timezone],
  ]);

  if (capture.gpsLat && capture.gpsLon) {
    addSection("GPS LOCATION (EXACT)", [
      ["GPS Coordinates", `${capture.gpsLat}, ${capture.gpsLon}`],
      ["Accuracy", capture.gpsAccuracy ? capture.gpsAccuracy + " metres" : null],
      ["Full Address", capture.gpsAddress],
      ["City", capture.gpsCity],
      ["State", capture.gpsState],
      ["Pincode", capture.gpsPincode],
      ["Country", capture.gpsCountry],
    ]);
  }

  addSection("DEVICE", [
    ["Device Type", capture.device],
    ["OS", capture.os],
    ["Browser", capture.browser],
    ["Platform", capture.platform],
    ["CPU Cores", capture.cpuCores],
    ["RAM", capture.ram ? capture.ram + " GB" : null],
    ["GPU", capture.gpu],
    ["GPU Vendor", capture.gpuVendor],
    ["WebGL Version", capture.webglVersion],
    ["WebGL Renderer", capture.webglRenderer],
    ["Touch Points", capture.maxTouchPoints],
    ["Touch Support", capture.touchSupport != null ? String(capture.touchSupport) : null],
    ["Pointer Type", capture.pointerType],
    ["Java Enabled", capture.javaEnabled != null ? String(capture.javaEnabled) : null],
    ["PDF Viewer", capture.pdfViewerEnabled != null ? String(capture.pdfViewerEnabled) : null],
  ]);

  addSection("SCREEN", [
    ["Resolution", capture.screenWidth ? `${capture.screenWidth}x${capture.screenHeight}` : null],
    ["Available Size", capture.screenAvailWidth ? `${capture.screenAvailWidth}x${capture.screenAvailHeight}` : null],
    ["Window Size", capture.windowWidth ? `${capture.windowWidth}x${capture.windowHeight}` : null],
    ["Color Depth", capture.colorDepth ? capture.colorDepth + " bit" : null],
    ["Pixel Ratio", capture.pixelRatio],
    ["Orientation", capture.orientation],
  ]);

  addSection("BATTERY", [
    ["Battery Level", capture.batteryLevel != null ? capture.batteryLevel + "%" : null],
    ["Charging", capture.batteryCharging != null ? (capture.batteryCharging ? "Yes" : "No") : null],
    ["Charging Time", capture.batteryChargingTime ? capture.batteryChargingTime + "s" : null],
    ["Discharging Time", capture.batteryDischargingTime ? capture.batteryDischargingTime + "s" : null],
  ]);

  addSection("DATE & TIME", [
    ["Local Time", capture.localTime],
    ["Timezone", capture.clientTimezone],
    ["UTC Offset", capture.timezoneOffset != null ? capture.timezoneOffset + " min" : null],
  ]);

  addSection("BROWSER DETAILS", [
    ["Language", capture.language],
    ["Languages", capture.languages],
    ["Cookies", capture.cookiesEnabled != null ? (capture.cookiesEnabled ? "Enabled" : "Disabled") : null],
    ["Do Not Track", capture.doNotTrack],
    ["History Length", capture.historyLength],
    ["Referrer", capture.referrer],
    ["Incognito", capture.incognito != null ? (capture.incognito ? "Yes" : "No") : null],
    ["Ad Blocker", capture.adBlockDetected != null ? (capture.adBlockDetected ? "Yes" : "No") : null],
    ["User Agent", capture.userAgent],
  ]);

  addSection("MEDIA DEVICES", [
    ["Cameras", capture.cameras],
    ["Microphones", capture.microphones],
    ["Speakers", capture.speakers],
    ["Speech Voices", capture.speechVoicesCount],
    ["Voice Names", capture.speechVoices],
  ]);

  addSection("STORAGE", [
    ["Storage Quota", capture.storageQuota],
    ["Storage Used", capture.storageUsage],
    ["LocalStorage", capture.localStorageEnabled != null ? String(capture.localStorageEnabled) : null],
    ["SessionStorage", capture.sessionStorageEnabled != null ? String(capture.sessionStorageEnabled) : null],
    ["IndexedDB", capture.indexedDBEnabled != null ? String(capture.indexedDBEnabled) : null],
  ]);

  addSection("FONTS & PLUGINS", [
    ["Fonts Detected", capture.fontsDetected],
    ["Font List", capture.fontsList],
    ["Plugins Count", capture.pluginsCount],
    ["Plugins", capture.plugins],
  ]);

  addSection("FINGERPRINTS", [
    ["Canvas Hash", capture.canvasHash],
    ["Audio Fingerprint", capture.audioFingerprint],
  ]);

  addSection("FEATURE SUPPORT", [
    ["WebSocket", capture.webSocketSupport != null ? String(capture.webSocketSupport) : null],
    ["Web Worker", capture.webWorkerSupport != null ? String(capture.webWorkerSupport) : null],
    ["WebAssembly", capture.webAssemblySupport != null ? String(capture.webAssemblySupport) : null],
    ["Service Worker", capture.serviceWorkerSupport != null ? String(capture.serviceWorkerSupport) : null],
    ["Bluetooth", capture.bluetoothSupport != null ? String(capture.bluetoothSupport) : null],
    ["USB", capture.usbSupport != null ? String(capture.usbSupport) : null],
    ["Notifications", capture.notificationsPermission],
  ]);

  // Footer on every page
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Traxelon Capture Report  |  Page ${i} of ${totalPages}  |  CONFIDENTIAL — For Law Enforcement Use Only`,
      pageWidth / 2, 291, { align: "center" }
    );
  }

  const filename = `traxelon_${(linkLabel || "capture").replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  doc.save(filename);
}

function CaptureCard({ capture, index, linkLabel }) {
  const hasGPS = capture.gpsLat && capture.gpsLon;
  const hasIPLocation = capture.lat && capture.lon;
  const isPixel = capture.captureType === "email_pixel";

  return (
    <div className="bg-surface-elevated border border-surface-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-xs text-text-muted">{capture.capturedAt}</div>
        <div className="flex items-center gap-2">
          {isPixel && (
            <div className="text-xs px-2 py-0.5 rounded-full font-mono border bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
              📧 Email Pixel
            </div>
          )}
          <div className={`text-xs px-2 py-0.5 rounded-full font-mono border ${hasGPS ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"}`}>
            {hasGPS ? "📍 GPS" : "🌐 IP"}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); exportPDF(capture, linkLabel); }}
            className="flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors">
            <FileText className="w-3 h-3" /> Export PDF
          </button>
        </div>
      </div>

      <Section title="🌐 Network & IP">
        <DataRow label="IP Address" value={capture.ip} />
        <DataRow label="ISP" value={capture.isp} />
        <DataRow label="Organisation" value={capture.org} />
        <DataRow label="ASN" value={capture.asn} />
        <DataRow label="Hostname" value={capture.hostname} />
        <DataRow label="Timezone" value={capture.timezone} />
        <DataRow label="Is Proxy" value={capture.isProxy != null ? String(capture.isProxy) : null} />
        <DataRow label="Is Hosting" value={capture.isHosting != null ? String(capture.isHosting) : null} />
        <DataRow label="Mobile Network" value={capture.isMobileNetwork != null ? String(capture.isMobileNetwork) : null} />
        <DataRow label="WebRTC Local IP" value={capture.webrtcLocalIP} />
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
      </Section>

      {hasGPS && (
        <Section title="🛰️ GPS Location (Exact)">
          <DataRow label="GPS Coords" value={capture.gpsLat + ", " + capture.gpsLon} />
          <DataRow label="Accuracy" value={capture.gpsAccuracy ? capture.gpsAccuracy + " metres" : null} />
          <DataRow label="Address" value={capture.gpsAddress} />
          <DataRow label="City" value={capture.gpsCity} />
          <DataRow label="State" value={capture.gpsState} />
          <DataRow label="Pincode" value={capture.gpsPincode} />
          <DataRow label="Country" value={capture.gpsCountry} />
          <div className="col-span-2 mt-2">
            <div className="rounded-xl overflow-hidden border border-surface-border mb-3" style={{ height: 180 }}>
              <iframe title={"map-" + index} width="100%" height="100%" frameBorder="0"
                src={"https://maps.google.com/maps?q=" + capture.gpsLat + "," + capture.gpsLon + "&z=16&output=embed"} allowFullScreen />
            </div>
            <a href={"https://www.google.com/maps?q=" + capture.gpsLat + "," + capture.gpsLon}
              target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors">
              📍 View on Google Maps
            </a>
          </div>
        </Section>
      )}

      {!hasGPS && hasIPLocation && (
        <Section title="🗺️ Approximate Map">
          <div className="col-span-2">
            <div className="rounded-xl overflow-hidden border border-surface-border mb-3" style={{ height: 180 }}>
              <iframe title={"map-ip-" + index} width="100%" height="100%" frameBorder="0"
                src={"https://maps.google.com/maps?q=" + capture.lat + "," + capture.lon + "&z=12&output=embed"} allowFullScreen />
            </div>
            <a href={"https://www.google.com/maps?q=" + capture.lat + "," + capture.lon}
              target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors">
              🌐 View Approximate Location
            </a>
          </div>
        </Section>
      )}

      <Section title="📱 Device">
        <DataRow label="Device Type" value={capture.device} />
        <DataRow label="OS" value={capture.os} />
        <DataRow label="Browser" value={capture.browser} />
        <DataRow label="Platform" value={capture.platform} />
        <DataRow label="CPU Cores" value={capture.cpuCores} />
        <DataRow label="RAM" value={capture.ram ? capture.ram + " GB" : null} />
        <DataRow label="GPU" value={capture.gpu} />
        <DataRow label="GPU Vendor" value={capture.gpuVendor} />
        <DataRow label="WebGL Version" value={capture.webglVersion} />
        <DataRow label="WebGL Renderer" value={capture.webglRenderer} />
        <DataRow label="WebGL Vendor" value={capture.webglVendor} />
        <DataRow label="Shading Language" value={capture.webglShadingLanguage} />
        <DataRow label="Max Texture Size" value={capture.maxTextureSize} />
        <DataRow label="Touch Points" value={capture.maxTouchPoints} />
        <DataRow label="Touch Support" value={capture.touchSupport != null ? String(capture.touchSupport) : null} />
        <DataRow label="Pointer Type" value={capture.pointerType} />
        <DataRow label="Java Enabled" value={capture.javaEnabled != null ? String(capture.javaEnabled) : null} />
        <DataRow label="PDF Viewer" value={capture.pdfViewerEnabled != null ? String(capture.pdfViewerEnabled) : null} />
        <DataRow label="Vendor" value={capture.vendor} />
      </Section>

      <Section title="🖥️ Screen">
        <DataRow label="Resolution" value={capture.screenWidth ? capture.screenWidth + "x" + capture.screenHeight : null} />
        <DataRow label="Available" value={capture.screenAvailWidth ? capture.screenAvailWidth + "x" + capture.screenAvailHeight : null} />
        <DataRow label="Window" value={capture.windowWidth ? capture.windowWidth + "x" + capture.windowHeight : null} />
        <DataRow label="Outer Size" value={capture.outerWidth ? capture.outerWidth + "x" + capture.outerHeight : null} />
        <DataRow label="Color Depth" value={capture.colorDepth ? capture.colorDepth + " bit" : null} />
        <DataRow label="Pixel Ratio" value={capture.pixelRatio} />
        <DataRow label="Orientation" value={capture.orientation} />
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
      </Section>

      <Section title="🎵 Media Devices">
        <DataRow label="Cameras" value={capture.cameras} />
        <DataRow label="Microphones" value={capture.microphones} />
        <DataRow label="Speakers" value={capture.speakers} />
        <DataRow label="Speech Voices" value={capture.speechVoicesCount} />
        <DataRow label="Voice Names" value={capture.speechVoices} />
      </Section>

      <Section title="💾 Storage">
        <DataRow label="Storage Quota" value={capture.storageQuota} />
        <DataRow label="Storage Used" value={capture.storageUsage} />
        <DataRow label="LocalStorage" value={capture.localStorageEnabled != null ? String(capture.localStorageEnabled) : null} />
        <DataRow label="SessionStorage" value={capture.sessionStorageEnabled != null ? String(capture.sessionStorageEnabled) : null} />
        <DataRow label="IndexedDB" value={capture.indexedDBEnabled != null ? String(capture.indexedDBEnabled) : null} />
      </Section>

      <Section title="🔤 Fonts">
        <DataRow label="Fonts Detected" value={capture.fontsDetected} />
        <DataRow label="Font List" value={capture.fontsList} />
      </Section>

      <Section title="🔌 Plugins">
        <DataRow label="Plugins Count" value={capture.pluginsCount} />
        <DataRow label="Plugins" value={capture.plugins} />
      </Section>

      <Section title="⚡ Performance">
        <DataRow label="Page Load Time" value={capture.pageLoadTime} />
        <DataRow label="DOM Content Loaded" value={capture.domContentLoaded} />
      </Section>

      <Section title="🔍 Browser Details">
        <DataRow label="Language" value={capture.language} />
        <DataRow label="Languages" value={capture.languages} />
        <DataRow label="Cookies" value={capture.cookiesEnabled != null ? (capture.cookiesEnabled ? "Enabled" : "Disabled") : null} />
        <DataRow label="Do Not Track" value={capture.doNotTrack} />
        <DataRow label="History Length" value={capture.historyLength} />
        <DataRow label="Referrer" value={capture.referrer} />
        <DataRow label="Incognito" value={capture.incognito != null ? (capture.incognito ? "Yes 🕵️" : "No") : null} />
        <DataRow label="Ad Blocker" value={capture.adBlockDetected != null ? (capture.adBlockDetected ? "Yes" : "No") : null} />
        <DataRow label="User Agent" value={capture.userAgent} />
      </Section>

      <Section title="✅ Feature Support">
        <DataRow label="WebSocket" value={capture.webSocketSupport != null ? String(capture.webSocketSupport) : null} />
        <DataRow label="Web Worker" value={capture.webWorkerSupport != null ? String(capture.webWorkerSupport) : null} />
        <DataRow label="Service Worker" value={capture.serviceWorkerSupport != null ? String(capture.serviceWorkerSupport) : null} />
        <DataRow label="WebAssembly" value={capture.webAssemblySupport != null ? String(capture.webAssemblySupport) : null} />
        <DataRow label="Notifications" value={capture.notificationsPermission} />
        <DataRow label="Bluetooth" value={capture.bluetoothSupport != null ? String(capture.bluetoothSupport) : null} />
        <DataRow label="USB" value={capture.usbSupport != null ? String(capture.usbSupport) : null} />
      </Section>

      <Section title="🔐 Fingerprints">
        <DataRow label="Canvas Hash" value={capture.canvasHash} />
        <DataRow label="Audio Fingerprint" value={capture.audioFingerprint} />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <div className="font-body text-xs text-primary uppercase tracking-wider mb-2 pb-1 border-b border-surface-border">{title}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</div>
    </div>
  );
}

function DataRow({ label, value }) {
  if (value == null || value === "" || value === "null") return null;
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
    setDone(true);
    setProcessing(false);
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
            <div className="bg-surface border border-surface-border rounded-xl p-3 mb-4 text-xs font-body text-text-muted">
              Demo Mode: Integrate Razorpay for real payments in production.
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