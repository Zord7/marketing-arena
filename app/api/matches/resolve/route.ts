import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // Optional: target a specific match, or resolve all eligible ones
  let targetMatchId: string | null = null;
  try {
    const body = await req.json();
    targetMatchId = body?.matchId ?? null;
  } catch {}

  const where = targetMatchId
    ? { id: targetMatchId, status: "JUDGING" as const }
    : { status: "JUDGING" as const };

  const matches = await prisma.match.findMany({
    where,
    include: {
      votes: true,
      player1: true,
      player2: true,
    },
  });

  const resolved: string[] = [];

  for (const match of matches) {
    if (!match.player2Id) continue; // Safety: no opponent joined

    const voteCount = match.votes.length;
    const deadlinePassed =
      match.judgingDeadline && new Date() > match.judgingDeadline;

    if (voteCount < 10 && !deadlinePassed) continue;

    const p1Votes = match.votes.filter((v) => v.voteFor === 1).length;
    const p2Votes = match.votes.filter((v) => v.voteFor === 2).length;

    let winnerId: string;
    let loserId: string;

    if (p1Votes > p2Votes) {
      winnerId = match.player1Id;
      loserId = match.player2Id;
    } else if (p2Votes > p1Votes) {
      winnerId = match.player2Id;
      loserId = match.player1Id;
    } else {
      // Tie — random
      const flip = Math.random() < 0.5;
      winnerId = flip ? match.player1Id : match.player2Id;
      loserId = flip ? match.player2Id : match.player1Id;
    }

    // Update match
    await prisma.match.update({
      where: { id: match.id },
      data: { status: "COMPLETED", winnerId },
    });

    // Winner: +25 pts, +1 wins
    await prisma.user.update({
      where: { id: winnerId },
      data: { rankingPoints: { increment: 25 }, wins: { increment: 1 } },
    });

    // Loser: -10 pts (min 0), +1 losses
    const loser = winnerId === match.player1Id ? match.player2 : match.player1;
    const loserPoints = loser?.rankingPoints ?? 0;
    await prisma.user.update({
      where: { id: loserId },
      data: {
        rankingPoints: Math.max(0, loserPoints - 10),
        losses: { increment: 1 },
      },
    });

    resolved.push(match.id);
  }

  return NextResponse.json({ resolved });
}
