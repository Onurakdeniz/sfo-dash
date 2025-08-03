import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db";
import { verification, user } from "@/db/schema/tables";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json(
        { message: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Find the verification record
    const verificationRecord = await db
      .select()
      .from(verification)
      .where(
        and(
          eq(verification.identifier, email),
          eq(verification.value, token)
        )
      )
      .limit(1);

    if (verificationRecord.length === 0) {
      return NextResponse.json(
        { message: 'Invalid verification code' },
        { status: 400 }
      );
    }

    const record = verificationRecord[0];

    // Check if the verification code has expired
    if (new Date() > new Date(record.expiresAt)) {
      // Delete expired verification record
      await db
        .delete(verification)
        .where(eq(verification.id, record.id));

      return NextResponse.json(
        { message: 'Verification code has expired' },
        { status: 400 }
      );
    }

    // Update user as email verified
    await db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.email, email));

    // Delete the verification record as it's no longer needed
    await db
      .delete(verification)
      .where(eq(verification.id, record.id));

    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}