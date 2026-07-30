import { useEffect, useState } from "react";
import { Skull, Map, Trophy, Crosshair, ChevronRight, Sparkles, Flame, Radio, Zap } from "lucide-react";
import BgWeapons from "./BgWeapons";
import TournamentSection from "./TournamentSection";
import SplitText from "./components/reactbits/SplitText";
import ShinyText from "./components/reactbits/ShinyText";
import SpotlightCard from "./components/reactbits/SpotlightCard";
import GlitchText from "./components/reactbits/GlitchText";
import MagnetButton from "./components/reactbits/MagnetButton";

const FACTS = [
  {
    icon: <Crosshair size={18} />,
    title: "Battle Royale Легенда",
    text: "PUBG — грандиозная арена королевской битвы с рекордом в 3.2 млн одновременных игроков.",
    highlight: "3.2M STEAM PLAYERS",
  },
  {
    icon: <Map size={18} />,
    title: "Масштабные Карты",
    text: "Карты Erangel и Miramar размером 8×8 км с реалистичной физикой баллистики и тактикой.",
    highlight: "8x8 KM BATTLEGROUNDS",
  },
  {
    icon: <Trophy size={18} />,
    title: "Культовая Победа",
    text: "Каждый раунд — это борьба за легендарный статус Winner Winner Chicken Dinner!",
    highlight: "WWCD CHAMPIONS",
  },
  {
    icon: <Skull size={18} />,
    title: "Стандарт PGC / SUPER",
    text: "Официальный регламент: 10 очков за победу в матче + 1 очко за каждый подтвержденный фраг.",
    highlight: "OFFICIAL PUBG SUPER",
  },
];

const ROTATING_FACTS = [
  "🔥 Рекорд по количествам киллов в одном матче PGC — 28 (команда Gen.G)",
  "🏜️ Самая часто выбираемая карта турнира — Miramar (60% всех матчей PGC)",
  "⏱️ Средняя продолжительность одного матча по SUPER — 28 минут напряженного боя",
  "👁️ Официальные PGC турниры смотрят более 500 000 фанатов в прямом эфире",
  "📱 PUBG Mobile преодолел отметку в $10 миллиардов дохода с момента релиза",
];

export default function Home({ onShowAuth, onNavigate }) {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFactIndex((i) => (i + 1) % ROTATING_FACTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <BgWeapons />

      <div className="flex flex-col lg:flex-row items-start gap-8 relative z-10">
        {/* Left Sticky Sidebar (Tournaments Widget) */}
        <div className="hidden lg:block sticky top-24 w-88 shrink-0">
          <TournamentSection compact onShowAuth={onShowAuth} />
        </div>

        {/* Center Main Content */}
        <div className="flex-1 min-w-0">
          
          {/* HERO BANNER SECTION */}
          <SpotlightCard
            spotlightColor="rgba(245, 158, 11, 0.2)"
            borderColor="rgba(245, 158, 11, 0.3)"
            className="p-8 sm:p-12 mb-10 text-center relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Radio size={180} className="text-amber-400" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-6 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Flame size={14} className="animate-bounce" />
              <span>ОФИЦИАЛЬНАЯ КИБЕРСПОРТИВНАЯ ПЛАТФОРМА</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none mb-4 font-display">
              <SplitText
                text="XAOC ESPORTS"
                className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500"
                delay={0.04}
              />
            </h1>

            <div className="mt-2 mb-6">
              <ShinyText
                text="РЕЙТИНГОВЫЕ ТУРНИРЫ • SQUAD & DUO MATCHES • PUBG SUPER"
                speed={3.5}
                className="text-sm sm:text-base font-mono font-bold tracking-widest uppercase text-cyan-400"
              />
            </div>

            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-sans mb-8">
              Регистрируй свою команду, сражайся за первенство в таблице лидеров и выигрывай ценные призы под контролем прозрачной системы статистики PUBG SUPER.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <MagnetButton
                onClick={onShowAuth}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 text-black font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap size={16} />
                <span>Принять Участие</span>
              </MagnetButton>

              <MagnetButton
                onClick={() => onNavigate?.("leaderboard")}
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
              >
                <span>Турнирная Таблица</span>
              </MagnetButton>
            </div>
          </SpotlightCard>

          {/* FEATURES / PUBG FACTS GRID */}
          <div className="mb-6 flex items-center justify-between">
            <GlitchText
              text="Особенности турниров"
              className="text-xl sm:text-2xl font-black text-white"
            />
            <span className="text-xs font-mono text-amber-400/80 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
              SUPER SYSTEM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {FACTS.map((fact, i) => (
              <SpotlightCard
                key={i}
                spotlightColor="rgba(16, 185, 129, 0.15)"
                className="p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      {fact.icon}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {fact.highlight}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{fact.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{fact.text}</p>
                </div>
              </SpotlightCard>
            ))}
          </div>

          {/* DYNAMIC STATISTICS SLIDER */}
          <SpotlightCard
            spotlightColor="rgba(6, 182, 212, 0.2)"
            borderColor="rgba(6, 182, 212, 0.3)"
            className="p-6 mb-10"
          >
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 tracking-wider mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-cyan-400 animate-spin" style={{ animationDuration: "6s" }} />
                <span>ДИНАМИЧЕСКИЕ ФАКТЫ PUBG ESPORTS</span>
              </div>
              <ChevronRight size={14} className="text-cyan-400/60" />
            </div>
            <p key={factIndex} className="text-gray-200 text-sm sm:text-base leading-relaxed font-mono">
              {ROTATING_FACTS[factIndex]}
            </p>
          </SpotlightCard>

          {/* MOBILE TOURNAMENTS & DONATE SECTION */}
          <div className="flex flex-col items-center gap-6 pt-6 border-t border-white/10">
            <div className="lg:hidden w-full">
              <TournamentSection compact onShowAuth={onShowAuth} />
            </div>

            <div className="text-center pt-4">
              <p className="text-[10px] font-mono tracking-[0.2em] text-gray-400 uppercase">
                DEVELOPED BY
              </p>
              <p className="mt-1 text-sm font-mono tracking-wider font-bold text-emerald-400">
                &lt; CTYDEHT-_4ITEP /&gt;
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
