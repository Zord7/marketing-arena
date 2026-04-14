"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  targetAudience: string;
  keySellingPoint: string;
  category: string;
}

interface MatchData {
  id: string;
  status: "WAITING" | "ACTIVE" | "JUDGING" | "COMPLETED";
  category: "AD_COPY" | "VISUAL_AD";
  product: Product;
  player1Id: string;
  player1Username: string;
  player1Image: string | null;
  player2Id: string | null;
  player2Username: string | null;
  player2Image: string | null;
  player1Submission: string | null;
  player2Submission: string | null;
  player1ImageUrl: string | null;
  player2ImageUrl: string | null;
  winnerId: string | null;
  deadline: string | null;
  judgingDeadline: string | null;
  createdAt: string;
  player1Votes: number;
  player2Votes: number;
  totalVotes: number;
  userVoteFor: number | null;
}

export default function MatchClient({ matchId }: { matchId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevStatusRef = useRef<string | null>(null);

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
      if (!res.ok) { setLoadError("Match not found"); return; }
      const data: MatchData = await res.json();

      // Toast when match status changes
      if (prevStatusRef.current && prevStatusRef.current !== data.status) {
        if (data.status === "ACTIVE") toast.success("Opponent found! Match is live 🔥");
        if (data.status === "JUDGING") toast("⚖️ Both submitted — judging begins!", { icon: "⚖️" });
        if (data.status === "COMPLETED") toast.success("Match complete! Results are in 🏆");
      }
      prevStatusRef.current = data.status;

      setMatch(data);
    } catch {
      setLoadError("Failed to load match");
    }
  }, [matchId]);

  // Polling every 5 seconds
  useEffect(() => {
    fetchMatch();
    const id = setInterval(fetchMatch, 5000);
    return () => clearInterval(id);
  }, [fetchMatch]);

  // Countdown timer
  useEffect(() => {
    if (!match?.deadline) return;
    const tick = () => {
      const diff = new Date(match.deadline!).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Time's up"); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(`${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [match?.deadline]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!match) return;
    setSubmitError("");
    setSubmitting(true);

    const fd = new FormData();
    fd.append("submission", text);
    if (imageFile) fd.append("image", imageFile);

    try {
      const res = await fetch(`/api/matches/${matchId}/submit`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      toast.success("Submission sent! ✅");
      setSubmitted(true);
      fetchMatch();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    await fetch(`/api/matches/${matchId}/cancel`, { method: "POST" });
    router.push("/dashboard");
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-red-400 mb-4">{loadError}</p>
        <Link href="/dashboard" className="text-[#6c63ff] hover:underline">← Back to dashboard</Link>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading match...</p>
      </div>
    );
  }

  const userId = session?.user?.id;
  const isPlayer1 = userId === match.player1Id;
  const isPlayer2 = userId === match.player2Id;
  const isParticipant = isPlayer1 || isPlayer2;
  const mySubmission = isPlayer1 ? match.player1Submission : isPlayer2 ? match.player2Submission : null;
  const hasSubmitted = mySubmission !== null;

  // ─── WAITING ────────────────────────────────────────────────────
  if (match.status === "WAITING") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#1a1a2e] rounded-2xl p-10 border border-white/5">
          <div className="text-5xl mb-6 animate-pulse">⏳</div>
          <h1 className="text-2xl font-bold mb-2">Waiting for an opponent…</h1>
          <p className="text-gray-400 mb-2">
            Category: <span className="text-white font-medium">
              {match.category === "AD_COPY" ? "✍️ Ad Copy" : "🎨 Visual Ad"}
            </span>
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Share the link or sit tight — this page polls automatically.
          </p>

          <div className="bg-white/5 rounded-lg px-4 py-3 mb-8 text-sm text-gray-400 font-mono break-all">
            {typeof window !== "undefined" ? window.location.href : ""}
          </div>

          {isPlayer1 && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-colors text-sm disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel & Leave Queue"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── ACTIVE ─────────────────────────────────────────────────────
  if (match.status === "ACTIVE") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-[#6c63ff] bg-[#6c63ff]/10 px-3 py-1 rounded-full border border-[#6c63ff]/20">
              {match.category === "AD_COPY" ? "✍️ Ad Copy" : "🎨 Visual Ad"}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#1a1a2e] border border-white/10 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-400">Time left:</span>
            <span className={`font-mono font-bold text-sm ${timeLeft === "Time's up" ? "text-red-400" : "text-white"}`}>
              {timeLeft || "…"}
            </span>
          </div>
        </div>

        {/* Vs bar */}
        <div className="flex items-center justify-between bg-[#1a1a2e] rounded-xl p-4 border border-white/5 mb-6">
          <div className="text-sm font-medium">{match.player1Username}</div>
          <div className="text-xs text-gray-500 font-bold tracking-widest">VS</div>
          <div className="text-sm font-medium">{match.player2Username ?? "…"}</div>
        </div>

        {/* Product brief */}
        <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/5 mb-6">
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-3">Product Brief</div>
          <h2 className="text-xl font-bold mb-3">{match.product.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Description</div>
              <div className="text-gray-200 leading-relaxed">{match.product.description}</div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-gray-500 mb-1">Target Audience</div>
                <div className="text-gray-200">{match.product.targetAudience}</div>
              </div>
              <div>
                <div className="text-gray-500 mb-1">Key Selling Point</div>
                <div className="text-[#6c63ff] font-medium">{match.product.keySellingPoint}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Submission form */}
        {isParticipant && (
          <div className="bg-[#1a1a2e] rounded-2xl p-6 border border-white/5">
            {hasSubmitted || submitted ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-lg mb-1">Submission received!</p>
                <p className="text-gray-400 text-sm">
                  Waiting for {isPlayer1 ? match.player2Username : match.player1Username} to submit or the deadline to pass.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="text-sm font-semibold mb-4">
                  {match.category === "AD_COPY" ? "✍️ Write Your Ad Copy" : "🎨 Upload Your Visual Ad"}
                </div>

                {match.category === "AD_COPY" ? (
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                    rows={8}
                    placeholder="Write your most compelling ad copy here. Hook, body, CTA — make it convert."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#6c63ff] transition-colors resize-none text-sm leading-relaxed"
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Image upload */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 hover:border-[#6c63ff]/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                      ) : (
                        <>
                          <div className="text-3xl mb-2">🖼️</div>
                          <p className="text-gray-400 text-sm">Click to upload your visual ad</p>
                          <p className="text-gray-600 text-xs mt-1">PNG, JPG, GIF — max 10MB</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      required
                    />
                    {/* Optional caption */}
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                      placeholder="Optional caption / tagline to accompany your visual…"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#6c63ff] transition-colors resize-none text-sm"
                    />
                  </div>
                )}

                {submitError && (
                  <p className="mt-3 text-sm text-red-400">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting || (match.category === "VISUAL_AD" && !imageFile)}
                  className="mt-4 w-full py-3 rounded-lg bg-[#6c63ff] hover:bg-[#574fd6] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                >
                  {submitting ? "Submitting…" : "Submit Entry"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── JUDGING / COMPLETED — shared submission display helper ────
  const renderSubmissions = (showWinner: boolean) => {
    const players = [
      {
        label: match.player1Username,
        id: match.player1Id,
        sub: match.player1Submission,
        img: match.player1ImageUrl,
        votes: match.player1Votes,
      },
      {
        label: match.player2Username ?? "Player 2",
        id: match.player2Id,
        sub: match.player2Submission,
        img: match.player2ImageUrl,
        votes: match.player2Votes,
      },
    ];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {players.map((p, i) => {
          const isWinner = showWinner && match.winnerId === p.id;
          return (
            <div
              key={i}
              className={`relative bg-white/5 rounded-xl p-5 border transition-colors ${
                isWinner ? "border-yellow-400/40 bg-yellow-500/5" : "border-white/5"
              }`}
            >
              {isWinner && (
                <div className="absolute -top-3 left-4 bg-yellow-400 text-black text-xs font-bold px-3 py-0.5 rounded-full">
                  🏆 Winner
                </div>
              )}
              <div className="text-xs text-gray-500 mb-2 font-medium">{p.label}</div>
              {p.img && (
                <img
                  src={p.img}
                  alt="submission"
                  className="w-full rounded-lg mb-3 object-cover max-h-48"
                />
              )}
              {p.sub && (
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {p.sub}
                </p>
              )}
              {showWinner && (
                <div className="mt-3 text-xs text-gray-500">
                  {p.votes} vote{p.votes !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── JUDGING ────────────────────────────────────────────────────
  if (match.status === "JUDGING") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">⚖️</div>
          <div>
            <h1 className="text-2xl font-bold">Judging in Progress</h1>
            <p className="text-gray-400 text-sm">
              {match.totalVotes} vote{match.totalVotes !== 1 ? "s" : ""} cast — community is deciding
            </p>
          </div>
        </div>

        {/* Product brief */}
        <div className="bg-[#1a1a2e] rounded-2xl p-5 border border-white/5 mb-6 text-sm">
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Product</div>
          <div className="font-semibold">{match.product.name}</div>
          <div className="text-gray-400 mt-1">{match.product.description}</div>
        </div>

        {renderSubmissions(false)}

        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-[#6c63ff] hover:underline text-sm">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ─── COMPLETED ──────────────────────────────────────────────────
  const winnerUsername =
    match.winnerId === match.player1Id
      ? match.player1Username
      : match.player2Username;

  const userWon = userId === match.winnerId;
  const userLost = isParticipant && !userWon;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Result banner */}
      <div
        className={`rounded-2xl p-6 mb-8 border text-center ${
          !isParticipant
            ? "bg-[#1a1a2e] border-white/5"
            : userWon
            ? "bg-green-500/10 border-green-500/20"
            : "bg-red-500/10 border-red-500/20"
        }`}
      >
        <div className="text-4xl mb-2">{isParticipant ? (userWon ? "🎉" : "💪") : "🏆"}</div>
        <h1 className="text-2xl font-bold mb-1">
          {isParticipant
            ? userWon
              ? "You won!"
              : "You lost"
            : "Match Complete"}
        </h1>
        <p className="text-gray-300 text-sm">
          Winner: <span className="font-semibold text-white">{winnerUsername}</span>
        </p>
        {isParticipant && (
          <p
            className={`mt-1 font-bold text-lg ${userWon ? "text-green-400" : "text-red-400"}`}
          >
            {userWon ? "+25 ranking points" : "−10 ranking points"}
          </p>
        )}
      </div>

      {/* Product brief */}
      <div className="bg-[#1a1a2e] rounded-2xl p-5 border border-white/5 mb-6 text-sm">
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Product</div>
        <div className="font-semibold">{match.product.name}</div>
        <div className="text-gray-400 mt-1">{match.product.description}</div>
      </div>

      {/* Vote breakdown bar */}
      {match.totalVotes > 0 && (
        <div className="bg-[#1a1a2e] rounded-xl p-4 border border-white/5 mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>{match.player1Username}: {match.player1Votes} votes</span>
            <span>{match.totalVotes} total</span>
            <span>{match.player2Username}: {match.player2Votes} votes</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
            <div
              className="bg-[#6c63ff] h-full rounded-full transition-all"
              style={{
                width: `${Math.round((match.player1Votes / match.totalVotes) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Both submissions */}
      {renderSubmissions(true)}

      <div className="mt-8 text-center">
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 rounded-lg bg-[#6c63ff] hover:bg-[#574fd6] font-semibold transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
