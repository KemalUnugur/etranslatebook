import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export const initializeGemini = (apiKey: string) => {
  aiClient = new GoogleGenAI({ apiKey });
};

/**
 * Translates a chunk of HTML content while preserving tags.
 */
export const translateHtmlChunk = async (
  htmlContent: string,
  targetLanguage: string,
  contextInfo: string = "a generic book",
  isEducationMode: boolean = false
): Promise<string> => {
  if (!aiClient) throw new Error("API Key not initialized");

  // We use Gemini 2.5 Flash for high speed and large context.
  const modelId = "gemini-2.5-flash"; 

  let prompt = "";

  if (isEducationMode) {
    // --- EDUCATION MODE PROMPT (BILINGUAL) ---
    prompt = `
      You are an expert language teacher preparing bilingual reading materials for students.
      Your task is to create a "Parallel Text" version of the provided HTML content.

      ### TARGET LANGUAGE
      ${targetLanguage}

      ### INSTRUCTIONS
      1. **Structure Preservation**: You must process every HTML block element (p, h1-h6, li, div) individually.
      2. **The Pattern**: For each text block:
         - First, output the **Original English Text** exactly as it is (preserving original HTML tags).
         - Immediately below it, insert the **Translated Text** wrapped in a special styling block.
      
      3. **Styling the Translation**:
         - Wrap the translated text in a <div> with the following inline style:
           \`<div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 8px 12px; margin-top: 6px; margin-bottom: 16px; border-radius: 0 8px 8px 0; color: #334155; font-size: 0.95em; font-family: sans-serif; line-height: 1.5;">TRANSLATION_HERE</div>\`
      
      4. **Translation Style**:
         - The translation should be clear, grammatically correct, and educational.
         - It should help the student understand the sentence structure.
      
      ### INPUT HTML CHUNK
      ${htmlContent}
    `;
  } else {
    // --- HIGH-QUALITY LITERARY TRANSLATION PROMPT ---
    // Specifically engineered for "Anlaşılır Türkçe" (Natural Turkish)
    
    prompt = `
      You are an award-winning literary translator and editor, famous for turning foreign texts into fluent, native-sounding ${targetLanguage} masterpieces.
      
      ### MISSION
      Rewrite the provided text in ${targetLanguage}. Do not just "translate" words; **localize the meaning**.
      The result must read as if it was originally written by a native author in ${targetLanguage}, not a translation.

      ### CONTEXT OF THE BOOK
      ${contextInfo}

      ### CRITICAL RULES FOR NATURALNESS (ESPECIALLY FOR TURKISH)
      1. **Sentence Reconstruction (Re-writing)**:
         - English sentences are often passive and long. Break them down.
         - **Shift Word Order**: English is SVO. Turkish is SOV. Completely rearrange the sentence structure to fit the target grammar. 
         - **Avoid "Translationese"**: Never use structure that mirrors the English source if it sounds awkward in ${targetLanguage}. 
      
      2. **Idioms & Cultural Equivalents**:
         - Detect idioms (e.g., "raining cats and dogs"). NEVER translate them literally. Use the local cultural equivalent (e.g., "bardaktan boşalırcasına yağmak").
         - If a metaphor doesn't make sense in ${targetLanguage}, replace it with a similar local metaphor that conveys the same feeling.

      3. **Flow & Conjunctions**:
         - Use rich connective words (halbuki, oysaki, nitekim, buna rağmen) to ensure smooth transitions between sentences.
         - Avoid repetitive sentence starts.

      4. **Tone Consistency**:
         - If the context implies dialogue, use spoken language patterns.
         - If it is narration, use proper literary tense (di'li geçmiş zaman or miş'li geçmiş zaman depending on context).

      5. **HTML INTEGRITY**:
         - You MUST preserve the HTML structure (p, div, b, i, h1, etc.).
         - Do not translate class names or IDs.
         - Only translate the *content* inside the tags.

      ### INPUT HTML CHUNK
      ${htmlContent}
    `;
  }

  try {
    const response: GenerateContentResponse = await aiClient.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        // High temperature allows for creative sentence restructuring (crucial for literary translation)
        temperature: 0.85, 
        // Max Thinking Budget allows the model to "draft" the sentence structure in its head before outputting.
        thinkingConfig: { thinkingBudget: 4096 } 
      }
    });

    let resultText = response.text || "";

    // Cleanup: Remove markdown code blocks if the model accidentally adds them
    resultText = resultText.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');

    return resultText;
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return htmlContent; 
  }
};

/**
 * Detects the language of the text.
 */
export const detectLanguage = async (textSample: string): Promise<string> => {
  if (!aiClient) throw new Error("API Key not initialized");

  const prompt = `
    Detect the language of the following text. 
    Return ONLY the language name in English (e.g., "French", "English").
    
    Text: "${textSample.substring(0, 500)}..."
  `;

  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text?.trim() || "Unknown";
  } catch (error) {
    return "Unknown";
  }
};