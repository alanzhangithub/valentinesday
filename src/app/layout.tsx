import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BirthdayWrapper from "../components/BirthdayWrapper";
import Providers from "../components/Providers";

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
        <Providers>
          <BirthdayWrapper />
          {children}
        </Providers>
      </body>
    </html>
  );
}