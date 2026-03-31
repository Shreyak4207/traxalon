import express from "express";
import axios from "axios";
import { createTrackingLink, recordCapture, addCredits, createPixel, recordPixelHit } from "../utils/linkService.js";
import { db } from "../firebase/config.js";

const router = express.Router();

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

function getClientIP(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.socket?.remoteAddress || req.ip || "Unknown";
}

function parseEmailClient(ua = "") {
    if (/Googlebot|Google-Apps-Script/i.test(ua)) return "Gmail";
    if (/Outlook|microsoft.outlook/i.test(ua)) return "Outlook";
    if (/YahooMailProxy|Yahoo/i.test(ua)) return "Yahoo Mail";
    if (/Apple.*Mail|Thunderbird/i.test(ua)) return "Apple Mail";
    if (/ProtonMail/i.test(ua)) return "ProtonMail";
    if (/curl/i.test(ua)) return "cURL / Script";
    if (/python/i.test(ua)) return "Python Script";
    if (/axios|node-fetch/i.test(ua)) return "Node.js";
    if (/Chrome/i.test(ua)) return "Chrome Browser";
    if (/Firefox/i.test(ua)) return "Firefox Browser";
    if (/Safari/i.test(ua)) return "Safari Browser";
    return "Unknown";
}

async function reverseGeocode(lat, lon) {
    try {
        const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, { headers: { "User-Agent": "Traxelon/1.0", Accept: "application/json" }, timeout: 6000 }
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
    } catch { return {}; }
}

async function enrichIP(ip) {
    try {
        if (!ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.")) {
            return { note: "Local IP" };
        }
        const res = await axios.get(
            `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,query,proxy,hosting,mobile`, { timeout: 5000 }
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
            isProxy: d.proxy || false,
            isHosting: d.hosting || false,
            isMobileNetwork: d.mobile || false,
        };
    } catch { return {}; }
}

// -- PIXEL ROUTES --------------------------------------------------------------

// IMPORTANT: /pixel/create and /pixel/list must come BEFORE /pixel/:filename
// Otherwise Express matches "create" as a filename token

router.post("/pixel/create", async(req, res) => {
    try {
        const { uid, label } = req.body;
        if (!uid) return res.status(400).json({ error: "uid is required" });
        const result = await createPixel(uid, label);
        return res.status(200).json(result);
    } catch (err) {
        console.error("[POST /pixel/create]", err.message);
        return res.status(500).json({ error: err.message });
    }
});

router.get("/pixel/list/:uid", async(req, res) => {
    try {
        const { uid } = req.params;
        const snap = await db.collection("pixelLinks").where("uid", "==", uid).get();
        const pixels = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        pixels.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        return res.status(200).json({ pixels });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.get("/pixel/:filename", async(req, res) => {
    const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
    res.set({
        "Content-Type": "image/gif",
        "Content-Length": GIF.length,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
    });
    res.end(GIF);

    try {
        const token = req.params.filename.replace(/\.(gif|png|jpg)$/i, "");
        const ua = req.headers["user-agent"] || "";
        const ip = (() => {
            const fwd = req.headers["x-forwarded-for"];
            if (fwd) return fwd.split(",")[0].trim();
            return req.socket?.remoteAddress || req.ip || "Unknown";
        })();

        let ipData = {};
        try {
            if (ip && ip !== "::1" && !ip.startsWith("127.") && !ip.startsWith("192.168.")) {
                const r = await axios.get(
                    `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,proxy,hosting,mobile`, { timeout: 4000 }
                );
                if (r.data.status === "success") {
                    ipData = {
                        country: r.data.country || null,
                        countryCode: r.data.countryCode || null,
                        region: r.data.regionName || null,
                        city: r.data.city || null,
                        zip: r.data.zip || null,
                        lat: r.data.lat || null,
                        lon: r.data.lon || null,
                        timezone: r.data.timezone || null,
                        isp: r.data.isp || null,
                        org: r.data.org || null,
                        isProxy: r.data.proxy || false,
                        isHosting: r.data.hosting || false,
                        isMobileNetwork: r.data.mobile || false,
                    };
                }
            }
        } catch {}

        const hitData = {
            ip,
            emailClient: parseEmailClient(ua),
            userAgent: ua,
            referer: req.headers["referer"] || req.headers["referrer"] || null,
            acceptLanguage: req.headers["accept-language"] || null,
            os: parseOS(ua),
            device: parseDevice(ua),
            browser: parseBrowser(ua),
            ...ipData,
        };

        recordPixelHit(token, hitData).catch(() => {});
    } catch (err) {
        console.error("[GET /pixel]", err.message);
    }
});

export default router;


