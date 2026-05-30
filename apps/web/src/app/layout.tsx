import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI电商自动化平台",
  description: "面向电商业务的 AI 自动化、数据同步和经营监控平台",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
