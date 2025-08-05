import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db";
import { user, verification } from "@/db/schema/tables";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";
import { env } from "@/env";
import { randomUUID } from "crypto";

// Helper to generate a 4-digit code
const generate4DigitCode = () => Math.floor(1000 + Math.random() * 9000).toString();

const resend = new Resend(env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUsers = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const existingUser = existingUsers[0];

    // If already verified, no need to resend
    if (existingUser.emailVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 400 }
      );
    }

    // Check if a valid verification record exists
    const records = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, email))
      .limit(1);

    let token: string;
    let expiresAt: Date;

    if (
      records.length > 0 &&
      new Date() < new Date(records[0].expiresAt)
    ) {
      // Re-use existing token if not expired
      token = records[0].value;
      expiresAt = records[0].expiresAt as unknown as Date;
    } else {
      // Delete any stale records
      if (records.length > 0) {
        await db.delete(verification).where(eq(verification.id, records[0].id));
      }
      // Generate new token
      token = generate4DigitCode();
      expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Insert new verification record
      await db.insert(verification).values({
        id: randomUUID(),
        identifier: email,
        value: token,
        expiresAt,
      });
    }

    // Send verification email
    await resend.emails.send({
      from: "noreply@transactions.weddingneonsign.com", // Use verified domain
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verification Code</h2>
          <p>Hi!</p>
          <p>Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${token}</div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Verification code sent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}