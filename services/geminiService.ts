
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
    prompt = `
      You are an elite literary translator and editor. Your task is to rewrite the following book content into ${targetLanguage}.
      
      ### CRITICAL GOAL: NATURALNESS & MEANING
      The result must NOT look like a translation. It must read as if it was originally written in ${targetLanguage} by a skilled author.
      **Preserve the meaning, lose the sentence structure.**

      ### BOOK CONTEXT & STYLE
      ${contextInfo}

      ### STRICT TRANSLATION RULES
      1. **Reconstruct, Don't Translate**: 
         - Do NOT translate sentence-by-sentence linearly if it hurts the flow.
         - Read the whole paragraph, understand the *intent* and *emotion*, then express that in ${targetLanguage} using natural phrasing.
         - **For English to Turkish:** You MUST abandon English SVO (Subject-Verb-Object) order. Use proper Turkish SOV order. Use "Devrik Cümle" only for poetic emphasis.

      2. **Idioms & Phrasal Verbs**:
         - Detect idioms (e.g., "break a leg", "cold feet"). Translate their *meaning*, not their words. Use equivalent local idioms.
         - If a direct translation sounds awkward, rewrite it completely to convey the same feeling.

      3. **Vocabulary Selection**:
         - Avoid repetitive or simple words (e.g., instead of just "said", use "whispered", "declared", "muttered" equivalents if context implies).
         - Use rich, descriptive vocabulary appropriate for the genre (Istanbul Turkish for TR).

      4. **HTML & Formatting Handling**:
         - **ABSOLUTE RULE**: You strictly preserve the HTML tags (<p>, <b>, <i>, <span>, etc.).
         - Do NOT translate class names, IDs, or URLs.
         - Only translate the *visible text* inside the tags.
         - If splitting a long sentence improves readability in ${targetLanguage}, you may split the text *inside* the same paragraph tag.

      ### EXAMPLE (English -> Turkish)
      *Input:* "He felt blue because it was raining cats and dogs."
      *Bad Output:* "O mavi hissetti çünkü kedi ve köpek yağıyordu."
      *Good Output:* "Bardaktan boşalırcasına yağan yağmur, içine derin bir hüzün çökertmişti."

      ### INPUT HTML CHUNK TO PROCESS
      ${htmlContent}
    `;
  }

  try {
    const response: GenerateContentResponse = await aiClient.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        // High temperature allows for creative sentence restructuring (crucial for literary translation)
        temperature: 0.9, 
        // Max Thinking Budget allows the model to "draft" the sentence structure in its head before outputting.
        thinkingConfig: { thinkingBudget: 4096 } 
      }
    });

    let resultText = response.text || "";

    // Cleanup: Remove markdown code blocks if the model accidentally adds them
    resultText = resultText.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');

    return resultText;
  } catch (error) {
    // Silent fail
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
