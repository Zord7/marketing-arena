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
      OR: [{ player1Id: userId }, { player2Id: userId }],
      status: { not: "WAITING" },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      product: { select: { name: true } },
      player1: { select: { username: true } },
      player2: { select: { username: true } },
      votes: { select: { voteFor: true } },
    },
  });

  return NextResponse.json(
    matches.map((m) => {
      const isPlayer1 = m.player1Id === userId;
      const opponentUsername = isPlayer1
        ? (m.player2?.username ?? null)
        : m.player1.username;

      let result: "won" | "lost" | "pending" = "pending";
      let pointsChange: number | null = null;

      if (m.status === "COMPLETED" && m.winnerId) {
        if (m.winnerId === userId) {
          result = "won";
          pointsChange = 25;
        } else {
          result = "lost";
          pointsChange = -10;
        }
      }

      const p1Votes = m.votes.filter((v) => v.voteFor === 1).length;
      const p2Votes = m.votes.filter((v) => v.voteFor === 2).length;

      return {
        id: m.id,
        category: m.category,
        productName: m.product.name,
        opponentUsername,
        status: m.status,
        result,
        pointsChange,
        createdAt: m.createdAt,
        player1Votes: p1Votes,
        player2Votes: p2Votes,
      };
    })
  );
}
