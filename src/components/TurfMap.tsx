import React, { useState } from 'react';
import { Territory, PlayerStats } from '../types/game';
import { TERRITORIES, GANGS } from '../data/gameData';
import { MapPin, ShieldCheck, Swords, Mountain, Coins } from 'lucide-react';
import { sound } from '../utils/audio';

interface TurfMapProps {
  stats: PlayerStats;
  selectedTerritoryId: string;
  onSelectTerritory: (id: string) => void;
  onStartBattle: () => void;
  onClaimDailyTurfReward: (amount: number) => void;
}

export const TurfMap: React.FC<TurfMapProps> = ({
  stats,
  selectedTerritoryId,
  onSelectTerritory,
  onStartBattle,
  onClaimDailyTurfReward,
}) => {
  const [claimedToday, setClaimedToday] = useState(false);

  const conqueredCount = stats.conqueredTerritories.length;
  const passiveDailyIncome = conqueredCount * 50;

  const handleClaim = () => {
    if (claimedToday || passiveDailyIncome <= 0) return;
    sound.playVictory();
    onClaimDailyTurfReward(passiveDailyIncome);
    setClaimedToday(true);
  };

  const selectedTerritory = TERRITORIES.find((t) => t.id === selectedTerritoryId) || TERRITORIES[0];
  const rivalGang = GANGS.find((g) => g.id === selectedTerritory.enemyGangId) || GANGS[1];
  const isConquered = stats.conqueredTerritories.includes(selectedTerritory.id);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5">
      {/* Territory Overview Header */}
      <div className="bg-[#102219] border border-[#234433] rounded-2xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🏔️</span>
            <h2 className="text-xl md:text-2xl font-black text-white font-display">
              Uttarakhand Turf War Map
            </h2>
          </div>
          <p className="text-xs text-[#9bb3a4]">
            Himalayan territories under MR BAAZ control: <strong className="text-[#6fdc76]">{conqueredCount}</strong> / {TERRITORIES.length}
          </p>
        </div>

        {/* Territory Tax / Revenue Collector */}
        <div className="flex items-center gap-3 bg-[#152e22] border border-[#27573d] p-3 rounded-xl">
          <div>
            <div className="text-[11px] text-[#86a693]">Turf Daily Revenue</div>
            <div className="text-base font-black text-[#ffd166] flex items-center gap-1">
              <Coins className="w-4 h-4" />
              <span>+{passiveDailyIncome} Points</span>
            </div>
          </div>
          <button
            onClick={handleClaim}
            disabled={claimedToday || passiveDailyIncome <= 0}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              claimedToday || passiveDailyIncome <= 0
                ? 'bg-[#1b3427] text-[#607a6c] cursor-not-allowed'
                : 'bg-[#6fdc76] text-[#0c1a0f] hover:bg-[#5ec466] shadow-md'
            }`}
          >
            {claimedToday ? 'Claimed ✓' : 'Collect Revenue'}
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map Visual + Selected Turf Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Territory Cards List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-xs font-bold text-[#86a693] uppercase tracking-wider pl-1">
            Himalayan Sectors & Outposts
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TERRITORIES.map((territory, index) => {
              const isSelected = territory.id === selectedTerritoryId;
              const isCaptured = stats.conqueredTerritories.includes(territory.id);
              const rival = GANGS.find((g) => g.id === territory.enemyGangId) || GANGS[1];
              // First territory is unlocked by default, others unlocked if previous is conquered or unlocked in state
              const isUnlocked = index === 0 || stats.conqueredTerritories.includes(TERRITORIES[index - 1]?.id);

              return (
                <div
                  key={territory.id}
                  onClick={() => {
                    if (isUnlocked) {
                      onSelectTerritory(territory.id);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-[#183928] border-[#6fdc76] shadow-lg shadow-emerald-950/40'
                      : isCaptured
                      ? 'bg-[#12261c] border-[#29543b] hover:bg-[#163023]'
                      : isUnlocked
                      ? 'bg-[#102219] border-[#224030] hover:bg-[#162d22]'
                      : 'bg-[#0b1712] border-[#182a20] opacity-60 cursor-not-allowed'
                  }`}
                >
                  {/* Status Banner */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md border text-[11px]"
                      style={{
                        backgroundColor: isCaptured ? '#1b442b' : rival.badgeColor,
                        borderColor: isCaptured ? '#6fdc76' : rival.color,
                        color: isCaptured ? '#6fdc76' : rival.color,
                      }}
                    >
                      {isCaptured ? '🦅 MR BAAZ TURF' : `${rival.icon} ${rival.name}`}
                    </span>
                    <span className="text-[11px] font-mono text-[#829e8e]">
                      {territory.elevation}
                    </span>
                  </div>

                  {/* Territory Name & District */}
                  <h3 className="text-base font-bold text-white mb-0.5 font-display flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#6fdc76]" />
                    {territory.name}
                  </h3>
                  <p className="text-xs text-[#8ca898] mb-3">
                    District: {territory.district}
                  </p>

                  {/* Target & Rewards */}
                  <div className="flex items-center justify-between text-xs text-[#a0bcac] pt-2 border-t border-[#1e3c2c]">
                    <span>🎯 {territory.killsNeeded} Kills</span>
                    <span className="text-[#ffd166] font-bold">+{territory.rewardPoints} Pts</span>
                  </div>

                  {/* Lock Indicator if not unlocked */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-[#070f0be6] backdrop-blur-[1px] flex flex-col items-center justify-center text-xs text-[#7e9687]">
                      <span className="text-xl mb-1">🔒</span>
                      <span>Pichla Ilaka Jeeto Pehle</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Sector Intel Panel */}
        <div className="bg-[#102219] border border-[#234433] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="w-full h-36 rounded-xl overflow-hidden mb-4 relative border border-[#2b543c]">
              <img
                src="/src/assets/images/hero_gangwar_battlefield_1793539866962.jpg"
                alt={selectedTerritory.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09150eed] via-transparent to-transparent flex items-end p-3">
                <div>
                  <span className="text-[11px] font-bold text-[#6fdc76] tracking-wider uppercase">
                    Sector Reconnaissance
                  </span>
                  <h3 className="text-lg font-black text-white font-display">
                    {selectedTerritory.name}
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#1b3628]">
                <span className="text-[#84a391]">Status:</span>
                <span className={`font-bold ${isConquered ? 'text-[#6fdc76]' : 'text-amber-400'}`}>
                  {isConquered ? 'Controlled by MR BAAZ ✓' : 'Under Rival Occupation ⚠️'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1b3628]">
                <span className="text-[#84a391]">Rival Syndicate:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <span>{rivalGang.icon}</span>
                  <span>{rivalGang.name}</span>
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1b3628]">
                <span className="text-[#84a391]">Territory Boss:</span>
                <span className="font-bold text-red-400">
                  {selectedTerritory.bossName || 'None'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1b3628]">
                <span className="text-[#84a391]">Altitude:</span>
                <span className="font-mono text-white">{selectedTerritory.elevation}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#84a391]">Conquest Bounty:</span>
                <span className="font-bold text-[#ffd166]">+{selectedTerritory.rewardPoints} Points</span>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-[#1b3628]">
            <button
              onClick={onStartBattle}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6fdc76] to-[#49a85d] text-[#0c1a0f] text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Swords className="w-4 h-4" />
              <span>{isConquered ? 'Hamla Karo (Re-raid)' : 'Ilaka Chheeno (Attack Turf)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
