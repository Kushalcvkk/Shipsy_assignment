// prisma/seed.js
const { PrismaClient } = require('../src/generated/prisma'); // <- adjusted path
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.expense.deleteMany(); // optional: clear existing data

  await prisma.expense.createMany({
    data: [
      { title: "Groceries", amount: 50, category: "Food", date: new Date() },
      { title: "Bus Ticket", amount: 15, category: "Transport", date: new Date() },
      { title: "Electricity Bill", amount: 120, category: "Utilities", date: new Date() },
      { title: "Internet Bill", amount: 40, category: "Utilities", date: new Date() },
      { title: "Movie Tickets", amount: 25, category: "Entertainment", date: new Date() },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
