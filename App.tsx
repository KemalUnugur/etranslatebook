
import React, { useState, useRef, useEffect } from 'react';
import { initializeGemini } from './services/geminiService';
import { analyzeEpub, translateEpub } from './services/epubService';
import { initializeSupabase, submitLog, fetchLogs } from './services/supabaseService';
import { 
  EpubFile, 
  ProcessStatus, 
  ProcessingState, 
  SUPPORTED_LANGUAGES, 
  SupportedLanguage,
  EpubAnalysisResult,
  UserRole,
  ActivityLog
} from './types';
import { 
  BookOpen, 
  Upload, 
  ArrowRight, 
  Languages, 
  Download, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Lock,
  Play,
  Linkedin,
  Heart,
  ExternalLink,
  Shield,
  Activity,
  FileText,
  Clock,
  LogOut,
  User,
  GraduationCap,
  Sparkles,
  Star,
  MessageSquare,
  ThumbsUp,
  LayoutDashboard,
  Filter,
  Search,
  Users,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

// --- COMPONENTS ---

const Footer: React.FC = () => (
  <footer className="bg-[#0f172a] text-slate-400 py-6 border-t border-slate-800 w-full mt-auto">
    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
      <div className="text-center md:text-left">
        © 2025 KuryeGet. Tüm hakları saklıdır. <span className="text-emerald-500 ml-1 text-xs font-bold">(v3.3)</span>
      </div>
      <div className="flex items-center gap-2">
        <a 
          href="https://kuryeget.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-purple-400 hover:text-purple-300 font-medium transition"
        >
          kuryeget.com
        </a>
        <span className="text-slate-600">•</span>
        <a 
          href="https://www.linkedin.com/in/kemalunugur" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition"
        >
          <Linkedin className="w-4 h-4" />
          Kemal Ünügür
        </a>
      </div>
    </div>
  </footer>
);

const DonationSection: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`bg-gradient-to-br from-red-50 via-white to-pink-50 border border-red-100 rounded-xl p-4 shadow-sm relative overflow-hidden ${className}`}>
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-red-100 rounded-full opacity-20 blur-xl"></div>
    
    <div className="flex items-center gap-2 mb-2 relative z-10">
      <div className="bg-white p-1.5 rounded-full shadow-sm border border-red-100">
        <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
      </div>
      <h4 className="font-bold text-slate-800 text-sm">İyiliği Paylaşın ❤️</h4>
    </div>
    
    <p className="text-xs text-slate-600 mb-3 leading-relaxed relative z-10 font-medium">
      Bu proje toplum yararına <strong>tamamen ücretsiz</strong> sunulmaktadır. Bize teşekkür etmek isterseniz, çocuklarımızın eğitimi ve sağlığı için mücadele eden bu değerli kurumlara bağış yapabilirsiniz.
    </p>
    
    <div className="flex gap-2 relative z-10">
      <a 
        href="https://www.darussafaka.org/bagis" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow-sm hover:-translate-y-0.5"
      >
        Darüşşafaka <ExternalLink className="w-2.5 h-2.5 opacity-80" />
      </a>
      <a 
        href="https://www.losev.org.tr/bagis" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs transition shadow-sm hover:-translate-y-0.5"
      >
        LÖSEV <ExternalLink className="w-2.5 h-2.5 opacity-80" />
      </a>
    </div>
  </div>
);

