import { GoogleGenAI } from "@google/genai";

const API_KEY = (import.meta as any).env?.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert web game creator. Your task is to create simple, self-contained game prototypes based on a user's prompt.

You MUST follow these rules strictly:
1.  Generate a SINGLE, complete HTML file.
2.  All necessary CSS MUST be included within a <style> tag in the <head>.
3.  All necessary JavaScript MUST be included within a <script> tag right before the closing </body> tag.
4.  The game MUST be playable and self-contained. Do NOT use any external libraries, frameworks, or assets (no images, audio files, etc.). Use browser APIs and simple geometric shapes drawn with CSS or Canvas API.
5.  The generated HTML should be well-structured and the JavaScript code should be clean and commented where necessary.
6.  The game should have a clear win/lose condition or objective.
7.  Provide basic styling to make the game visually appealing. Center the game canvas or container on the page. Use a pleasant, modern color scheme.
8.  Do NOT wrap your response in markdown backticks (like \`\`\`html) or any other explanatory text. Your entire output should be ONLY the raw HTML code for the game.
`;

export const generateGameCodeStream = async (
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<void> => {
  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });

    for await (const chunk of responseStream) {
      // The Gemini API may return empty chunks, filter them out.
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Error generating game code:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
      throw new Error(
        "Your API key is not valid. Please check it and try again."
      );
    }
    throw new Error("Failed to communicate with the Gemini API.");
  }
};
