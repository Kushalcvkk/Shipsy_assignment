import { NextRequest, NextResponse } from "next/server";
import { prisma, Category } from "@/lib/db";
import { getUserFromRequest } from "@/lib/get-user";

// No custom Params interface needed — just destructure params directly
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(expense);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: {
    title?: string;
    category?: string;
    amount?: number;
    isRecurring?: boolean;
    taxPercent?: number;
    discount?: number;
  } = await req.json();

  const updateData: any = { ...body };
  if (body.category) {
    updateData.category = Category[body.category as keyof typeof Category];
  }

  const updated = await prisma.expense.updateMany({
    where: { id: params.id, userId: user.id },
    data: updateData,
  });

  if (updated.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, userId: user.id },
  });

  return NextResponse.json(expense);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deleted = await prisma.expense.deleteMany({
    where: { id: params.id, userId: user.id },
  });

  if (deleted.count === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ message: "Deleted successfully" });
}
