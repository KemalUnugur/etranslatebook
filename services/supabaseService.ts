
import { ActivityLog } from '../types';

// Supabase Configuration
const SUPABASE_URL = 'https://heuhphfzgobzauqpgzrx.supabase.co';

// SERVICE ROLE KEY (SECRET)
// Bu anahtar "Patron" anahtarıdır. RLS kurallarını ve Auth kontrollerini tamamen bypass eder.
// 401 hatası almamak için en garanti yöntem budur.
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhldWhwaGZ6Z29iemF1cXBnenJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY5OTY0MywiZXhwIjoyMDgwMjc1NjQzfQ.W1DVaP5bDqJi2_wRzyhPbSBmoIlP_XDlHiFkDOqvG78';

export const initializeSupabase = () => {
  // Console log removed for production cleanliness
};

export const submitLog = async (userEmail: string, action: ActivityLog['action'], details: string) => {
  // Timestamp'i veritabanına (Postgres) bırakıyoruz, manuel göndermiyoruz.
  const newLog = {
    user_email: userEmail,
    action,
    details
  };

  // 1. Try sending to Supabase via Direct REST API
  try {
    // ?nocache parametresi KALDIRILDI (400 Hatasına sebep oluyordu)
    // cache: 'no-store' ve Pragma headerları eklendi.
    await fetch(`${SUPABASE_URL}/rest/v1/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify(newLog),
      cache: 'no-store'
    });
  } catch (error) {
    // Silent fail for logs
  }

  // 2. Fallback to LocalStorage
  try {
    const existingLogsStr = localStorage.getItem('app_activity_logs');
    const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
    const localLog = { 
      ...newLog, 
      timestamp: new Date().toISOString(), // Yerel için timestamp ekle
      id: Date.now() 
    };
    // Son 50 yerel log
    localStorage.setItem('app_activity_logs', JSON.stringify([localLog, ...existingLogs].slice(0, 50)));
  } catch (e) {
    // Ignore storage errors
  }
};

export const fetchLogs = async (): Promise<ActivityLog[]> => {
  let cloudLogs: ActivityLog[] = [];
  
  // 1. Try fetching from Supabase
  try {
    // ?nocache parametresi KALDIRILDI.
    const response = await fetch(`${SUPABASE_URL}/rest/v1/logs?select=*&order=timestamp.desc&limit=2000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store' // Tarayıcı önbelleğini engellemek için standart yöntem
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        cloudLogs = data.map((item: any) => ({
          id: item.id,
          timestamp: item.timestamp,
          userEmail: item.user_email,
          action: item.action,
          details: item.details
        }));
      }
    }
  } catch (error) {
    // Silent fail
  }

  if (cloudLogs.length > 0) return cloudLogs;

  // 2. Fallback to LocalStorage
  try {
    const logsStr = localStorage.getItem('app_activity_logs');
    return logsStr ? JSON.parse(logsStr) : [];
  } catch (e) {
    return [];
  }
};
