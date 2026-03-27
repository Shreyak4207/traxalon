// import React, { useState, useEffect, useRef } from "react";
// import { jsPDF } from "jspdf";
// import { useAuth } from "../contexts/AuthContext";
// import { db } from "../firebase/config";
// import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
// import {
//   Link2, Zap, Copy, Shield, Activity, ChevronRight,
//   AlertCircle, Clock, Smartphone, Globe, Eye, CreditCard,
//   X, FileText, ExternalLink, CheckCircle, ChevronDown, ChevronUp, Scissors
// } from "lucide-react";

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// // ── Preload Leaflet immediately at module level ────────────────────────────────
// (function preloadLeaflet() {
//   if (typeof window === "undefined") return;
//   if (!document.getElementById("leaflet-css")) {
//     const link = document.createElement("link");
//     link.id = "leaflet-css"; link.rel = "stylesheet";
//     link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
//     document.head.appendChild(link);
//   }
//   if (!document.getElementById("leaflet-js")) {
//     const script = document.createElement("script");
//     script.id = "leaflet-js";
//     script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
//     script.async = false;
//     document.head.appendChild(script);
//   }
// })();

// export default function Dashboard() {
//   const { currentUser, userProfile, fetchUserProfile } = useAuth();
//   const [links, setLinks] = useState([]);
//   const [label, setLabel] = useState("");
//   const [destinationUrl, setDestinationUrl] = useState("");
//   const [generating, setGenerating] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [shortUrl, setShortUrl] = useState("");
//   const [shortening, setShortening] = useState(false);
//   const [shortenerProvider, setShortenerProvider] = useState("tinyurl");
//   const [credits, setCredits] = useState(userProfile?.credits ?? 0);
//   const [selectedLink, setSelectedLink] = useState(null);
//   const [openCapture, setOpenCapture] = useState(null);
//   const [showPayment, setShowPayment] = useState(false);
//   const [copiedId, setCopiedId] = useState(null);
//   const [serverReady, setServerReady] = useState(false);
//   const [serverWaking, setServerWaking] = useState(true);
//   const [liveCaptures, setLiveCaptures] = useState(null);

//   useEffect(() => {
//     setServerWaking(true);
//     fetch(BACKEND_URL + "/api/links/health")
//       .then(() => setServerReady(true))
//       .catch(() => setServerReady(false))
//       .finally(() => setServerWaking(false));
//   }, []);

//   useEffect(() => {
//     if (!currentUser) return;
//     const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
//       if (snap.exists()) setCredits(snap.data().credits ?? 0);
//     });
//     return unsub;
//   }, [currentUser]);

//   useEffect(() => {
//     if (!currentUser) return;
//     const q = query(collection(db, "trackingLinks"), where("uid", "==", currentUser.uid));
//     const unsub = onSnapshot(q, (snap) => {
//       const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
//       data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
//       setLinks(data);
//     });
//     return unsub;
//   }, [currentUser]);

//   useEffect(() => {
//     if (!selectedLink) { setLiveCaptures(null); return; }
//     const unsub = onSnapshot(doc(db, "trackingLinks", selectedLink.id), (snap) => {
//       if (snap.exists()) setLiveCaptures(snap.data().captures || []);
//     });
//     return unsub;
//   }, [selectedLink?.id]);

//   function normalizeUrl(raw) {
//     const t = raw.trim();
//     if (!t) return null;
//     if (/^https?:\/\//i.test(t)) return t;
//     return "https://" + t;
//   }

//   async function shortenUrl(longUrl, provider) {
//     try {
//       const res = await fetch(BACKEND_URL + "/api/links/shorten-url", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ url: longUrl, provider }),
//       });
//       const data = await res.json();
//       if (!data.shortUrl || data.shortUrl === longUrl) return null;
//       return data.shortUrl;
//     } catch { return null; }
//   }

//   async function handleGenerate(e) {
//     e.preventDefault();
//     if (credits < 1) { setShowPayment(true); return; }
//     if (!destinationUrl.trim()) { setError("Please enter a destination URL"); return; }
//     setGenerating(true); setError(""); setSuccess(""); setShortUrl("");
//     try {
//       const controller = new AbortController();
//       const timeout = setTimeout(() => controller.abort(), 30000);
//       const res = await fetch(BACKEND_URL + "/api/links/shorten", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           uid: currentUser.uid,
//           label: label || "Tracking Link",
//           destinationUrl: normalizeUrl(destinationUrl),
//         }),
//         signal: controller.signal,
//       });
//       clearTimeout(timeout);
//       const data = await res.json();
//       if (data.error) throw new Error(data.error);
//       setSuccess(data.trackingUrl);
//       setShortening(true);
//       const short = await shortenUrl(data.trackingUrl, shortenerProvider);
//       setShortUrl(short || "FAILED");
//       setShortening(false);
//       setLabel("");
//       setDestinationUrl("");
//       await fetchUserProfile(currentUser.uid);
//     } catch (err) {
//       if (err.name === "AbortError") setError("Server timeout — please try again.");
//       else setError(err.message);
//       setShortening(false);
//     }
//     setGenerating(false);
//   }

//   function copyToClipboard(text, id) {
//     navigator.clipboard.writeText(text);
//     setCopiedId(id);
//     setTimeout(() => setCopiedId(null), 2000);
//   }

//   return (
//     <div className="min-h-screen bg-surface pt-16 text-text-primary">
//       <div className="max-w-5xl mx-auto px-4 py-8">

//         {serverWaking && (
//           <div className="mb-4 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-xl px-4 py-3 font-body text-sm">
//             <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
//             Waking up server — please wait before generating a link (~30s on first load)
//           </div>
//         )}
//         {!serverWaking && serverReady && (
//           <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-4 py-3 font-body text-sm">
//             <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
//             Server is online — ready to generate links
//           </div>
//         )}
//         {!serverWaking && !serverReady && (
//           <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 font-body text-sm">
//             <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
//             Server offline — refresh the page
//           </div>
//         )}

//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
//           <div>
//             <h1 className="font-display text-4xl tracking-wider">COMMAND <span className="text-primary">CENTER</span></h1>
//             <p className="font-body text-sm text-text-secondary mt-1">
//               Welcome back, <span className="text-primary">{userProfile?.displayName || "Officer"}</span>
//               {userProfile?.badgeId && <span className="text-text-muted"> · Badge #{userProfile.badgeId}</span>}
//             </p>
//           </div>
//           <div className="flex items-center gap-3">
//             <div className="bg-surface-card border border-surface-border rounded-xl px-5 py-3 flex items-center gap-3">
//               <Zap className="w-5 h-5 text-primary" />
//               <div>
//                 <div className="font-mono text-2xl text-primary leading-none">{credits}</div>
//                 <div className="font-body text-xs text-text-muted">Credits</div>
//               </div>
//             </div>
//             <button onClick={() => setShowPayment(true)} className="px-4 py-3 bg-primary/10 border border-primary/30 text-primary rounded-xl font-body text-sm hover:bg-primary/20 transition-colors flex items-center gap-2">
//               <CreditCard className="w-4 h-4" /> Buy Credits
//             </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//           {[
//             { label: "Total Links", value: links.length, icon: <Link2 className="w-4 h-4" /> },
//             { label: "Total Captures", value: links.reduce((a, l) => a + (l.captures?.length || 0), 0), icon: <Eye className="w-4 h-4" /> },
//             { label: "Active Links", value: links.filter((l) => l.active).length, icon: <Activity className="w-4 h-4" /> },
//             { label: "Total Clicks", value: links.reduce((a, l) => a + (l.clicks || 0), 0), icon: <Globe className="w-4 h-4" /> },
//           ].map((stat) => (
//             <div key={stat.label} className="bg-surface-card border border-surface-border rounded-xl p-4">
//               <div className="flex items-center gap-2 text-text-muted mb-2">{stat.icon}<span className="font-body text-xs uppercase tracking-wider">{stat.label}</span></div>
//               <div className="font-display text-3xl text-text-primary">{stat.value}</div>
//             </div>
//           ))}
//         </div>

//         {/* GENERATE LINK */}
//         <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 mb-6">
//           <h2 className="font-display text-xl tracking-wider mb-1">GENERATE <span className="text-primary">LINK</span></h2>
//           <p className="font-body text-xs text-text-muted mb-6">
//             Paste any URL — generates a tracking link + short link. Silently captures 300+ data points then redirects instantly.
//           </p>

//           {error && (
//             <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5 font-body text-sm mb-4">
//               <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
//             </div>
//           )}

//           <form onSubmit={handleGenerate}>
//             <div className="flex flex-col md:flex-row gap-3 mb-3">
//               <div className="flex-1 relative">
//                 <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
//                 <input
//                   type="text"
//                   value={destinationUrl}
//                   onChange={(e) => setDestinationUrl(e.target.value)}
//                   placeholder="Enter destination URL — e.g. google.com, amazon.in"
//                   className="w-full bg-surface border border-surface-border rounded-xl pl-10 pr-4 py-3.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
//                 />
//               </div>
//               <input
//                 type="text"
//                 value={label}
//                 onChange={(e) => setLabel(e.target.value)}
//                 placeholder="Case label (optional)"
//                 className="md:w-52 bg-surface border border-surface-border rounded-xl px-4 py-3.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
//               />
//               <button
//                 type="submit"
//                 disabled={generating || serverWaking}
//                 className="px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-xl hover:bg-primary-dark transition-all shadow-glow disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
//               >
//                 <Link2 className="w-4 h-4" />
//                 {serverWaking ? "Waking server..." : generating ? "Generating..." : "Generate Link"}
//               </button>
//             </div>
//             <p className="font-body text-xs text-text-muted">
//               No https:// needed · <span className="text-primary">google.com</span>, <span className="text-primary">instagram.com</span>, <span className="text-primary">amazon.in</span>
//             </p>
//           </form>

