import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { env } from "@/env";

const resend = new Resend(env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("🔧 DEBUG: Testing email sending...");
    console.log("- RESEND_API_KEY exists:", !!env.RESEND_API_KEY);
    console.log("- RESEND_API_KEY length:", env.RESEND_API_KEY?.length || 0);
    console.log("- RESEND_API_KEY first 10 chars:", env.RESEND_API_KEY?.substring(0, 10) + "...");
    console.log("- To email:", email);
    console.log("- Base URL:", env.BETTER_AUTH_URL);

    // Test with different email addresses
    const testEmails = [
      // Try Resend's test email
      "delivered@resend.dev",
      // Try user's actual email
      email
    ];

    for (const testEmail of testEmails) {
      try {
        console.log(`\n📧 Testing email to: ${testEmail}`);
        
        const result = await resend.emails.send({
          from: "noreply@transactions.weddingneonsign.com", // Use verified domain
          to: testEmail,
          subject: "Test Invitation Email - Debug",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1>🧪 Test Email</h1>
              <p>This is a test email to debug the invitation system.</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p><strong>To:</strong> ${testEmail}</p>
              <p><strong>API Key:</strong> ${env.RESEND_API_KEY?.substring(0, 10)}...</p>
              <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p>If you receive this email, the Resend integration is working!</p>
              </div>
            </div>
          `,
        });

        console.log(`✅ Email sent successfully to ${testEmail}:`, result);
        
        return NextResponse.json({
          success: true,
          message: `Test email sent successfully to ${testEmail}`,
          result: result,
          debug: {
            hasApiKey: !!env.RESEND_API_KEY,
            apiKeyLength: env.RESEND_API_KEY?.length || 0,
            baseUrl: env.BETTER_AUTH_URL,
          }
        });

      } catch (emailError: any) {
        console.error(`❌ Failed to send to ${testEmail}:`, emailError);
        
        // Continue to next email if this one fails
        if (testEmail === testEmails[testEmails.length - 1]) {
          // If this is the last email and it failed, return error
          throw emailError;
        }
      }
    }

  } catch (error: any) {
    console.error("❌ Test email failed - FULL ERROR:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error status:", error.status);
    console.error("Error headers:", error.headers);
    console.error("Full error:", error);

    return NextResponse.json({
      success: false,
      error: error.message || "Failed to send test email",
      debug: {
        errorName: error.name,
        errorStatus: error.status,
        hasApiKey: !!env.RESEND_API_KEY,
        apiKeyLength: env.RESEND_API_KEY?.length || 0,
      }
    }, { status: 500 });
  }
}