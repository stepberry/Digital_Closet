import { ClothingItem, WardrobeAnalysisResult, ShoppingSuggestion } from "../types";

// ---------- Image helpers (browser-safe) ----------
export const resizeImage = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 640;

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
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.5));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const compressBase64 = async (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 640;
      let width = img.width;
      let height = img.height;

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
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.5));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

// ---------- HTTP helper ----------
async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

// ---------- Gemini calls (server-side via /api) ----------
export const analyzeWardrobeImage = (base64Image: string): Promise<WardrobeAnalysisResult> => {
  return postJSON<WardrobeAnalysisResult>("/api/analyze-wardrobe", { base64Image });
};

export const isolateClothingItem = async (originalBase64: string, itemName: string): Promise<string> => {
  const { image } = await postJSON<{ image: string }>("/api/isolate-item", { originalBase64, itemName });
  return await compressBase64(image);
};

export const generateVirtualTryOn = async (
  modelBase64: string,
  clothingItems: ClothingItem[],
  vibe: string
): Promise<string> => {
  const { image } = await postJSON<{ image: string }>("/api/try-on", { modelBase64, clothingItems, vibe });
  return image;
};

export const suggestOutfit = (
  wardrobe: ClothingItem[],
  prompt: string
): Promise<{ itemIds: string[]; vibe: string; reasoning: string }> => {
  return postJSON<{ itemIds: string[]; vibe: string; reasoning: string }>("/api/suggest-outfit", { wardrobe, prompt });
};

export const suggestShoppingAdditions = async (wardrobe: ClothingItem[]): Promise<ShoppingSuggestion[]> => {
  const data = await postJSON<{ suggestions: ShoppingSuggestion[] }>("/api/shopping-suggestions", { wardrobe });
  return data.suggestions ?? [];
};
