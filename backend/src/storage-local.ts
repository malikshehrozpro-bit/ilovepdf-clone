import fs from "fs"
import path from "path"
import { sanitizeName } from "./utils"

export const saveUploadLocal = (dir: string, originalName: string, buffer: Buffer) => {
  const name = sanitizeName(originalName)
  const full = path.join(dir, name)
  fs.writeFileSync(full, buffer)
  return full
}
