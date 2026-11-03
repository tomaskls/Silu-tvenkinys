// Pradiniai duomenys: sektoriai, laimikių nuotraukos ir varžybų pavyzdys.
// Paleidimas: npm run db:seed (saugu kartoti – sektoriai atnaujinami, kiti įrašai kuriami tik jei lentelė tuščia)
import { PrismaClient } from "@prisma/client";
import { catchPhotos } from "./catch-photos";
import { competitions } from "./competitions";

const prisma = new PrismaClient();

// Kaina – 15 € už parą (1500 centų). TODO: patikslinkite sektorių aprašymus
const sectors = [
  { number: 1, description: "Rytinis tvenkinio galas" },
  { number: 2, description: "Šiaurinis krantas, naujas lieptas" },
  { number: 3, description: "Šiaurinis krantas" },
  { number: 4, description: "Šiaurinis krantas, prieš salą" },
  { number: 5, description: "Šiaurinis krantas" },
  { number: 6, description: "Vakarinis tvenkinio galas" },
  { number: 7, description: "Pietinis krantas" },
  { number: 8, description: "Pietinis krantas" },
  { number: 9, description: "Pietinis krantas" },
  { number: 10, description: "Pietinis krantas, naujas lieptas" },
];

async function main() {
  for (const s of sectors) {
    await prisma.sector.upsert({
      where: { number: s.number },
      update: { description: s.description },
      create: {
        number: s.number,
        name: `Sektorius Nr. ${s.number}`,
        description: s.description,
        pricePerDay: 1500,
        maxAnglers: 2,
      },
    });
  }

  if ((await prisma.catchPhoto.count()) === 0) {
    // Atvirkščiai – tos pačios dienos nuotraukos galerijoje rikiuojamos pagal id mažėjančiai
    await prisma.catchPhoto.createMany({ data: [...catchPhotos].reverse() });
  }

  if ((await prisma.competition.count()) === 0) {
    for (const data of competitions) await prisma.competition.create({ data });
  }

  console.log("Duomenys įkelti.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
