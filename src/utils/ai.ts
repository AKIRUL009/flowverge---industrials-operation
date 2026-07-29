import { api } from "./api";

export async function getAIInstance(token: string) {
  // Returns a mock interface that forwards requests to our backend
  return {
    ai: {
      models: {
        generateContent: async (params: { model: string, contents: any }) => {
          const response = await api.post('/api/ai/generateContent', params, token);
          if (response.error) {
            throw new Error(response.error);
          }
          return { text: response.text };
        }
      }
    },
    model: 'gemini-3.6-flash' // Model choice is handled by backend fallback anyway
  };
}
