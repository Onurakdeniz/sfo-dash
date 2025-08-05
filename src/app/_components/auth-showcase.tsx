"use client";

import dynamic from "next/dynamic";

// Dynamic import with SSR disabled - this is better than forcing entire page to be dynamic
const AuthShowcaseClient = dynamic(
  () => import("./auth-showcase-client").then((mod) => ({ default: mod.AuthShowcaseClient })),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-gray-200 rounded-lg p-6 w-full">
        <div className="space-y-4">
          <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
          <div className="h-10 bg-gray-300 rounded w-full"></div>
          <div className="h-10 bg-gray-300 rounded w-full"></div>
        </div>
      </div>
    )
  }
);

export function AuthShowcase() {
  return <AuthShowcaseClient />;
}
