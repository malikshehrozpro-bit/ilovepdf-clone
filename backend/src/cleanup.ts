import fs from "fs"
import path from "path"
import { TMP_ROOT } from "./utils"

export const startReaper = (ttlMinutes: number) => {
  const intervalMs = 60_000
  setInterval(() => {
    try {
      if (!fs.existsSync(TMP_ROOT)) return
      const now = Date.now()
      for (const id of fs.readdirSync(TMP_ROOT)) {
        const dir = path.join(TMP_ROOT, id)
        const stat = fs.statSync(dir)
        const age = now - stat.mtimeMs
        if (age > ttlMinutes * 60_000) {
          fs.rmSync(dir, { recursive: true, force: true })
        }
      }
    } catch {}
  }, intervalMs)
}
