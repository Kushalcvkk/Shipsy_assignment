/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db"; // adjust if needed

// Type for the request body
interface SignupRequestBody {
  username: string;
  password: string;
}

// Type for the response user object
interface UserResponse {
  id: string; // <-- changed from number to string
  username: string;
  createdAt: Date;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: Partial<SignupRequestBody> = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const user: UserResponse = await prisma.user.create({
      data: { username, password: hash },
      select: { id: true, username: true, createdAt: true },
    });

    return NextResponse.json(
      { message: "User created", user },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
