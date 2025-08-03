import React from "react";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  customContainer?: boolean;
}

/**
 * Optional PageLayout component for pages that need custom spacing or container behavior.
 * By default, all pages get automatic container and spacing from layout.tsx.
 * Use this only if you need to override the default behavior.
 */
export function PageLayout({ 
  children, 
  className = "", 
  containerClassName = "",
  customContainer = false
}: PageLayoutProps) {
  if (customContainer) {
    // Custom container - overrides the default layout container
    return (
      <div className={`${containerClassName}`}>
        <div className={`${className}`}>
          {children}
        </div>
      </div>
    );
  }
  
  // Just custom spacing - uses default container from layout.tsx
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
} 