import { useEffect, useState } from "react";
import { Trophy, Users, Calendar, MapPin, CheckCircle, AlertCircle, Plus, Send, X, ExternalLink, Shield } from "lucide-react";
import { useAuth } from "./components/AuthContext";
import SpotlightCard from "./components/reactbits/SpotlightCard";

export default function TournamentSection({ compact = false, onShowAuth }) {
  const { user, token } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  // Form
  const [teamName, setTeamName] = useState("");
  const [tag, setTag] = useState("");
  const [playersText, setPlayersText] = useState("");
  const [contact, setContact] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const fetchTournaments = async () => {
    try {
      const res = await fetch("/api/tournaments");
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
    const interval = setInterval(fetchTournaments, 10000);
    return () => clearInterval(interval);
  }, []);

  const openRegister = (t) => {
    if (!user) {
      onShowAuth?.();
      return;
    }
    if (!user.emailVerified) {
      alert("Пожалуйста, подтвердите ваш email перед регистрацией на турнир!");
      onShowAuth?.();
      return;
    }
    setSelectedTournament(t);
    setTeamName("");
    setTag("");
    setPlayersText(user.pubgNickname ? `${user.pubgNickname}` : "");
    setContact(`@${user.username}`);
    setRegError("");
    setRegSuccess("");
    setInviteLink("");
    setRegisterModalOpen(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTournament) return;
    setRegError("");
    setRegSuccess("");
    setRegLoading(true);

    const players = playersText
      .split(/[\n,]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/tournaments/${selectedTournament.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamName,
          tag,
          players,
          contact,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка регистрации");
      }
      setRegSuccess("Заявка успешно отправлена на рассмотрение!");
      if (data.inviteLink) {
        setInviteLink(data.inviteLink);
      }
      fetchTournaments();
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  if (compact) {
    return (
      <SpotlightCard
        spotlightColor="rgba(245, 158, 11, 0.15)"
        className="p-5 border-amber-500/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <h3 className="text-sm font-black text-white font-display uppercase tracking-wider">
              Предстоящие Турниры
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
            PUBG SUPER
          </span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-gray-500">
            Загрузка списка турниров...
          </div>
        ) : tournaments.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-gray-500">
            Нет активных турниров
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.slice(0, 3).map((t) => {
              const totalReg = (t.registeredTeams?.length || 0) + (t.pendingTeams?.length || 0);
              const isFull = totalReg >= t.maxTeams;

              return (
                <div
                  key={t.id}
                  className="p-3.5 bg-white/5 border border-white/10 rounded-xl hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-bold text-white leading-snug">{t.name}</h4>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        t.status === "upcoming"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : t.status === "active"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {t.status === "upcoming" ? "Регистрация" : t.status === "active" ? "Идет Матч" : "Завершен"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-amber-400" />
                      <span>{t.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-cyan-400" />
                      <span>
                        {t.registeredTeams?.length || 0} / {t.maxTeams} команд
                      </span>
                    </div>
                  </div>

                  {t.status === "upcoming" && (
                    <button
                      onClick={() => openRegister(t)}
                      disabled={isFull}
                      className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Plus size={14} />
                      <span>{isFull ? "Мест нет" : "Подать заявку"}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SpotlightCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white font-display uppercase tracking-wider">
            Все Турниры XAOC
          </h2>
          <p className="text-xs font-mono text-gray-400 mt-1">
            Зарегистрируйте вашу команду для участия в киберспортивных сериях
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tournaments.map((t) => {
          const registered = t.registeredTeams?.length || 0;
          const pending = t.pendingTeams?.length || 0;
          const isFull = registered + pending >= t.maxTeams;

          return (
            <SpotlightCard
              key={t.id}
              spotlightColor="rgba(245, 158, 11, 0.15)"
              className="p-6 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-wider">
                    {t.status === "upcoming" ? "Открыта регистрация" : t.status === "active" ? "Турнир в разгаре" : "Завершен"}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-mono text-gray-400">
                    <Calendar size={14} className="text-amber-400" />
                    <span>{t.date}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{t.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans mb-4">
                  {t.description || "Официальный турнир по системе PUBG SUPER с подсчетом очков за киллы и места."}
                </p>

                <div className="grid grid-cols-2 gap-2 p-3 bg-white/5 rounded-xl text-xs font-mono text-gray-300 border border-white/5 mb-4">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Карты:</span>
                    <span className="font-bold text-amber-300">{t.mapPool || "Erangel, Miramar"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">Команды:</span>
                    <span className="font-bold text-emerald-400">{registered} / {t.maxTeams} ({pending} ожид.)</span>
                  </div>
                </div>
              </div>

              {t.status === "upcoming" && (
                <button
                  onClick={() => openRegister(t)}
                  disabled={isFull}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus size={16} />
                  <span>{isFull ? "Мест больше нет" : "Зарегистрировать команду"}</span>
                </button>
              )}
            </SpotlightCard>
          );
        })}
      </div>

      {/* REGISTRATION MODAL */}
      {registerModalOpen && selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <SpotlightCard
            spotlightColor="rgba(245, 158, 11, 0.2)"
            className="w-full max-w-lg p-6 sm:p-8 relative"
          >
            <button
              onClick={() => setRegisterModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-display uppercase tracking-wider">
                  Регистрация Команды
                </h3>
                <p className="text-xs text-amber-400 font-mono">{selectedTournament.name}</p>
              </div>
            </div>

            {regError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess ? (
              <div className="space-y-4 py-4 text-center">
                <CheckCircle size={48} className="text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-white">Заявка успешно отправлена!</h4>
                <p className="text-xs text-gray-300 font-mono">
                  Администрация турнира проверит состав вашей команды.
                </p>
                {inviteLink && (
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:bg-sky-400 transition-all cursor-pointer"
                  >
                    <span>Вступить в Telegram Чат</span>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">
                    Название Команды
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например: XAOC Gaming"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full py-3 px-4 bg-[#0a101f] text-white rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">
                    Тег Команды (2-5 символов)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="XAOC"
                    value={tag}
                    onChange={(e) => setTag(e.target.value.toUpperCase())}
                    className="w-full py-3 px-4 bg-[#0a101f] text-white rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none font-mono text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">
                    Никнеймы игроков (каждый с новой строки или через запятую)
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="PUBG_Player1&#10;PUBG_Player2&#10;PUBG_Player3&#10;PUBG_Player4"
                    value={playersText}
                    onChange={(e) => setPlayersText(e.target.value)}
                    className="w-full py-3 px-4 bg-[#0a101f] text-white rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1 uppercase tracking-wider">
                    Telegram капитанa для связи
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="@telegram_username"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full py-3 px-4 bg-[#0a101f] text-white rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none font-mono text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={16} />
                  <span>Отправить Заявку</span>
                </button>
              </form>
            )}
          </SpotlightCard>
        </div>
      )}
    </div>
  );
}
