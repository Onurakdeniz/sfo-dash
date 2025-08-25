"use server";

import { db } from "@/db";
import { talep, requestItem, talepNote, talepFile, talepActivity, RequestType, RequestItemType } from "@/db/schema/tables/talep";
import { businessEntity } from "@/db/schema/tables/businessEntity";
import { eq, and, desc, asc, or, ilike, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/actions/user/auth";
import { revalidatePath } from "next/cache";

// Types for service functions
export interface CreateRequestInput {
  customerId: string;
  title: string;
  description?: string;
  items: CreateRequestItemInput[];
  workspaceId: string;
  companyId: string;
}

export interface CreateRequestItemInput {
  productId?: string;
  specification: string;
  quantity: number;
  productCode?: string;
  productName?: string;
  manufacturer?: string;
  model?: string;
  partNumber?: string;
  specifications?: any;
  category?: string;
  targetPrice?: string;
  currency?: string;
  notes?: string;
}

export interface UpdateRequestStatusInput {
  requestId: string;
  newStatus: "new" | "clarification" | "supplier_inquiry" | "pricing" | "offer" | "negotiation" | "closed";
  notes?: string;
}

export interface ReviseRequestItemInput {
  itemId: string;
  specification?: string;
  quantity?: number;
  productCode?: string;
  productName?: string;
  manufacturer?: string;
  model?: string;
  specifications?: any;
  targetPrice?: string;
  notes?: string;
}

/**
 * RequestService - Backend logic for the Request (Talep) Module
 * Handles all operations for managing customer requests and their lifecycle
 */
export class RequestService {
  /**
   * Creates a new Request and its associated RequestItems in a single transaction
   */
  static async createRequest(input: CreateRequestInput) {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const requestId = uuidv4();
      
      // Start a transaction
      const result = await db.transaction(async (tx) => {
        // Create the main request
        const [newRequest] = await tx
          .insert(talep)
          .values({
            id: requestId,
            workspaceId: input.workspaceId,
            companyId: input.companyId,
            customerId: input.customerId,
            title: input.title,
            description: input.description || "",
            status: "new",
            priority: "medium",
            createdBy: session.user.id,
            updatedBy: session.user.id,
          })
          .returning();

        // Create request items
        const itemPromises = input.items.map((item) =>
          tx.insert(requestItem).values({
            id: uuidv4(),
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

        const items = await Promise.all(itemPromises);

        // Log the creation activity
        await tx.insert(talepActivity).values({
          id: uuidv4(),
          requestId: requestId,
          activityType: "request_created",
          description: `Request "${input.title}" created with ${items.length} item(s)`,
          performedBy: session.user.id,
        });

        return { request: newRequest, items: items.flat() };
      });

      revalidatePath("/[workspaceSlug]/[companySlug]/talep", "page");
      return result;
    } catch (error) {
      console.error("Error creating request:", error);
      throw error;
    }
  }

  /**
   * Fetches a single request and all its related data for display on the detail page
   */
  static async getRequestWithDetails(requestId: string) {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      // Fetch the main request with customer info
      const requestData = await db
        .select({
          request: talep,
          customer: businessEntity,
        })
        .from(talep)
        .leftJoin(businessEntity, eq(talep.customerId, businessEntity.id))
        .where(eq(talep.id, requestId))
        .limit(1);

      if (!requestData.length) {
        throw new Error("Request not found");
      }

      // Fetch request items
      const items = await db
        .select()
        .from(requestItem)
        .where(eq(requestItem.requestId, requestId))
        .orderBy(asc(requestItem.createdAt));

      // Fetch files
      const files = await db
        .select()
        .from(talepFile)
        .where(eq(talepFile.requestId, requestId))
        .orderBy(desc(talepFile.createdAt));

      // Fetch notes
      const notes = await db
        .select()
        .from(talepNote)
        .where(eq(talepNote.requestId, requestId))
        .orderBy(desc(talepNote.createdAt));

      // Fetch activity log
      const activities = await db
        .select()
        .from(talepActivity)
        .where(eq(talepActivity.requestId, requestId))
        .orderBy(desc(talepActivity.createdAt))
        .limit(50);

      return {
        ...requestData[0].request,
        customer: requestData[0].customer,
        items,
        files,
        notes,
        activities,
      };
    } catch (error) {
      console.error("Error fetching request details:", error);
      throw error;
    }
  }

  /**
   * Changes the status of a request and logs this action in the WorkflowAction audit trail
   */
  static async updateRequestStatus(input: UpdateRequestStatusInput) {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const result = await db.transaction(async (tx) => {
        // Get current status
        const [currentRequest] = await tx
          .select({ status: talep.status })
          .from(talep)
          .where(eq(talep.id, input.requestId))
          .limit(1);

        if (!currentRequest) {
          throw new Error("Request not found");
        }

        // Update the status
        const [updatedRequest] = await tx
          .update(talep)
          .set({
            status: input.newStatus,
            updatedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(talep.id, input.requestId))
          .returning();

        // Log the status change
        await tx.insert(talepActivity).values({
          id: uuidv4(),
          requestId: input.requestId,
          activityType: "status_change",
          description: `Status changed from "${currentRequest.status}" to "${input.newStatus}"${input.notes ? `: ${input.notes}` : ""}`,
          oldValue: currentRequest.status,
          newValue: input.newStatus,
          performedBy: session.user.id,
        });

        return updatedRequest;
      });

      revalidatePath("/[workspaceSlug]/[companySlug]/talep", "page");
      return result;
    } catch (error) {
      console.error("Error updating request status:", error);
      throw error;
    }
  }

  /**
   * Adds a new line item to an existing request
   */
  static async addRequestItem(requestId: string, itemData: CreateRequestItemInput) {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const result = await db.transaction(async (tx) => {
        const itemId = uuidv4();
        
        const [newItem] = await tx
          .insert(requestItem)
          .values({
            id: itemId,
            requestId: requestId,
            productId: itemData.productId,
            specification: itemData.specification,
            quantity: itemData.quantity,
            productCode: itemData.productCode,
            productName: itemData.productName,
            manufacturer: itemData.manufacturer,
            model: itemData.model,
            partNumber: itemData.partNumber,
            specifications: itemData.specifications,
            category: itemData.category,
            targetPrice: itemData.targetPrice,
            currency: itemData.currency || "USD",
            notes: itemData.notes,
            revision: 1,
            createdBy: session.user.id,
            updatedBy: session.user.id,
          })
          .returning();

        // Log the activity
        await tx.insert(talepActivity).values({
          id: uuidv4(),
          requestId: requestId,
          activityType: "item_added",
          description: `New item added: ${itemData.productName || itemData.specification}`,
          performedBy: session.user.id,
        });

        // Update request modification time
        await tx
          .update(talep)
          .set({
            updatedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(talep.id, requestId));

        return newItem;
      });

      revalidatePath("/[workspaceSlug]/[companySlug]/talep/[talepId]", "page");
      return result;
    } catch (error) {
      console.error("Error adding request item:", error);
      throw error;
    }
  }

  /**
   * Updates the details of a RequestItem and increments its revision number
   */
  static async reviseRequestItem(input: ReviseRequestItemInput) {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const result = await db.transaction(async (tx) => {
        // Get current item data
        const [currentItem] = await tx
          .select()
          .from(requestItem)
          .where(eq(requestItem.id, input.itemId))
          .limit(1);

        if (!currentItem) {
          throw new Error("Request item not found");
        }

        // Prepare update data
        const updateData: any = {
          revision: currentItem.revision + 1,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        };

        // Only update provided fields
        if (input.specification !== undefined) updateData.specification = input.specification;
        if (input.quantity !== undefined) updateData.quantity = input.quantity;
        if (input.productCode !== undefined) updateData.productCode = input.productCode;
        if (input.productName !== undefined) updateData.productName = input.productName;
        if (input.manufacturer !== undefined) updateData.manufacturer = input.manufacturer;
        if (input.model !== undefined) updateData.model = input.model;
        if (input.specifications !== undefined) updateData.specifications = input.specifications;
        if (input.targetPrice !== undefined) updateData.targetPrice = input.targetPrice;
        if (input.notes !== undefined) updateData.notes = input.notes;

        // Update the item
        const [updatedItem] = await tx
          .update(requestItem)
          .set(updateData)
          .where(eq(requestItem.id, input.itemId))
          .returning();

        // Log the revision
        await tx.insert(talepActivity).values({
          id: uuidv4(),
          requestId: currentItem.requestId,
          activityType: "item_revised",
          description: `Item revised: ${updatedItem.productName || updatedItem.specification} (Revision ${updatedItem.revision})`,
          oldValue: `Revision ${currentItem.revision}`,
          newValue: `Revision ${updatedItem.revision}`,
          performedBy: session.user.id,
        });

        // Update request modification time
        await tx
          .update(talep)
          .set({
            updatedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(talep.id, currentItem.requestId));

        return updatedItem;
      });

      revalidatePath("/[workspaceSlug]/[companySlug]/talep/[talepId]", "page");
      return result;
    } catch (error) {
      console.error("Error revising request item:", error);
      throw error;
    }
  }

  /**
   * Links an uploaded file to a specific request
   */
  static async attachFileToRequest(requestId: string, fileData: {
    name: string;
    blobUrl: string;
    blobPath?: string;
    contentType?: string;
    size?: number;
    category?: string;
    description?: string;
    isVisibleToEntity?: boolean;
  }) {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const result = await db.transaction(async (tx) => {
        const fileId = uuidv4();
        
        const [newFile] = await tx
          .insert(talepFile)
          .values({
            id: fileId,
            requestId: requestId,
            name: fileData.name,
            blobUrl: fileData.blobUrl,
            blobPath: fileData.blobPath,
            contentType: fileData.contentType,
            size: fileData.size || 0,
            category: fileData.category,
            description: fileData.description,
            isVisibleToEntity: fileData.isVisibleToEntity || false,
            uploadedBy: session.user.id,
          })
          .returning();

        // Log the activity
        await tx.insert(talepActivity).values({
          id: uuidv4(),
          requestId: requestId,
          activityType: "file_uploaded",
          description: `File uploaded: ${fileData.name}`,
          performedBy: session.user.id,
        });

        // Update request modification time
        await tx
          .update(talep)
          .set({
            updatedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(talep.id, requestId));

        return newFile;
      });

      revalidatePath("/[workspaceSlug]/[companySlug]/talep/[talepId]", "page");
      return result;
    } catch (error) {
      console.error("Error attaching file to request:", error);
      throw error;
    }
  }

  /**
   * Adds a textual note or comment to a request
   */
  static async addNoteToRequest(requestId: string, noteContent: {
    title?: string;
    content: string;
    noteType?: string;
    isInternal?: boolean;
    isVisibleToEntity?: boolean;
    priority?: "low" | "medium" | "high" | "urgent";
  }) {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const result = await db.transaction(async (tx) => {
        const noteId = uuidv4();
        
        const [newNote] = await tx
          .insert(talepNote)
          .values({
            id: noteId,
            requestId: requestId,
            title: noteContent.title,
            content: noteContent.content,
            noteType: noteContent.noteType || "internal",
            isInternal: noteContent.isInternal !== false,
            isVisibleToEntity: noteContent.isVisibleToEntity || false,
            priority: noteContent.priority || "medium",
            createdBy: session.user.id,
          })
          .returning();

        // Log the activity
        await tx.insert(talepActivity).values({
          id: uuidv4(),
          requestId: requestId,
          activityType: "note_added",
          description: `Note added: ${noteContent.title || "Untitled note"}`,
          performedBy: session.user.id,
        });

        // Update request modification time
        await tx
          .update(talep)
          .set({
            updatedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(talep.id, requestId));

        return newNote;
      });

      revalidatePath("/[workspaceSlug]/[companySlug]/talep/[talepId]", "page");
      return result;
    } catch (error) {
      console.error("Error adding note to request:", error);
      throw error;
    }
  }

  /**
   * Gets all requests for a workspace/company with filtering and sorting
   */
  static async getRequests(params: {
    workspaceId: string;
    companyId: string;
    status?: string;
    customerId?: string;
    searchTerm?: string;
    sortBy?: "createdAt" | "updatedAt" | "title" | "status";
    sortOrder?: "asc" | "desc";
    limit?: number;
    offset?: number;
  }) {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      let query = db
        .select({
          request: talep,
          customer: businessEntity,
        })
        .from(talep)
        .leftJoin(businessEntity, eq(talep.customerId, businessEntity.id))
        .where(
          and(
            eq(talep.workspaceId, params.workspaceId),
            eq(talep.companyId, params.companyId),
            params.status ? eq(talep.status, params.status as any) : undefined,
            params.customerId ? eq(talep.customerId, params.customerId) : undefined,
            params.searchTerm
              ? or(
                  ilike(talep.title, `%${params.searchTerm}%`),
                  ilike(talep.description, `%${params.searchTerm}%`)
                )
              : undefined
          )
        );

      // Apply sorting
      const sortColumn = params.sortBy || "createdAt";
      const sortDirection = params.sortOrder === "asc" ? asc : desc;
      
      switch (sortColumn) {
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
      if (params.limit) {
        query = query.limit(params.limit);
      }
      if (params.offset) {
        query = query.offset(params.offset);
      }

      const results = await query;

      // Get item counts for each request
      const requestIds = results.map(r => r.request.id);
      const itemCounts = await db
        .select({
          requestId: requestItem.requestId,
          count: requestItem.id,
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

      return requestsWithCounts;
    } catch (error) {
      console.error("Error fetching requests:", error);
      throw error;
    }
  }

  /**
   * Deletes a request item
   */
  static async deleteRequestItem(itemId: string) {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const result = await db.transaction(async (tx) => {
        // Get item details before deletion
        const [item] = await tx
          .select()
          .from(requestItem)
          .where(eq(requestItem.id, itemId))
          .limit(1);

        if (!item) {
          throw new Error("Request item not found");
        }

        // Delete the item
        await tx.delete(requestItem).where(eq(requestItem.id, itemId));

        // Log the activity
        await tx.insert(talepActivity).values({
          id: uuidv4(),
          requestId: item.requestId,
          activityType: "item_deleted",
          description: `Item deleted: ${item.productName || item.specification}`,
          performedBy: session.user.id,
        });

        // Update request modification time
        await tx
          .update(talep)
          .set({
            updatedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(talep.id, item.requestId));

        return { success: true };
      });

      revalidatePath("/[workspaceSlug]/[companySlug]/talep/[talepId]", "page");
      return result;
    } catch (error) {
      console.error("Error deleting request item:", error);
      throw error;
    }
  }
}