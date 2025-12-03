import { Type } from "@google/genai";
import { getAI, cleanJsonString } from "./_gemini";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { base64Image } = body ?? {};
    if (!base64Image) return res.status(400).json({ error: "Missing base64Image" });

    const ai = getAI();
    const cleanBase64 = String(base64Image).includes(",") ? String(base64Image).split(",")[1] : String(base64Image);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          {
            text:
              "Analyze this image. Identify every distinct article of clothing. For each item, provide a name, category (Top, Bottom, Shoes, Outerwear, Accessory, Dress), the most prominent color as a Hex Code, a color name, the pattern (if any, else 'Solid'), the style description, and the vibe.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  color: { type: Type.STRING },
                  colorName: { type: Type.STRING },
                  pattern: { type: Type.STRING },
                  style: { type: Type.STRING },
                  vibe: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) return res.status(502).json({ error: "No text returned from model" });

    const data = JSON.parse(cleanJsonString(text));
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(data);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
