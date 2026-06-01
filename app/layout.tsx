import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATOMI SHINE AI Growth OS",
  description: "AI automation growth system for ATOMI SHINE DTC watch operations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
