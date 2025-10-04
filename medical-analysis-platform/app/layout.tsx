import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HoloVitals - Personal Health AI Assistant",
  description: "Your intelligent health companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <SessionProviderWrapper>
            {children}
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}