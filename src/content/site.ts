// Visa redaguojama svetainės informacija vienoje vietoje.
// Vietas, pažymėtas „TODO“, reikia užpildyti tikrais duomenimis.

export const site = {
  name: "Šilų (Bridų) tvenkinys",
  shortName: "Šilų tvenkinys",
  tagline: "Limituota žūklė ramioje gamtoje – 10 įrengtų sektorių su lieptais",
  phone: "+370 676 75187",
  phoneHref: "tel:+37067675187",
  email: "info@silutvenkinys.lt", // TODO: tikras el. paštas
  address: "Šilų (Bridų) tvenkinys, Lietuva", // TODO: tikslus adresas
  // TODO: įrašykite tikslias koordinates (Google Maps → dešinys pelės mygtukas → koordinatės)
  mapEmbedUrl: "",
  facebookUrl: "", // TODO

  booking: {
    // Para skaičiuojama nuo atvykimo dienos iki kitos dienos
    checkInTime: "12:00",
    checkOutTime: "12:00",
    maxDays: 7,
    // Kiek dienų į priekį galima rezervuoti
    bookingWindowDays: 180,
    // Kiek minučių laikomas neapmokėtas rezervavimas
    holdMinutes: 30,
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
  { label: "Didžiausias karpis", value: "20+ kg" },
  { label: "Žūklės tipas", value: "Limituota" },
  { label: "Teritorija", value: "Saugoma" },
];

export const pondAbout = {
  intro:
    "Šilų (Bridų) tvenkinys – ramus, pušynų ir beržynų apsuptas vandens telkinys, skirtas limituotai karpių žūklei. Aplink tvenkinį įrengta 10 numeruotų sektorių su mediniais lieptais, todėl kiekvienas žvejys turi savo erdvę ir ramybę.",
  paragraphs: [
    "Tvenkinyje gausu karpių – nuo kelių kilogramų iki tikrų trofėjų, sveriančių daugiau nei 20 kg. Žvejojama tik su leidimais, o teritorija yra saugoma.",
    "Sektoriai išdėstyti abiejuose tvenkinio krantuose: 1–5 šiauriniame krante, 6 vakariniame gale, 7–10 pietiniame krante. Viduryje tvenkinio yra nedidelė sala.",
    // TODO: papildykite – plotas, gylis, žuvų rūšys, įžuvinimas, patogumai (WC, automobilių stovėjimas, palapinės ir pan.)
  ],
  species: ["Karpis", "Amūras", "Lynas", "Karosas"], // TODO: patikslinti
  amenities: [
    "Mediniai lieptai kiekviename sektoriuje",
    "Vieta palapinei ir kėdėms prie sektoriaus",
    "Privažiavimas automobiliu", // TODO: patikslinti
    "Saugoma teritorija",
  ],
};

export const rules: { title: string; items: string[] }[] = [
  // TODO: peržiūrėkite ir pakoreguokite pagal tikras tvenkinio taisykles
  {
    title: "Bendrosios nuostatos",
    items: [
      "Žvejoti galima tik turint galiojantį leidimą (rezervaciją) ir tik rezervuotame sektoriuje.",
      "Žvejys privalo turėti asmens dokumentą ir, esant reikalui, jį pateikti tvenkinio administracijai.",
      "Para prasideda 12:00 atvykimo dieną ir baigiasi 12:00 išvykimo dieną.",
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
      "Rezervacija patvirtinama tik gavus apmokėjimą.",
      "Atšaukus likus daugiau nei 72 val. iki atvykimo, pinigai grąžinami (TODO: patikslinti).",
      "Dėl blogų oro sąlygų ar kitų aplinkybių susisiekite telefonu.",
    ],
  },
];
