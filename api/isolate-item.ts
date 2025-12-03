import { getAI } from "./_gemini";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { originalBase64, itemName } = body ?? {};
    if (!originalBase64 || !itemName) return res.status(400).json({ error: "Missing originalBase64 or itemName" });

    const ai = getAI();
    const cleanBase64 = String(originalBase64).includes(",")
      ? String(originalBase64).split(",")[1]
      : String(originalBase64);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          {
            text: `Generate a photorealistic, studio-quality product image of just the ${itemName} from this photo. The background must be pure white (#FFFFFF). The lighting should be soft and even. Preserve the texture and color exactly.`,
          },
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
