import Image from "next/image";
import type { CatchPhoto } from "@prisma/client";

export function CatchCard({ photo }: { photo: CatchPhoto }) {
  const weight = photo.weightLabel ?? (photo.weightKg ? `${photo.weightKg.toLocaleString("lt-LT")} kg` : null);
  // Rodomas tik svoris ir vardas; be svorio – jokio užrašo
  const label = weight && [weight, photo.angler].filter(Boolean).join(" · ");

  return (
    <figure className="group relative aspect-4/3 overflow-hidden rounded-2xl bg-pine-100">
      <Image
        src={photo.image}
        alt={[photo.species, weight, photo.angler].filter(Boolean).join(", ")}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {label && (
        <figcaption className="absolute left-3 top-3 rounded-full bg-pine-950/80 px-3 py-1 text-sm font-semibold text-white">
          {label}
        </figcaption>
      )}
    </figure>
  );
}
