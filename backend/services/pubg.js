import https from "https";

const DEFAULT_PLATFORM = "steam";

let cachedSeasons = null;
let cachedSeasonsTime = 0;
const SEASONS_CACHE_TTL = 3600000;

class KeyPool {
  constructor(keys) {
    this.keys = keys;
    this.idx = 0;
  }

  pickKey() {
    return this.keys[this.idx++ % this.keys.length];
  }

  async call(path, platform = DEFAULT_PLATFORM) {
    return callWithKey(path, this.pickKey(), platform);
  }
}

let _pool = null;
let _poolInit = false;

function getPool() {
  if (_poolInit) return _pool;
  _poolInit = true;
  const rawKeys = (process.env.PUBG_API_KEYS || process.env.PUBG_API_KEY || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (rawKeys.length > 0) {
    _pool = new KeyPool(rawKeys);
    console.log(`[PUBG] Initialized with ${rawKeys.length} API key(s)`);
  }
  return _pool;
}

async function callWithKey(path, apiKey, platform = DEFAULT_PLATFORM) {
  if (!apiKey) return null;
  return new Promise((resolve) => {
    const opts = {
      hostname: "api.pubg.com",
      path: `/shards/${platform}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "User-Agent": "XAOC-Esports/1.0",
      },
    };
    const req = https.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch { resolve(null); }
      });
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

export async function callPubgApi(path, platform = DEFAULT_PLATFORM) {
  if (!getPool()) return null;
  return getPool().call(path, platform);
}

export async function rateLimitedCall(path, platform = DEFAULT_PLATFORM) {
  return callPubgApi(path, platform);
}

export async function getCachedSeasons(platform = DEFAULT_PLATFORM) {
  const now = Date.now();
  if (cachedSeasons && (now - cachedSeasonsTime) < SEASONS_CACHE_TTL) {
    return cachedSeasons;
  }
  const resp = await rateLimitedCall("/seasons", platform);
  if (resp?.data) {
    cachedSeasons = resp.data;
    cachedSeasonsTime = now;
  }
  return cachedSeasons || [];
}

function parseMatchResponse(data) {
  const attrs = data.data?.attributes || {};
  const included = data.included || [];

  const rosters = included
    .filter((item) => item.type === "roster")
    .map((r) => ({
      id: r.id,
      rank: r.attributes?.stats?.rank || 0,
      won: r.attributes?.won === "true",
      teamId: r.attributes?.stats?.teamId || 0,
      participantIds: (r.relationships?.participants?.data || []).map((p) => p.id),
    }));

  const participants = included
    .filter((item) => item.type === "participant")
    .map((p) => {
      const s = p.attributes?.stats || {};
      const roster = rosters.find((r) => r.participantIds.includes(p.id));
      return {
        participantId: p.id,
        playerId: s.playerId || "",
        playerName: s.name || "",
        rosterRank: roster?.rank || 0,
        kills: s.kills || 0,
        assists: s.assists || 0,
        damageDealt: Math.round(s.damageDealt || 0),
        winPlace: s.winPlace || 0,
        DBNOs: s.DBNOs || 0,
        headshotKills: s.headshotKills || 0,
        longestKill: Math.round(s.longestKill || 0),
        revives: s.revives || 0,
        timeSurvived: Math.round((s.timeSurvived || 0) / 60),
        deathType: s.deathType || "",
        walkDistance: Math.round((s.walkDistance || 0) / 1000),
        rideDistance: Math.round((s.rideDistance || 0) / 1000),
        killPlace: s.killPlace || 0,
        weapons: s.weaponsAcquired || 0,
        heals: s.heals || 0,
        boosts: s.boosts || 0,
        roadKills: s.roadKills || 0,
        teamKills: s.teamKills || 0,
        vehicleDestroys: s.vehicleDestroys || 0,
        swimDistance: Math.round((s.swimDistance || 0) / 1000),
      };
    });

  const telemetryAsset = included.find(
    (item) => item.type === "asset" && item.attributes?.name === "telemetry"
  );

  return {
    matchId: data.data.id,
    mapName: attrs.mapName || "unknown",
    gameMode: attrs.gameMode || "unknown",
    matchType: attrs.matchType || "",
    duration: attrs.duration || 0,
    isCustom: !!attrs.isCustomMatch,
    seasonState: attrs.seasonState || "",
    shardId: attrs.shardId || "",
    telemetryUrl: telemetryAsset?.attributes?.URL || "",
    createdAt: attrs.createdAt || "",
    participants,
    rosters,
    cachedAt: new Date().toISOString(),
  };
}

export async function fetchPubgMatch(matchId, platform = DEFAULT_PLATFORM) {
  const data = await callPubgApi(`/matches/${matchId}`, platform);
  if (!data || data.errors) return null;
  return parseMatchResponse(data);
}

export async function fetchPlayerMatchTelemetry(accountId, seasonId, onProgress, platform = DEFAULT_PLATFORM) {
  const seasonData = await rateLimitedCall(`/players/${accountId}/seasons/${seasonId}`, platform);
  const rels = seasonData?.data?.relationships;
  if (!rels) return [];

  const allMatchIds = [];
  for (const key of Object.keys(rels)) {
    if (key.startsWith("matches")) {
      for (const m of rels[key].data || []) {
        allMatchIds.push({ id: m.id, mode: key.replace("matches", "").toLowerCase() || "solo" });
      }
    }
  }

  if (allMatchIds.length === 0) return [];

  const results = await Promise.all(
    allMatchIds.map(async (m, i) => {
      const match = await fetchPubgMatch(m.id, platform);
      if (match && onProgress) onProgress(i + 1, allMatchIds.length, match);
      return match;
    })
  );

  return results.filter(Boolean);
}

export function computeTelemetryStats(matches, playerId) {
  const perMatch = [];
  let totalKills = 0, totalDamage = 0, totalPlacement = 0, totalTime = 0;
  let wins = 0, top10s = 0, games = 0;

  for (const match of matches) {
    const p = match.participants?.find((p) => p.playerId === playerId);
    if (!p) continue;

    games++;
    totalKills += p.kills;
    totalDamage += p.damageDealt;
    totalPlacement += p.winPlace;
    totalTime += p.timeSurvived;
    if (p.winPlace === 1) wins++;
    if (p.winPlace <= 10) top10s++;

    perMatch.push({
      id: match.matchId,
      map: match.mapName,
      mode: match.gameMode,
      duration: match.duration,
      matchType: match.matchType,
      createdAt: match.createdAt,
      kills: p.kills,
      assists: p.assists,
      damageDealt: p.damageDealt,
      placement: p.winPlace,
      killPlace: p.killPlace,
      headshotKills: p.headshotKills,
      dBNOs: p.DBNOs,
      timeSurvived: p.timeSurvived,
      deathType: p.deathType,
      longestKill: p.longestKill,
      revives: p.revives,
      walkDistance: p.walkDistance,
      rideDistance: p.rideDistance,
    });
  }

  return {
    gamesAnalyzed: games,
    totalKills,
    totalDamage: Math.round(totalDamage),
    avgPlacement: games > 0 ? (totalPlacement / games).toFixed(1) : "0",
    avgKills: games > 0 ? (totalKills / games).toFixed(2) : "0.00",
    avgDamage: games > 0 ? Math.round(totalDamage / games) : 0,
    avgTimeSurvived: games > 0 ? Math.round(totalTime / games) : 0,
    wins,
    winRate: games > 0 ? ((wins / games) * 100).toFixed(1) : "0.0",
    top10s,
    top10Rate: games > 0 ? ((top10s / games) * 100).toFixed(1) : "0.0",
    kd: games > wins ? (totalKills / (games - wins)).toFixed(2) : totalKills > 0 ? totalKills.toFixed(2) : "0.00",
    matches: perMatch,
  };
}

export function computeRankedStats(raw) {
  if (!raw) return null;
  const kills = raw.kills || 0;
  const deaths = raw.deaths || 0;
  const gamesPlayed = raw.roundsPlayed || 0;
  const wins = raw.wins || 0;
  const top10s = Math.round((raw.top10Ratio || 0) * gamesPlayed);
  const damageDealt = raw.damageDealt || 0;
  return {
    kills,
    deaths,
    assists: raw.assists || 0,
    wins,
    top10s,
    gamesPlayed,
    damageDealt,
    dBNOs: raw.dBNOs || 0,
    currentTier: raw.currentTier?.tier || "",
    currentSubTier: raw.currentTier?.subTier || "",
    currentRankPoint: raw.currentRankPoint || 0,
    bestTier: raw.bestTier?.tier || "",
    bestSubTier: raw.bestTier?.subTier || "",
    bestRankPoint: raw.bestRankPoint || 0,
    avgRank: raw.avgRank || 0,
    avgKill: raw.avgKill || 0,
    kd: deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? kills.toFixed(2) : "0.00",
    winRate: gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : "0.0",
    top10Rate: gamesPlayed > 0 ? ((top10s / gamesPlayed) * 100).toFixed(1) : "0.0",
    avgDamage: gamesPlayed > 0 ? Math.round(damageDealt / gamesPlayed) : 0,
  };
}

export function computeStats(raw) {
  if (!raw) return null;
  const kills = raw.kills || 0;
  const deaths = raw.losses || 0;
  const gamesPlayed = raw.roundsPlayed || 0;
  const wins = raw.wins || 0;
  const top10s = raw.top10s || 0;
  const damageDealt = raw.damageDealt || 0;
  return {
    kills,
    deaths,
    assists: raw.assists || 0,
    wins,
    top10s,
    gamesPlayed,
    damageDealt,
    longestKill: raw.longestKill || 0,
    avgSurvivalTime: raw.timeSurvived && gamesPlayed ? Math.round((raw.timeSurvived / gamesPlayed) / 60) : 0,
    dBNOs: raw.dBNOs || 0,
    headshots: raw.headshotKills || 0,
    revives: raw.revives || 0,
    heals: raw.heals || 0,
    boosts: raw.boosts || 0,
    walkDistance: Math.round((raw.walkDistance || 0) / 1000),
    rideDistance: Math.round((raw.rideDistance || 0) / 1000),
    rankPoints: raw.rankPoints || 0,
    rankPointsTitle: raw.rankPointsTitle || "",
    kd: deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? kills.toFixed(2) : "0.00",
    winRate: gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : "0.0",
    top10Rate: gamesPlayed > 0 ? ((top10s / gamesPlayed) * 100).toFixed(1) : "0.0",
    avgDamage: gamesPlayed > 0 ? Math.round(damageDealt / gamesPlayed) : 0,
  };
}

export async function validatePubgNickname(nickname) {
  if (!getPool()) return false;
  try {
    const result = await callPubgApi(`/players?filter[playerNames]=${encodeURIComponent(nickname)}`);
    return !!result?.data?.[0];
  } catch {
    return false;
  }
}

export async function findPlayer(nickname) {
  if (!getPool()) return null;
  const result = await callPubgApi(`/players?filter[playerNames]=${encodeURIComponent(nickname)}`);
  if (result?.data?.[0]) return result.data[0];
  return null;
}

export async function findPlayerWithMatchIds(nickname) {
  if (!getPool()) return null;
  const result = await callPubgApi(`/players?filter[playerNames]=${encodeURIComponent(nickname)}`);
  if (!result?.data?.[0]) return null;
  const player = result.data[0];
  const matchIds = (player.relationships?.matches?.data || []).map((m) => m.id);
  return { player, matchIds };
}
