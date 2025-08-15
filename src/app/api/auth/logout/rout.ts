/* eslint-disable */
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  // Clear the cookie/session (adjust "token" to your auth cookie)
  return NextResponse.json(
    { message: "Logged out successfully" },
    {
      status: 200,
      headers: {
        "Set-Cookie": "token=; Path=/; HttpOnly; Max-Age=0",
      },
    }
  );
}
