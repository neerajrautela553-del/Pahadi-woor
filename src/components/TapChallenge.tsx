import React, { useState, useRef } from 'react';
import { PlayerStats } from '../types/game';
import { sound } from '../utils/audio';
import { RotateCcw, Zap, Trophy, Timer } from 'lucide-react';

interface TapChallengeProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
}

export const TapChallenge: React.FC<TapChallengeProps> = ({ stats, onUpdateStats }) => {
  const [roundScore, setRoundScore] = useState(0);
  const [message, setMessage] = useState('Shuru karne ke liye target tap karo!');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finishTime, setFinishTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('mrbaaz_best_tap_time');
    return saved ? parseFloat(saved) : null;
  });
  const [targetScale, setTargetScale] = useState(false);

  const handleTap = () => {
    // Start stopwatch on first tap
    if (roundScore === 0) {
      setStartTime(Date.now());
      setFinishTime(null);
    }

    if (roundScore >= 10) {
      setMessage('Round complete! Reset karke phir khelo.');
      return;
    }

    const nextScore = roundScore + 1;
    setRoundScore(nextScore);

    // Audio and feedback
    sound.playHit();
    setTargetScale(true);
    setTimeout(() => setTargetScale(false), 90);

    // Award points
    const newPoints = stats.points + 1;
    const newToday = stats.todayPoints + 1;

    if (nextScore >= 10) {
      sound.playVictory();
      const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
      setFinishTime(elapsed);

      let newBest = bestTime;
      if (!bestTime || elapsed < bestTime) {
        newBest = parseFloat(elapsed.toFixed(2));
        setBestTime(newBest);
        localStorage.setItem('mrbaaz_best_tap_time', String(newBest));
      }

      setMessage(`Shabash! Round complete in ${elapsed.toFixed(2)}s! 🎉 +10 Bonus points!`);
      onUpdateStats({
        points: newPoints + 10,
        todayPoints: newToday + 10,
      });
    } else {
      setMessage(nextScore > 6 ? 'Bohat tez! Aur thoda!' : 'Nice! Agla tap karo.');
      onUpdateStats({
        points: newPoints,
        todayPoints: newToday,
      });
    }
  };

  const handleReset = () => {
    setRoundScore(0);
    setStartTime(null);
    setFinishTime(null);
    setMessage('Shuru karne ke liye target tap karo!');
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      {/* Header Card */}
      <div className="bg-[#102219] border border-[#234433] rounded-2xl p-5 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1b3a29] text-[#6fdc76] text-xs font-bold mb-2">
          <span>⚡ QUICK REFLEX GAME</span>
        </div>
        <h2 className="text-2xl font-black text-white font-display mb-1">
          🎯 10-Tap Mountain Challenge
        </h2>
        <p className="text-xs text-[#9bb3a4] max-w-md mx-auto">
          Target par 10 baar jitna tez ho sake tap karo. Har tap par demo point aur speed bonus milega!
        </p>
      </div>

      {/* Main Play Arena Card */}
      <div className="bg-[#142720] border border-[#294239] rounded-3xl p-6 md:p-8 text-center shadow-xl">
        {/* Counter */}
        <div className="text-xs text-[#9bb3a4] uppercase font-bold tracking-wider mb-1">
          Round Score
        </div>
        <div className="text-5xl font-black text-[#6fdc76] font-mono tracking-tight mb-4">
          <span>{roundScore}</span>
          <span className="text-2xl text-[#60806e]">/10</span>
        </div>

        {/* Big Tap Target with Pop Effect */}
        <div className="my-6">
          <button
            onClick={handleTap}
            className={`w-36 h-36 mx-auto rounded-3xl bg-gradient-to-br from-[#1d4430] to-[#10291d] border-2 border-[#417a56] hover:border-[#6fdc76] active:bg-[#25573e] flex items-center justify-center text-7xl select-none transition-transform duration-75 shadow-2xl shadow-emerald-950/60 cursor-pointer ${
              targetScale ? 'scale-90 rotate-3' : 'hover:scale-105 active:scale-95'
            }`}
          >
            🏔️
          </button>
        </div>

        {/* Dynamic Status Message */}
        <p className="text-sm font-semibold text-[#e1efe5] min-h-[24px] mb-6">
          {message}
        </p>

        {/* Speed / Time Records */}
        <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-6 text-xs">
          <div className="bg-[#0e1d17] border border-[#1f3c2c] p-2.5 rounded-xl">
            <div className="text-[#84a391] flex items-center justify-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              <span>Current Time</span>
            </div>
            <div className="text-base font-bold text-white font-mono mt-0.5">
              {finishTime ? `${finishTime.toFixed(2)}s` : '--'}
            </div>
          </div>
          <div className="bg-[#0e1d17] border border-[#1f3c2c] p-2.5 rounded-xl">
            <div className="text-[#84a391] flex items-center justify-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-[#ffd166]" />
              <span>Best Sprint</span>
            </div>
            <div className="text-base font-bold text-[#ffd166] font-mono mt-0.5">
              {bestTime ? `${bestTime}s` : '--'}
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="px-6 py-2.5 rounded-xl bg-[#233d31] hover:bg-[#2b4c3d] text-white text-xs font-bold border border-[#375e48] transition-colors inline-flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Challenge</span>
        </button>
      </div>

      {/* Notice & Disclaimer directly matching user brief */}
      <div className="bg-[#342d18] border border-[#67542a] text-[#ffe6a6] rounded-2xl p-4 text-xs leading-relaxed">
        ⚠️ <strong>Prototype Demo Note:</strong> Points app ke andar hi hain. Real-money rewards ke liye secure server, rules, testing aur legal/payment setup chahiye.
      </div>
    </div>
  );
};
