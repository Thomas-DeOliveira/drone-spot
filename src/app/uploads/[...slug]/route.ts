import { NextResponse } from "next/server";
import { join, normalize, relative } from "path";
import { readFile } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getContentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await ctx.params;
  // empêche la traversée de répertoires
  const uploadsDir = join(process.cwd(), "public", "uploads");
  const requested = normalize(join(uploadsDir, ...slug));
  if (!requested.startsWith(uploadsDir) || relative(uploadsDir, requested).startsWith("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const data = await readFile(requested);
    const contentType = getContentType(requested);
    // Envoyer en Uint8Array pour rester compatible avec BodyInit
    const body = new Uint8Array(data);
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // cache raisonnable pour des fichiers immuables par nom
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}


