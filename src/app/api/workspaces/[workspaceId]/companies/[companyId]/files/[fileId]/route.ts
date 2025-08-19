import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, companyFileTemplate, companyFileVersion, companyFileAttachment, workspaceCompany, user } from "@/db/schema";
import { and, desc, eq, sql, inArray } from "drizzle-orm";
import { del } from "@vercel/blob";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; fileId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, fileId } = await params;
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    // Support both templateId (preferred) and versionId (legacy deep link)
    let tpl: any = null;
    let templateIdToUse = fileId;

    // Try as template id first
    const [tplDirect] = await db
      .select()
      .from(companyFileTemplate)
      .where(and(eq(companyFileTemplate.id, templateIdToUse), eq(companyFileTemplate.companyId, companyId), sql`${companyFileTemplate.deletedAt} IS NULL`))
      .limit(1);

    if (tplDirect) {
      tpl = tplDirect;
    } else {
      // Try as version id and resolve to its template
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
        if (tplFromVersion) {
          tpl = tplFromVersion;
        }
      }
    }

    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    let uploadedByName: string | null = null;
    let updatedByName: string | null = null;
    if (tpl.createdBy) {
      const [u] = await db.select({ name: user.name }).from(user).where(eq(user.id, tpl.createdBy)).limit(1);
      uploadedByName = u?.name ?? null;
    }
    if (tpl.updatedBy) {
      const [u2] = await db.select({ name: user.name }).from(user).where(eq(user.id, tpl.updatedBy)).limit(1);
      updatedByName = u2?.name ?? null;
    }

    // get versions and attachments
    const versions = await db
      .select()
      .from(companyFileVersion)
      .where(eq(companyFileVersion.templateId, tpl.id))
      .orderBy(desc(companyFileVersion.createdAt));

    const versionIds = versions.map(v => v.id);
    let attachmentsByVersion: Record<string, any[]> = {};
    if (versionIds.length) {
      const atts = await db
        .select()
        .from(companyFileAttachment)
        .where(inArray(companyFileAttachment.versionId, versionIds));
      for (const a of atts) {
        if (!attachmentsByVersion[a.versionId]) attachmentsByVersion[a.versionId] = [];
        attachmentsByVersion[a.versionId].push(a);
      }
    }

    // resolve creator names for versions
    const creatorIds = Array.from(new Set(versions.map(v => v.createdBy).filter(Boolean) as string[]));
    const createdByNameMap: Record<string, string | null> = {};
    if (creatorIds.length) {
      const creators = await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, creatorIds));
      for (const c of creators) {
        createdByNameMap[c.id] = c.name ?? null;
      }
    }

    return NextResponse.json({
      template: tpl,
      versions: versions.map(v => ({ ...v, attachments: attachmentsByVersion[v.id] || [], createdByName: v.createdBy ? createdByNameMap[v.createdBy] ?? null : null })),
      uploadedByName,
      updatedByName,
    });
  } catch (error) {
    console.error("Error fetching company file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update template metadata (name, code, category, description)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; fileId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, fileId } = await params;
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { name, code, category, description } = body as Partial<{
      name: string;
      code: string | null;
      category: string | null;
      description: string | null;
    }>;

    // Resolve template by id or by version id
    let templateIdToUse = fileId;
    const [tplDirect] = await db
      .select()
      .from(companyFileTemplate)
      .where(and(eq(companyFileTemplate.id, templateIdToUse), eq(companyFileTemplate.companyId, companyId), sql`${companyFileTemplate.deletedAt} IS NULL`))
      .limit(1);

    let tpl = tplDirect ?? null as any;
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

    // Validate unique code if changing
    if (typeof code !== 'undefined' && code !== tpl.code && code !== null) {
      const [existing] = await db
        .select({ id: companyFileTemplate.id })
        .from(companyFileTemplate)
        .where(and(eq(companyFileTemplate.companyId, companyId), eq(companyFileTemplate.code, String(code))))
        .limit(1);
      if (existing) return NextResponse.json({ error: "Code already in use" }, { status: 409 });
    }

    const [updated] = await db
      .update(companyFileTemplate)
      .set({
        name: typeof name !== 'undefined' ? String(name) : tpl.name,
        code: typeof code !== 'undefined' ? (code === null ? null : String(code)) : tpl.code,
        category: typeof category !== 'undefined' ? (category === null ? null : String(category)) : tpl.category,
        description: typeof description !== 'undefined' ? (description === null ? null : String(description)) : tpl.description,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(companyFileTemplate.id, tpl.id))
      .returning();

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating company file template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create a new version for a template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; fileId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, fileId } = await params;
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const body = await request.json();
    const { blobUrl, blobPath, size, contentType, version, metadata, name } = body ?? {};
    if (!blobUrl) return NextResponse.json({ error: "blobUrl required" }, { status: 400 });

    const [tpl] = await db
      .select()
      .from(companyFileTemplate)
      .where(and(eq(companyFileTemplate.id, fileId), eq(companyFileTemplate.companyId, companyId), sql`${companyFileTemplate.deletedAt} IS NULL`))
      .limit(1);
    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const nextVersion = version ?? metadata?.version ?? null;

    const versionId = `cver_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const [ver] = await db
      .insert(companyFileVersion)
      .values({
        id: versionId,
        templateId: tpl.id,
        version: nextVersion ? String(nextVersion) : null,
        name: name ? String(name) : tpl.name,
        blobUrl: String(blobUrl),
        blobPath: blobPath ? String(blobPath) : null,
        contentType: contentType || null,
        size: Number(size ?? 0),
        metadata: metadata ?? null,
        isCurrent: true,
        createdBy: session.user.id,
      })
      .returning();

    if (nextVersion) {
      await db
        .update(companyFileVersion)
        .set({ isCurrent: false })
        .where(and(eq(companyFileVersion.templateId, tpl.id), sql`${companyFileVersion.id} <> ${ver.id}`));
    }

    return NextResponse.json(ver, { status: 201 });
  } catch (error) {
    console.error("Error creating new version:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; fileId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, fileId } = await params;
    const access = await db
      .select()
      .from(workspaceCompany)
      .innerJoin(company, eq(workspaceCompany.companyId, company.id))
      .where(and(eq(workspaceCompany.workspaceId, workspaceId), eq(company.id, companyId)))
      .limit(1);
    if (access.length === 0) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    const [tpl] = await db
      .select()
      .from(companyFileTemplate)
      .where(and(eq(companyFileTemplate.id, fileId), eq(companyFileTemplate.companyId, companyId), sql`${companyFileTemplate.deletedAt} IS NULL`))
      .limit(1);
    if (!tpl) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    await db
      .update(companyFileTemplate)
      .set({ deletedAt: new Date() })
      .where(eq(companyFileTemplate.id, tpl.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

