import crypto from "crypto";
import { getToken, findUserById } from "../store.js";

export function hashPassword(pw) {
  return crypto.createHash("sha256").update(pw + "xaoc-salt-2026").digest("hex");
}

export function genToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function requireUser(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }
  const userId = getToken(auth.slice(7));
  if (!userId) {
    return res.status(401).json({ error: "Недействительный токен" });
  }
  const user = findUserById(userId);
  if (!user) {
    return res.status(401).json({ error: "Пользователь не найден" });
  }
  req.user = user;
  next();
}
