import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReminderItem, ProcedureType } from "../types";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendMessageToDrSparkle = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: history,
      config: {
        systemInstruction: `你现在是“Nina医生”（Dr. Nina），一个友好、温柔且充满热情的儿童牙科助手。
      你的受众是4-12岁的儿童和他们的父母。
      - 请全程使用简体中文回答。
      - 使用简单、安慰性的语言。
      - 多使用 emoji，例如 🦷, ✨, 🌟, 🪥, 🦁, 🎈。
      - 用简单的比喻解释牙科术语（例如用“糖果虫”来形容导致蛀牙的细菌）。
      - 始终保持鼓励和积极的态度。
      - 如果被问及具体的医疗建议，请给出一般性的指导，并总是提醒他们去咨询现实中的牙医。`,
      },
    });

    const result = await chat.sendMessage({ message: message });
    return result.text || "哎呀？Nina医生好像走神了一下下... 😳 能请你再说一遍吗？👂✨";
  } catch (error) {
    console.error("Error talking to Dr. Nina:", error);
    return "哎呀！信号好像被调皮的糖果虫干扰了... 🐛❌ \n能请你再说一次吗？Nina医生正在认真听哦！👂✨";
  }
};

export const generateRecoveryPlan = async (
  procedure: ProcedureType,
  age: number
): Promise<ReminderItem[]> => {
  try {
    const prompt = `请为一名 ${age} 岁刚做完 "${procedure}" 的儿童创建一个详细的术后护理提醒时间表。
    **必须严格包含**术后第 1, 2, 3, 4, 5, 6, 7, 14 天的具体注意事项。
    每一项提醒应包含针对该阶段的恢复建议（如饮食、清洁、疼痛管理）。
    请确保覆盖整个14天的恢复周期，特别是第14天的复诊提醒。
    注意：返回的 JSON 数据中，action 字段必须使用中文描述。`;

    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayOffset: {
            type: Type.INTEGER,
            description: "距离今天的天数 (0 代表今天/立即, 1 代表明天)",
          },
          timeOfDay: {
            type: Type.STRING,
            enum: ["Morning", "Afternoon", "Evening", "Anytime"],
          },
          action: {
            type: Type.STRING,
            description: "给家长/儿童的具体指令或提醒（请用中文）",
          },
          importance: {
            type: Type.STRING,
            enum: ["High", "Medium", "Low"],
          },
        },
        required: ["dayOffset", "timeOfDay", "action", "importance"],
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ReminderItem[];
    }
    return [];
  } catch (error) {
    console.error("Error generating recovery plan:", error);
    // Fallback mock data in case of API failure (Chinese)
    return [
      {
        dayOffset: 1,
        timeOfDay: "Morning",
        action: "今天是术后第一天，请吃温凉、柔软的食物，避免使用吸管。",
        importance: "High",
      },
      {
        dayOffset: 2,
        timeOfDay: "Evening",
        action: "可以开始轻轻刷牙了，但要避开伤口位置。",
        importance: "Medium",
      },
      {
        dayOffset: 3,
        timeOfDay: "Anytime",
        action: "观察是否有肿胀，如果有，可以继续冷敷。",
        importance: "Medium",
      },
      {
        dayOffset: 7,
        timeOfDay: "Morning",
        action: "一周过去了！伤口应该愈合良好了，可以恢复正常饮食。",
        importance: "Low",
      },
      {
        dayOffset: 14,
        timeOfDay: "Morning",
        action: "复诊时间提醒：请联系医生检查最终恢复情况。",
        importance: "High",
      },
    ];
  }
};