//           {success && (
//             <div className="mt-6 border-t border-surface-border pt-6 space-y-4">
//               <p className="font-body text-xs text-green-400 font-semibold flex items-center gap-1.5">
//                 <CheckCircle className="w-4 h-4" /> Tracking link generated successfully!
//               </p>
//               <div className="bg-surface border border-surface-border rounded-xl p-4">
//                 <p className="font-body text-xs text-text-muted uppercase tracking-wider mb-2">Full Tracking Link</p>
//                 <div className="flex items-center gap-3">
//                   <Link2 className="w-4 h-4 text-text-muted flex-shrink-0" />
//                   <span className="font-mono text-xs text-text-secondary flex-1 truncate">{success}</span>
//                   <button onClick={() => copyToClipboard(success, "full")}
//                     className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-border text-text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors flex-shrink-0">
//                     {copiedId === "full" ? <><CheckCircle className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
//                   </button>
//                 </div>
//               </div>
//               <div className="bg-primary/10 border border-primary/40 rounded-xl p-4">
//                 <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
//                   <p className="font-body text-xs text-primary uppercase tracking-wider font-semibold flex items-center gap-1.5">
//                     <Scissors className="w-3.5 h-3.5" /> Short Link
//                     {shortening && <span className="text-yellow-400 animate-pulse ml-2">generating...</span>}
//                   </p>
//                   <div className="flex items-center gap-2">
//                     <span className="font-body text-xs text-text-muted">Domain:</span>
//                     <select
//                       value={shortenerProvider}
//                       onChange={(e) => {
//                         const prov = e.target.value;
//                         setShortenerProvider(prov);
//                         if (success) {
//                           setShortening(true);
//                           setShortUrl("");
//                           shortenUrl(success, prov).then(s => { setShortUrl(s || "FAILED"); setShortening(false); });
//                         }
//                       }}
//                       className="bg-surface border border-surface-border text-text-primary text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
//                     >
//                       <option value="tinyurl">tinyurl.com (free)</option>
//                       <option value="isgd">is.gd (free)</option>
//                       <option value="vgd">v.gd (free)</option>
//                       <option value="dagd">da.gd (free)</option>
//                       <option value="cleanuri">cleanuri.com (free)</option>
//                       <option value="ulvis">ulvis.net (free)</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <Globe className="w-4 h-4 text-primary flex-shrink-0" />
//                   <span className={`font-mono text-sm font-bold flex-1 truncate ${shortUrl === "FAILED" ? "text-red-400" : "text-primary"}`}>
//                     {shortening ? "Shortening..." : shortUrl === "FAILED" ? "Provider unavailable — try another domain" : (shortUrl || success)}
//                   </span>
//                   {shortUrl !== "FAILED" && (
//                     <button onClick={() => copyToClipboard(shortUrl || success, "short")}
//                       className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-surface rounded-lg font-body text-xs font-bold hover:bg-primary-dark transition-colors flex-shrink-0">
//                       {copiedId === "short" ? <><CheckCircle className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
//                     </button>
//                   )}
//                 </div>
//                 <p className="font-body text-xs text-text-muted mt-2">
//                   ↑ Target only sees the short domain — Traxalon is completely hidden
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* TRACKING LINKS */}
//         <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6">
//           <h2 className="font-display text-xl tracking-wider mb-6">TRACKING <span className="text-primary">LINKS</span></h2>
//           {links.length === 0 ? (
//             <div className="text-center py-16">
//               <Shield className="w-16 h-16 text-text-muted mx-auto mb-4" />
//               <p className="font-body text-text-muted">No links generated yet</p>
//               <p className="font-body text-xs text-text-muted mt-1">Generate your first tracking link above</p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {links.map((link) => {
//                 const captures = (selectedLink?.id === link.id && liveCaptures) ? liveCaptures : (link.captures || []);
//                 return (
//                   <div key={link.id} className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
//                     <div className="p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-primary/5 transition-all"
//                       onClick={() => setSelectedLink(selectedLink?.id === link.id ? null : link)}>
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 mb-2">
//                           <span className="font-body text-base font-semibold text-text-primary">{link.label}</span>
//                           <span className={`text-xs px-2 py-0.5 rounded-full font-mono border ${link.active ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-surface-border text-text-muted border-surface-border"}`}>
//                             {link.active ? "ACTIVE" : "INACTIVE"}
//                           </span>
//                         </div>
//                         <div className="flex items-center gap-2 bg-surface-card rounded-lg px-3 py-2 mb-2">
//                           <Link2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
//                           <span className="font-mono text-xs text-primary flex-1 truncate">{link.trackingUrl}</span>
//                           <button onClick={(e) => { e.stopPropagation(); copyToClipboard(link.trackingUrl, link.id); }}
//                             className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded font-body text-xs hover:bg-primary/20 transition-colors flex-shrink-0">
//                             {copiedId === link.id ? <><CheckCircle className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
//                           </button>
//                         </div>
//                         {link.destinationUrl && (
//                           <div className="flex items-center gap-1.5">
//                             <ExternalLink className="w-3 h-3 text-text-muted" />
//                             <span className="font-mono text-xs text-text-muted truncate">Redirects to: {link.destinationUrl}</span>
//                           </div>
//                         )}
//                       </div>
//                       <ChevronRight className={`w-5 h-5 text-text-muted transition-transform flex-shrink-0 mt-1 ${selectedLink?.id === link.id ? "rotate-90" : ""}`} />
//                     </div>
//                     <div className="px-5 pb-4 flex items-center gap-6 text-xs text-text-muted font-body border-t border-surface-border/40 pt-3">
//                       <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{link.clicks || 0} clicks</span>
//                       <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" />{captures.length} captures</span>
//                       <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{link.createdAt ? new Date(link.createdAt.toMillis()).toLocaleDateString("en-IN") : "-"}</span>
//                     </div>
//                     {selectedLink?.id === link.id && (
//                       <div className="border-t border-surface-border">
//                         {captures.length === 0 ? (
//                           <div className="p-6 text-center">
//                             <p className="font-body text-sm text-text-muted">No captures yet — share the link to start tracking.</p>
//                           </div>
//                         ) : (
//                           <div className="p-4 space-y-3">
//                             <p className="font-body text-xs text-text-secondary uppercase tracking-widest mb-4">
//                               {captures.length} Device Capture{captures.length > 1 ? "s" : ""} — latest first
//                             </p>
//                             {[...captures].reverse().map((capture, ri) => {
//                               const i = captures.length - 1 - ri;
//                               const tabKey = link.id + "-" + i;
//                               const isOpen = openCapture === tabKey;
//                               const hasGPS = capture.gpsLat && capture.gpsLon;
//                               return (
//                                 <div key={i} className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? "border-primary/50 shadow-glow" : "border-surface-border"}`}>
//                                   <button className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
//                                     onClick={() => setOpenCapture(isOpen ? null : tabKey)}>
//                                     <div className="flex items-center gap-4">
//                                       <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isOpen ? "bg-primary text-surface" : "bg-surface-border text-text-muted"}`}>
//                                         {i + 1}
//                                       </div>
//                                       <div className="text-left">
//                                         <div className="font-body text-sm font-semibold text-text-primary mb-0.5">
//                                           Visitor #{i + 1} &nbsp;·&nbsp; {capture.deviceBrand ? capture.deviceBrand + " · " : ""}{capture.device || "Unknown Device"}
//                                         </div>
//                                         <div className="font-mono text-xs text-text-muted">
//                                           {capture.ip || "IP unknown"} &nbsp;·&nbsp; {capture.browser || "Unknown"} {capture.browserVersion ? "v" + capture.browserVersion : ""}
//                                         </div>
//                                         <div className="font-mono text-xs text-text-muted mt-0.5">
//                                           {capture.capturedAt ? new Date(capture.capturedAt).toLocaleString("en-IN") : ""}
//                                           {capture.memoryTier ? " · " + capture.memoryTier : ""}
//                                         </div>
//                                       </div>
//                                     </div>
//                                     <div className="flex items-center gap-2 flex-shrink-0">
//                                       {capture.automationDetected === "true" && (
//                                         <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">🤖 BOT</span>
//                                       )}
//                                       {capture.incognito === "true" && (
//                                         <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">🕵️ INCOGNITO</span>
//                                       )}
//                                       {capture.isMoving && (
//                                         <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse font-mono">🚶 MOVING</span>
//                                       )}
//                                       <span className={`text-xs px-2.5 py-1 rounded-full font-mono border ${hasGPS ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"}`}>
//                                         {hasGPS ? "📍 GPS" : "🌐 IP"}
//                                       </span>
//                                       {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
//                                     </div>
//                                   </button>
//                                   {isOpen && (
//                                     <div className="border-t border-surface-border p-4 bg-surface">
//                                       <CaptureDetail
//                                         capture={capture}
//                                         linkId={link.id}
//                                         captureIndex={i}
//                                         liveCaptures={liveCaptures}
//                                         captureRealIndex={i}
//                                       />
//                                     </div>
//                                   )}
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>

//       {showPayment && (
//         <PaymentModal onClose={() => setShowPayment(false)} uid={currentUser?.uid} fetchUserProfile={fetchUserProfile} />
//       )}
//     </div>
//   );
// }

// // ── GPS MAP ───────────────────────────────────────────────────────────────────
// function GPSMap({ lat, lon, liveCaptures, captureRealIndex }) {
//   const containerRef = useRef(null);
//   const mapRef = useRef(null);
//   const markerRef = useRef(null);
//   const polylineRef = useRef(null);
//   const pathRef = useRef([[lat, lon]]);
//   const [status, setStatus] = useState("init");

//   function initMap(container) {
//     if (mapRef.current) return;
//     const L = window.L;
//     if (!L) { setStatus("error"); return; }
//     try {
//       const map = L.map(container, {
//         zoomControl: true,
//         attributionControl: false,
//         preferCanvas: true,
//       }).setView([lat, lon], 16);

//       L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//         maxZoom: 19,
//       }).addTo(map);

//       const pulseIcon = L.divIcon({
//         className: "",
//         html: `<div style="position:relative;width:20px;height:20px">
//           <div style="position:absolute;inset:0;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>
//           <div style="position:absolute;inset:-8px;background:rgba(59,130,246,0.15);border-radius:50%;animation:gpsPing 1.5s ease-out infinite"></div>
//         </div>`,
//         iconSize: [20, 20], iconAnchor: [10, 10],
//       });

//       const marker = L.marker([lat, lon], { icon: pulseIcon }).addTo(map);
//       marker.bindPopup(`<b>📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}</b>`).openPopup();
//       markerRef.current = marker;

//       const poly = L.polyline([[lat, lon]], { color: "#3b82f6", weight: 3, opacity: 0.8 }).addTo(map);
//       polylineRef.current = poly;
//       mapRef.current = map;

//       setTimeout(() => { try { map.invalidateSize(true); setStatus("ready"); } catch {} }, 100);
//       setTimeout(() => { try { map.invalidateSize(true); } catch {} }, 500);
//     } catch (e) {
//       console.error("[GPSMap]", e);
//       setStatus("error");
//     }
//   }

//   useEffect(() => {
//     if (!containerRef.current) return;
//     setStatus("loading");

//     if (window.L) {
//       initMap(containerRef.current);
//     } else {
//       let attempts = 0;
//       const interval = setInterval(() => {
//         attempts++;
//         if (window.L) {
//           clearInterval(interval);
//           initMap(containerRef.current);
//         } else if (attempts > 100) {
//           clearInterval(interval);
//           setStatus("error");
//         }
//       }, 100);
//     }

//     return () => {
//       if (mapRef.current) {
//         try { mapRef.current.remove(); } catch {}
//         mapRef.current = null;
//         markerRef.current = null;
//         polylineRef.current = null;
//         pathRef.current = [[lat, lon]];
//       }
//     };
//   }, []);

