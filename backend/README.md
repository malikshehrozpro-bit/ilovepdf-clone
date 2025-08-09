# Backend (Node.js + Express)

Endpoints:
- POST /merge-pdf (files[])
- POST /split-pdf (files, range)
- POST /compress-pdf (files)
- POST /pdf-to-word (files)
- POST /word-to-pdf (files)
- POST /pdf-to-pptx (files)
- POST /pptx-to-pdf (files)
- POST /pdf-to-excel (files)
- POST /excel-to-pdf (files)
- POST /jpg-to-pdf (files[])
- POST /pdf-to-jpg (files)
- POST /rotate-pdf (files, rotation, range)
- POST /unlock-pdf (files, password)
- POST /protect-pdf (files, newPassword)
- POST /organize-pdf (files[], order)
- POST /watermark-pdf (files, watermarkText? watermarkImage?)

Responses:
- JSON: { jobId, filename, downloadUrl, expiresAtMinutes }

Setup:
- cp .env.example .env
- Install system deps (Ubuntu): ghostscript, libreoffice, default-jre
- npm i
- Python venv and pip install -r ../python/requirements.txt
- npm run dev
