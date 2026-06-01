import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI电商自动化运营平台",
  description: "面向电商团队的 AI 自动化运营、统一客服、订单物流和数据同步后台。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
