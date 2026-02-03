import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "../components/Providers";
import Navigation from "../components/layout/Navigation";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meedobeedo",
  description: "A private world for two",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.className}>
      <body className="bg-white min-h-screen">
        <Providers>
          <Navigation />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}