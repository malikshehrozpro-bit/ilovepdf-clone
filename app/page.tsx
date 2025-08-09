"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { tools } from "@/lib/tools"
import { cn } from "@/lib/utils"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center gap-6">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight"
          >
            {"All-in-One PDF Tools — Fast, Private, Powerful"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-neutral-600 max-w-2xl"
          >
            {
              "Upload, process, and download instantly. Merge, split, compress, convert, protect, and more — just like iLovePDF, with a smoother UI."
            }
          </motion.p>
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link href="/tools/merge-pdf">{"Get started"}</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="https://vercel.com" target="_blank" rel="noreferrer">
                {"Deploy"}
              </a>
            </Button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-12"
        >
          {tools.map((tool, idx) => (
            <motion.div
              key={tool.slug}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
            >
              <Card className={cn("hover:shadow-lg transition-shadow h-full")}>
                <CardHeader>
                  <CardTitle className="text-lg">{tool.title}</CardTitle>
                  <p className="text-sm text-neutral-500">{tool.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-500">{tool.acceptLabel || tool.accept.join(", ")}</span>
                    <Button asChild size="sm">
                      <Link href={`/tools/${tool.slug}`}>{"Open"}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 border rounded-lg p-6 bg-white">
          <h2 className="font-semibold text-xl mb-2">{"Privacy & Security"}</h2>
          <p className="text-neutral-600 text-sm">
            {
              "Files are processed in-memory or stored temporarily with auto-delete. You can self-host the backend on your own server for full control."
            }
          </p>
        </div>
      </section>
    </main>
  )
}
