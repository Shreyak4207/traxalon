// import axios from "axios";

// const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// /**
//  * Send a 6-digit OTP email to the given address.
//  * @param {string} toEmail
//  * @param {string} otp
//  */
// export async function sendOtpEmail(toEmail, otp) {
//     const apiKey = process.env.BREVO_API_KEY;
//     const senderEmail = process.env.BREVO_SENDER_EMAIL;
//     const senderName = process.env.BREVO_SENDER_NAME || "Traxelon";

//     if (!apiKey || apiKey === "your_brevo_api_key_here") {
//         throw new Error("BREVO_API_KEY is not configured in backend .env");
//     }

//     const htmlContent = `
//     <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#0d1117;color:#e6edf3;border-radius:12px;overflow:hidden;">
//       <div style="background:#00d4ff22;border-bottom:1px solid #00d4ff44;padding:24px 32px;text-align:center;">
//         <h1 style="margin:0;font-size:22px;letter-spacing:4px;color:#e6edf3;">T R A X E L O N</h1>
//         <p style="margin:4px 0 0;font-size:12px;color:#00d4ff;letter-spacing:2px;">SECURE VERIFICATION</p>
//       </div>
//       <div style="padding:32px;">
//         <p style="margin:0 0 8px;color:#8b949e;font-size:14px;">Your one-time verification code is:</p>
//         <div style="background:#161b22;border:1px solid #00d4ff55;border-radius:8px;padding:20px;text-align:center;margin:16px 0;">
//           <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#00d4ff;font-family:monospace;">${otp}</span>
//         </div>
//         <p style="color:#8b949e;font-size:13px;margin:16px 0 0;">
//           ⏱ This code expires in <strong style="color:#e6edf3;">5 minutes</strong>.<br>
//           🔒 Do not share this code with anyone.
//         </p>
//       </div>
//       <div style="background:#161b22;padding:16px 32px;text-align:center;">
//         <p style="margin:0;color:#484f58;font-size:11px;">If you did not request this, ignore this email.</p>
//       </div>
//     </div>
//   `;

//     try {
//         await axios.post(
//             BREVO_API_URL, {
//                 sender: { name: senderName, email: senderEmail },
//                 to: [{ email: toEmail }],
//                 subject: `${otp} — Your Traxelon verification code`,
//                 htmlContent,
//             }, {
//                 headers: {
//                     "api-key": apiKey,
//                     "Content-Type": "application/json",
//                     Accept: "application/json",
//                 },
//                 timeout: 10_000,
//             }
//         );
//         console.log(`[Brevo] OTP email sent to ${toEmail}`);
//     } catch (err) {
//         const status = err.response?.status;
//         const brevoMsg = err.response?.data?.message || err.message;
//         console.error(`[Brevo] HTTP ${status}:`, brevoMsg, JSON.stringify(err.response?.data || {}));
//         throw new Error(`Brevo error (${status}): ${brevoMsg}`);
//     }
// }


import axios from "axios";

