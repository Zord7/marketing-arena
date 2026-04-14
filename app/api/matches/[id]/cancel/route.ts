import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const match = await prisma.match.findUnique({ where: { id: params.id } });
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (match.player1Id !== session.user.id) {
    return NextResponse.json({ error: "Only the creator can cancel" }, { status: 403 });
  }
  if (match.status !== "WAITING") {
    return NextResponse.json({ error: "Cannot cancel — match already started" }, { status: 400 });
  }

  await prisma.match.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
