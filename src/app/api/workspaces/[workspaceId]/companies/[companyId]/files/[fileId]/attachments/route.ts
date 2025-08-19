import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, companyFileAttachment, companyFileTemplate, companyFileVersion, workspaceCompany } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; fileId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, fileId } = await params;

    // Access check
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    const { blobUrl, blobPath, size, contentType, name, versionId, version } = body ?? {};

    if (!blobUrl || !name) {
      return NextResponse.json({ error: "name and blobUrl are required" }, { status: 400 });
    }

    // Resolve template by fileId (supports template id or version id)
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

    // Determine target version
    let targetVersion: { id: string } | null = null;

    if (versionId) {
      const [ver] = await db
        .select({ id: companyFileVersion.id })
        .from(companyFileVersion)
        .where(and(eq(companyFileVersion.id, String(versionId)), eq(companyFileVersion.templateId, tpl.id)))
        .limit(1);
      if (ver) targetVersion = ver;
    } else if (version) {
      const [ver] = await db
        .select({ id: companyFileVersion.id })
        .from(companyFileVersion)
        .where(and(eq(companyFileVersion.templateId, tpl.id), eq(companyFileVersion.version, String(version))))
        .limit(1);
      if (ver) targetVersion = ver;
    }

    if (!targetVersion) {
      // Fallback to current or latest version
      const [currentOrLatest] = await db
        .select({ id: companyFileVersion.id })
        .from(companyFileVersion)
        .where(eq(companyFileVersion.templateId, tpl.id))
        .orderBy(desc(companyFileVersion.isCurrent), desc(companyFileVersion.createdAt))
        .limit(1);
      if (!currentOrLatest) {
        return NextResponse.json({ error: "No version found to attach to" }, { status: 400 });
      }
      targetVersion = currentOrLatest;
    }

    const attachmentId = `catt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const [created] = await db
      .insert(companyFileAttachment)
      .values({
        id: attachmentId,
        versionId: targetVersion.id,
        name: String(name),
        blobUrl: String(blobUrl),
        blobPath: blobPath ? String(blobPath) : null,
        contentType: contentType || null,
        size: Number(size ?? 0),
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating attachment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


