import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/get-user";

export async function GET(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(expense);
}

export async function PUT(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  const updated = await prisma.expense.updateMany({
    where: { id: params.id, userId: user.id },
    data,
  });

  if (updated.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const expense = await prisma.expense.findUnique({ where: { id: params.id } });
  return NextResponse.json(expense);
}

export async function DELETE(req: NextRequest, { params }: any) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deleted = await prisma.expense.deleteMany({
    where: { id: params.id, userId: user.id },
  });

  if (deleted.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ message: "Deleted successfully" });
}
