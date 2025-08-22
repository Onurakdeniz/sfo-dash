export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { verification } from "@/db/schema/tables";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import twilio from "twilio";
import { randomUUID } from "crypto";

const generate4DigitCode = () => Math.floor(1000 + Math.random() * 9000).toString();

const isValidE164 = (phone: string) => /^\+[1-9]\d{1,14}$/.test(phone);

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ message: "Phone is required" }, { status: 400 });
    }

    if (!isValidE164(phone)) {
      return NextResponse.json({ message: "Phone must be in E.164 format (e.g. +905555555555)" }, { status: 400 });
    }

    // Preferred: Twilio Verify (no need to manage tokens locally)
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_VERIFY_SERVICE_SID) {
      const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      await client.verify.v2
        .services(env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: phone, channel: "sms" });
      return NextResponse.json({ message: "Verification started via Twilio Verify" }, { status: 200 });
    }

    // Fallback: custom token with Twilio Messaging API
    {
      // Check existing record
      const existing = await db
        .select()
        .from(verification)
        .where(eq(verification.identifier, phone))
        .limit(1);

      let token: string;
      let expiresAt: Date;

      if (existing.length > 0 && new Date() < new Date(existing[0].expiresAt)) {
        token = existing[0].value;
        expiresAt = existing[0].expiresAt as unknown as Date;
      } else {
        // Remove stale
        if (existing.length > 0) {
          await db.delete(verification).where(eq(verification.id, existing[0].id));
        }
        token = generate4DigitCode();
        expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db.insert(verification).values({
          id: randomUUID(),
          identifier: phone,
          value: token,
          expiresAt,
        });
      }

      // If Twilio Messaging configured, send SMS
      if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && (env.TWILIO_FROM_NUMBER || env.TWILIO_MESSAGING_SERVICE_SID)) {
        const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
        const payload: any = {
          to: phone,
          body: `Yönetim Sistemi doğrulama kodunuz: ${token}`,
        };
        if (env.TWILIO_MESSAGING_SERVICE_SID) {
          payload.messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID;
        } else {
          payload.from = env.TWILIO_FROM_NUMBER;
        }
        await client.messages.create(payload);
        return NextResponse.json({ message: "Verification code sent" }, { status: 200 });
      }

      // Development fallback only (avoid leaking codes in production)
      if (env.VERCEL_ENV !== 'production') {
        return NextResponse.json(
          { message: "Twilio not configured; using development fallback", debugToken: token },
          { status: 200 }
        );
      }

      return NextResponse.json({ message: "Twilio sender not configured" }, { status: 500 });
    }
  } catch (error) {
    console.error("Phone verification send error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


