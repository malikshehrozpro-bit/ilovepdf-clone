"use client"

import type React from "react"

import { useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { tools } from "@/lib/tools"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import { RotateCw, Download, Upload, Trash2 } from "lucide-react"

type Status = "idle" | "uploading" | "processing" | "done" | "error"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"

export default function ToolPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const tool = useMemo(() => tools.find((t) => t.slug === slug), [slug])
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<Status>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState<string | null>(null)

  // Options state (subset, dynamic by tool)
  const [range, setRange] = useState("")
  const [rotation, setRotation] = useState(90)
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [watermarkText, setWatermarkText] = useState("")
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null)
  const [order, setOrder] = useState<number[]>([])

  if (!tool) {
    return (
      <main className="container mx-auto px-4 py-16">
        <p className="text-neutral-600">{"Tool not found."}</p>
        <Button className="mt-4" onClick={() => router.push("/")}>
          {"Back home"}
        </Button>
      </main>
    )
  }

  const accepts = tool.accept.join(",")

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : []
    if (!tool.multiple && list.length > 1) {
      setFiles([list[0]])
    } else {
      setFiles(list)
    }
    if (tool.slug === "organize-pdf") {
      setOrder(list.map((_, idx) => idx))
    }
  }

  const moveOrder = (from: number, to: number) => {
    const next = [...order]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setOrder(next)
  }

  const reset = () => {
    setFiles([])
    setStatus("idle")
    setProgress(0)
    setError(null)
    setDownloadUrl(null)
    setDownloadName(null)
    setWatermarkImage(null)
  }

  const handleSubmit = async () => {
    if (files.length === 0) return
    try {
      setStatus("uploading")
      setProgress(10)
      setError(null)
      setDownloadUrl(null)
      setDownloadName(null)

      const fd = new FormData()
      const fieldName = tool.fieldName || "files"
      files.forEach((f) => fd.append(fieldName, f))

      // Add options
      if (tool.options?.includes("range")) fd.append("range", range)
      if (tool.options?.includes("rotation")) fd.append("rotation", String(rotation))
      if (tool.options?.includes("password")) fd.append("password", password)
      if (tool.options?.includes("newPassword")) fd.append("newPassword", newPassword)
      if (tool.options?.includes("order")) fd.append("order", JSON.stringify(order))
      if (tool.options?.includes("watermarkText")) fd.append("watermarkText", watermarkText)
      if (tool.options?.includes("watermarkImage") && watermarkImage) fd.append("watermarkImage", watermarkImage)

      setProgress(35)
      setStatus("processing")
      const res = await fetch(`${API_BASE}${tool.endpoint}`, {
        method: "POST",
        body: fd,
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Processing failed")
      }
      const data = await res.json()
      setProgress(90)
      setDownloadUrl(`${API_BASE}${data.downloadUrl}`)
      setDownloadName(data.filename || "download")
      setStatus("done")
      setProgress(100)
    } catch (e: any) {
      setStatus("error")
      setError(e?.message || "Something went wrong")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="bg-white">
              <CardTitle className="text-2xl">{tool.title}</CardTitle>
              <p className="text-sm text-neutral-500">{tool.description}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed rounded-lg p-6 bg-neutral-50">
                <div className="flex flex-col items-center text-center gap-3">
                  <Upload className="w-8 h-8 text-neutral-500" />
                  <p className="text-sm text-neutral-600">
                    {tool.multiple
                      ? "Drag & drop files here or click to upload multiple files."
                      : "Drag & drop a file here or click to upload."}
                  </p>
                  <Input type="file" accept={accepts} multiple={tool.multiple} onChange={onFileChange} />
                  <p className="text-xs text-neutral-400">{tool.acceptLabel || tool.accept.join(", ")}</p>
                  {files.length > 0 && (
                    <div className="w-full text-left mt-4">
                      <p className="text-sm font-medium mb-2">{"Selected files"}</p>
                      <ul className="text-sm text-neutral-700 space-y-1">
                        {files.map((f, i) => (
                          <li key={i} className="flex items-center justify-between">
                            <span className="truncate">{f.name}</span>
                            <span className="text-xs text-neutral-400">
                              {(f.size / 1024 / 1024).toFixed(2)}
                              {" MB"}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button variant="ghost" size="sm" className="mt-2" onClick={reset}>
                        <Trash2 className="w-4 h-4 mr-2" /> {"Clear"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {tool.options && tool.options.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    {tool.options.includes("range") && (
                      <div>
                        <Label>{"Page range (e.g., 1-3,5,7-9)"}</Label>
                        <Input placeholder="e.g., 1-3,5,7-9" value={range} onChange={(e) => setRange(e.target.value)} />
                      </div>
                    )}
                    {tool.options.includes("rotation") && (
                      <div>
                        <Label>{"Rotation (degrees)"}</Label>
                        <Input
                          type="number"
                          value={rotation}
                          onChange={(e) => setRotation(Number.parseInt(e.target.value || "0"))}
                        />
                      </div>
                    )}
                    {tool.options.includes("password") && (
                      <div className="sm:col-span-1">
                        <Label>{"Password"}</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                      </div>
                    )}
                    {tool.options.includes("newPassword") && (
                      <div className="sm:col-span-1">
                        <Label>{"New password"}</Label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      </div>
                    )}
                    {tool.options.includes("watermarkText") && (
                      <div className="sm:col-span-2">
                        <Label>{"Watermark text"}</Label>
                        <Input
                          placeholder="e.g., CONFIDENTIAL"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                        />
                      </div>
                    )}
                    {tool.options.includes("watermarkImage") && (
                      <div className="sm:col-span-2">
                        <Label>{"Watermark image (PNG/JPG)"}</Label>
                        <Input
                          type="file"
                          accept=".png,.jpg,.jpeg"
                          onChange={(e) => setWatermarkImage(e.target.files?.[0] || null)}
                        />
                      </div>
                    )}
                    {tool.slug === "organize-pdf" && files.length > 0 && (
                      <div className="sm:col-span-2">
                        <Label>{"Order pages/files"}</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {order.map((idx, pos) => (
                            <div
                              key={pos}
                              className="px-3 py-2 rounded border bg-white text-sm flex items-center gap-2"
                            >
                              <span className="font-mono">{pos + 1}</span>
                              <span className="truncate max-w-[180px]">{files[idx]?.name || `Page ${idx + 1}`}</span>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" onClick={() => pos > 0 && moveOrder(pos, pos - 1)}>
                                  {"<"}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => pos < order.length - 1 && moveOrder(pos, pos + 1)}
                                >
                                  {">"}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <Button disabled={status === "processing" || status === "uploading"} onClick={handleSubmit}>
                    <RotateCw className="w-4 h-4 mr-2" />
                    {status === "idle" && "Process"}
                    {status === "uploading" && "Uploading..."}
                    {status === "processing" && "Processing..."}
                    {status === "done" && "Re-process"}
                    {status === "error" && "Retry"}
                  </Button>
                </div>
                {(status === "uploading" || status === "processing") && <Progress value={progress} />}
                {error && <p className="text-red-600 text-sm">{error}</p>}
              </div>
            </CardContent>
            <CardFooter className="bg-neutral-50 flex flex-col items-start gap-3">
              {status === "done" && downloadUrl && (
                <Button asChild>
                  <a href={downloadUrl} download={downloadName || undefined}>
                    <Download className="w-4 h-4 mr-2" />
                    {"Download result"}
                  </a>
                </Button>
              )}
              <p className="text-xs text-neutral-500">
                {"Files auto-delete after 15 minutes. Processing happens on your server."}
              </p>
            </CardFooter>
          </Card>
        </div>
      </section>
    </main>
  )
}
