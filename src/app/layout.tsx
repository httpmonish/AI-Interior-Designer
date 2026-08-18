import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RoomCraft AI — 2D Floorplan Optimizer",
  description: "AI-powered interior layout optimizer. Arrange furniture, audit ergonomics, and get AI suggestions in seconds.",
  keywords: ["room planner", "interior design", "AI layout", "furniture arrangement", "floorplan"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark`}>
      <body className="h-full flex flex-col bg-zinc-950 text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