export async function sendOtpEmail(email, otp) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Traxelon";

  if (!apiKey) throw new Error("BREVO_API_KEY is not configured in backend .env");
  if (!senderEmail) throw new Error("BREVO_SENDER_EMAIL is not configured in backend .env");

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background-color:#050810;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#050810;min-height:100vh;padding:50px 16px;">
    <tr>
      <td align="center" valign="top">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

          <tr>
            <td align="center" style="padding-bottom:40px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right:10px;">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L3 7V12C3 16.55 6.84 20.74 12 22C17.16 20.74 21 16.55 21 12V7L12 2Z" fill="rgba(0,229,255,0.1)" stroke="#00e5ff" stroke-width="1.5"/>
                      <path d="M9 12L11 14L15 10" stroke="#00e5ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td valign="middle">
                    <span style="font-size:22px;font-weight:900;letter-spacing:5px;color:#ffffff;">TRAX<span style="color:#00e5ff;">ELON</span></span>
                  </td>
                </tr>
              </table>
              <p style="margin:8px 0 0;font-size:10px;letter-spacing:3px;color:#1e3a5f;text-transform:uppercase;">Law Enforcement Intelligence Tool</p>
            </td>
          </tr>

          <tr>
            <td style="background:linear-gradient(145deg,#0a1628 0%,#0d1f3c 100%);border:1px solid #112244;border-radius:20px;overflow:hidden;">

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:3px;background:linear-gradient(90deg,#0033ff,#00e5ff,#0033ff);font-size:0;">&nbsp;</td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:48px 48px 36px;background:linear-gradient(180deg,#0d1f3c 0%,#0a1628 100%);">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                      <tr>
                        <td align="center" style="width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,rgba(0,229,255,0.12) 0%,rgba(0,229,255,0.02) 70%);border:1px solid rgba(0,229,255,0.2);text-align:center;vertical-align:middle;">
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="3" fill="#00e5ff"/>
                            <path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="#00e5ff" stroke-width="1.5" stroke-linecap="round"/>
                            <circle cx="12" cy="12" r="7" stroke="#00e5ff" stroke-width="1" stroke-dasharray="2 3" opacity="0.4"/>
                          </svg>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin:0 0 12px;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:3px;text-transform:uppercase;text-align:center;">IDENTITY VERIFICATION</h1>
                    <h2 style="margin:0 0 16px;font-size:13px;font-weight:400;color:#4a7aaa;letter-spacing:2px;text-transform:uppercase;text-align:center;">Two-Factor Authentication</h2>
                    <p style="margin:0;font-size:14px;color:#6a8aaa;line-height:1.8;text-align:center;max-width:380px;">A secure sign-in attempt was detected for your account. Enter the code below to confirm your identity.</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:0 48px;"><table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="border-top:1px solid #112244;font-size:0;">&nbsp;</td></tr>
                </table></td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:36px 48px;">
                    <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:#2a4a7a;letter-spacing:4px;text-transform:uppercase;">── YOUR SECURE CODE ──</p>
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:16px auto;background:linear-gradient(135deg,#050d1a,#0a1628);border:1px solid #00e5ff22;border-radius:16px;">
                      <tr>
                        <td align="center" style="padding:28px 48px;">
                          <span style="font-size:52px;font-weight:900;color:#00e5ff;letter-spacing:16px;font-family:'Courier New',monospace;text-shadow:0 0 20px rgba(0,229,255,0.4);">
                            ${otp}
                          </span>
                        </td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:12px auto 0;">
                      <tr>
                        <td style="background:#051020;border:1px solid #112244;border-radius:20px;padding:6px 18px;">
                          <span style="font-size:12px;color:#4a7aaa;letter-spacing:1px;">⏱&nbsp; Expires in <strong style="color:#00e5ff;">10 minutes</strong></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:0 48px;"><table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr><td style="border-top:1px solid #112244;font-size:0;">&nbsp;</td></tr>
                </table></td></tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:28px 48px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" style="padding-right:12px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="background:#050d1a;border:1px solid #112244;border-radius:10px;padding:14px 16px;">
                                <p style="margin:0 0 4px;font-size:10px;color:#2a4a6a;text-transform:uppercase;letter-spacing:2px;">Account</p>
                                <p style="margin:0;font-size:12px;color:#8aaedd;word-break:break-all;">${email}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" style="padding-left:12px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="background:#050d1a;border:1px solid #112244;border-radius:10px;padding:14px 16px;">
                                <p style="margin:0 0 4px;font-size:10px;color:#2a4a6a;text-transform:uppercase;letter-spacing:2px;">Status</p>
                                <p style="margin:0;font-size:12px;">
                                  <span style="display:inline-block;width:6px;height:6px;background:#00e5ff;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>
                                  <span style="color:#00e5ff;">Pending Verification</span>
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 48px 36px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background:#0a0510;border:1px solid #ff444420;border-left:3px solid #ff4444;border-radius:8px;padding:14px 18px;">
                          <p style="margin:0;font-size:12px;color:#cc5555;line-height:1.7;">
                            <strong style="color:#ff6666;">⚠ Warning:</strong>
                            Never share this code. Traxelon will <strong>never</strong> ask for your OTP. If you didn't request this, ignore this email immediately.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#030810;border-top:1px solid #0a1428;padding:20px 48px;border-radius:0 0 20px 20px;">
                    <p style="margin:0;font-size:11px;color:#1e3a5a;line-height:1.8;text-align:center;">
                      Automated security message from <strong style="color:#2a5a8a;">Traxelon Intelligence Platform</strong>
                      &nbsp;·&nbsp; Do not reply &nbsp;·&nbsp;
                      <a href="mailto:support@traxelon.gov.in" style="color:#00e5ff;text-decoration:none;">support@traxelon.gov.in</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0 0 4px;font-size:10px;color:#1a2a40;letter-spacing:3px;text-transform:uppercase;">Cyber Crime Bureau · Confidential</p>
              <p style="margin:0;font-size:10px;color:#111e30;">© 2025 Traxelon. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await axios.post("https://api.brevo.com/v3/transactionalEmails/send", {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: email }],
      subject: `${otp} — Your Traxelon verification code`,
      htmlContent: htmlContent,
    }, {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
    });
    console.log(`[Brevo] OTP email sent to ${email}`);
  } catch (err) {
    const status = err.response?.status;
    const brevoMsg = err.response?.data?.message || err.message;
    console.error(`[Brevo] HTTP ${status}:`, brevoMsg, JSON.stringify(err.response?.data || {}));
    throw new Error(`Brevo error (${status}): ${brevoMsg}`);
  }
}