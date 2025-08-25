import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { talep, requestItem, talepNote, talepFile, talepActivity, businessEntity } from "@/db/schema";
import { eq, and, desc, asc, or, ilike, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/workspaces/[workspaceId]/requests - List requests
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const customerId = searchParams.get("customerId") || "";
    const priority = searchParams.get("priority") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const companyId = searchParams.get("companyId") || "";

    // Build where conditions
    const conditions = [
      eq(talep.workspaceId, workspaceId),
      companyId ? eq(talep.companyId, companyId) : undefined,
      status ? eq(talep.status, status as any) : undefined,
      customerId ? eq(talep.customerId, customerId) : undefined,
      priority ? eq(talep.priority, priority as any) : undefined,
      search ? or(
        ilike(talep.title, `%${search}%`),
        ilike(talep.description, `%${search}%`)
      ) : undefined,
    ].filter(Boolean);

    // Build query
    let query = db
      .select({
        request: talep,
        customer: businessEntity,
      })
      .from(talep)
      .leftJoin(businessEntity, eq(talep.customerId, businessEntity.id))
      .where(and(...conditions));

    // Apply sorting
    const sortDirection = sortOrder === "asc" ? asc : desc;
    switch (sortBy) {
      case "title":
        query = query.orderBy(sortDirection(talep.title));
        break;
      case "status":
        query = query.orderBy(sortDirection(talep.status));
        break;
      case "updatedAt":
        query = query.orderBy(sortDirection(talep.updatedAt));
        break;
      default:
        query = query.orderBy(sortDirection(talep.createdAt));
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    const results = await query;

    // Get item counts for each request
    const requestIds = results.map(r => r.request.id);
    if (requestIds.length > 0) {
      const itemCounts = await db
        .select({
          requestId: requestItem.requestId,
          count: sql<number>`count(*)::int`,
        })
        .from(requestItem)
        .where(inArray(requestItem.requestId, requestIds))
        .groupBy(requestItem.requestId);

      // Merge item counts with results
      const requestsWithCounts = results.map(r => ({
        ...r.request,
        customer: r.customer,
        itemCount: itemCounts.find(ic => ic.requestId === r.request.id)?.count || 0,
      }));

      // Get total count for pagination
      const totalCount = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(talep)
        .where(and(...conditions));

      return NextResponse.json({
        requests: requestsWithCounts,
        pagination: {
          page,
          limit,
          totalCount: totalCount[0]?.count || 0,
          totalPages: Math.ceil((totalCount[0]?.count || 0) / limit),
        },
      });
    }

    return NextResponse.json({
      requests: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/requests - Create new request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const body = await request.json();

    const {
      customerId,
      title,
      description,
      items,
      companyId,
    } = body;

    // Validation
    if (!customerId || !title || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const requestId = nanoid();

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Create the main request
      const [newRequest] = await tx
        .insert(talep)
        .values({
          id: requestId,
          workspaceId,
          companyId,
          customerId,
          title,
          description: description || "",
          status: "new",
          priority: "medium",
          createdBy: session.user.id,
          updatedBy: session.user.id,
        })
        .returning();

      // Create request items
      const itemPromises = items.map((item: any) =>
        tx.insert(requestItem).values({
          id: nanoid(),
          requestId: requestId,
          productId: item.productId,
          specification: item.specification,
          quantity: item.quantity,
          productCode: item.productCode,
          productName: item.productName,
          manufacturer: item.manufacturer,
          model: item.model,
          partNumber: item.partNumber,
          specifications: item.specifications,
          category: item.category,
          targetPrice: item.targetPrice,
          currency: item.currency || "USD",
          notes: item.notes,
          revision: 1,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        }).returning()
      );

      const createdItems = await Promise.all(itemPromises);

      // Log the creation activity
      await tx.insert(talepActivity).values({
        id: nanoid(),
        requestId: requestId,
        activityType: "request_created",
        description: `Request "${title}" created with ${createdItems.length} item(s)`,
        performedBy: session.user.id,
      });

      return { request: newRequest, items: createdItems.flat() };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}