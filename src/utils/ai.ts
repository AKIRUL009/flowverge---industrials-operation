import { GoogleGenAI } from "@google/genai";
import { api } from "./api";

export async function getAIInstance(token: string) {
  try {
    const settings = await api.get('/api/admin/settings', token);
    const customKey = settings.find((s: any) => s.key === 'AI_API_KEY')?.value;
    const customModel = settings.find((s: any) => s.key === 'AI_MODEL')?.value;
    
    const apiKey = customKey || process.env.GEMINI_API_KEY!;
    const model = customModel || 'gemini-3-flash-preview';
    
    const ai = new GoogleGenAI({ apiKey });
    return { ai, model };
  } catch (err) {
    console.error('Failed to load AI settings, using defaults:', err);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    return { ai, model: 'gemini-3-flash-preview' };
  }
}
