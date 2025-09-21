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
  const maps = await prisma.map.findMany({
    where: { userId: session.user.id as string },
    select: { id: true, name: true, icon: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(maps);
}


