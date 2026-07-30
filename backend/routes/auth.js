import { getUsers, findUserByUsername, findUserByEmail, findUserByLogin, findUserById, insertUser, updateUser, getToken, setToken, getPendingReg, setPendingReg, deletePendingReg } from "../store.js";
import { hashPassword, genToken, genCode, requireUser } from "../services/auth.js";
import { sendEmail } from "../services/email.js";
import { validatePubgNickname } from "../services/pubg.js";

export default function setupAuthRoutes(app) {

  app.post("/api/auth/register", async (req, res) => {
    const { username, email, password, pubgNickname } = req.body;
    if (!username || !password || !pubgNickname) {
      return res.status(400).json({ error: "Заполните все обязательные поля (Логин, PUBG Ник, Пароль)" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Пароль должен быть минимум 6 символов" });
    }
    if (pubgNickname.length < 2 || pubgNickname.length > 20 || !/^[a-zA-Z0-9_\-]+$/.test(pubgNickname)) {
      return res.status(400).json({ error: "Некорректный никнейм PUBG (от 2 до 20 символов)" });
    }
    if (findUserByUsername(username)) {
      return res.status(400).json({ error: "Имя пользователя уже занято" });
    }

    const cleanEmail = email || `${username.toLowerCase().replace(/[^a-z0-9_]/g, "")}@xaoc.pubg`;
    if (email && findUserByEmail(email)) {
      return res.status(400).json({ error: "Email уже зарегистрирован" });
    }

    const user = {
      id: String(Date.now()),
      username,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      pubgNickname,
      role: "user",
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };

    insertUser(user);
    const token = genToken();
    setToken(token, user.id);

    console.log(`[AUTH] Registered user: ${username} (PUBG: ${pubgNickname})`);

    res.status(201).json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        pubgNickname: user.pubgNickname,
        role: "user",
        emailVerified: true,
      },
    });
  });

  app.get("/api/auth/google/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    let redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!redirectUri) {
      const host = req.get("host");
      const protocol = host.includes("localhost") ? "http" : "https";
      redirectUri = `${protocol}://${host}/api/auth/google/callback`;
    }

    if (!clientId) {
      return res.json({ configured: false, redirectUri });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
    });
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ configured: true, url, redirectUri });
  });

  const handleGoogleCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("No authorization code provided");
    }

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      let redirectUri = process.env.GOOGLE_REDIRECT_URI;
      if (!redirectUri) {
        const host = req.get("host");
        const protocol = host.includes("localhost") ? "http" : "https";
        redirectUri = `${protocol}://${host}/api/auth/google/callback`;
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenRes.json();
      if (!tokens.access_token) {
        throw new Error(tokens.error_description || tokens.error || "Не удалось получить токен Google");
      }

      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileRes.json();

      const targetEmail = profile.email;
      let user = findUserByEmail(targetEmail);
      if (!user && profile.id) {
        user = getUsers().find((u) => u.googleId === profile.id);
      }

      if (!user) {
        const baseName = profile.name ? profile.name.replace(/\s+/g, "_") : targetEmail.split("@")[0];
        let finalUsername = baseName;
        if (findUserByUsername(finalUsername)) {
          finalUsername = `${baseName}_${Math.floor(Math.random() * 1000)}`;
        }

        user = {
          id: String(Date.now()),
          username: finalUsername,
          email: targetEmail,
          googleId: profile.id,
          picture: profile.picture || null,
          pubgNickname: baseName,
          role: "user",
          emailVerified: true,
          createdAt: new Date().toISOString(),
        };
        insertUser(user);
      } else if (profile.picture && !user.picture) {
        updateUser(user.id, { picture: profile.picture });
      }

      const token = genToken();
      setToken(token, user.id);

      const payload = JSON.stringify({
        type: "OAUTH_AUTH_SUCCESS",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          pubgNickname: user.pubgNickname,
          role: user.role || "user",
          picture: user.picture,
          emailVerified: true,
        },
      });

      res.send(`
        <!DOCTYPE html>
        <html>
          <body style="background:#080d19;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h2 style="color:#f59e0b;">Успешно!</h2>
              <p>Вы успешно авторизовались через Google.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage(${payload}, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (err) {
      console.error("[OAUTH_ERROR]", err);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <body style="background:#080d19;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h2 style="color:#ef4444;">Ошибка авторизации</h2>
              <p>${err.message}</p>
            </div>
          </body>
        </html>
      `);
    }
  };

  app.get(["/api/auth/google/callback", "/api/auth/google/callback/"], handleGoogleCallback);

  app.post("/api/auth/google", async (req, res) => {
    const { googleId, email, name, picture, pubgNickname } = req.body;
    const targetEmail = email || `google_${googleId || Date.now()}@gmail.com`;

    let user = findUserByEmail(targetEmail);
    if (!user && googleId) {
      user = getUsers().find((u) => u.googleId === googleId);
    }

    if (!user) {
      // Create new user via Google
      const baseName = name ? name.replace(/\s+/g, "_") : targetEmail.split("@")[0];
      let finalUsername = baseName;
      if (findUserByUsername(finalUsername)) {
        finalUsername = `${baseName}_${Math.floor(Math.random() * 1000)}`;
      }

      const finalPubg = pubgNickname || baseName;

      user = {
        id: String(Date.now()),
        username: finalUsername,
        email: targetEmail,
        googleId: googleId || `google_${Date.now()}`,
        picture: picture || null,
        pubgNickname: finalPubg,
        role: "user",
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      insertUser(user);
      console.log(`[AUTH] Google Sign-Up: ${user.username} (${targetEmail})`);
    } else {
      if (picture && !user.picture) {
        updateUser(user.id, { picture });
      }
      console.log(`[AUTH] Google Sign-In: ${user.username} (${targetEmail})`);
    }

    const token = genToken();
    setToken(token, user.id);

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        pubgNickname: user.pubgNickname,
        role: user.role || "user",
        picture: user.picture,
        emailVerified: true,
      },
    });
  });

  app.post("/api/auth/validate-pubg", async (req, res) => {
    const { pubgNickname } = req.body;
    if (!pubgNickname || pubgNickname.length < 2 || !/^[a-zA-Z0-9_\-]+$/.test(pubgNickname)) {
      return res.status(400).json({ ok: false, error: "Некорректный формат" });
    }
    const exists = await validatePubgNickname(pubgNickname);
    res.json({ ok: exists });
  });

  app.post("/api/auth/verify-email", (req, res) => {
    const { code } = req.body;
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Требуется авторизация" });
    const tempToken = auth.slice(7);
    const pending = getPendingReg(tempToken);
    if (!pending) {
      const userId = getToken(tempToken);
      if (!userId) return res.status(401).json({ error: "Недействительный токен" });
      const user = findUserById(userId);
      if (!user) return res.status(401).json({ error: "Пользователь не найден" });
      if (user.emailVerified) return res.json({ ok: true, message: "Email уже подтверждён" });
      if (user.verificationCode !== code) return res.status(400).json({ error: "Неверный код подтверждения" });
      updateUser(user.id, { emailVerified: true, verificationCode: undefined });
      return res.json({ ok: true, message: "Email подтверждён" });
    }
    if (pending.verificationCode !== code) return res.status(400).json({ error: "Неверный код подтверждения" });

    const user = {
      id: String(Date.now()),
      username: pending.username,
      email: pending.email,
      passwordHash: pending.passwordHash,
      pubgNickname: pending.pubgNickname,
      role: "user",
      emailVerified: true,
      createdAt: new Date().toISOString(),
    };
    insertUser(user);
    deletePendingReg(tempToken);
    const token = genToken();
    setToken(token, user.id);
    res.json({ ok: true, token, user: { id: user.id, username: user.username, email: user.email, pubgNickname: user.pubgNickname, role: "user", emailVerified: true }, message: "Email подтверждён" });
  });

  app.post("/api/auth/login", (req, res) => {
    const { login, password } = req.body;
    if (!password) return res.status(400).json({ error: "Введите пароль" });

    if (!login && process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
      return res.json({ ok: true, role: "admin" });
    }
    if (!login) return res.status(400).json({ error: "Введите логин или email" });
    const user = findUserByLogin(login);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ ok: false, error: "Неверный логин или пароль" });
    }
    const token = genToken();
    setToken(token, user.id);
    res.json({ ok: true, token, user: { id: user.id, username: user.username, email: user.email, pubgNickname: user.pubgNickname, role: user.role || "user", emailVerified: !!user.emailVerified } });
  });

  app.get("/api/auth/me", requireUser, (req, res) => {
    res.json({ id: req.user.id, username: req.user.username, email: req.user.email, pubgNickname: req.user.pubgNickname, role: req.user.role || "user", picture: req.user.picture, emailVerified: !!req.user.emailVerified });
  });

  app.post("/api/auth/update-pubg", requireUser, (req, res) => {
    const { pubgNickname } = req.body;
    if (!pubgNickname || pubgNickname.trim().length < 2 || pubgNickname.trim().length > 25) {
      return res.status(400).json({ error: "Некорректный никнейм PUBG (от 2 до 25 символов)" });
    }
    const cleanNick = pubgNickname.trim();
    updateUser(req.user.id, { pubgNickname: cleanNick });
    const updatedUser = findUserById(req.user.id);
    res.json({
      ok: true,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        pubgNickname: updatedUser.pubgNickname,
        role: updatedUser.role || "user",
        picture: updatedUser.picture,
        emailVerified: true,
      },
    });
  });

  app.post("/api/auth/verify-resend", async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Требуется авторизация" });
    const tempToken = auth.slice(7);
    const pending = getPendingReg(tempToken);
    if (!pending) {
      const userId = getToken(tempToken);
      if (!userId) return res.status(401).json({ error: "Недействительный токен" });
      const user = findUserById(userId);
      if (!user) return res.status(401).json({ error: "Пользователь не найден" });
      if (user.emailVerified) return res.json({ ok: true, message: "Email уже подтверждён" });
      const code = genCode();
      updateUser(user.id, { verificationCode: code });
      const sent = await sendEmail(user.email, "Новый код подтверждения — XAOC Esports", code);
      console.log(`[VERIFY] User ${user.username} new code: ${code}`);
      return res.json({ ok: true, emailSent: sent, verificationCode: code, message: "Код отправлен" });
    }
    const code = genCode();
    pending.verificationCode = code;
    setPendingReg(tempToken, pending);
    const sent = await sendEmail(pending.email, "Новый код подтверждения — XAOC Esports", code);
    console.log(`[VERIFY] Pending ${pending.username} new code: ${code}`);
    res.json({ ok: true, emailSent: sent, verificationCode: code, message: "Код отправлен" });
  });

}
