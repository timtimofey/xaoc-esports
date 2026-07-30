import { useState, useEffect } from "react";
import { Trophy, Shield, User, Flame, Crosshair, BarChart2, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./components/AuthContext";
import ReactBitsBackground from "./components/reactbits/ReactBitsBackground";
import AuthModal from "./components/AuthModal";
import DonateButton from "./DonateButton";
import Home from "./Home";
import Leaderboard from "./Leaderboard";
import TournamentSection from "./TournamentSection";
import WeaponShowcase from "./WeaponShowcase";
import Profile from "./components/Profile";
import PlayerStats from "./components/PlayerStats";
import SetupProfile from "./components/SetupProfile";
import Admin from "./Admin";

export default function App() {
  const { user, isAdmin, needsSetup, login } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.hash.includes("token=")) return "home";
    return "home";
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("token=")) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("token");
      const userB64 = params.get("user");
      const tab = params.get("tab") || "home";
      if (token && userB64) {
        try {
          const userData = JSON.parse(atob(userB64));
          login(token, userData);
        } catch {}
      }
      setActiveTab(tab);
      window.location.hash = "";
    }
  }, []);

  useEffect(() => {
    if (needsSetup && user) {
      setActiveTab("setup");
    }
  }, [needsSetup, user]);

  const isConfigured = user && !needsSetup;

  return (
    <div className="min-h-screen bg-[#060a12] text-gray-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300">
      {/* React Bits Interactive Particles & Cyber Background */}
      <ReactBitsBackground particleCount={45} interactive />

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#080d19]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <button
            onClick={() => setActiveTab("home")}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#080d19] rounded-[10px] flex items-center justify-center font-display font-black text-amber-400 text-lg tracking-widest">
                X
              </div>
            </div>
            <div>
              <span className="font-display font-black text-lg tracking-wider text-white block group-hover:text-amber-400 transition-colors">
                XAOC <span className="text-amber-500">ESPORTS</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase block -mt-1">
                PUBG BATTLEGROUNDS
              </span>
            </div>
          </button>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 p-1.5 bg-[#0e1628]/80 backdrop-blur-md border border-white/10 rounded-2xl">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "home"
                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Flame size={14} />
              <span>Главная</span>
            </button>

            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "leaderboard"
                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Trophy size={14} />
              <span>Таблица</span>
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              disabled={!isConfigured}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "stats"
                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : !isConfigured ? "text-gray-700 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              title={!isConfigured ? "Завершите настройку профиля" : ""}
            >
              <BarChart2 size={14} />
              <span>Статистика</span>
            </button>

            <button
              onClick={() => setActiveTab("tournaments")}
              disabled={!isConfigured}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "tournaments"
                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : !isConfigured ? "text-gray-700 cursor-not-allowed" : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              title={!isConfigured ? "Завершите настройку профиля" : ""}
            >
              <Layers size={14} />
              <span>Турниры</span>
            </button>

            <button
              onClick={() => setActiveTab("weapons")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "weapons"
                  ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Crosshair size={14} />
              <span>Арсенал</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "admin"
                    ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                    : "text-rose-400 hover:bg-rose-500/10"
                }`}
              >
                <Shield size={14} />
                <span>Админка</span>
              </button>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            <DonateButton />

            {user ? (
              <button
                onClick={() => setActiveTab(needsSetup ? "setup" : "profile")}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border ${
                  activeTab === "profile" || activeTab === "setup"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    : "bg-[#0e1628] text-gray-300 border-white/10 hover:border-amber-500/30"
                }`}
              >
                <User size={14} className="text-amber-400" />
                <span className="hidden sm:inline">{needsSetup ? "Настройка" : user.username}</span>
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-2"
              >
                <User size={14} />
                <span>Войти</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden border-t border-white/10 bg-[#080d19] overflow-x-auto px-2 py-2 gap-1">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider whitespace-nowrap text-center ${
              activeTab === "home" ? "bg-amber-500 text-black" : "text-gray-400"
            }`}
          >
            Главная
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider whitespace-nowrap text-center ${
              activeTab === "leaderboard" ? "bg-amber-500 text-black" : "text-gray-400"
            }`}
          >
            Таблица
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider whitespace-nowrap text-center ${
              activeTab === "stats" ? "bg-amber-500 text-black" : "text-gray-400"
            }`}
          >
            Статистика
          </button>
          <button
            onClick={() => setActiveTab("tournaments")}
            className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider whitespace-nowrap text-center ${
              activeTab === "tournaments" ? "bg-amber-500 text-black" : "text-gray-400"
            }`}
          >
            Турниры
          </button>
          <button
            onClick={() => setActiveTab("weapons")}
            className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider whitespace-nowrap text-center ${
              activeTab === "weapons" ? "bg-amber-500 text-black" : "text-gray-400"
            }`}
          >
            Арсенал
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider whitespace-nowrap text-center ${
                activeTab === "admin" ? "bg-rose-500 text-white" : "text-rose-400"
              }`}
            >
              Админ
            </button>
          )}
        </div>
      </header>

      {/* MAIN VIEW CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "home" && (
              <Home
                onShowAuth={() => setAuthModalOpen(true)}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === "leaderboard" && <Leaderboard />}
            {activeTab === "stats" && <PlayerStats />}
            {activeTab === "tournaments" && (
              <TournamentSection onShowAuth={() => setAuthModalOpen(true)} />
            )}
            {activeTab === "weapons" && <WeaponShowcase />}
            {activeTab === "profile" && (
              <Profile onShowAuth={() => setAuthModalOpen(true)} />
            )}
            {activeTab === "setup" && user && <SetupProfile />}
            {activeTab === "admin" && <Admin />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-white/10 bg-[#080d19]/90 pt-8 pb-20 sm:pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs text-gray-400">
          <div>
            <span className="text-white font-bold font-display tracking-wider">XAOC ESPORTS</span> — Турнирная Платформа PUBG BATTLEGROUNDS
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <a
              href="https://t.me/timmon6"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:text-white transition-all flex items-center gap-1.5 font-bold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span>Telegram</span>
            </a>

            <a
              href="https://discord.gg/tKCvZZ7h2"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:text-white transition-all flex items-center gap-1.5 font-bold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span>Discord</span>
            </a>

            <span className="text-emerald-400 font-bold ml-2">&lt; CTYDEHT-_4ITEP /&gt;</span>
          </div>
        </div>
      </footer>

      {/* FLOATING QUICK CONTACT BAR (Root level, viewport fixed) */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-6 z-[100] pointer-events-none flex items-center justify-between gap-4">
        {/* Telegram Contact Button */}
        <a
          href="https://t.me/timmon6"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#080d19]/90 backdrop-blur-md border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 hover:border-sky-400 hover:scale-105 shadow-[0_0_25px_rgba(14,165,233,0.3)] transition-all text-xs font-bold font-mono"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <span className="hidden sm:inline">Связаться с организаторами</span>
          <span className="sm:hidden">Организаторы</span>
        </a>

        {/* Discord Button */}
        <a
          href="https://discord.gg/tKCvZZ7h2"
          target="_blank"
          rel="noreferrer"
          className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#080d19]/90 backdrop-blur-md border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400 hover:scale-105 shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all text-xs font-bold font-mono"
          title="Discord Сервер"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <span className="hidden sm:inline">Discord</span>
        </a>
      </div>

      {/* AUTH MODAL */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
