import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import FindMatchButton from "@/components/FindMatchButton";
import RecentMatches from "@/components/RecentMatches";
import RankBadge from "@/components/RankBadge";
import { getRankInfo, getNextRank, getRankProgress } from "@/lib/ranks";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  // Fresh data from DB (session JWT can be stale)
  const [user, activeMatches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, rankingPoints: true, wins: true, losses: true },
    }),
    prisma.match.findMany({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        status: { in: ["WAITING", "ACTIVE"] },
      },
      include: {
        product: { select: { name: true } },
        player1: { select: { username: true } },
        player2: { select: { username: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) redirect("/login");

  const { username, rankingPoints, wins, losses } = user;
  const totalMatches = wins + losses;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const rankInfo = getRankInfo(rankingPoints);
  const nextRank = getNextRank(rankingPoints);
  const progress = getRankProgress(rankingPoints);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* ── Welcome ─────────────────────────────────────────── */}
      <h1 className="text-3xl font-bold mb-1">
        Welcome back, <span className="text-[#6c63ff]">{username}</span>
      </h1>
      <p className="text-gray-400 mb-8">Ready to battle?</p>

      {/* ── Rank card ───────────────────────────────────────── */}
      <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/5 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shrink-0"
            style={{ background: `${rankInfo.color}20` }}
          >
            {rankInfo.name === "Grandmaster" ? "👑" :
             rankInfo.name === "Master"      ? "🔥" :
             rankInfo.name === "Diamond"     ? "💠" :
             rankInfo.name === "Platinum"    ? "💎" :
             rankInfo.name === "Gold"        ? "🥇" :
             rankInfo.name === "Silver"      ? "🥈" : "🥉"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Current Rank</div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold" style={{ color: rankInfo.color }}>
                {rankInfo.name}
              </span>
              <RankBadge points={rankingPoints} size="md" />
            </div>
            <div className="text-gray-400 text-sm mb-3">{rankingPoints} ranking points</div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{rankInfo.name}</span>
                {nextRank ? (
                  <span>
                    {rankingPoints}/{nextRank.min} pts → {nextRank.name}
                  </span>
                ) : (
                  <span className="text-yellow-400">Max rank reached 👑</span>
                )}
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: rankInfo.color,
                    boxShadow: rankInfo.glow ? `0 0 8px ${rankInfo.color}` : undefined,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Matches", value: totalMatches, color: "text-white" },
          { label: "Wins",          value: wins,         color: "text-green-400" },
          { label: "Losses",        value: losses,       color: "text-red-400" },
          { label: "Win Rate",      value: `${winRate}%`, color: "text-[#6c63ff]" },
        ].map((s) => (
          <div key={s.label} className="bg-[#1a1a2e] rounded-xl p-4 border border-white/5 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Active matches ──────────────────────────────────── */}
      {activeMatches.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Active Matches
          </h2>
          <div className="space-y-2">
            {activeMatches.map((m) => {
              const isPlayer1 = m.player1Id === userId;
              const opponent = isPlayer1 ? m.player2?.username : m.player1.username;
              return (
                <Link
                  key={m.id}
                  href={`/match/${m.id}`}
                  className="flex items-center gap-3 bg-[#1a1a2e] border border-white/5 hover:border-[#6c63ff]/40 rounded-xl px-4 py-3 transition-colors group"
                >
                  <span className="text-lg">{m.category === "AD_COPY" ? "✍️" : "🎨"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{m.product.name}</div>
                    <div className="text-xs text-gray-500">
                      vs {opponent ?? "Waiting for opponent…"}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      m.status === "WAITING"
                        ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                        : "text-blue-400 bg-blue-500/10 border-blue-500/20"
                    }`}
                  >
                    {m.status === "WAITING" ? "Waiting" : "Active"}
                  </span>
                  <span className="text-gray-600 group-hover:text-gray-400 transition-colors text-sm">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Action buttons ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FindMatchButton />

        <Link
          href="/leaderboard"
          className="bg-[#1a1a2e] hover:bg-white/5 text-white rounded-2xl p-6 text-left border border-white/5 hover:border-white/20 transition-colors"
        >
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-semibold text-lg">Leaderboard</div>
          <div className="text-sm text-gray-400 mt-1">See who&apos;s dominating the arena</div>
        </Link>
      </div>

      {/* ── Recent matches ──────────────────────────────────── */}
      <RecentMatches />
    </div>
  );
}
