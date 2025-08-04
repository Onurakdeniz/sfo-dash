import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";
import { db } from "@/db";
import { workspace, workspaceCompany, company } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get raw workspace data
    const userWorkspaces = await db.select()
      .from(workspace)
      .where(eq(workspace.ownerId, session.user.id));

    // Get all workspace-company relationships
    const allWorkspaceCompanies = await db.select({
      workspaceId: workspaceCompany.workspaceId,
      companyId: workspaceCompany.companyId,
      company: company,
    })
    .from(workspaceCompany)
    .leftJoin(company, eq(workspaceCompany.companyId, company.id));

    return NextResponse.json({
      user: session.user,
      userWorkspaces,
      allWorkspaceCompanies,
      debug: {
        totalWorkspaces: userWorkspaces.length,
        totalWorkspaceCompanies: allWorkspaceCompanies.length,
      }
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}