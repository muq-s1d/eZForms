import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AmbientWaves } from "@/components/animations/ambient-waves";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ezforms.app"),
  title: {
    default: "eZForms — Settle the debate.",
    template: "%s | eZForms",
  },
  description:
    "Create and share beautiful, interactive voting rooms in seconds. Who's most likely to? Find out now.",
  keywords: ["voting", "friends", "polls", "anonymous", "fun", "social", "live"],
  openGraph: {
    title: "eZForms — Settle the debate.",
    description: "Create and share beautiful, interactive voting rooms in seconds. Who's most likely to? Find out now.",
    url: "https://ezforms.app",
    siteName: "eZForms",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "eZForms Cover Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "eZForms — Settle the debate.",
    description: "Create and share beautiful, interactive voting rooms in seconds. Who's most likely to? Find out now.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans relative">
        <AmbientWaves />
        <TooltipProvider delay={300}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