//   // Live GPS updates — move marker in real time
//   useEffect(() => {
//     if (!mapRef.current || !markerRef.current || !liveCaptures) return;
//     const lc = liveCaptures[captureRealIndex];
//     if (!lc?.gpsLat || !lc?.gpsLon) return;
//     const newLat = parseFloat(lc.gpsLat);
//     const newLon = parseFloat(lc.gpsLon);
//     if (isNaN(newLat) || isNaN(newLon)) return;
//     const cur = markerRef.current.getLatLng();
//     if (cur.lat === newLat && cur.lng === newLon) return;
//     markerRef.current.setLatLng([newLat, newLon]);
//     markerRef.current.setPopupContent(`<b>📍 Live: ${newLat.toFixed(5)}, ${newLon.toFixed(5)}</b>`);
//     pathRef.current.push([newLat, newLon]);
//     polylineRef.current?.setLatLngs(pathRef.current);
//     mapRef.current.panTo([newLat, newLon], { animate: true, duration: 1 });
//   }, [liveCaptures, captureRealIndex]);

//   return (
//     <div className="mb-3">
//       <style>{`
//         @keyframes gpsPing {
//           0% { transform: scale(1); opacity: 0.8; }
//           100% { transform: scale(2.8); opacity: 0; }
//         }
//         @keyframes gpsSpinner {
//           to { transform: rotate(360deg); }
//         }
//       `}</style>
//       <div style={{ position: "relative", height: 260, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "#0f172a" }}>
//         {status !== "ready" && (
//           <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, background: "#0f172a" }}>
//             {status === "error" ? (
//               <>
//                 <span style={{ fontSize: 36 }}>🗺️</span>
//                 <span className="font-body text-xs text-text-muted mt-2">Map unavailable</span>
//                 <a href={`https://www.google.com/maps?q=${lat},${lon}`} target="_blank" rel="noreferrer"
//                   className="mt-2 font-body text-xs text-primary underline">Open in Google Maps →</a>
//               </>
//             ) : (
//               <>
//                 <div style={{ width: 28, height: 28, border: "3px solid #3b82f6", borderTopColor: "transparent", borderRadius: "50%", animation: "gpsSpinner 0.7s linear infinite" }} />
//                 <span className="font-body text-xs text-text-muted mt-3">Loading map...</span>
//               </>
//             )}
//           </div>
//         )}
//         <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
//       </div>
//       <div className="flex gap-2 mt-2">
//         <a href={`https://www.google.com/maps?q=${lat},${lon}`} target="_blank" rel="noreferrer"
//           className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface border border-surface-border rounded-lg font-body text-xs text-text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors">
//           <Globe className="w-3.5 h-3.5 text-primary" /> Google Maps
//         </a>
//         <a href={`https://maps.apple.com/?q=${lat},${lon}`} target="_blank" rel="noreferrer"
//           className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface border border-surface-border rounded-lg font-body text-xs text-text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors">
//           🗺️ Apple Maps
//         </a>
//         <a href={`https://waze.com/ul?ll=${lat},${lon}&navigate=yes`} target="_blank" rel="noreferrer"
//           className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface border border-surface-border rounded-lg font-body text-xs text-text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors">
//           🚗 Waze
//         </a>
//       </div>
//     </div>
//   );
// }

// // ── CAPTURE DETAIL ────────────────────────────────────────────────────────────
// function CaptureDetail({ capture, linkId, captureIndex, liveCaptures, captureRealIndex }) {
//   const [copied, setCopied] = useState(false);
//   const liveCapture = liveCaptures?.[captureRealIndex];
//   const mapLat = parseFloat(liveCapture?.gpsLat || capture.gpsLat || capture.lat);
//   const mapLon = parseFloat(liveCapture?.gpsLon || capture.gpsLon || capture.lon);
//   const showMap = !isNaN(mapLat) && !isNaN(mapLon) && mapLat !== 0 && mapLon !== 0;
//   const isGPS = !!(liveCapture?.gpsLat || capture.gpsLat);

//   function copyAll() {
//     const text = Object.entries(capture).filter(([, v]) => v != null && v !== "").map(([k, v]) => `${k}: ${v}`).join("\n");
//     navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000);
//   }

//   function downloadPDF() {
//     const doc = new jsPDF();
//     doc.setFontSize(14); doc.text("Traxalon — Capture Report", 14, 16);
//     doc.setFontSize(9);
//     let y = 26;
//     Object.entries(capture).filter(([, v]) => v != null && v !== "").forEach(([k, v]) => {
//       const line = `${k}: ${String(v)}`; const lines = doc.splitTextToSize(line, 180);
//       if (y + lines.length * 5 > 285) { doc.addPage(); y = 16; }
//       doc.text(lines, 14, y); y += lines.length * 5 + 1;
//     });
//     doc.save(`capture-${linkId}-${captureIndex + 1}.pdf`);
//   }

//   return (
//     <div>
//       <div className="flex items-center gap-2 mb-4 flex-wrap">
//         <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-border text-text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors">
//           {copied ? <><CheckCircle className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy All</>}
//         </button>
//         <button onClick={downloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-border text-text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors">
//           <FileText className="w-3 h-3" /> Download PDF
//         </button>
//         {liveCapture?.gpsLat && <span className="flex items-center gap-1 text-xs text-green-400 font-mono animate-pulse">🔴 Live tracking</span>}
//         {capture.automationDetected === "true" && <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">🤖 Automation Detected</span>}
//         {capture.incognito === "true" && <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">🕵️ Incognito Mode</span>}
//       </div>

//       {showMap && (
//         <div className="mb-4">
//           <p className="font-body text-xs text-primary uppercase tracking-wider mb-2 pb-1 border-b border-surface-border flex items-center gap-2">
//             {isGPS ? "📍 Live GPS Map" : "🌐 IP Location Map"}
//             {liveCapture?.gpsLat && <span className="text-green-400 animate-pulse">● updating live</span>}
//           </p>
//           <GPSMap lat={mapLat} lon={mapLon} liveCaptures={liveCaptures} captureRealIndex={captureRealIndex} />
//           {liveCapture?.gpsAccuracy && <p className="font-mono text-xs text-text-muted mt-1">Accuracy: ±{liveCapture.gpsAccuracy}m</p>}
//         </div>
//       )}

//       <Section title="🌍 Location & Network">
//         <DataRow label="IP Address" value={capture.ip} />
//         <DataRow label="Country" value={capture.country} />
//         <DataRow label="Country Code" value={capture.countryCode} />
//         <DataRow label="Region" value={capture.region} />
//         <DataRow label="City" value={capture.city} />
//         <DataRow label="ZIP / Pincode" value={capture.zip} />
//         <DataRow label="Latitude" value={capture.lat} />
//         <DataRow label="Longitude" value={capture.lon} />
//         <DataRow label="Timezone" value={capture.timezone} />
//         <DataRow label="ISP" value={capture.isp} />
//         <DataRow label="Org" value={capture.org} />
//         <DataRow label="ASN" value={capture.asn} />
//         <DataRow label="Hostname" value={capture.hostname} />
//         <DataRow label="Proxy / VPN" value={capture.isProxy != null ? String(capture.isProxy) : null} />
//         <DataRow label="Hosting / VPS" value={capture.isHosting != null ? String(capture.isHosting) : null} />
//         <DataRow label="Mobile Network" value={capture.isMobileNetwork != null ? String(capture.isMobileNetwork) : null} />
//       </Section>

//       <Section title="📍 GPS (Exact Location)">
//         <DataRow label="GPS Lat" value={capture.gpsLat} />
//         <DataRow label="GPS Lon" value={capture.gpsLon} />
//         <DataRow label="GPS Accuracy" value={capture.gpsAccuracy ? `±${capture.gpsAccuracy}m` : null} />
//         <DataRow label="GPS Altitude" value={capture.gpsAltitude} />
//         <DataRow label="GPS Speed" value={capture.gpsSpeed ? (parseFloat(capture.gpsSpeed) * 3.6).toFixed(1) + " km/h" : null} />
//         <DataRow label="GPS Heading" value={capture.gpsHeading} />
//         <DataRow label="GPS Address" value={capture.gpsAddress} />
//         <DataRow label="GPS City" value={capture.gpsCity} />
//         <DataRow label="GPS State" value={capture.gpsState} />
//         <DataRow label="GPS Pincode" value={capture.gpsPincode} />
//         <DataRow label="GPS Country" value={capture.gpsCountry} />
//         <DataRow label="Is Moving" value={capture.isMoving != null ? (capture.isMoving ? "🚶 Yes" : "🛑 No") : null} />
//       </Section>

//       <Section title="💻 Device & Browser">
//         <DataRow label="Device Brand" value={capture.deviceBrand} />
//         <DataRow label="Device Model" value={capture.deviceModel} />
//         <DataRow label="Device Type" value={capture.device} />
//         <DataRow label="Form Factor" value={capture.formFactor} />
//         <DataRow label="OS" value={capture.os} />
//         <DataRow label="Platform" value={capture.platform} />
//         <DataRow label="Architecture" value={capture.architecture} />
//         <DataRow label="OS CPU" value={capture.oscpu} />
//         <DataRow label="CPU Class" value={capture.cpuClass} />
//         <DataRow label="Browser" value={capture.browser} />
//         <DataRow label="Browser Version" value={capture.browserVersion} />
//         <DataRow label="Browser Engine" value={capture.browserEngine} />
//         <DataRow label="Browser Code Name" value={capture.browserCodeName} />
//         <DataRow label="App Name" value={capture.appName} />
//         <DataRow label="App Version" value={capture.appVersion} />
//         <DataRow label="Product" value={capture.product} />
//         <DataRow label="Build ID" value={capture.buildID} />
//         <DataRow label="Vendor" value={capture.vendor} />
//         <DataRow label="Webdriver" value={capture.webdriver} />
//         <DataRow label="Automation Detected" value={capture.automationDetected} />
//         <DataRow label="User Agent" value={capture.userAgent} />
//       </Section>

//       <Section title="⚙️ Hardware">
//         <DataRow label="CPU Cores" value={capture.cpuCores != null ? String(capture.cpuCores) : null} />
//         <DataRow label="RAM (GB)" value={capture.ram != null ? String(capture.ram) : null} />
//         <DataRow label="RAM Raw" value={capture.memoryTierRaw} />
//         <DataRow label="Memory Tier" value={capture.memoryTier} />
//         <DataRow label="CPU Benchmark" value={capture.cpuBenchmarkScore} />
//         <DataRow label="Max Touch Points" value={capture.maxTouchPoints != null ? String(capture.maxTouchPoints) : null} />
//         <DataRow label="Touch Detail" value={capture.maxTouchPointsDetail} />
//         <DataRow label="Touch Support" value={capture.touchSupport != null ? String(capture.touchSupport) : null} />
//         <DataRow label="Is Touch Device" value={capture.isTouchDevice} />
//         <DataRow label="Pointer Type" value={capture.pointerType} />
//         <DataRow label="Pointer Fine" value={capture.pointerFine} />
//         <DataRow label="Hover Capability" value={capture.hoverCapability} />
//         <DataRow label="Device Motion" value={capture.deviceMotionSupport} />
//         <DataRow label="Device Orientation" value={capture.deviceOrientationSupport} />
//         <DataRow label="Ambient Light" value={capture.ambientLightSupport} />
//         <DataRow label="Java Enabled" value={capture.javaEnabled != null ? String(capture.javaEnabled) : null} />
//         <DataRow label="PDF Viewer" value={capture.pdfViewerEnabled != null ? String(capture.pdfViewerEnabled) : null} />
//         <DataRow label="Gamepads Connected" value={capture.gamepadsConnected} />
//       </Section>

