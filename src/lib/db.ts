import { PrismaClient, Category as PrismaCategory } from "@prisma/client";

// Use a global variable to prevent creating multiple instances in development
declare global {
  var __globalPrisma__: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__globalPrisma__ ||
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__globalPrisma__ = prisma;
}

// Re-export the enum directly
export { PrismaCategory as Category };
