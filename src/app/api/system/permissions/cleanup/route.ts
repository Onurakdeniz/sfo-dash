import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { modulePermissions } from "@/db/schema";
import { notInArray } from "drizzle-orm";

// Development-only endpoint to remove non-allowed permission actions
export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "This endpoint is only available in development" },
        { status: 403 }
      );
    }

    const allowed = ["view", "edit", "approve", "manage"] as const;

    const deleted = await db
      .delete(modulePermissions)
      .where(notInArray(modulePermissions.action, allowed));

    return NextResponse.json({ success: true, message: "Permissions cleanup done" });
  } catch (error) {
    console.error("Error cleaning permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


