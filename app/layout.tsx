import type { Metadata } from "next";
import { Ubuntu_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "./_components/Navbar";
import Footer from "./_components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";


const ubuntu = Ubuntu_Sans({
  variable: "--font-ubuntu-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HireOrbit - Job Listing Portal",
  description: "A modern job listing portal for tech enthusiasts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning
        className={ubuntu.className}
      >
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          {children}
          <Footer />
          <Toaster
            position="top-center"
            toastOptions={{ style: { zIndex: 60 } }}
            gutter={8}
          />
        </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
