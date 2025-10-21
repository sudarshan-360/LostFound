import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASS || "";
const EMAIL_FROM =
  process.env.EMAIL_FROM || (SMTP_USER ? `LOST & FOUND <${SMTP_USER}>` : "");
const LOG_PREFIX = "[Email]";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  // Validate SMTP configuration
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn(
      `${LOG_PREFIX} SMTP credentials not configured. Email notifications will fail.`
    );
  }

  console.log(
    `${LOG_PREFIX} Initializing transporter: ${SMTP_HOST}:${SMTP_PORT}`
  );

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for 587
    auth:
      SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
}

export type MatchEmailPayload = {
  to: string;
  lostTitle: string;
  foundTitle: string;
  lostId: string;
  foundId: string;
  score: number;
  threshold: number;
  lostImageUrl?: string;
  foundImageUrl?: string;
};

export async function sendMatchNotification(payload: MatchEmailPayload) {
  const {
    to,
    lostTitle,
    foundTitle,
    lostId,
    foundId,
    score,
    threshold,
    lostImageUrl,
    foundImageUrl,
  } = payload;

  // Validate email address
  if (!to || !to.includes("@")) {
    throw new Error(`Invalid email address: ${to}`);
  }

  // Use a sensible fallback for tests/dev if EMAIL_FROM is not configured
  const fromAddress = EMAIL_FROM || "LOST & FOUND <no-reply@localhost>";

  const scorePercent = (score * 100).toFixed(1);
  const thresholdPercent = (threshold * 100).toFixed(0);
  const viewUrl = `${APP_URL}/items/${foundId}`;
  const lostUrl = `${APP_URL}/items/${lostId}`;

  const subject = `Lost & Found: Potential Match for "${lostTitle}"`;
  const text = `Hello,\n\nGood news! We found a potential match for your item.\n\nPlease check if this looks like yours. If it's not yours, no worries — you can safely ignore this email or browse other matches. We'll keep looking and notify you if we find a closer match.\n\nMatch Details\n----------------\nLost Item: ${lostTitle}\nFound Item: ${foundTitle}\n\nView details: ${viewUrl}\nYour item: ${lostUrl}\n\nSafety Reminder: Always meet in a safe, public location when arranging item exchanges.\n\nThis is an automated notification from the Lost & Found system.`;

  const html = `
    <div style="background:#f7f7fb;padding:24px;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(2,6,23,0.08);">
        <tr>
          <td style="padding:24px 24px 8px;background:linear-gradient(90deg,#0ea5e9,#2563eb);color:#ffffff;">
            <div style="font-size:18px;font-weight:600;letter-spacing:0.2px;">Lost & Found</div>
            <div style="font-size:14px;opacity:0.9;">Potential Match Detected</div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 24px;">
            <div style="font-size:16px;color:#0f172a;">Good news! We found a potential match for your item.</div>
            <div style="margin-top:8px;font-size:14px;color:#334155;">Please check if this looks like yours. If it's not, no worries — just ignore this email or browse other matches. We'll keep looking and notify you if we find a closer match.</div>

            <div style="margin-top:16px;padding:16px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
              <div style="font-size:14px;font-weight:600;color:#0f172a;margin-bottom:12px;">Match Details</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:50%;vertical-align:top;padding-right:8px;">
                    <div style="padding:12px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;">
                      <div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:8px;">Your Lost Item</div>
                      ${
                        lostImageUrl
                          ? `<img src="${lostImageUrl}" alt="Lost Item" style="width:100%;border-radius:8px;margin-bottom:8px;object-fit:cover;max-height:140px;">`
                          : ""
                      }
                      <div style="font-size:14px;color:#0f172a;font-weight:600;">${lostTitle}</div>
                    </div>
                  </td>
                  <td style="width:50%;vertical-align:top;padding-left:8px;">
                    <div style="padding:12px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;">
                      <div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:8px;">Potential Found Item</div>
                      ${
                        foundImageUrl
                          ? `<img src="${foundImageUrl}" alt="Found Item" style="width:100%;border-radius:8px;margin-bottom:8px;object-fit:cover;max-height:140px;">`
                          : ""
                      }
                      <div style="font-size:14px;color:#0f172a;font-weight:600;">${foundTitle}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </div>

            <div style="text-align:center;margin-top:20px;">
              <a href="${viewUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;box-shadow:0 6px 14px rgba(37,99,235,0.3);">Click here to view details</a>
            </div>

            <div style="margin-top:16px;font-size:12px;color:#64748b;text-align:center;">
              Or visit <a href="${APP_URL}" style="color:#2563eb;text-decoration:none;">${APP_URL}</a> and check your matches.
            </div>

            <div style="margin-top:20px;padding:12px;border-left:4px solid #16a34a;background:#f0fdf4;color:#14532d;font-size:13px;border-radius:6px;">
              <strong>Safety Reminder:</strong> Always meet in a safe, public location when arranging item exchanges.
            </div>

            <div style="margin-top:24px;font-size:12px;color:#94a3b8;text-align:center;">This is an automated notification from the Lost & Found system.</div>
          </td>
        </tr>
      </table>
    </div>
  `;

  console.log(
    `${LOG_PREFIX} Sending notification to ${to} (${lostTitle} ↔ ${foundTitle})`
  );

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    console.log(
      `${LOG_PREFIX} Email sent successfully - MessageId: ${info.messageId}`
    );
    return info;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`${LOG_PREFIX} Failed to send email to ${to}: ${errMsg}`);
    throw new Error(`Email delivery failed: ${errMsg}`);
  }
}