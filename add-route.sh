sed -i '/\/\/ --- VITE MIDDLEWARE ---/i \
// --- AI PROXY ROUTE ---\
app.post("/api/ai/generateContent", authenticate, async (req, res) => {\
  try {\
    const { model, contents } = req.body;\
    const settings = db.prepare("SELECT key, value FROM settings WHERE key IN (?, ?)").all("AI_API_KEY", "AI_MODEL");\
    const customKey = settings.find((s) => s.key === "AI_API_KEY")?.value;\
    const customModel = settings.find((s) => s.key === "AI_MODEL")?.value;\
\
    const apiKey = customKey || process.env.GEMINI_API_KEY;\
\
    if (!apiKey) {\
      return res.status(500).json({ error: "Missing Gemini API Key configuration. Please configure it in the app Admin Settings." });\
    }\
\
    const ai = new GoogleGenAI({ apiKey });\
    let resolvedModel = model || customModel || "gemini-2.5-flash";\
    if (!resolvedModel || resolvedModel.includes("3.6") || resolvedModel.includes("2.0") || resolvedModel.includes("preview")) {\
        resolvedModel = "gemini-2.5-flash";\
    }\
\
    const response = await ai.models.generateContent({\
      model: resolvedModel,\
      contents: contents\
    });\
\
    res.json({ text: response.text });\
  } catch (error) {\
    console.error("AI Generation Error:", error);\
    res.status(500).json({ error: "Failed to generate AI content", details: error.message });\
  }\
});\
' server.ts
