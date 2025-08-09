import path from "path"
import fs from "fs"
import { fileURLToPath } from "url"
import { v4 as uuidv4 } from "uuid"
import { spawn } from "child_process"
import archiver from "archiver"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const ROOT = path.resolve(__dirname, "..")
export const TMP_ROOT = path.join(ROOT, "tmp")

export type Job = {
  id: string
  dir: string
  outputs: string[]
  createdAt: number
  expiresAt: number
}

export const ensureDirs = () => {
  if (!fs.existsSync(TMP_ROOT)) fs.mkdirSync(TMP_ROOT, { recursive: true })
}

export const newJob = (ttlMinutes: number): Job => {
  const id = uuidv4()
  const dir = path.join(TMP_ROOT, id)
  fs.mkdirSync(dir, { recursive: true })
  const createdAt = Date.now()
  const expiresAt = createdAt + ttlMinutes * 60 * 1000
  return { id, dir, outputs: [], createdAt, expiresAt }
}

export const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_")

export const runPython = (args: string[], cwd?: string) => {
  return new Promise<void>((resolve, reject) => {
    const py = spawn("python3", args, { cwd, stdio: "inherit" })
    py.on("error", reject)
    py.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Python exited with code ${code}`))
    })
  })
}

export const runCmd = (cmd: string, args: string[], cwd?: string) => {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, stdio: "inherit" })
    p.on("error", reject)
    p.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited with code ${code}`))
    })
  })
}

export const zipFiles = (files: { path: string; name?: string }[], zipPath: string) => {
  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver("zip", { zlib: { level: 9 } })
    output.on("close", () => resolve())
    archive.on("error", (err) => reject(err))
    archive.pipe(output)
    for (const f of files) {
      archive.file(f.path, { name: f.name || path.basename(f.path) })
    }
    archive.finalize().catch(reject)
  })
}

export const withinDir = (filePath: string, baseDir: string) => {
  const resolved = path.resolve(filePath)
  return resolved.startsWith(path.resolve(baseDir) + path.sep)
}
