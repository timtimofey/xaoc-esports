import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_FILE = path.join(__dirname, "data.json");
const USERS_FILE = path.join(__dirname, "users.json");
const TOKENS_FILE = path.join(__dirname, "tokens.json");

let state = {
  teams: [],
  matchResults: [],
  tournaments: [],
  users: [],
  tokens: {}, // token -> userId
  matchCache: {}, // matchId -> data
  pendingRegs: {}, // tempToken -> data
  userChatIds: {}, // username -> chatId
};

const defaultTeams = [
  { id: "1", name: "Natus Vincere", tag: "NAVI", players: ["s1mple", "b1t", "w0nderful", "iM", "jL"] },
  { id: "2", name: "Twisted Minds", tag: "TWIS", players: ["spyrro", "batulinS", "Lu", "xmpl", "Perfect1ks"] },
  { id: "3", name: "Soniqs", tag: "SQ", players: ["TGLTN", "Shrimzy", "hwinn", "M1ME", "Sharpshot"] },
  { id: "4", name: "FaZe Clan", tag: "FAZE", players: ["Gustav", "Aitzy", "Fexx", "Saturn", "jeemzz"] },
  { id: "5", name: "17 Gaming", tag: "17G", players: ["Lilghost", "Xbei", "SuJiu", "xiaowai", "PaoPao"] },
  { id: "6", name: "Petrichor Road", tag: "PERO", players: ["Aixleft", "Myl", "Cui71", "Summer", "Loong"] },
];

const defaultMatches = [
  { id: 1, teamId: "1", kills: 8, placement: 2, map: "Erangel" },
  { id: 2, teamId: "2", kills: 12, placement: 1, map: "Erangel" },
  { id: 3, teamId: "3", kills: 5, placement: 4, map: "Erangel" },
  { id: 4, teamId: "4", kills: 3, placement: 7, map: "Erangel" },
  { id: 5, teamId: "5", kills: 6, placement: 3, map: "Erangel" },
  { id: 6, teamId: "6", kills: 2, placement: 9, map: "Erangel" },
  { id: 7, teamId: "1", kills: 6, placement: 3, map: "Miramar" },
  { id: 8, teamId: "2", kills: 4, placement: 5, map: "Miramar" },
  { id: 9, teamId: "3", kills: 9, placement: 2, map: "Miramar" },
  { id: 10, teamId: "4", kills: 7, placement: 1, map: "Miramar" },
  { id: 11, teamId: "5", kills: 3, placement: 8, map: "Miramar" },
  { id: 12, teamId: "6", kills: 5, placement: 4, map: "Miramar" },
];

const defaultTournaments = [
  {
    id: "tourney-1",
    name: "XAOC PUBG Pro Series #1",
    description: "Еженедельный профессиональный турнир по PUBG Squads.",
    date: "2026-08-15",
    maxTeams: 16,
    mapPool: ["Erangel", "Miramar", "Taego"],
    status: "upcoming",
    registeredTeams: [
      { id: "reg-1", teamId: "1", userId: "u1", teamName: "Natus Vincere", tag: "NAVI", players: ["s1mple", "b1t", "w0nderful", "iM", "jL"], contact: "@navi_pubg", registeredAt: new Date().toISOString() },
      { id: "reg-2", teamId: "2", userId: "u2", teamName: "Twisted Minds", tag: "TWIS", players: ["spyrro", "batulinS", "Lu", "xmpl", "Perfect1ks"], contact: "@twis_pubg", registeredAt: new Date().toISOString() }
    ],
    pendingTeams: [],
    createdAt: new Date().toISOString()
  }
];

