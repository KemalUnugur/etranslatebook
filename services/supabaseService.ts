import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ActivityLog } from '../types';

// Supabase Configuration
// Proje ID'nizden oluşturulan URL:
const SUPABASE_URL = 'https://heuhphfzgobzauqpgzrx.supabase.co';

// Ekran görüntüsünden alınan Publishable Key:
const SUPABASE_ANON_KEY = 'sb_publishable_eqAWTOIqq-kx3N_U8PjKwg_o3lHZAsZ'; 

let supabase: SupabaseClient | null = null;

export const initializeSupabase = () => {
  // Key girildiginde otomatik baslatir
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log("Supabase bağlantısı başlatıldı.");
    } catch (e) {
      console.error("Supabase init failed", e);
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
      await supabase.from('logs').insert([newLog]);
      return;
    } catch (error) {
      console.error("Supabase log error:", error);
    }
  }

  // 2. Fallback to LocalStorage (Offline)
  // Note: Local logs are NOT visible to Admin on other devices
  const existingLogsStr = localStorage.getItem('app_activity_logs');
  const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
  const localLog = { ...newLog, id: Date.now() };
  localStorage.setItem('app_activity_logs', JSON.stringify([localLog, ...existingLogs].slice(0, 100)));
};

export const fetchLogs = async (): Promise<ActivityLog[]> => {
  // 1. Try fetching from Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
        
      if (!error && data) {
        return data.map((item: any) => ({
          id: item.id,
          timestamp: item.timestamp,
          userEmail: item.user_email,
          action: item.action,
          details: item.details
        }));
      }
    } catch (error) {
      console.error("Supabase fetch error:", error);
    }
  }

  // 2. Fallback to LocalStorage
  const logs = localStorage.getItem('app_activity_logs');
  return logs ? JSON.parse(logs) : [];
};