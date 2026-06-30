export type MediaType = "image" | "web_link";

export interface MediaItem {
  id: string;
  type: MediaType;
  name: string;
  payload: string; // Base64 string for images, or URL string for web links
  thumbnail?: string; // Optional thumbnail preview (data URI for images)
  addedAt: Date;
  customPrompt?: string;
  analysisResult?: string;
  isAnalyzing?: boolean;
  error?: string;
}

export interface AnalyzeRequest {
  type: MediaType;
  payload: string;
  prompt?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  result: string;
  meta?: {
    title?: string;
  };
  model?: string;
  error?: string;
  details?: string;
}
