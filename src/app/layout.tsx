import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GrowthMatrix",
  description: "A manager's tool for evaluating and growing their team.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 text-sm antialiased">
        {children}
      </body>
    </html>
  );
}
