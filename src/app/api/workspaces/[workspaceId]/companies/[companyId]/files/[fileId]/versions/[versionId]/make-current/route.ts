import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, companyFileTemplate, companyFileVersion, workspaceCompany } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; fileId: string; versionId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, fileId, versionId } = await params;

    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // Resolve template by fileId (could be template id or a version id)
    let templateIdToUse = fileId;
    const [tplDirect] = await db
      .select()
      .from(companyFileTemplate)
      .where(and(eq(companyFileTemplate.id, templateIdToUse), eq(companyFileTemplate.companyId, companyId), sql`${companyFileTemplate.deletedAt} IS NULL`))
      .limit(1);

    let tpl = tplDirect ?? null;
    if (!tpl) {
      const [verById] = await db
        .select()
        .from(companyFileVersion)
        .where(eq(companyFileVersion.id, fileId))
        .limit(1);
      if (verById) {
        templateIdToUse = verById.templateId;
        const [tplFromVersion] = await db
          .select()
          .from(companyFileTemplate)
          .where(and(eq(companyFileTemplate.id, templateIdToUse), eq(companyFileTemplate.companyId, companyId), sql`${companyFileTemplate.deletedAt} IS NULL`))
          .limit(1);
        tpl = tplFromVersion ?? null;
      }
    }

    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    // Ensure target version belongs to template
    const [targetVersion] = await db
      .select({ id: companyFileVersion.id, templateId: companyFileVersion.templateId })
      .from(companyFileVersion)
      .where(and(eq(companyFileVersion.id, versionId), eq(companyFileVersion.templateId, tpl.id)))
      .limit(1);
    if (!targetVersion) return NextResponse.json({ error: "Version not found" }, { status: 404 });

    // Set target current, others not current
    await db
      .update(companyFileVersion)
      .set({ isCurrent: false })
      .where(eq(companyFileVersion.templateId, tpl.id));

    const [updated] = await db
      .update(companyFileVersion)
      .set({ isCurrent: true })
      .where(and(eq(companyFileVersion.id, versionId), eq(companyFileVersion.templateId, tpl.id)))
      .returning();

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error setting current version:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


