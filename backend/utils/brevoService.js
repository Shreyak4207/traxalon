import axios from "axios";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Send a 6-digit OTP email to the given address.
 * @param {string} toEmail
 * @param {string} otp
 */
export async function sendOtpEmail(toEmail, otp) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || "Traxelon";

    if (!apiKey || apiKey === "your_brevo_api_key_here") {
        throw new Error("BREVO_API_KEY is not configured in backend .env");
    }

    const htmlContent = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0d1117;color:#e6edf3;border-radius:12px;overflow:hidden;">
      <div style="background:#00d4ff22;border-bottom:1px solid #00d4ff44;padding:24px 32px;text-align:center;">
        <h1 style="margin:0;font-size:22px;letter-spacing:4px;color:#e6edf3;">T R A X E L O N</h1>
        <p style="margin:4px 0 0;font-size:12px;color:#00d4ff;letter-spacing:2px;">SECURE VERIFICATION</p>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 8px;color:#8b949e;font-size:14px;">Your one-time verification code is:</p>
        <div style="background:#161b22;border:1px solid #00d4ff55;border-radius:8px;padding:20px;text-align:center;margin:16px 0;">
          <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#00d4ff;font-family:monospace;">${otp}</span>
        </div>
        <p style="color:#8b949e;font-size:13px;margin:16px 0 0;">
          ⏱ This code expires in <strong style="color:#e6edf3;">5 minutes</strong>.<br>
          🔒 Do not share this code with anyone.
        </p>
      </div>
      <div style="background:#161b22;padding:16px 32px;text-align:center;">
        <p style="margin:0;color:#484f58;font-size:11px;">If you did not request this, ignore this email.</p>
      </div>
    </div>
  `;

    try {
        await axios.post(
            BREVO_API_URL, {
                sender: { name: senderName, email: senderEmail },
                to: [{ email: toEmail }],
                subject: `${otp} — Your Traxelon verification code`,
                htmlContent,
            }, {
                headers: {
                    "api-key": apiKey,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                timeout: 10_000,
            }
        );
        console.log(`[Brevo] OTP email sent to ${toEmail}`);
    } catch (err) {
        const status = err.response?.status;
        const brevoMsg = err.response?.data?.message || err.message;
        console.error(`[Brevo] HTTP ${status}:`, brevoMsg, JSON.stringify(err.response?.data || {}));
        throw new Error(`Brevo error (${status}): ${brevoMsg}`);
    }
}