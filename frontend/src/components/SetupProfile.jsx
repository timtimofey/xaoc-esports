import { useState } from "react";
import { ShieldCheck, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "./AuthContext";

export default function SetupProfile() {
  const { user, token, setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [pubgNick, setPubgNick] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: username.trim(), pubgNickname: pubgNick.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      setOk(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (ok) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="bg-[#0e1628] border border-emerald-500/30 rounded-2xl p-8 text-center max-w-md w-full">
          <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white font-display mb-2">Профиль настроен!</h2>
          <p className="text-sm text-gray-400 font-mono mb-4">
            Добро пожаловать, <span className="text-amber-400 font-bold">{user?.username}</span>
          </p>
          <button
            onClick={() => window.location.hash = ""}
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold uppercase tracking-wider text-xs hover:bg-amber-400 transition-all cursor-pointer"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="bg-[#0e1628] border border-amber-500/30 rounded-2xl p-8 max-w-md w-full">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-white font-display text-center mb-2">
          Завершите регистрацию
        </h2>
        <p className="text-xs text-gray-400 font-mono text-center mb-6">
          Вы вошли через Google. Придумайте никнейм и укажите PUBG ник.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5 block font-mono">
              Имя пользователя
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Придумайте ник"
              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 font-mono"
              minLength={2}
              required
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1.5 block font-mono">
              PUBG Никнейм
            </label>
            <input
              value={pubgNick}
              onChange={(e) => setPubgNick(e.target.value)}
              placeholder="Ваш ник в PUBG"
              className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 font-mono"
              minLength={2}
              maxLength={25}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold uppercase tracking-wider text-xs hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Сохранить и продолжить
          </button>
        </form>
      </div>
    </div>
  );
}
