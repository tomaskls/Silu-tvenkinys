// Visa redaguojama svetainės informacija vienoje vietoje.
// Vietas, pažymėtas „TODO“, reikia užpildyti tikrais duomenimis.

// Tvenkinio vieta (Google Maps koordinatės)
const location = { lat: "55.995170", lng: "23.344508" };

export const site = {
  name: "Šilų (Bridų) tvenkinys",
  shortName: "Šilų tvenkinys",
  tagline: "Limituota žūklė ramioje gamtoje – 10 įrengtų sektorių su lieptais",
  phone: "+370 676 75187",
  phoneHref: "tel:+37067675187",
  address: "Šilų (Bridų) tvenkinys, Lietuva", // TODO: tikslus adresas
  location,
  mapEmbedUrl: `https://www.google.com/maps?q=${location.lat},${location.lng}&z=14&output=embed`,
  directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
  wazeUrl: `https://waze.com/ul?ll=${location.lat},${location.lng}&navigate=yes`,
  facebookUrl: "", // TODO

  booking: {
    // Para skaičiuojama nuo atvykimo dienos iki kitos dienos
    checkInTime: "12:00",
    checkOutTime: "11:30",
    maxDays: 7,
    // Kiek dienų į priekį rodomas užimtumas
    bookingWindowDays: 180,
  },
};

export const nav = [
  { href: "/", label: "Pradžia" },
  { href: "/apie", label: "Apie tvenkinį" },
  { href: "/galerija", label: "Laimikiai" },
  { href: "/varzybos", label: "Varžybos" },
  { href: "/taisykles", label: "Taisyklės" },
];

export const pondFacts = [
  { label: "Sektoriai", value: "10" },
  { label: "Tvenkinio rekordas", value: "20+ kg" },
  { label: "Žūklės tipas", value: "Limituota" },
  { label: "Teritorija", value: "Stebima kameromis" },
];

export const pondAbout = {
  intro:
    "Šilų (Bridų) tvenkinys – ramus, pušynų ir beržynų apsuptas vandens telkinys, skirtas limituotai karpių žūklei. Aplink tvenkinį įrengta 10 numeruotų sektorių su mediniais lieptais, todėl kiekvienas žvejys turi savo erdvę ir ramybę.",
  paragraphs: [
    "Tvenkinyje gausu karpių – nuo kelių kilogramų iki tikrų trofėjų, sveriančių daugiau nei 20 kg. Žvejojama tik su leidimais, o teritorija stebima kameromis.",
    "Sektoriai išdėstyti abiejuose tvenkinio krantuose: 1–5 šiauriniame krante, 6 vakariniame gale, 7–10 pietiniame krante. Viduryje tvenkinio yra nedidelė sala.",
    // TODO: papildykite – plotas, gylis, žuvų rūšys, įžuvinimas, patogumai (WC, automobilių stovėjimas, palapinės ir pan.)
  ],
  species: ["Karpis", "Amūras", "Lynas"], // TODO: patikslinti
  amenities: [
    "Mediniai lieptai kiekviename sektoriuje",
    "Vieta palapinei ir kėdėms prie sektoriaus",
    "Privažiavimas automobiliu", // TODO: patikslinti
    "Kameromis stebima teritorija",
  ],
};

export const rules: { title: string; items: string[] }[] = [
  // TODO: peržiūrėkite ir pakoreguokite pagal tikras tvenkinio taisykles
  {
    title: "Bendrosios nuostatos",
    items: [
      "Žvejoti galima tik turint galiojantį leidimą (rezervaciją) ir tik rezervuotame sektoriuje.",
      "Žvejys privalo turėti asmens dokumentą ir, esant reikalui, jį pateikti tvenkinio administracijai.",
      `Para prasideda ${site.booking.checkInTime} atvykimo dieną ir baigiasi ${site.booking.checkOutTime} išvykimo dieną.`,
      "Teritorija stebima vaizdo kameromis.",
    ],
  },
  {
    title: "Žvejybos įrankiai",
    items: [
      "Vienam žvejui leidžiama naudoti ne daugiau kaip 2 meškeres (TODO: patikslinti).",
      "Privaloma turėti ne mažesnį kaip 90 cm graibštą ir žuvies neštuvus / kilimėlį (mat).",
      "Draudžiama naudoti trigubus kabliukus ir kitus žuvį žalojančius įrankius.",
      "Jaukų kiekis – saikingas; draudžiama mesti pelėsinius ar sugedusius jaukus.",
    ],
  },
  {
    title: "Elgesys su žuvimi",
    items: [
      "Taikomas principas „pagavai – paleisk“ (TODO: patikslinti, ar galima pasiimti žuvį).",
      "Žuvis turi būti laikoma drėgna, ant kilimėlio, ne ant žemės ir ne ant lieptų.",
      "Fotografuojant žuvį laikykite žemai virš kilimėlio.",
      "Žuvį paleisti kuo greičiau, nelaikyti tinkleliuose ar maišuose.",
    ],
  },
  {
    title: "Tvarka ir sauga",
    items: [
      "Palikite sektorių švarų – visas šiukšles išsivežkite.",
      "Laužą kūrenti galima tik tam skirtose vietose (TODO: patikslinti).",
      "Draudžiama triukšmauti ir trukdyti kitiems žvejams, ypač nakties metu.",
      "Maudytis tvenkinyje draudžiama.",
      "Už taisyklių pažeidimus administracija gali nutraukti žvejybą be pinigų grąžinimo.",
    ],
  },
  {
    title: "Rezervavimas ir atšaukimas",
    items: [
      `Sektoriai rezervuojami telefonu ${site.phone}. Laisvus sektorius matysite puslapyje „Sektorių užimtumas“.`,
      "Negalėdami atvykti, praneškite kuo anksčiau – sektorių atlaisvinsime kitiems žvejams (TODO: patikslinti atšaukimo sąlygas).",
      "Dėl blogų oro sąlygų ar kitų aplinkybių susisiekite telefonu.",
    ],
  },
];
