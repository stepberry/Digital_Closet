
export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string; // Hex code
  colorName: string;
  pattern: string;
  style: string;
  vibe: string;
  originalImage: string; // Base64
  isolatedImage?: string; // Base64 (generated)
  dateAdded: string;
}

export interface Outfit {
  id: string;
  items: ClothingItem[];
  vibe: string;
  generatedImage?: string; // Base64 result of try-on
}

export interface ShoppingSuggestion {
  itemName: string;
  reason: string;
  category: string;
  color: string;
  style: string;
}

export interface ModelSettings {
  gender: 'Female' | 'Male' | 'Non-Binary' | 'Mannequin';
  race: string;
  hair: string;
}

export type AppMode = 'wardrobe' | 'outfit' | 'try-on';

export interface WardrobeAnalysisResult {
  items: Array<{
    name: string;
    category: string;
    color: string;
    colorName: string;
    pattern: string;
    style: string;
    vibe: string;
  }>;
}
