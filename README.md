# Šilų (Bridų) tvenkinys – svetainė

Next.js 16 (App Router) + Tailwind CSS 4 + Prisma (SQLite kūrimui).

## Paleidimas

```bash
npm install
cp .env.example .env      # ir užpildykite
npm run db:push           # sukuria duomenų bazę
npm run db:seed           # 10 sektorių, laimikiai, varžybų pavyzdys
npm run dev               # http://localhost:3000
```

Duomenų bazės peržiūra/redagavimas: `npm run db:studio`.

## Struktūra

| Kelias | Kas tai |
|---|---|
| `/` | Pradžia |
| `/apie` | Apie tvenkinį, sektorių žemėlapis |
| `/galerija` | Laimikių galerija (`CatchPhoto` lentelė) |
| `/varzybos` | Varžybos (`Competition` lentelė) |
| `/taisykles` | Žvejybos taisyklės |
| `/rezervacija` | Sektoriaus rezervacija pagal datą |
| `/rezervacija/[id]` | Rezervacijos būsena |
| `/admin` | Rezervacijų sąrašas (slaptažodis – `ADMIN_USER` / `ADMIN_PASSWORD`) |

- **Tekstai, kontaktai, taisyklės** – [src/content/site.ts](src/content/site.ts) (vietos su `TODO` laukia tikrų duomenų).
- **Kainos ir sektoriai** – `Sector` lentelė (kaina centais), pradinės reikšmės [prisma/seed.ts](prisma/seed.ts).
- **Nuotraukos** – `public/images/`.

## Rezervavimo logika

- Rezervuojama paromis: `dateFrom` (atvykimas) → `dateTo` (išvykimas, 12:00).
- Sukūrus rezervaciją ji būna `PENDING` ir sektorių laiko 30 min. (`site.booking.holdMinutes`).
  Jei per tą laiką neapmokama – sektorius vėl laisvas.
- Gavus apmokėjimą – `PAID`. Du žmonės negali užimti to paties sektoriaus tomis pačiomis dienomis
  (tikrinama transakcijoje).

## Montonio mokėjimai

Integracija jau parašyta ([src/lib/payments/montonio.ts](src/lib/payments/montonio.ts)), tereikia raktų:

1. Montonio partnerių sistemoje susikurkite parduotuvę ir gaukite **Access Key** ir **Secret Key**
   (pradžiai – sandbox raktus).
2. Įrašykite į `.env`: `MONTONIO_ACCESS_KEY`, `MONTONIO_SECRET_KEY`, `MONTONIO_ENV=sandbox`.
3. `SITE_URL` turi būti viešas adresas – Montonio siunčia patvirtinimą į `SITE_URL/api/montonio/webhook`.
   Testuojant lokaliai galima naudoti pvz. `ngrok`.
4. Išbandę sandbox aplinkoje, pakeiskite į produkcinius raktus ir `MONTONIO_ENV=production`.

Kol raktai neįrašyti, naudojamas **testinis mokėjimo puslapis** (tik kūrimo aplinkoje).

## Diegimas į produkciją

SQLite netinka serverless platformoms (pvz. Vercel). Produkcijai:
`prisma/schema.prisma` pakeiskite `provider = "postgresql"`, nustatykite `DATABASE_URL`
(pvz. Neon, Supabase) ir paleiskite `npm run db:push && npm run db:seed`.
