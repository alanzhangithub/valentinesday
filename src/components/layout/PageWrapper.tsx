"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  /** Whether to include max-width container */
  contained?: boolean;
  /** Whether to add vertical padding */
  padded?: boolean;
}

/**
 * Wraps page content with consistent padding and optional container.
 * Use this component to maintain consistent page layouts across the app.
 */
export function PageWrapper({
  children,
  className,
  contained = true,
  padded = true,
}: PageWrapperProps) {
  return (
    <main
      className={cn(
        "min-h-[calc(100vh-4rem)]", // Account for nav height
        padded && "py-8",
        contained && "container mx-auto px-4",
        className
      )}
    >
      {children}
    </main>
  );
}

export default PageWrapper;
