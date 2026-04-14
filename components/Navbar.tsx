"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { getRankInfo } from "@/lib/ranks";

function NavRankDot({ points }: { points: number }) {
  const rank = getRankInfo(points);
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{
        backgroundColor: rank.color,
        boxShadow: rank.glow ? `0 0 6px ${rank.color}` : undefined,
      }}
      title={rank.name}
    />
  );
}

const NAV_LINKS = [
  { href: "/",            label: "Home" },
  { href: "/dashboard",  label: "Dashboard" },
  { href: "/judge",      label: "Judge" },
  { href: "/leaderboard",label: "Leaderboard" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#1a1a2e] border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-white tracking-tight shrink-0">
          Marketing Arena
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-gray-300 hover:text-white transition-colors text-sm">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth section desktop */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <div className="flex items-center gap-1.5">
                <NavRankDot points={session.user.rankingPoints ?? 0} />
                <span className="text-gray-300 text-sm">{session.user.username}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-4 py-1.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-1.5 text-sm rounded-lg hover:bg-white/10 transition-colors">
                Login
              </Link>
              <Link href="/register" className="px-4 py-1.5 text-sm rounded-lg bg-[#6c63ff] hover:bg-[#574fd6] transition-colors font-medium">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className={`w-5 h-0.5 bg-white transition-transform duration-200 ${menuOpen ? "rotate-45 translate-y-[6px]" : "mb-1"}`} />
          <div className={`w-5 h-0.5 bg-white transition-opacity duration-200 mb-1 ${menuOpen ? "opacity-0" : ""}`} />
          <div className={`w-5 h-0.5 bg-white transition-transform duration-200 ${menuOpen ? "-rotate-45 -translate-y-[6px]" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#1a1a2e] px-4 py-4 flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-gray-300 hover:text-white hover:bg-white/5 rounded-lg px-3 py-2.5 text-sm transition-colors"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t border-white/10 flex flex-col gap-2">
            {session ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1">
                  <NavRankDot points={session.user.rankingPoints ?? 0} />
                  <span className="text-gray-300 text-sm">{session.user.username}</span>
                </div>
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }}
                  className="px-4 py-2.5 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-left"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 text-sm rounded-lg hover:bg-white/10 transition-colors">
                  Login
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 text-sm rounded-lg bg-[#6c63ff] hover:bg-[#574fd6] transition-colors font-medium text-center">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
