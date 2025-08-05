import { db } from "@/db";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { env } from "@/env";
import { user } from "@/db/schema/tables";
import { eq } from "drizzle-orm";

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
    sendResetPassword: async ({ user, url, token }: { user: any; url: string; token: string }) => {
      try {
        await resend.emails.send({
          from: "noreply@transactions.weddingneonsign.com", // Use verified domain
          to: user.email,
          subject: "Şifrenizi Sıfırlayın - LunaManager",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0;">Luna<span style="color: #1e40af;">Manager</span></h1>
              </div>
              
              <h2 style="color: #1f2937; margin-bottom: 20px;">Şifre Sıfırlama İsteği</h2>
              
              <p style="color: #4b5563; line-height: 1.6;">Merhaba,</p>
              
              <p style="color: #4b5563; line-height: 1.6;">
                LunaManager hesabınız için şifre sıfırlama isteği aldık. 
                Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" 
                   style="background-color: #2563eb; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 6px; font-weight: bold; 
                          display: inline-block;">
                  Şifremi Sıfırla
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Eğer yukarıdaki buton çalışmıyorsa, aşağıdaki bağlantıyı kopyalayıp 
                tarayıcınıza yapıştırabilirsiniz:
              </p>
              
              <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; 
                        word-break: break-all; font-size: 12px; color: #4b5563;">
                ${url}
              </p>
              
              <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
                <p style="color: #6b7280; font-size: 12px; line-height: 1.6;">
                  Bu bağlantı güvenlik nedeniyle 15 dakika içinde geçerliliğini yitirecektir.
                </p>
                <p style="color: #6b7280; font-size: 12px; line-height: 1.6;">
                  Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <p style="color: #9ca3af; font-size: 11px;">
                  © 2025 LunaManager - Tüm hakları saklıdır
                </p>
              </div>
            </div>
          `,
        });
        console.log(`Reset password email sent to ${user.email}`);
      } catch (error) {
        console.error('Failed to send reset password email:', error);
        throw error;
      }
    },
    async onPasswordReset({ user: resetUser }) {
      try {
        // Ensure user email remains verified after password reset
        await db.update(user)
          .set({ emailVerified: true })
          .where(eq(user.id, resetUser.id));
        
        console.log(`Email verification status maintained for user: ${resetUser.email}`);
      } catch (error) {
        console.error('Failed to maintain email verification status:', error);
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
          from: "noreply@transactions.weddingneonsign.com", // Use verified domain
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
