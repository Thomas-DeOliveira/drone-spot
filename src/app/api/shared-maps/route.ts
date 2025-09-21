import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 200 });
  }
  const shared = await prisma.mapShare.findMany({
    where: {
      OR: [
        { invitedUserId: session.user.id as string },
        { invitedEmail: (session.user.email as string) || "" },
      ],
    },
    select: { role: true, map: { select: { id: true, name: true, icon: true } } },
    orderBy: { createdAt: "desc" },
  });
  const result = shared.map((s) => ({ ...s.map, role: s.role }));
  return NextResponse.json(result);
}


