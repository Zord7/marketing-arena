import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import JudgeClient from "@/components/JudgeClient";

export default async function JudgePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-1">Judge</h1>
      <p className="text-gray-400 mb-8 text-sm">
        Vote for the better ad. You can&apos;t vote on your own matches. One vote per match.
      </p>
      <JudgeClient />
    </div>
  );
}
