import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadScout",
  description: "Find the Reddit threads where people are already asking for what you sell.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
