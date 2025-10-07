import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

function getBaseUrl() {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (env) return env;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function sendVerificationEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  // 🔐 环境变量校验
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] Missing RESEND_API_KEY env");
    throw new Error("MAIL_CONFIG_INVALID");
  }

  if (!process.env.MAIL_FROM) {
    console.error("[email] Missing MAIL_FROM env");
    throw new Error("MAIL_CONFIG_INVALID");
  }

  const from = process.env.MAIL_FROM; // ✅ 使用 MAIL_FROM

  const verifyUrl = `${getBaseUrl()}/verify?token=${encodeURIComponent(token)}`;

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: "Bitte bestätige deine E-Mail-Adresse",
    html: `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;line-height:1.6">
        <h2>Willkommen bei Job Tracker</h2>
        <p>Bitte bestätige deine E-Mail-Adresse, indem du auf den folgenden Link klickst:</p>
        <p>
          <a href="${verifyUrl}" 
             style="display:inline-block;padding:10px 14px;border-radius:8px;background:#4F46E5;color:#fff;text-decoration:none">
             E-Mail bestätigen
          </a>
        </p>
        <p>Der Link ist 24 Stunden gültig.</p>
        <p style="color:#6b7280;font-size:12px">
          Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br/>${verifyUrl}
        </p>
      </div>
    `,
    text: `Bitte bestätige deine E-Mail-Adresse: ${verifyUrl} (gültig für 24 Stunden)`,
    tags: [{ name: "category", value: "email_verification" }],
    headers: { "X-Entity-Ref-ID": token.substring(0, 16) },
  });

  if (error) {
    console.error("[email] Resend error:", JSON.stringify(error, null, 2));
    if (process.env.NODE_ENV !== "production") {
      throw new Error(
        `RESEND_ERROR: ${error.name || ""} ${error.message || ""}`
      );
    }
    throw new Error("MAIL_SEND_FAILED");
  }

  console.log("[email] Resend queued:", data);
  return data;
}
