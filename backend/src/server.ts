import express from "express"
import cors from "cors"
import path from "path"
import fs from "fs"
import multer from "multer"
import mime from "mime-types"
import { config } from "./config"
import { ensureDirs, newJob, runPython, runCmd, zipFiles, TMP_ROOT } from "./utils"
import { startReaper } from "./cleanup"

ensureDirs()
startReaper(config.ttlMinutes)

const app = express()
app.use(cors({ origin: config.corsOrigin, credentials: false }))
app.use(express.json())

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileMB * 1024 * 1024,
  },
})

const pythonDir = path.resolve(process.cwd(), "../python")

const sendDownloadJson = (res: express.Response, jobId: string, outPath: string) => {
  const filename = path.basename(outPath)
  res.json({
    jobId,
    filename,
    downloadUrl: `/download/${jobId}/${encodeURIComponent(filename)}`,
    expiresAtMinutes: config.ttlMinutes,
  })
}

app.get("/health", (_req, res) => res.json({ ok: true }))

app.get("/download/:jobId/:filename", (req, res) => {
  const { jobId, filename } = req.params
  const dir = path.join(TMP_ROOT, jobId)
  const file = path.join(dir, filename)
  if (!fs.existsSync(file)) return res.status(404).send("Not found")
  res.download(file)
})

// Merge PDF
app.post("/merge-pdf", upload.array("files"), async (req, res) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length < 2) {
      return res.status(400).send("Upload at least two PDF files")
    }
    const job = newJob(config.ttlMinutes)
    const inputs: string[] = []
    for (const f of req.files as Express.Multer.File[]) {
      if (mime.extension(f.mimetype) !== "pdf") return res.status(400).send("PDFs only")
      const p = path.join(job.dir, f.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"))
      fs.writeFileSync(p, f.buffer)
      inputs.push(p)
    }
    const out = path.join(job.dir, "merged.pdf")
    await runPython(["processors/process.py", "merge", "--inputs", ...inputs, "--output", out], pythonDir)
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "Merge failed")
  }
})

// Split PDF
app.post("/split-pdf", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    const range = (req.body.range || "").trim() // e.g. "1-3,5,7-9"
    if (!file) return res.status(400).send("Upload a PDF")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.pdf")
    fs.writeFileSync(input, file.buffer)
    const outDir = path.join(job.dir, "split")
    fs.mkdirSync(outDir, { recursive: true })
    await runPython(
      ["processors/process.py", "split", "--input", input, "--ranges", range, "--outdir", outDir],
      pythonDir,
    )
    const zipPath = path.join(job.dir, "split.zip")
    const files = fs.readdirSync(outDir).map((name) => ({ path: path.join(outDir, name), name }))
    await zipFiles(files, zipPath)
    sendDownloadJson(res, job.id, zipPath)
  } catch (e: any) {
    res.status(500).send(e.message || "Split failed")
  }
})

// Compress PDF via Ghostscript fallback
app.post("/compress-pdf", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).send("Upload a PDF")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.pdf")
    const out = path.join(job.dir, "compressed.pdf")
    fs.writeFileSync(input, file.buffer)
    // Try Ghostscript
    try {
      await runCmd("gs", [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/ebook",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        `-sOutputFile=${out}`,
        input,
      ])
    } catch {
      // Fallback: re-save via PyMuPDF
      await runPython(["processors/process.py", "compress", "--input", input, "--output", out], pythonDir)
    }
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "Compress failed")
  }
})

// PDF -> Word
app.post("/pdf-to-word", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).send("Upload a PDF")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.pdf")
    const out = path.join(job.dir, "output.docx")
    fs.writeFileSync(input, file.buffer)
    await runPython(["processors/process.py", "pdf_to_word", "--input", input, "--output", out], pythonDir)
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "PDF->Word failed")
  }
})

// Word -> PDF (LibreOffice)
app.post("/word-to-pdf", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).send("Upload a .docx")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.docx")
    fs.writeFileSync(input, file.buffer)
    await runCmd("soffice", ["--headless", "--convert-to", "pdf", "--outdir", job.dir, input])
    const out = path.join(job.dir, "input.pdf")
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "Word->PDF failed")
  }
})

// PDF -> PPTX
app.post("/pdf-to-pptx", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).send("Upload a PDF")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.pdf")
    const out = path.join(job.dir, "slides.pptx")
    fs.writeFileSync(input, file.buffer)
    await runPython(["processors/process.py", "pdf_to_pptx", "--input", input, "--output", out], pythonDir)
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "PDF->PPTX failed")
  }
})

// PPTX -> PDF
app.post("/pptx-to-pdf", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).send("Upload a .pptx")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.pptx")
    fs.writeFileSync(input, file.buffer)
    await runCmd("soffice", ["--headless", "--convert-to", "pdf", "--outdir", job.dir, input])
    const out = path.join(job.dir, "input.pdf")
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "PPTX->PDF failed")
  }
})

// PDF -> Excel
app.post("/pdf-to-excel", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).send("Upload a PDF")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.pdf")
    const out = path.join(job.dir, "tables.xlsx")
    fs.writeFileSync(input, file.buffer)
    await runPython(["processors/process.py", "pdf_to_excel", "--input", input, "--output", out], pythonDir)
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "PDF->Excel failed")
  }
})

// Excel -> PDF
app.post("/excel-to-pdf", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).send("Upload a .xlsx")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.xlsx")
    fs.writeFileSync(input, file.buffer)
    await runCmd("soffice", ["--headless", "--convert-to", "pdf", "--outdir", job.dir, input])
    const out = path.join(job.dir, "input.pdf")
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "Excel->PDF failed")
  }
})

