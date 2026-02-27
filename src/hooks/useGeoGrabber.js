// import { useState, useEffect } from "react";

// const GPS_TIMEOUT_MS = 12000;

// function getGPSPosition() {
//     return new Promise((resolve, reject) => {
//         if (!navigator || !navigator.geolocation) {
//             reject(new Error("Geolocation API not supported"));
//             return;
//         }
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//             enableHighAccuracy: true,
//             timeout: GPS_TIMEOUT_MS,
//             maximumAge: 0,
//         });
//     });
// }

// async function reverseGeocode(lat, lon) {
//     try {
//         const res = await fetch(
//             `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
//                 headers: {
//                     "User-Agent": "Traxalon/1.0",
//                     Accept: "application/json",
//                 },
//             }
//         );
//         if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
//         const data = await res.json();
//         const addr = data.address || {};
//         return {
//             address: data.display_name || null,
//             city: addr.city || addr.town || addr.village || addr.county || null,
//             state: addr.state || null,
//             pincode: addr.postcode || null,
//             country: addr.country || null,
//             countryCode: addr.country_code ? .toUpperCase() || null,
//         };
//     } catch {
//         return {};
//     }
// }

// async function getIPLocation() {
//     const res = await fetch("https://ipapi.co/json/", {
//         headers: { Accept: "application/json" },
//     });
//     if (!res.ok) throw new Error(`ipapi.co error ${res.status}`);
//     const d = await res.json();
//     if (d.error) throw new Error(d.reason || "IP lookup failed");
//     return {
//         lat: d.latitude,
//         lon: d.longitude,
//         city: d.city || null,
//         region: d.region || null,
//         country: d.country_name || null,
//         countryCode: d.country_code || null,
//         timezone: d.timezone || null,
//         isp: d.org || null,
//     };
// }

// export function useGeoGrabber() {
//     const [location, setLocation] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     useEffect(() => {
//         let cancelled = false;

//         async function grab() {
//             setLoading(true);
//             setError(null);
//             setLocation(null);

//             let gpsPos = null;
//             let gpsErr = null;

//             try {
//                 gpsPos = await getGPSPosition();
//             } catch (e) {
//                 gpsErr = e;
//             }

//             if (cancelled) return;

//             if (gpsPos) {
//                 const { latitude, longitude, accuracy } = gpsPos.coords;
//                 const geocoded = await reverseGeocode(latitude, longitude);
//                 if (cancelled) return;
//                 setLocation({
//                     source: "gps",
//                     lat: latitude,
//                     lon: longitude,
//                     gpsAccuracy: Math.round(accuracy),
//                     address: geocoded.address || null,
//                     city: geocoded.city || null,
//                     state: geocoded.state || null,
//                     pincode: geocoded.pincode || null,
//                     country: geocoded.country || null,
//                     countryCode: geocoded.countryCode || null,
//                 });
//             } else {
//                 try {
//                     const meta = await getIPLocation();
//                     if (cancelled) return;
//                     setLocation({
//                         source: "ip",
//                         lat: meta.lat,
//                         lon: meta.lon,
//                         gpsAccuracy: null,
//                         address: null,
//                         city: meta.city,
//                         state: meta.region,
//                         pincode: null,
//                         country: meta.country,
//                         countryCode: meta.countryCode,
//                         timezone: meta.timezone,
//                         isp: meta.isp,
//                     });
//                 } catch (ipErr) {
//                     if (cancelled) return;
//                     setError(gpsErr ? .code === 1 ? "Location permission denied." : `Could not resolve location`);
//                 }
//             }
//             setLoading(false);
//         }

//         grab();
//         return () => { cancelled = true; };
//     }, []);

//     return { location, loading, error };
// }

// export default useGeoGrabber;




import { useState, useEffect } from "react";

const GPS_TIMEOUT_MS = 12000;

function getGPSPosition() {
    return new Promise(function(resolve, reject) {
        if (!navigator || !navigator.geolocation) {
            reject(new Error("Geolocation API not supported"));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: GPS_TIMEOUT_MS,
            maximumAge: 0,
        });
    });
}

async function reverseGeocode(lat, lon) {
    try {
        const res = await fetch(
            "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lon, {
                headers: {
                    "User-Agent": "Traxalon/1.0",
                    "Accept": "application/json",
                },
            }
        );
        if (!res.ok) return {};
        const data = await res.json();
        const addr = data.address || {};
        return {
            address: data.display_name || null,
            city: addr.city || addr.town || addr.village || addr.county || null,
            state: addr.state || null,
            pincode: addr.postcode || null,
            country: addr.country || null,
            countryCode: addr.country_code ? addr.country_code.toUpperCase() : null,
        };
    } catch (e) {
        return {};
    }
}

async function getIPLocation() {
    const res = await fetch("https://ipapi.co/json/", {
        headers: { "Accept": "application/json" },
    });
    if (!res.ok) throw new Error("ipapi.co error");
    const d = await res.json();
    if (d.error) throw new Error(d.reason || "IP lookup failed");
    return {
        lat: d.latitude,
        lon: d.longitude,
        city: d.city || null,
        region: d.region || null,
        country: d.country_name || null,
        countryCode: d.country_code || null,
        timezone: d.timezone || null,
        isp: d.org || null,
    };
}

export function useGeoGrabber() {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(function() {
        var cancelled = false;

        async function grab() {
            setLoading(true);
            setError(null);
            setLocation(null);

            var gpsPos = null;
            var gpsErr = null;

            try {
                gpsPos = await getGPSPosition();
            } catch (e) {
                gpsErr = e;
            }

            if (cancelled) return;

            if (gpsPos) {
                var lat = gpsPos.coords.latitude;
                var lon = gpsPos.coords.longitude;
                var accuracy = gpsPos.coords.accuracy;
                var geocoded = await reverseGeocode(lat, lon);
                if (cancelled) return;
                setLocation({
                    source: "gps",
                    lat: lat,
                    lon: lon,
                    gpsAccuracy: Math.round(accuracy),
                    address: geocoded.address || null,
                    city: geocoded.city || null,
                    state: geocoded.state || null,
                    pincode: geocoded.pincode || null,
                    country: geocoded.country || null,
                    countryCode: geocoded.countryCode || null,
                });
            } else {
                try {
                    var meta = await getIPLocation();
                    if (cancelled) return;
                    setLocation({
                        source: "ip",
                        lat: meta.lat,
                        lon: meta.lon,
                        gpsAccuracy: null,
                        address: null,
                        city: meta.city,
                        state: meta.region,
                        pincode: null,
                        country: meta.country,
                        countryCode: meta.countryCode,
                        timezone: meta.timezone,
                        isp: meta.isp,
                    });
                } catch (ipErr) {
                    if (cancelled) return;
                    setError(gpsErr && gpsErr.code === 1 ? "Location permission denied." : "Could not resolve location");
                }
            }
            setLoading(false);
        }

        grab();
        return function() { cancelled = true; };
    }, []);

    return { location, loading, error };
}

export default useGeoGrabber;