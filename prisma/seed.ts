// Pradiniai duomenys: sektoriai. Laimikiai ir varžybos – src/content/ (ne duomenų bazėje).
// Paleidimas: npm run db:seed (saugu kartoti – sektoriai atnaujinami)
import { PrismaClient } from "@prisma/client";

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

  console.log("Duomenys įkelti.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
