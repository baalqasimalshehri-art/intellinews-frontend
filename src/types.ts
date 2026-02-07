
export enum DeliveryFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum ContentSource {
  ACADEMIC = 'academic',
  INDUSTRY = 'industry',
  FINANCIAL = 'financial',
  BOTH = 'both'
}

export interface UserPreferences {
  email: string;
  topics: string[];
  keywords: string[];
  frequency: DeliveryFrequency;
  source: ContentSource;
  deliveryTime: string;
  deliveryDay?: string;
  deliveryDate?: number;
  timezone?: string;
  summaryLength: 'concise' | 'detailed';
  duplicateFiltering: boolean;
}

export interface ArticleSummary {
  id: string | number;
  title: string;
  source: string;
  sourceType?: 'academic' | 'industry' | 'financial';
  summary: string;
  keyPoints: string[];
  tags: string[];
  url: string;
  content?: string;
  publishedDate?: string;
  // Backend AI-driven ranking scores
  relevanceScore: number;
  freshnessScore?: number;
  finalScore?: number;
  // AI-generated explanation for selection
  reasoning?: string;
}

export interface Newsletter {
  id: string;
  date: string;
  articles: ArticleSummary[];
  personalizedMessage: string;
}

export interface PipelineStats {
  scraped: number;
  summarized: number;
  delivered: number;
  activeUsers: number;
}
