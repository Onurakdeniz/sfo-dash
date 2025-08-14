import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, workspaceCompany } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { generateUploadUrl } from "@vercel/blob";

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

    const body = await request.json().catch(() => ({}));
    const filename: string | undefined = body.filename || undefined;
    const contentType: string | undefined = body.contentType || undefined;
    const accessType: "public" | "private" = body.access === "public" ? "public" : "public";

    if (!filename) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }

    const key = `companies/${companyId}/${Date.now()}_${filename}`;
    const { url, pathname } = await generateUploadUrl({
      access: accessType,
      pathname: key,
      contentType,
      tokenPayload: { companyId },
    } as any);

    return NextResponse.json({ uploadUrl: url, pathname, key });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

