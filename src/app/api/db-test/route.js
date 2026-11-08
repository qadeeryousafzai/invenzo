import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT 1 AS connected, DATABASE() AS database_name"
    );

    return NextResponse.json({
      success: true,
      message: "MySQL connected successfully!",
      result: rows[0],
    });
  } catch (error) {
    console.error("Database error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}