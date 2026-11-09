import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadScout: find clients who are asking for your service",
  description: "LeadScout scans public posts on Bluesky and Hacker News daily, finds people asking for what you sell, and drafts a reply for each.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
