export interface Gang {
  id: string;
  name: string;
  hindiName: string;
  icon: string;
  color: string;
  badgeColor: string;
  desc: string;
  leader: string;
  turf: string;
  isPlayerGang?: boolean;
}

export interface Weapon {
  id: string;
  name: string;
  type: 'pistol' | 'shotgun' | 'rifle' | 'sniper';
  damage: number;
  maxAmmo: number;
  reloadTimeMs: number;
  cost: number;
  icon: string;
  desc: string;
  recoil: number;
}

export interface Territory {
  id: string;
  name: string;
  district: string;
  elevation: string;
  killsNeeded: number;
  enemyGangId: string;
  rewardPoints: number;
  unlocked: boolean;
  conquered: boolean;
  bossName?: string;
  bossHealth?: number;
}

export interface Enemy {
  id: string;
  gangId: string;
  x: number; // percentage 10% to 90%
  y: number; // percentage 20% to 75%
  maxHp: number;
  currentHp: number;
  isBoss?: boolean;
  bossName?: string;
  quote: string;
  spawnTime: number;
  durationMs: number;
  isDead: boolean;
  isDying: boolean;
  isHit: boolean;
}

export interface PlayerStats {
  playerName: string;
  points: number;
  todayPoints: number;
  totalKills: number;
  headshots: number;
  shotsFired: number;
  shotsHit: number;
  highestCombo: number;
  equippedWeaponId: string;
  ownedWeapons: string[];
  conqueredTerritories: string[];
  unlockedBadges: string[];
}
