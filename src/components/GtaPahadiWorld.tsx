import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerStats, Weapon } from '../types/game';
import { WEAPONS, GANGS } from '../data/gameData';
import { sound } from '../utils/audio';
import {
  Car,
  Crosshair,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  Radio,
  RotateCcw,
  Navigation,
  AlertTriangle,
  Award,
  Flame,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface GtaPahadiWorldProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
  onSwitchToArcade: () => void;
}

interface WorldEntity {
  id: string;
  type: 'rival' | 'civilian' | 'police';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  gang: string;
  angle: number;
  isDead: boolean;
  name: string;
}

interface Vehicle {
  id: string;
  name: string;
  type: 'thar' | 'bike' | 'police_gypsy';
  plate: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  maxSpeed: number;
  color: string;
  icon: string;
}

interface Mission {
  id: number;
  title: string;
  objective: string;
  rewardCash: number;
  targetKills?: number;
  requiresVehicle?: boolean;
  loseWanted?: boolean;
}

export const GtaPahadiWorld: React.FC<GtaPahadiWorldProps> = ({
  stats,
  onUpdateStats,
  onSwitchToArcade,
}) => {
  // Player State in Open World
  const [playerX, setPlayerX] = useState(600);
  const [playerY, setPlayerY] = useState(480);
  const [playerAngle, setPlayerAngle] = useState(0);
  const [health, setHealth] = useState(100);
  const [armor, setArmor] = useState(50);
  const [wantedStars, setWantedStars] = useState(1);
  const [currentCash, setCurrentCash] = useState(stats.points * 25);
  const [equippedWeaponIndex, setEquippedWeaponIndex] = useState(0);
  const [ammo, setAmmo] = useState(30);

  // Vehicle driving state
  const [inVehicle, setInVehicle] = useState<Vehicle | null>(null);

  // Active mission
  const [missionIndex, setMissionIndex] = useState(0);
  const [missionProgress, setMissionProgress] = useState(0);
  const [missionBanner, setMissionBanner] = useState<string | null>('MISSION: HIJACK 4x4 THAR JEEP');

  // Floating notifications
  const [statusMessage, setStatusMessage] = useState<string>('Press F / 🚗 button to drive nearby Thar Jeep!');
  const [sirenActive, setSirenActive] = useState(false);
  const [isRadioOn, setIsRadioOn] = useState(true);

  // World Entities & Vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 'v_thar',
      name: 'Pahadi 4x4 Thar',
      type: 'thar',
      plate: 'UK 07 BAZ 007',
      x: 650,
      y: 440,
      angle: 45,
      speed: 0,
      maxSpeed: 7.5,
      color: '#2e7d32',
      icon: '🚙',
    },
    {
      id: 'v_bike',
      name: 'Doon Bullet Bike',
      type: 'bike',
      plate: 'UK 04 RG 350',
      x: 920,
      y: 720,
      angle: 180,
      speed: 0,
      maxSpeed: 8.5,
      color: '#e65100',
      icon: '🏍️',
    },
    {
      id: 'v_police',
      name: 'UK Police Gypsy',
      type: 'police_gypsy',
      plate: 'UK 07 GP 100',
      x: 1200,
      y: 350,
      angle: 90,
      speed: 0,
      maxSpeed: 7.8,
      color: '#1565c0',
      icon: '🚓',
    },
  ]);

  const [entities, setEntities] = useState<WorldEntity[]>([
    { id: 'e1', type: 'rival', x: 800, y: 500, hp: 60, maxHp: 60, gang: 'Doon Squad', angle: 0, isDead: false, name: 'Biker Vicky' },
    { id: 'e2', type: 'rival', x: 840, y: 530, hp: 60, maxHp: 60, gang: 'Doon Squad', angle: 0, isDead: false, name: 'Doon Goon' },
    { id: 'e3', type: 'rival', x: 1350, y: 700, hp: 90, maxHp: 90, gang: 'Pahadi Tigers', angle: 0, isDead: false, name: 'Tiger Sheru' },
    { id: 'e4', type: 'police', x: 1150, y: 380, hp: 80, maxHp: 80, gang: 'UK Police', angle: 0, isDead: false, name: 'Inspector Rawat' },
    { id: 'e5', type: 'civilian', x: 450, y: 420, hp: 40, maxHp: 40, gang: 'Local', angle: 0, isDead: false, name: 'Chaiwala Ramesh' },
  ]);

  // Keys active
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Missions List
  const MISSIONS: Mission[] = [
    {
      id: 1,
      title: 'Pahadi Ride',
      objective: 'Get inside the green 4x4 Thar Jeep (UK 07 BAZ 007)',
      rewardCash: 500,
      requiresVehicle: true,
    },
    {
      id: 2,
      title: 'Turf Roadblock Raid',
      objective: 'Eliminate 3 Doon Squad rival goons',
      rewardCash: 1200,
      targetKills: 3,
    },
    {
      id: 3,
      title: 'Lose the Police Heat',
      objective: 'Evade police pursuit or bribe with $500',
      rewardCash: 2000,
      loseWanted: true,
    },
  ];

  const currentMission = MISSIONS[missionIndex] || MISSIONS[0];

  // Keyboard Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      // Enter/Exit Vehicle shortcut: 'f' or 'e'
      if (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'e') {
        toggleVehicle();
      }

      // Honk: 'h'
      if (e.key.toLowerCase() === 'h' && inVehicle) {
        sound.playHorn();
      }

      // Switch Weapon: 'q'
      if (e.key.toLowerCase() === 'q') {
        setEquippedWeaponIndex((prev) => (prev + 1) % WEAPONS.length);
        sound.playReload();
      }

      // Shoot / Attack: Space
      if (e.key === ' ') {
        e.preventDefault();
        handleAttack();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [inVehicle, playerX, playerY, vehicles]);

  // Enter/Exit Vehicle Logic
  const toggleVehicle = () => {
    if (inVehicle) {
      // Exit vehicle
      setPlayerX(inVehicle.x + 35);
      setPlayerY(inVehicle.y + 35);
      setInVehicle(null);
      sound.playReload();
      setStatusMessage('Exited vehicle. On foot mode.');
    } else {
      // Find closest vehicle within 75px
      const nearby = vehicles.find((v) => {
        const dx = v.x - playerX;
        const dy = v.y - playerY;
        return Math.sqrt(dx * dx + dy * dy) < 85;
      });

      if (nearby) {
        setInVehicle(nearby);
        sound.playEngineRev();
        setStatusMessage(`Driving ${nearby.name} (${nearby.plate})!`);

        // Check mission 1
        if (missionIndex === 0 && nearby.type === 'thar') {
          sound.playVictory();
          setMissionProgress(1);
          setMissionBanner('MISSION PASSED: Pahadi Ride! +$500');
          setCurrentCash((prev) => prev + 500);
          setTimeout(() => {
            setMissionIndex(1);
            setMissionProgress(0);
            setMissionBanner('NEW MISSION: Raid Doon Squad Roadblock (Kill 3)');
          }, 2500);
        }
      } else {
        setStatusMessage('No vehicle nearby! Walk closer to Thar Jeep or Bike.');
      }
    }
  };

  // Attack / Shoot handler
  const handleAttack = () => {
    const weapon = WEAPONS[equippedWeaponIndex] || WEAPONS[0];
    sound.playGunshot(weapon.type);

    // Aim forward based on player angle
    const rad = (playerAngle * Math.PI) / 180;
    const bulletRange = 180;

    let hitSomeone = false;
    setEntities((prev) =>
      prev.map((entity) => {
        if (entity.isDead) return entity;
        const dx = entity.x - playerX;
        const dy = entity.y - playerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Angle check to see if target is in front
        const targetAngle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(rad - targetAngle);

        if (dist < bulletRange && (angleDiff < 0.6 || angleDiff > Math.PI * 2 - 0.6)) {
          hitSomeone = true;
          const newHp = entity.hp - weapon.damage;
          if (newHp <= 0) {
            // Killed entity
            sound.playHit();
            setStatusMessage(`Wasted ${entity.name} (${entity.gang})! +$150`);
            setCurrentCash((c) => c + 150);

            // If rival gang killed, advance mission 2
            if (missionIndex === 1 && entity.type === 'rival') {
              setMissionProgress((p) => {
                const nextP = p + 1;
                if (nextP >= 3) {
                  sound.playVictory();
                  setMissionBanner('MISSION PASSED: Roadblock Cleared! +$1200');
                  setCurrentCash((c) => c + 1200);
                  setTimeout(() => {
                    setMissionIndex(2);
                    setMissionProgress(0);
                    setMissionBanner('NEW MISSION: Evade Police Pursuit!');
                    setWantedStars(3);
                    sound.playSiren();
                  }, 2500);
                }
                return nextP;
              });
            }

            // Raise wanted stars if civilian or police
            if (entity.type === 'police' || entity.type === 'civilian') {
              setWantedStars((w) => Math.min(5, w + 1));
              sound.playSiren();
            }

            return { ...entity, hp: 0, isDead: true };
          }
          sound.playHit();
          return { ...entity, hp: newHp };
        }
        return entity;
      })
    );

    if (!hitSomeone) {
      sound.playRicochet();
    }
  };

  // Main Open World Physics Game Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Handle Controls
      const k = keysPressed.current;
      const up = k['w'] || k['arrowup'];
      const down = k['s'] || k['arrowdown'];
      const left = k['a'] || k['arrowleft'];
      const right = k['d'] || k['arrowright'];

      if (inVehicle) {
        // Vehicle Drive Physics
        let speed = inVehicle.speed;
        let angle = inVehicle.angle;

        if (up) speed = Math.min(inVehicle.maxSpeed, speed + 0.3);
        else if (down) speed = Math.max(-3, speed - 0.25);
        else speed *= 0.94; // friction

        if (Math.abs(speed) > 0.3) {
          const steerDir = speed > 0 ? 1 : -1;
          if (left) angle -= 3.2 * steerDir;
          if (right) angle += 3.2 * steerDir;
        }

        const rad = (angle * Math.PI) / 180;
        const newX = Math.max(80, Math.min(1900, inVehicle.x + Math.cos(rad) * speed * 2.2));
        const newY = Math.max(80, Math.min(1100, inVehicle.y + Math.sin(rad) * speed * 2.2));

        const updatedVehicle = { ...inVehicle, x: newX, y: newY, speed, angle };
        setInVehicle(updatedVehicle);
        setPlayerX(newX);
        setPlayerY(newY);
        setPlayerAngle(angle);

        // Update in vehicles list
        setVehicles((prev) =>
          prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v))
        );

        // Run over goons if driving fast
        if (Math.abs(speed) > 3) {
          setEntities((prev) =>
            prev.map((ent) => {
              if (ent.isDead) return ent;
              const d = Math.hypot(ent.x - newX, ent.y - newY);
              if (d < 45) {
                sound.playHit();
                setStatusMessage(`Run over ${ent.name}! Splat!`);
                return { ...ent, hp: 0, isDead: true };
              }
              return ent;
            })
          );
        }
      } else {
        // On-foot Walking Physics
        let dx = 0;
        let dy = 0;
        const walkSpeed = 3.6;

        if (up) dy -= walkSpeed;
        if (down) dy += walkSpeed;
        if (left) dx -= walkSpeed;
        if (right) dx += walkSpeed;

        if (dx !== 0 || dy !== 0) {
          const newAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
          setPlayerAngle(newAngle);
          setPlayerX((prev) => Math.max(60, Math.min(1900, prev + dx)));
          setPlayerY((prev) => Math.max(60, Math.min(1100, prev + dy)));
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [inVehicle]);

  // Periodic Police Siren sound when wanted > 0
  useEffect(() => {
    if (wantedStars >= 2) {
      const interval = setInterval(() => {
        sound.playSiren();
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [wantedStars]);

  // Payoff Police / Bribe to lose wanted level
  const handleBribePolice = () => {
    if (currentCash < 300) {
      setStatusMessage('Not enough cash to bribe police! Need $300.');
      return;
    }
    sound.playVictory();
    setCurrentCash((c) => c - 300);
    setWantedStars(0);
    setStatusMessage('Police paid off! Wanted level cleared! ⭐ 0');

    if (missionIndex === 2) {
      setMissionBanner('MISSION PASSED: Heat Lost! +$2000');
      setCurrentCash((c) => c + 2000);
    }
  };

  const activeWeapon = WEAPONS[equippedWeaponIndex] || WEAPONS[0];

  return (
    <div className="relative w-full h-[620px] md:h-[720px] bg-[#07130a] rounded-3xl overflow-hidden border-2 border-[#1f4a2d] shadow-2xl select-none">
      {/* Top GTA 5 Style Header HUD */}
      <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/95 via-black/70 to-transparent p-3 md:p-4 flex items-center justify-between text-white pointer-events-auto">
        {/* Brand / Logo Zone with Glow */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#00ff00] to-[#006400] rounded-xl flex items-center justify-center font-black text-black text-lg shadow-[0_0_20px_#00ff00]">
            MB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm md:text-base tracking-wider font-display text-white">
                PAHADI WAR
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff00] bg-black/80 px-2 py-0.5 rounded border border-[#00ff00]/40">
                GTA 5 PAHADI EDITION
              </span>
            </div>
            <span className="text-[11px] text-[#a4c9b0]">
              Uttarakhand Open World · Dehradun & Mussoorie Hills
            </span>
          </div>
        </div>

        {/* Right Stats: Wanted Stars + GTA Cash + Switch Mode */}
        <div className="flex items-center gap-4">
          {/* Wanted Stars */}
          <div className="flex items-center gap-1 bg-black/60 px-3 py-1.5 rounded-xl border border-neutral-700">
            <span className="text-xs text-neutral-400 mr-1 hidden sm:inline">WANTED:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-base font-black transition-all ${
                  star <= wantedStars
                    ? 'text-yellow-400 drop-shadow-[0_0_8px_#ffd700] animate-pulse'
                    : 'text-neutral-700'
                }`}
              >
                ★
              </span>
            ))}
          </div>

          {/* GTA 5 Cash in Green Font */}
          <div className="text-right">
            <div className="text-[10px] text-[#71a381] uppercase font-bold tracking-wider">
              Cash (रुपये)
            </div>
            <div className="text-lg md:text-xl font-black text-[#55ff55] font-mono tracking-wider tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              ${currentCash.toLocaleString()}
            </div>
          </div>

          {/* Mode switch button */}
          <button
            onClick={onSwitchToArcade}
            className="px-3 py-1.5 rounded-xl bg-[#173824] hover:bg-[#204a30] text-xs font-bold text-[#71e884] border border-[#2e6d42] transition-colors hidden sm:block"
          >
            🎯 Gallery Mode
          </button>
        </div>
      </div>

      {/* Mission Banner Notification */}
      {missionBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-black/90 border border-[#00ff00]/60 rounded-xl px-4 py-2 text-center text-xs backdrop-blur-md shadow-2xl animate-bounce">
          <div className="text-[#00ff00] font-black uppercase tracking-wider">{missionBanner}</div>
          <div className="text-neutral-300 text-[11px] mt-0.5">{currentMission.objective}</div>
        </div>
      )}

      {/* Main Open World Map Viewport (Camera Follows Player) */}
      <div
        ref={containerRef}
        className="w-full h-full relative overflow-hidden"
        style={{
          background: 'radial-gradient(circle at center, #1b3823 0%, #0c1a11 60%, #060e09 100%)',
        }}
      >
        {/* World Container moving with player camera */}
        <div
          className="absolute transition-transform duration-75"
          style={{
            transform: `translate(${containerRef.current ? containerRef.current.clientWidth / 2 - playerX : 0}px, ${
              containerRef.current ? containerRef.current.clientHeight / 2 - playerY : 0
            }px)`,
            width: '2000px',
            height: '1200px',
          }}
        >
          {/* Ground Terrain Texture Grid */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#2d5c3a 1.5px, transparent 1.5px), radial-gradient(#1e4028 1.5px, #0f2416 1.5px)`,
              backgroundSize: '40px 40px',
              backgroundPosition: '0 0, 20px 20px',
            }}
          />

          {/* Roads & Mountain Hairpin Highways */}
          {/* Main Dehradun - Mussoorie Highway */}
          <div className="absolute top-[400px] left-0 right-0 h-28 bg-[#1f2622] border-y-4 border-[#3c4a41] shadow-2xl flex items-center">
            {/* Center yellow road dash */}
            <div className="w-full border-t-2 border-dashed border-amber-400 opacity-70" />
            <div className="absolute left-32 text-neutral-500 font-mono text-xs uppercase tracking-widest pointer-events-none">
              UK-07 DEHRADUN HIGHWAY
            </div>
            <div className="absolute left-[900px] text-neutral-500 font-mono text-xs uppercase tracking-widest pointer-events-none">
              RAJPUR ROAD TO MUSSOORIE
            </div>
          </div>

          {/* Cross Mountain Road */}
          <div className="absolute top-0 bottom-0 left-[850px] w-28 bg-[#1f2622] border-x-4 border-[#3c4a41] shadow-2xl flex justify-center">
            <div className="h-full border-l-2 border-dashed border-amber-400 opacity-70" />
          </div>

          {/* Roadside Locations & Landmarks */}
          {/* 1. Pahadi Tea Stall & Maggi Point */}
          <div className="absolute top-[280px] left-[520px] bg-[#3a2717] border-2 border-amber-600 rounded-2xl p-4 shadow-2xl w-56 text-center">
            <div className="text-2xl mb-1">☕ 🍜</div>
            <div className="text-xs font-black text-amber-300 uppercase">Pahadi Maggi Point & Chai</div>
            <div className="text-[10px] text-amber-200/70">Dhabha · Safe Zone</div>
          </div>

          {/* 2. Uttarakhand Police Checkpost */}
          <div className="absolute top-[270px] left-[1100px] bg-[#142338] border-2 border-blue-500 rounded-2xl p-4 shadow-2xl w-60 text-center">
            <div className="text-2xl mb-1">🚨 🚓</div>
            <div className="text-xs font-black text-blue-300 uppercase">Van Vibhag & UK Police Post</div>
            <div className="text-[10px] text-blue-200/70">Checkpost · Speed Radars</div>
          </div>

          {/* 3. Doon Squad Gang Garage Base */}
          <div className="absolute top-[540px] left-[780px] bg-[#2d1b2a] border-2 border-red-500 rounded-2xl p-4 shadow-2xl w-64 text-center">
            <div className="text-2xl mb-1">🏍️ ⚡</div>
            <div className="text-xs font-black text-red-300 uppercase">Doon Squad Turf Headquarters</div>
            <div className="text-[10px] text-red-200/70">Rival Territory · Danger</div>
          </div>

          {/* 4. Pine Forest Trees & Mountain Boulders */}
          {[
            { x: 300, y: 220, emoji: '🌲' },
            { x: 420, y: 180, emoji: '🌲' },
            { x: 700, y: 150, emoji: '🌲' },
            { x: 1020, y: 180, emoji: '🌲' },
            { x: 1400, y: 220, emoji: '🌲' },
            { x: 250, y: 650, emoji: '🌲' },
            { x: 420, y: 750, emoji: '🌲' },
            { x: 620, y: 800, emoji: '🌲' },
            { x: 1150, y: 750, emoji: '🌲' },
            { x: 1350, y: 850, emoji: '🌲' },
            { x: 1550, y: 600, emoji: '🌲' },
            { x: 500, y: 550, emoji: '🪨' },
            { x: 1050, y: 550, emoji: '🪨' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="absolute select-none pointer-events-none text-4xl transform -translate-x-1/2 -translate-y-1/2 filter drop-shadow-[0_8px_8px_rgba(0,0,0,0.6)]"
              style={{ left: `${item.x}px`, top: `${item.y}px` }}
            >
              {item.emoji}
            </div>
          ))}

          {/* World Entities (Rivals, Police, Citizens) */}
          {entities.map((ent) => (
            <div
              key={ent.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-opacity ${
                ent.isDead ? 'opacity-30' : 'opacity-100'
              }`}
              style={{ left: `${ent.x}px`, top: `${ent.y}px` }}
            >
              <div className="relative flex flex-col items-center">
                {/* Entity Label */}
                <span className="text-[10px] font-bold text-white bg-black/70 px-1.5 py-0.2 rounded whitespace-nowrap mb-0.5 border border-white/20">
                  {ent.name}
                </span>

                {/* HP bar */}
                {!ent.isDead && (
                  <div className="w-8 h-1 bg-neutral-900 rounded-full overflow-hidden mb-0.5">
                    <div
                      className={`h-full ${ent.type === 'rival' ? 'bg-red-500' : 'bg-blue-400'}`}
                      style={{ width: `${(ent.hp / ent.maxHp) * 100}%` }}
                    />
                  </div>
                )}

                {/* Avatar Icon */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-lg border-2 ${
                    ent.isDead
                      ? 'bg-neutral-800 border-neutral-600'
                      : ent.type === 'rival'
                      ? 'bg-red-950 border-red-500'
                      : ent.type === 'police'
                      ? 'bg-blue-950 border-blue-400'
                      : 'bg-emerald-950 border-emerald-400'
                  }`}
                >
                  {ent.isDead ? '💀' : ent.type === 'rival' ? '🐯' : ent.type === 'police' ? '👮' : '🚶'}
                </div>
              </div>
            </div>
          ))}

          {/* Vehicles on Map */}
          {vehicles.map((v) => {
            const isBeingDriven = inVehicle?.id === v.id;
            if (isBeingDriven) return null; // rendered at player position

            return (
              <div
                key={v.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{
                  left: `${v.x}px`,
                  top: `${v.y}px`,
                  transform: `translate(-50%, -50%) rotate(${v.angle}deg)`,
                }}
                onClick={toggleVehicle}
              >
                {/* Vehicle Sprite */}
                <div
                  className="px-3 py-1.5 rounded-xl border-2 shadow-2xl flex items-center gap-1.5 text-white font-bold"
                  style={{ backgroundColor: v.color, borderColor: '#ffffff55' }}
                >
                  <span className="text-xl">{v.icon}</span>
                  <span className="text-[10px] font-mono tracking-tight">{v.plate}</span>
                </div>
              </div>
            );
          })}

          {/* Active Player Entity (On Foot or In Vehicle) */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
            style={{
              left: `${playerX}px`,
              top: `${playerY}px`,
              transform: `translate(-50%, -50%) rotate(${playerAngle}deg)`,
            }}
          >
            {inVehicle ? (
              /* Player Inside Vehicle */
              <div
                className="px-4 py-2 rounded-2xl border-2 border-[#00ff00] shadow-[0_0_20px_#00ff00] flex items-center gap-2 text-white font-black animate-pulse"
                style={{ backgroundColor: inVehicle.color }}
              >
                <span className="text-2xl">{inVehicle.icon}</span>
                <div className="leading-tight">
                  <div className="text-[11px] font-bold text-[#00ff00] uppercase font-display">
                    MR BAAZ
                  </div>
                  <div className="text-[10px] font-mono">{inVehicle.plate}</div>
                </div>
              </div>
            ) : (
              /* Player On Foot */
              <div className="relative flex flex-col items-center">
                {/* Weapon Aim Line */}
                <div className="absolute top-1/2 left-1/2 w-8 h-1 bg-[#00ff00] -translate-y-1/2 origin-left shadow-[0_0_8px_#00ff00]" />

                {/* Character Body with MR BAAZ Eagle Crest */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00ff00] to-[#005a14] border-2 border-white flex items-center justify-center text-xl shadow-[0_0_15px_#00ff00]">
                  🦅
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mini-Map Radar (GTA 5 Style) at Bottom-Left */}
      <div className="absolute bottom-4 left-4 z-40 bg-black/85 border-2 border-[#00ff00]/60 rounded-2xl p-2.5 backdrop-blur-md shadow-2xl flex flex-col items-center">
        <div className="relative w-28 h-28 rounded-full bg-[#0a1a0e] border border-neutral-700 overflow-hidden shadow-inner">
          {/* Compass North */}
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-400">
            N
          </span>

          {/* Center Player Marker */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#00ff00] rounded-full border border-white shadow-[0_0_6px_#00ff00]" />

          {/* Minimap Entities blips */}
          {entities.map((e) => {
            const relX = ((e.x - playerX) / 800) * 56 + 56;
            const relY = ((e.y - playerY) / 800) * 56 + 56;
            if (relX < 0 || relX > 112 || relY < 0 || relY > 112 || e.isDead) return null;
            return (
              <div
                key={e.id}
                className={`absolute w-2 h-2 rounded-full ${
                  e.type === 'rival' ? 'bg-red-500 animate-ping' : 'bg-blue-400'
                }`}
                style={{ left: `${relX}px`, top: `${relY}px` }}
              />
            );
          })}

          {/* Minimap Vehicle Blips */}
          {vehicles.map((v) => {
            const relX = ((v.x - playerX) / 800) * 56 + 56;
            const relY = ((v.y - playerY) / 800) * 56 + 56;
            if (relX < 0 || relX > 112 || relY < 0 || relY > 112) return null;
            return (
              <div
                key={v.id}
                className="absolute w-2 h-2 bg-[#00ff00] rounded-full"
                style={{ left: `${relX}px`, top: `${relY}px` }}
              />
            );
          })}
        </div>
        <span className="text-[10px] font-bold text-[#86bf97] mt-1 font-mono">
          GPS: UTTARAKHAND
        </span>
      </div>

      {/* Floating Status Prompt */}
      {statusMessage && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-black/85 text-white border border-[#2b5e39] text-xs px-4 py-1.5 rounded-full backdrop-blur-md pointer-events-none whitespace-nowrap shadow-lg">
          {statusMessage}
        </div>
      )}

      {/* GTA 5 Bottom HUD & Touch Game Controls */}
      <div
        id="hud"
        className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 md:p-4 flex items-end justify-between pointer-events-none"
      >
        {/* Left Side: Mobile Movement Buttons (D-Pad) */}
        <div className="pointer-events-auto flex items-center gap-1.5 ml-32 sm:ml-36">
          <div className="grid grid-cols-3 gap-1 w-32 h-32">
            <div />
            <button
              onMouseDown={() => { keysPressed.current['w'] = true; }}
              onMouseUp={() => { keysPressed.current['w'] = false; }}
              onTouchStart={() => { keysPressed.current['w'] = true; }}
              onTouchEnd={() => { keysPressed.current['w'] = false; }}
              className="bg-white/15 border-2 border-white/30 rounded-2xl flex items-center justify-center text-white active:bg-[#00ff00]/40 active:scale-90 transition-transform backdrop-blur-md"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
            <div />

            <button
              onMouseDown={() => { keysPressed.current['a'] = true; }}
              onMouseUp={() => { keysPressed.current['a'] = false; }}
              onTouchStart={() => { keysPressed.current['a'] = true; }}
              onTouchEnd={() => { keysPressed.current['a'] = false; }}
              className="bg-white/15 border-2 border-white/30 rounded-2xl flex items-center justify-center text-white active:bg-[#00ff00]/40 active:scale-90 transition-transform backdrop-blur-md"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <button
              onMouseDown={() => { keysPressed.current['s'] = true; }}
              onMouseUp={() => { keysPressed.current['s'] = false; }}
              onTouchStart={() => { keysPressed.current['s'] = true; }}
              onTouchEnd={() => { keysPressed.current['s'] = false; }}
              className="bg-white/15 border-2 border-white/30 rounded-2xl flex items-center justify-center text-white active:bg-[#00ff00]/40 active:scale-90 transition-transform backdrop-blur-md"
            >
              <ArrowDown className="w-6 h-6" />
            </button>

            <button
              onMouseDown={() => { keysPressed.current['d'] = true; }}
              onMouseUp={() => { keysPressed.current['d'] = false; }}
              onTouchStart={() => { keysPressed.current['d'] = true; }}
              onTouchEnd={() => { keysPressed.current['d'] = false; }}
              className="bg-white/15 border-2 border-white/30 rounded-2xl flex items-center justify-center text-white active:bg-[#00ff00]/40 active:scale-90 transition-transform backdrop-blur-md"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Center: Health & Armor Meters */}
        <div className="pointer-events-auto hidden md:flex flex-col gap-1 w-48 bg-black/75 border border-neutral-700 p-2.5 rounded-xl backdrop-blur-md">
          <div className="flex justify-between text-[11px] font-bold text-neutral-300">
            <span>HEALTH</span>
            <span className="text-[#00ff00]">{health}/100</span>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-[#00ff00]" style={{ width: `${health}%` }} />
          </div>

          <div className="flex justify-between text-[11px] font-bold text-neutral-300 mt-1">
            <span>ARMOR</span>
            <span className="text-sky-400">{armor}/100</span>
          </div>
          <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-sky-400" style={{ width: `${armor}%` }} />
          </div>
        </div>

        {/* Right Side: Action Buttons (Attack, Drive, Honk, Bribe) */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          {/* Radio / Bribe Police */}
          {wantedStars > 0 && (
            <button
              onClick={handleBribePolice}
              className="w-14 h-14 md:w-16 md:h-16 bg-amber-500/30 border-2 border-amber-400 rounded-full flex flex-col items-center justify-center text-xs font-bold text-amber-300 active:scale-90 transition-all shadow-lg backdrop-blur-md"
              title="Bribe Police ($300)"
            >
              <span>⭐</span>
              <span className="text-[9px]">BRIBE</span>
            </button>
          )}

          {/* Drive / Carjack Button */}
          <button
            onClick={toggleVehicle}
            className={`w-16 h-16 md:w-18 md:h-18 rounded-full border-2 flex flex-col items-center justify-center font-bold active:scale-90 transition-all shadow-xl backdrop-blur-md ${
              inVehicle
                ? 'bg-red-600/40 border-red-400 text-white'
                : 'bg-white/15 border-white/40 text-white active:bg-[#00ff00]/40'
            }`}
            title="Enter / Exit Vehicle (F / E)"
          >
            <span className="text-2xl">{inVehicle ? '🚶' : '🚗'}</span>
            <span className="text-[9px] uppercase tracking-wider">{inVehicle ? 'EXIT' : 'DRIVE'}</span>
          </button>

          {/* Honk Horn Button (if in vehicle) */}
          {inVehicle && (
            <button
              onClick={() => sound.playHorn()}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/15 border-2 border-white/30 flex flex-col items-center justify-center text-white active:bg-[#00ff00]/40 active:scale-90 transition-all backdrop-blur-md"
              title="Honk Pahadi Horn (H)"
            >
              <span className="text-xl">📢</span>
              <span className="text-[9px]">HORN</span>
            </button>
          )}

          {/* Shoot / Attack Button */}
          <button
            onClick={handleAttack}
            className="w-18 h-18 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#00ff00] to-[#00701a] border-2 border-white text-black font-black flex flex-col items-center justify-center active:scale-90 transition-all shadow-[0_0_25px_#00ff00]"
            title="Shoot / Strike (Space)"
          >
            <span className="text-2xl">🔫</span>
            <span className="text-[10px] font-black uppercase tracking-wider">ATTACK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
