"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Category = "AD_COPY" | "VISUAL_AD";

export default function FindMatchButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<Category | null>(null);
  const [error, setError] = useState("");

  async function findMatch(category: Category) {
    setLoading(category);
    setError("");
    try {
      const res = await fetch("/api/matches/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to find match");
      toast.success("Match found! Loading...");
      router.push(`/match/${data.matchId}`);
    } catch (e: any) {
      setError(e.message);
      setLoading(null);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="bg-[#6c63ff] hover:bg-[#574fd6] text-white rounded-2xl p-6 text-left border border-[#6c63ff]/40 transition-colors w-full"
      >
        <div className="text-2xl mb-2">⚔️</div>
        <div className="font-semibold text-lg">Find Match</div>
        <div className="text-sm text-white/70 mt-1">Choose your challenge type</div>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold mb-1">Choose Your Challenge</h2>
            <p className="text-gray-400 text-sm mb-8">
              Pick a format — you&apos;ll be matched with a real opponent instantly or wait in the lobby.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ad Copy */}
              <button
                onClick={() => findMatch("AD_COPY")}
                disabled={loading !== null}
                className="group relative bg-white/5 hover:bg-[#6c63ff]/20 border border-white/10 hover:border-[#6c63ff]/50 rounded-xl p-6 text-left transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                <div className="text-3xl mb-3">✍️</div>
                <div className="font-semibold text-lg mb-1">Ad Copy</div>
                <div className="text-gray-400 text-sm leading-relaxed">
                  Write compelling ad copy for a real product. Pure wordcraft — who can convert better?
                </div>
                {loading === "AD_COPY" && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#1a1a2e]/80">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </button>

              {/* Visual Ad */}
              <button
                onClick={() => findMatch("VISUAL_AD")}
                disabled={loading !== null}
                className="group relative bg-white/5 hover:bg-[#6c63ff]/20 border border-white/10 hover:border-[#6c63ff]/50 rounded-xl p-6 text-left transition-all disabled:opacity-60 disabled:cursor-wait"
              >
                <div className="text-3xl mb-3">🎨</div>
                <div className="font-semibold text-lg mb-1">Visual Ad</div>
                <div className="text-gray-400 text-sm leading-relaxed">
                  Design a visual ad for a real product. Upload your creative and let the votes decide.
                </div>
                {loading === "VISUAL_AD" && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#1a1a2e]/80">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </button>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-6 w-full py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
