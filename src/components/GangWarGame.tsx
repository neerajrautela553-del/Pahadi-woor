import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Weapon, Territory, Enemy, PlayerStats } from '../types/game';
import { GANGS, TRASH_TALK_QUOTES } from '../data/gameData';
import { sound } from '../utils/audio';
import { Crosshair, RotateCcw, Volume2, VolumeX, ShieldAlert, Zap, Flame, Trophy } from 'lucide-react';

interface GangWarGameProps {
  currentTerritory: Territory;
  currentWeapon: Weapon;
  stats: PlayerStats;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
  onNextTerritory?: () => void;
  onGoToArsenal: () => void;
  selectedGangId: string;
  onSelectGang: (id: string) => void;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  isHeadshot?: boolean;
}

interface BulletHole {
  id: number;
  x: number;
  y: number;
}

export const GangWarGame: React.FC<GangWarGameProps> = ({
  currentTerritory,
  currentWeapon,
  stats,
  onUpdateStats,
  onNextTerritory,
  onGoToArsenal,
  selectedGangId,
  onSelectGang,
}) => {
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'WAVE_WON' | 'GAME_OVER'>('READY');
  const [currentAmmo, setCurrentAmmo] = useState(currentWeapon.maxAmmo);
  const [isReloading, setIsReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(100);
  const [waveKills, setWaveKills] = useState(0);
  const [waveHeadshots, setWaveHeadshots] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxWaveCombo, setMaxWaveCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45); // 45 seconds timer
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [bulletHoles, setBulletHoles] = useState<BulletHole[]>([]);
  const [muzzleFlash, setMuzzleFlash] = useState<{ active: boolean; x: number; y: number }>({ active: false, x: 50, y: 50 });
  const [isRecoiling, setIsRecoiling] = useState(false);
  const [bossActive, setBossActive] = useState(false);
  const [bossEnemy, setBossEnemy] = useState<Enemy | null>(null);

  const arenaRef = useRef<HTMLDivElement>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const gameClockRef = useRef<number | null>(null);
  const textIdCounter = useRef(0);
  const holeIdCounter = useRef(0);

  // Sync weapon ammo when current weapon changes
  useEffect(() => {
    setCurrentAmmo(currentWeapon.maxAmmo);
    setIsReloading(false);
  }, [currentWeapon]);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const addFloatingText = (text: string, x: number, y: number, color: string = '#6fdc76', isHeadshot = false) => {
    const id = ++textIdCounter.current;
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color, isHeadshot }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 750);
  };

  // Reload action
  const handleReload = useCallback(() => {
    if (isReloading || currentAmmo === currentWeapon.maxAmmo) return;
    setIsReloading(true);
    setReloadProgress(0);
    sound.playReload();

    const intervalTime = 50;
    const steps = currentWeapon.reloadTimeMs / intervalTime;
    let stepCount = 0;

    const interval = window.setInterval(() => {
      stepCount++;
      setReloadProgress(Math.min(100, Math.round((stepCount / steps) * 100)));

      if (stepCount >= steps) {
        window.clearInterval(interval);
        setCurrentAmmo(currentWeapon.maxAmmo);
        setIsReloading(false);
        setReloadProgress(100);
      }
    }, intervalTime);
  }, [isReloading, currentAmmo, currentWeapon]);

  // Keyboard shortcut for reload (R or Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'PLAYING') {
        if (e.key.toLowerCase() === 'r' || e.key === ' ') {
          e.preventDefault();
          handleReload();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleReload]);

  // Spawn regular enemy
  const spawnEnemy = useCallback(() => {
    if (gameState !== 'PLAYING') return;

    // Fixed realistic mountain hideout spots (percentage of arena)
    const coverSpots = [
      { x: 18, y: 46 }, // Behind left pine tree
      { x: 32, y: 55 }, // Beside the vintage jeep hood
      { x: 48, y: 38 }, // Hill trail curve
      { x: 67, y: 32 }, // Watchtower balcony
      { x: 82, y: 44 }, // Cabin doorway
      { x: 26, y: 34 }, // Distant ridge rock
      { x: 58, y: 56 }, // Near jeep tailgate
      { x: 88, y: 58 }, // Right outpost logs
    ];

    const spot = coverSpots[Math.floor(Math.random() * coverSpots.length)];
    // Slight random jitter
    const x = Math.min(88, Math.max(12, spot.x + (Math.random() * 8 - 4)));
    const y = Math.min(68, Math.max(28, spot.y + (Math.random() * 6 - 3)));

    const randomQuote = TRASH_TALK_QUOTES[Math.floor(Math.random() * TRASH_TALK_QUOTES.length)];
    const rivalGang = currentTerritory.enemyGangId;

    const newEnemy: Enemy = {
      id: `enemy_${Date.now()}_${Math.random()}`,
      gangId: rivalGang,
      x,
      y,
      maxHp: 70,
      currentHp: 70,
      quote: randomQuote,
      spawnTime: Date.now(),
      durationMs: Math.max(2200, 3800 - waveKills * 80), // faster as wave progresses
      isDead: false,
      isDying: false,
      isHit: false,
    };

    setEnemies((prev) => {
      // Keep maximum 3 active enemies simultaneously for clean tactical gameplay
      if (prev.length >= 3) return prev;
      return [...prev, newEnemy];
    });
  }, [gameState, waveKills, currentTerritory.enemyGangId]);

  // Spawn Boss
  const triggerBoss = useCallback(() => {
    setBossActive(true);
    sound.playBossAlert();

    const boss: Enemy = {
      id: `boss_${Date.now()}`,
      gangId: currentTerritory.enemyGangId,
      x: 50,
      y: 40,
      maxHp: currentTerritory.bossHealth || 350,
      currentHp: currentTerritory.bossHealth || 350,
      isBoss: true,
      bossName: currentTerritory.bossName || 'Gang Boss',
      quote: `Mai hu ${currentTerritory.bossName}! BAAZ ko yahan se bhaga dunga!`,
      spawnTime: Date.now(),
      durationMs: 999999, // Boss stays until defeated
      isDead: false,
      isDying: false,
      isHit: false,
    };
    setBossEnemy(boss);
    setEnemies([]); // clear minions for epic boss duel
  }, [currentTerritory]);

  // Game clock and enemy cleanup loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    // Timer countdown
    gameClockRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired
          setGameState('GAME_OVER');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Enemy spawn loop
    spawnTimerRef.current = window.setInterval(() => {
      if (!bossActive) {
        spawnEnemy();
      }
    }, 1100);

    // Enemy lifetime expiration loop
    const cleanupInterval = window.setInterval(() => {
      const now = Date.now();
      setEnemies((prev) =>
        prev.filter((enemy) => {
          if (enemy.isBoss) return true;
          if (enemy.isDead) return false;
          // Enemy escaped
          const expired = now - enemy.spawnTime > enemy.durationMs;
          if (expired) {
            // Drop combo if enemy escapes without being hit
            setCombo(0);
          }
          return !expired;
        })
      );
    }, 300);

    return () => {
      if (gameClockRef.current) clearInterval(gameClockRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      clearInterval(cleanupInterval);
    };
  }, [gameState, bossActive, spawnEnemy]);

  // Check victory condition
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    // If reached kill quota and boss not active, spawn boss!
    if (waveKills >= currentTerritory.killsNeeded - 1 && !bossActive && currentTerritory.bossName) {
      triggerBoss();
    }
  }, [waveKills, currentTerritory, bossActive, gameState, triggerBoss]);

  // Start game session
  const startGame = () => {
    setGameState('PLAYING');
    setCurrentAmmo(currentWeapon.maxAmmo);
    setIsReloading(false);
    setWaveKills(0);
    setWaveHeadshots(0);
    setCombo(0);
    setMaxWaveCombo(0);
    setTimeLeft(50);
    setEnemies([]);
    setBossActive(false);
    setBossEnemy(null);
    setBulletHoles([]);
  };

  // Gun trigger click inside arena
  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'PLAYING') return;

    const rect = arenaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Check ammo
    if (currentAmmo <= 0 || isReloading) {
      sound.playEmpty();
      addFloatingText('RELOAD! (R)', clickX, clickY, '#f87171');
      handleReload();
      return;
    }

    // Fire weapon!
    setCurrentAmmo((prev) => prev - 1);
    sound.playGunshot(currentWeapon.type);

    // Recoil and muzzle flash
    setIsRecoiling(true);
    setTimeout(() => setIsRecoiling(false), 120);

    setMuzzleFlash({ active: true, x: clickX, y: clickY });
    setTimeout(() => setMuzzleFlash((prev) => ({ ...prev, active: false })), 90);

    // Record shot
    onUpdateStats({
      shotsFired: stats.shotsFired + 1,
    });

    // Add bullet mark
    const holeId = ++holeIdCounter.current;
    setBulletHoles((prev) => [...prev.slice(-8), { id: holeId, x: clickX, y: clickY }]);
  };

  // Target Hit handler (called when clicking an enemy)
  const handleHitEnemy = (
    e: React.MouseEvent,
    enemy: Enemy,
    isHead: boolean
  ) => {
    e.stopPropagation(); // prevent double trigger with arena
    if (gameState !== 'PLAYING' || isReloading || currentAmmo <= 0) {
      handleArenaClick(e as unknown as React.MouseEvent<HTMLDivElement>);
      return;
    }

    // Spend bullet
    setCurrentAmmo((prev) => prev - 1);
    sound.playGunshot(currentWeapon.type);

    // Trigger visual shot effects
    setIsRecoiling(true);
    setTimeout(() => setIsRecoiling(false), 120);

    const rect = arenaRef.current?.getBoundingClientRect();
    const clickX = rect ? ((e.clientX - rect.left) / rect.width) * 100 : enemy.x;
    const clickY = rect ? ((e.clientY - rect.top) / rect.height) * 100 : enemy.y;

    setMuzzleFlash({ active: true, x: clickX, y: clickY });
    setTimeout(() => setMuzzleFlash((prev) => ({ ...prev, active: false })), 90);

    // Calculate damage
    let damage = currentWeapon.damage;
    if (isHead) {
      damage = Math.round(damage * 2.2); // Headshot multiplier
      sound.playHeadshot();
      addFloatingText('🎯 HEADSHOT! +150', clickX, clickY - 8, '#ffd166', true);
    } else {
      sound.playHit();
      addFloatingText(`💥 HIT! -${damage}`, clickX, clickY - 5, '#6fdc76');
    }

    // Update combo
    const newCombo = combo + 1;
    setCombo(newCombo);
    if (newCombo > maxWaveCombo) setMaxWaveCombo(newCombo);
    if (newCombo >= 3) {
      sound.playCombo(newCombo);
      addFloatingText(`${newCombo}x COMBO!`, clickX, clickY - 14, '#38bdf8');
    }

    // Handle Boss Hit vs Minion Hit
    if (enemy.isBoss && bossEnemy) {
      const remainingHp = Math.max(0, bossEnemy.currentHp - damage);
      setBossEnemy({ ...bossEnemy, currentHp: remainingHp, isHit: true });

      setTimeout(() => {
        setBossEnemy((prev) => prev ? { ...prev, isHit: false } : null);
      }, 150);

      if (remainingHp <= 0) {
        // Boss Defeated!
        sound.playVictory();
        setBossActive(false);
        setBossEnemy(null);
        handleWaveVictory();
      }
    } else {
      // Minion Hit
      const remainingHp = Math.max(0, enemy.currentHp - damage);

      if (remainingHp <= 0) {
        // Minion killed!
        const earnedPoints = isHead ? 40 : 25;
        const newKills = waveKills + 1;
        setWaveKills(newKills);
        if (isHead) setWaveHeadshots((prev) => prev + 1);

        onUpdateStats({
          points: stats.points + earnedPoints,
          todayPoints: stats.todayPoints + earnedPoints,
          totalKills: stats.totalKills + 1,
          headshots: stats.headshots + (isHead ? 1 : 0),
          shotsHit: stats.shotsHit + 1,
          highestCombo: Math.max(stats.highestCombo, newCombo),
        });

        // Set enemy dying animation then remove
        setEnemies((prev) =>
          prev.map((item) => (item.id === enemy.id ? { ...item, isDead: true, currentHp: 0 } : item))
        );

        setTimeout(() => {
          setEnemies((prev) => prev.filter((item) => item.id !== enemy.id));
        }, 220);

        // Check if wave finished (if no boss required)
        if (newKills >= currentTerritory.killsNeeded && !currentTerritory.bossName) {
          handleWaveVictory();
        }
      } else {
        // Enemy damaged but alive
        setEnemies((prev) =>
          prev.map((item) =>
            item.id === enemy.id ? { ...item, currentHp: remainingHp, isHit: true } : item
          )
        );
        setTimeout(() => {
          setEnemies((prev) =>
            prev.map((item) => (item.id === enemy.id ? { ...item, isHit: false } : item))
          );
        }, 150);
      }
    }
  };

  const handleWaveVictory = () => {
    sound.playVictory();
    setGameState('WAVE_WON');

    const bonusReward = currentTerritory.rewardPoints;
    const newConquered = Array.from(new Set([...stats.conqueredTerritories, currentTerritory.id]));

    onUpdateStats({
      points: stats.points + bonusReward,
      todayPoints: stats.todayPoints + bonusReward,
      conqueredTerritories: newConquered,
    });
  };

  const selectedGang = GANGS.find((g) => g.id === selectedGangId) || GANGS[0];
  const rivalGang = GANGS.find((g) => g.id === currentTerritory.enemyGangId) || GANGS[1];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Top Gang Banner & Quick Selector */}
      <div className="bg-[#102219] border border-[#234433] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6fdc76] to-[#2e7d42] flex items-center justify-center text-2xl font-black text-[#0c1a0f] shadow-md shadow-emerald-950/50">
            {selectedGang.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-wide font-display">
                {selectedGang.name}
              </span>
              <span className="text-xs text-[#6fdc76] font-medium bg-[#193a27] px-2 py-0.5 rounded-md border border-[#2e5d3d]">
                {selectedGang.hindiName}
              </span>
            </div>
            <p className="text-xs text-[#9bb3a4] truncate max-w-xs md:max-w-md">
              Turf: {selectedGang.turf} · Leader: {selectedGang.leader}
            </p>
          </div>
        </div>

        {/* Quick Actions & Sound Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-2 rounded-xl bg-[#162d22] text-[#9bb3a4] hover:text-white border border-[#244b36] hover:bg-[#1d3d2e] transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#6fdc76]" />}
          </button>
          <button
            onClick={onGoToArsenal}
            className="px-3 py-1.5 rounded-xl bg-[#1e4431] text-xs font-semibold text-white border border-[#346a4d] hover:bg-[#28573f] transition-colors flex items-center gap-1.5"
          >
            <span>{currentWeapon.icon}</span>
            <span>{currentWeapon.name}</span>
          </button>
        </div>
      </div>

      {/* Gang Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#7e9988] shrink-0 pl-1">
          Pahadi Gangs:
        </span>
        {GANGS.map((g) => {
          const isActive = g.id === selectedGangId;
          return (
            <button
              key={g.id}
              onClick={() => onSelectGang(g.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                isActive
                  ? 'bg-[#27533b] text-[#6fdc76] border-[#6fdc76] shadow-sm shadow-[#6fdc76]/20'
                  : 'bg-[#12241b] text-[#a4b8ab] border-[#224030] hover:bg-[#193325]'
              }`}
            >
              <span className="text-sm">{g.icon}</span>
              <span>{g.name}</span>
            </button>
          );
        })}
      </div>

      {/* Game Stage Container */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#264e37] bg-[#0c1a0f] shadow-2xl">
        {/* HUD Overlay Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-3 bg-gradient-to-b from-[#09150ee6] to-transparent flex items-center justify-between text-xs pointer-events-none">
          {/* Mission Progress */}
          <div className="flex items-center gap-2 bg-[#12251cf2] backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#274f38] text-white">
            <span className="text-[#6fdc76] font-bold">Mission:</span>
            <span>
              {bossActive ? (
                <span className="text-red-400 font-bold animate-pulse">KILL BOSS: {currentTerritory.bossName}!</span>
              ) : (
                <span>
                  <strong className="text-white text-sm">{waveKills}</strong> / {currentTerritory.killsNeeded} maarna hai
                </span>
              )}
            </span>
          </div>

          {/* Time & Combo */}
          <div className="flex items-center gap-2">
            {combo >= 2 && (
              <div className="flex items-center gap-1 bg-[#1e3d2bf2] text-[#6fdc76] px-2.5 py-1.5 rounded-xl border border-[#3b7352] font-black tracking-wide animate-bounce">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{combo}x COMBO</span>
              </div>
            )}
            <div className="bg-[#12251cf2] backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#274f38] text-white font-mono font-bold">
              ⏱️ {timeLeft}s
            </div>
          </div>
        </div>

        {/* Boss Health Bar if Boss Active */}
        {bossActive && bossEnemy && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 w-11/12 max-w-md bg-[#160c0c]/90 border border-red-500/60 rounded-xl p-2.5 backdrop-blur-md">
            <div className="flex justify-between items-center text-xs text-red-200 mb-1 font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                BOSS: {bossEnemy.bossName} ({rivalGang.name})
              </span>
              <span>
                {bossEnemy.currentHp} / {bossEnemy.maxHp} HP
              </span>
            </div>
            <div className="w-full bg-[#351414] h-3 rounded-full overflow-hidden border border-red-800">
              <div
                className="bg-gradient-to-r from-red-600 via-amber-500 to-red-500 h-full transition-all duration-150"
                style={{ width: `${Math.max(0, (bossEnemy.currentHp / bossEnemy.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Interactive Battlefield Arena */}
        <div
          ref={arenaRef}
          onClick={handleArenaClick}
          className={`relative w-full h-[460px] md:h-[540px] select-none crosshair-cursor overflow-hidden ${
            isRecoiling ? 'animate-recoil' : ''
          }`}
          style={{
            backgroundImage: `url(/src/assets/images/hero_gangwar_battlefield_1793539866962.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Subtle atmospheric mist layer */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09150ee8] via-transparent to-[#0c1a0f44] pointer-events-none" />

          {/* Bullet Holes Decals */}
          {bulletHoles.map((hole) => (
            <div
              key={hole.id}
              className="absolute w-2.5 h-2.5 -ml-1 -mt-1 rounded-full bg-stone-900 border border-amber-500/40 opacity-80 pointer-events-none"
              style={{ left: `${hole.x}%`, top: `${hole.y}%` }}
            />
          ))}

          {/* Muzzle Flash VFX */}
          {muzzleFlash.active && (
            <div
              className="absolute pointer-events-none z-30 w-16 h-16 rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-transparent animate-muzzle-flash"
              style={{ left: `${muzzleFlash.x}%`, top: `${muzzleFlash.y}%` }}
            />
          )}

          {/* Floating Combat Texts */}
          {floatingTexts.map((item) => (
            <div
              key={item.id}
              className={`absolute pointer-events-none z-40 font-black animate-float-text whitespace-nowrap text-shadow ${
                item.isHeadshot ? 'text-lg text-yellow-300' : 'text-sm'
              }`}
              style={{ left: `${item.x}%`, top: `${item.y}%`, color: item.color }}
            >
              {item.text}
            </div>
          ))}

          {/* Boss Enemy Entity */}
          {bossActive && bossEnemy && (
            <div
              onClick={(e) => handleHitEnemy(e, bossEnemy, false)}
              className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform ${
                bossEnemy.isHit ? 'brightness-150 scale-95' : 'hover:scale-105'
              }`}
              style={{ left: `${bossEnemy.x}%`, top: `${bossEnemy.y}%` }}
            >
              {/* Boss Speech Bubble */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 text-yellow-300 text-xs px-2.5 py-1 rounded-lg border border-red-500/60 font-bold shadow-lg animate-bounce pointer-events-none">
                💬 {bossEnemy.quote}
              </div>

              {/* Boss Character Sprite */}
              <div className="relative w-28 h-36 flex flex-col items-center">
                {/* Boss Head Hitbox */}
                <div
                  onClick={(e) => handleHitEnemy(e, bossEnemy, true)}
                  className="w-14 h-14 rounded-full bg-gradient-to-b from-amber-600 to-amber-900 border-2 border-red-500 relative flex items-center justify-center cursor-pointer hover:border-yellow-300 transition-colors shadow-lg"
                  title="Shoot Head for Critical Damage!"
                >
                  <img
                    src="/src/assets/images/gang_rival_boss_1793539902178.jpg"
                    alt="Boss Sheru"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full"
                  />
                  <span className="absolute -top-2 bg-red-600 text-[10px] text-white px-1 font-bold rounded">
                    HEAD
                  </span>
                </div>

                {/* Boss Body */}
                <div className="w-20 h-20 mt-1 bg-[#1e2e22] border-2 border-red-600 rounded-2xl flex flex-col items-center justify-center text-xs font-bold text-white shadow-xl">
                  <span className="text-xl">🐯</span>
                  <span className="text-[11px] text-red-400">SHERU BOSS</span>
                  <div className="w-16 h-1.5 bg-neutral-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${(bossEnemy.currentHp / bossEnemy.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regular Enemies Spawning */}
          {enemies.map((enemy) => {
            const rivalGangInfo = GANGS.find((g) => g.id === enemy.gangId) || GANGS[1];
            return (
              <div
                key={enemy.id}
                className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all ${
                  enemy.isDead
                    ? 'opacity-0 scale-50 duration-200'
                    : enemy.isHit
                    ? 'brightness-200 scale-95'
                    : 'animate-enemy-pop hover:scale-105'
                }`}
                style={{ left: `${enemy.x}%`, top: `${enemy.y}%` }}
              >
                {/* Trash-talk bubble */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/85 text-emerald-300 text-[11px] px-2 py-0.5 rounded-lg border border-[#3b7352] font-semibold pointer-events-none shadow-md">
                  {enemy.quote}
                </div>

                {/* Enemy Target Body & Hitboxes */}
                <div className="relative w-20 h-24 flex flex-col items-center">
                  {/* Head Target (Headshot!) */}
                  <div
                    onClick={(e) => handleHitEnemy(e, enemy, true)}
                    className="w-9 h-9 rounded-full bg-gradient-to-b from-stone-400 to-stone-700 border-2 border-yellow-400/80 flex items-center justify-center hover:border-yellow-200 transition-colors relative z-20 shadow-md group"
                    title="Shoot Head (Double Damage)"
                  >
                    <span className="text-base select-none">{rivalGangInfo.icon}</span>
                  </div>

                  {/* Body Target */}
                  <div
                    onClick={(e) => handleHitEnemy(e, enemy, false)}
                    className="w-14 h-13 -mt-1 rounded-xl border-2 flex flex-col items-center justify-center z-10 shadow-lg relative"
                    style={{
                      backgroundColor: rivalGangInfo.badgeColor,
                      borderColor: rivalGangInfo.color,
                    }}
                  >
                    <span className="text-[10px] font-bold tracking-tight text-white/90">
                      {rivalGangInfo.name.split(' ')[0]}
                    </span>
                    {/* Enemy HP bar */}
                    <div className="w-10 h-1 bg-black/70 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-[#6fdc76]"
                        style={{ width: `${(enemy.currentHp / enemy.maxHp) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Interactive Tap Aim Gun Model in Player View */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
            {/* Visual Gun representation */}
            <div
              className={`transform origin-bottom transition-transform duration-75 text-6xl md:text-7xl select-none filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)] ${
                isRecoiling ? '-translate-y-4 scale-110 rotate-2' : ''
              }`}
            >
              {currentWeapon.icon}
            </div>
            <div className="text-[11px] font-black text-[#6fdc76] bg-[#0c1a0f]/90 px-3 py-0.5 rounded-full border border-[#2b5a3a] mb-2 tracking-wider">
              {currentWeapon.name.toUpperCase()}
            </div>
          </div>

          {/* READY Overlay Screen */}
          {gameState === 'READY' && (
            <div className="absolute inset-0 z-30 bg-[#09150ee0] backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1a3826] border-2 border-[#6fdc76] flex items-center justify-center text-3xl mb-3 shadow-lg shadow-[#6fdc76]/20">
                🏔️
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white font-display mb-1">
                {currentTerritory.name}
              </h2>
              <p className="text-xs text-[#9bb3a4] mb-4">
                District: {currentTerritory.district} · Altitude: {currentTerritory.elevation} · Rival: {rivalGang.name}
              </p>
              <div className="bg-[#12241b] border border-[#234433] rounded-xl p-3 max-w-sm mb-5 text-xs text-[#d2e4d8] leading-relaxed">
                🎯 Target: Eliminate <strong className="text-[#6fdc76]">{currentTerritory.killsNeeded}</strong> rival enemies in under 50 seconds. Aim for the head to score instant critical headshots!
              </div>
              <button
                onClick={startGame}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#6fdc76] to-[#45ad5b] text-[#0c1a0f] text-base font-black tracking-wide shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                🎮 Shuru Karo (Start Battle)
              </button>
            </div>
          )}

          {/* WAVE WON Modal */}
          {gameState === 'WAVE_WON' && (
            <div className="absolute inset-0 z-30 bg-[#09150ee8] backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1e4a2c] border-2 border-[#6fdc76] flex items-center justify-center text-3xl mb-3 animate-bounce">
                🏆
              </div>
              <span className="text-xs font-bold text-[#6fdc76] uppercase tracking-widest">
                Territory Conquered!
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white font-display mb-1">
                Shabash! {currentTerritory.name} Hamara Hua!
              </h2>
              <p className="text-xs text-[#a3bcaa] mb-5">
                MR BAAZ eagle flag is flying high over {currentTerritory.district}!
              </p>

              {/* Stats Breakdown */}
              <div className="grid grid-cols-3 gap-2 max-w-sm w-full mb-6 text-center">
                <div className="bg-[#12241b] border border-[#244b36] p-2.5 rounded-xl">
                  <div className="text-xs text-[#7e9988]">Kills</div>
                  <div className="text-lg font-black text-white">{waveKills}</div>
                </div>
                <div className="bg-[#12241b] border border-[#244b36] p-2.5 rounded-xl">
                  <div className="text-xs text-[#7e9988]">Headshots</div>
                  <div className="text-lg font-black text-[#ffd166]">{waveHeadshots}</div>
                </div>
                <div className="bg-[#12241b] border border-[#244b36] p-2.5 rounded-xl">
                  <div className="text-xs text-[#7e9988]">Reward</div>
                  <div className="text-lg font-black text-[#6fdc76]">+{currentTerritory.rewardPoints}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={startGame}
                  className="px-5 py-2.5 rounded-xl bg-[#193627] text-white text-xs font-bold border border-[#2e5d42] hover:bg-[#204431] transition-colors"
                >
                  Phir Khelo (Replay)
                </button>
                {onNextTerritory && (
                  <button
                    onClick={onNextTerritory}
                    className="px-6 py-2.5 rounded-xl bg-[#6fdc76] text-[#0c1a0f] text-xs font-black hover:bg-[#5fc566] transition-colors shadow-md"
                  >
                    Agla Ilaka (Next Territory) →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* GAME OVER Screen */}
          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 z-30 bg-[#160b0be8] backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#361313] border-2 border-red-500 flex items-center justify-center text-3xl mb-3">
                💀
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-red-400 font-display mb-1">
                Mission Failed!
              </h2>
              <p className="text-xs text-[#d8a8a8] mb-5">
                Rival gang ke hamle mein waqt khatam ho gaya. Reset karo aur dobara panga lo!
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={startGame}
                  className="px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-colors shadow-lg"
                >
                  Dobara Koshish Karo (Retry)
                </button>
                <button
                  onClick={onGoToArsenal}
                  className="px-5 py-3 rounded-2xl bg-[#1f2e24] hover:bg-[#283e30] text-[#6fdc76] text-xs font-bold border border-[#3b604a] transition-colors"
                >
                  Upgrade Weapon 🔫
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Interactive Weapon Control Strip */}
        <div className="bg-[#0e2016] border-t border-[#234633] p-3 flex flex-wrap items-center justify-between gap-3">
          {/* Ammo & Reload Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#142b1f] px-3.5 py-2 rounded-xl border border-[#27533b]">
              <span className="text-xs text-[#8da897]">Ammo:</span>
              <div className="flex items-center gap-1 font-mono">
                <span className={`text-base font-black ${currentAmmo <= 1 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {currentAmmo}
                </span>
                <span className="text-xs text-[#718b7a]">/ {currentWeapon.maxAmmo}</span>
              </div>
            </div>

            <button
              onClick={handleReload}
              disabled={isReloading || currentAmmo === currentWeapon.maxAmmo}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isReloading
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 cursor-wait'
                  : currentAmmo <= 2
                  ? 'bg-amber-500 text-black border border-amber-400 animate-pulse hover:bg-amber-400'
                  : 'bg-[#183627] text-[#6fdc76] border border-[#2c5b41] hover:bg-[#214734]'
              }`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
              <span>{isReloading ? `Reloading (${reloadProgress}%)` : 'Reload (R)'}</span>
            </button>
          </div>

          {/* Quick Tip / Hint */}
          <div className="text-[11px] text-[#86a291] hidden sm:block">
            💡 Tap enemy to shoot · Tap head for 2.2x damage · Press <strong>R</strong> to reload
          </div>

          {/* Current Score in Session */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8ba494]">Session Kills:</span>
            <span className="text-base font-black text-[#6fdc76] bg-[#142b1f] px-3 py-1 rounded-lg border border-[#27533b] font-mono">
              {waveKills} KILLS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
