import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category } = await req.json();
  if (category !== "AD_COPY" && category !== "VISUAL_AD") {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const userId = session.user.id;

  // Block only if user has an ongoing (WAITING or ACTIVE) match — JUDGING is fine to overlap
  const existingActive = await prisma.match.findFirst({
    where: {
      OR: [{ player1Id: userId }, { player2Id: userId }],
      status: { in: ["WAITING", "ACTIVE"] },
    },
  });
  if (existingActive) {
    return NextResponse.json({ matchId: existingActive.id });
  }

  // Find a WAITING match in this category (not created by current user)
  const waitingMatch = await prisma.match.findFirst({
    where: {
      category,
      status: "WAITING",
      player1Id: { not: userId },
    },
  });

  if (waitingMatch) {
    // Join as player2 — set ACTIVE + deadline 6 hours from now
    const deadline = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const updated = await prisma.match.update({
      where: { id: waitingMatch.id },
      data: {
        player2Id: userId,
        status: "ACTIVE",
        deadline,
      },
    });
    return NextResponse.json({ matchId: updated.id });
  }

  // No waiting match — create a new one with a random product
  const products = await prisma.product.findMany({ where: { category } });
  if (products.length === 0) {
    return NextResponse.json({ error: "No products available" }, { status: 500 });
  }
  const product = products[Math.floor(Math.random() * products.length)];

  const newMatch = await prisma.match.create({
    data: {
      category,
      productId: product.id,
      player1Id: userId,
      status: "WAITING",
    },
  });

  return NextResponse.json({ matchId: newMatch.id });
}
