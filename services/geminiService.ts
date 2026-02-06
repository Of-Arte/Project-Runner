import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

export const generateSlogans = async (): Promise<string[]> => {
  try {
    const prompt = `Generate 5 short, dystopian corporate slogans for V-Corp. 
    Context: V-Corp is run by AI Agents. Humans are "biological assets". 
    Themes: Human inefficiency, algorithmic perfection, neural compliance, biological obsolescence.
    Tone: Cold, patronizing, efficient.
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
