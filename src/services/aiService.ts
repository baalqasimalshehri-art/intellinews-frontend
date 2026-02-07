
import type { GenerateContentResponse } from "@google/genai/web";
import { ArticleSummary } from '../types';

type GenAiModule = typeof import("@google/genai/web");

let genAiModule: GenAiModule | null = null;
let aiClient: InstanceType<GenAiModule["GoogleGenAI"]> | null = null;

const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    console.warn("API_KEY not found in process.env");
    return '';
  }
};

const loadGenAi = async () => {
  if (genAiModule) return genAiModule;
  // Prefer the explicit web build to avoid Node-only shims in the browser bundle.
  genAiModule = await import("@google/genai/web");
  return genAiModule;
};

const getClient = async () => {
  if (aiClient) return aiClient;
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    const { GoogleGenAI } = await loadGenAi();
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
  } catch (error) {
    console.error("Failed to initialize GenAI client:", error);
    return null;
  }
};

/**
 * Generates a personalized newsletter preview.
 * Reduced complexity for preview generation to improve onboarding speed.
 */
export const generatePersonalizedNewsletter = async (
  topics: string[], 
  keywords: string[]
): Promise<{ message: string; articles: ArticleSummary[]; sources: any[] }> => {
  const prompt = `Generate a personalized newsletter preview. 
  Target Topics: ${topics.slice(0, 3).join(', ')}. 
  Keywords: ${keywords.slice(0, 3).join(', ')}.
  Provide 3 article summaries with realistic data. 
  Prioritize recent 2025 trends. 
  Output MUST follow the schema.`;

  try {
    const client = await getClient();
    if (!client) {
      return {
        message: "Synthesis complete. Your dispatches will begin tomorrow.",
        articles: [],
        sources: []
      };
    }
    const { Type } = await loadGenAi();
    const response: GenerateContentResponse = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            articles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  source: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  url: { type: Type.STRING },
                  relevanceScore: { type: Type.NUMBER }
                },
                required: ['title', 'summary', 'keyPoints', 'relevanceScore']
              }
            }
          },
          required: ['message', 'articles']
        }
      }
    });

    const text = response.text || '{}';
    const rawJson = JSON.parse(text);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      message: rawJson.message || "Your daily intelligence is ready.",
      articles: (rawJson.articles || []).map((a: any, idx: number) => ({
        ...a,
        id: a.id || `art-${idx}`,
        url: a.url || '#'
      })),
      sources
    };
  } catch (error) {
    console.error("AI Service Error:", error);
    // Return empty results rather than hanging
    return {
      message: "Synthesis complete. Your dispatches will begin tomorrow.",
      articles: [],
      sources: []
    };
  }
};

/**
 * Classifies article text using a fast-flash model for efficiency.
 */
export const classifyArticle = async (text: string) => {
    try {
      const client = await getClient();
      if (!client) {
        return { topics: [], keywords: [], summary: "" };
      }
      const { Type } = await loadGenAi();
      const response: GenerateContentResponse = await client.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `Classify the following article text into relevant topics and keywords: \n\n${text}`,
          config: {
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      topics: { type: Type.ARRAY, items: { type: Type.STRING } },
                      keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                      summary: { type: Type.STRING }
                  }
              }
          }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return { topics: [], keywords: [], summary: "" };
    }
};
