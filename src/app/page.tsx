"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface Feature {
  name: string;
  href: string;
  emoji: string;
  bg: string;
  description: string;
}

const features: Feature[] = [
  { name: "Photos", href: "/photos", emoji: "📸", bg: "#FF6B8A", description: "our memories" },
  { name: "Calendar", href: "/calendar", emoji: "📅", bg: "#4FC3F7", description: "stamp the days" },
  { name: "Stickers", href: "/sticker-board", emoji: "🎨", bg: "#FFD93D", description: "decorate together" },
  { name: "Wishes", href: "/wishing-well", emoji: "✨", bg: "#B388FF", description: "wish upon mod" },
  { name: "Coupons", href: "/coupons", emoji: "🎟️", bg: "#FF8A65", description: "love coupons" },
  { name: "Games", href: "/games", emoji: "🎮", bg: "#6BCB77", description: "play together" },
  { name: "Shop", href: "/shop", emoji: "🛍️", bg: "#FFB74D", description: "spend meedo coins" },
  { name: "Food", href: "/food-picker", emoji: "🍕", bg: "#EF5350", description: "what to eat??" },
];

const floatingItems = [
  // chicken wings
  { emoji: "🍗", size: "text-3xl", duration: 6, delay: 0 },
  { emoji: "🍗", size: "text-2xl", duration: 8, delay: 2 },
  // crayons / art
  { emoji: "🖍️", size: "text-3xl", duration: 7, delay: 1 },
  { emoji: "🖍️", size: "text-2xl", duration: 9, delay: 3.5 },
  { emoji: "✏️", size: "text-2xl", duration: 6.5, delay: 4 },
  // hearts & love
  { emoji: "💕", size: "text-2xl", duration: 5.5, delay: 0.5 },
  { emoji: "💗", size: "text-3xl", duration: 7.5, delay: 2.5 },
  { emoji: "🩷", size: "text-xl", duration: 6, delay: 5 },
  // stars & sparkles
  { emoji: "⭐", size: "text-2xl", duration: 8, delay: 1.5 },
  { emoji: "🌟", size: "text-xl", duration: 6, delay: 3 },
  { emoji: "✨", size: "text-2xl", duration: 7, delay: 4.5 },
  // food & fun
  { emoji: "🧀", size: "text-2xl", duration: 7.5, delay: 0.8 },
  { emoji: "🎀", size: "text-2xl", duration: 6.5, delay: 2.2 },
  { emoji: "🐭", size: "text-3xl", duration: 8.5, delay: 1.2 },
  { emoji: "🎨", size: "text-xl", duration: 5, delay: 3.8 },
  { emoji: "🌸", size: "text-2xl", duration: 7, delay: 5.5 },
];

function FloatingArtifacts() {
  // generate positions client-side only to avoid hydration mismatch
  const [positions, setPositions] = useState<
    { left: number; top: number; rotate: number; xDrift: number }[]
  >([]);

  useEffect(() => {
    setPositions(
      floatingItems.map(() => ({
        left: Math.random() * 90 + 5,
        top: Math.random() * 85 + 5,
        rotate: Math.random() * 40 - 20,
        xDrift: Math.random() * 30 - 15,
      }))
    );
  }, []);

  if (positions.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {floatingItems.map((item, i) => {
        const pos = positions[i];
        return (
          <motion.div
            key={i}
            className={`absolute ${item.size} select-none`}
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
            }}
            initial={{ opacity: 0, scale: 0, rotate: pos.rotate }}
            animate={{
              opacity: [0, 0.6, 0.6, 0],
              scale: [0.5, 1, 1, 0.5],
              y: [0, -20, 20, 0],
              x: [0, pos.xDrift, -pos.xDrift, 0],
              rotate: [pos.rotate, pos.rotate + 10, pos.rotate - 10, pos.rotate],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {item.emoji}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-4 py-8 md:py-12 relative">
      <FloatingArtifacts />

      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-center mb-8 relative z-10"
      >
        <motion.h1
          className="font-heading text-4xl md:text-5xl font-semibold text-foreground mb-2"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          meedobeedo
        </motion.h1>
        <p className="text-muted-foreground text-lg font-body">
          welcome home 🏠
        </p>
      </motion.div>

      {/* Feature Grid */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
        }}
        className="grid grid-cols-2 gap-4 w-full max-w-[520px] relative z-10"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.href}
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.9 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: "spring", stiffness: 260, damping: 20 },
              },
            }}
            whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 1.5 : -1.5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href={f.href}
              className="group flex flex-col items-center justify-center aspect-square rounded-[24px] p-4 text-white shadow-lg transition-shadow duration-200 hover:shadow-xl"
              style={{ backgroundColor: f.bg }}
            >
              <motion.span
                className="text-4xl md:text-5xl mb-2 drop-shadow-sm"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              >
                {f.emoji}
              </motion.span>
              <span className="font-heading text-lg md:text-xl font-semibold drop-shadow-sm">
                {f.name}
              </span>
              <span className="text-[11px] md:text-xs opacity-80 font-body mt-0.5">
                {f.description}
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
