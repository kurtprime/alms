import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { customFileRouter } from "@/services/uploadthing/router";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata: Metadata = {
  title: "Admin Ark LMS",
  description: "Admin panel for Ark LMS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TRPCReactProvider>
      <html lang="en">
        <body
          className={`${GeistSans.variable} ${GeistMono.variable} antialiased `}
        >
          <NextSSRPlugin routerConfig={extractRouterConfig(customFileRouter)} />
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster />
        </body>
      </html>
    </TRPCReactProvider>
  );
}
