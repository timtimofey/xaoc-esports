import { getTeams, getMatchResults, findTeam, insertTeam, updateTeam, deleteTeam, deleteMatchesByTeam, insertMatchResult } from "../store.js";
import { requireUser } from "../services/auth.js";
import { broadcastStandings, getAvailableMaps } from "../socket.js";
import { aggregateTournamentStandings } from "../scoringEngine.js";

export default function setupGameRoutes(app) {

  app.get("/api/standings", (req, res) => {
    res.json(aggregateTournamentStandings(getTeams(), getMatchResults(), req.query.map || null));
  });

  app.get("/api/maps", (_req, res) => {
    const matchResults = getMatchResults();
    res.json(getAvailableMaps().map((name) => {
      const mapMatches = matchResults.filter((m) => m.map === name);
      const avgKills = mapMatches.length > 0 ? (mapMatches.reduce((s, m) => s + m.kills, 0) / mapMatches.length).toFixed(1) : "0";
      return { name, matches: mapMatches.length, avgKills: Number(avgKills), teamsPlayed: new Set(mapMatches.map((m) => m.teamId)).size };
    }));
  });

  app.get("/api/teams", (_req, res) => res.json(getTeams()));

  app.post("/api/teams", requireUser, (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещён" });
    const { name, tag, players } = req.body;
    if (!name || !tag) return res.status(400).json({ error: "name and tag are required" });
    const newTeam = insertTeam({ name, tag, players });
    broadcastStandings();
    res.status(201).json(newTeam);
  });

  app.patch("/api/teams/:id", requireUser, (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещён" });
    const updated = updateTeam(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Team not found" });
    broadcastStandings();
    res.json(updated);
  });

  app.delete("/api/teams/:id", requireUser, (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещён" });
    const team = findTeam(req.params.id);
    if (!team) return res.status(404).json({ error: "Team not found" });
    deleteMatchesByTeam(req.params.id);
    deleteTeam(req.params.id);
    broadcastStandings();
    res.json({ message: "Team deleted" });
  });

  app.post("/api/matches", requireUser, (req, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Доступ запрещён" });
    const { map, results } = req.body;
    if (!map || !results || !Array.isArray(results)) return res.status(400).json({ error: "map and results array are required" });
    for (const entry of results) {
      if (!entry.teamId || entry.placement == null || entry.kills == null) return res.status(400).json({ error: "each result entry needs teamId, placement, kills" });
      insertMatchResult({ teamId: entry.teamId, placement: entry.placement, kills: entry.kills, map });
    }
    broadcastStandings();
    res.status(201).json({ message: "Match saved" });
  });

}
