import React, { useState } from 'react';
import { Weapon, PlayerStats } from '../types/game';
import { WEAPONS } from '../data/gameData';
import { sound } from '../utils/audio';
import { Crosshair, Zap, Shield, Check, Volume2 } from 'lucide-react';

interface ArsenalShopProps {
  stats: PlayerStats;
  currentWeaponId: string;
  onEquipWeapon: (id: string) => void;
  onBuyWeapon: (id: string, cost: number) => void;
}

export const ArsenalShop: React.FC<ArsenalShopProps> = ({
  stats,
  currentWeaponId,
  onEquipWeapon,
  onBuyWeapon,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTestFire = (weapon: Weapon) => {
    setTestingId(weapon.id);
    sound.playGunshot(weapon.type);
    setTimeout(() => setTestingId(null), 250);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* Arsenal Header */}
      <div className="bg-[#102219] border border-[#234433] rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🔫</span>
            <h2 className="text-xl md:text-2xl font-black text-white font-display">
              Pahadi Weapons Armory
            </h2>
          </div>
          <p className="text-xs text-[#9bb3a4]">
            Upgrade firepower to wipe out rival gangs quickly. Test gunfire sound before equipping!
          </p>
        </div>

        {/* Player Cash / Points */}
        <div className="bg-[#152e22] border border-[#27573d] px-4 py-2.5 rounded-xl flex items-center gap-2">
          <span className="text-xs text-[#8cb09a]">Available Points:</span>
          <span className="text-lg font-black text-[#6fdc76] font-mono">
            ⭐ {stats.points}
          </span>
        </div>
      </div>

      {/* Weapon Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WEAPONS.map((weapon) => {
          const isEquipped = currentWeaponId === weapon.id;
          const isOwned = stats.ownedWeapons.includes(weapon.id) || weapon.cost === 0;
          const canAfford = stats.points >= weapon.cost;
          const isTesting = testingId === weapon.id;

          return (
            <div
              key={weapon.id}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isEquipped
                  ? 'bg-[#183928] border-[#6fdc76] shadow-xl shadow-emerald-950/30'
                  : 'bg-[#102219] border-[#224030] hover:bg-[#152a20]'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-transform ${
                        isTesting ? 'scale-125 rotate-6' : ''
                      } ${
                        isEquipped ? 'bg-[#27553c] text-white' : 'bg-[#162e22] text-[#86a292]'
                      }`}
                    >
                      {weapon.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white font-display">
                        {weapon.name}
                      </h3>
                      <span className="text-xs text-[#6fdc76] uppercase tracking-wider font-semibold">
                        {weapon.type}
                      </span>
                    </div>
                  </div>

                  {/* Test Fire Audio Synth Button */}
                  <button
                    onClick={() => handleTestFire(weapon)}
                    className="p-2 rounded-xl bg-[#162e22] hover:bg-[#204030] text-[#9bb3a4] hover:text-white border border-[#27533b] transition-colors"
                    title="Test Gunfire Sound"
                  >
                    <Volume2 className="w-4 h-4 text-[#6fdc76]" />
                  </button>
                </div>

                <p className="text-xs text-[#9bb3a4] mb-4 leading-relaxed">
                  {weapon.desc}
                </p>

                {/* Stat Meters */}
                <div className="space-y-2 text-xs mb-5">
                  {/* Damage */}
                  <div>
                    <div className="flex justify-between text-[#8ba797] mb-1">
                      <span>Damage per bullet:</span>
                      <span className="text-white font-bold">{weapon.damage} HP</span>
                    </div>
                    <div className="w-full bg-[#0d1a13] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-red-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, (weapon.damage / 180) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Mag Size */}
                  <div>
                    <div className="flex justify-between text-[#8ba797] mb-1">
                      <span>Magazine Capacity:</span>
                      <span className="text-white font-bold">{weapon.maxAmmo} Rounds</span>
                    </div>
                    <div className="w-full bg-[#0d1a13] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#6fdc76] h-full rounded-full"
                        style={{ width: `${Math.min(100, (weapon.maxAmmo / 30) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Reload Speed */}
                  <div>
                    <div className="flex justify-between text-[#8ba797] mb-1">
                      <span>Reload Speed:</span>
                      <span className="text-white font-bold">{(weapon.reloadTimeMs / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="w-full bg-[#0d1a13] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, (1 - weapon.reloadTimeMs / 2500) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#1b3628] flex items-center justify-between">
                <div>
                  {!isOwned && (
                    <span className="text-xs font-bold text-[#ffd166]">
                      Cost: ⭐ {weapon.cost} Pts
                    </span>
                  )}
                </div>

                <div>
                  {isEquipped ? (
                    <span className="px-4 py-2 rounded-xl bg-[#234f36] text-[#6fdc76] text-xs font-bold flex items-center gap-1.5 border border-[#3b7352]">
                      <Check className="w-4 h-4" />
                      <span>Equipped (सक्रिय)</span>
                    </span>
                  ) : isOwned ? (
                    <button
                      onClick={() => onEquipWeapon(weapon.id)}
                      className="px-5 py-2 rounded-xl bg-[#6fdc76] text-[#0c1a0f] text-xs font-bold hover:bg-[#5ec466] transition-colors shadow-md"
                    >
                      Equip (हथियार लो)
                    </button>
                  ) : (
                    <button
                      onClick={() => onBuyWeapon(weapon.id, weapon.cost)}
                      disabled={!canAfford}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                        canAfford
                          ? 'bg-[#ffd166] text-neutral-950 hover:bg-[#f6c24b] shadow-md'
                          : 'bg-[#1b3225] text-[#607d6d] cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Unlock Weapon' : 'Kam Points Hai'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
