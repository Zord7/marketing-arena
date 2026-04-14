import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const matches = await prisma.match.findMany({
    where: {
      status: "JUDGING",
      // Exclude matches the user is playing in
      player1Id: { not: userId },
      // player2Id can be null but we already check player1Id above;
      // also exclude where user is player2
      NOT: { player2Id: userId },
    },
    include: {
      product: true,
      player1: { select: { id: true, username: true } },
      player2: { select: { id: true, username: true } },
      votes: { select: { voterId: true, voteFor: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    matches.map((m) => {
      const p1Votes = m.votes.filter((v) => v.voteFor === 1).length;
      const p2Votes = m.votes.filter((v) => v.voteFor === 2).length;
      const userVote = m.votes.find((v) => v.voterId === userId);

      return {
        id: m.id,
        category: m.category,
        product: m.product,
        player1Id: m.player1Id,
        player1Username: m.player1.username,
        player2Id: m.player2Id,
        player2Username: m.player2?.username ?? null,
        player1Submission: m.player1Submission,
        player2Submission: m.player2Submission,
        player1ImageUrl: m.player1ImageUrl,
        player2ImageUrl: m.player2ImageUrl,
        player1Votes: p1Votes,
        player2Votes: p2Votes,
        totalVotes: m.votes.length,
        userVoteFor: userVote?.voteFor ?? null,
        judgingDeadline: m.judgingDeadline,
      };
    })
  );
}
