import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { talep, talepAction, talepActivity, user } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "crypto";

// Schema for creating talep actions
const talepActionSchema = z.object({
  actionType: z.string().min(1, "Action type is required"),
  actionCategory: z.enum([
    "communication",
    "documentation",
    "procurement",
    "technical",
    "other"
  ]).optional().nullable(),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  
  // Communication details
  communicationType: z.enum([
    "email",
    "phone",
    "meeting",
    "site_visit",
    "other"
  ]).optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  contactCompany: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal("")).nullable(),
  contactPhone: z.string().optional().nullable(),
  
  // Outcome
  outcome: z.enum([
    "successful",
    "pending",
    "failed",
    "follow_up_required"
  ]).optional().nullable(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional().nullable(),
  followUpNotes: z.string().optional().nullable(),
  
  // Related data
  relatedProductIds: z.array(z.string()).default([]),
  attachmentIds: z.array(z.string()).default([]),
  
  // Time tracking
  duration: z.number().int().min(0).optional().nullable(),
  actionDate: z.string().optional().nullable(),
  
  metadata: z.record(z.any()).optional().nullable(),
});

// GET - List talep actions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; talepId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { talepId } = await params;

    // Verify access to the talep
    const talepCheck = await db.select()
      .from(talep)
      .where(eq(talep.id, talepId))
      .limit(1);

    if (talepCheck.length === 0) {
      return NextResponse.json(
        { error: "Talep not found" },
        { status: 404 }
      );
    }

    // Get actions for this talep with performer info
    const actions = await db.select({
      action: talepAction,
      performedBy: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    })
      .from(talepAction)
      .leftJoin(user, eq(talepAction.performedBy, user.id))
      .where(eq(talepAction.talepId, talepId))
      .orderBy(desc(talepAction.actionDate));

    return NextResponse.json({
      actions: actions.map(a => ({
        ...a.action,
        performedByUser: a.performedBy
      })),
      count: actions.length
    });

  } catch (error) {
    console.error("Error fetching talep actions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add action to talep
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; talepId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { talepId } = await params;
    const body = await request.json();

    // Validate input
    const validatedData = talepActionSchema.parse(body);

    // Verify access to the talep
    const talepCheck = await db.select()
      .from(talep)
      .where(eq(talep.id, talepId))
      .limit(1);

    if (talepCheck.length === 0) {
      return NextResponse.json(
        { error: "Talep not found" },
        { status: 404 }
      );
    }

    // Create the action
    const newAction = await db.insert(talepAction).values({
      id: randomUUID(),
      talepId,
      ...validatedData,
      actionDate: validatedData.actionDate ? new Date(validatedData.actionDate) : new Date(),
      followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : null,
      performedBy: session.user.id,
    }).returning();

    // Create activity log entry
    await db.insert(talepActivity).values({
      id: randomUUID(),
      talepId,
      activityType: 'action_added',
      description: `${validatedData.actionType}: ${validatedData.title}`,
      performedBy: session.user.id,
    });

    return NextResponse.json({
      action: newAction[0],
      message: "Action recorded successfully"
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating talep action:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}