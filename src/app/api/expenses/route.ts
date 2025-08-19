/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import { prisma, Category } from "@/lib/db";
import { getUserFromRequest } from "@/lib/get-user";

type ExpenseSortBy = "createdAt" | "amount" | "title" | "isRecurring";
type ExpenseOrder = "asc" | "desc";

interface ExpenseQueryParams {
  category?: string;
  sortBy?: ExpenseSortBy;
  order?: ExpenseOrder;
  minAmount?: string;
  maxAmount?: string;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const params: ExpenseQueryParams = {
    category: searchParams.get("category") || undefined,
    sortBy: (searchParams.get("sortBy") as ExpenseSortBy) || "createdAt",
    order: (searchParams.get("order") as ExpenseOrder) || "desc",
    minAmount: searchParams.get("minAmount") || undefined,
    maxAmount: searchParams.get("maxAmount") || undefined,
  };

  const where: {
    userId: string;
    category?: Category;
    amount?: { gte?: number; lte?: number };
  } = { userId: user.id };

  if (params.category && params.category !== "ALL") {
    where.category = Category[params.category as keyof typeof Category];
  }

  if (params.minAmount || params.maxAmount) {
    where.amount = {};
    if (params.minAmount) where.amount.gte = parseFloat(params.minAmount);
    if (params.maxAmount) where.amount.lte = parseFloat(params.maxAmount);
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { [params.sortBy!]: params.order },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reqBody = await req.json() as {
    title: string;
    category: string;
    amount: number;
    quantity?: number;          
    isRecurring?: boolean;
    taxPercent?: number;
    discount?: number;
  };

  const categoryEnum: Category = Category[reqBody.category as keyof typeof Category];

  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      title: reqBody.title,
      category: categoryEnum,
      amount: reqBody.amount,
      quantity: reqBody.quantity ?? 1,   
      isRecurring: reqBody.isRecurring ?? false,
      taxPercent: reqBody.taxPercent ?? 0,
      discount: reqBody.discount ?? 0,
    },
  });

  return NextResponse.json(expense);
}
