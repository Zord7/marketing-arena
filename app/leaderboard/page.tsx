import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RankBadge from "@/components/RankBadge";
import { getRankInfo } from "@/lib/ranks";
import Link from "next/link";

export const metadata = { title: "Leaderboard — Marketing Arena" };

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);

  const topUsers = await prisma.user.findMany({
    orderBy: { rankingPoints: "desc" },
    take: 50,
    select: { id: true, username: true, rankingPoints: true, wins: true, losses: true },
  });

  // Current user's rank (even if outside top 50)
  let currentUserRank: number | null = null;
  let currentUserPoints = 0;
  if (session) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { rankingPoints: true },
    });
    currentUserPoints = dbUser?.rankingPoints ?? 0;
    const above = await prisma.user.count({
      where: { rankingPoints: { gt: currentUserPoints } },
    });
    currentUserRank = above + 1;
  }

  const isInTop50 = session
    ? topUsers.some((u) => u.id === session.user.id)
    : false;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-1">Leaderboard</h1>
      <p className="text-gray-400 text-sm mb-8">Top 50 marketers by ranking points</p>

      {/* Table */}
      <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 overflow-hidden">
        {/* Desktop header */}
        <div className="hidden sm:grid grid-cols-[2.5rem_1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/5 text-xs uppercase tracking-widest text-gray-500">
          <div>#</div>
          <div>Player</div>
          <div className="text-right">Points</div>
          <div className="text-right">W</div>
          <div className="text-right">L</div>
          <div className="text-right">Win%</div>
          <div />
        </div>

        {topUsers.length === 0 && (
          <div className="px-5 py-12 text-center text-gray-500 text-sm">
            No players yet. Be the first to compete!
          </div>
        )}

        {topUsers.map((user, idx) => {
          const rank = idx + 1;
          const total = user.wins + user.losses;
          const winRate = total > 0 ? Math.round((user.wins / total) * 100) : 0;
          const isCurrentUser = session?.user?.id === user.id;

          return (
            <div
              key={user.id}
              className={`grid grid-cols-[2.5rem_1fr] sm:grid-cols-[2.5rem_1fr_auto_auto_auto_auto_auto] gap-x-4 gap-y-1 px-5 py-3.5 border-b border-white/5 last:border-0 items-center transition-colors ${
                isCurrentUser
                  ? "bg-[#6c63ff]/10 border-l-2 border-l-[#6c63ff]"
                  : "hover:bg-white/5"
              }`}
            >
              {/* Rank number */}
              <div className="font-mono text-sm font-bold text-gray-400">
                {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
              </div>

              {/* Username + badge */}
              <div className="flex items-center gap-2 min-w-0">
                <span className={`font-medium truncate ${isCurrentUser ? "text-[#6c63ff]" : ""}`}>
                  {user.username}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-xs text-gray-500">(you)</span>
                  )}
                </span>
                <RankBadge points={user.rankingPoints} size="sm" />
              </div>

              {/* Stats — hidden on mobile */}
              <div className="hidden sm:block text-right font-semibold tabular-nums">
                {user.rankingPoints}
              </div>
              <div className="hidden sm:block text-right text-green-400 tabular-nums">{user.wins}</div>
              <div className="hidden sm:block text-right text-red-400 tabular-nums">{user.losses}</div>
              <div className="hidden sm:block text-right text-gray-400 tabular-nums text-sm">
                {winRate}%
              </div>
              {/* Mobile pts */}
              <div className="sm:hidden col-start-2 text-xs text-gray-500">
                {user.rankingPoints} pts · {user.wins}W {user.losses}L · {winRate}%
              </div>
              <div className="hidden sm:block" />
            </div>
          );
        })}
      </div>

      {/* Current user not in top 50 */}
      {session && !isInTop50 && currentUserRank !== null && (
        <div className="mt-6 bg-[#1a1a2e] rounded-xl border border-white/5 px-5 py-4 flex items-center gap-4">
          <div className="text-gray-400 text-sm">Your position</div>
          <div className="font-bold text-lg text-white">#{currentUserRank}</div>
          <RankBadge points={currentUserPoints} size="sm" />
          <div className="text-gray-500 text-sm ml-auto">{currentUserPoints} pts</div>
        </div>
      )}

      {!session && (
        <p className="mt-6 text-center text-gray-500 text-sm">
          <Link href="/login" className="text-[#6c63ff] hover:underline">Log in</Link> to see your rank
        </p>
      )}
    </div>
  );
}
