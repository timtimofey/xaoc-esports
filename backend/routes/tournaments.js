import { getTournaments, findTournament, insertTournament, updateTournament, deleteTournament, addPendingRegistration, approveRegistration, rejectRegistration, deleteRegistration, getUserChatId } from "../store.js";
import { requireUser } from "../services/auth.js";
import { tgApiCall, sendTelegramNotification, INVITE_LINK } from "../services/telegram.js";
import { getIO, broadcastStandings } from "../socket.js";

export default function setupTournamentRoutes(app) {

  app.get("/api/tournaments", (_req, res) => res.json(getTournaments()));

  app.get("/api/tournaments/:id", (req, res) => {
    const t = findTournament(req.params.id);
    if (!t) return res.status(404).json({ error: "Tournament not found" });
    res.json(t);
  });

  app.post("/api/tournaments", requireUser, (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещён" });
    const { name, description, date, maxTeams, mapPool } = req.body;
    if (!name || !date) return res.status(400).json({ error: "name and date are required" });
    const tournament = insertTournament({ name, description, date, maxTeams, mapPool });
    getIO().emit("tournaments_update", getTournaments());
    res.status(201).json(tournament);
  });

  app.patch("/api/tournaments/:id", requireUser, (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещён" });
    const t = updateTournament(req.params.id, req.body);
    if (!t) return res.status(404).json({ error: "Tournament not found" });
    getIO().emit("tournaments_update", getTournaments());
    res.json(t);
  });

  app.delete("/api/tournaments/:id", requireUser, (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещён" });
    const t = findTournament(req.params.id);
    if (!t) return res.status(404).json({ error: "Tournament not found" });
    deleteTournament(req.params.id);
    getIO().emit("tournaments_update", getTournaments());
    res.json({ message: "Tournament deleted" });
  });

  app.post("/api/tournaments/:id/register", requireUser, async (req, res) => {
    if (!req.user.emailVerified) {
      return res.status(403).json({ error: "Подтвердите email перед регистрацией на турнир" });
    }
    const t = findTournament(req.params.id);
    if (!t) return res.status(404).json({ error: "Tournament not found" });
    if (t.status !== "upcoming") return res.status(400).json({ error: "Tournament is not accepting registrations" });
    const { teamName, tag, players, contact } = req.body;
    if (!teamName || !tag) return res.status(400).json({ error: "teamName and tag are required" });
    if (t.registeredTeams.length + t.pendingTeams.length >= t.maxTeams) return res.status(400).json({ error: "Tournament is full" });
    const tagUpper = tag.toUpperCase();
    if ([...t.registeredTeams, ...t.pendingTeams].some((r) => r.tag === tagUpper)) {
      return res.status(400).json({ error: "Team with this tag is already registered or pending" });
    }
    const registration = addPendingRegistration(req.params.id, {
      userId: req.user.id,
      teamName: teamName.trim(),
      tag: tagUpper,
      players: players || [],
      contact: contact || "",
    });
    getIO().emit("tournaments_update", getTournaments());

    if (contact) {
      const username = contact.replace("@", "").toLowerCase();
      const chatId = getUserChatId(username);
      if (chatId) {
        tgApiCall("sendMessage", {
          chat_id: chatId,
          text: `👋 <b>${teamName}</b>, ваша заявка на турнир <b>${t.name}</b> отправлена!\n\nВступите в группу, чтобы следить за результатами отбора:\n${INVITE_LINK}`,
          parse_mode: "HTML",
        });
      }
    }
    res.status(201).json({ ...registration, inviteLink: INVITE_LINK });
  });

  app.delete("/api/tournaments/:tournamentId/register/:registrationId", requireUser, (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещён" });
    const t = findTournament(req.params.tournamentId);
    if (!t) return res.status(404).json({ error: "Tournament not found" });
    const reg = t.registeredTeams.find((r) => r.id === req.params.registrationId);
    if (!reg) return res.status(404).json({ error: "Registration not found" });
    deleteRegistration(req.params.tournamentId, req.params.registrationId);
    getIO().emit("tournaments_update", getTournaments());
    res.json({ message: "Registration deleted" });
  });

  app.post("/api/tournaments/:tournamentId/approve/:pendingId", requireUser, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещён" });
    const t = findTournament(req.params.tournamentId);
    if (!t) return res.status(404).json({ error: "Tournament not found" });
    const pending = t.pendingTeams.find((r) => r.id === req.params.pendingId);
    if (!pending) return res.status(404).json({ error: "Pending registration not found" });
    const result = approveRegistration(req.params.tournamentId, req.params.pendingId);
    if (!result) return res.status(404).json({ error: "Pending registration not found" });
    broadcastStandings();
    getIO().emit("tournaments_update", getTournaments());
    await sendTelegramNotification(result.name, result.tag, t.name, true, "");
    res.json({ message: "Team approved", team: result });
  });

  app.delete("/api/tournaments/:tournamentId/reject/:pendingId", requireUser, async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещён" });
    const t = findTournament(req.params.tournamentId);
    if (!t) return res.status(404).json({ error: "Tournament not found" });
    const pending = t.pendingTeams.find((r) => r.id === req.params.pendingId);
    if (!pending) return res.status(404).json({ error: "Pending registration not found" });
    const removed = rejectRegistration(req.params.tournamentId, req.params.pendingId);
    if (!removed) return res.status(404).json({ error: "Pending registration not found" });
    await sendTelegramNotification(removed.teamName, removed.tag, t.name, false, req.body?.reason || "");
    getIO().emit("tournaments_update", getTournaments());
    res.json({ message: "Registration rejected" });
  });

}
