import React, { useState } from 'react';
import { PlayerStats } from '../types/game';
import { BADGES, TERRITORIES, WEAPONS } from '../data/gameData';
import { User, Award, Shield, Target, Crosshair, Flame, Sparkles, Smartphone, Check } from 'lucide-react';

interface PlayerProfileProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ stats, onUpdateStats }) => {
  const [nameInput, setNameInput] = useState(stats.playerName);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim();
    if (!clean) return;
    onUpdateStats({ playerName: clean });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  // Calculate Title / Rank
  let rankTitle = 'Pahadi Recruit (भर्ती)';
  if (stats.totalKills >= 50 || stats.conqueredTerritories.length >= 4) {
    rankTitle = 'MR BAAZ Supreme Sardar (पहाड़ का शेर) 🦅';
  } else if (stats.totalKills >= 25 || stats.conqueredTerritories.length >= 2) {
    rankTitle = 'Mountain Sharpshooter (निशानेबाज) 🎯';
  } else if (stats.totalKills >= 10) {
    rankTitle = 'Doon Enforcer (पहलवान) 🐯';
  }

  // Calculate Accuracy
  const accuracy = stats.shotsFired > 0
    ? Math.min(100, Math.round((stats.shotsHit / stats.shotsFired) * 100))
    : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Profile Header & Badge Banner */}
      <div className="bg-[#102219] border border-[#234433] rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10">
          {/* Avatar with MR BAAZ crest */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#6fdc76] bg-[#1a3826] shrink-0 shadow-lg shadow-emerald-950/50">
            <img
              src="/src/assets/images/mascot_mr_baaz_1793539883952.jpg"
              alt="MR BAAZ Eagle"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="inline-block px-3 py-0.5 rounded-full bg-[#1b3e2a] text-[#6fdc76] text-xs font-bold border border-[#2c6142] mb-1.5">
              {rankTitle}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white font-display mb-1">
              {stats.playerName}
            </h2>
            <p className="text-xs text-[#9cb6a6]">
              Uttarakhand Fighter · BAAZ Gang Member · Total Points: <span className="text-[#ffd166] font-bold">⭐ {stats.points}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Edit Name Form */}
      <div className="bg-[#12241b] border border-[#234433] rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-[#6fdc76]" />
          <span>Edit Player Name</span>
        </h3>
        <form onSubmit={handleSaveName} className="flex gap-2">
          <input
            type="text"
            value={nameInput}
            maxLength={24}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Apna player naam likho..."
            className="flex-1 bg-[#09150f] border border-[#244b36] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#607d6d] focus:outline-none focus:border-[#6fdc76]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#6fdc76] hover:bg-[#5ec466] text-[#0c1a0f] text-xs font-black transition-colors shrink-0 flex items-center gap-1.5"
          >
            {savedFeedback ? <Check className="w-4 h-4" /> : null}
            <span>{savedFeedback ? 'Saved!' : 'Save Name'}</span>
          </button>
        </form>
      </div>

      {/* Combat Lifetime Stats Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#8ba595] uppercase tracking-wider pl-1">
          Lifetime Combat Record
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#12241b] border border-[#224030] p-4 rounded-2xl text-center">
            <div className="text-xs text-[#829e8e] mb-1 flex items-center justify-center gap-1">
              <Target className="w-3.5 h-3.5 text-[#6fdc76]" />
              <span>Total Kills</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">{stats.totalKills}</div>
          </div>

          <div className="bg-[#12241b] border border-[#224030] p-4 rounded-2xl text-center">
            <div className="text-xs text-[#829e8e] mb-1 flex items-center justify-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-[#ffd166]" />
              <span>Headshots</span>
            </div>
            <div className="text-2xl font-black text-[#ffd166] font-mono">{stats.headshots}</div>
          </div>

          <div className="bg-[#12241b] border border-[#224030] p-4 rounded-2xl text-center">
            <div className="text-xs text-[#829e8e] mb-1 flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Best Combo</span>
            </div>
            <div className="text-2xl font-black text-orange-400 font-mono">{stats.highestCombo}x</div>
          </div>

          <div className="bg-[#12241b] border border-[#224030] p-4 rounded-2xl text-center">
            <div className="text-xs text-[#829e8e] mb-1 flex items-center justify-center gap-1">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Accuracy</span>
            </div>
            <div className="text-2xl font-black text-sky-400 font-mono">{accuracy}%</div>
          </div>
        </div>
      </div>

      {/* Badges / Trophies Showcase */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#8ba595] uppercase tracking-wider pl-1">
          Himalayan Badges & Honors
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {BADGES.map((badge) => {
            // Check condition
            let isUnlocked = false;
            if (badge.reqKills && stats.totalKills >= badge.reqKills) isUnlocked = true;
            if (badge.reqPoints && stats.points >= badge.reqPoints) isUnlocked = true;
            if (badge.reqHeadshots && stats.headshots >= badge.reqHeadshots) isUnlocked = true;
            if (badge.reqCombo && stats.highestCombo >= badge.reqCombo) isUnlocked = true;
            if (badge.reqTurfs && stats.conqueredTerritories.length >= badge.reqTurfs) isUnlocked = true;
            if (badge.reqWeapons && stats.ownedWeapons.length >= badge.reqWeapons) isUnlocked = true;

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? 'bg-[#163323] border-[#39724e]'
                    : 'bg-[#0f1f17] border-[#1c3326] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{badge.icon}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isUnlocked
                        ? 'bg-[#295e3d] text-[#6fdc76]'
                        : 'bg-[#1b2b22] text-[#668071]'
                    }`}
                  >
                    {isUnlocked ? 'UNLOCKED ✓' : 'LOCKED'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-0.5">{badge.name}</h4>
                <p className="text-xs text-[#8ca898] leading-snug">{badge.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Earning & APK Development Roadmap FAQ */}
      <div className="bg-[#12241b] border border-[#234433] rounded-3xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#6fdc76]" />
          <span>Real Earning & APK Publishing Roadmap</span>
        </h3>

        <div className="space-y-3 text-xs text-[#a2bea9] leading-relaxed">
          <div className="bg-[#0b1812] border border-[#1d3b2b] p-3.5 rounded-xl">
            <strong className="text-white block mb-1">💰 Real earning kaise hogi?</strong>
            App popular hone par Google AdMob ads, in-app currency, ya tournament leaderboards se earning ho sakti hai. Iske liye real user base, Google Play Developer account, privacy policy, platform compliance aur secure server backend zaroori hote hain.
          </div>

          <div className="bg-[#0b1812] border border-[#1d3b2b] p-3.5 rounded-xl">
            <strong className="text-white block mb-1">🚀 Mobile Browser se Play Store APK kaise banta hai?</strong>
            Ye app already mobile-responsive hai. Agle step mein Capacitor.js ya Android Studio se wrapper APK banaya jata hai jise Google Play Console par publish kiya ja sakta hai.
          </div>

          <div className="bg-[#0b1812] border border-[#1d3b2b] p-3.5 rounded-xl">
            <strong className="text-white block mb-1">🎮 Agle Version Features</strong>
            Village map 3D visual updates, pahadi music instruments (Dhol Damau, Ransingha sound tracks), live multiplayer room challenge, aur vehicle driving missions!
          </div>
        </div>
      </div>
    </div>
  );
};
