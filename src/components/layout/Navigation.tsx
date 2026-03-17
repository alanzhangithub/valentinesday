"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/photos", label: "Photos", emoji: "📸" },
  { href: "/sticker-board", label: "Stickers", emoji: "🎨" },
  { href: "/calendar", label: "Calendar", emoji: "📅" },
  { href: "/wishing-well", label: "Wishes", emoji: "✨" },
  { href: "/coupons", label: "Coupons", emoji: "🎟️" },
  { href: "/games", label: "Games", emoji: "🎮" },
  { href: "/shop", label: "Shop", emoji: "🛍️" },
  { href: "/food-picker", label: "Food", emoji: "🍕" },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-candy-sky/20">
        <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="font-heading text-xl font-semibold text-foreground tracking-tight">
              meedobeedo
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 py-2 text-[13px] font-semibold rounded-full transition-all duration-200 font-body",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05]"
                  )}
                >
                  <span className="mr-1">{item.emoji}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2.5 -mr-2 rounded-full hover:bg-foreground/[0.05] transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              width="18"
              height="14"
              viewBox="0 0 18 14"
              fill="none"
              className="text-foreground"
            >
              <motion.line
                x1="0" y1="1" x2="18" y2="1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                style={{ transformOrigin: "center" }}
              />
              <motion.line
                x1="0" y1="7" x2="18" y2="7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
              />
              <motion.line
                x1="0" y1="13" x2="18" y2="13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                style={{ transformOrigin: "center" }}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-b border-candy-sky/20 shadow-md"
          >
            <div className="max-w-5xl mx-auto px-5 py-3 space-y-0.5">
              {navItems.map((item, index) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold font-body transition-all duration-150",
                        isActive
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.05]"
                      )}
                    >
                      <span>{item.emoji}</span>
                      {item.label}
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navigation;
