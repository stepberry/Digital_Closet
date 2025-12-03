import { Type } from "@google/genai";
import { getAI, cleanJsonString } from "../lib/gemini.js";


export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { wardrobe, prompt } = body ?? {};
    if (!Array.isArray(wardrobe) || !prompt) return res.status(400).json({ error: "Missing wardrobe or prompt" });

    const ai = getAI();

    const wardrobeSummary = wardrobe.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      color: item.colorName,
      style: item.style,
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `You are a digital stylist.
User Request: "${prompt}"
Wardrobe: ${JSON.stringify(wardrobeSummary)}

Select the best outfit. You can mix and match.
Return JSON with 'itemIds', 'vibe', and 'reasoning'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            vibe: { type: Type.STRING },
            reasoning: { type: Type.STRING },
          },
        },
      },
    });

    const text = response.text;
    if (!text) return res.status(502).json({ error: "No text returned from model" });

    return res.status(200).json(JSON.parse(cleanJsonString(text)));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
