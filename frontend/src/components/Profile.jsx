import { useEffect, useState } from "react";
import { User, Mail, Gamepad2, ShieldCheck, Trophy, LogOut, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "./AuthContext";
import SpotlightCard from "./reactbits/SpotlightCard";
import PlayerStats from "./PlayerStats";

export default function Profile({ onShowAuth }) {
  const { user, setUser, token, logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // PUBG nickname editing state
  const [editingPubg, setEditingPubg] = useState(false);
  const [newPubgNick, setNewPubgNick] = useState("");
  const [savingPubg, setSavingPubg] = useState(false);
  const [pubgError, setPubgError] = useState("");
  const [pubgSuccess, setPubgSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    setNewPubgNick(user.pubgNickname || "");
    fetch(`/api/player/${encodeURIComponent(user.username)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUserProfile(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSavePubg = async (e) => {
    e.preventDefault();
    setPubgError("");
    setPubgSuccess("");
    setSavingPubg(true);

    try {
      const res = await fetch("/api/auth/update-pubg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pubgNickname: newPubgNick }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Ошибка сохранения никнейма");
      }
      setUser(data.user);
      setPubgSuccess("Игровой никнейм сохранен!");
      setEditingPubg(false);
    } catch (err) {
      setPubgError(err.message);
    } finally {
      setSavingPubg(false);
    }
  };

  if (!user) {
    return (
      <SpotlightCard className="p-8 text-center max-w-md mx-auto my-12">
        <User size={48} className="text-amber-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2 font-display">
          Авторизация Необходима
        </h3>
        <p className="text-xs text-gray-400 font-mono mb-6">
          Войдите в свой профиль XAOC Esports, чтобы просматривать заявки и личную статистику.
        </p>
        <button
          onClick={onShowAuth}
          className="px-6 py-3 rounded-xl bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer"
        >
          Войти в Аккаунт
        </button>
      </SpotlightCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.2)" className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-2xl font-display overflow-hidden shrink-0">
              {user.picture ? (
                <img src={user.picture} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                user.username.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-black text-white font-display">{user.username}</h2>
                {user.role === "admin" && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 uppercase">
                    ADMIN
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-cyan-400" />
                  {user.email}
                </span>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5">
                    <Gamepad2 size={14} className="text-amber-400" />
                    PUBG: <strong className="text-white">{user.pubgNickname || "Не указан"}</strong>
                  </span>
                  {!editingPubg && (
                    <button
                      onClick={() => setEditingPubg(true)}
                      className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      {user.pubgNickname ? "Изменить" : "Указать никнейм"}
                    </button>
                  )}
                </div>
              </div>

              {/* PUBG Nickname Edit Inline Form */}
              {editingPubg && (
                <form onSubmit={handleSavePubg} className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Точный PUBG Никнейм"
                    value={newPubgNick}
                    onChange={(e) => setNewPubgNick(e.target.value)}
                    className="px-3 py-1.5 bg-black/50 border border-amber-500/50 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                  <button
                    type="submit"
                    disabled={savingPubg}
                    className="px-3 py-1.5 bg-amber-500 text-black font-mono font-bold text-xs rounded-lg hover:bg-amber-400 transition-all cursor-pointer"
                  >
                    {savingPubg ? "Сохранение..." : "Сохранить"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPubg(false);
                      setPubgError("");
                    }}
                    className="px-3 py-1.5 bg-white/10 text-gray-300 font-mono text-xs rounded-lg hover:bg-white/20 transition-all cursor-pointer"
                  >
                    Отмена
                  </button>
                </form>
              )}

              {pubgError && <p className="mt-1 text-[11px] font-mono text-red-400">{pubgError}</p>}
              {pubgSuccess && <p className="mt-1 text-[11px] font-mono text-emerald-400">{pubgSuccess}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
              <CheckCircle size={14} />
              <span>Аккаунт Подтвержден</span>
            </span>

            <button
              onClick={logout}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
              title="Выйти из аккаунта"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </SpotlightCard>

      {/* Tournament Registrations */}
      <SpotlightCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-amber-400" />
          <h3 className="text-sm font-black text-white font-display uppercase tracking-wider">
            Мои Турнирные Заявки
          </h3>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs font-mono text-gray-500">
            Загрузка списка заявок...
          </div>
        ) : !userProfile?.tournaments || userProfile.tournaments.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-gray-500">
            У вас пока нет активных заявок на турниры.
          </div>
        ) : (
          <div className="space-y-3">
            {userProfile.tournaments.map((reg, idx) => (
              <div
                key={idx}
                className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between font-mono text-xs"
              >
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">{reg.tournamentName}</h4>
                  <span className="text-gray-400 text-[11px]">
                    Команда: <strong className="text-amber-300">[{reg.tag}] {reg.teamName}</strong>
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    reg.status === "accepted"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {reg.status === "accepted" ? "Одобрена" : "На рассмотрении"}
                </span>
              </div>
            ))}
          </div>
        )}
      </SpotlightCard>

      {/* PUBG API Stats Section */}
      <PlayerStats pubgNickname={user?.pubgNickname} isProfileMode={true} />
    </div>
  );
}
