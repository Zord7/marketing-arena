"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface JudgeMatch {
  id: string;
  category: "AD_COPY" | "VISUAL_AD";
  product: {
    name: string;
    description: string;
    targetAudience: string;
    keySellingPoint: string;
  };
  player1Id: string;
  player1Username: string;
  player2Id: string | null;
  player2Username: string | null;
  player1Submission: string | null;
  player2Submission: string | null;
  player1ImageUrl: string | null;
  player2ImageUrl: string | null;
  player1Votes: number;
  player2Votes: number;
  totalVotes: number;
  userVoteFor: number | null;
  judgingDeadline: string | null;
}

// Deterministic A/B flip per match (same for all users on that match)
function getFlip(matchId: string): boolean {
  return matchId.charCodeAt(0) % 2 === 0;
}

function SubmissionCard({
  label,
  category,
  text,
  imageUrl,
}: {
  label: "A" | "B";
  category: "AD_COPY" | "VISUAL_AD";
  text: string | null;
  imageUrl: string | null;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-7 h-7 rounded-full bg-[#6c63ff] text-white text-xs font-bold flex items-center justify-center">
          {label}
        </span>
        <span className="text-gray-400 text-xs">Submission {label}</span>
      </div>
      {category === "VISUAL_AD" && imageUrl && (
        <img
          src={imageUrl}
          alt={`Submission ${label}`}
          className="w-full rounded-lg object-cover max-h-56"
        />
      )}
      {text && (
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap flex-1">
          {text}
        </p>
      )}
      {!text && !imageUrl && (
        <p className="text-sm text-gray-500 italic">No content submitted</p>
      )}
    </div>
  );
}

export default function JudgeClient() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<JudgeMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null); // matchId being voted on
  const [justVoted, setJustVoted] = useState<Record<string, "A" | "B">>({});
  const resolveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/judge/matches", { cache: "no-store" });
      if (res.ok) {
        const data: JudgeMatch[] = await res.json();
        setMatches(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerResolve = useCallback(async () => {
    await fetch("/api/matches/resolve", { method: "POST" }).catch(() => {});
  }, []);

  // Poll matches every 5 s, resolve every 60 s
  useEffect(() => {
    fetchMatches();
    const pollId = setInterval(fetchMatches, 5000);
    resolveTimerRef.current = setInterval(triggerResolve, 60_000);
    return () => {
      clearInterval(pollId);
      if (resolveTimerRef.current) clearInterval(resolveTimerRef.current);
    };
  }, [fetchMatches, triggerResolve]);

  async function vote(match: JudgeMatch, label: "A" | "B") {
    if (!session) return;
    setVoting(match.id);

    const flip = getFlip(match.id);
    // A → player1 if !flip, player2 if flip
    const voteFor = (label === "A") === !flip ? 1 : 2;

    try {
      const res = await fetch(`/api/judge/${match.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteFor }),
      });
      if (res.ok) {
        toast.success(`Vote cast for ${label}!`);
        setJustVoted((prev) => ({ ...prev, [match.id]: label }));
        // Remove match from visible list after short delay
        setTimeout(() => {
          setMatches((prev) => prev.filter((m) => m.id !== match.id));
          setJustVoted((prev) => {
            const next = { ...prev };
            delete next[match.id];
            return next;
          });
        }, 2000);
      }
    } finally {
      setVoting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#6c63ff] rounded-full animate-spin" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-gray-400">No matches awaiting judgment right now.</p>
        <p className="text-gray-600 text-sm mt-2">Check back soon — this page refreshes automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {matches.map((match) => {
        const flip = getFlip(match.id);
        const aIsPlayer1 = !flip;

        const subA = {
          text: aIsPlayer1 ? match.player1Submission : match.player2Submission,
          imageUrl: aIsPlayer1 ? match.player1ImageUrl : match.player2ImageUrl,
          playerNum: aIsPlayer1 ? 1 : 2,
        };
        const subB = {
          text: aIsPlayer1 ? match.player2Submission : match.player1Submission,
          imageUrl: aIsPlayer1 ? match.player2ImageUrl : match.player1ImageUrl,
          playerNum: aIsPlayer1 ? 2 : 1,
        };

        const voted = justVoted[match.id];
        const alreadyVoted = match.userVoteFor !== null;

        return (
          <div
            key={match.id}
            className="bg-[#1a1a2e] rounded-2xl border border-white/5 overflow-hidden"
          >
            {/* Product brief header */}
            <div className="p-5 border-b border-white/5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold tracking-widest uppercase text-[#6c63ff] bg-[#6c63ff]/10 px-2 py-0.5 rounded-full border border-[#6c63ff]/20">
                      {match.category === "AD_COPY" ? "✍️ Ad Copy" : "🎨 Visual Ad"}
                    </span>
                    <span className="text-xs text-gray-500">{match.totalVotes} votes cast</span>
                  </div>
                  <h3 className="font-bold text-lg">{match.product.name}</h3>
                  <p className="text-gray-400 text-sm mt-0.5 leading-relaxed">
                    {match.product.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Target: </span>
                  <span className="text-gray-300">{match.product.targetAudience}</span>
                </div>
                <div>
                  <span className="text-gray-500">USP: </span>
                  <span className="text-[#6c63ff]">{match.product.keySellingPoint}</span>
                </div>
              </div>
            </div>

            {/* Submissions side by side */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SubmissionCard label="A" category={match.category} text={subA.text} imageUrl={subA.imageUrl} />
              <SubmissionCard label="B" category={match.category} text={subB.text} imageUrl={subB.imageUrl} />
            </div>

            {/* Vote bar */}
            <div className="px-5 pb-5">
              {voted ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-4 text-center">
                  <span className="text-green-400 font-semibold">
                    ✓ Thanks! You voted for {voted}
                  </span>
                </div>
              ) : alreadyVoted ? (
                <div className="bg-white/5 rounded-xl px-5 py-4 text-center text-gray-400 text-sm">
                  You&apos;ve already voted on this match
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => vote(match, "A")}
                    disabled={voting === match.id}
                    className="py-3 rounded-xl bg-[#6c63ff]/20 hover:bg-[#6c63ff]/40 border border-[#6c63ff]/30 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                  >
                    {voting === match.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="w-5 h-5 rounded-full bg-[#6c63ff] text-white text-xs font-bold flex items-center justify-center">A</span>
                        A is better
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => vote(match, "B")}
                    disabled={voting === match.id}
                    className="py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 border border-purple-500/30 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                  >
                    {voting === match.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">B</span>
                        B is better
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
