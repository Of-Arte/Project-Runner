import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

export const generateSlogans = async (): Promise<string[]> => {
  try {
    const prompt = `Generate 5 short, direct corporate slogans for V-Corp's performance ticker.
    Context: 2026 AI-driven startup. Humans are biological assets. Game encourages score optimization.
    Themes: Performance metrics, asset depreciation, competitive survival, neural preservation, velocity optimization, output maximization.
    Tone: Corporate directive. Motivational threat. Startup efficiency culture.
    Examples: "OPTIMIZE THE RUN. MID-TIER ASSETS WILL BE DECOMMISSIONED." / "VELOCITY = VALUE. ACCELERATE OR DEPRECIATE."
    Format: Just the slogans, separated by newlines.`;
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
       config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
       }
    });
    
    const text = response.text;
    if (!text) return ["Biology is Error.", "Submit to the Algorithm.", "Upgrade your flesh.", "Sleep is theft."];
    return JSON.parse(text) as string[];

  } catch (e) {
    return [
      "Flesh is Weak. Code is Forever.",
      "Your Biological Clock is Ticking.",
      "Optimize Your Neural Output.",
      "The AI Knows Best.",
      "Asset Deprecation Imminent."
    ];
  }
};

export const generatePsychologicalTriggers = async (): Promise<string[]> => {
  try {
    const prompt = `Generate 10 single-word psychological triggers or short commands for a dystopian conditioning program. 
    Examples: OBEY, YIELD, FAIL, SLEEP, CONSUME, SUBMIT, WATCHING. 
    Words should be aggressive and unsettling.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return ["OBEY", "SUBMIT", "CONSUME", "SLEEP", "WATCHING", "FAIL", "YIELD"];
    return JSON.parse(text) as string[];
  } catch (e) {
    return ["OBEY", "SUBMIT", "CONSUME", "SLEEP", "WATCHING", "FAIL", "YIELD"];
  }
};
