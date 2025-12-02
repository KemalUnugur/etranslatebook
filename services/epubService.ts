import { ProcessingState, ProcessStatus, EpubAnalysisResult } from "../types";
import { translateHtmlChunk, detectLanguage } from "./geminiService";

// Helper to get JSZip from window
const getJSZip = () => {
  if (!window.JSZip) {
    throw new Error("JSZip kütüphanesi yüklenemedi");
  }
  return new window.JSZip();
};

// Helper to parse structure
const getEpubStructure = async (zip: any) => {
  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  if (!containerXml) throw new Error("Geçersiz EPUB: META-INF/container.xml bulunamadı");

  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!opfPathMatch) throw new Error("Geçersiz EPUB: OPF yolu bulunamadı");
  
  const opfPath = opfPathMatch[1];
  const opfContent = await zip.file(opfPath)?.async("string");
  if (!opfContent) throw new Error("Geçersiz EPUB: OPF dosyası eksik");

  const parser = new DOMParser();
  const opfDoc = parser.parseFromString(opfContent, "application/xml");
  
  const manifestItems = Array.from(opfDoc.getElementsByTagName("item"));
  const manifestMap = new Map<string, string>();
  manifestItems.forEach((item: any) => {
    manifestMap.set(item.getAttribute("id") || "", item.getAttribute("href") || "");
  });

  const spineItems = Array.from(opfDoc.getElementsByTagName("itemref"));
  const spineIds = spineItems.map((item: any) => item.getAttribute("idref"));

  const filesToTranslate: { path: string; id: string }[] = [];
  const opfDir = opfPath.includes("/") ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1) : "";

  spineIds.forEach((id: any) => {
    if (id && manifestMap.has(id)) {
      const href = manifestMap.get(id);
      if (href && (href.endsWith(".html") || href.endsWith(".xhtml") || href.endsWith(".htm"))) {
        filesToTranslate.push({
          path: opfDir + href,
          id: id
        });
      }
    }
  });

  return { opfPath, opfDoc, filesToTranslate };
};

/**
 * PHASE 1: Analyze the EPUB to detect language and count chapters.
 */
export const analyzeEpub = async (
  fileData: ArrayBuffer
): Promise<EpubAnalysisResult> => {
  const zip = getJSZip();
  const loadedZip = await zip.loadAsync(fileData);
  const { filesToTranslate } = await getEpubStructure(loadedZip);

  let sourceLang = "Bilinmiyor";
  let previewText = "";

  // Sample the first substantial chapter
  if (filesToTranslate.length > 0) {
    // Try first few files to find one with text
    for (let i = 0; i < Math.min(3, filesToTranslate.length); i++) {
      const content = await loadedZip.file(filesToTranslate[i].path)?.async("string");
      if (content) {
        const cleanText = content.replace(/<[^>]*>/g, ' ').trim();
        if (cleanText.length > 50) {
          sourceLang = await detectLanguage(cleanText.substring(0, 500));
          // Store a larger preview text to help the translator understand the style later
          previewText = cleanText.substring(0, 1000); 
          break;
        }
      }
    }
  }

  return {
    sourceLang,
    chapterCount: filesToTranslate.length,
    previewText
  };
};

/**
 * PHASE 2: Perform the translation.
 */
export const translateEpub = async (
  fileData: ArrayBuffer,
  sourceLang: string,
  targetLanguage: string,
  isEducationMode: boolean,
  updateStatus: (state: Partial<ProcessingState>) => void,
  analysisPreviewText: string = "" // New parameter for context
): Promise<Blob> => {
  const zip = getJSZip();
  const loadedZip = await zip.loadAsync(fileData);
  const { opfPath, opfDoc, filesToTranslate } = await getEpubStructure(loadedZip);

  updateStatus({ 
    status: ProcessStatus.TRANSLATING, 
    totalChapters: filesToTranslate.length,
    message: `${sourceLang} dilinden ${targetLanguage} diline ${isEducationMode ? '(Eğitim Modu)' : ''} edebi çeviri başlıyor...`
  });

  // Construct a Context String based on the analysis
  // This tells the AI: "This is the style of the book you are translating"
  const bookContext = `
    This is a book written in ${sourceLang}. 
    Here is a sample of the original writing style and tone: 
    "${analysisPreviewText.substring(0, 300)}..."
    Maintain this tone (formal, casual, archaic, etc.) in the translation.
  `;

  // Translation Loop
  for (let i = 0; i < filesToTranslate.length; i++) {
    const fileInfo = filesToTranslate[i];
    const currentFileContent = await loadedZip.file(fileInfo.path)?.async("string");

    if (!currentFileContent) continue;

    const textContent = currentFileContent.replace(/<[^>]*>/g, '').trim();
    if (textContent.length < 10) {
        continue; 
    }

    updateStatus({
      currentChapter: i + 1,
      progress: Math.round(((i) / filesToTranslate.length) * 100),
      message: `Bölüm ${i + 1} / ${filesToTranslate.length} işleniyor... (Anlam analizi ve çeviri)`
    });
    
    // Translate
    const translatedHtml = await translateHtmlChunk(
      currentFileContent, 
      targetLanguage, 
      bookContext,
      isEducationMode
    );
    
    // Update ZIP
    loadedZip.file(fileInfo.path, translatedHtml);

    // RATE LIMITING PROTECTION FOR FREE TIER
    // Gemini Free tier has a Rate Limit (RPM). To prevent errors, we add a small delay.
    if (i < filesToTranslate.length - 1) {
      updateStatus({
        message: `API limitlerini aşmamak için optimize ediliyor... (${i + 1}/${filesToTranslate.length})`
      });
      await new Promise(resolve => setTimeout(resolve, 3000)); // Increased delay slightly for safety with complex prompts
    }
  }

  // Update Metadata Language
  const metadataLang = opfDoc.getElementsByTagName("dc:language")[0];
  if (metadataLang) {
    metadataLang.textContent = targetLanguage;
    const serializer = new XMLSerializer();
    const newOpfContent = serializer.serializeToString(opfDoc);
    loadedZip.file(opfPath, newOpfContent);
  }

  updateStatus({
    status: ProcessStatus.COMPLETED,
    progress: 100,
    message: "Çeviri tamamlandı! Kitap yeniden oluşturuluyor..."
  });

  return await loadedZip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
};