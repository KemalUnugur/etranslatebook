import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ActivityLog } from '../types';

// Supabase Configuration
const SUPABASE_URL = 'https://heuhphfzgobzauqpgzrx.supabase.co';

// UPDATED: Reverting to the LEGACY ANON KEY.
// We also disable session persistence to prevent browser caching issues (401 errors).
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhldWhwaGZ6Z29iemF1cXBnenJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTk2NDMsImV4cCI6MjA4MDI3NTY0M30.M0-p2VwEnn4tT9dNYAowHMX569YHyhUToy1_79J2CPA';

let supabase: SupabaseClient | null = null;

export const initializeSupabase = () => {
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      // auth: { persistSession: false } is CRITICAL here.
      // It forces the client to use the API Key for every request instead of looking for old/invalid user tokens.
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });
      console.log("Supabase bağlantısı (Stateless) sağlandı.");
    } catch (e) {
      console.error("Supabase başlatma hatası:", e);
    }
  }
};

export const submitLog = async (userEmail: string, action: ActivityLog['action'], details: string) => {
  const newLog = {
    user_email: userEmail,
    action,
    details,
    timestamp: new Date().toISOString()
  };

  // 1. Try sending to Supabase (Cloud)
  if (supabase) {
    try {
      const { error } = await supabase.from('logs').insert([newLog]);
      
      if (error) {
        console.error("Supabase Insert Hatası Detayı:", error.message, error.details);
        throw error;
      }
      return; 
    } catch (error) {
      // Silent fail to console to not block user flow
      console.error("Supabase Log yazılamadı (Yedek sistem kullanılacak).");
    }
  }

  // 2. Fallback to LocalStorage
  try {
    const existingLogsStr = localStorage.getItem('app_activity_logs');
    const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
    const localLog = { ...newLog, id: Date.now() };
    const updatedLogs = [localLog, ...existingLogs].slice(0, 100);
    localStorage.setItem('app_activity_logs', JSON.stringify(updatedLogs));
  } catch (e) {
    console.error("LocalStorage hatası:", e);
  }
};

export const fetchLogs = async (): Promise<ActivityLog[]> => {
  let cloudLogs: ActivityLog[] = [];
  
  // 1. Try fetching from Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
        
      if (error) {
         console.error("Supabase Fetch Hatası:", error.message);
         throw error;
      }
      
      if (data) {
        cloudLogs = data.map((item: any) => ({
          id: item.id,
          timestamp: item.timestamp,
          userEmail: item.user_email,
          action: item.action,
          details: item.details
        }));
      }
    } catch (error) {
      console.error("Loglar çekilemedi (Supabase).");
    }
  }

  // 2. Fetch LocalStorage
  let localLogs: ActivityLog[] = [];
  try {
    const logsStr = localStorage.getItem('app_activity_logs');
    localLogs = logsStr ? JSON.parse(logsStr) : [];
  } catch (e) {
    console.error("LocalStorage okuma hatası:", e);
  }

  return cloudLogs.length > 0 ? cloudLogs : localLogs;
};