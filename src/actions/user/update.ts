"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateUser(formData: FormData) {
  // Retrieve the currently authenticated user
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const updates: Record<string, unknown> = {};

  const name = formData.get("name") as string | null;
  const username = formData.get("username") as string | null;
  const displayUsername = formData.get("displayUsername") as string | null;
  const image = formData.get("image") as string | null;

  if (name) updates.name = name;
  if (username) updates.username = username;
  if (displayUsername) updates.displayUsername = displayUsername;
  if (image) updates.image = image;

  if (Object.keys(updates).length === 0) {
    // No changes submitted – nothing to update.
    return;
  }

  await db.update(user).set(updates).where(eq(user.id, session.user.id));

  // Revalidate the profile page so the new data is fetched immediately.
  revalidatePath("/profile");
}