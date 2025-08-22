import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { customerContact } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// GET - List customer contacts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { customerId } = await params;

    // Get all contacts for this customer
    const contacts = await db.select()
      .from(customerContact)
      .where(
        and(
          eq(customerContact.customerId, customerId),
          isNull(customerContact.deletedAt)
        )
      )
      .orderBy(customerContact.isPrimary, customerContact.firstName);

    return NextResponse.json({
      contacts,
      count: contacts.length
    });

  } catch (error) {
    console.error("Error fetching customer contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
