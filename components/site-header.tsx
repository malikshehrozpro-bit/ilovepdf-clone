"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold">
          {"PDF Studio"}
        </Link>
        <nav className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">{"Home"}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="https://vercel.com" target="_blank" rel="noreferrer">
              {"Deploy"}
            </a>
          </Button>
        </nav>
      </div>
    </header>
  )
}