//       <Section title="🎨 GPU & WebGL">
//         <DataRow label="GPU" value={capture.gpu} />
//         <DataRow label="GPU Vendor" value={capture.gpuVendor} />
//         <DataRow label="WebGL Version" value={capture.webglVersion} />
//         <DataRow label="WebGL Renderer" value={capture.webglRenderer} />
//         <DataRow label="WebGL Vendor" value={capture.webglVendor} />
//         <DataRow label="Shading Language" value={capture.webglShadingLanguage} />
//         <DataRow label="WebGL Hash" value={capture.webglHash} />
//         <DataRow label="Shader Precision" value={capture.shaderPrecision} />
//         <DataRow label="WebGL Color Bits" value={capture.webglColorBits} />
//         <DataRow label="Max Texture Size" value={capture.maxTextureSize} />
//         <DataRow label="Max Viewport Dims" value={capture.maxViewportDims} />
//         <DataRow label="Max Anisotropy" value={capture.maxAnisotropy} />
//         <DataRow label="Max Vertex Attribs" value={capture.maxVertexAttribs} />
//         <DataRow label="Max Vertex Uniforms" value={capture.maxVertexUniformVectors} />
//         <DataRow label="Max Fragment Uniforms" value={capture.maxFragmentUniformVectors} />
//         <DataRow label="Max Combined Tex" value={capture.maxCombinedTextureUnits} />
//         <DataRow label="Max Cube Map" value={capture.maxCubeMapTextureSize} />
//         <DataRow label="Max Render Buffer" value={capture.maxRenderBufferSize} />
//         <DataRow label="Max Varying Vectors" value={capture.maxVaryingVectors} />
//         <DataRow label="Max Vertex Tex Units" value={capture.maxVertexTextureUnits} />
//         <DataRow label="Max Fragment Tex" value={capture.maxFragmentTextureUnits} />
//         <DataRow label="Point Size Range" value={capture.aliasedPointSizeRange} />
//         <DataRow label="Line Width Range" value={capture.aliasedLineWidthRange} />
//         <DataRow label="WebGL Extensions" value={capture.webglExtensionsCount != null ? String(capture.webglExtensionsCount) : null} />
//         <DataRow label="WebGL Extensions List" value={capture.webglExtensionsList} />
//         <DataRow label="WebGL2 Support" value={capture.webgl2Support != null ? String(capture.webgl2Support) : null} />
//       </Section>

//       <Section title="🖥️ Screen & Display">
//         <DataRow label="Screen Resolution" value={capture.screenWidth && capture.screenHeight ? `${capture.screenWidth}×${capture.screenHeight}` : null} />
//         <DataRow label="Physical Resolution" value={capture.physicalResolution} />
//         <DataRow label="Available Size" value={capture.screenAvailWidth && capture.screenAvailHeight ? `${capture.screenAvailWidth}×${capture.screenAvailHeight}` : null} />
//         <DataRow label="Window Size" value={capture.windowWidth && capture.windowHeight ? `${capture.windowWidth}×${capture.windowHeight}` : null} />
//         <DataRow label="Outer Size" value={capture.outerWidth && capture.outerHeight ? `${capture.outerWidth}×${capture.outerHeight}` : null} />
//         <DataRow label="Visual Viewport" value={capture.visualViewportWidth && capture.visualViewportHeight ? `${capture.visualViewportWidth}×${capture.visualViewportHeight}` : null} />
//         <DataRow label="Viewport Scale" value={capture.visualViewportScale != null ? String(capture.visualViewportScale) : null} />
//         <DataRow label="Color Depth" value={capture.colorDepth != null ? String(capture.colorDepth) + " bit" : null} />
//         <DataRow label="Screen Color Depth" value={capture.screenColorDepth} />
//         <DataRow label="Device Pixel Ratio" value={capture.pixelRatio != null ? String(capture.pixelRatio) : null} />
//         <DataRow label="Pixel Ratio %" value={capture.devicePixelRatioPercent} />
//         <DataRow label="CSS PX Density" value={capture.cssPxDensity} />
//         <DataRow label="Orientation" value={capture.orientation} />
//         <DataRow label="Orientation Angle" value={capture.orientationAngle != null ? String(capture.orientationAngle) + "°" : null} />
//         <DataRow label="HDR Support" value={capture.hdrSupport} />
//         <DataRow label="Color Gamut" value={capture.colorGamut} />
//         <DataRow label="Color Scheme" value={capture.colorScheme} />
//         <DataRow label="Dark Mode" value={capture.prefersColorScheme} />
//         <DataRow label="Prefers Contrast" value={capture.prefersContrast} />
//         <DataRow label="Forced Colors" value={capture.forcedColors} />
//         <DataRow label="Inverted Colors" value={capture.invertedColors} />
//         <DataRow label="Reduce Motion" value={capture.prefersReducedMotion} />
//         <DataRow label="Display Mode" value={capture.displayMode} />
//         <DataRow label="Monochrome" value={capture.monochrome} />
//         <DataRow label="Pointer Fine" value={capture.pointerFine} />
//         <DataRow label="Hover Capability" value={capture.hoverCapability} />
//       </Section>

//       <Section title="🔋 Battery & Connection">
//         <DataRow label="Battery Level" value={capture.batteryLevel != null ? String(capture.batteryLevel) + "%" : null} />
//         <DataRow label="Charging" value={capture.batteryCharging != null ? String(capture.batteryCharging) : null} />
//         <DataRow label="Charging Time" value={capture.batteryChargingTime != null ? String(capture.batteryChargingTime) + "s" : null} />
//         <DataRow label="Discharging Time" value={capture.batteryDischargingTime != null ? String(capture.batteryDischargingTime) + "s" : null} />
//         <DataRow label="Connection Type" value={capture.connectionType} />
//         <DataRow label="Connection Quality" value={capture.connectionQuality} />
//         <DataRow label="Network Label" value={capture.networkLabel} />
//         <DataRow label="Speed Tier" value={capture.speedTier} />
//         <DataRow label="Downlink" value={capture.connectionDownlink != null ? String(capture.connectionDownlink) + " Mbps" : null} />
//         <DataRow label="RTT" value={capture.connectionRtt != null ? String(capture.connectionRtt) + " ms" : null} />
//         <DataRow label="Save Data" value={capture.connectionSaveData != null ? String(capture.connectionSaveData) : null} />
//         <DataRow label="Downlink Max" value={capture.connectionDownlinkMax != null ? String(capture.connectionDownlinkMax) : null} />
//         <DataRow label="Online Status" value={capture.onlineStatus} />
//         <DataRow label="Browser Online" value={capture.browserOnline} />
//       </Section>

//       <Section title="🕐 Time & Locale">
//         <DataRow label="Captured At" value={capture.capturedAt} />
//         <DataRow label="Local Time" value={capture.localTime} />
//         <DataRow label="Local Time (12h)" value={capture.localTime12} />
//         <DataRow label="Local Date" value={capture.localDate} />
//         <DataRow label="Day of Week" value={capture.dayOfWeek} />
//         <DataRow label="Time of Day" value={capture.timeOfDay} />
//         <DataRow label="Client Timezone" value={capture.clientTimezone} />
//         <DataRow label="Timezone Formatted" value={capture.tzFormatted} />
//         <DataRow label="UTC Offset" value={capture.timezoneOffset != null ? String(capture.timezoneOffset) + " min" : null} />
//         <DataRow label="DST Active" value={capture.dstActive} />
//         <DataRow label="Language" value={capture.language} />
//         <DataRow label="Languages" value={capture.languages} />
//         <DataRow label="Doc Language" value={capture.docLanguage} />
//       </Section>

//       <Section title="🔒 Privacy & Fingerprint">
//         <DataRow label="Incognito" value={capture.incognito != null ? String(capture.incognito) : null} />
//         <DataRow label="Ad Blocker" value={capture.adBlockDetected != null ? String(capture.adBlockDetected) : null} />
//         <DataRow label="Cookies Enabled" value={capture.cookiesEnabled != null ? String(capture.cookiesEnabled) : null} />
//         <DataRow label="Cookies Count" value={capture.cookiesCount != null ? String(capture.cookiesCount) : null} />
//         <DataRow label="Do Not Track" value={capture.doNotTrack} />
//         <DataRow label="History Length" value={capture.historyLength != null ? String(capture.historyLength) : null} />
//         <DataRow label="Navigation Type" value={capture.navigationEntryType} />
//         <DataRow label="Session Length" value={capture.sessionLengthSeconds ? capture.sessionLengthSeconds + "s" : null} />
//         <DataRow label="Tabs Estimate" value={capture.tabsEstimate} />
//         <DataRow label="Referrer" value={capture.referrer} />
//         <DataRow label="Canvas Hash" value={capture.canvasHash} />
//         <DataRow label="Canvas Geometry" value={capture.canvasGeometryHash} />
//         <DataRow label="Audio Fingerprint" value={capture.audioFingerprint} />
//         <DataRow label="CSS Hash" value={capture.cssHash} />
//         <DataRow label="Font Fingerprint" value={capture.fontFingerprint} />
//         <DataRow label="Is Secure Context" value={capture.isSecureContext} />
//         <DataRow label="Cross Origin Isolated" value={capture.crossOriginIsolated} />
//         <DataRow label="Tab Hidden" value={capture.tabHidden} />
//         <DataRow label="Visibility State" value={capture.visibilityState} />
//         <DataRow label="Window Focused" value={capture.windowFocused} />
//         <DataRow label="Is Fullscreen" value={capture.isFullscreen} />
//         <DataRow label="Scroll X" value={capture.scrollPositionX != null ? String(capture.scrollPositionX) : null} />
//         <DataRow label="Scroll Y" value={capture.scrollPositionY != null ? String(capture.scrollPositionY) : null} />
//         <DataRow label="Page URL" value={capture.pageUrl} />
//         <DataRow label="Document Charset" value={capture.documentCharset} />
//         <DataRow label="Compat Mode" value={capture.documentCompatMode} />
//       </Section>

//       <Section title="🌐 WebRTC">
//         <DataRow label="WebRTC Local IP" value={capture.webrtcLocalIP} />
//         <DataRow label="WebRTC Public IP" value={capture.webrtcPublicIP} />
//         <DataRow label="WebRTC Support" value={capture.webrtcSupport} />
//       </Section>

