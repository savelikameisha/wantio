import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const sora = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-wantio",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wantio",
  description:
    "Save the things you love. Organize your wishlist and share it with friends.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sora.variable} font-[family-name:var(--font-wantio)] antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
