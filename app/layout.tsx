import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import SiteHeader from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "PDF Studio - iLovePDF Clone",
  description: "All-in-one PDF tools. Merge, split, compress, convert, protect, and more.",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
