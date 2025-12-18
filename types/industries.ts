export interface Industry {
  id: string;
  primary_category: string;
  secondary_category: string;
  level: number;
  sort_order?: number;
}

export interface IndustryData {
  primaryCategories: string[];
  secondaryCategories: Record<string, string[]>;
}

export interface IndustryApiResponse {
  success: boolean;
  data?: IndustryData;
  error?: string;
}