export interface EpubFile {
  name: string;
  data: ArrayBuffer;
}

export interface EpubAnalysisResult {
  sourceLang: string;
  chapterCount: number;
  previewText: string;
}

export enum ProcessStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  READY_TO_TRANSLATE = 'READY_TO_TRANSLATE', // New state for confirmation
  TRANSLATING = 'TRANSLATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ProcessingState {
  status: ProcessStatus;
  currentChapter: number;
  totalChapters: number;
  progress: number; // 0 to 100
  message: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
}

export type UserRole = 'ADMIN' | 'USER';

export interface ActivityLog {
  id: number;
  timestamp: string;
  userEmail: string;
  action: 'LOGIN' | 'TRANSLATE_START' | 'TRANSLATE_COMPLETE' | 'FEEDBACK';
  details: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'İngilizce' },
  { code: 'es', name: 'İspanyolca' },
  { code: 'fr', name: 'Fransızca' },
  { code: 'de', name: 'Almanca' },
  { code: 'it', name: 'İtalyanca' },
  { code: 'pt', name: 'Portekizce' },
  { code: 'ru', name: 'Rusça' },
  { code: 'ja', name: 'Japonca' },
  { code: 'ko', name: 'Korece' },
  { code: 'zh', name: 'Çince' },
  { code: 'ar', name: 'Arapça' },
];

// Declaration for the global JSZip library loaded via CDN
declare global {
  interface Window {
    JSZip: any;
  }
}