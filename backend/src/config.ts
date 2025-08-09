import dotenv from "dotenv"
dotenv.config()

export const config = {
  port: Number.parseInt(process.env.PORT || "4000", 10),
  ttlMinutes: Number.parseInt(process.env.TTL_MINUTES || "15", 10),
  maxFileMB: Number.parseInt(process.env.MAX_FILE_MB || "100", 10),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  useS3: (process.env.USE_S3 || "false").toLowerCase() === "true",
  s3: {
    region: process.env.AWS_REGION || "",
    bucket: process.env.S3_BUCKET || "",
  },
}
