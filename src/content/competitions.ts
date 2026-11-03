// Varžybos – artėjančios ir įvykusios. Nuotraukos – public/images/varzybos/.

export type Competition = {
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  description: string;
  entryFee?: number; // centais
  maxTeams?: number;
  image?: string;
  // Papildomos nuotraukos (rodomos po rezultatais)
  photos?: string[];
  // Rezultatai po varžybų (laisvas tekstas)
  results?: string;
};

/** Varžybos, kurios dar nesibaigė, artimiausios pirmos. */
export function upcomingCompetitions(today: string) {
  return competitions.filter((c) => (c.endDate ?? c.date) >= today).sort((a, b) => a.date.localeCompare(b.date));
}

/** Įvykusios varžybos, naujausios pirmos. */
export function pastCompetitions(today: string) {
  return competitions.filter((c) => (c.endDate ?? c.date) < today).sort((a, b) => b.date.localeCompare(a.date));
}

export const competitions: Competition[] = [
  {
    title: "Šilų rugpjūčio taurė",
    date: "2026-08-14",
    endDate: "2026-08-17",
    description:
      "Devynios komandos, šeši svėrimai ir kova iki paskutinės minutės. For Fun pirmą vietą užėmė po antrojo svėrimo ir jos nebepaleido iki pat pabaigos, o antra ir trečia vietos keitėsi po kiekvieno svėrimo. Iš viso sugautos 45 žuvys, bendras svoris – 268,4 kg. Didžiausią žuvį, 20,525 kg, For Fun ištraukė 11:50, likus vos dešimčiai minučių iki paskutinio svėrimo.",
    results: [
      "1. For Fun – 78,850 kg (11 žuvų)",
      "2. D&N Carp – 39,950 kg (8 žuvys)",
      "3. TMH – 34,375 kg (6 žuvys)",
      "4. Munnte Fishing – 33,075 kg (5 žuvys)",
      "5. Ežero šešėliai – 32,355 kg (7 žuvys)",
      "6. Šakių karpis – 20,950 kg (3 žuvys)",
      "7. Du žemaite – 18,875 kg (3 žuvys)",
      "8. Kablio kariai – 5,350 kg (1 žuvis)",
      "9. Dar nepagavę – 4,600 kg (1 žuvis)",
      "",
      "Big Fish – For Fun, 20,525 kg (pagautas 11:50)",
    ].join("\n"),
    image: "/images/varzybos/rugpjucio-taure-2026-prizai.jpg",
    photos: [
      "/images/laimikiai/129.jpg",
      "/images/varzybos/rugpjucio-taure-2026-1.jpg",
      "/images/varzybos/rugpjucio-taure-2026-2.jpg",
      "/images/varzybos/rugpjucio-taure-2026-3.jpg",
      "/images/varzybos/rugpjucio-taure-2026-4.jpg",
      "/images/varzybos/rugpjucio-taure-2026-5.jpg",
      "/images/varzybos/rugpjucio-taure-2026-6.jpg",
    ],
  },
];
