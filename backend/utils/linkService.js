import { db } from "../firebase/config.js";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL || "https://traxalon-main-01.vercel.app";

const BACKEND_URL_PIXEL = process.env.BACKEND_URL || "https://traxalon.onrender.com";

export async function createPixel(uid, label) {
    try {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let token = "";
        for (let i = 0; i < 16; i++) token += chars[Math.floor(Math.random() * chars.length)];
        const pixelUrl = `${BACKEND_URL_PIXEL}/api/links/pixel/${token}.gif`;
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
    } catch (err) {
        console.error("[createPixel]", err.message);
        throw err;
    }
}

export async function recordPixelHit(token, hitData) {
    try {
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
            uniqueIPs: isRepeatOpen ? uniqueIPs : admin.firestore.FieldValue.arrayUnion(hitData.ip),
            hits: admin.firestore.FieldValue.arrayUnion({
                ...hitData,
                isRepeatOpen,
                isForwarded,
                openedAt: new Date().toISOString(),
            }),
        });
        return true;
    } catch (err) {
        console.error("[recordPixelHit]", err.message);
        return false;
    }
}