function readJSON(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

export function initStore() {
  const data = readJSON(DATA_FILE, null);
  if (data && Array.isArray(data.teams) && data.teams.length > 0) {
    state.teams = data.teams;
    state.matchResults = data.matchResults || [];
    state.tournaments = data.tournaments || [];
  } else {
    state.teams = [...defaultTeams];
    state.matchResults = [...defaultMatches];
    state.tournaments = [...defaultTournaments];
    saveData();
  }

  state.users = readJSON(USERS_FILE, []);
  state.tokens = readJSON(TOKENS_FILE, {});
}

export function saveData() {
  writeJSON(DATA_FILE, {
    teams: state.teams,
    matchResults: state.matchResults,
    tournaments: state.tournaments,
    matchCache: state.matchCache,
    pendingRegs: state.pendingRegs,
    userChatIds: state.userChatIds,
  });
}

export function saveUsers() {
  writeJSON(USERS_FILE, state.users);
}

export function saveTokens() {
  writeJSON(TOKENS_FILE, state.tokens);
}

export function saveMatchCache() {
  saveData();
}

// ─── Teams ────────────────────────────────────────────────

export function getTeams() {
  return [...state.teams];
}

export function findTeam(id) {
  return state.teams.find((t) => t.id === String(id)) || null;
}

export function insertTeam({ name, tag, players }) {
  const id = String(Date.now());
  const newTeam = { id, name, tag: tag.toUpperCase(), players: players || [] };
  state.teams.push(newTeam);
  saveData();
  return newTeam;
}

export function updateTeam(id, fields) {
  const team = findTeam(id);
  if (!team) return null;
  if (fields.name !== undefined) team.name = fields.name;
  if (fields.tag !== undefined) team.tag = fields.tag.toUpperCase();
  if (fields.players !== undefined) team.players = fields.players;
  saveData();
  return team;
}

export function deleteTeam(id) {
  state.teams = state.teams.filter((t) => t.id !== String(id));
  deleteMatchesByTeam(id);
  saveData();
}

// ─── Match Results ────────────────────────────────────────

export function getMatchResults() {
  return [...state.matchResults];
}

export function insertMatchResult({ teamId, kills, placement, map }) {
  const newMatch = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    teamId: String(teamId),
    kills: Number(kills) || 0,
    placement: Number(placement) || 0,
    map: map || "Erangel",
  };
  state.matchResults.push(newMatch);
  saveData();
  return newMatch;
}

export function deleteMatchesByTeam(teamId) {
  state.matchResults = state.matchResults.filter((m) => String(m.teamId) !== String(teamId));
  saveData();
}

// ─── Tournaments ──────────────────────────────────────────

export function getTournaments() {
  return [...state.tournaments];
}

export function findTournament(id) {
  return state.tournaments.find((t) => t.id === String(id)) || null;
}

export function insertTournament({ name, description, date, maxTeams, mapPool }) {
  const id = String(Date.now());
  const newTournament = {
    id,
    name,
    description: description || "",
    date,
    maxTeams: maxTeams || 16,
    mapPool: mapPool || [],
    status: "upcoming",
    registeredTeams: [],
    pendingTeams: [],
    createdAt: new Date().toISOString(),
  };
  state.tournaments.unshift(newTournament);
  saveData();
  return newTournament;
}

export function updateTournament(id, fields) {
  const t = findTournament(id);
  if (!t) return null;
  if (fields.name !== undefined) t.name = fields.name;
  if (fields.description !== undefined) t.description = fields.description;
  if (fields.date !== undefined) t.date = fields.date;
  if (fields.maxTeams !== undefined) t.maxTeams = fields.maxTeams;
  if (fields.mapPool !== undefined) t.mapPool = fields.mapPool;
  if (fields.status !== undefined) t.status = fields.status;
  saveData();
  return t;
}

export function deleteTournament(id) {
  state.tournaments = state.tournaments.filter((t) => t.id !== String(id));
  saveData();
}

// ─── Tournament Registrations ─────────────────────────────

export function addPendingRegistration(tournamentId, { userId, teamName, tag, players, contact }) {
  const t = findTournament(tournamentId);
  if (!t) return null;
  if (!t.pendingTeams) t.pendingTeams = [];
  const id = String(Date.now());
  const reg = {
    id,
    userId,
    teamName: teamName.trim(),
    tag: tag.toUpperCase(),
    players: players || [],
    contact: contact || "",
    registeredAt: new Date().toISOString(),
  };
  t.pendingTeams.push(reg);
  saveData();
  return reg;
}

export function approveRegistration(tournamentId, pendingId) {
  const t = findTournament(tournamentId);
  if (!t || !t.pendingTeams) return null;
  const idx = t.pendingTeams.findIndex((p) => p.id === String(pendingId));
  if (idx === -1) return null;
  const reg = t.pendingTeams.splice(idx, 1)[0];

  const teamId = String(Date.now());
  const newTeam = insertTeam({ name: reg.teamName, tag: reg.tag, players: reg.players });

  if (!t.registeredTeams) t.registeredTeams = [];
  const registeredObj = { ...reg, teamId: newTeam.id };
  t.registeredTeams.push(registeredObj);
  saveData();

  return {
    id: newTeam.id,
    name: newTeam.name,
    tag: newTeam.tag,
    players: newTeam.players,
    registration: registeredObj,
  };
}

