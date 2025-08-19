/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import { prisma, Category } from "@/lib/db";
import { getUserFromRequest } from "@/lib/get-user";

type ExpenseUpdate = {
  title?: string;
  category?: keyof typeof Category;
  amount?: number;
  quantity?: number;       
  isRecurring?: boolean;
  taxPercent?: number;
  discount?: number;
};

// ------------------ GET ------------------
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const expense = await prisma.expense.findFirst({
      where: { id, userId: user.id },
    });

    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    return NextResponse.json(expense);
  } catch (err) {
    console.error("GET /expense/:id error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ------------------ PUT ------------------
export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body: ExpenseUpdate = await req.json();

    const updateData: ExpenseUpdate = { ...body };
    if (body.category) updateData.category = body.category;

    //  Edit Using updateMany (safe with no unique constraint)
    const updated = await prisma.expense.updateMany({
      where: { id, userId: user.id },
      data: updateData,
    });

    if (updated.count === 0)
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    const expense = await prisma.expense.findFirst({
      where: { id, userId: user.id },
    });

    return NextResponse.json(expense);
  } catch (err) {
    console.error("PUT /expense/:id error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// ------------------ DELETE ------------------
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const deleted = await prisma.expense.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0)
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE /expense/:id error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
