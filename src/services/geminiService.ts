
import type { GenerateContentResponse } from "@google/genai/web";
import { ArticleSummary } from '../types';

type GenAiModule = typeof import("@google/genai/web");

let genAiModule: GenAiModule | null = null;
let aiClient: InstanceType<GenAiModule["GoogleGenAI"]> | null = null;

// Safety check for process.env to prevent ReferenceErrors in some local environments
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

export const generatePersonalizedNewsletter = async (
  topics: string[], 
  keywords: string[]
): Promise<{ message: string; articles: ArticleSummary[]; sources: any[] }> => {
  const prompt = `Generate a personalized newsletter preview for a user interested in these topics: ${topics.join(', ')} and keywords: ${keywords.join(', ')}.
  Act as a research assistant. Provide 3-4 distinct article summaries based on recent industry or academic trends. 
  Include a short personalized opening message.
  
  Each article summary MUST include:
  - Title
  - A 2-sentence summary
  - 3 Key bullet points
  - A relevance score from 0-100
  - 3 associated tags
  - A mock source name (e.g., "Nature Journal", "TechCrunch", "arXiv")`;

  try {
    const client = await getClient();
    if (!client) {
      return {
        message: "Unable to generate live insights at this moment.",
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
    console.error("Gemini Service Error:", error);
    return {
      message: "Unable to generate live insights at this moment.",
      articles: [],
      sources: []
    };
  }
};

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
              responseMimeType: 'application/json',
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
