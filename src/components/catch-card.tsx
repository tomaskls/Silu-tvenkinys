import type { CatchPhoto } from "@/content/catches";
import { FramedPhoto } from "@/components/framed-photo";

export function CatchCard({ photo }: { photo: CatchPhoto }) {
  const weight = photo.weightLabel ?? (photo.weightKg ? `${photo.weightKg.toLocaleString("lt-LT")} kg` : null);
  // Rodomas tik svoris ir vardas; be svorio – jokio užrašo
  const label = weight && [weight, photo.angler].filter(Boolean).join(" · ");

  return (
    <figure className="group relative aspect-square overflow-hidden rounded-2xl bg-pine-900">
      <FramedPhoto
        src={photo.image}
        alt={[photo.species, weight, photo.angler].filter(Boolean).join(", ")}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="transition-transform duration-500 group-hover:scale-105"
      />
      {label && (
        <figcaption className="absolute left-3 top-3 rounded-full bg-pine-950/80 px-3 py-1 text-sm font-semibold text-white">
          {label}
        </figcaption>
      )}
    </figure>
  );
}
