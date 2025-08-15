import { PrismaClient, Category } from "@prisma/client";

// Avoid multiple PrismaClient instances in development
declare global {
  // This is needed for TypeScript to recognize our global Prisma instance
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}

// Re-export Category enum directly for convenience
export { Category };
// export type { PrismaClient };