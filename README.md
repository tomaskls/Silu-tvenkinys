# Šilų (Bridų) tvenkinys – svetainė

Next.js 16 (App Router) + Tailwind CSS 4 + Prisma + PostgreSQL (Neon per Vercel).

## Paleidimas

```bash
npm install
vercel env pull .env      # DATABASE_URL ir kt. iš Vercel (arba cp .env.example .env)
npm run db:push           # sukuria/atnaujina lenteles
npm run db:seed           # 10 sektorių
npm run dev               # http://localhost:3000
```

Duomenų bazės peržiūra/redagavimas: `npm run db:studio`.

## Struktūra

| Kelias | Kas tai |
|---|---|
| `/` | Pradžia |
| `/apie` | Apie tvenkinį, sektorių žemėlapis |
| `/galerija` | Laimikių galerija ([src/content/catches.ts](src/content/catches.ts)) |
| `/varzybos` | Varžybos ([src/content/competitions.ts](src/content/competitions.ts)) |
| `/taisykles` | Žvejybos taisyklės |
| `/rezervacija` | Viešas sektorių užimtumas pagal datą (rezervuojama telefonu) |
| `/admin` | Užimtumo valdymas: sektorių × dienų lentelė, rezervacijų sąrašas |
| `/admin/prisijungti` | Administratoriaus prisijungimas (`ADMIN_USER` / `ADMIN_PASSWORD`) |

- **Tekstai, kontaktai, taisyklės** – [src/content/site.ts](src/content/site.ts) (vietos su `TODO` laukia tikrų duomenų).
- **Kainos ir sektoriai** – `Sector` lentelė (kaina centais), pradinės reikšmės [prisma/seed.ts](prisma/seed.ts).
- **Laimikiai ir varžybos** – [src/content/catches.ts](src/content/catches.ts), [src/content/competitions.ts](src/content/competitions.ts) (ne duomenų bazėje; keičiama per GitHub).
- **Nuotraukos** – `public/images/` (laimikiai – `laimikiai/`, varžybos – `varzybos/`).

## Rezervavimas

Rezervuojama **telefonu**, svetainėje rodomas tik užimtumas.

1. Klientas paskambina, administratorius prisijungia `/admin` (sesija galioja 30 d.).
2. Užimtumo lentelėje paspaudžia laisvą langelį (sektorius × diena), nurodo parų skaičių,
   jei reikia – vardą, telefoną, pastabas. Galima pažymėti kelis sektorius iš karto.
3. Paspaudus esamą rezervaciją ją galima pakeisti (datas, sektorių) arba ištrinti.

Pakeitimai iš karto matomi `/rezervacija` ir pradžios puslapyje; atidarytas užimtumo puslapis
pats atsinaujina kas minutę. Kliento duomenys viešai nerodomi.

- Rezervuojama paromis: `dateFrom` (atvykimas) → `dateTo` (išvykimas iki 11:30, į užimtumą neįskaičiuojama).
- Tas pats sektorius negali būti užimtas dviem rezervacijomis tomis pačiomis dienomis (tikrinama transakcijoje).

## Diegimas

Vercel projektas `silu-tvenkinys` sujungtas su GitHub – kiekvienas `git push` į `master` automatiškai įkelia naują versiją.
Duomenų bazė – Neon (`neon-fuchsia-ladder`), prijungta prie projekto per Vercel Storage.

Pakeitus `prisma/schema.prisma`, prieš push paleiskite `npm run db:push`.

