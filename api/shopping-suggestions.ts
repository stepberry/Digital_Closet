import { Type } from "@google/genai";
import { getAI, cleanJsonString } from "./_gemini";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { wardrobe } = body ?? {};
    if (!Array.isArray(wardrobe)) return res.status(400).json({ error: "Missing wardrobe" });

    const ai = getAI();
    const wardrobeSummary = wardrobe
      .map((item: any) => `${item.colorName ?? ""} ${item.name ?? ""} (${item.category ?? ""})`.trim())
      .join(", ");

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze this wardrobe: ${wardrobeSummary}.
Identify 3 key missing items that would maximize outfit combinations.
Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING },
                  category: { type: Type.STRING },
                  color: { type: Type.STRING },
                  style: { type: Type.STRING },
                  reason: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) return res.status(200).json({ suggestions: [] });

    return res.status(200).json(JSON.parse(cleanJsonString(text)));
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