export function rejectRegistration(tournamentId, pendingId) {
  const t = findTournament(tournamentId);
  if (!t || !t.pendingTeams) return null;
  const idx = t.pendingTeams.findIndex((p) => p.id === String(pendingId));
  if (idx === -1) return null;
  const reg = t.pendingTeams.splice(idx, 1)[0];
  saveData();
  return reg;
}

export function deleteRegistration(tournamentId, registrationId) {
  const t = findTournament(tournamentId);
  if (!t || !t.registeredTeams) return;
  t.registeredTeams = t.registeredTeams.filter((r) => r.id !== String(registrationId));
  saveData();
}

// ─── Users ────────────────────────────────────────────────

export function getUsers() {
  return [...state.users];
}

export function findUserById(id) {
  return state.users.find((u) => u.id === String(id)) || null;
}

export function findUserByUsername(username) {
  if (!username) return null;
  return state.users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export function findUserByEmail(email) {
  if (!email) return null;
  return state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function findUserByLogin(login) {
  if (!login) return null;
  const lower = login.toLowerCase();
  return state.users.find((u) => u.username.toLowerCase() === lower || u.email.toLowerCase() === lower) || null;
}

export function insertUser(user) {
  const userObj = {
    id: user.id || String(Date.now()),
    username: user.username,
    email: user.email,
    googleId: user.googleId || null,
    picture: user.picture || null,
    passwordHash: user.passwordHash || user.password_hash || "",
    pubgNickname: user.pubgNickname || user.pubg_nickname || "",
    role: user.role || "user",
    emailVerified: Boolean(user.emailVerified),
    verificationCode: user.verificationCode || user.verification_code || null,
    createdAt: user.createdAt || user.created_at || new Date().toISOString(),
  };
  state.users.push(userObj);
  saveUsers();
  return userObj;
}

export function updateUser(id, fields) {
  const user = findUserById(id);
  if (!user) return null;
  if (fields.role !== undefined) user.role = fields.role;
  if (fields.emailVerified !== undefined) user.emailVerified = Boolean(fields.emailVerified);
  if (fields.verificationCode !== undefined) user.verificationCode = fields.verificationCode;
  if (fields.passwordHash !== undefined) user.passwordHash = fields.passwordHash;
  if (fields.password_hash !== undefined) user.passwordHash = fields.password_hash;
  if (fields.pubgNickname !== undefined) user.pubgNickname = fields.pubgNickname;
  if (fields.pubg_nickname !== undefined) user.pubgNickname = fields.pubg_nickname;
  if (fields.picture !== undefined) user.picture = fields.picture;
  if (fields.googleId !== undefined) user.googleId = fields.googleId;
  saveUsers();
  return user;
}

// ─── Tokens ───────────────────────────────────────────────

export function getToken(token) {
  return state.tokens[token];
}

export function setToken(token, userId) {
  state.tokens[token] = String(userId);
  saveTokens();
}

// ─── Match Cache ──────────────────────────────────────────

export function getMatchCache(matchId) {
  return state.matchCache[matchId];
}

export function setMatchCache(matchId, data) {
  state.matchCache[matchId] = data;
  saveData();
}

export function getMatchCacheCount() {
  return Object.keys(state.matchCache).length;
}

// ─── Pending Registrations (email verify) ─────────────────

export function getPendingReg(tempToken) {
  return state.pendingRegs[tempToken];
}

export function setPendingReg(tempToken, data) {
  state.pendingRegs[tempToken] = data;
  saveData();
}

export function deletePendingReg(tempToken) {
  delete state.pendingRegs[tempToken];
  saveData();
}

// ─── User Chat IDs (Telegram) ─────────────────────────────

export function getUserChatId(username) {
  if (!username) return undefined;
  return state.userChatIds[username.toLowerCase()];
}

export function setUserChatId(username, chatId) {
  if (!username) return;
  state.userChatIds[username.toLowerCase()] = String(chatId);
  saveData();
}

export function getAllUserChatIds() {
  return { ...state.userChatIds };
}
