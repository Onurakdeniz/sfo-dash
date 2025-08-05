import { db } from "@/db";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { env } from "@/env";

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  plugins: [username()],
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: ["http://localhost:3000", "http://localhost:3001", "https://luna-sys.vercel.app"],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPasswordEmail: async ({ user, url, token }: { user: any; url: string; token: string }) => {
      try {
        await resend.emails.send({
          from: "onboarding@resend.dev", // You should replace this with your verified domain
          to: user.email,
          subject: "Reset your password",
          html: `<p>Click <a href="${url}">here</a> to reset your password</p>`,
        });
        console.log(`Reset password email sent to ${user.email}`);
      } catch (error) {
        console.error('Failed to send reset password email:', error);
        throw error;
      }
    },
  },
  emailVerification: {
    enabled: true,
    expiresIn: 600, // 10 minutes
    generateVerificationToken: async () => {
      // Generate a 4-digit code
      return Math.floor(1000 + Math.random() * 9000).toString();
    },
    sendVerificationEmail: async ({ user, url, token }: { user: any; url: string; token: string }) => {
      try {
        await resend.emails.send({
          from: "onboarding@resend.dev", // You should replace this with your verified domain
          to: user.email,
          subject: "Verify your email address",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome! Please verify your email address</h2>
              <p>Hi there!</p>
              <p>Thanks for signing up! To complete your registration, please enter this verification code on our website:</p>
              <div style="text-align: center; margin: 30px 0;">
                <div style="background-color: #f8f9fa; border: 2px dashed #007cba; padding: 20px; border-radius: 10px; display: inline-block;">
                  <span style="font-size: 32px; font-weight: bold; color: #007cba; letter-spacing: 8px;">${token}</span>
                </div>
              </div>
              <p style="text-align: center; color: #666; margin: 20px 0;">
                <strong>Verification Code: ${token}</strong>
              </p>
              <p>This code will expire in 10 minutes for security reasons.</p>
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
          `,
        });
        console.log(`Verification email sent to ${user.email} with token: ${token}`);
      } catch (error) {
        console.error('Failed to send verification email:', error);
        throw error;
      }
    },
  },

});
