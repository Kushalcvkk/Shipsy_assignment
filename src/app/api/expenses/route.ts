import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/get-user";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, category, amount, isRecurring, taxPercent, discount } = await req.json();

    const expense = await prisma.expense.create({
      data: {
        userId: user.id,
        title,
        category,
        amount,
        isRecurring: isRecurring ?? false,
        taxPercent: taxPercent ?? 0,
        discount: discount ?? 0,
      },
    });

    return NextResponse.json(expense);
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") || "desc";
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    const where: any = { userId: user.id };

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (minAmount) {
      where.amount = { ...where.amount, gte: parseFloat(minAmount) };
    }
    if (maxAmount) {
      where.amount = { ...where.amount, lte: parseFloat(maxAmount) };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { [sortBy]: order },
    });

    return NextResponse.json(expenses);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
