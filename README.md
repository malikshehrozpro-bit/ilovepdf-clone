# PDF Studio (iLovePDF Clone)

Full-stack clone of iLovePDF with:
- Next.js (App Router) + Tailwind + shadcn/ui + Framer Motion
- Node.js Express backend with Multer for uploads
- Python processors using PyMuPDF, Pillow, pikepdf, pdf2docx, python-pptx, tabula-py, pandas
- System tools: Ghostscript (PDF compression), LibreOffice (Office conversions), Java (tabula)

Features:
- Merge, Split, Compress
- PDF ↔ Word, PDF ↔ PowerPoint, PDF ↔ Excel
- JPG ↔ PDF, PDF → JPG
- Rotate, Unlock, Protect, Organize, Watermark
- Auto-delete temporary files, optional S3 storage (off by default)

Quickstart:
1) Frontend
   - NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
   - Run Next.js from this Block preview or via Vercel deploy.

2) Backend (local)
   - cd backend
   - cp .env.example .env
   - Install system deps (Ubuntu):
     sudo apt-get update
     sudo apt-get install -y ghostscript libreoffice-core libreoffice-writer libreoffice-impress libreoffice-calc libreoffice-java-common default-jre
   - Install Node deps:
     npm i
   - Install Python deps:
     cd ../python && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
   - Run backend:
     cd ../backend && npm run dev
     # Backend on http://localhost:4000

Deployment:
- Frontend: Vercel
- Backend: AWS EC2 or Render (Ubuntu 22.04 LTS recommended)
- Optional: enable S3 in backend/.env and install AWS credentials

Security:
- Files stored in per-job temp folders and auto-deleted after TTL (default 15 min).
- Inputs are validated, MIME checked, and filenames sanitized.
- For higher sensitivity, deploy backend inside your private VPC and enable S3 SSE.

Notes:
- This preview environment cannot execute Ghostscript/LibreOffice. Use the provided backend on a server.
