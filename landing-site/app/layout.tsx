import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Hub - Your Private AI Workspace",
  description: "Chat with local models, multiple providers, and keep your data on your device.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
