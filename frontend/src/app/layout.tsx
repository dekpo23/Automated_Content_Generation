import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
    title: "Content Automation Dashboard",
    description: "Internal dashboard to generate and review AI-driven content",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="antialiased dark">
            <body className={`${outfit.className} min-h-screen bg-gray-50 dark:bg-[#0f1115] text-gray-900 dark:text-gray-100`}>
                {children}
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1f2228',
                            color: '#f3f4f6',
                            border: '1px solid #374151',
                        },
                    }}
                />
            </body>
        </html>
    );
}
