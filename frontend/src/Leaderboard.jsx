import { useEffect, useState } from "react";
import { Trophy, Flame, ChevronDown, ChevronUp, Map, Shield, Users, RefreshCw } from "lucide-react";
import io from "socket.io-client";
import SpotlightCard from "./components/reactbits/SpotlightCard";

export default function Leaderboard() {
  const [standings, setStandings] = useState([]);
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState("all");
  const [loading, setLoading] = useState(true);
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  const fetchStandings = (mapFilter = "all") => {
    setLoading(true);
    const url = mapFilter === "all" ? "/api/standings" : `/api/standings?map=${encodeURIComponent(mapFilter)}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStandings(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  const fetchMaps = () => {
    fetch("/api/maps")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMaps(data))
      .catch((e) => console.error(e));
  };

  useEffect(() => {
    fetchStandings(selectedMap);
    fetchMaps();

    const socket = io({
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
    });
    socket.on("connect_error", (err) => {
      console.warn("Socket connection warning:", err?.message || err);
    });
    socket.on("standings_update", (updatedData) => {
      if (selectedMap === "all" && Array.isArray(updatedData)) {
        setStandings(updatedData);
      } else {
        fetchStandings(selectedMap);
      }
    });

    return () => socket.disconnect();
  }, [selectedMap]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-display uppercase tracking-wider flex items-center gap-3">
            <Trophy className="text-amber-400" />
            <span>Турнирная Таблица</span>
          </h2>
          <p className="text-xs font-mono text-gray-400 mt-1">
            Рейтинг команд по регламенту PUBG SUPER (1 фраг = 1 очко)
          </p>
        </div>

        {/* Map Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedMap("all")}
            className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedMap === "all"
                ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : "bg-[#0e1628]/80 text-gray-400 border border-white/10 hover:text-white"
            }`}
          >
            Все Карты
          </button>
          {maps.map((m) => (
            <button
              key={m.name}
              onClick={() => setSelectedMap(m.name)}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedMap === m.name
                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "bg-[#0e1628]/80 text-gray-400 border border-white/10 hover:text-white"
              }`}
            >
              {m.name} ({m.matches})
            </button>
          ))}
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {!loading && standings.length >= 3 && selectedMap === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* #2 Rank */}
          <SpotlightCard
            spotlightColor="rgba(148, 163, 184, 0.2)"
            borderColor="rgba(148, 163, 184, 0.3)"
            className="p-6 text-center md:order-1 order-2 flex flex-col justify-between"
          >
            <div>
              <span className="inline-block px-3 py-1 rounded-lg bg-slate-500/20 text-slate-300 font-mono text-xs font-bold uppercase tracking-wider border border-slate-500/30 mb-3">
                #2 Серебро
              </span>
              <h3 className="text-xl font-black text-white font-display mb-1">
                [{standings[1].tag}] {standings[1].name}
              </h3>
              <div className="flex items-center justify-center gap-3 text-xs font-mono text-gray-400 my-3">
                <span>Убийств: <strong className="text-amber-400">{standings[1].kills}</strong></span>
                <span>Места: <strong className="text-cyan-400">{standings[1].placePoints}</strong></span>
              </div>
            </div>
            <div className="pt-3 border-t border-white/10 text-2xl font-black font-mono text-slate-200">
              {standings[1].totalPoints} <span className="text-xs font-normal text-gray-400">PTS</span>
            </div>
          </SpotlightCard>

          {/* #1 Rank (Gold Center) */}
          <SpotlightCard
            spotlightColor="rgba(245, 158, 11, 0.3)"
            borderColor="rgba(245, 158, 11, 0.5)"
            className="p-6 text-center md:order-2 order-1 flex flex-col justify-between bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
          >
            <div>
              <span className="inline-block px-4 py-1 rounded-lg bg-amber-500 text-black font-mono text-xs font-black uppercase tracking-wider mb-3 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                #1 Золотой Чемпион
              </span>
              <h3 className="text-2xl font-black text-amber-300 font-display mb-1">
                [{standings[0].tag}] {standings[0].name}
              </h3>
              <div className="flex items-center justify-center gap-3 text-xs font-mono text-gray-300 my-3">
                <span>Убийств: <strong className="text-amber-400">{standings[0].kills}</strong></span>
                <span>Места: <strong className="text-cyan-400">{standings[0].placePoints}</strong></span>
              </div>
            </div>
            <div className="pt-3 border-t border-amber-500/30 text-3xl font-black font-mono text-amber-400">
              {standings[0].totalPoints} <span className="text-xs font-normal text-gray-400">PTS</span>
            </div>
          </SpotlightCard>

          {/* #3 Rank */}
          <SpotlightCard
            spotlightColor="rgba(217, 119, 6, 0.2)"
            borderColor="rgba(217, 119, 6, 0.3)"
            className="p-6 text-center order-3 flex flex-col justify-between"
          >
            <div>
              <span className="inline-block px-3 py-1 rounded-lg bg-amber-700/20 text-amber-500 font-mono text-xs font-bold uppercase tracking-wider border border-amber-700/30 mb-3">
                #3 Бронза
              </span>
              <h3 className="text-xl font-black text-white font-display mb-1">
                [{standings[2].tag}] {standings[2].name}
              </h3>
              <div className="flex items-center justify-center gap-3 text-xs font-mono text-gray-400 my-3">
                <span>Убийств: <strong className="text-amber-400">{standings[2].kills}</strong></span>
                <span>Места: <strong className="text-cyan-400">{standings[2].placePoints}</strong></span>
              </div>
            </div>
            <div className="pt-3 border-t border-white/10 text-2xl font-black font-mono text-amber-500">
              {standings[2].totalPoints} <span className="text-xs font-normal text-gray-400">PTS</span>
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* FULL LEADERBOARD TABLE */}
      <SpotlightCard className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-amber-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            <span>ОБНОВЛЕНИЕ ТАБЛИЦЫ ЛИДЕРОВ...</span>
          </div>
        ) : standings.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-gray-500">
            Нет данных по выбранной карте
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 w-16 text-center">Место</th>
                  <th className="py-3.5 px-4">Команда</th>
                  <th className="py-3.5 px-4 text-center">Матчей</th>
                  <th className="py-3.5 px-4 text-center">Киллы</th>
                  <th className="py-3.5 px-4 text-center">За Места</th>
                  <th className="py-3.5 px-4 text-right">Всего Очков</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {standings.map((team, index) => {
                  const isExpanded = expandedTeamId === team.id;

                  return (
                    <tr
                      key={team.id}
                      onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                      className="hover:bg-amber-500/5 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs ${
                            index === 0
                              ? "bg-amber-500 text-black font-black"
                              : index === 1
                              ? "bg-slate-300 text-black font-black"
                              : index === 2
                              ? "bg-amber-700 text-white font-black"
                              : "text-gray-400 bg-white/5"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-400">[{team.tag}]</span>
                          <span className="font-bold text-white group-hover:text-amber-300 transition-colors">
                            {team.name}
                          </span>
                          {team.players && team.players.length > 0 && (
                            <span className="text-gray-500 text-[10px]">
                              ({team.players.length} сост.)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center text-gray-300">
                        {team.matchesCount || 0}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-amber-400">
                        {team.kills}
                      </td>

                      <td className="py-3.5 px-4 text-center text-cyan-400">
                        {team.placePoints}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-sm text-emerald-400">
                        {team.totalPoints}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SpotlightCard>
    </div>
  );
}