// JPG -> PDF
app.post("/jpg-to-pdf", upload.array("files"), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) return res.status(400).send("Upload one or more images")
    const job = newJob(config.ttlMinutes)
    const imgs: string[] = []
    for (const f of files) {
      const ext = (f.originalname.split(".").pop() || "").toLowerCase()
      if (!["jpg", "jpeg", "png"].includes(ext)) return res.status(400).send("Only JPG/PNG")
      const p = path.join(job.dir, f.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"))
      fs.writeFileSync(p, f.buffer)
      imgs.push(p)
    }
    const out = path.join(job.dir, "images.pdf")
    await runPython(["processors/process.py", "jpg_to_pdf", "--images", ...imgs, "--output", out], pythonDir)
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "JPG->PDF failed")
  }
})

// PDF -> JPG
app.post("/pdf-to-jpg", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).send("Upload a PDF")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.pdf")
    const outDir = path.join(job.dir, "images")
    fs.writeFileSync(input, file.buffer)
    fs.mkdirSync(outDir, { recursive: true })
    await runPython(["processors/process.py", "pdf_to_jpg", "--input", input, "--outdir", outDir], pythonDir)
    const zipPath = path.join(job.dir, "images.zip")
    const files = fs.readdirSync(outDir).map((name) => ({ path: path.join(outDir, name), name }))
    await zipFiles(files, zipPath)
    sendDownloadJson(res, job.id, zipPath)
  } catch (e: any) {
    res.status(500).send(e.message || "PDF->JPG failed")
  }
})

// Rotate PDF
app.post("/rotate-pdf", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    const rotation = Number.parseInt((req.body.rotation || "90") as string, 10)
    const range = (req.body.range || "").trim()
    if (!file) return res.status(400).send("Upload a PDF")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.pdf")
    const out = path.join(job.dir, "rotated.pdf")
    fs.writeFileSync(input, file.buffer)
    await runPython(
      [
        "processors/process.py",
        "rotate",
        "--input",
        input,
        "--output",
        out,
        "--rotation",
        String(rotation),
        "--ranges",
        range,
      ],
      pythonDir,
    )
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "Rotate failed")
  }
})

// Unlock PDF
app.post("/unlock-pdf", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    const password = (req.body.password || "") as string
    if (!file) return res.status(400).send("Upload a PDF")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.pdf")
    const out = path.join(job.dir, "unlocked.pdf")
    fs.writeFileSync(input, file.buffer)
    await runPython(
      ["processors/process.py", "unlock", "--input", input, "--output", out, "--password", password],
      pythonDir,
    )
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "Unlock failed")
  }
})

// Protect PDF
app.post("/protect-pdf", upload.single("files"), async (req, res) => {
  try {
    const file = req.file
    const newPassword = (req.body.newPassword || "") as string
    if (!file || !newPassword) return res.status(400).send("Upload a PDF and set a password")
    const job = newJob(config.ttlMinutes)
    const input = path.join(job.dir, "input.pdf")
    const out = path.join(job.dir, "protected.pdf")
    fs.writeFileSync(input, file.buffer)
    await runPython(
      ["processors/process.py", "protect", "--input", input, "--output", out, "--password", newPassword],
      pythonDir,
    )
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "Protect failed")
  }
})

// Organize PDF (reorder pages/files)
app.post("/organize-pdf", upload.array("files"), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[]
    const order = JSON.parse(req.body.order || "[]") as number[]
    if (!files || files.length === 0) return res.status(400).send("Upload PDFs")
    const job = newJob(config.ttlMinutes)
    const pdfs: string[] = []
    for (const f of files) {
      const p = path.join(job.dir, f.originalname.replace(/[^a-zA-Z0-9._-]/g, "_"))
      fs.writeFileSync(p, f.buffer)
      pdfs.push(p)
    }
    const out = path.join(job.dir, "organized.pdf")
    // If multiple PDFs, merge first in provided order; else reorder pages
    if (pdfs.length > 1) {
      const ordered = order.length === pdfs.length ? order.map((i) => pdfs[i]) : pdfs
      await runPython(["processors/process.py", "merge", "--inputs", ...ordered, "--output", out], pythonDir)
    } else {
      await runPython(
        [
          "processors/process.py",
          "reorder_pages",
          "--input",
          pdfs[0],
          "--output",
          out,
          "--order",
          JSON.stringify(order),
        ],
        pythonDir,
      )
    }
    sendDownloadJson(res, job.id, out)
  } catch (e: any) {
    res.status(500).send(e.message || "Organize failed")
  }
})

// Watermark PDF
app.post(
  "/watermark-pdf",
  upload.fields([
    { name: "files", maxCount: 1 },
    { name: "watermarkImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const file = (req.files as any)?.files?.[0] as Express.Multer.File | undefined
      const wmImg = (req.files as any)?.watermarkImage?.[0] as Express.Multer.File | undefined
      const text = (req.body.watermarkText || "") as string
      if (!file) return res.status(400).send("Upload a PDF")
      const job = newJob(config.ttlMinutes)
      const input = path.join(job.dir, "input.pdf")
      const out = path.join(job.dir, "watermarked.pdf")
      fs.writeFileSync(input, file.buffer)
      if (wmImg) {
        const imgPath = path.join(job.dir, "wm." + (wmImg.originalname.split(".").pop() || "png"))
        fs.writeFileSync(imgPath, wmImg.buffer)
        await runPython(
          ["processors/process.py", "watermark_image", "--input", input, "--output", out, "--image", imgPath],
          pythonDir,
        )
      } else {
        await runPython(
          ["processors/process.py", "watermark_text", "--input", input, "--output", out, "--text", text],
          pythonDir,
        )
      }
      sendDownloadJson(res, job.id, out)
    } catch (e: any) {
      res.status(500).send(e.message || "Watermark failed")
    }
  },
)

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`)
})
