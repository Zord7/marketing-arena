"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MatchSummary {
  id: string;
  category: "AD_COPY" | "VISUAL_AD";
  productName: string;
  opponentUsername: string | null;
  status: "ACTIVE" | "JUDGING" | "COMPLETED";
  result: "won" | "lost" | "pending";
  pointsChange: number | null;
  createdAt: string;
  player1Votes: number;
  player2Votes: number;
}

const RESULT_STYLES = {
  won: "text-green-400 bg-green-500/10 border-green-500/20",
  lost: "text-red-400 bg-red-500/10 border-red-500/20",
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
};

const RESULT_LABELS = {
  won: "Won",
  lost: "Lost",
  pending: "Pending",
};

export default function RecentMatches() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/matches")
      .then((r) => r.json())
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Recent Matches</h2>
        <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/5 animate-pulse h-32" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Recent Matches</h2>
        <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/5 text-center text-gray-500 text-sm">
          No matches yet — find your first match above!
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">Recent Matches</h2>
      <div className="space-y-2">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/match/${m.id}`}
            className="bg-[#1a1a2e] border border-white/5 hover:border-white/20 rounded-xl px-5 py-4 flex items-center gap-4 transition-colors group"
          >
            {/* Category icon */}
            <div className="text-xl shrink-0">{m.category === "AD_COPY" ? "✍️" : "🎨"}</div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{m.productName}</div>
              <div className="text-gray-500 text-xs mt-0.5">
                vs{" "}
                <span className="text-gray-400">
                  {m.opponentUsername ?? "waiting for opponent"}
                </span>
                {" · "}
                {new Date(m.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </div>
            </div>

            {/* Vote counts (if applicable) */}
            {(m.status === "JUDGING" || m.status === "COMPLETED") && (
              <div className="text-xs text-gray-500 shrink-0 hidden sm:block">
                {m.player1Votes + m.player2Votes} votes
              </div>
            )}

            {/* Result badge */}
            <div
              className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${RESULT_STYLES[m.result]}`}
            >
              {RESULT_LABELS[m.result]}
              {m.pointsChange !== null && (
                <span className="ml-1 opacity-80">
                  {m.pointsChange > 0 ? `+${m.pointsChange}` : m.pointsChange}
                </span>
              )}
            </div>

            {/* Arrow */}
            <div className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 text-sm">→</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