//       <Section title="🎙️ Media Devices">
//         <DataRow label="Cameras" value={capture.cameras != null ? String(capture.cameras) : null} />
//         <DataRow label="Microphones" value={capture.microphones != null ? String(capture.microphones) : null} />
//         <DataRow label="Speakers" value={capture.speakers != null ? String(capture.speakers) : null} />
//         <DataRow label="Speech Voices" value={capture.speechVoicesCount != null ? String(capture.speechVoicesCount) : null} />
//         <DataRow label="Voice Names" value={capture.speechVoices} />
//       </Section>

//       <Section title="🎬 Media & Codecs">
//         <DataRow label="Codec Support" value={capture.codecSupport} />
//         <DataRow label="H.264" value={capture.h264Support} />
//         <DataRow label="VP9" value={capture.vp9Support} />
//         <DataRow label="AV1" value={capture.av1Support} />
//       </Section>

//       <Section title="💾 Storage">
//         <DataRow label="Storage Quota" value={capture.storageQuota} />
//         <DataRow label="Storage Used" value={capture.storageUsage} />
//         <DataRow label="LocalStorage" value={capture.localStorageEnabled != null ? String(capture.localStorageEnabled) : null} />
//         <DataRow label="LocalStorage Size" value={capture.localStorageSize} />
//         <DataRow label="SessionStorage" value={capture.sessionStorageEnabled != null ? String(capture.sessionStorageEnabled) : null} />
//         <DataRow label="IndexedDB" value={capture.indexedDBEnabled != null ? String(capture.indexedDBEnabled) : null} />
//         <DataRow label="Cache API" value={capture.cacheAPIEnabled} />
//       </Section>

//       <Section title="⚡ Performance">
//         <DataRow label="Page Load" value={capture.pageLoadTime} />
//         <DataRow label="DOM Loaded" value={capture.domContentLoaded} />
//         <DataRow label="DNS Lookup" value={capture.dnsLookupTime} />
//         <DataRow label="TCP Connect" value={capture.tcpConnectTime} />
//         <DataRow label="TTFB" value={capture.ttfb} />
//         <DataRow label="JS Heap Used" value={capture.memoryUsed} />
//         <DataRow label="JS Heap Total" value={capture.memoryTotal} />
//         <DataRow label="JS Heap Limit" value={capture.memoryLimit} />
//         <DataRow label="CPU Benchmark" value={capture.cpuBenchmarkScore} />
//         <DataRow label="Body Scroll Height" value={capture.bodyScrollHeight} />
//         <DataRow label="HTML Font Size" value={capture.htmlFontSize} />
//       </Section>

//       <Section title="🔤 Fonts & Plugins">
//         <DataRow label="Fonts Detected" value={capture.fontsDetected != null ? String(capture.fontsDetected) : null} />
//         <DataRow label="Font Fingerprint" value={capture.fontFingerprint} />
//         <DataRow label="Font List" value={capture.fontsList} />
//         <DataRow label="Plugins Count" value={capture.pluginsCount != null ? String(capture.pluginsCount) : null} />
//         <DataRow label="MIME Types" value={capture.mimeTypes} />
//         <DataRow label="Plugin Names" value={capture.plugins} />
//       </Section>

//       <Section title="🎮 Sensors & Permissions">
//         <DataRow label="Geolocation" value={capture.geolocationPermission} />
//         <DataRow label="Notifications" value={capture.notificationsPermission} />
//         <DataRow label="Camera" value={capture.cameraPermission} />
//         <DataRow label="Microphone" value={capture.microphonePermission} />
//         <DataRow label="Accelerometer" value={capture.accelerometerPermission} />
//         <DataRow label="Gyroscope" value={capture.gyroscopePermission} />
//         <DataRow label="Magnetometer" value={capture.magnetometerPermission} />
//         <DataRow label="Clipboard Read" value={capture.clipboardReadPermission} />
//         <DataRow label="Clipboard Write" value={capture.clipboardWritePermission} />
//         <DataRow label="Keyboard Layout" value={capture.keyboardLayout} />
//         <DataRow label="Permission API" value={capture.permissionAPISupport} />
//       </Section>

//       <Section title="✅ Feature Support">
//         <DataRow label="WebSocket" value={capture.webSocketSupport != null ? String(capture.webSocketSupport) : null} />
//         <DataRow label="Web Worker" value={capture.webWorkerSupport != null ? String(capture.webWorkerSupport) : null} />
//         <DataRow label="Service Worker" value={capture.serviceWorkerSupport != null ? String(capture.serviceWorkerSupport) : null} />
//         <DataRow label="WebAssembly" value={capture.webAssemblySupport != null ? String(capture.webAssemblySupport) : null} />
//         <DataRow label="Bluetooth" value={capture.bluetoothSupport != null ? String(capture.bluetoothSupport) : null} />
//         <DataRow label="USB" value={capture.usbSupport != null ? String(capture.usbSupport) : null} />
//         <DataRow label="NFC" value={capture.nfcSupport} />
//         <DataRow label="Serial" value={capture.serialSupport} />
//         <DataRow label="HID" value={capture.hidSupport} />
//         <DataRow label="Wake Lock" value={capture.wakeLockSupport} />
//         <DataRow label="Vibration" value={capture.vibrationSupport} />
//         <DataRow label="Notifications" value={capture.notificationSupport} />
//         <DataRow label="Gamepad" value={capture.gamepadSupport} />
//         <DataRow label="WebXR / VR" value={capture.xrSupport} />
//         <DataRow label="WebGL2" value={capture.webgl2Support != null ? String(capture.webgl2Support) : null} />
//         <DataRow label="OffscreenCanvas" value={capture.offscreenCanvasSupport} />
//         <DataRow label="SharedArrayBuffer" value={capture.sharedArrayBufferSupport} />
//         <DataRow label="BroadcastChannel" value={capture.broadcastChannelSupport} />
//         <DataRow label="PaymentRequest" value={capture.paymentRequestSupport} />
//         <DataRow label="CredentialMgmt" value={capture.credentialMgmtSupport} />
//         <DataRow label="Presentation" value={capture.presentationSupport} />
//         <DataRow label="Eye Dropper" value={capture.eyeDropperSupport} />
//         <DataRow label="File System Access" value={capture.fileSystemAccessSupport} />
//         <DataRow label="Contact Picker" value={capture.contactPickerSupport} />
//         <DataRow label="Web Share" value={capture.webShareSupport} />
//         <DataRow label="Clipboard API" value={capture.clipboardAPISupport} />
//         <DataRow label="Media Session" value={capture.mediaSessionSupport} />
//         <DataRow label="Picture-in-Picture" value={capture.pictureInPictureSupport} />
//         <DataRow label="Pointer Lock" value={capture.pointerLockSupport} />
//         <DataRow label="Fullscreen" value={capture.fullscreenSupport} />
//         <DataRow label="Speech Recognition" value={capture.speechRecognitionSupport} />
//         <DataRow label="Speech Synthesis" value={capture.speechSynthesisSupport} />
//         <DataRow label="Crypto" value={capture.cryptoSupport} />
//         <DataRow label="Performance Observer" value={capture.performanceObserverSupport} />
//         <DataRow label="Intersection Observer" value={capture.intersectionObserverSupport} />
//         <DataRow label="Resize Observer" value={capture.resizeObserverSupport} />
//         <DataRow label="Mutation Observer" value={capture.mutationObserverSupport} />
//         <DataRow label="requestIdleCallback" value={capture.requestIdleCallbackSupport} />
//         <DataRow label="requestAnimFrame" value={capture.requestAnimFrameSupport} />
//         <DataRow label="Fetch API" value={capture.fetchSupport} />
//         <DataRow label="AbortController" value={capture.abortControllerSupport} />
//         <DataRow label="structuredClone" value={capture.structuredCloneSupport} />
//         <DataRow label="CompressionStream" value={capture.compressionStreamSupport} />
//         <DataRow label="queueMicrotask" value={capture.queueMicrotaskSupport} />
//       </Section>
//     </div>
//   );
// }

// function Section({ title, children }) {
//   return (
//     <div className="mb-4">
//       <div className="font-body text-xs text-primary uppercase tracking-wider mb-2 pb-1.5 border-b border-surface-border">{title}</div>
//       <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
//     </div>
//   );
// }

// function DataRow({ label, value }) {
//   if (value == null || value === "" || value === "null" || value === "undefined") return null;
//   return (
//     <div>
//       <div className="font-body text-xs text-text-muted uppercase tracking-wider mb-0.5">{label}</div>
//       <div className="font-mono text-xs text-text-primary break-all">{String(value)}</div>
//     </div>
//   );
// }

// function PaymentModal({ onClose, uid, fetchUserProfile }) {
//   const plans = [
//     { credits: 5, price: 99, label: "Starter Pack" },
//     { credits: 15, price: 249, label: "Investigation Pack", popular: true },
//     { credits: 50, price: 699, label: "Department Pack" },
//   ];
//   const [selected, setSelected] = React.useState(1);
//   const [processing, setProcessing] = React.useState(false);
//   const [done, setDone] = React.useState(false);

//   async function handlePurchase() {
//     setProcessing(true);
//     await new Promise((r) => setTimeout(r, 2000));
//     const { addCredits } = await import("../utils/linkService");
//     await addCredits(uid, plans[selected].credits);
//     await fetchUserProfile(uid);
//     setDone(true); setProcessing(false);
//   }

//   return (
//     <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
//       <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 w-full max-w-md shadow-card">
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="font-display text-2xl tracking-wider text-text-primary">BUY <span className="text-primary">CREDITS</span></h2>
//           <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
//         </div>
//         {done ? (
//           <div className="text-center py-8">
//             <div className="text-5xl mb-4">✅</div>
//             <h3 className="font-display text-2xl text-primary mb-2">Credits Added!</h3>
//             <p className="font-body text-text-secondary text-sm">{plans[selected].credits} credits added.</p>
//             <button onClick={onClose} className="mt-6 px-6 py-3 bg-primary text-surface font-body font-bold rounded-lg">Back to Dashboard</button>
//           </div>
//         ) : (
//           <>
//             <div className="space-y-3 mb-6">
//               {plans.map((plan, i) => (
//                 <button key={i} onClick={() => setSelected(i)}
//                   className={`w-full text-left p-4 rounded-xl border transition-all ${selected === i ? "border-primary bg-primary/10 shadow-glow" : "border-surface-border bg-surface hover:border-primary/40"}`}>
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <div className="flex items-center gap-2">
//                         <span className="font-display text-lg text-text-primary">{plan.label}</span>
//                         {plan.popular && <span className="bg-primary text-surface text-xs px-2 py-0.5 rounded-full font-body font-bold">POPULAR</span>}
//                       </div>
//                       <div className="font-body text-sm text-text-secondary mt-0.5">{plan.credits} tracking links</div>
//                     </div>
//                     <div className="text-right">
//                       <div className="font-display text-2xl text-primary">Rs.{plan.price}</div>
//                       <div className="font-body text-xs text-text-muted">Rs.{(plan.price / plan.credits).toFixed(0)}/link</div>
//                     </div>
//                   </div>
//                 </button>
//               ))}
//             </div>
//             <button onClick={handlePurchase} disabled={processing}
//               className="w-full px-6 py-3.5 bg-primary text-surface font-body font-bold rounded-lg hover:bg-primary-dark transition-all shadow-glow disabled:opacity-60 flex items-center justify-center gap-2">
//               <CreditCard className="w-4 h-4" />
//               {processing ? "Processing..." : "Pay Rs." + plans[selected].price}
//             </button>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }



