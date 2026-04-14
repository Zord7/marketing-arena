import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const match = await prisma.match.findUnique({ where: { id: params.id } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  if (match.status !== "ACTIVE") {
    return NextResponse.json({ error: "Match is not active" }, { status: 400 });
  }

  const userId = session.user.id;
  const isPlayer1 = match.player1Id === userId;
  const isPlayer2 = match.player2Id === userId;
  if (!isPlayer1 && !isPlayer2) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  // Already submitted?
  if (isPlayer1 && match.player1Submission !== null) {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }
  if (isPlayer2 && match.player2Submission !== null) {
    return NextResponse.json({ error: "Already submitted" }, { status: 400 });
  }

  const formData = await req.formData();
  const text = (formData.get("submission") as string) ?? "";
  const imageFile = formData.get("image") as File | null;

  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `match-${match.id}-${isPlayer1 ? "p1" : "p2"}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);
    imageUrl = `/uploads/${filename}`;
  }

  const updateData = isPlayer1
    ? {
        player1Submission: text,
        ...(imageUrl !== null && { player1ImageUrl: imageUrl }),
      }
    : {
        player2Submission: text,
        ...(imageUrl !== null && { player2ImageUrl: imageUrl }),
      };

  const updated = await prisma.match.update({
    where: { id: params.id },
    data: updateData,
  });

  // Both submitted → move to JUDGING (24-hour judging window)
  if (updated.player1Submission !== null && updated.player2Submission !== null) {
    const judgingDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.match.update({
      where: { id: params.id },
      data: { status: "JUDGING", judgingDeadline },
    });
  }

  return NextResponse.json({ success: true });
}
