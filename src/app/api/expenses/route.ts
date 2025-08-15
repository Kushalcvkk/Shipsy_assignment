import { NextRequest, NextResponse } from "next/server";
import { prisma, Category } from "@/lib/db";
import { getUserFromRequest } from "@/lib/get-user";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;

    const expense = await prisma.expense.findFirst({
      where: { id, userId: user.id },
    });

    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    return NextResponse.json(expense);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;
    const body = await req.json() as {
      title?: string;
      category?: string;
      amount?: number;
      isRecurring?: boolean;
      taxPercent?: number;
      discount?: number;
    };

    const updateData: any = { ...body };
    if (body.category) {
      updateData.category = Category[body.category as keyof typeof Category];
    }

    const expense = await prisma.expense.updateMany({
      where: { id, userId: user.id },
      data: updateData,
    });

    if (expense.count === 0) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;

    const deleted = await prisma.expense.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
