import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RankBadge from "@/components/RankBadge";
import { getRankEmoji } from "@/lib/ranks";

export default async function HomePage() {
  // Server-side data fetching
  const [topUsers, totalCompleted, totalUsers] = await Promise.all([
    prisma.user.findMany({
      orderBy: { rankingPoints: "desc" },
      take: 5,
      select: { id: true, username: true, rankingPoints: true, wins: true, losses: true },
    }),
    prisma.match.count({ where: { status: "COMPLETED" } }),
    prisma.user.count(),
  ]);

  const HOW_IT_WORKS = [
    {
      step: "01",
      icon: "⚔️",
      title: "Choose a Challenge",
      desc: "Pick Ad Copy (write compelling text) or Visual Ad (design a creative). Get matched with a real opponent instantly or wait in the lobby.",
    },
    {
      step: "02",
      icon: "✍️",
      title: "Create Your Ad",
      desc: "You have 6 hours to craft the best ad for a real product brief. Write copy that converts or design a visual that stops the scroll.",
    },
    {
      step: "03",
      icon: "🗳️",
      title: "Get Voted On",
      desc: "The community judges both submissions anonymously. The winner earns +25 ranking points. Climb the leaderboard and prove your skills.",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto text-center pt-20 pb-16">
        <div className="inline-block mb-4 px-3 py-1 text-xs font-semibold tracking-widest uppercase text-[#6c63ff] bg-[#6c63ff]/10 rounded-full border border-[#6c63ff]/30">
          1v1 Marketing Battles
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Marketing{" "}
          <span className="text-[#6c63ff]">Arena</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
          Compete head-to-head to prove your marketing skills. Craft strategies,
          outsmart opponents, and climb the ranks.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-xl bg-[#6c63ff] hover:bg-[#574fd6] text-white font-semibold text-base transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base transition-colors border border-white/10"
          >
            Login
          </Link>
        </div>

        {/* Stats bar */}
        {(totalCompleted > 0 || totalUsers > 0) && (
          <div className="mt-10 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div>
              <span className="text-white font-bold text-lg">{totalCompleted.toLocaleString()}</span>
              <span className="ml-1">matches played</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div>
              <span className="text-white font-bold text-lg">{totalUsers.toLocaleString()}</span>
              <span className="ml-1">marketers</span>
            </div>
          </div>
        )}
      </div>

      {/* ── How It Works ───────────────────────────────────────── */}
      <div className="w-full max-w-4xl mx-auto mb-20">
        <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/5 relative overflow-hidden">
              <div className="absolute top-4 right-4 text-5xl font-extrabold text-white/5 select-none leading-none">
                {step.step}
              </div>
              <div className="text-3xl mb-3">{step.icon}</div>
              <h3 className="font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Feature cards ──────────────────────────────────────── */}
      <div className="w-full max-w-3xl mx-auto mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: "⚔️", title: "1v1 Battles",    desc: "Challenge real marketers in live strategy duels" },
            { icon: "📈", title: "Climb the Ranks", desc: "Earn points, unlock tiers, and reach the top" },
            { icon: "🧠", title: "Sharpen Skills",  desc: "Learn from every match and grow your expertise" },
          ].map((f) => (
            <div key={f.title} className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/5 text-left">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Players ────────────────────────────────────────── */}
      {topUsers.length > 0 && (
        <div className="w-full max-w-md mx-auto mb-20">
          <h2 className="text-2xl font-bold text-center mb-6">Top Players</h2>
          <div className="bg-[#1a1a2e] rounded-2xl border border-white/5 overflow-hidden">
            {topUsers.map((user, idx) => {
              const total = user.wins + user.losses;
              const winRate = total > 0 ? Math.round((user.wins / total) * 100) : 0;
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 last:border-0"
                >
                  <div className="text-lg w-8 text-center shrink-0">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{user.username}</div>
                    <div className="text-xs text-gray-500">{winRate}% win rate</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RankBadge points={user.rankingPoints} size="sm" />
                    <span className="text-sm font-semibold tabular-nums">{user.rankingPoints}</span>
                  </div>
                </div>
              );
            })}
            <div className="px-5 py-3 text-center border-t border-white/5">
              <Link href="/leaderboard" className="text-[#6c63ff] text-sm hover:underline">
                View full leaderboard →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
