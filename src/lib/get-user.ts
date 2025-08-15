import { cookies } from "next/headers";
import { verifyJwt } from "./auth";
import { prisma } from "./db";

interface UserFromRequest {
  id: string;
  username: string;
}

export async function getUserFromRequest(req?: Request): Promise<UserFromRequest | null> {
  try {
    let token: string | undefined;

    if (req) {
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        token = cookieHeader
          .split(";")
          .find((c) => c.trim().startsWith("token="))
          ?.split("=")[1];
      }
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value;
    }

    if (!token) return null;

    const payload = await verifyJwt(token);

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;

    return { id: user.id, username: user.username };
  } catch (error) {
    console.error("Failed to get user from request:", error);
    return null;
  }
}
