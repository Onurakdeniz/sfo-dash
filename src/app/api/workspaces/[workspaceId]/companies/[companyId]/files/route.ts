import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, companyFileTemplate, companyFileVersion, workspaceCompany } from "@/db/schema";
import { and, desc, eq, sql, inArray } from "drizzle-orm";

// List files and create file metadata records after successful Blob uploads
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId } = await params;

    // Access check: user must have workspace access to company's workspace
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q");

    const templates = await db
      .select()
      .from(companyFileTemplate)
      .where(
        and(
          eq(companyFileTemplate.companyId, companyId),
          sql`${companyFileTemplate.deletedAt} IS NULL`,
          q ? sql`(${companyFileTemplate.name} ILIKE ${"%" + q + "%"} OR ${companyFileTemplate.code} ILIKE ${"%" + q + "%"})` : sql`true`
        )
      )
      .orderBy(desc(companyFileTemplate.updatedAt));

    const templateIds = templates.map(t => t.id);
    const currentVersionsByTemplate: Record<string, any> = {};
    if (templateIds.length) {
      const currentVersions = await db
        .select()
        .from(companyFileVersion)
        .where(and(inArray(companyFileVersion.templateId, templateIds), eq(companyFileVersion.isCurrent, true)));
      for (const v of currentVersions) currentVersionsByTemplate[v.templateId] = v;
    }

    return NextResponse.json(templates.map(t => ({
      ...t,
      currentVersion: currentVersionsByTemplate[t.id] || null,
    })));
  } catch (error) {
    console.error("Error listing company files:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId } = await params;
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const body = await request.json();
    const { name, blobUrl, blobPath, contentType, size, metadata, code, category, description } = body ?? {};

    if (!name || !blobUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const codeVal = (code ?? metadata?.code) ? String(code ?? metadata?.code) : null;
    let tpl = null as any;
    if (codeVal) {
      const [existing] = await db
        .select()
        .from(companyFileTemplate)
        .where(and(eq(companyFileTemplate.companyId, companyId), eq(companyFileTemplate.code, codeVal)))
        .limit(1);
      if (existing) tpl = existing;
    }
    if (!tpl) {
      const templateId = `ctpl_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const [createdTpl] = await db
        .insert(companyFileTemplate)
        .values({
          id: templateId,
          companyId,
          code: codeVal,
          name: String(name),
          category: category ?? metadata?.category ?? null,
          description: description ?? metadata?.description ?? null,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        })
        .returning();
      tpl = createdTpl;
    }

    const versionId = `cver_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const versionVal = metadata?.version ? String(metadata.version) : null;
    const [ver] = await db
      .insert(companyFileVersion)
      .values({
        id: versionId,
        templateId: tpl.id,
        version: versionVal,
        name: String(name),
        blobUrl: String(blobUrl),
        blobPath: blobPath ? String(blobPath) : null,
        contentType: contentType ? String(contentType) : null,
        size: Number(size ?? 0),
        metadata: metadata ?? null,
        isCurrent: true,
        createdBy: session.user.id,
      })
      .returning();

    if (versionVal) {
      await db
        .update(companyFileVersion)
        .set({ isCurrent: false })
        .where(and(eq(companyFileVersion.templateId, tpl.id), sql`${companyFileVersion.id} <> ${ver.id}`));
    }

    return NextResponse.json({ template: tpl, version: ver }, { status: 201 });
  } catch (error) {
    console.error("Error creating company file record:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

