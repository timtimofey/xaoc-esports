import { findUserByUsername, getTournaments } from "../store.js";
import {
  findPlayer, findPlayerWithMatchIds, rateLimitedCall, getCachedSeasons, fetchPubgMatch,
  computeTelemetryStats, computeRankedStats, computeStats
} from "../services/pubg.js";
import { getIO } from "../socket.js";

export default function setupPlayerRoutes(app) {

  app.get("/api/player/:username", async (req, res) => {
    const user = findUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: "Игрок не найден" });

    const userTeamRegs = [];
    for (const t of getTournaments()) {
      for (const r of [...(t.registeredTeams || []), ...(t.pendingTeams || [])]) {
        if (r.userId === user.id) {
          userTeamRegs.push({ tournamentName: t.name, teamName: r.teamName, tag: r.tag, status: t.registeredTeams?.some((rt) => rt.id === r.id) ? "accepted" : "pending", registeredAt: r.registeredAt });
        }
      }
    }

    let pubgStats = null;
    let pubgError = null;

    if (process.env.PUBG_API_KEYS || process.env.PUBG_API_KEY) {
      try {
        const player = await findPlayer(user.pubgNickname);
        if (player) {
          const pid = player.id;
          const seasons = await getCachedSeasons();

          let seasonId = req.query.season;
          if (!seasonId) {
            const current = seasons.find((s) => s.attributes?.isCurrentSeason);
            seasonId = current?.id;
          }

          if (seasonId) {
            const seasonData = await rateLimitedCall(`/players/${pid}/seasons/${seasonId}`);
            if (seasonData?.data?.attributes) {
              const rawStats = seasonData.data.attributes.gameModeStats || {};
              const modeKeys = ["solo", "duo", "squad", "solo-fpp", "duo-fpp", "squad-fpp"];

              pubgStats = {
                seasons: seasons.map((s) => ({
                  id: s.id,
                  isCurrent: !!s.attributes?.isCurrentSeason,
                  isOffseason: !!s.attributes?.isOffseason,
                  name: s.id.match(/pc-(\d{4})-(\d+)/)
                    ? `${s.id.match(/pc-(\d{4})-(\d+)/)[1]} S${s.id.match(/pc-(\d{4})-(\d+)/)[2]}`
                    : s.id,
                })),
                selectedSeason: seasonId,
                player: { id: pid, name: player.attributes?.name },
                modes: {},
                rankedModes: {},
              };

              for (const key of modeKeys) {
                if (rawStats[key]) pubgStats.modes[key] = computeStats(rawStats[key]);
              }

              const rankedData = await rateLimitedCall(`/players/${pid}/seasons/${seasonId}/ranked`);
              const rawRanked = rankedData?.data?.attributes?.rankedGameModeStats || {};
              for (const key of Object.keys(rawRanked)) {
                if (rawRanked[key]) pubgStats.rankedModes[key] = computeRankedStats(rawRanked[key]);
              }
            }
          }
        }
      } catch (e) {
        pubgError = e.message;
      }
    }

    res.json({
      user: { id: user.id, username: user.username, pubgNickname: user.pubgNickname, emailVerified: !!user.emailVerified, createdAt: user.createdAt },
      tournaments: userTeamRegs,
      pubgStats,
      pubgApiConfigured: !!(process.env.PUBG_API_KEYS || process.env.PUBG_API_KEY),
      pubgError,
    });
  });

  app.get("/api/player/:username/telemetry", async (req, res) => {
    const user = findUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: "Игрок не найден" });
    if (!(process.env.PUBG_API_KEYS || process.env.PUBG_API_KEY)) return res.status(400).json({ error: "PUBG API не настроен" });

    try {
      const found = await findPlayerWithMatchIds(user.pubgNickname);
      if (!found) return res.status(404).json({ error: "PUBG игрок не найден" });

      const pid = found.player.id;
      const matchIds = found.matchIds;
      if (matchIds.length === 0) return res.json({ telemetry: { gamesAnalyzed: 0, totalKills: 0, matches: [] }, lifetimeTelemetry: { gamesAnalyzed: 0, totalKills: 0, matches: [] }, totalMatchesAnalyzed: 0 });

      const batch = matchIds.slice(0, 20);
      const io = getIO();
      const emitMatch = (match) => {
        const p = match.participants?.find((p) => p.playerId === pid);
        if (!p) return;
        io.emit("telemetry_match", {
          username: req.params.username,
          match: {
            id: match.matchId, map: match.mapName, mode: match.gameMode,
            duration: match.duration, matchType: match.matchType,
            createdAt: match.createdAt, kills: p.kills, assists: p.assists,
            damageDealt: p.damageDealt, placement: p.winPlace,
            killPlace: p.killPlace, headshotKills: p.headshotKills,
            dBNOs: p.DBNOs, timeSurvived: p.timeSurvived,
            deathType: p.deathType, longestKill: p.longestKill,
            revives: p.revives, walkDistance: p.walkDistance,
            rideDistance: p.rideDistance,
          },
        });
      };

      const results = await Promise.all(
        batch.map(async (id) => {
          const match = await fetchPubgMatch(id);
          if (match) emitMatch(match);
          return match;
        })
      );
      const matches = results.filter(Boolean);

      const telemetry = computeTelemetryStats(matches, pid);

      res.json({
        player: { id: pid, name: found.player.attributes?.name },
        telemetry,
        lifetimeTelemetry: { gamesAnalyzed: 0, totalKills: 0, matches: [] },
        totalMatchesAnalyzed: telemetry.gamesAnalyzed,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/pubg/search/:nickname", async (req, res) => {
    const hasKeys = !!(process.env.PUBG_API_KEYS || process.env.PUBG_API_KEY);
    const nickname = req.params.nickname;

    if (!hasKeys) {
      return res.status(404).json({ error: "Официальный PUBG API не настроен на сервере (отсутствует API ключ)" });
    }

    try {
      const player = await findPlayer(nickname);
      if (player) {
        const pid = player.id;
        const seasons = await getCachedSeasons();

        let seasonId = req.query.season;
        if (!seasonId) {
          const current = seasons.find((s) => s.attributes?.isCurrentSeason);
          seasonId = current?.id;
        }

        let pubgStats = null;
        if (seasonId) {
          const seasonData = await rateLimitedCall(`/players/${pid}/seasons/${seasonId}`);
          if (seasonData?.data?.attributes) {
            const rawStats = seasonData.data.attributes.gameModeStats || {};
            const modeKeys = ["solo", "duo", "squad", "solo-fpp", "duo-fpp", "squad-fpp"];

            pubgStats = {
              seasons: seasons.map((s) => ({
                id: s.id,
                isCurrent: !!s.attributes?.isCurrentSeason,
                isOffseason: !!s.attributes?.isOffseason,
                name: s.id.match(/pc-(\d{4})-(\d+)/)
                  ? `${s.id.match(/pc-(\d{4})-(\d+)/)[1]} S${s.id.match(/pc-(\d{4})-(\d+)/)[2]}`
                  : s.id,
              })),
              selectedSeason: seasonId,
              player: { id: pid, name: player.attributes?.name },
              modes: {},
              rankedModes: {},
            };

            for (const key of modeKeys) {
              if (rawStats[key]) pubgStats.modes[key] = computeStats(rawStats[key]);
            }

            const rankedData = await rateLimitedCall(`/players/${pid}/seasons/${seasonId}/ranked`);
            const rawRanked = rankedData?.data?.attributes?.rankedGameModeStats || {};
            for (const key of Object.keys(rawRanked)) {
              if (rawRanked[key]) pubgStats.rankedModes[key] = computeRankedStats(rawRanked[key]);
            }
          }
        }

        if (pubgStats) {
          return res.json({ pubgStats, pubgApiConfigured: true });
        }
      }
      return res.status(404).json({ error: `Игрок PUBG с никнеймом "${nickname}" не найден на официальных серверах PC` });
    } catch (e) {
      console.error("PUBG API error:", e.message);
      return res.status(500).json({ error: `Ошибка обращения к PUBG API: ${e.message}` });
    }
  });

  app.get("/api/pubg/search/:nickname/telemetry", async (req, res) => {
    const hasKeys = !!(process.env.PUBG_API_KEYS || process.env.PUBG_API_KEY);
    const nickname = req.params.nickname;

    if (!hasKeys) {
      return res.status(404).json({ error: "Официальный PUBG API не настроен на сервере" });
    }

    try {
      const found = await findPlayerWithMatchIds(nickname);
      if (found) {
        const pid = found.player.id;
        const matchIds = found.matchIds;
        if (matchIds.length > 0) {
          const batch = matchIds.slice(0, 20);
          const results = await Promise.all(
            batch.map(async (id) => {
              const match = await fetchPubgMatch(id);
              return match;
            })
          );
          const matches = results.filter(Boolean);
          const telemetry = computeTelemetryStats(matches, pid);
          return res.json({
            player: { id: pid, name: found.player.attributes?.name },
            telemetry,
            totalMatchesAnalyzed: telemetry.gamesAnalyzed,
          });
        }
      }
      return res.status(404).json({ error: `Матчи и телеметрия для игрока "${nickname}" не найдены` });
    } catch (e) {
      console.error("PUBG Telemetry error:", e.message);
      return res.status(500).json({ error: `Ошибка загрузки телеметрии: ${e.message}` });
    }
  });

}
