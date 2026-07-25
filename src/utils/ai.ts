import { GoogleGenAI } from "@google/genai";
import { api } from "./api";

export async function getAIInstance(token: string) {
  try {
    let settings: any[] = [];
    try {
      settings = await api.get('/api/admin/settings', token);
    } catch (e) {
      console.warn('Could not fetch AI settings from server, falling back to environment variables.');
    }
    
    const customKey = settings.find((s: any) => s.key === 'AI_API_KEY')?.value;
    const customModel = settings.find((s: any) => s.key === 'AI_MODEL')?.value;
    
    // Fallbacks for client-side environments (Vite) and Node environments
    const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
    const processKey = typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : undefined;
    
    const apiKey = customKey || viteKey || processKey;
    const model = customModel || 'gemini-2.5-flash';
    
    if (!apiKey) {
       console.error("Gemini API key is missing. Ensure VITE_GEMINI_API_KEY is set in your Netlify environment variables, or configured in the app's Admin Settings.");
       throw new Error("Missing Gemini API Key configuration.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    return { ai, model };
  } catch (err) {
    console.error('Failed to load AI settings:', err);
    throw err;
  }
}
