import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, workspaceCompany } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { put } from "@vercel/blob";

// This route generates a direct client upload URL via @vercel/blob SDK
// Client will POST the file directly to Blob using this URL
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

    const form = await request.formData();
    const file = form.get("file") as File | null;
    const filename = (form.get("filename") as string | null) ?? file?.name ?? null;
    // Vercel Blob SDK currently expects access: "public" in this project
    const accessType = "public" as const;

    if (!file || !filename) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const key = `companies/${companyId}/${Date.now()}_${filename}`;
    const blob = await put(key, file, { access: accessType, addRandomSuffix: false });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname, key });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

