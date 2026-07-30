import { Server } from "socket.io";
import { getTeams, getMatchResults } from "./store.js";
import { aggregateTournamentStandings } from "./scoringEngine.js";

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);
    socket.emit("standings_update", aggregateTournamentStandings(getTeams(), getMatchResults()));
    socket.emit("maps_update", buildMapsData());
    socket.on("disconnect", () => console.log(`Client disconnected: ${socket.id}`));
  });

  return io;
}

export function getIO() {
  return io;
}

export function getAvailableMaps() {
  return Array.from(new Set(getMatchResults().map((m) => m.map)));
}

function buildMapsData() {
  const matchResults = getMatchResults();
  return getAvailableMaps().map((name) => {
    const mapMatches = matchResults.filter((m) => m.map === name);
    const avgKills = mapMatches.length > 0 ? (mapMatches.reduce((s, m) => s + m.kills, 0) / mapMatches.length).toFixed(1) : "0";
    const teamsPlayed = new Set(mapMatches.map((m) => m.teamId)).size;
    return { name, matches: mapMatches.length, avgKills: Number(avgKills), teamsPlayed };
  });
}

export function broadcastStandings() {
  const standings = aggregateTournamentStandings(getTeams(), getMatchResults());
  io.emit("standings_update", standings);
  io.emit("maps_update", buildMapsData());
  return standings;
}
