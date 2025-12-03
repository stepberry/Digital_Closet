import { GoogleGenAI } from "@google/genai";

export function getAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY (or GOOGLE_API_KEY).");
  return new GoogleGenAI({ apiKey });
}

export function cleanJsonString(text: string): string {
  let clean = text.trim();
  if (clean.startsWith("```json")) clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  else if (clean.startsWith("```")) clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
  return clean;
}
