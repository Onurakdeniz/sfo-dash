import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company, companyModules } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// GET /api/system/modules/assignments?workspaceId=...
// Returns mapping of moduleId -> list of companies (in workspace) where module is enabled
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // Validate workspace exists (basic check; membership checks can be added as needed)
    const ws = await db.select().from(workspace).where(eq(workspace.id, workspaceId)).limit(1);
    if (ws.length === 0) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Get companies in the workspace and their enabled modules
    const rows = await db
      .select({
        moduleId: companyModules.moduleId,
        companyId: company.id,
        companyName: company.name,
        companyFullName: company.fullName,
        companyLogoUrl: company.companyLogoUrl,
      })
      .from(workspaceCompany)
      .leftJoin(company, eq(workspaceCompany.companyId, company.id))
      .leftJoin(
        companyModules,
        and(eq(companyModules.companyId, workspaceCompany.companyId), eq(companyModules.isEnabled, true))
      )
      .where(eq(workspaceCompany.workspaceId, workspaceId));

    const assignments: Record<string, Array<{ id: string; name: string; slug: string; logoUrl: string | null }>> = {};

    for (const row of rows) {
      if (!row.moduleId || !row.companyId) continue;
      const name = (row.companyFullName ?? row.companyName) as string;
      const slug = name
        ?.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      const entry = { id: row.companyId, name, slug, logoUrl: row.companyLogoUrl ?? null };
      if (!assignments[row.moduleId]) assignments[row.moduleId] = [];
      assignments[row.moduleId].push(entry);
    }

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching module assignments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


