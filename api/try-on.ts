import { getAI } from "../lib/gemini.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { modelBase64, clothingItems, vibe } = body ?? {};
    if (!modelBase64 || !Array.isArray(clothingItems)) {
      return res.status(400).json({ error: "Missing modelBase64 or clothingItems" });
    }

    const ai = getAI();
    const cleanModelBase64 = String(modelBase64).includes(",") ? String(modelBase64).split(",")[1] : String(modelBase64);

    const itemDescriptions = clothingItems
      .map((c: any) => `${c.colorName ?? ""} ${c.name ?? ""} (${c.style ?? ""})`.trim())
      .filter(Boolean)
      .join(", ");

    const prompt = `
Image Editing Task: Virtual Try-On.

Target Items to Wear: ${itemDescriptions}.
Style Context: ${vibe || "Editorial"}.

INSTRUCTIONS:
1. MODIFY ONLY the specific body parts required to wear the Target Items.
2. PRESERVE EVERYTHING ELSE: The person's face, body, pose, background, and any existing clothing items that do not conflict with the Target Items MUST remain unchanged.
3. REALISM: The new items should blend photorealistically with the original image (lighting, shadows, fabric texture).
4. Do not auto-complete the outfit. If the user only selected one item, show only that item on the person.
`.trim();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanModelBase64 } },
          { text: prompt },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return res.status(200).json({ image: `data:image/png;base64,${part.inlineData.data}` });
      }
    }

    return res.status(502).json({ error: "No image returned from model" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
