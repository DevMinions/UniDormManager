
import { GoogleGenAI } from "@google/genai";

// Lazy initialization - only create AI instance when needed
let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    // Try to get API key from multiple sources
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY ||
                    localStorage.getItem('GEMINI_API_KEY') ||
                    '';

    if (!apiKey) {
      console.warn('Gemini API key not found. AI features will be disabled.');
      return null;
    }

    try {
      ai = new GoogleGenAI({ apiKey });
    } catch (error) {
      console.error('Failed to initialize Gemini:', error);
      return null;
    }
  }
  return ai;
};

export const generateDormResponse = async (
  prompt: string,
  contextData: string
): Promise<string> => {
  try {
    const client = getAI();

    if (!client) {
      return "AI功能未配置。请联系管理员设置API密钥，或使用系统的其他功能。";
    }

    // Basic Text Tasks: 'gemini-3-flash-preview'
    const model = 'gemini-3-flash-preview';
    const systemInstruction = `你是一个名为"UniDorm"的大学宿舍管理系统的智能助手。
    你的职责是帮助管理员和学生解决问题。

    当前上下文数据 (JSON):
    ${contextData}

    规则:
    1. 请始终使用中文回答，语气礼貌、专业且简洁。
    2. 如果被问及数据（如有多少房间已满），请使用提供的上下文数据回答。
    3. 如果被要求起草通知，请提供格式清晰、排版整洁的草稿。
    4. 如果被问及维修建议，请给出通用的维护提示。
    `;

    // Direct generation call as per latest coding guidelines
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      }
    });

    // Access the text property directly (not a method)
    return response.text || "抱歉，我无法生成回复。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，我现在无法连接服务，请稍后再试。";
  }
};
