// lib/mailer.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const MAIL_FROM = process.env.MAIL_FROM || "no-reply@job-tracker.com";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function sendVerifyEmail(email: string, token: string) {
  const url = `${APP_URL}/auth/verify?token=${encodeURIComponent(token)}`;
  await resend.emails.send({
    from: MAIL_FROM,
    to: email,
    subject: "Bitte bestätige deine E-Mail",
    html: `<p>Klicke zur Bestätigung:</p><p><a href="${url}">${url}</a></p>`,
  });
}
