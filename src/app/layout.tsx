import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import dynamic from 'next/dynamic';

// Dynamically import the BirthdayOverlay component with no SSR
// This prevents hydration errors since the component uses window
const BirthdayOverlay = dynamic(() => import('../components/BirthdayOverlay'), { ssr: false });

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meedo & Beedo World",
  description: "Where love and mischief come together",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.className}>
      <body className="bg-white">
        <BirthdayOverlay />
        {children}
      </body>
    </html>
  );
}