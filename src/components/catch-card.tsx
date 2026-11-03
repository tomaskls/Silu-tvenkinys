import Image from "next/image";
import type { CatchPhoto } from "@prisma/client";

const SIZES = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

export function CatchCard({ photo }: { photo: CatchPhoto }) {
  const weight = photo.weightLabel ?? (photo.weightKg ? `${photo.weightKg.toLocaleString("lt-LT")} kg` : null);
  // Rodomas tik svoris ir vardas; be svorio – jokio užrašo
  const label = weight && [weight, photo.angler].filter(Boolean).join(" · ");

  return (
    // Nuotraukos būna ir stačios, ir gulsčios – rodome visą, o tuščius kraštus užpildo išblukinta ta pati nuotrauka
    <figure className="group relative aspect-square overflow-hidden rounded-2xl bg-pine-900">
      <Image src={photo.image} alt="" aria-hidden fill sizes={SIZES} className="scale-110 object-cover opacity-60 blur-xl" />
      <Image
        src={photo.image}
        alt={[photo.species, weight, photo.angler].filter(Boolean).join(", ")}
        fill
        sizes={SIZES}
        className="object-contain transition-transform duration-500 group-hover:scale-105"
      />
      {label && (
        <figcaption className="absolute left-3 top-3 rounded-full bg-pine-950/80 px-3 py-1 text-sm font-semibold text-white">
          {label}
        </figcaption>
      )}
    </figure>
  );
}
