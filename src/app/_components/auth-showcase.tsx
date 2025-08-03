"use client";

import dynamic from "next/dynamic";

// Dynamic import with SSR disabled - this is better than forcing entire page to be dynamic
const AuthShowcaseClient = dynamic(
  () => import("./auth-showcase-client").then((mod) => ({ default: mod.AuthShowcaseClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-center text-xl">Loading...</p>
      </div>
    )
  }
);

export function AuthShowcase() {
  return <AuthShowcaseClient />;
}
