import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      message: "Debug users endpoint",
      users: [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

 