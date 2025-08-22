import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/server";
import { db } from "@/db";
import { company, workspaceCompany } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { put } from "@vercel/blob";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; companyId: string; customerId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId, companyId, customerId } = await params;

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
    const accessType = "public" as const;
    if (!file || !filename) return NextResponse.json({ error: "file is required" }, { status: 400 });

    const key = `customers/${customerId}/${Date.now()}_${filename}`;
    const blob = await put(key, file, { access: accessType, addRandomSuffix: false });
    return NextResponse.json({ url: blob.url, pathname: blob.pathname, key });
  } catch (error) {
    console.error("Error generating customer upload URL:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


