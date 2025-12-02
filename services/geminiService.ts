import { GoogleGenAI, Type } from "@google/genai";
import { ClothingItem, WardrobeAnalysisResult, ShoppingSuggestion } from "../types";

// Helper: Resize and compress image
// MODIFIED: Aggressive compression (Max 640px, 0.5 quality) to ensure LocalStorage stability
export const resizeImage = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 640; // Reduced to 640px to prevent memory crashes
        
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
             reject(new Error("Could not get canvas context"));
             return;
        }
        ctx.fillStyle = "#FFFFFF"; // Ensure no transparent backgrounds which can increase size
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        // Reduced quality to 0.5 for maximum storage efficiency
        resolve(canvas.toDataURL('image/jpeg', 0.5)); 
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Helper: Compress an existing base64 string
export const compressBase64 = async (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 640;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDim) { height *= maxDim / width; width = maxDim; }
            } else {
                if (height > maxDim) { width *= maxDim / height; height = maxDim; }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if(ctx) {
                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.5));
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => resolve(base64Str);
    });
};

// Helper: Clean JSON string
const cleanJsonString = (text: string): string => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return clean;
};

// Reverting to process.env.API_KEY as per coding guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image to detect clothing items.
 */
export const analyzeWardrobeImage = async (base64Image: string): Promise<WardrobeAnalysisResult> => {
  const ai = getAI();
  const cleanBase64 = base64Image.split(',')[1];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
        { text: "Analyze this image. Identify every distinct article of clothing. For each item, provide a name, category (Top, Bottom, Shoes, Outerwear, Accessory, Dress), the most prominent color as a Hex Code, a color name, the pattern (if any, else 'Solid'), the style description, and the vibe." }
      ]
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
                color: { type: Type.STRING, description: "Hex code e.g. #FF0000" },
                colorName: { type: Type.STRING },
                pattern: { type: Type.STRING },
                style: { type: Type.STRING },
                vibe: { type: Type.STRING },
              }
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data returned from AI");
  
  try {
    const cleanedText = cleanJsonString(text);
    return JSON.parse(cleanedText) as WardrobeAnalysisResult;
  } catch (e) {
    throw new Error("AI returned invalid data format.");
  }
};

/**
 * Generates an isolated "Product Shot".
 */
export const isolateClothingItem = async (originalBase64: string, itemName: string): Promise<string> => {
  const ai = getAI();
  const cleanBase64 = originalBase64.split(',')[1];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
        { text: `Generate a photorealistic, studio-quality product image of just the ${itemName} from this photo. The background must be pure white (#FFFFFF). The lighting should be soft and even. Preserve the texture and color exactly.` }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
      // Compress isolated items to save storage
      return await compressBase64(rawBase64);
    }
  }
  return originalBase64;
};

/**
 * Generates a virtual try-on image.
 */
export const generateVirtualTryOn = async (
  modelBase64: string,
  clothingItems: ClothingItem[],
  vibe: string
): Promise<string> => {
  const ai = getAI();
  const cleanModelBase64 = modelBase64.split(',')[1];

  const itemDescriptions = clothingItems.map(c => `${c.colorName} ${c.name} (${c.style})`).join(", ");
  
  // UPDATED PROMPT: STRICT "Keep Original" Logic
  const prompt = `
    Image Editing Task: Virtual Try-On.
    
    Target Items to Wear: ${itemDescriptions}.
    Style Context: ${vibe}.

    INSTRUCTIONS:
    1. MODIFY ONLY the specific body parts required to wear the Target Items.
    2. PRESERVE EVERYTHING ELSE: The person's face, body, pose, background, and any existing clothing items that do not conflict with the Target Items MUST remain unchanged.
       - Example: If Target Items only includes a shirt, do NOT change the person's existing pants or shoes.
       - Example: If Target Items only includes shoes, do NOT change the person's shirt or pants.
    3. REALISM: The new items should blend photorealistically with the original image (lighting, shadows, fabric texture).
    4. Do not auto-complete the outfit. If the user only selected one item, show only that item on the person.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { inlineData: { mimeType: "image/jpeg", data: cleanModelBase64 } },
        { text: prompt }
      ]
    }
  });

   for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
       // Do NOT compress try-on results. Return high-quality base64 for zooming.
       return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Failed to generate try-on image");
};

/**
 * Suggests an outfit based on a prompt.
 */
export const suggestOutfit = async (wardrobe: ClothingItem[], prompt: string): Promise<{ itemIds: string[], vibe: string, reasoning: string }> => {
  const ai = getAI();
  const wardrobeSummary = wardrobe.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    color: item.colorName,
    style: item.style
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
          reasoning: { type: Type.STRING }
        }
      }
    }
  });

  const text = response.text;
  if(!text) throw new Error("No suggestion generated");
  return JSON.parse(cleanJsonString(text));
}

/**
 * Suggests shopping additions.
 */
export const suggestShoppingAdditions = async (wardrobe: ClothingItem[]): Promise<ShoppingSuggestion[]> => {
    const ai = getAI();
    const wardrobeSummary = wardrobe.map(item => `${item.colorName} ${item.name} (${item.category})`).join(", ");

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
                                reason: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });

    const text = response.text;
    if(!text) return [];
    try {
        const data = JSON.parse(cleanJsonString(text));
        return data.suggestions || [];
    } catch {
        return [];
    }
};