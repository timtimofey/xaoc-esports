import { useState, useEffect } from "react";
import { Shield, Plus, Check, X, Trash2, Edit, Award, Users, RefreshCw, Send, AlertCircle, Key } from "lucide-react";
import { useAuth } from "./components/AuthContext";
import SpotlightCard from "./components/reactbits/SpotlightCard";

export default function Admin() {
  const { user, token, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("registrations"); // "registrations" | "tournaments" | "matches" | "teams" | "users"

  // Data
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // New Tournament form
  const [tName, setTName] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tDate, setTDate] = useState("");
  const [tMaxTeams, setTMaxTeams] = useState(16);
  const [tMapPool, setTMapPool] = useState("Erangel, Miramar, Taego, Rondo");

  // New Match form
  const [matchMap, setMatchMap] = useState("Erangel");
  const [matchResults, setMatchResults] = useState([]);

  // New Team form
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamTag, setNewTeamTag] = useState("");
  const [newTeamPlayers, setNewTeamPlayers] = useState("");

  // Admin grant form
  const [adminPassword, setAdminPassword] = useState("");
  const [adminTargetUsername, setAdminTargetUsername] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, teamsRes, usersRes] = await Promise.all([
        fetch("/api/tournaments"),
        fetch("/api/teams"),
        fetch("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (tRes.ok) setTournaments(await tRes.json());
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
        // Initialize match results array for all teams
        setMatchResults(
          teamsData.map((t) => ({ teamId: t.id, teamName: t.name, tag: t.tag, placement: 1, kills: 0 }))
        );
      }
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, token]);

  if (!isAdmin) {
    return (
      <SpotlightCard className="p-8 text-center max-w-md mx-auto my-12">
        <Shield size={48} className="text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2 font-display">
          Доступ Запрещен
        </h3>
        <p className="text-xs text-gray-400 font-mono">
          Эта панель доступна только администраторам платформы XAOC Esports.
        </p>
      </SpotlightCard>
    );
  }

  // Handle registration approve
  const handleApproveReg = async (tournamentId, pendingId) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/approve/${pendingId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage("Команда одобрена и добавлена на турнир!");
        fetchData();
      }
    } catch (e) {
      setError(e.message);
    }
  };

  // Handle registration reject
  const handleRejectReg = async (tournamentId, pendingId) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/reject/${pendingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage("Заявка отклонена.");
        fetchData();
      }
    } catch (e) {
      setError(e.message);
    }
  };

  // Handle tournament creation
  const handleCreateTournament = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: tName,
          description: tDesc,
          date: tDate,
          maxTeams: Number(tMaxTeams),
          mapPool: tMapPool,
        }),
      });
      if (!res.ok) throw new Error("Ошибка создания турнира");
      setMessage("Турнир успешно создан!");
      setTName("");
      setTDesc("");
      setTDate("");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Match Save
  const handleSaveMatch = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          map: matchMap,
          results: matchResults,
        }),
      });
      if (!res.ok) throw new Error("Ошибка сохранения результатов");
      setMessage("Результаты матча сохранены в таблицу!");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Team Creation
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const players = newTeamPlayers
      .split(/[\n,]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTeamName,
          tag: newTeamTag.toUpperCase(),
          players,
        }),
      });
      if (!res.ok) throw new Error("Ошибка создания команды");
      setMessage("Команда создана!");
      setNewTeamName("");
      setNewTeamTag("");
      setNewTeamPlayers("");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Grant Admin
  const handleGrantAdmin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          username: adminTargetUsername,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка выдачи прав");
      setMessage(data.message);
      setAdminTargetUsername("");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-display uppercase tracking-wider flex items-center gap-2">
            <Shield className="text-amber-400" />
            <span>Панель Администратора</span>
          </h2>
          <p className="text-xs font-mono text-gray-400 mt-1">
            Управление турнирами, заявками, командами и внесение результатов матчей
          </p>
        </div>

        {/* Admin Tabs */}
        <div className="flex flex-wrap gap-2">
          {["registrations", "tournaments", "matches", "teams", "users"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "bg-[#0e1628]/80 text-gray-400 border border-white/10 hover:text-white"
              }`}
            >
              {tab === "registrations"
                ? "Заявки"
                : tab === "tournaments"
                ? "Турниры"
                : tab === "matches"
                ? "Внести Матч"
                : tab === "teams"
                ? "Команды"
                : "Пользователи"}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* REGISTRATIONS TAB */}
      {activeTab === "registrations" && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">
            Ожидающие Заявки На Турниры
          </h3>

          {tournaments.every((t) => !t.pendingTeams || t.pendingTeams.length === 0) ? (
            <SpotlightCard className="p-8 text-center text-xs font-mono text-gray-500">
              Нет входящих заявок на рассмотрение.
            </SpotlightCard>
          ) : (
            tournaments.map((t) => (
              <div key={t.id} className="space-y-3">
                {t.pendingTeams?.map((pending) => (
                  <SpotlightCard
                    key={pending.id}
                    spotlightColor="rgba(245, 158, 11, 0.15)"
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-amber-400 font-bold">[{pending.tag}]</span>
                        <span className="text-white font-bold text-sm">{pending.teamName}</span>
                        <span className="text-[10px] text-gray-400">({t.name})</span>
                      </div>
                      <p className="text-gray-400 text-[11px]">
                        Игроки: <strong className="text-gray-200">{pending.players?.join(", ") || "—"}</strong>
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        Контакты: <strong className="text-cyan-400">{pending.contact}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveReg(t.id, pending.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check size={14} />
                        <span>Одобрить</span>
                      </button>
                      <button
                        onClick={() => handleRejectReg(t.id, pending.id)}
                        className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <X size={14} />
                        <span>Отклонить</span>
                      </button>
                    </div>
                  </SpotlightCard>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* TOURNAMENTS TAB */}
      {activeTab === "tournaments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SpotlightCard className="p-6 lg:col-span-1">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider mb-4">
              Создать Новый Турнир
            </h3>
            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Название</label>
                <input
                  type="text"
                  required
                  placeholder="XAOC SUPER Series #1"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#0a101f] text-white rounded-xl border border-white/10 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Дата и Время</label>
                <input
                  type="text"
                  required
                  placeholder="30 Июля, 19:00 МСК"
                  value={tDate}
                  onChange={(e) => setTDate(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#0a101f] text-white rounded-xl border border-white/10 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Макс. Команд</label>
                <input
                  type="number"
                  required
                  value={tMaxTeams}
                  onChange={(e) => setTMaxTeams(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#0a101f] text-white rounded-xl border border-white/10 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Пул Карт</label>
                <input
                  type="text"
                  required
                  value={tMapPool}
                  onChange={(e) => setTMapPool(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#0a101f] text-white rounded-xl border border-white/10 font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer"
              >
                Опубликовать Турнир
              </button>
            </form>
          </SpotlightCard>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">
              Список Турниров
            </h3>
            {tournaments.map((t) => (
              <SpotlightCard key={t.id} className="p-4 flex items-center justify-between font-mono text-xs">
                <div>
                  <h4 className="font-bold text-white">{t.name}</h4>
                  <span className="text-gray-400">{t.date} • {t.registeredTeams?.length || 0} зарегистрировано</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-white/10 text-amber-400 font-bold uppercase text-[10px]">
                  {t.status}
                </span>
              </SpotlightCard>
            ))}
          </div>
        </div>
      )}

      {/* MATCHES INPUT TAB */}
      {activeTab === "matches" && (
        <SpotlightCard className="p-6">
          <h3 className="text-base font-bold text-white font-display uppercase tracking-wider mb-4">
            Внесение Результатов Сыгранного Матча
          </h3>

          <form onSubmit={handleSaveMatch} className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-xs font-mono text-gray-400 uppercase">Карта Матча:</label>
              <select
                value={matchMap}
                onChange={(e) => setMatchMap(e.target.value)}
                className="py-2 px-4 bg-[#0a101f] text-white rounded-xl border border-white/10 font-mono text-xs"
              >
                <option value="Erangel">Erangel</option>
                <option value="Miramar">Miramar</option>
                <option value="Taego">Taego</option>
                <option value="Rondo">Rondo</option>
                <option value="Deston">Deston</option>
                <option value="Vikendi">Vikendi</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                    <th className="py-2">Команда</th>
                    <th className="py-2 text-center">Занятое Место</th>
                    <th className="py-2 text-center">Убийства (Киллы)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {matchResults.map((entry, idx) => (
                    <tr key={entry.teamId}>
                      <td className="py-3 font-bold text-white">
                        [{entry.tag}] {entry.teamName}
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={16}
                          value={entry.placement}
                          onChange={(e) => {
                            const updated = [...matchResults];
                            updated[idx].placement = Number(e.target.value);
                            setMatchResults(updated);
                          }}
                          className="w-16 py-1 px-2 text-center bg-[#0a101f] text-white rounded border border-white/10"
                        />
                      </td>
                      <td className="py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={entry.kills}
                          onChange={(e) => {
                            const updated = [...matchResults];
                            updated[idx].kills = Number(e.target.value);
                            setMatchResults(updated);
                          }}
                          className="w-16 py-1 px-2 text-center bg-[#0a101f] text-white rounded border border-white/10"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-500 text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all cursor-pointer"
            >
              Сохранить Матч в Статистику
            </button>
          </form>
        </SpotlightCard>
      )}

      {/* TEAMS TAB */}
      {activeTab === "teams" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SpotlightCard className="p-6 lg:col-span-1">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider mb-4">
              Добавить Команду Вручную
            </h3>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Название Команды</label>
                <input
                  type="text"
                  required
                  placeholder="XAOC Esports"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#0a101f] text-white rounded-xl border border-white/10 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Тег (XAOC)</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={newTeamTag}
                  onChange={(e) => setNewTeamTag(e.target.value.toUpperCase())}
                  className="w-full py-2.5 px-3 bg-[#0a101f] text-white rounded-xl border border-white/10 font-mono text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Игроки</label>
                <textarea
                  rows={3}
                  placeholder="Player1&#10;Player2&#10;Player3&#10;Player4"
                  value={newTeamPlayers}
                  onChange={(e) => setNewTeamPlayers(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#0a101f] text-white rounded-xl border border-white/10 font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer"
              >
                Создать Команду
              </button>
            </form>
          </SpotlightCard>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">
              Все Команды ({teams.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teams.map((team) => (
                <SpotlightCard key={team.id} className="p-4 font-mono text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400 font-bold">[{team.tag}]</span>
                    <span className="text-white font-bold">{team.name}</span>
                  </div>
                  <p className="text-gray-400 text-[11px]">
                    Состав: {team.players?.join(", ") || "—"}
                  </p>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB & ADMIN GRANT */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SpotlightCard className="p-6 lg:col-span-1">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider mb-4 flex items-center gap-2">
              <Key size={16} className="text-amber-400" />
              <span>Выдать Права Админа</span>
            </h3>
            <form onSubmit={handleGrantAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Имя Пользователя</label>
                <input
                  type="text"
                  required
                  placeholder="username"
                  value={adminTargetUsername}
                  onChange={(e) => setAdminTargetUsername(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#0a101f] text-white rounded-xl border border-white/10 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 mb-1">Мастер Пароль Админа</label>
                <input
                  type="password"
                  required
                  placeholder="Master Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#0a101f] text-white rounded-xl border border-white/10 font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-rose-500 text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-rose-400 transition-all cursor-pointer"
              >
                Предоставить Права
              </button>
            </form>
          </SpotlightCard>

          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-base font-bold text-white font-display uppercase tracking-wider">
              Зарегистрированные Пользователи ({users.length})
            </h3>
            <div className="space-y-2">
              {users.map((u) => (
                <SpotlightCard key={u.id} className="p-3 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-white font-bold">{u.username}</span>
                    <span className="text-gray-400 text-[11px] block">{u.email} • PUBG: {u.pubgNickname}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === "admin"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-white/5 text-gray-400"
                    }`}
                  >
                    {u.role}
                  </span>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
