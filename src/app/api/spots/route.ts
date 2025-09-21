import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const spots = await prisma.spot.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      latitude: true,
      longitude: true,
      imageUrl: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(spots);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { title, description, latitude, longitude, imageUrl } = body ?? {};
  if (!title || typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const spot = await prisma.spot.create({
    data: {
      title,
      description,
      latitude,
      longitude,
      imageUrl: imageUrl || null,
      userId: session.user.id as string,
    },
  });
  return NextResponse.json(spot, { status: 201 });
}


