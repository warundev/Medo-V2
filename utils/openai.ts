import axios from "axios";
import Constants from 'expo-constants';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function getMedicalChatbotResponse(messages: { role: string; content: string }[]) {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4o-mini",
        messages,
        max_tokens: 256,
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI API error:", error);
    return "Sorry, I couldn't process your request right now.";
  }
}
