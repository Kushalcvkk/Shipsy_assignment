import { PrismaClient } from "@prisma/client";

// Use a global variable to prevent creating multiple instances in development
declare global {
  // eslint-disable-next-line no-var
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
