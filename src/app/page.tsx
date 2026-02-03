"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const features = [
  {
    title: "Photos",
    description: "Our memories together",
    href: "/photos",
    icon: "📸",
    color: "bg-pink-50 hover:bg-pink-100",
  },
  {
    title: "Sticker Board",
    description: "Leave notes & stickers",
    href: "/sticker-board",
    icon: "🎨",
    color: "bg-yellow-50 hover:bg-yellow-100",
  },
  {
    title: "Calendar",
    description: "Our hangouts & dates",
    href: "/calendar",
    icon: "📅",
    color: "bg-blue-50 hover:bg-blue-100",
  },
  {
    title: "Wishing Well",
    description: "Make a wish to Mod",
    href: "/wishing-well",
    icon: "✨",
    color: "bg-purple-50 hover:bg-purple-100",
  },
  {
    title: "Coupons",
    description: "Redeem special treats",
    href: "/coupons",
    icon: "🎟️",
    color: "bg-orange-50 hover:bg-orange-100",
  },
  {
    title: "Games",
    description: "Play & earn coins",
    href: "/games",
    icon: "🎮",
    color: "bg-green-50 hover:bg-green-100",
  },
  {
    title: "Shop",
    description: "Spend your Meedo Coins",
    href: "/shop",
    icon: "🛍️",
    color: "bg-indigo-50 hover:bg-indigo-100",
  },
  {
    title: "Food Picker",
    description: "What should we eat?",
    href: "/food-picker",
    icon: "🍕",
    color: "bg-red-50 hover:bg-red-100",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="flex justify-center items-center gap-4 mb-6">
            <Image
              src="/stickers/meedo-default.svg"
              alt="Meedo"
              width={80}
              height={80}
              className="w-20 h-20"
            />
            <span className="text-4xl">+</span>
            <Image
              src="/stickers/beedo-default.svg"
              alt="Beedo"
              width={80}
              height={80}
              className="w-20 h-20"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to Meedobeedo
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            A private little world for just the two of us. Play games, make wishes,
            share photos, and collect memories together.
          </p>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link
                href={feature.href}
                className={`block p-6 rounded-2xl border border-gray-200 transition-all duration-200 ${feature.color}`}
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quick Stats - placeholder */}
      <section className="border-t border-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-500">Photos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-500">Wishes Granted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-500">Meedo Coins</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 text-center text-sm text-gray-400">
        made with love by meedo for beedo
      </footer>
    </div>
  );
}
