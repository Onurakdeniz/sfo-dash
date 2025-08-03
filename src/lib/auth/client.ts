import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

// Dynamically detect the base URL based on the current environment
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Browser: use current origin
    return window.location.origin;
  }
  // Server: use environment variable or default
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  plugins: [usernameClient()],
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession, getSession, verifyEmail } = authClient;
