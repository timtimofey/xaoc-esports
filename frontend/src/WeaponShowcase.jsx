import { useState } from "react";
import { Crosshair, Shield, Zap, Flame, Radio } from "lucide-react";
import SpotlightCard from "./components/reactbits/SpotlightCard";

const WEAPONS = [
  {
    name: "Beryl M762",
    category: "Штурмовая Винтовка",
    ammo: "7.62mm",
    damage: 44,
    fireRate: "860 RPM",
    velocity: "740 m/s",
    recoil: "Высокая",
    desc: "Максимальный урон на ближне-средних дистанциях. Выбор про-игроков PGC.",
  },
  {
    name: "M416",
    category: "Штурмовая Винтовка",
    ammo: "5.56mm",
    damage: 40,
    fireRate: "750 RPM",
    velocity: "880 m/s",
    recoil: "Стабильная",
    desc: "Самая сбалансированная винтовка с 5 слотами под обвесы.",
  },
  {
    name: "Dragunov",
    category: "DMR (Марксманская)",
    ammo: "7.62mm",
    damage: 58,
    fireRate: "Индивидуальный",
    velocity: "830 m/s",
    recoil: "Тяжелая",
    desc: "Шанс ваншота в шлем 2 уровня при повышенном уроне.",
  },
  {
    name: "Mini 14",
    category: "DMR (Марксманская)",
    ammo: "5.56mm",
    damage: 48,
    fireRate: "Быстрый полуавтомат",
    velocity: "990 m/s",
    recoil: "Минимальная",
    desc: "Самая высокая начальная скорость пули среди марксманских винтовок.",
  },
  {
    name: "AWM",
    category: "Снайперская Винтовка",
    ammo: ".300 Magnum",
    damage: 105,
    fireRate: "Болтовая",
    velocity: "945 m/s",
    recoil: "Высокая",
    desc: "Смертоносное аирдроп-оружие. Ваншот в 3 шлем.",
  },
  {
    name: "MP5K",
    category: "Пистолет-Пулемет",
    ammo: "9mm",
    damage: 33,
    fireRate: "900 RPM",
    velocity: "380 m/s",
    recoil: "Нулевая",
    desc: "Король ближнего боя на картах Vikendi и Karakin.",
  },
];

export default function WeaponShowcase() {
  const [selectedWeapon, setSelectedWeapon] = useState(WEAPONS[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white font-display uppercase tracking-wider">
            Арсенал PUBG: BATTLEGROUNDS
          </h2>
          <p className="text-xs font-mono text-gray-400 mt-1">
            Баллистические характеристики и параметры киберспортивного оружия
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weapons List */}
        <div className="space-y-2">
          {WEAPONS.map((w) => (
            <button
              key={w.name}
              onClick={() => setSelectedWeapon(w)}
              className={`w-full p-4 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                selectedWeapon.name === w.name
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  : "bg-[#0e1628]/60 border-white/5 text-gray-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <div>
                <h4 className="font-bold text-sm text-white">{w.name}</h4>
                <span className="text-[10px] font-mono text-gray-400 uppercase">{w.category}</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {w.ammo}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Weapon Detail */}
        <div className="md:col-span-2">
          <SpotlightCard
            spotlightColor="rgba(245, 158, 11, 0.2)"
            borderColor="rgba(245, 158, 11, 0.3)"
            className="p-6 sm:p-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
                  {selectedWeapon.category}
                </span>
                <h3 className="text-3xl font-black text-white font-display">{selectedWeapon.name}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Crosshair size={24} />
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed font-sans mb-8">
              {selectedWeapon.desc}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <Flame size={18} className="text-amber-400 mx-auto mb-2" />
                <span className="text-[10px] font-mono text-gray-400 uppercase block">Урон</span>
                <span className="text-xl font-mono font-black text-white">{selectedWeapon.damage}</span>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <Zap size={18} className="text-cyan-400 mx-auto mb-2" />
                <span className="text-[10px] font-mono text-gray-400 uppercase block">Скорострельность</span>
                <span className="text-xs font-mono font-bold text-white">{selectedWeapon.fireRate}</span>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <Radio size={18} className="text-emerald-400 mx-auto mb-2" />
                <span className="text-[10px] font-mono text-gray-400 uppercase block">Скорость Пули</span>
                <span className="text-xs font-mono font-bold text-white">{selectedWeapon.velocity}</span>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <Shield size={18} className="text-rose-400 mx-auto mb-2" />
                <span className="text-[10px] font-mono text-gray-400 uppercase block">Отдача</span>
                <span className="text-xs font-mono font-bold text-white">{selectedWeapon.recoil}</span>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
