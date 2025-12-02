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

  // We use Gemini 2.5 Flash. It allows 'thinkingConfig' which is crucial for
  // complex grammar transformations (like English -> Turkish) to preserve meaning.
  const modelId = "gemini-2.5-flash"; 

  let prompt = "";

  if (isEducationMode) {
    // --- EDUCATION MODE PROMPT (BILINGUAL) ---
    // Improved for better visual separation and clear semantic mapping.
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
         - Wrap the translated text in a <div> with the following inline style to make it look like a textbook note:
           \`<div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 8px 12px; margin-top: 6px; margin-bottom: 16px; border-radius: 0 8px 8px 0; color: #334155; font-size: 0.95em; font-family: sans-serif; line-height: 1.5;">TRANSLATION_HERE</div>\`
      
      4. **Translation Style (Education Focused)**:
         - The translation should be **clear and grammatically correct** in ${targetLanguage}.
         - It should help the student understand the sentence structure of the original text.
         - Do not be too poetic; be clear and direct, but avoid machine-like literal translations.
      
      ### INPUT HTML CHUNK
      ${htmlContent}
    `;
  } else {
    // --- STANDARD TRANSLATION PROMPT (HIGH QUALITY) ---
    // Refined for "Anlaşılırlık" (Clarity/Readability)
    prompt = `
      You are a professional literary translator known for producing texts that flow naturally and are easy to read. 
      Your task is to translate the following HTML content into ${targetLanguage}.

      ### TARGET LANGUAGE
      ${targetLanguage}

      ### CRITICAL RULES FOR QUALITY
      1. **Prioritize Readability (Anlaşılırlık)**: 
         - The result MUST sound like it was originally written in ${targetLanguage}. 
         - **Break Long Sentences**: If an English sentence is long and complex, split it into two or more shorter sentences in ${targetLanguage} to make it easier to understand. Do not force long clauses if they sound unnatural.
         - **No "Translationese"**: Avoid literal translations of idioms. Use the natural local equivalent (e.g., convert "piece of cake" to "çocuk oyuncağı" for Turkish).

      2. **Grammar & Logic**:
         - Adjust word order strictly according to ${targetLanguage} grammar.
         - Ensure subject-verb agreement and correct tense usage.

      3. **HTML Preservation**:
         - Return VALID HTML.
         - Keep all bold (<b>, <strong>), italic (<i>, <em>), and structural tags.
         - If you split a sentence that has a formatting tag, apply the tag logically to the corresponding words in the new sentences.

      4. **Tone**:
         - Maintain the tone of the original book (whether it's serious, funny, or academic).

      ### INPUT HTML CHUNK
      ${htmlContent}
    `;
  }

  try {
    const response: GenerateContentResponse = await aiClient.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        // High temperature for natural flow
        temperature: 0.7, 
        // Increased Thinking Budget to 4096 (Maximum reasoning for 2.5 Flash)
        // This is critical for quality: it allows the model to "draft" the sentence structure internally before outputting.
        thinkingConfig: { thinkingBudget: 4096 } 
      }
    });

    let resultText = response.text || "";

    // Cleanup: Remove markdown code blocks if the model accidentally adds them
    resultText = resultText.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');

    return resultText;
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    // On error, return original content to avoid breaking the book structure
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