export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { verification } from "@/db/schema/tables";
import { and, eq } from "drizzle-orm";
import twilio from "twilio";
import { env } from "@/env";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { phone, token } = await request.json();

    if (!phone || !token) {
      return NextResponse.json({ message: "Phone and code are required" }, { status: 400 });
    }

    // Preferred: Twilio Verify check
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID) {
      const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      const result = await client.verify.v2
        .services(env.TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: phone, code: token });
      if (result.status === 'approved') {
        // Mark as verified in DB for server-side enforcement in acceptance flow
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const existing = await db
          .select()
          .from(verification)
          .where(eq(verification.identifier, phone))
          .limit(1);
        if (existing.length > 0) {
          await db
            .update(verification)
            .set({ value: "verified", expiresAt })
            .where(eq(verification.id, existing[0].id));
        } else {
          await db.insert(verification).values({
            id: randomUUID(),
            identifier: phone,
            value: "verified",
            expiresAt,
          });
        }
        return NextResponse.json({ message: "Phone verified" }, { status: 200 });
      }
      return NextResponse.json({ message: "Invalid or expired code" }, { status: 400 });
    }

    const records = await db
      .select()
      .from(verification)
      .where(and(eq(verification.identifier, phone), eq(verification.value, token)))
      .limit(1);

    if (records.length === 0) {
      return NextResponse.json({ message: "Invalid code" }, { status: 400 });
    }

    const record = records[0];
    if (new Date() > new Date(record.expiresAt)) {
      await db.delete(verification).where(eq(verification.id, record.id));
      return NextResponse.json({ message: "Code expired" }, { status: 400 });
    }

    // Mark as verified for a short window so server can enforce during accept
    const verifiedExpires = new Date(Date.now() + 10 * 60 * 1000);
    await db
      .update(verification)
      .set({ value: "verified", expiresAt: verifiedExpires })
      .where(eq(verification.id, record.id));

    return NextResponse.json({ message: "Phone verified" }, { status: 200 });
  } catch (error) {
    console.error("Phone verification verify error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


