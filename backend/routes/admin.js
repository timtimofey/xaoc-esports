import { getUsers, findUserByUsername, updateUser } from "../store.js";
import { requireUser } from "../services/auth.js";

export default function setupAdminRoutes(app) {

  app.post("/api/admin/grant", (req, res) => {
    const { password, username } = req.body;
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) return res.status(403).json({ error: "Доступ запрещён" });
    const user = findUserByUsername(username);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    updateUser(user.id, { role: "admin" });
    res.json({ ok: true, message: `Админ доступ выдан ${username}` });
  });

  app.post("/api/admin/revoke", (req, res) => {
    const { password, username } = req.body;
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) return res.status(403).json({ error: "Доступ запрещён" });
    const user = findUserByUsername(username);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    updateUser(user.id, { role: "user" });
    res.json({ ok: true, message: `Админ доступ отозван у ${username}` });
  });

  app.get("/api/admin/users", requireUser, (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещён" });
    res.json(getUsers().map((u) => ({
      id: u.id, username: u.username, email: u.email, role: u.role || "user",
      pubgNickname: u.pubgNickname, emailVerified: u.emailVerified,
    })));
  });

  app.get("/api/bot/updates", async (_req, res) => {
    const { tgApiCall } = await import("../services/telegram.js");
    res.json(await tgApiCall("getUpdates", {}));
  });

}
