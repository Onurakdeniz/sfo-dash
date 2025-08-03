import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    // For now, return a mock workspace
    // This can be enhanced later with actual database integration
    const workspace = {
      id: `workspace_${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || null,
      slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}