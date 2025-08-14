import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/get-user";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // Filtering
    const categoryFilter = searchParams.get("category") || "all";

    // Sorting
    const sortBy = searchParams.get("sortBy") || "date-desc";

    // Prisma sort mapping
    let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
    if (sortBy === "date-asc") orderBy = { createdAt: "asc" };
    if (sortBy === "amount-desc") orderBy = { amount: "desc" };
    if (sortBy === "amount-asc") orderBy = { amount: "asc" };

    const whereClause: Record<string, any> = { userId: user.id };
    if (categoryFilter !== "all") {
      whereClause.category = categoryFilter;
    }

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy,
    });

    return NextResponse.json(expenses);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
