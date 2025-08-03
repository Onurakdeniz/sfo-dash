import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, domain, industry, size } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const { workspaceId } = await params;

    // For now, return a mock company
    // This can be enhanced later with actual database integration
    const company = {
      id: `company_${Date.now()}`,
      workspaceId,
      name: name.trim(),
      domain: domain?.trim() || null,
      industry: industry || null,
      size: size || null,
      slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}