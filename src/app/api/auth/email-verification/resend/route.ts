import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db";
import { user, verification } from "@/db/schema/tables";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";
import { env } from "@/env";
import { randomUUID } from "crypto";

// Helper to generate a 4-digit code
const generate4DigitCode = () => Math.floor(1000 + Math.random() * 9000).toString();

// Helper to generate a secure token for email links
const generateSecureToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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

    // Basic rate limiting: Check for recent verification records (last 60 seconds)
    const recentRecords = await db
      .select()
      .from(verification)
      .where(eq(verification.identifier, email))
      .limit(5);

    const now = new Date();
    const recentResends = recentRecords.filter(record => {
      const recordAge = (now.getTime() - new Date(record.createdAt).getTime()) / 1000;
      return recordAge < 60; // Within last 60 seconds
    });

    if (recentResends.length >= 3) {
      return NextResponse.json(
        { message: "Too many resend requests. Please wait before trying again." },
        { status: 429 }
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
    let linkToken: string;
    let expiresAt: Date;

    if (
      records.length > 0 &&
      new Date() < new Date(records[0].expiresAt)
    ) {
      // Re-use existing tokens if not expired
      token = records[0].value;
      linkToken = records[0].value; // For now, use same token for both (backward compatibility)
      expiresAt = records[0].expiresAt as unknown as Date;
    } else {
      // Delete any stale records
      if (records.length > 0) {
        await db.delete(verification).where(eq(verification.id, records[0].id));
      }
      // Generate new tokens
      token = generate4DigitCode();
      linkToken = generateSecureToken();
      expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Insert new verification record for the 4-digit code
      await db.insert(verification).values({
        id: randomUUID(),
        identifier: email,
        value: token,
        expiresAt,
      });

      // Insert another record for the link token
      await db.insert(verification).values({
        id: randomUUID(),
        identifier: email,
        value: linkToken,
        expiresAt,
      });
    }

    // Generate verification URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationLink = `${baseUrl}/api/auth/email-verification/verify?email=${encodeURIComponent(email)}&token=${encodeURIComponent(linkToken)}`;

    // Send verification email
    await resend.emails.send({
      from: "noreply@transactions.weddingneonsign.com", // Use verified domain
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Welcome! Please verify your email address</h2>
          <p style="color: #666; font-size: 16px;">Hi there!</p>
          <p style="color: #666; font-size: 16px;">Thanks for signing up! To complete your registration, please verify your email address.</p>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 16px; margin-bottom: 10px;">Click the button below to verify your email:</p>
            <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email Address</a>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
            <p style="color: #666; font-size: 16px; margin-bottom: 10px;">Or enter this verification code manually:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff;">${token}</div>
          </div>

          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes for security reasons.</p>
          <p style="color: #666; font-size: 14px;">If you didn't create this account, you can safely ignore this email.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #007bff;">${verificationLink}</span>
          </p>
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