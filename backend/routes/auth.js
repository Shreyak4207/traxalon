import express from "express";
import bcrypt from "bcryptjs";
import {
  saveOtp,
  getOtp,
  deleteOtp,
  incrementAttempts,
  MAX_ATTEMPTS,
} from "../utils/otpStore.js";
import { sendOtpEmail } from "../utils/brevoService.js";

const router = express.Router();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── POST /api/auth/send-otp ───────────────────────────────────
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;       // ← only declared ONCE now
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await sendOtpEmail(email, otp);   // ← uses email, not userEmail
    saveOtp(email, hashedOtp);

    console.log(`[OTP] Sent to ${email}`);
    return res.status(200).json({ success: true, message: "OTP sent to your email." });

  } catch (err) {
    console.error("[POST /send-otp]", err.message);
    if (err.message.includes("BREVO_API_KEY") || err.message.includes("BREVO_SENDER_EMAIL")) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const entry = getOtp(email);
    if (!entry) {
      return res.status(400).json({ error: "OTP expired or not found. Please request a new one." });
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      deleteOtp(email);
      return res.status(429).json({ error: "Too many incorrect attempts. Please request a new OTP." });
    }

    const isMatch = await bcrypt.compare(String(otp).trim(), entry.hashedOtp);
    if (!isMatch) {
      const attempts = incrementAttempts(email);
      const remaining = MAX_ATTEMPTS - attempts;
      return res.status(400).json({
        error: remaining > 0
          ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
          : "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    deleteOtp(email);
    console.log(`[OTP] Verified for ${email}`);
    return res.status(200).json({ success: true, message: "Email verified successfully." });

  } catch (err) {
    console.error("[POST /verify-otp]", err.message);
    return res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

export default router;