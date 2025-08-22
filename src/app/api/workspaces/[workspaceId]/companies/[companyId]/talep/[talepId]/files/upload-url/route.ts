import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, talep as talepTable, workspace, workspaceCompany } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";
import { slugifyCompanyFirstWord } from "@/lib/slug";
import { put } from "@vercel/blob";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; talepId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId: workspaceIdOrSlug, companyId: companyIdOrSlug, talepId } = await params;

    // Resolve workspace by id or slug
    const foundWorkspace = await db
      .select()
      .from(workspace)
      .where(or(eq(workspace.id, workspaceIdOrSlug), eq(workspace.slug, workspaceIdOrSlug)))
      .limit(1);
    if (foundWorkspace.length === 0) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    const resolvedWorkspace = foundWorkspace[0];

    // Resolve company (by id or slug within the workspace)
    let resolvedCompanyId: string | null = null;
    const companyById = await db
      .select({ cmp: company })
      .from(company)
      .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
      .where(and(eq(workspaceCompany.workspaceId, resolvedWorkspace.id), eq(company.id, companyIdOrSlug)))
      .limit(1);
    if (companyById.length > 0 && companyById[0].cmp) {
      resolvedCompanyId = companyById[0].cmp.id;
    } else {
      const companiesInWorkspace = await db
        .select({ cmp: company })
        .from(company)
        .innerJoin(workspaceCompany, eq(company.id, workspaceCompany.companyId))
        .where(eq(workspaceCompany.workspaceId, resolvedWorkspace.id));
      const matched = companiesInWorkspace.find(({ cmp }) => slugifyCompanyFirstWord(cmp.name || '').toLowerCase() === (companyIdOrSlug || '').toLowerCase());
      if (matched) resolvedCompanyId = matched.cmp.id;
    }
    if (!resolvedCompanyId) return NextResponse.json({ error: "Company not found in this workspace" }, { status: 404 });

    // Ensure talep belongs to workspace/company
    const [tRow] = await db
      .select({ id: talepTable.id })
      .from(talepTable)
      .where(and(eq(talepTable.id, talepId), eq(talepTable.companyId, resolvedCompanyId), eq(talepTable.workspaceId, resolvedWorkspace.id)))
      .limit(1);
    if (!tRow) return NextResponse.json({ error: "Talep not found" }, { status: 404 });

    const form = await request.formData();
    const file = form.get("file") as File | null;
    const filename = (form.get("filename") as string | null) ?? file?.name ?? null;
    const accessType = "public" as const;
    if (!file || !filename) return NextResponse.json({ error: "file is required" }, { status: 400 });

    const key = `talepler/${talepId}/${Date.now()}_${filename}`;
    const blob = await put(key, file, { access: accessType, addRandomSuffix: false });
    return NextResponse.json({ url: blob.url, pathname: blob.pathname, key });
  } catch (error) {
    console.error("Error generating talep upload URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


