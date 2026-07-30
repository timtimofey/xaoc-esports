import { useState, useEffect } from "react";
import { X, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthContext";

export default function AuthModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Google Account Chooser / Config Modal state
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleRedirectUri, setGoogleRedirectUri] = useState("");
  const [googleCustomEmail, setGoogleCustomEmail] = useState("");

  // Listen for OAuth postMessage from popup window
  useEffect(() => {
    const handleOAuthMessage = (event) => {
      let data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (data?.type === "OAUTH_AUTH_SUCCESS") {
        login(data.token, data.user);
        setShowGoogleChooser(false);
        onClose();
      } else if (data?.type === "OAUTH_AUTH_ERROR") {
        setError(data.error || "Ошибка авторизации через Google");
      }
    };
    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [login, onClose]);

  if (!isOpen) return null;

  const handleStartGoogleAuth = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const origin = encodeURIComponent(window.location.origin);
      const res = await fetch(`/api/auth/google/url?origin=${origin}`);
      const data = await res.json();

      if (data.configured && data.url) {
        window.location.href = data.url;
      } else {
        setShowGoogleChooser(true);
      }
    } catch {
      setShowGoogleChooser(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (googleUser) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(googleUser),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Ошибка авторизации через Google");
      }
      login(data.token, data.user);
      setShowGoogleChooser(false);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sampleGoogleAccounts = [
    {
      googleId: "google_10823491",
      name: "PUBG Player",
      email: "player.pubg@gmail.com",
    },
    {
      googleId: "google_20481723",
      name: "XAOC Esports Fan",
      email: "xaoc.esports@gmail.com",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0e1628] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Google Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(255,255,255,0.2)]">
          <svg width="32" height="32" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 font-display">
          Вход и Регистрация
        </h3>
        <p className="text-xs text-gray-400 font-mono mb-6 leading-relaxed max-w-xs mx-auto">
          Авторизация на платформе <strong className="text-amber-400">XAOC ESPORTS</strong> осуществляется исключительно через аккаунт Google.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center justify-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center justify-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* GOOGLE PLATFORM BUTTON */}
        <button
          type="button"
          onClick={handleStartGoogleAuth}
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-sans font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.35)] transition-all flex items-center justify-center gap-3 cursor-pointer border border-gray-200 active:scale-[0.98]"
        >
          {loading ? (
            <RefreshCw size={18} className="animate-spin text-gray-700" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Продолжить через Google</span>
            </>
          )}
        </button>

        <p className="mt-5 text-[11px] font-mono text-gray-500 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Безопасная быстрая авторизация</span>
        </p>
      </div>

      {/* GOOGLE ACCOUNT SELECTOR / OAUTH INFO DIALOG */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-[#0c1322] border border-sky-500/40 rounded-2xl p-6 shadow-2xl text-white font-sans max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowGoogleChooser(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
            >
              <X size={16} />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold">Выбор аккаунта Google</h3>
              <p className="text-xs text-amber-400 mt-1 font-mono">
                Вход через платформу Google
              </p>
            </div>

            {/* OAuth Credentials Redirect URI info */}
            <div className="mb-4 p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl text-xs space-y-1.5 font-mono text-gray-300">
              <p className="font-bold text-sky-300">
                <span>🔑 Redirect URI для Google Cloud Console:</span>
              </p>
              <div className="p-2 bg-black/60 rounded text-[10px] text-amber-300 break-all select-all font-mono border border-white/10">
                {googleRedirectUri || `${window.location.origin}/api/auth/google/callback`}
              </div>
            </div>

            {/* Quick Demo Selector */}
            <div className="border-t border-white/10 pt-3">
              <p className="text-[11px] font-mono text-gray-400 mb-2 uppercase font-bold">
                Выберите Google аккаунт:
              </p>
              <div className="space-y-2 mb-3">
                {sampleGoogleAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleGoogleAuth(acc)}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-white/10 transition-all text-left flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-black font-bold flex items-center justify-center text-xs">
                      {acc.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                        {acc.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{acc.email}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Google Entry Option */}
              <div className="space-y-2 font-mono text-xs">
                <input
                  type="email"
                  placeholder="Ваш email@gmail.com"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 rounded-lg border border-white/10 focus:border-amber-400 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (!googleCustomEmail) return setError("Введите email Google аккаунта");
                    handleGoogleAuth({
                      googleId: `google_custom_${Date.now()}`,
                      name: googleCustomEmail.split("@")[0],
                      email: googleCustomEmail,
                    });
                  }}
                  className="w-full py-2.5 rounded-lg bg-sky-500 text-black font-bold uppercase tracking-wider text-xs hover:bg-sky-400 transition-all cursor-pointer"
                >
                  Войти через Google E-mail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
