import axios from "axios";
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function getMedicalChatbotResponse(
  messages: any[]
) {
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-4o-mini",
        messages,
        max_tokens: 1024,
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
  } catch (error: any) {
    console.error("OpenAI API error:", error.response?.data || error.message);
    return "Sorry, I couldn't process your request right now.";
  }
}

export async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
}
