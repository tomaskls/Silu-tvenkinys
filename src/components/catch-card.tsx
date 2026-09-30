import Image from "next/image";
import type { CatchPhoto } from "@prisma/client";
import { formatDate } from "@/lib/format";

export function CatchCard({ photo }: { photo: CatchPhoto }) {
  return (
    <figure className="group overflow-hidden rounded-2xl border border-pine-900/10 bg-white">
      <div className="relative aspect-4/3 overflow-hidden">
        <Image
          src={photo.image}
          alt={`${photo.species}${photo.weightKg ? `, ${photo.weightKg} kg` : ""} – ${photo.angler}`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {photo.weightKg && (
          <span className="absolute left-3 top-3 rounded-full bg-pine-950/80 px-3 py-1 text-sm font-semibold text-white">
            {photo.weightKg.toLocaleString("lt-LT")} kg
          </span>
        )}
      </div>
      <figcaption className="p-5">
        <p className="font-semibold text-pine-900">
          {photo.species} · {photo.angler}
        </p>
        <p className="mt-1 text-sm text-pine-700">
          {formatDate(photo.date)}
          {photo.sector ? ` · sektorius Nr. ${photo.sector}` : ""}
        </p>
        {photo.caption && <p className="mt-2 text-sm text-pine-800">{photo.caption}</p>}
      </figcaption>
    </figure>
  );
}
