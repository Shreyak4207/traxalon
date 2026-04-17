import { db } from "../firebase/config.js";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "https://traxalon-main-01.vercel.app";
const BACKEND_URL = process.env.BACKEND_URL || "https://traxalon.onrender.com";

export function generateToken() {
    return (
        Math.random().toString(36).substring(2, 10) +
        Math.random().toString(36).substring(2, 10)
    );
}

export async function createTrackingLink(uid, label, destinationUrl) {
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) throw new Error("User not found");
    const userData = userSnap.data();
    if ((userData.credits ?? 0) < 1) throw new Error("Insufficient credits");

    const token = generateToken();
    const trackingUrl = `${FRONTEND_URL}/t/${token}`;

    let normalizedDest = destinationUrl || null;
    if (normalizedDest && !/^https?:\/\//i.test(normalizedDest)) {
        normalizedDest = "https://" + normalizedDest;
    }

    await db.collection("trackingLinks").add({
        uid,
        token,
        label: label || "Tracking Link",
        trackingUrl,
        destinationUrl: normalizedDest,
        clicks: 0,
        captures: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        active: true,
    });

    await userRef.update({
        credits: admin.firestore.FieldValue.increment(-1),
        totalLinksGenerated: admin.firestore.FieldValue.increment(1),
    });

    return { token, trackingUrl };
}

export async function recordCapture(token, deviceData) {
    const linksRef = db.collection("trackingLinks");
    const snap = await linksRef.where("token", "==", token).get();
    if (snap.empty) return { found: false, destinationUrl: null };
    const linkDoc = snap.docs[0];
    const linkData = linkDoc.data();
    await linksRef.doc(linkDoc.id).update({
        clicks: admin.firestore.FieldValue.increment(1),
        captures: admin.firestore.FieldValue.arrayUnion({
            ...deviceData,
            capturedAt: new Date().toISOString(),
        }),
    });
    return { found: true, destinationUrl: linkData.destinationUrl || null };
}

export async function addCredits(uid, amount) {
    await db.collection("users").doc(uid).update({
        credits: admin.firestore.FieldValue.increment(amount),
    });
}

// -- PIXEL TRACKING ------------------------------------------------------------
// Single clean version — correct URL /api/links/pixel/

export async function createPixel(uid, label) {
    const token = generateToken();
    const pixelUrl = `${BACKEND_URL}/api/links/pixel/${token}.gif`;

    await db.collection("pixelLinks").add({
        uid,
        token,
        label: label || "Pixel Tracker",
        pixelUrl,
        totalOpens: 0,
        uniqueIPs: [],
        hits: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { token, pixelUrl };
}

export async function recordPixelHit(token, hitData) {
    const ref = db.collection("pixelLinks");
    const snap = await ref.where("token", "==", token).get();
    if (snap.empty) return false;

    const docRef = ref.doc(snap.docs[0].id);
    const existing = snap.docs[0].data();
    const uniqueIPs = existing.uniqueIPs || [];
    const isRepeatOpen = uniqueIPs.includes(hitData.ip);
    const isForwarded = !isRepeatOpen && uniqueIPs.length > 0;

    await docRef.update({
        totalOpens: admin.firestore.FieldValue.increment(1),
        uniqueIPs: isRepeatOpen ?
            uniqueIPs : admin.firestore.FieldValue.arrayUnion(hitData.ip),
        hits: admin.firestore.FieldValue.arrayUnion({
            ...hitData,
            isRepeatOpen,
            isForwarded,
            openedAt: new Date().toISOString(),
        }),
    });
    return true;
}
