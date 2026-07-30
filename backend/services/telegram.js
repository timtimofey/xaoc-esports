import https from "https";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const INVITE_LINK = process.env.TELEGRAM_INVITE_LINK || "";

export { TELEGRAM_CHAT_ID, INVITE_LINK };

export function tgApiCall(method, payload) {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const opts = {
      hostname: "api.telegram.org",
      path: `/bot${TELEGRAM_BOT_TOKEN}/${method}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    };
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
    });
    req.on("error", () => resolve(null));
    req.write(body);
    req.end();
  });
}

export async function sendTelegramNotification(teamName, tag, tournamentName, accepted, reason) {
  const text = accepted
    ? `<b>Команда прошла отбор!</b>\n\n<b>${teamName}</b> (${tag}) допущена к турниру <b>${tournamentName}</b>`
    : `<b>Команда не прошла отбор</b>\n\n<b>${teamName}</b> (${tag}) не прошла подтверждение на турнире <b>${tournamentName}</b>${reason ? `\n\nПричина: ${reason}` : ""}`;
  if (TELEGRAM_CHAT_ID && TELEGRAM_CHAT_ID !== "0") {
    const r = await tgApiCall("sendMessage", { chat_id: Number(TELEGRAM_CHAT_ID), text, parse_mode: "HTML" });
    console.log("Telegram notification sent:", r?.ok);
  }
}
