import { useState } from "react";
import { Heart, X, Copy, Check, ExternalLink, ShieldAlert } from "lucide-react";
import SpotlightCard from "./components/reactbits/SpotlightCard";

export default function DonateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState("");

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-300 hover:text-white hover:border-rose-400 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(244,63,94,0.15)] cursor-pointer"
      >
        <Heart size={14} className="text-rose-400 animate-pulse" />
        <span>Поддержать Призовой Фонд</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <SpotlightCard
            spotlightColor="rgba(244, 63, 94, 0.2)"
            borderColor="rgba(244, 63, 94, 0.3)"
            className="w-full max-w-lg p-6 sm:p-8 relative"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Heart size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-display uppercase tracking-wider">
                  Поддержка Призового Фонда
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Все пожертвования идут напрямую на турнирные призы XAOC
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6 font-mono text-xs">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">USDT (TRC-20)</span>
                  <span className="text-white font-bold tracking-wider">TLy5...9XqZ</span>
                </div>
                <button
                  onClick={() => copyToClipboard("TLy5XaocEsportsTrc20Address9XqZ", "usdt")}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copied === "usdt" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied === "usdt" ? "Скопировано" : "Копировать"}</span>
                </button>
              </div>

              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">TON (Telegram)</span>
                  <span className="text-white font-bold tracking-wider">EQD_xaoc_esports_prize</span>
                </div>
                <button
                  onClick={() => copyToClipboard("EQD_xaoc_esports_prize_pool_wallet", "ton")}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copied === "ton" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied === "ton" ? "Скопировано" : "Копировать"}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs font-mono text-amber-300 mb-4">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>После перевода напишите организаторам в Telegram, чтобы ваша команда или имя отобразились в списке спонсоров турнира!</span>
            </div>

            <a
              href="https://t.me/timmon6"
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:brightness-110"
            >
              <span>Связаться с Администратором</span>
              <ExternalLink size={14} />
            </a>
          </SpotlightCard>
        </div>
      )}
    </>
  );
}
