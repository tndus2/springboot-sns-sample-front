import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Social - Connect with the world",
  description: "A modern social media platform",
  generator: "v0.app",
  icons: {
    icon: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // 브라우저 확장프로그램이나 클라이언트 초기화 과정에서 html/body 속성이 먼저 바뀌면
    // Next.js hydration warning 이 자주 발생하므로 루트에서 경고를 억제한다.
    <html lang="ko" className="dark" suppressHydrationWarning>
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
