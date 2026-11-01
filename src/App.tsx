import React, { useState } from 'react';
import { GtaPahadiWorld } from './components/GtaPahadiWorld';
import { GangWarGame } from './components/GangWarGame';
import { TurfMap } from './components/TurfMap';
import { ArsenalShop } from './components/ArsenalShop';
import { TapChallenge } from './components/TapChallenge';
import { PlayerProfile } from './components/PlayerProfile';
import { WEAPONS, TERRITORIES, GANGS } from './data/gameData';
import { PlayerStats, Weapon, Territory } from './types/game';
import { sound } from './utils/audio';
import { Car, Swords, Map, Crosshair, Zap, User, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  // Navigation active tab: defaults to GTA Open World
  const [activeTab, setActiveTab] = useState<'gta' | 'game' | 'turf' | 'arsenal' | 'tap' | 'profile'>('gta');

  // Selected territory for battle
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string>('dehradun');

  // Selected gang filter
  const [selectedGangId, setSelectedGangId] = useState<string>('baaz');

  // Persistent Player Stats State
  const [stats, setStats] = useState<PlayerStats>(() => {
    const savedName = localStorage.getItem('mrbaaz_name') || 'MR BAAZ Don';
    const savedPoints = Number(localStorage.getItem('mrbaaz_points') || 250);
    const savedToday = Number(localStorage.getItem('mrbaaz_today') || 50);
    const savedKills = Number(localStorage.getItem('mrbaaz_kills') || 0);
    const savedHeadshots = Number(localStorage.getItem('mrbaaz_headshots') || 0);
    const savedShotsFired = Number(localStorage.getItem('mrbaaz_shots_fired') || 0);
    const savedShotsHit = Number(localStorage.getItem('mrbaaz_shots_hit') || 0);
    const savedCombo = Number(localStorage.getItem('mrbaaz_highest_combo') || 0);
    const savedWeapon = localStorage.getItem('mrbaaz_weapon') || 'desi_katta';

    let ownedWeapons = ['desi_katta'];
    try {
      const stored = localStorage.getItem('mrbaaz_owned_weapons');
      if (stored) ownedWeapons = JSON.parse(stored);
    } catch {
      // fallback
    }

    let conqueredTerritories: string[] = [];
    try {
      const stored = localStorage.getItem('mrbaaz_conquered');
      if (stored) conqueredTerritories = JSON.parse(stored);
    } catch {
      // fallback
    }

    return {
      playerName: savedName,
      points: savedPoints,
      todayPoints: savedToday,
      totalKills: savedKills,
      headshots: savedHeadshots,
      shotsFired: savedShotsFired,
      shotsHit: savedShotsHit,
      highestCombo: savedCombo,
      equippedWeaponId: savedWeapon,
      ownedWeapons,
      conqueredTerritories,
      unlockedBadges: [],
    };
  });

  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // Save to localStorage when stats change
  const handleUpdateStats = (newPartial: Partial<PlayerStats>) => {
    setStats((prev) => {
      const updated = { ...prev, ...newPartial };
      localStorage.setItem('mrbaaz_name', updated.playerName);
      localStorage.setItem('mrbaaz_points', String(updated.points));
      localStorage.setItem('mrbaaz_today', String(updated.todayPoints));
      localStorage.setItem('mrbaaz_kills', String(updated.totalKills));
      localStorage.setItem('mrbaaz_headshots', String(updated.headshots));
      localStorage.setItem('mrbaaz_shots_fired', String(updated.shotsFired));
      localStorage.setItem('mrbaaz_shots_hit', String(updated.shotsHit));
      localStorage.setItem('mrbaaz_highest_combo', String(updated.highestCombo));
      localStorage.setItem('mrbaaz_weapon', updated.equippedWeaponId);
      localStorage.setItem('mrbaaz_owned_weapons', JSON.stringify(updated.ownedWeapons));
      localStorage.setItem('mrbaaz_conquered', JSON.stringify(updated.conqueredTerritories));
      return updated;
    });
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleEquipWeapon = (weaponId: string) => {
    sound.playReload();
    handleUpdateStats({ equippedWeaponId: weaponId });
  };

  const handleBuyWeapon = (weaponId: string, cost: number) => {
    if (stats.points < cost) return;
    sound.playVictory();
    const newOwned = Array.from(new Set([...stats.ownedWeapons, weaponId]));
    handleUpdateStats({
      points: stats.points - cost,
      ownedWeapons: newOwned,
      equippedWeaponId: weaponId,
    });
  };

  const currentWeapon = WEAPONS.find((w) => w.id === stats.equippedWeaponId) || WEAPONS[0];
  const currentTerritory = TERRITORIES.find((t) => t.id === selectedTerritoryId) || TERRITORIES[0];

  const handleNextTerritory = () => {
    const currentIndex = TERRITORIES.findIndex((t) => t.id === selectedTerritoryId);
    if (currentIndex < TERRITORIES.length - 1) {
      setSelectedTerritoryId(TERRITORIES[currentIndex + 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-[#060e09] text-[#f4fff6] flex flex-col font-sans selection:bg-[#00ff00] selection:text-[#000000]">
      {/* Top Bar following Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-50 bg-[#09150ee8] backdrop-blur-md border-b border-[#1b3d28] px-4 md:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => setActiveTab('gta')}
            className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00ff00] to-[#005a14] flex items-center justify-center font-black text-black text-sm shadow-[0_0_15px_#00ff00] group-hover:scale-105 transition-transform">
              MB
            </div>
            <div className="leading-tight">
              <span className="text-base md:text-lg font-black tracking-wider text-white font-display block">
                PAHADI WAR
              </span>
              <span className="text-[10px] text-[#00ff00] font-black tracking-widest block uppercase">
                GTA 5 PAHADI EDITION
              </span>
            </div>
          </button>

          {/* Zone 2: 5 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-[#8ba595]">
            <button
              onClick={() => setActiveTab('gta')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 ${
                activeTab === 'gta' ? 'text-[#00ff00] border-b-2 border-[#00ff00]' : ''
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>GTA World (Open Map)</span>
            </button>

            <button
              onClick={() => setActiveTab('game')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 ${
                activeTab === 'game' ? 'text-[#00ff00] border-b-2 border-[#00ff00]' : ''
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Gang War (Gallery)</span>
            </button>

            <button
              onClick={() => setActiveTab('turf')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 ${
                activeTab === 'turf' ? 'text-[#00ff00] border-b-2 border-[#00ff00]' : ''
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Turf Map</span>
            </button>

            <button
              onClick={() => setActiveTab('arsenal')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 ${
                activeTab === 'arsenal' ? 'text-[#00ff00] border-b-2 border-[#00ff00]' : ''
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Arsenal</span>
            </button>

            <button
              onClick={() => setActiveTab('tap')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 ${
                activeTab === 'tap' ? 'text-[#00ff00] border-b-2 border-[#00ff00]' : ''
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Tap Sprint</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 py-1 ${
                activeTab === 'profile' ? 'text-[#00ff00] border-b-2 border-[#00ff00]' : ''
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action / metric cluster */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Turn on sound' : 'Mute sound'}
              className="p-2 rounded-xl bg-[#102418] text-[#86a793] hover:text-white border border-[#20452e] transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#00ff00]" />}
            </button>

            <div className="flex items-center gap-1.5 bg-[#102418] px-3.5 py-1.5 rounded-xl border border-[#20452e] whitespace-nowrap shrink-0">
              <span className="text-xs text-[#8cb09a]">⭐ Pts:</span>
              <span className="text-sm font-black text-[#00ff00] font-mono tabular-nums">
                {stats.points}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 pb-28 md:pb-12">
        {activeTab === 'gta' && (
          <GtaPahadiWorld
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onSwitchToArcade={() => setActiveTab('game')}
          />
        )}

        {activeTab === 'game' && (
          <GangWarGame
            currentTerritory={currentTerritory}
            currentWeapon={currentWeapon}
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onNextTerritory={handleNextTerritory}
            onGoToArsenal={() => setActiveTab('arsenal')}
            selectedGangId={selectedGangId}
            onSelectGang={setSelectedGangId}
          />
        )}

        {activeTab === 'turf' && (
          <TurfMap
            stats={stats}
            selectedTerritoryId={selectedTerritoryId}
            onSelectTerritory={setSelectedTerritoryId}
            onStartBattle={() => setActiveTab('game')}
            onClaimDailyTurfReward={(amount) => {
              handleUpdateStats({
                points: stats.points + amount,
                todayPoints: stats.todayPoints + amount,
              });
            }}
          />
        )}

        {activeTab === 'arsenal' && (
          <ArsenalShop
            stats={stats}
            currentWeaponId={stats.equippedWeaponId}
            onEquipWeapon={handleEquipWeapon}
            onBuyWeapon={handleBuyWeapon}
          />
        )}

        {activeTab === 'tap' && (
          <TapChallenge
            stats={stats}
            onUpdateStats={handleUpdateStats}
          />
        )}

        {activeTab === 'profile' && (
          <PlayerProfile
            stats={stats}
            onUpdateStats={handleUpdateStats}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#07130ae8] backdrop-blur-lg border-t border-[#1b3d28] px-2 py-2 flex justify-around">
        <button
          onClick={() => setActiveTab('gta')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            activeTab === 'gta' ? 'text-[#00ff00] bg-[#122b1b]' : 'text-[#84a391]'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>GTA World</span>
        </button>

        <button
          onClick={() => setActiveTab('game')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            activeTab === 'game' ? 'text-[#00ff00] bg-[#122b1b]' : 'text-[#84a391]'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Gang War</span>
        </button>

        <button
          onClick={() => setActiveTab('turf')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            activeTab === 'turf' ? 'text-[#00ff00] bg-[#122b1b]' : 'text-[#84a391]'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Turf</span>
        </button>

        <button
          onClick={() => setActiveTab('arsenal')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            activeTab === 'arsenal' ? 'text-[#00ff00] bg-[#122b1b]' : 'text-[#84a391]'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>Arsenal</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            activeTab === 'profile' ? 'text-[#00ff00] bg-[#122b1b]' : 'text-[#84a391]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="border-t border-[#132c1c] py-4 text-center text-xs text-[#6e927b]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PAHADI WAR: GTA 5 PAHADI EDITION © MR BAAZ Uttarakhand</span>
          <span className="text-[11px] text-[#4f745d]">
            Top-Down Open World · Drive 4x4 Thar Jeep · UK Police Wanted Stars
          </span>
        </div>
      </footer>
    </div>
  );
}
