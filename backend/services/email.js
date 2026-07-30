import { createTransport } from "nodemailer";

const transporter = process.env.SMTP_HOST && process.env.SMTP_USER
  ? createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== "false",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export function emailBody(code) {
  return {
    text: `XAOC Esports — код подтверждения: ${code}\n\nВведите этот код, чтобы подтвердить email.\nЕсли вы не регистрировались, проигнорируйте это письмо.`,
    html: `<div style="font-family:Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff;border-radius:8px">
<h2 style="color:#111;margin:0 0 4px;font-size:20px">XAOC Esports</h2>
<p style="color:#555;font-size:14px;margin:0 0 16px">Код подтверждения email</p>
<div style="background:#f5f5f5;border-radius:6px;padding:20px;text-align:center;margin:0 0 16px">
<span style="font-size:32px;font-weight:700;letter-spacing:6px;color:#222">${code}</span>
</div>
<p style="color:#888;font-size:12px;margin:0">Код действует 60 минут</p>
</div>`,
  };
}

export async function sendEmail(to, subject, code) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({ from: `"XAOC Esports" <${process.env.SMTP_FROM || "noreply@xaoc-esports.com"}>`, to, subject, ...emailBody(code) });
      console.log(`Email sent to ${to}: ${subject} (id=${info.messageId}, accepted=${info.accepted?.length}, rejected=${info.rejected?.length})`);
      if (info.rejected?.length) console.error("Email REJECTED by SMTP:", info.rejected);
      return true;
    } catch (e) {
      console.error("Email send error:", e.message);
      if (e.code === "EAUTH") console.error("SMTP AUTH FAILED — check SMTP_PASS");
      return false;
    }
  }
  console.log(`Email NOT sent (no transporter): ${to} ${subject}`);
  return false;
}