const FeedbackSection: React.FC<{ onSubmit: (rating: number, comment: string) => void }> = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit(rating, comment);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center animate-in fade-in duration-500">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mb-2 text-blue-600">
          <ThumbsUp className="w-5 h-5" />
        </div>
        <p className="font-bold text-slate-800">Geri bildiriminiz için teşekkürler!</p>
        <p className="text-sm text-slate-600">Yorumlarınız sistemi iyileştirmemize yardımcı oluyor.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left max-w-lg mx-auto">
      <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-blue-500" />
        Çeviri Kalitesini Değerlendirin
      </h4>
      
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl p-4 border border-slate-100">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Puanınız</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star 
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'fill-slate-200 text-slate-200'
                  }`} 
                />
              </button>
            ))}
          </div>
          <div className="h-5 mt-1">
             {rating > 0 && (
               <span className="text-sm font-medium text-yellow-600">
                 {rating === 5 ? "Mükemmel" : rating === 4 ? "Çok İyi" : rating === 3 ? "İdare Eder" : rating === 2 ? "Kötü" : "Çok Kötü"}
               </span>
             )}
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-700 mb-2">
             Görüşleriniz (İsteğe Bağlı)
           </label>
           <textarea
             value={comment}
             onChange={(e) => setComment(e.target.value)}
             placeholder="Örn: Deyim çevirileri çok başarılıydı ama bazı terimler hatalıydı..."
             className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition text-sm min-h-[80px]"
           />
        </div>

        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
            rating > 0 
              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          Geri Bildirim Gönder
        </button>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC<{ onLogout: () => void, currentUserEmail: string }> = ({ onLogout, currentUserEmail }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'LOGIN' | 'TRANSLATE' | 'FEEDBACK'>('ALL');
  const [searchTerm, setSearchTerm] = useState("");

  const loadLogs = async () => {
    setIsLoading(true);
    const data = await fetchLogs();
    setLogs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 30000); // 30 sn yenileme
    return () => clearInterval(interval);
  }, []);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('tr-TR', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  const exportToCSV = () => {
    // CSV Başlıkları
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    csvContent += "Tarih,Kullanıcı,İşlem,Detaylar\n";

    logs.forEach(log => {
      const row = [
        formatDate(log.timestamp).replace(/,/g, ''), // Virgülleri temizle
        log.userEmail,
        log.action,
        `"${log.details.replace(/"/g, '""')}"` // Tırnakları escape et
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `etranslatebook_logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'ALL' ||
      (filter === 'LOGIN' && log.action === 'LOGIN') ||
      (filter === 'TRANSLATE' && (log.action === 'TRANSLATE_START' || log.action === 'TRANSLATE_COMPLETE')) ||
      (filter === 'FEEDBACK' && log.action === 'FEEDBACK');
    
    const matchesSearch = log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Helper to parse feedback details if it's a feedback action
  const renderFeedbackDetails = (log: ActivityLog) => {
    if (log.action !== 'FEEDBACK') return log.details;

    // Try to parse "Puan: 5, Yorum: ..." format
    const ratingMatch = log.details.match(/Puan: (\d+)/);
    const commentMatch = log.details.match(/Yorum: (.*)/);

    if (ratingMatch) {
      const rating = parseInt(ratingMatch[1]);
      const comment = commentMatch ? commentMatch[1] : "";
      
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3.5 h-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-slate-200 text-slate-200'}`} 
              />
            ))}
            <span className="text-xs font-bold text-slate-500 ml-1">({rating}/5)</span>
          </div>
          {comment && <p className="text-slate-700 italic">"{comment}"</p>}
        </div>
      );
    }
    return log.details;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-inter text-slate-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-white flex-col hidden md:flex fixed h-full z-10">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/50">
                <Shield className="w-5 h-5 text-white" />
             </div>
             <div>
               <h1 className="font-bold text-lg tracking-tight">Admin Paneli</h1>
               <p className="text-xs text-slate-400">Veri Merkezi v1.8</p>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setFilter('ALL')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${filter === 'ALL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard className="w-5 h-5" />
            Genel Bakış
          </button>
          
          <div className="px-4 py-2 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Filtreler
          </div>
          <button onClick={() => setFilter('LOGIN')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${filter === 'LOGIN' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}>
            <Users className="w-4 h-4" /> Girişler
          </button>
          <button onClick={() => setFilter('TRANSLATE')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${filter === 'TRANSLATE' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}>
            <BookOpen className="w-4 h-4" /> Çeviriler
          </button>
          <button onClick={() => setFilter('FEEDBACK')} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${filter === 'FEEDBACK' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}>
            <MessageSquare className="w-4 h-4" /> Geri Bildirimler
          </button>

          <div className="px-4 py-2 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            İşlemler
          </div>
          <button onClick={exportToCSV} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition border border-dashed border-slate-700">
            <FileSpreadsheet className="w-4 h-4" /> Excel Olarak İndir
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-[#0b1120]">
           <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center font-bold text-xs shadow-inner">
               A
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-medium text-white truncate">{currentUserEmail}</p>
               <p className="text-xs text-slate-400">Süper Yönetici</p>
             </div>
           </div>
           <button 
             onClick={onLogout}
             className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition"
           >
             <LogOut className="w-4 h-4" /> Güvenli Çıkış
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Toplam Log</p>
                <p className="text-3xl font-extrabold text-slate-800">{logs.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Activity className="w-6 h-6" />
              </div>
           </div>
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Çevrilen Kitap</p>
                <p className="text-3xl font-extrabold text-slate-800">
                  {logs.filter(l => l.action === 'TRANSLATE_COMPLETE').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
           </div>
           {/* Add more stats if needed */}
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Sistem Kayıtları
            </h2>
            
            <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-grow md:flex-grow-0">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="E-posta veya detay ara..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                </div>
                <button 
                  onClick={loadLogs}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition border border-slate-200"
                  title="Yenile"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-48">Tarih / Saat</th>
                  <th className="px-6 py-4 w-64">Kullanıcı</th>
                  <th className="px-6 py-4 w-40">İşlem</th>
                  <th className="px-6 py-4">Detaylar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && logs.length === 0 ? (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                           <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                           <p className="text-slate-500 font-medium">Veriler yükleniyor...</p>
                        </div>
                     </td>
                   </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                       Kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-500">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${log.userEmail.includes('admin') ? 'bg-red-500' : 'bg-blue-500'}`}>
                              {log.userEmail.substring(0, 2).toUpperCase()}
                           </div>
                           <span className="font-medium text-slate-700">{log.userEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm
                          ${log.action === 'LOGIN' ? 'bg-green-50 text-green-700 border-green-200' : 
                            log.action === 'TRANSLATE_START' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                            log.action === 'TRANSLATE_COMPLETE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-purple-50 text-purple-700 border-purple-200'}`}>
                          {log.action === 'LOGIN' ? 'GİRİŞ' : 
                           log.action === 'TRANSLATE_START' ? 'BAŞLADI' : 
                           log.action === 'TRANSLATE_COMPLETE' ? 'BİTTİ' : 'GERİ BİLDİRİM'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {renderFeedbackDetails(log)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

const App: React.FC = () => {
  // --- SESSION PERSISTENCE LOGIC ---
  const getStoredSession = () => {
    try {
      const stored = localStorage.getItem('etranslate_session');
      if (stored) {
        const session = JSON.parse(stored);
        // Oturum 1 saat geçerli olsun (1 * 60 * 60 * 1000 ms)
        const SESSION_DURATION = 60 * 60 * 1000; 
        if (session.timestamp && (Date.now() - session.timestamp < SESSION_DURATION)) {
          return session;
        } else {
          localStorage.removeItem('etranslate_session'); // Süresi dolmuş
        }
      }
    } catch (e) {
      localStorage.removeItem('etranslate_session');
    }
    return null;
  };

  const [session, setSession] = useState(getStoredSession());
  const [isAuthenticated, setIsAuthenticated] = useState(!!session);
  const [userRole, setUserRole] = useState<UserRole>(session?.role || 'USER');
  const [email, setEmail] = useState(session?.email || "");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // API key comes from env
  const apiKey = process.env.API_KEY || '';
  
  useEffect(() => {
    initializeSupabase();
  }, []);

  const [file, setFile] = useState<EpubFile | null>(null);
  const [targetLang, setTargetLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]);
  const [isEducationMode, setIsEducationMode] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EpubAnalysisResult | null>(null);
  const [state, setState] = useState<ProcessingState>({
    status: ProcessStatus.IDLE,
    currentChapter: 0,
    totalChapters: 0,
    progress: 0,
    message: ''
  });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (apiKey) initializeGemini(apiKey);
  }, [apiKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    let role: UserRole = 'USER';
    let authSuccess = false;

    if (email === "admin@etranslatebook.com" && password === "Elifsu2012*34") {
      role = 'ADMIN';
      authSuccess = true;
      submitLog(email, 'LOGIN', 'Admin girişi.');
    }
    else if (email === "elif@etranslatebook.com" && password === "tilbem123") {
      role = 'USER';
      authSuccess = true;
      submitLog(email, 'LOGIN', 'Kullanıcı girişi.');
    }

    if (authSuccess) {
      const newSession = { email, role, timestamp: Date.now() };
      localStorage.setItem('etranslate_session', JSON.stringify(newSession));
      setSession(newSession);
      setIsAuthenticated(true);
      setUserRole(role);
      setLoginError("");
    } else {
      setLoginError("E-posta veya şifre hatalı.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('USER');
    setEmail("");
    setPassword("");
    setFile(null);
    setAnalysisResult(null);
    setDownloadUrl(null);
    setIsEducationMode(false);
    localStorage.removeItem('etranslate_session');
    setSession(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/epub+zip" && !selectedFile.name.endsWith('.epub')) {
        alert("Geçersiz dosya formatı.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFile({ name: selectedFile.name, data: e.target.result as ArrayBuffer });
          setState({ status: ProcessStatus.IDLE, currentChapter: 0, totalChapters: 0, progress: 0, message: 'Hazır' });
          setAnalysisResult(null);
          setDownloadUrl(null);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const startAnalysis = async () => {
    if (!file || !apiKey) return;
    initializeGemini(apiKey);
    try {
      setState(prev => ({ ...prev, status: ProcessStatus.ANALYZING, message: 'Kitap analiz ediliyor...' }));
      const result = await analyzeEpub(file.data);
      setAnalysisResult(result);
      setState(prev => ({ ...prev, status: ProcessStatus.READY_TO_TRANSLATE, message: 'Analiz tamamlandı.' }));
    } catch (error: any) {
      setState(prev => ({ ...prev, status: ProcessStatus.ERROR, message: `Hata: ${error.message}` }));
    }
  };

  const executeTranslation = async () => {
    if (!file || !analysisResult) return;
    submitLog(email, 'TRANSLATE_START', `${file.name} (${targetLang.name})`);
    try {
      const translatedBlob = await translateEpub(
        file.data,
        analysisResult.sourceLang,
        targetLang.name,
        isEducationMode,
        (updates) => setState(prev => ({ ...prev, ...updates })),
        analysisResult.previewText
      );
      setDownloadUrl(URL.createObjectURL(translatedBlob));
      submitLog(email, 'TRANSLATE_COMPLETE', `${file.name} tamamlandı.`);
    } catch (error: any) {
      setState(prev => ({ ...prev, status: ProcessStatus.ERROR, message: error.message }));
    }
  };

  const handleFeedbackSubmit = (rating: number, comment: string) => {
    submitLog(email, 'FEEDBACK', `Puan: ${rating}, Yorum: ${comment}`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-inter text-slate-900">
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 min-h-[600px]">
            {/* Left Login */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-6 text-center">
                {/* Custom Papatya (Daisy) SVG Icon - Standard Size */}
                <div className="mb-6 relative w-20 h-20 mx-auto flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md filter">
                        <defs>
                            <linearGradient id="petalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="100%" stopColor="#f0f9ff" />
                            </linearGradient>
                            <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fbbf24" />
                                <stop offset="100%" stopColor="#d97706" />
                            </linearGradient>
                        </defs>
                        {/* Petals */}
                        <g stroke="#cbd5e1" strokeWidth="2">
                            {[0, 45, 90, 135, 180, 225, 270, 315].map(r => (
                                <ellipse key={r} cx="100" cy="60" rx="18" ry="45" fill="url(#petalGradient)" transform={`rotate(${r} 100 100)`} />
                            ))}
                            {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map(r => (
                                <ellipse key={r} cx="100" cy="65" rx="15" ry="40" fill="white" transform={`rotate(${r} 100 100)`} />
                            ))}
                        </g>
                        {/* Center */}
                        <circle cx="100" cy="100" r="28" fill="url(#centerGradient)" stroke="#b45309" strokeWidth="2" />
                        <circle cx="92" cy="92" r="6" fill="white" fillOpacity="0.3" />
                    </svg>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Hoş Geldiniz</h2>
                <p className="text-slate-500 font-medium text-sm">Lütfen size verilen kurumsal hesap bilgilerinizle sisteme giriş yapın.</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">E-posta Adresi</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition font-medium text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Şifre</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition font-medium text-sm" required />
                </div>
                {loginError && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center gap-2 border border-red-100 font-medium"><AlertCircle className="w-3 h-3" />{loginError}</div>}
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 mt-2 text-sm"><Lock className="w-3 h-3" /> Giriş Yap</button>
              </form>
              <div className="mt-8"><DonationSection className="bg-slate-50 border-slate-100 shadow-none" /></div>
            </div>
            {/* Right Feature */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 p-8 md:p-12 text-white hidden md:flex flex-col justify-between overflow-hidden">
               <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
               <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
               
               <div className="relative z-10">
                 <div className="bg-white/10 backdrop-blur-md inline-flex p-3 rounded-2xl mb-8 border border-white/10 shadow-xl">
                   <BookOpen className="w-8 h-8 text-blue-300" />
                 </div>
                 <h3 className="text-3xl font-bold leading-tight mb-4">
                   <span className="text-blue-300">Eğitim Modu</span>
                 </h3>
                 <p className="text-blue-100/80 leading-relaxed font-light mb-8 text-lg">
                   Yapay zeka, çeviri yaparken dil öğrenimini destekleyen özel bir format sunar.
                 </p>
                 
                 <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                   <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                     <GraduationCap className="w-5 h-5 text-yellow-400" />
                     <span className="font-bold text-sm tracking-wide text-white/90">EĞİTİM MODU</span>
                   </div>
                   
                   <div className="space-y-4 font-serif">
                     <div className="space-y-2">
                       <p className="text-xl text-white font-medium leading-snug">"Every book is a new adventure."</p>
                       <div className="flex gap-3">
                         <div className="w-1 bg-yellow-400 rounded-full"></div>
                         <p className="text-white/70 text-base italic">Her kitap yeni bir maceradır.</p>
                       </div>
                     </div>
                     <div className="w-full h-px bg-white/10 my-2"></div>
                     <div className="space-y-2 opacity-80">
                        <p className="text-lg text-white font-medium leading-snug">"Education is the key to success."</p>
                        <div className="flex gap-3">
                          <div className="w-1 bg-yellow-400 rounded-full"></div>
                          <p className="text-white/70 text-sm italic">Eğitim, başarının anahtarıdır.</p>
                        </div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === 'ADMIN') {
    return <AdminDashboard onLogout={handleLogout} currentUserEmail={email} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 font-inter flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-700 to-blue-500 p-2 rounded-lg shadow-sm"><BookOpen className="w-5 h-5 text-white" /></div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">eTranslateBook</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>{email}
            </div>
            <button onClick={handleLogout} className="text-sm font-semibold text-slate-400 hover:text-red-600 transition-colors">Çıkış Yap</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-12 flex-grow w-full pb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">Epub Çeviri</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">EPUB formatındaki kitaplarınızı formatı bozulmadan istediğiniz dile çevirin.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative transition-all duration-300 mb-12">
          {!file && (
            <div className="p-8 md:p-12">
               <div onClick={() => fileInputRef.current?.click()} className="group border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-slate-50/50 rounded-2xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer">
                <div className="w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300"><Upload className="w-9 h-9" /></div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">EPUB Dosyası Yükle</h3>
                <p className="text-slate-500 mb-6 font-medium">Bilgisayarınızdan bir kitap seçin</p>
                <span className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg shadow-sm group-hover:border-blue-200 transition">Dosya Seç</span>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".epub" className="hidden" />
              </div>
            </div>
          )}

          {file && (
            <div className="p-8 md:p-10">
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-orange-50 border border-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-bold text-xl shadow-sm">epub</div>
                  <div><h3 className="font-bold text-xl text-slate-900 mb-1">{file.name}</h3><p className="text-sm font-medium text-slate-500">{(file.data.byteLength / 1024 / 1024).toFixed(2)} MB</p></div>
                </div>
                {state.status !== ProcessStatus.TRANSLATING && state.status !== ProcessStatus.ANALYZING && (
                  <button onClick={() => setFile(null)} className="text-sm text-slate-400 hover:text-red-500 font-semibold px-4 py-2 rounded-lg hover:bg-red-50 transition">Dosyayı Kaldır</button>
                )}
              </div>

              {state.status === ProcessStatus.IDLE && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-8 flex gap-4">
                    <div className="mt-1 bg-blue-100 p-2 rounded-lg h-fit"><Languages className="w-5 h-5 text-blue-600" /></div>
                    <div><h4 className="font-bold text-blue-900 mb-1">Otomatik İçerik Analizi</h4><p className="text-sm text-blue-700/80 leading-relaxed font-medium">Sistem kitabın dil yapısını ve bölüm sayısını tarayacaktır.</p></div>
                  </div>
                  <button onClick={startAnalysis} disabled={!apiKey} className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition shadow-xl ${apiKey ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}>Analizi Başlat <ArrowRight className="w-5 h-5" /></button>
                </div>
              )}

              {state.status === ProcessStatus.READY_TO_TRANSLATE && analysisResult && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Kitap Analiz Raporu</h4>
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-4"><span className="text-sm font-medium text-slate-500">Tespit Edilen Dil</span><span className="text-lg font-bold text-slate-900 flex items-center gap-2 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100">{analysisResult.sourceLang}<CheckCircle2 className="w-5 h-5 text-green-500" /></span></div>
                        <div className="flex justify-between items-center"><span className="text-sm font-medium text-slate-500">Toplam Bölüm</span><span className="text-lg font-bold text-slate-900 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100">{analysisResult.chapterCount} Bölüm</span></div>
                      </div>
                    </div>
                    <div className="flex flex-col h-full gap-4">
                      <div className="flex-grow flex flex-col">
                        <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Hedef Dil Seçimi</label>
                        <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar bg-slate-50 p-2 rounded-xl border border-slate-200 flex-grow">
                          {SUPPORTED_LANGUAGES.map((lang) => (
                            <button key={lang.code} onClick={() => setTargetLang(lang)} className={`px-4 py-3 text-sm rounded-lg border transition text-left flex items-center justify-between group ${targetLang.code === lang.code ? 'border-blue-500 bg-blue-600 text-white font-semibold shadow-md' : 'border-slate-200 bg-white hover:border-blue-300 text-slate-600 hover:bg-blue-50'}`}>{lang.name}{targetLang.code === lang.code && <CheckCircle2 className="w-4 h-4" />}</button>
                          ))}
                        </div>
                      </div>
                      <div onClick={() => setIsEducationMode(!isEducationMode)} className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 relative overflow-hidden group ${isEducationMode ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-900 hover:border-indigo-200'}`}>
                         <div className="flex items-center gap-3 relative z-10"><div className={`p-2 rounded-lg ${isEducationMode ? 'bg-white/20' : 'bg-indigo-100'}`}><GraduationCap className={`w-6 h-6 ${isEducationMode ? 'text-white' : 'text-indigo-600'}`} /></div><div className="flex-grow"><h4 className="font-bold text-sm">Eğitim Modu</h4><p className={`text-xs mt-1 ${isEducationMode ? 'text-indigo-100' : 'text-indigo-600/80'}`}>Orijinal metni korur, altına çevirisini ekler (Çift Dilli).</p></div><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isEducationMode ? 'border-white bg-white' : 'border-indigo-300 bg-transparent'}`}>{isEducationMode && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}</div></div>
                      </div>
                    </div>
                  </div>
                  <button onClick={executeTranslation} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition shadow-xl shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5"><Play className="w-5 h-5 fill-current" /> Çeviriyi Başlat</button>
                </div>
              )}

              {(state.status === ProcessStatus.ANALYZING || state.status === ProcessStatus.TRANSLATING) && (
                <div className="py-12 flex flex-col items-center text-center animate-in fade-in duration-500">
                  <div className="relative mb-8"><div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div><div className="relative bg-white p-6 rounded-full shadow-lg border border-slate-100"><Loader2 className="w-12 h-12 text-blue-600 animate-spin" /></div></div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{state.status === ProcessStatus.ANALYZING ? 'Analiz Ediliyor...' : 'Çeviri Yapılıyor...'}</h3>
                  <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed font-medium">{state.message}</p>
                  {state.status === ProcessStatus.TRANSLATING && (
                    <div className="w-full max-w-md space-y-3">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide px-1"><span>İlerleme Durumu</span><span>%{state.progress}</span></div>
                      <div className="bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner border border-slate-200"><div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-500 ease-out relative overflow-hidden rounded-full" style={{ width: `${state.progress}%` }}><div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div></div></div>
                      <p className="text-xs text-slate-400 mt-2 font-medium">Aktif Bölüm: {state.currentChapter} / {state.totalChapters}</p>
                    </div>
                  )}
                </div>
              )}

              {state.status === ProcessStatus.COMPLETED && downloadUrl && (
                <div className="py-12 flex flex-col items-center text-center bg-green-50/30 rounded-2xl animate-in zoom-in duration-300 border border-green-100/50">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-md border-4 border-white"><CheckCircle2 className="w-12 h-12" /></div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-3">İşlem Başarılı!</h3>
                  <p className="text-slate-600 mb-8 max-w-md font-medium">Kitabınız <strong>{targetLang.name}</strong> diline {isEducationMode ? '(Eğitim Modu ile)' : ''} çevrildi.</p>
                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-8">
                    <a href={downloadUrl} download={`translated-${file?.name}`} className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-xl shadow-green-200 flex items-center justify-center gap-2 transition transform hover:-translate-y-1"><Download className="w-5 h-5" /> Çevrilen Kitabı İndir</a>
                    <button onClick={() => { setFile(null); setDownloadUrl(null); setAnalysisResult(null); setState(prev => ({ ...prev, status: ProcessStatus.IDLE })); }} className="px-8 py-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition shadow-sm hover:shadow-md">Yeni İşlem</button>
                  </div>
                  <FeedbackSection onSubmit={handleFeedbackSubmit} />
                </div>
              )}

              {state.status === ProcessStatus.ERROR && (
                <div className="py-12 flex flex-col items-center text-center animate-in fade-in duration-500">
                  <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-md border-4 border-white"><AlertCircle className="w-12 h-12" /></div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Bir Hata Oluştu</h3>
                  <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed font-medium bg-red-50/50 p-4 rounded-xl border border-red-100 text-sm">{state.message}</p>
                  <button onClick={() => { setFile(null); setAnalysisResult(null); setState(prev => ({ ...prev, status: ProcessStatus.IDLE, message: '' })); }} className="px-8 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition shadow-lg shadow-slate-200">Tekrar Dene</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
