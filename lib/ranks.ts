export interface RankInfo {
  name: string;
  color: string;
  min: number;
  glow?: boolean;
}

export const RANKS: RankInfo[] = [
  { name: "Bronze",      color: "#CD7F32", min: 0 },
  { name: "Silver",      color: "#C0C0C0", min: 100 },
  { name: "Gold",        color: "#FFD700", min: 250 },
  { name: "Platinum",    color: "#E5E4E2", min: 500 },
  { name: "Diamond",     color: "#B9F2FF", min: 800 },
  { name: "Master",      color: "#FF6B6B", min: 1200 },
  { name: "Grandmaster", color: "#FF4500", min: 1600, glow: true },
];

export function getRankInfo(points: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

export function getNextRank(points: number): RankInfo | null {
  for (let i = 0; i < RANKS.length; i++) {
    if (points < RANKS[i].min) return RANKS[i];
  }
  return null; // Grandmaster — max rank
}

/** 0-100 progress % within the current rank band */
export function getRankProgress(points: number): number {
  const current = getRankInfo(points);
  const next = getNextRank(points);
  if (!next) return 100;
  return Math.round(((points - current.min) / (next.min - current.min)) * 100);
}

export function getRankEmoji(name: string): string {
  const map: Record<string, string> = {
    Bronze: "🥉",
    Silver: "🥈",
    Gold: "🥇",
    Platinum: "💎",
    Diamond: "💠",
    Master: "🔥",
    Grandmaster: "👑",
  };
  return map[name] ?? "🏅";
}
