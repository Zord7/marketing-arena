import { getRankInfo, getRankEmoji } from "@/lib/ranks";

interface Props {
  points: number;
  size?: "sm" | "md" | "lg";
  showEmoji?: boolean;
}

export default function RankBadge({ points, size = "md", showEmoji = false }: Props) {
  const rank = getRankInfo(points);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
    lg: "text-sm px-3 py-1.5 font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${sizeClasses[size]} ${
        rank.glow ? "animate-pulse" : ""
      }`}
      style={{
        color: rank.color,
        borderColor: `${rank.color}40`,
        backgroundColor: `${rank.color}15`,
        boxShadow: rank.glow ? `0 0 8px ${rank.color}60` : undefined,
      }}
    >
      {showEmoji && <span>{getRankEmoji(rank.name)}</span>}
      {rank.name}
    </span>
  );
}