import React, { useState, useEffect, useRef } from "react";
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
  const [shortenerProvider, setShortenerProvider] = useState("tinyurl");
  const [credits, setCredits] = useState(userProfile?.credits ?? 0);
  const [selectedLink, setSelectedLink] = useState(null);
  const [openCapture, setOpenCapture] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [serverReady, setServerReady] = useState(false);
  const [serverWaking, setServerWaking] = useState(true);
  const [liveCaptures, setLiveCaptures] = useState(null);

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

  useEffect(() => {
    if (!selectedLink) { setLiveCaptures(null); return; }
    const unsub = onSnapshot(doc(db, "trackingLinks", selectedLink.id), (snap) => {
      if (snap.exists()) setLiveCaptures(snap.data().captures || []);
    });
    return unsub;
  }, [selectedLink?.id]);

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
      if (!data.shortUrl || data.shortUrl === longUrl) return null;
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
            Paste any URL — generates a tracking link + short link. Silently captures 300+ data points then redirects instantly.
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
                          shortenUrl(success, prov).then(s => { setShortUrl(s || "FAILED"); setShortening(false); });
                        }
                      }}
                      className="bg-surface border border-surface-border text-text-primary text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="tinyurl">tinyurl.com (free)</option>
                      <option value="isgd">is.gd (free)</option>
                      <option value="vgd">v.gd (free)</option>
                      <option value="dagd">da.gd (free)</option>
                      <option value="cleanuri">cleanuri.com (free)</option>
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
              {links.map((link) => {
                const captures = (selectedLink?.id === link.id && liveCaptures) ? liveCaptures : (link.captures || []);
                return (
                  <div key={link.id} className="bg-surface border border-surface-border rounded-2xl overflow-hidden">
                    <div className="p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-primary/5 transition-all"
                      onClick={() => setSelectedLink(selectedLink?.id === link.id ? null : link)}>
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
                    <div className="px-5 pb-4 flex items-center gap-6 text-xs text-text-muted font-body border-t border-surface-border/40 pt-3">
                      <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" />{link.clicks || 0} clicks</span>
                      <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" />{captures.length} captures</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{link.createdAt ? new Date(link.createdAt.toMillis()).toLocaleDateString("en-IN") : "-"}</span>
                    </div>
                    {selectedLink?.id === link.id && (
                      <div className="border-t border-surface-border">
                        {captures.length === 0 ? (
                          <div className="p-6 text-center">
                            <p className="font-body text-sm text-text-muted">No captures yet — share the link to start tracking.</p>
                          </div>
                        ) : (
                          <div className="p-4 space-y-3">
                            <p className="font-body text-xs text-text-secondary uppercase tracking-widest mb-4">
                              {captures.length} Device Capture{captures.length > 1 ? "s" : ""} — latest first
                            </p>
                            {[...captures].reverse().map((capture, ri) => {
                              const i = captures.length - 1 - ri;
                              const tabKey = link.id + "-" + i;
                              const isOpen = openCapture === tabKey;
                              const hasGPS = capture.gpsLat && capture.gpsLon;
                              return (
                                <div key={i} className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? "border-primary/50 shadow-glow" : "border-surface-border"}`}>
                                  <button className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
                                    onClick={() => setOpenCapture(isOpen ? null : tabKey)}>
                                    <div className="flex items-center gap-4">
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isOpen ? "bg-primary text-surface" : "bg-surface-border text-text-muted"}`}>
                                        {i + 1}
                                      </div>
                                      <div className="text-left">
                                        <div className="font-body text-sm font-semibold text-text-primary mb-0.5">
                                          Visitor #{i + 1} &nbsp;·&nbsp; {capture.deviceBrand ? capture.deviceBrand + " · " : ""}{capture.device || "Unknown Device"}
                                        </div>
                                        <div className="font-mono text-xs text-text-muted">
                                          {capture.ip || "IP unknown"} &nbsp;·&nbsp; {capture.browser || "Unknown"} {capture.browserVersion ? "v" + capture.browserVersion : ""}
                                        </div>
                                        <div className="font-mono text-xs text-text-muted mt-0.5">
                                          {capture.capturedAt ? new Date(capture.capturedAt).toLocaleString("en-IN") : ""}
                                          {capture.memoryTier ? " · " + capture.memoryTier : ""}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {capture.automationDetected === "true" && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">🤖 BOT</span>
                                      )}
                                      {capture.incognito === "true" && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">🕵️ INCOGNITO</span>
                                      )}
                                      {capture.isMoving && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse font-mono">🚶 MOVING</span>
                                      )}
                                      <span className={`text-xs px-2.5 py-1 rounded-full font-mono border ${hasGPS ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                                        {hasGPS ? "📍 GPS" : "🌐 IP"}
                                      </span>
                                      {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                                    </div>
                                  </button>
                                  {isOpen && (
                                    <div className="border-t border-surface-border p-4 bg-surface">
                                      <CaptureDetail
                                        capture={capture}
                                        linkId={link.id}
                                        captureIndex={i}
                                        liveCaptures={liveCaptures}
                                        captureRealIndex={i}
                                      />
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
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showPayment && (
        <PaymentModal onClose={() => setShowPayment(false)} uid={currentUser?.uid} fetchUserProfile={fetchUserProfile} />
      )}
    </div>
  );
}

// ── LIVE LOCATION MAP — uses Google Maps embed, loads instantly ───────────────
function LiveLocationMap({ lat, lon, liveCaptures, captureRealIndex, isGPS }) {
  const [currentLat, setCurrentLat] = useState(lat);
  const [currentLon, setCurrentLon] = useState(lon);
  const [iframeKey, setIframeKey] = useState(0);

  // Update map when live GPS position changes
  useEffect(() => {
    if (!liveCaptures) return;
    const lc = liveCaptures[captureRealIndex];
    if (!lc?.gpsLat || !lc?.gpsLon) return;
    const newLat = parseFloat(lc.gpsLat);
    const newLon = parseFloat(lc.gpsLon);
    if (isNaN(newLat) || isNaN(newLon)) return;
    if (newLat === currentLat && newLon === currentLon) return;
    setCurrentLat(newLat);
    setCurrentLon(newLon);
    setIframeKey(k => k + 1); // force iframe reload to new location
  }, [liveCaptures, captureRealIndex]);

  const embedUrl = `https://maps.google.com/maps?q=${currentLat},${currentLon}&z=17&output=embed`;
  const openUrl = `https://www.google.com/maps?q=${currentLat},${currentLon}`;

  return (
    <div className="mb-3">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-primary text-xs font-body uppercase tracking-wider font-semibold">
            📍 {isGPS ? "Live Location" : "IP Location"}
          </span>
          {liveCaptures?.[captureRealIndex]?.gpsLat && (
            <span className="flex items-center gap-1 text-xs text-green-400 font-mono animate-pulse">
              ● Live
            </span>
          )}
        </div>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-body text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" /> Open Maps
        </a>
      </div>

      {/* Google Maps embed — loads instantly, no JS needed */}
      <div style={{
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(59,130,246,0.3)",
        boxShadow: "0 0 20px rgba(59,130,246,0.1)",
        height: 300,
        position: "relative",
        background: "#1a2035",
      }}>
        <iframe
          key={iframeKey}
          title="live-location-map"
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0, display: "block" }}
          allowFullScreen
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Coordinates + action buttons */}
      <div className="mt-2 mb-1 flex items-center gap-2 flex-wrap">
        <span className="font-mono text-xs text-text-muted bg-surface border border-surface-border rounded-lg px-3 py-1.5">
          {currentLat.toFixed(6)}, {currentLon.toFixed(6)}
        </span>
        {liveCaptures?.[captureRealIndex]?.gpsAccuracy && (
          <span className="font-mono text-xs text-text-muted bg-surface border border-surface-border rounded-lg px-3 py-1.5">
            ±{liveCaptures[captureRealIndex].gpsAccuracy}m accuracy
          </span>
        )}
      </div>

      {/* Map provider buttons */}
      <div className="flex gap-2 mt-2">
        <a href={`https://www.google.com/maps?q=${currentLat},${currentLon}`} target="_blank" rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-surface border border-surface-border rounded-xl font-body text-xs text-text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors">
          <Globe className="w-3.5 h-3.5 text-primary" /> Google Maps
        </a>
        <a href={`https://maps.apple.com/?q=${currentLat},${currentLon}`} target="_blank" rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-surface border border-surface-border rounded-xl font-body text-xs text-text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors">
          🗺️ Apple Maps
        </a>
        <a href={`https://waze.com/ul?ll=${currentLat},${currentLon}&navigate=yes`} target="_blank" rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-surface border border-surface-border rounded-xl font-body text-xs text-text-primary hover:bg-primary/10 hover:border-primary/40 transition-colors">
          🚗 Waze
        </a>
      </div>
    </div>
  );
}

// ── CAPTURE DETAIL ────────────────────────────────────────────────────────────
function CaptureDetail({ capture, linkId, captureIndex, liveCaptures, captureRealIndex }) {
  const [copied, setCopied] = useState(false);
  const liveCapture = liveCaptures?.[captureRealIndex];
  const mapLat = parseFloat(liveCapture?.gpsLat || capture.gpsLat || capture.lat);
  const mapLon = parseFloat(liveCapture?.gpsLon || capture.gpsLon || capture.lon);
  const showMap = !isNaN(mapLat) && !isNaN(mapLon) && mapLat !== 0 && mapLon !== 0;
  const isGPS = !!(liveCapture?.gpsLat || capture.gpsLat);

  function copyAll() {
    const text = Object.entries(capture).filter(([, v]) => v != null && v !== "").map(([k, v]) => `${k}: ${v}`).join("\n");
    navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function downloadPDF() {
    const doc = new jsPDF();
    doc.setFontSize(14); doc.text("Traxalon — Capture Report", 14, 16);
    doc.setFontSize(9);
    let y = 26;
    Object.entries(capture).filter(([, v]) => v != null && v !== "").forEach(([k, v]) => {
      const line = `${k}: ${String(v)}`; const lines = doc.splitTextToSize(line, 180);
      if (y + lines.length * 5 > 285) { doc.addPage(); y = 16; }
      doc.text(lines, 14, y); y += lines.length * 5 + 1;
    });
    doc.save(`capture-${linkId}-${captureIndex + 1}.pdf`);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={copyAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-border text-text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors">
          {copied ? <><CheckCircle className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy All</>}
        </button>
        <button onClick={downloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-border text-text-primary rounded-lg font-body text-xs hover:bg-primary/20 transition-colors">
          <FileText className="w-3 h-3" /> Download PDF
        </button>
        {liveCapture?.gpsLat && <span className="flex items-center gap-1 text-xs text-green-400 font-mono animate-pulse">🔴 Live tracking</span>}
        {capture.automationDetected === "true" && <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-mono">🤖 Automation Detected</span>}
        {capture.incognito === "true" && <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">🕵️ Incognito Mode</span>}
      </div>

      {/* ── LIVE LOCATION MAP — shows instantly ── */}
      {showMap && (
        <LiveLocationMap
          lat={mapLat}
          lon={mapLon}
          liveCaptures={liveCaptures}
          captureRealIndex={captureRealIndex}
          isGPS={isGPS}
        />
      )}

      <Section title="🌍 Location & Network">
        <DataRow label="IP Address" value={capture.ip} />
        <DataRow label="Country" value={capture.country} />
        <DataRow label="Country Code" value={capture.countryCode} />
        <DataRow label="Region" value={capture.region} />
        <DataRow label="City" value={capture.city} />
        <DataRow label="ZIP / Pincode" value={capture.zip} />
        <DataRow label="Latitude" value={capture.lat} />
        <DataRow label="Longitude" value={capture.lon} />
        <DataRow label="Timezone" value={capture.timezone} />
        <DataRow label="ISP" value={capture.isp} />
        <DataRow label="Org" value={capture.org} />
        <DataRow label="ASN" value={capture.asn} />
        <DataRow label="Hostname" value={capture.hostname} />
        <DataRow label="Proxy / VPN" value={capture.isProxy != null ? String(capture.isProxy) : null} />
        <DataRow label="Hosting / VPS" value={capture.isHosting != null ? String(capture.isHosting) : null} />
        <DataRow label="Mobile Network" value={capture.isMobileNetwork != null ? String(capture.isMobileNetwork) : null} />
      </Section>

      <Section title="📍 GPS (Exact Location)">
        <DataRow label="GPS Lat" value={capture.gpsLat} />
        <DataRow label="GPS Lon" value={capture.gpsLon} />
        <DataRow label="GPS Accuracy" value={capture.gpsAccuracy ? `±${capture.gpsAccuracy}m` : null} />
        <DataRow label="GPS Altitude" value={capture.gpsAltitude} />
        <DataRow label="GPS Speed" value={capture.gpsSpeed ? (parseFloat(capture.gpsSpeed) * 3.6).toFixed(1) + " km/h" : null} />
        <DataRow label="GPS Heading" value={capture.gpsHeading} />
        <DataRow label="GPS Address" value={capture.gpsAddress} />
        <DataRow label="GPS City" value={capture.gpsCity} />
        <DataRow label="GPS State" value={capture.gpsState} />
        <DataRow label="GPS Pincode" value={capture.gpsPincode} />
        <DataRow label="GPS Country" value={capture.gpsCountry} />
        <DataRow label="Is Moving" value={capture.isMoving != null ? (capture.isMoving ? "🚶 Yes" : "🛑 No") : null} />
      </Section>

      <Section title="💻 Device & Browser">
        <DataRow label="Device Brand" value={capture.deviceBrand} />
        <DataRow label="Device Model" value={capture.deviceModel} />
        <DataRow label="Device Type" value={capture.device} />
        <DataRow label="Form Factor" value={capture.formFactor} />
        <DataRow label="OS" value={capture.os} />
        <DataRow label="Platform" value={capture.platform} />
        <DataRow label="Architecture" value={capture.architecture} />
        <DataRow label="OS CPU" value={capture.oscpu} />
        <DataRow label="CPU Class" value={capture.cpuClass} />
        <DataRow label="Browser" value={capture.browser} />
        <DataRow label="Browser Version" value={capture.browserVersion} />
        <DataRow label="Browser Engine" value={capture.browserEngine} />
        <DataRow label="Browser Code Name" value={capture.browserCodeName} />
        <DataRow label="App Name" value={capture.appName} />
        <DataRow label="App Version" value={capture.appVersion} />
        <DataRow label="Product" value={capture.product} />
        <DataRow label="Build ID" value={capture.buildID} />
        <DataRow label="Vendor" value={capture.vendor} />
        <DataRow label="Webdriver" value={capture.webdriver} />
        <DataRow label="Automation Detected" value={capture.automationDetected} />
        <DataRow label="User Agent" value={capture.userAgent} />
      </Section>

      <Section title="⚙️ Hardware">
        <DataRow label="CPU Cores" value={capture.cpuCores != null ? String(capture.cpuCores) : null} />
        <DataRow label="RAM (GB)" value={capture.ram != null ? String(capture.ram) : null} />
        <DataRow label="RAM Raw" value={capture.memoryTierRaw} />
        <DataRow label="Memory Tier" value={capture.memoryTier} />
        <DataRow label="CPU Benchmark" value={capture.cpuBenchmarkScore} />
        <DataRow label="Max Touch Points" value={capture.maxTouchPoints != null ? String(capture.maxTouchPoints) : null} />
        <DataRow label="Touch Detail" value={capture.maxTouchPointsDetail} />
        <DataRow label="Touch Support" value={capture.touchSupport != null ? String(capture.touchSupport) : null} />
        <DataRow label="Is Touch Device" value={capture.isTouchDevice} />
        <DataRow label="Pointer Type" value={capture.pointerType} />
        <DataRow label="Pointer Fine" value={capture.pointerFine} />
        <DataRow label="Hover Capability" value={capture.hoverCapability} />
        <DataRow label="Device Motion" value={capture.deviceMotionSupport} />
        <DataRow label="Device Orientation" value={capture.deviceOrientationSupport} />
        <DataRow label="Ambient Light" value={capture.ambientLightSupport} />
        <DataRow label="Java Enabled" value={capture.javaEnabled != null ? String(capture.javaEnabled) : null} />
        <DataRow label="PDF Viewer" value={capture.pdfViewerEnabled != null ? String(capture.pdfViewerEnabled) : null} />
        <DataRow label="Gamepads Connected" value={capture.gamepadsConnected} />
      </Section>

      <Section title="🎨 GPU & WebGL">
        <DataRow label="GPU" value={capture.gpu} />
        <DataRow label="GPU Vendor" value={capture.gpuVendor} />
        <DataRow label="WebGL Version" value={capture.webglVersion} />
        <DataRow label="WebGL Renderer" value={capture.webglRenderer} />
        <DataRow label="WebGL Vendor" value={capture.webglVendor} />
        <DataRow label="Shading Language" value={capture.webglShadingLanguage} />
        <DataRow label="WebGL Hash" value={capture.webglHash} />
        <DataRow label="Shader Precision" value={capture.shaderPrecision} />
        <DataRow label="WebGL Color Bits" value={capture.webglColorBits} />
        <DataRow label="Max Texture Size" value={capture.maxTextureSize} />
        <DataRow label="Max Viewport Dims" value={capture.maxViewportDims} />
        <DataRow label="Max Anisotropy" value={capture.maxAnisotropy} />
        <DataRow label="Max Vertex Attribs" value={capture.maxVertexAttribs} />
        <DataRow label="Max Vertex Uniforms" value={capture.maxVertexUniformVectors} />
        <DataRow label="Max Fragment Uniforms" value={capture.maxFragmentUniformVectors} />
        <DataRow label="Max Combined Tex" value={capture.maxCombinedTextureUnits} />
        <DataRow label="Max Cube Map" value={capture.maxCubeMapTextureSize} />
        <DataRow label="Max Render Buffer" value={capture.maxRenderBufferSize} />
        <DataRow label="Max Varying Vectors" value={capture.maxVaryingVectors} />
        <DataRow label="Max Vertex Tex Units" value={capture.maxVertexTextureUnits} />
        <DataRow label="Max Fragment Tex" value={capture.maxFragmentTextureUnits} />
        <DataRow label="Point Size Range" value={capture.aliasedPointSizeRange} />
        <DataRow label="Line Width Range" value={capture.aliasedLineWidthRange} />
        <DataRow label="WebGL Extensions" value={capture.webglExtensionsCount != null ? String(capture.webglExtensionsCount) : null} />
        <DataRow label="WebGL Extensions List" value={capture.webglExtensionsList} />
        <DataRow label="WebGL2 Support" value={capture.webgl2Support != null ? String(capture.webgl2Support) : null} />
      </Section>

      <Section title="🖥️ Screen & Display">
        <DataRow label="Screen Resolution" value={capture.screenWidth && capture.screenHeight ? `${capture.screenWidth}×${capture.screenHeight}` : null} />
        <DataRow label="Physical Resolution" value={capture.physicalResolution} />
        <DataRow label="Available Size" value={capture.screenAvailWidth && capture.screenAvailHeight ? `${capture.screenAvailWidth}×${capture.screenAvailHeight}` : null} />
        <DataRow label="Window Size" value={capture.windowWidth && capture.windowHeight ? `${capture.windowWidth}×${capture.windowHeight}` : null} />
        <DataRow label="Outer Size" value={capture.outerWidth && capture.outerHeight ? `${capture.outerWidth}×${capture.outerHeight}` : null} />
        <DataRow label="Visual Viewport" value={capture.visualViewportWidth && capture.visualViewportHeight ? `${capture.visualViewportWidth}×${capture.visualViewportHeight}` : null} />
        <DataRow label="Viewport Scale" value={capture.visualViewportScale != null ? String(capture.visualViewportScale) : null} />
        <DataRow label="Color Depth" value={capture.colorDepth != null ? String(capture.colorDepth) + " bit" : null} />
        <DataRow label="Screen Color Depth" value={capture.screenColorDepth} />
        <DataRow label="Device Pixel Ratio" value={capture.pixelRatio != null ? String(capture.pixelRatio) : null} />
        <DataRow label="Pixel Ratio %" value={capture.devicePixelRatioPercent} />
        <DataRow label="CSS PX Density" value={capture.cssPxDensity} />
        <DataRow label="Orientation" value={capture.orientation} />
        <DataRow label="Orientation Angle" value={capture.orientationAngle != null ? String(capture.orientationAngle) + "°" : null} />
        <DataRow label="HDR Support" value={capture.hdrSupport} />
        <DataRow label="Color Gamut" value={capture.colorGamut} />
        <DataRow label="Color Scheme" value={capture.colorScheme} />
        <DataRow label="Dark Mode" value={capture.prefersColorScheme} />
        <DataRow label="Prefers Contrast" value={capture.prefersContrast} />
        <DataRow label="Forced Colors" value={capture.forcedColors} />
        <DataRow label="Inverted Colors" value={capture.invertedColors} />
        <DataRow label="Reduce Motion" value={capture.prefersReducedMotion} />
        <DataRow label="Display Mode" value={capture.displayMode} />
        <DataRow label="Monochrome" value={capture.monochrome} />
        <DataRow label="Pointer Fine" value={capture.pointerFine} />
        <DataRow label="Hover Capability" value={capture.hoverCapability} />
      </Section>

      <Section title="🔋 Battery & Connection">
        <DataRow label="Battery Level" value={capture.batteryLevel != null ? String(capture.batteryLevel) + "%" : null} />
        <DataRow label="Charging" value={capture.batteryCharging != null ? String(capture.batteryCharging) : null} />
        <DataRow label="Charging Time" value={capture.batteryChargingTime != null ? String(capture.batteryChargingTime) + "s" : null} />
        <DataRow label="Discharging Time" value={capture.batteryDischargingTime != null ? String(capture.batteryDischargingTime) + "s" : null} />
        <DataRow label="Connection Type" value={capture.connectionType} />
        <DataRow label="Connection Quality" value={capture.connectionQuality} />
        <DataRow label="Network Label" value={capture.networkLabel} />
        <DataRow label="Speed Tier" value={capture.speedTier} />
        <DataRow label="Downlink" value={capture.connectionDownlink != null ? String(capture.connectionDownlink) + " Mbps" : null} />
        <DataRow label="RTT" value={capture.connectionRtt != null ? String(capture.connectionRtt) + " ms" : null} />
        <DataRow label="Save Data" value={capture.connectionSaveData != null ? String(capture.connectionSaveData) : null} />
        <DataRow label="Downlink Max" value={capture.connectionDownlinkMax != null ? String(capture.connectionDownlinkMax) : null} />
        <DataRow label="Online Status" value={capture.onlineStatus} />
        <DataRow label="Browser Online" value={capture.browserOnline} />
      </Section>

      <Section title="🕐 Time & Locale">
        <DataRow label="Captured At" value={capture.capturedAt} />
        <DataRow label="Local Time" value={capture.localTime} />
        <DataRow label="Local Time (12h)" value={capture.localTime12} />
        <DataRow label="Local Date" value={capture.localDate} />
        <DataRow label="Day of Week" value={capture.dayOfWeek} />
        <DataRow label="Time of Day" value={capture.timeOfDay} />
        <DataRow label="Client Timezone" value={capture.clientTimezone} />
        <DataRow label="Timezone Formatted" value={capture.tzFormatted} />
        <DataRow label="UTC Offset" value={capture.timezoneOffset != null ? String(capture.timezoneOffset) + " min" : null} />
        <DataRow label="DST Active" value={capture.dstActive} />
        <DataRow label="Language" value={capture.language} />
        <DataRow label="Languages" value={capture.languages} />
        <DataRow label="Doc Language" value={capture.docLanguage} />
      </Section>

      <Section title="🔒 Privacy & Fingerprint">
        <DataRow label="Incognito" value={capture.incognito != null ? String(capture.incognito) : null} />
        <DataRow label="Ad Blocker" value={capture.adBlockDetected != null ? String(capture.adBlockDetected) : null} />
        <DataRow label="Cookies Enabled" value={capture.cookiesEnabled != null ? String(capture.cookiesEnabled) : null} />
        <DataRow label="Cookies Count" value={capture.cookiesCount != null ? String(capture.cookiesCount) : null} />
        <DataRow label="Do Not Track" value={capture.doNotTrack} />
        <DataRow label="History Length" value={capture.historyLength != null ? String(capture.historyLength) : null} />
        <DataRow label="Navigation Type" value={capture.navigationEntryType} />
        <DataRow label="Session Length" value={capture.sessionLengthSeconds ? capture.sessionLengthSeconds + "s" : null} />
        <DataRow label="Tabs Estimate" value={capture.tabsEstimate} />
        <DataRow label="Referrer" value={capture.referrer} />
        <DataRow label="Canvas Hash" value={capture.canvasHash} />
        <DataRow label="Canvas Geometry" value={capture.canvasGeometryHash} />
        <DataRow label="Audio Fingerprint" value={capture.audioFingerprint} />
        <DataRow label="CSS Hash" value={capture.cssHash} />
        <DataRow label="Font Fingerprint" value={capture.fontFingerprint} />
        <DataRow label="Is Secure Context" value={capture.isSecureContext} />
        <DataRow label="Cross Origin Isolated" value={capture.crossOriginIsolated} />
        <DataRow label="Tab Hidden" value={capture.tabHidden} />
        <DataRow label="Visibility State" value={capture.visibilityState} />
        <DataRow label="Window Focused" value={capture.windowFocused} />
        <DataRow label="Is Fullscreen" value={capture.isFullscreen} />
        <DataRow label="Scroll X" value={capture.scrollPositionX != null ? String(capture.scrollPositionX) : null} />
        <DataRow label="Scroll Y" value={capture.scrollPositionY != null ? String(capture.scrollPositionY) : null} />
        <DataRow label="Page URL" value={capture.pageUrl} />
        <DataRow label="Document Charset" value={capture.documentCharset} />
        <DataRow label="Compat Mode" value={capture.documentCompatMode} />
      </Section>

      <Section title="🌐 WebRTC">
        <DataRow label="WebRTC Local IP" value={capture.webrtcLocalIP} />
        <DataRow label="WebRTC Public IP" value={capture.webrtcPublicIP} />
        <DataRow label="WebRTC Support" value={capture.webrtcSupport} />
      </Section>

      <Section title="🎙️ Media Devices">
        <DataRow label="Cameras" value={capture.cameras != null ? String(capture.cameras) : null} />
        <DataRow label="Microphones" value={capture.microphones != null ? String(capture.microphones) : null} />
        <DataRow label="Speakers" value={capture.speakers != null ? String(capture.speakers) : null} />
        <DataRow label="Speech Voices" value={capture.speechVoicesCount != null ? String(capture.speechVoicesCount) : null} />
        <DataRow label="Voice Names" value={capture.speechVoices} />
      </Section>

      <Section title="🎬 Media & Codecs">
        <DataRow label="Codec Support" value={capture.codecSupport} />
        <DataRow label="H.264" value={capture.h264Support} />
        <DataRow label="VP9" value={capture.vp9Support} />
        <DataRow label="AV1" value={capture.av1Support} />
      </Section>

      <Section title="💾 Storage">
        <DataRow label="Storage Quota" value={capture.storageQuota} />
        <DataRow label="Storage Used" value={capture.storageUsage} />
        <DataRow label="LocalStorage" value={capture.localStorageEnabled != null ? String(capture.localStorageEnabled) : null} />
        <DataRow label="LocalStorage Size" value={capture.localStorageSize} />
        <DataRow label="SessionStorage" value={capture.sessionStorageEnabled != null ? String(capture.sessionStorageEnabled) : null} />
        <DataRow label="IndexedDB" value={capture.indexedDBEnabled != null ? String(capture.indexedDBEnabled) : null} />
        <DataRow label="Cache API" value={capture.cacheAPIEnabled} />
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
        <DataRow label="CPU Benchmark" value={capture.cpuBenchmarkScore} />
        <DataRow label="Body Scroll Height" value={capture.bodyScrollHeight} />
        <DataRow label="HTML Font Size" value={capture.htmlFontSize} />
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
        <DataRow label="Keyboard Layout" value={capture.keyboardLayout} />
        <DataRow label="Permission API" value={capture.permissionAPISupport} />
      </Section>

      <Section title="✅ Feature Support">
        <DataRow label="WebSocket" value={capture.webSocketSupport != null ? String(capture.webSocketSupport) : null} />
        <DataRow label="Web Worker" value={capture.webWorkerSupport != null ? String(capture.webWorkerSupport) : null} />
        <DataRow label="Service Worker" value={capture.serviceWorkerSupport != null ? String(capture.serviceWorkerSupport) : null} />
        <DataRow label="WebAssembly" value={capture.webAssemblySupport != null ? String(capture.webAssemblySupport) : null} />
        <DataRow label="Bluetooth" value={capture.bluetoothSupport != null ? String(capture.bluetoothSupport) : null} />
        <DataRow label="USB" value={capture.usbSupport != null ? String(capture.usbSupport) : null} />
        <DataRow label="NFC" value={capture.nfcSupport} />
        <DataRow label="Serial" value={capture.serialSupport} />
        <DataRow label="HID" value={capture.hidSupport} />
        <DataRow label="Wake Lock" value={capture.wakeLockSupport} />
        <DataRow label="Vibration" value={capture.vibrationSupport} />
        <DataRow label="Notifications" value={capture.notificationSupport} />
        <DataRow label="Gamepad" value={capture.gamepadSupport} />
        <DataRow label="WebXR / VR" value={capture.xrSupport} />
        <DataRow label="WebGL2" value={capture.webgl2Support != null ? String(capture.webgl2Support) : null} />
        <DataRow label="OffscreenCanvas" value={capture.offscreenCanvasSupport} />
        <DataRow label="SharedArrayBuffer" value={capture.sharedArrayBufferSupport} />
        <DataRow label="BroadcastChannel" value={capture.broadcastChannelSupport} />
        <DataRow label="PaymentRequest" value={capture.paymentRequestSupport} />
        <DataRow label="CredentialMgmt" value={capture.credentialMgmtSupport} />
        <DataRow label="Presentation" value={capture.presentationSupport} />
        <DataRow label="Eye Dropper" value={capture.eyeDropperSupport} />
        <DataRow label="File System Access" value={capture.fileSystemAccessSupport} />
        <DataRow label="Contact Picker" value={capture.contactPickerSupport} />
        <DataRow label="Web Share" value={capture.webShareSupport} />
        <DataRow label="Clipboard API" value={capture.clipboardAPISupport} />
        <DataRow label="Media Session" value={capture.mediaSessionSupport} />
        <DataRow label="Picture-in-Picture" value={capture.pictureInPictureSupport} />
        <DataRow label="Pointer Lock" value={capture.pointerLockSupport} />
        <DataRow label="Fullscreen" value={capture.fullscreenSupport} />
        <DataRow label="Speech Recognition" value={capture.speechRecognitionSupport} />
        <DataRow label="Speech Synthesis" value={capture.speechSynthesisSupport} />
        <DataRow label="Crypto" value={capture.cryptoSupport} />
        <DataRow label="Performance Observer" value={capture.performanceObserverSupport} />
        <DataRow label="Intersection Observer" value={capture.intersectionObserverSupport} />
        <DataRow label="Resize Observer" value={capture.resizeObserverSupport} />
        <DataRow label="Mutation Observer" value={capture.mutationObserverSupport} />
        <DataRow label="requestIdleCallback" value={capture.requestIdleCallbackSupport} />
        <DataRow label="requestAnimFrame" value={capture.requestAnimFrameSupport} />
        <DataRow label="Fetch API" value={capture.fetchSupport} />
        <DataRow label="AbortController" value={capture.abortControllerSupport} />
        <DataRow label="structuredClone" value={capture.structuredCloneSupport} />
        <DataRow label="CompressionStream" value={capture.compressionStreamSupport} />
        <DataRow label="queueMicrotask" value={capture.queueMicrotaskSupport} />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
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
