import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const match = await prisma.match.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      player1: { select: { id: true, username: true, image: true } },
      player2: { select: { id: true, username: true, image: true } },
    },
  });

  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-advance: if ACTIVE and deadline passed → JUDGING
  if (match.status === "ACTIVE" && match.deadline && new Date() > match.deadline) {
    const judgingDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.match.update({
      where: { id: match.id },
      data: { status: "JUDGING", judgingDeadline },
    });
    match.status = "JUDGING" as any;
    (match as any).judgingDeadline = judgingDeadline;
  }

  // Fetch votes for this match
  const votes = await prisma.vote.findMany({ where: { matchId: match.id } });
  const player1Votes = votes.filter((v) => v.voteFor === 1).length;
  const player2Votes = votes.filter((v) => v.voteFor === 2).length;
  const userId = session.user.id;
  const userVote = votes.find((v) => v.voterId === userId) ?? null;

  return NextResponse.json({
    id: match.id,
    status: match.status,
    category: match.category,
    product: match.product,
    player1Id: match.player1Id,
    player1Username: match.player1.username,
    player1Image: match.player1.image,
    player2Id: match.player2Id,
    player2Username: match.player2?.username ?? null,
    player2Image: match.player2?.image ?? null,
    player1Submission: match.player1Submission,
    player2Submission: match.player2Submission,
    player1ImageUrl: match.player1ImageUrl,
    player2ImageUrl: match.player2ImageUrl,
    winnerId: match.winnerId,
    deadline: match.deadline,
    judgingDeadline: match.judgingDeadline,
    createdAt: match.createdAt,
    player1Votes,
    player2Votes,
    totalVotes: votes.length,
    userVoteFor: userVote?.voteFor ?? null,
  });
}
