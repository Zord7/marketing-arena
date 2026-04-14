import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { voteFor } = await req.json(); // 1 or 2
  if (voteFor !== 1 && voteFor !== 2) {
    return NextResponse.json({ error: "voteFor must be 1 or 2" }, { status: 400 });
  }

  const userId = session.user.id;
  const match = await prisma.match.findUnique({
    where: { id: params.matchId },
    include: { votes: true },
  });

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "JUDGING") {
    return NextResponse.json({ error: "Match is not in judging phase" }, { status: 400 });
  }
  if (match.player1Id === userId || match.player2Id === userId) {
    return NextResponse.json({ error: "Cannot vote on your own match" }, { status: 403 });
  }

  try {
    await prisma.vote.create({
      data: { matchId: params.matchId, voterId: userId, voteFor },
    });
  } catch {
    // Unique constraint violation = already voted
    return NextResponse.json({ error: "Already voted on this match" }, { status: 409 });
  }

  // Check if we should auto-resolve (10+ votes)
  const voteCount = match.votes.length + 1;
  if (voteCount >= 10) {
    // Fire-and-forget resolve
    fetch(`${process.env.NEXTAUTH_URL}/api/matches/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: params.matchId }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
