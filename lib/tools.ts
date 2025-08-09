export type ToolConfig = {
  slug: string
  title: string
  description: string
  endpoint: string
  accept: string[]
  acceptLabel?: string
  multiple?: boolean
  fieldName?: string
  options?: ("range" | "rotation" | "password" | "newPassword" | "order" | "watermarkText" | "watermarkImage")[]
}

export const tools: ToolConfig[] = [
  {
    slug: "merge-pdf",
    title: "Merge PDF",
    description: "Combine multiple PDFs into one file.",
    endpoint: "/merge-pdf",
    accept: [".pdf"],
    multiple: true,
  },
  {
    slug: "split-pdf",
    title: "Split PDF",
    description: "Extract pages or split by ranges.",
    endpoint: "/split-pdf",
    accept: [".pdf"],
    options: ["range"],
  },
  {
    slug: "compress-pdf",
    title: "Compress PDF",
    description: "Reduce file size while keeping quality.",
    endpoint: "/compress-pdf",
    accept: [".pdf"],
  },
  {
    slug: "pdf-to-word",
    title: "PDF to Word",
    description: "Convert PDF to editable .docx.",
    endpoint: "/pdf-to-word",
    accept: [".pdf"],
  },
  {
    slug: "word-to-pdf",
    title: "Word to PDF",
    description: "Convert .docx to PDF.",
    endpoint: "/word-to-pdf",
    accept: [".docx"],
  },
  {
    slug: "pdf-to-pptx",
    title: "PDF to PowerPoint",
    description: "Convert PDF pages to .pptx slides.",
    endpoint: "/pdf-to-pptx",
    accept: [".pdf"],
  },
  {
    slug: "pptx-to-pdf",
    title: "PowerPoint to PDF",
    description: "Convert .pptx to PDF.",
    endpoint: "/pptx-to-pdf",
    accept: [".pptx"],
  },
  {
    slug: "pdf-to-excel",
    title: "PDF to Excel",
    description: "Extract tables to .xlsx.",
    endpoint: "/pdf-to-excel",
    accept: [".pdf"],
  },
  {
    slug: "excel-to-pdf",
    title: "Excel to PDF",
    description: "Convert .xlsx to PDF.",
    endpoint: "/excel-to-pdf",
    accept: [".xlsx"],
  },
  {
    slug: "jpg-to-pdf",
    title: "JPG to PDF",
    description: "Combine images into a single PDF.",
    endpoint: "/jpg-to-pdf",
    accept: [".jpg", ".jpeg", ".png"],
    multiple: true,
  },
  {
    slug: "pdf-to-jpg",
    title: "PDF to JPG",
    description: "Export PDF pages as JPG images.",
    endpoint: "/pdf-to-jpg",
    accept: [".pdf"],
  },
  {
    slug: "rotate-pdf",
    title: "Rotate PDF",
    description: "Rotate selected pages or entire doc.",
    endpoint: "/rotate-pdf",
    accept: [".pdf"],
    options: ["rotation", "range"],
  },
  {
    slug: "unlock-pdf",
    title: "Unlock PDF",
    description: "Remove password protection (with password).",
    endpoint: "/unlock-pdf",
    accept: [".pdf"],
    options: ["password"],
  },
  {
    slug: "protect-pdf",
    title: "Protect PDF",
    description: "Add password encryption.",
    endpoint: "/protect-pdf",
    accept: [".pdf"],
    options: ["newPassword"],
  },
  {
    slug: "organize-pdf",
    title: "Organize PDF",
    description: "Rearrange pages or merge in custom order.",
    endpoint: "/organize-pdf",
    accept: [".pdf"],
    multiple: true,
    options: ["order"],
  },
  {
    slug: "watermark-pdf",
    title: "Add Watermark",
    description: "Text or image watermark overlay.",
    endpoint: "/watermark-pdf",
    accept: [".pdf"],
    options: ["watermarkText", "watermarkImage"],
  },
]
