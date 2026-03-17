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

export function PageWrapper({
  children,
  className,
  contained = true,
  padded = true,
}: PageWrapperProps) {
  return (
    <main
      className={cn(
        "min-h-[calc(100vh-4rem)]",
        padded && "py-8 md:py-12",
        contained && "max-w-5xl mx-auto px-4 md:px-5",
        className
      )}
    >
      {children}
    </main>
  );
}

export default PageWrapper;
