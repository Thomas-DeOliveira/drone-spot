import { prisma } from "@/lib/prisma";
import { Tag as TagIcon } from "lucide-react";

export default async function TagsBadges({ spotId }: { spotId: string }) {
  const spot = await prisma.spot.findUnique({
    where: { id: spotId },
    select: { tags: { select: { name: true }, orderBy: { name: "asc" } } },
  });
  const tags = spot?.tags ?? [];
  if (tags.length === 0) return null;
  return (
    <div className="rounded-xl border p-4 bg-card text-card-foreground shadow-sm">
      <div className="text-sm font-medium mb-2">Tags</div>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.name}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium hover:bg-primary/15 transition-colors"
          >
            <TagIcon className="h-3.5 w-3.5" />
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}


