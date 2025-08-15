import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";

interface RegisterBody {
  username: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RegisterBody = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    });

    return NextResponse.json({ id: user.id, username: user.username });
  } catch (_err) {
    // prefixed with _ to avoid ESLint warning about unused variable
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
