import fs from "node:fs";
import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";

/**
 * Turn a course-material file into a Claude content block.
 * The model is the OCR: PDFs go in as document blocks, whiteboard photos as images.
 */
export function fileToContentBlock(filePath: string): Anthropic.ContentBlockParam {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".txt" || ext === ".md") {
    return { type: "text", text: fs.readFileSync(filePath, "utf8") };
  }
  const data = fs.readFileSync(filePath).toString("base64");
  if (ext === ".pdf") {
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data },
    };
  }
  const imageTypes: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  const mediaType = imageTypes[ext];
  if (!mediaType) {
    throw new Error(`unsupported input ${ext} — use .txt .md .pdf .jpg .png .webp`);
  }
  return { type: "image", source: { type: "base64", media_type: mediaType, data } };
}
