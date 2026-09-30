"use client";

import Image from "next/image";

// Sektorių žymeklių centrai žemėlapyje (procentais nuo paveikslėlio kairio viršutinio kampo).
// Išmatuoti pagal raudonus žymeklius paveikslėlyje – mygtukai juos uždengia.
const POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 90.3, y: 48.2 },
  2: { x: 81.3, y: 30.6 },
  3: { x: 70.0, y: 28.1 },
  4: { x: 59.1, y: 31.0 },
  5: { x: 49.5, y: 29.2 },
  6: { x: 8.8, y: 48.4 },
  7: { x: 17.6, y: 83.0 },
  8: { x: 24.4, y: 82.4 },
  9: { x: 31.5, y: 83.0 },
  10: { x: 39.3, y: 80.6 },
};

export type MapSector = {
  id: number;
  number: number;
  state: "free" | "taken" | "selected" | "neutral";
};

type Props = {
  sectors: MapSector[];
  onSelect?: (id: number) => void;
};

const STYLES: Record<MapSector["state"], string> = {
  free: "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-110 ring-2 ring-white",
  taken: "bg-stone-400 text-white/90 cursor-not-allowed line-through",
  selected: "bg-wood-500 text-white scale-125 ring-4 ring-white shadow-lg",
  neutral: "bg-red-600 text-white ring-2 ring-white",
};

export function SectorMap({ sectors, onSelect }: Props) {
  return (
    <div className="@container relative w-full overflow-hidden rounded-2xl border border-pine-900/10 bg-white">
      <Image
        src="/images/sektoriu-zemelapis.jpg"
        alt="Šilų (Bridų) tvenkinio sektorių žemėlapis"
        width={531}
        height={253}
        className="h-auto w-full"
        priority
      />
      {sectors.map((s) => {
        const pos = POSITIONS[s.number];
        if (!pos) return null;
        const interactive = !!onSelect && s.state !== "taken";
        const label = `Sektorius ${s.number}${s.state === "taken" ? " (užimtas)" : s.state === "free" ? " (laisvas)" : ""}`;
        return (
          <button
            key={s.id}
            type="button"
            disabled={!interactive}
            onClick={() => onSelect?.(s.id)}
            aria-label={label}
            aria-pressed={s.state === "selected"}
            title={label}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            className={`absolute grid h-[21%] w-[6%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-md text-[3cqw] font-bold transition-transform ${STYLES[s.state]} ${
              interactive ? "cursor-pointer" : s.state === "taken" ? "" : "cursor-default"
            }`}
          >
            {s.number}
          </button>
        );
      })}
    </div>
  );
}
