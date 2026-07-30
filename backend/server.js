import express from "express";
import { createServer } from "http";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  const envFile = path.join(__dirname, ".env");
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
} catch {}

import { initDB } from "./db.js";
import { initSocket } from "./socket.js";
import setupAuthRoutes from "./routes/auth.js";
import setupTournamentRoutes from "./routes/tournaments.js";
import setupGameRoutes from "./routes/game.js";
import setupAdminRoutes from "./routes/admin.js";
import setupPlayerRoutes from "./routes/player.js";

initDB();

const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
const FRONTEND_DIST = path.join(FRONTEND_DIR, "dist");

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
initSocket(httpServer);

// API routes FIRST
setupAuthRoutes(app);
setupTournamentRoutes(app);
setupGameRoutes(app);
setupAdminRoutes(app);
setupPlayerRoutes(app);

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    configFile: path.join(FRONTEND_DIR, "vite.config.js"),
    root: FRONTEND_DIR,
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(FRONTEND_DIST, {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    },
  }));

  app.get("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
}

const PORT = process.env.PORT || 3000;
const server = httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`XAOC Esports server running on http://0.0.0.0:${PORT}`);
  console.log(`SMTP: ${process.env.SMTP_HOST ? "configured (" + process.env.SMTP_HOST + ")" : "NOT configured"}`);
});

process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
process.on("SIGINT", () => {
  server.close(() => process.exit(0));
});
