import { NextResponse } from "next/server";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "@/lib/swagger.json";

export async function GET() {
  // Serve JSON for Swagger
  return NextResponse.json(swaggerDocument);
}
