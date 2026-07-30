import { useState, useEffect } from "react";
import { Search, Trophy, Crosshair, Shield, Activity, Gamepad2, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Clock, UserCheck } from "lucide-react";
import { useAuth } from "./AuthContext";
import SpotlightCard from "./reactbits/SpotlightCard";

const POPULAR_NICKNAMES = ["BatulinS", "Ubah", "CTYDEHT", "Xmpl", "Aixleft", "Pio"];

export default function PlayerStats({ pubgNickname: propPubgNickname, isProfileMode = false }) {
  const { user } = useAuth();
  const initialNick = propPubgNickname || user?.pubgNickname || "BatulinS";

  const [searchNick, setSearchNick] = useState(initialNick);
  const [activeNick, setActiveNick] = useState(initialNick);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statsData, setStatsData] = useState(null);
  const [telemetryData, setTelemetryData] = useState(null);
  const [activeTab, setActiveTab] = useState("matches"); // "matches" | "overview" | "ranked"
  const [matchFilterMap, setMatchFilterMap] = useState("all");
  const [matchFilterType, setMatchFilterType] = useState("all"); // "all" | "wins" | "top10"
  const [expandedMatchId, setExpandedMatchId] = useState(null);

  const searchPlayer = async (nicknameToSearch) => {
    if (!nicknameToSearch || !nicknameToSearch.trim()) return;
    const cleanNick = nicknameToSearch.trim();
    setActiveNick(cleanNick);
    setLoading(true);
    setError("");
    setStatsData(null);
    setTelemetryData(null);

    try {
      const res = await fetch(`/api/pubg/search/${encodeURIComponent(cleanNick)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Игрок "${cleanNick}" не найден на официальных серверах PUBG PC`);
      setStatsData(data.pubgStats);

      // Fetch telemetry match history (last 20 matches)
      const telRes = await fetch(`/api/pubg/search/${encodeURIComponent(cleanNick)}/telemetry`);
      if (telRes.ok) {
        const telData = await telRes.json();
        setTelemetryData(telData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const target = propPubgNickname || user?.pubgNickname || "BatulinS";
    setSearchNick(target);
    searchPlayer(target);
  }, [propPubgNickname, user?.pubgNickname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchPlayer(searchNick);
  };

  if (isProfileMode && (!user?.pubgNickname || !user.pubgNickname.trim())) {
    return (
      <SpotlightCard className="p-8 text-center max-w-lg mx-auto my-6 border-amber-500/30">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <Gamepad2 size={32} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2 font-display">
          Никнейм PUBG Не Привязан
        </h3>
        <p className="text-xs text-gray-400 font-mono leading-relaxed mb-4">
          Укажите ваш точный игровой никнейм PUBG выше в блоке профиля, чтобы загрузить персональную статистику с официальных серверов PUBG PC.
        </p>
      </SpotlightCard>
    );
  }

  const matches = telemetryData?.telemetry?.matches || [];

  const filteredMatches = matches.filter((m) => {
    if (matchFilterMap !== "all" && m.map?.toLowerCase() !== matchFilterMap.toLowerCase()) {
      return false;
    }
    if (matchFilterType === "wins" && m.placement !== 1) {
      return false;
    }
    if (matchFilterType === "top10" && m.placement > 10) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* HEADER & SEARCH FORM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-display uppercase tracking-wider flex items-center gap-2.5">
            <Activity className="text-amber-400" />
            <span>{isProfileMode ? "Личная Статистика PUBG" : "Статистика Игроков PUBG"}</span>
          </h2>
          <p className="text-xs font-mono text-gray-400 mt-1">
            Поиск игрока по никнейму, детальная статистика и обзор последних 20 матчей с серверов PC
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Никнейм игрока..."
            value={searchNick}
            onChange={(e) => setSearchNick(e.target.value)}
            className="px-4 py-2.5 bg-[#0a101f] text-white rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none font-mono text-xs w-48 sm:w-64"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            <span>Найти</span>
          </button>
        </form>
      </div>

      {/* QUICK SUGGESTIONS / POPULAR PLAYERS */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <span className="text-gray-500 text-[11px] uppercase tracking-wider font-bold mr-1">Популярные:</span>
        {POPULAR_NICKNAMES.map((nick) => (
          <button
            key={nick}
            onClick={() => {
              setSearchNick(nick);
              searchPlayer(nick);
            }}
            className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
              activeNick.toLowerCase() === nick.toLowerCase()
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            {nick}
          </button>
        ))}
        {user?.pubgNickname && (
          <button
            onClick={() => {
              setSearchNick(user.pubgNickname);
              searchPlayer(user.pubgNickname);
            }}
            className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
              activeNick.toLowerCase() === user.pubgNickname.toLowerCase()
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
            }`}
          >
            <UserCheck size={12} />
            <span>Мой Ник: {user.pubgNickname}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="p-12 text-center text-amber-400 font-mono text-xs space-y-3">
          <RefreshCw size={32} className="animate-spin mx-auto text-amber-400" />
          <p className="tracking-widest uppercase font-bold">Загрузка статистики с серверов PUBG PC...</p>
        </div>
      )}

      {statsData && !loading && (
        <div className="space-y-6">
          {/* PLAYER SUMMARY CARD */}
          <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.15)" className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-700/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <Gamepad2 size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-2xl font-black text-white font-display tracking-wider">
                      {statsData.player?.name || effectiveNick}
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">
                      PUBG PC
                    </span>
                  </div>
                  <p className="text-xs font-mono text-gray-400">
                    Аналитика 20 последних матчей и сезонного рейтинга
                  </p>
                </div>
              </div>

              {/* QUICK HIGHLIGHT METRICS (Last 20 Matches) */}
              {telemetryData?.telemetry && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase block mb-1">K/D Ratio</span>
                    <span className="text-lg font-black text-emerald-400">
                      {telemetryData.telemetry.kd || "0.00"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase block mb-1">Победы</span>
                    <span className="text-lg font-black text-amber-400">
                      {telemetryData.telemetry.wins || 0} / 20
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase block mb-1">Ср. Урон</span>
                    <span className="text-lg font-black text-cyan-400">
                      {telemetryData.telemetry.avgDamage || 0}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-gray-400 uppercase block mb-1">Top 10 %</span>
                    <span className="text-lg font-black text-indigo-400">
                      {telemetryData.telemetry.top10Rate || "0%"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* MAIN NAVIGATION TABS */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("matches")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "matches"
                    ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <Crosshair size={14} />
                <span>Последние 20 Матчей ({matches.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "overview"
                    ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <Trophy size={14} />
                <span>Обычный Режим</span>
              </button>

              <button
                onClick={() => setActiveTab("ranked")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "ranked"
                    ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "bg-white/5 text-gray-400 hover:text-white"
                }`}
              >
                <Shield size={14} />
                <span>Ранговый Режим</span>
              </button>
            </div>
          </SpotlightCard>

          {/* TAB 1: LAST 20 MATCHES */}
          {activeTab === "matches" && (
            <div className="space-y-4">
              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a101f] p-3 rounded-2xl border border-white/10 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 uppercase font-bold text-[10px]">Фильтр по результату:</span>
                  <button
                    onClick={() => setMatchFilterType("all")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all ${
                      matchFilterType === "all" ? "bg-amber-500 text-black" : "bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    Все
                  </button>
                  <button
                    onClick={() => setMatchFilterType("wins")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all ${
                      matchFilterType === "wins" ? "bg-emerald-500 text-black" : "bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    Победы (#1)
                  </button>
                  <button
                    onClick={() => setMatchFilterType("top10")}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition-all ${
                      matchFilterType === "top10" ? "bg-indigo-500 text-white" : "bg-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    Топ 10
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400 uppercase font-bold text-[10px]">Карта:</span>
                  <select
                    value={matchFilterMap}
                    onChange={(e) => setMatchFilterMap(e.target.value)}
                    className="py-1 px-3 bg-[#0e1628] text-white rounded-lg border border-white/10 font-mono text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">Все Карты</option>
                    <option value="Erangel">Erangel</option>
                    <option value="Miramar">Miramar</option>
                    <option value="Taego">Taego</option>
                    <option value="Rondo">Rondo</option>
                    <option value="Deston">Deston</option>
                    <option value="Vikendi">Vikendi</option>
                  </select>
                </div>
              </div>

              {/* Matches List */}
              {filteredMatches.length === 0 ? (
                <SpotlightCard className="p-8 text-center text-xs font-mono text-gray-500">
                  Матчи с выбранными фильтрами не найдены.
                </SpotlightCard>
              ) : (
                <div className="space-y-3">
                  {filteredMatches.map((m, idx) => {
                    const isExpanded = expandedMatchId === (m.id || idx);
                    const isWin = m.placement === 1;
                    const isTop10 = m.placement <= 10;

                    return (
                      <SpotlightCard
                        key={m.id || idx}
                        spotlightColor={isWin ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.05)"}
                        borderColor={isWin ? "rgba(245, 158, 11, 0.4)" : "rgba(255, 255, 255, 0.1)"}
                        className={`transition-all ${isWin ? "bg-amber-500/5" : ""}`}
                      >
                        <div
                          onClick={() => setExpandedMatchId(isExpanded ? null : (m.id || idx))}
                          className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer font-mono text-xs"
                        >
                          {/* Placement & Map */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base shadow-md ${
                                isWin
                                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                  : m.placement <= 3
                                  ? "bg-slate-300 text-black"
                                  : isTop10
                                  ? "bg-indigo-600/80 text-white"
                                  : "bg-white/10 text-gray-400"
                              }`}
                            >
                              #{m.placement || "?"}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold text-sm">{m.map || "Battleground"}</span>
                                <span className="text-[10px] text-gray-400 uppercase bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                  {m.mode || "Squad FPP"}
                                </span>
                                {isWin && (
                                  <span className="text-[10px] font-black text-amber-400 uppercase bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                                    Chicken Dinner!
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-500 mt-0.5 block flex items-center gap-1">
                                <Clock size={12} />
                                {m.timeSurvived ? `${m.timeSurvived} мин survival` : "Матч PUBG"}
                              </span>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="flex items-center justify-between md:justify-end gap-6 text-center">
                            <div>
                              <span className="text-gray-500 text-[10px] uppercase block">Убийства</span>
                              <span className="text-amber-400 font-black text-base">{m.kills || 0}</span>
                            </div>

                            <div>
                              <span className="text-gray-500 text-[10px] uppercase block">Ассисты / Ноки</span>
                              <span className="text-gray-200 font-bold text-sm">
                                {m.assists || 0} <span className="text-gray-500">/</span> {m.dBNOs || 0}
                              </span>
                            </div>

                            <div>
                              <span className="text-gray-500 text-[10px] uppercase block">Урон</span>
                              <span className="text-emerald-400 font-black text-base">
                                {Math.round(m.damageDealt || 0)}
                              </span>
                            </div>

                            <button className="text-gray-400 hover:text-white p-1">
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </div>
                        </div>

                        {/* EXPANDED MATCH DETAILS */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-3 border-t border-white/10 bg-black/20 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                            <div className="p-2.5 rounded-lg bg-white/5">
                              <span className="text-gray-500 text-[10px] uppercase block">В голову (Headshots)</span>
                              <span className="text-white font-bold">{m.headshotKills || 0}</span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white/5">
                              <span className="text-gray-500 text-[10px] uppercase block">Дальний Килл</span>
                              <span className="text-cyan-400 font-bold">{m.longestKill || 0} м</span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white/5">
                              <span className="text-gray-500 text-[10px] uppercase block">Поднял Союзников</span>
                              <span className="text-amber-300 font-bold">{m.revives || 0}</span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-white/5">
                              <span className="text-gray-500 text-[10px] uppercase block">Дистанция (Пешком/Транспорт)</span>
                              <span className="text-gray-200 font-bold">
                                {m.walkDistance || 0} км / {m.rideDistance || 0} км
                              </span>
                            </div>
                          </div>
                        )}
                      </SpotlightCard>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OVERVIEW SEASON MODES */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["squad-fpp", "duo-fpp", "solo-fpp"].map((modeKey) => {
                const mode = statsData.modes?.[modeKey];
                if (!mode) return null;

                return (
                  <SpotlightCard key={modeKey} className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                        {modeKey}
                      </span>
                      <Trophy size={16} className="text-amber-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div className="p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-500 block text-[10px] uppercase">K/D Ratio</span>
                        <span className="text-xl font-bold text-emerald-400">{mode.kd || "0.00"}</span>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-500 block text-[10px] uppercase">Победы</span>
                        <span className="text-xl font-bold text-amber-300">{mode.wins || 0}</span>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-500 block text-[10px] uppercase">Ср. Урон</span>
                        <span className="text-sm font-bold text-white">{mode.avgDamage || 0}</span>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-500 block text-[10px] uppercase">Всего Игр</span>
                        <span className="text-sm font-bold text-white">{mode.roundsPlayed || 0}</span>
                      </div>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          )}

          {/* TAB 3: RANKED MODES */}
          {activeTab === "ranked" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(statsData.rankedModes || {}).length === 0 ? (
                <div className="col-span-2 p-8 text-center text-gray-500 font-mono text-xs">
                  Нет сыгранных ранговых матчей в текущем сезоне.
                </div>
              ) : (
                Object.entries(statsData.rankedModes).map(([modeKey, mode]) => (
                  <SpotlightCard key={modeKey} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-mono font-bold text-amber-400 uppercase">
                        {modeKey} RANKED
                      </span>
                      <Shield size={20} className="text-amber-400" />
                    </div>

                    <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                      <div className="p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-500 block text-[10px] uppercase">Ранг / Tier</span>
                        <span className="text-sm font-bold text-amber-400 block">{mode.currentTier || "Master"}</span>
                        <span className="text-[10px] text-gray-400">{mode.currentRankPoint || 0} RP</span>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-500 block text-[10px] uppercase">K/D</span>
                        <span className="text-xl font-bold text-emerald-400">{mode.kd || "0.00"}</span>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-500 block text-[10px] uppercase">Top 10 %</span>
                        <span className="text-xl font-bold text-indigo-400">{mode.top10Rate || "0%"}</span>
                      </div>
                    </div>
                  </SpotlightCard>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
