import { cookies } from "next/headers";
import { verifyJwt } from "./auth";
import { prisma } from "./db";

export async function getUserFromRequest(req?: Request) {
  try {
    const cookieHeader = req ? req.headers.get("cookie") : undefined;
    const token = cookieHeader
      ? cookieHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1]
      : cookies().get("token")?.value;

    if (!token) return null;
    const payload = await verifyJwt(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;
    return { id: user.id, username: user.username };
  } catch {
    return null;
  }
}