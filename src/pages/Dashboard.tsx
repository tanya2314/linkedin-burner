import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { getRoast } from '../utils/roastEngine';
import type { RoastResult } from '../utils/roastEngine';
import { 
  Flame, 
  LogOut, 
  User, 
  Clipboard, 
  Image as ImageIcon, 
  Wand2, 
  Copy, 
  Check, 
  History, 
  Sparkles, 
  Upload, 
  Trash2, 
  FileText, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';

interface SavedRoast {
  id: string;
  created_at: string;
  input_type: 'text' | 'image';
  input_content: string;
  mode: 'roast' | 'constructive';
  roast_output: string;
  rewrite_output: string;
}

const LOADING_MESSAGES = [
  "Analyzing your feed...",
  "Sharpening the roast...",
  "Calculating cringe levels...",
  "Compressing corporate synergy...",
  "Optimizing B2B sales lessons...",
  "Scanning for humblebrags...",
  "Igniting burner engines..."
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string>('guest@demo.local');
  const [inputType, setInputType] = useState<'text' | 'image'>('text');
  const [textInput, setTextInput] = useState('');

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mode, setMode] = useState<'roast' | 'constructive'>('roast');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [result, setResult] = useState<RoastResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedRoast[]>([]);
  const [copiedRoast, setCopiedRoast] = useState(false);
  const [copiedRewrite, setCopiedRewrite] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Load user info & history
  useEffect(() => {
    const fetchUserAndHistory = async () => {
      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || 'user@supabase.com');
          fetchHistory(user.id);
        } else {
          navigate('/login');
        }
      } else {
        const localHistory = localStorage.getItem('linkedin_roasts_demo');
        if (localHistory) {
          try {
            setHistory(JSON.parse(localHistory));
          } catch (e) {
            console.error('Error parsing local history', e);
          }
        }
      }
    };

    fetchUserAndHistory();
  }, [navigate]);

  const fetchHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('linkedin_roasts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setHistory(data);
    } catch (err) {
      console.error('Failed to load roast history:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValidationError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    navigate('/login');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);
    setErrorMsg(null);

    // Empty state validation
    if (inputType === 'text' && !textInput.trim()) {
      setValidationError("Give me something to roast first!");
      return;
    }

    if (inputType === 'image' && !imagePreview) {
      setValidationError("Give me something to roast first!");
      return;
    }

    setLoading(true);
    setResult(null);

    // Set up message rotation interval
    let messageIndex = 0;
    setLoadingMessage(LOADING_MESSAGES[0]);
    const intervalId = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    }, 2000);

    const inputData = inputType === 'text' ? textInput : (imagePreview || 'image_uploaded');

    try {
      const response = await getRoast(inputData, mode);
      setResult(response);

      // Save to Supabase (or fallback local history)
      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('linkedin_roasts')
            .insert({
              user_id: user.id,
              input_type: inputType,
              input_content: inputData,
              mode: mode,
              roast_output: response.roast,
              rewrite_output: response.rewrite
            });
          if (error) {
            console.error('Supabase save error:', error);
          } else {
            fetchHistory(user.id);
          }
        }
      } else {
        const newRecord: SavedRoast = {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          input_type: inputType,
          input_content: inputData,
          mode: mode,
          roast_output: response.roast,
          rewrite_output: response.rewrite
        };
        const updatedHistory = [newRecord, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('linkedin_roasts_demo', JSON.stringify(updatedHistory));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate roast. Please try again.");
    } finally {
      setLoading(false);
      clearInterval(intervalId);
    }
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this item?')) return;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('linkedin_roasts')
          .delete()
          .eq('id', id);

        if (error) throw error;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) fetchHistory(user.id);
      } catch (err) {
        console.error('Failed to delete history item:', err);
      }
    } else {
      const updatedHistory = history.filter(item => item.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem('linkedin_roasts_demo', JSON.stringify(updatedHistory));
    }
  };

  const copyToClipboard = (text: string, type: 'roast' | 'rewrite') => {
    navigator.clipboard.writeText(text);
    if (type === 'roast') {
      setCopiedRoast(true);
      setTimeout(() => setCopiedRoast(false), 1500);
    } else {
      setCopiedRewrite(true);
      setTimeout(() => setCopiedRewrite(false), 1500);
    }
  };

  const selectHistoryItem = (item: SavedRoast) => {
    setInputType(item.input_type);
    setValidationError(null);
    setErrorMsg(null);
    if (item.input_type === 'text') {
      setTextInput(item.input_content);
      setImagePreview(null);
    } else {
      setTextInput('');
      setImagePreview(item.input_content);
    }
    setMode(item.mode);
    setResult({
      roast: item.roast_output,
      rewrite: item.rewrite_output
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleExpandItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col relative pb-16">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-accent-purple/10 to-transparent blur-[80px] pointer-events-none" />

      {/* Global Header */}
      <header className="border-b border-slate-800 bg-dark-900/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-accent-roast to-pink-500 rounded-xl shadow-md shadow-accent-roast/10 animate-pulse">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg bg-gradient-to-r from-accent-roast via-pink-500 to-accent-purple bg-clip-text text-transparent">
                LinkedIn Burner
              </span>
              <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                {isSupabaseConfigured ? 'Cloud Mode' : 'Demo Mode'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900/60 border border-slate-800 rounded-full text-xs text-slate-300">
              <User className="w-3.5 h-3.5 text-accent-purple" />
              <span className="max-w-[150px] truncate font-medium">{userEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* Left Side: Input & Settings Form */}
        <section className="lg:col-span-5 space-y-6">
          <div className="glow-card rounded-2xl p-6 shadow-xl relative">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-accent-purple" /> Feed Analyzer
            </h2>

            {/* Input Type Toggles */}
            <div className="grid grid-cols-2 p-1 bg-dark-950 border border-slate-800 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setInputType('text');
                  setValidationError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                  inputType === 'text'
                    ? 'bg-slate-850 text-white shadow-sm border border-slate-700/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" />
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputType('image');
                  setValidationError(null);
                }}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                  inputType === 'image'
                    ? 'bg-slate-850 text-white shadow-sm border border-slate-700/50'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Upload Image
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Validation Error Notice */}
              {validationError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold animate-pulse flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Conditional Inputs */}
              {inputType === 'text' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    LinkedIn Post Content
                  </label>
                  <textarea
                    rows={6}
                    value={textInput}
                    onChange={(e) => {
                      setTextInput(e.target.value);
                      setValidationError(null);
                    }}
                    placeholder="Paste the self-congratulatory B2B synergy post here..."
                    className="w-full p-4 bg-dark-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-accent-purple focus:ring-1 focus:ring-accent-purple transition-all resize-y"
                  />
                  <div className="text-right text-[10px] text-slate-500 mt-1">
                    {textInput.length} characters
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Profile or Post Screenshot
                  </label>
                  {imagePreview ? (
                    <div className="relative border border-slate-800 rounded-xl bg-dark-950 p-2 overflow-hidden flex flex-col items-center">
                      <img 
                        src={imagePreview} 
                        alt="Screenshot Preview" 
                        className="max-h-56 w-auto object-contain rounded-lg border border-slate-850"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setValidationError(null);
                        }}
                        className="mt-2.5 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Image
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-accent-purple/50 bg-dark-950 hover:bg-dark-900/40 rounded-xl p-8 cursor-pointer transition-all group">
                      <Upload className="w-8 h-8 text-slate-600 group-hover:text-accent-purple mb-3 transition-colors" />
                      <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300">
                        Drag and drop or browse files
                      </span>
                      <span className="text-[10px] text-slate-600 mt-1">
                        PNG, JPG, or WEBP up to 5MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Mode Selectors */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Destruction Level
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('roast')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      mode === 'roast'
                        ? 'bg-accent-roast/10 border-accent-roast text-accent-roast shadow shadow-accent-roast/5'
                        : 'border-slate-800 bg-dark-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🔥 Roast Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('constructive')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      mode === 'constructive'
                        ? 'bg-accent-constructive/10 border-accent-constructive text-accent-constructive shadow shadow-accent-constructive/5'
                        : 'border-slate-800 bg-dark-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>🛠️ Constructive Critique</span>
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-accent-roast to-accent-purple text-white font-bold rounded-xl text-sm transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-accent-roast/10 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Simulating AI Engine...
                  </span>
                ) : mode === 'roast' ? (
                  'Roast My Profile 🔥'
                ) : (
                  'Analyze and Rewrite ✨'
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right Side: Roast Output Displays */}
        <section className="lg:col-span-7 flex flex-col space-y-6">
          {loading ? (
            /* Engaging loading state animation with rotating messages */
            <div className="border border-slate-800 bg-dark-900/40 rounded-2xl p-12 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-roast/5 to-accent-purple/5 opacity-40 animate-pulse-slow" />
              <div className="relative z-10 space-y-6">
                <div className="relative inline-flex items-center justify-center">
                  <span className="absolute inline-flex h-20 w-20 rounded-full bg-accent-roast/20 animate-ping" />
                  <div className="relative p-5 bg-dark-950 rounded-full border border-accent-roast/40 shadow-lg shadow-accent-roast/10">
                    <Flame className="w-10 h-10 text-accent-roast animate-bounce" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-100 min-h-[30px] flex items-center justify-center tracking-wide">
                    {loadingMessage}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Please stand by. Our AI is parsing executive speak and calculating corporate buzzword density.
                  </p>
                </div>
                {/* Horizontal Progress bar with moving shimmer */}
                <div className="w-48 h-1 bg-slate-900 rounded-full mx-auto overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-accent-roast to-accent-purple w-2/3 rounded-full animate-slide" />
                </div>
              </div>
            </div>
          ) : errorMsg ? (
            /* Playful error display with Retry Button */
            <div className="border border-rose-500/20 bg-dark-900/40 rounded-2xl p-8 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden animate-fade-in-up">
              <div className="absolute inset-0 bg-rose-500/5 pointer-events-none" />
              <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-400 mb-4 animate-bounce">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-rose-350">System Melted Down 🔥</h3>
              <p className="text-slate-400 text-xs mt-2 max-w-sm leading-relaxed">
                The servers got hit with too much LinkedIn synergy and collapsed! Check your Supabase key configs or try again to reignite.
              </p>
              <p className="text-slate-500 text-[10px] mt-2 font-mono bg-dark-950 p-2 rounded border border-slate-900 max-w-xs text-left truncate">
                {errorMsg}
              </p>
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="mt-6 px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-bold rounded-xl text-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                Re-Ignite Engine 🔥
              </button>
            </div>
          ) : result ? (
            /* Side-by-Side Outputs with fade-in-up transition */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 animate-fade-in-up">
              {/* Column 1: The Roast */}
              <article className="border border-accent-roast/35 bg-dark-900/50 rounded-2xl p-6 flex flex-col shadow-lg shadow-accent-roast/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-roast/5 rounded-full blur-2xl pointer-events-none group-hover:bg-accent-roast/10 transition-colors" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-accent-roast" />
                    <h3 className="font-extrabold text-base text-accent-roast tracking-wide uppercase">
                      The Roast
                    </h3>
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.roast, 'roast')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-dark-950 text-slate-400 hover:text-slate-200 transition-all text-xs font-semibold cursor-pointer"
                    title="Copy Roast"
                  >
                    {copiedRoast ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        <span className="text-emerald-500 text-[10px] font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-dark-950/60 border border-slate-850 p-4 rounded-xl font-mono overflow-y-auto max-h-[380px] min-h-[200px]">
                  {result.roast}
                </div>
              </article>

              {/* Column 2: The Rewrite */}
              <article className="border border-accent-constructive/35 bg-dark-900/50 rounded-2xl p-6 flex flex-col shadow-lg shadow-accent-constructive/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-constructive/5 rounded-full blur-2xl pointer-events-none group-hover:bg-accent-constructive/10 transition-colors" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent-constructive" />
                    <h3 className="font-extrabold text-base text-accent-constructive tracking-wide uppercase">
                      Constructive Translation
                    </h3>
                  </div>
                  <button
                    onClick={() => copyToClipboard(result.rewrite, 'rewrite')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-dark-950 text-slate-400 hover:text-slate-200 transition-all text-xs font-semibold cursor-pointer"
                    title="Copy Rewrite"
                  >
                    {copiedRewrite ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        <span className="text-emerald-500 text-[10px] font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-dark-950/60 border border-slate-850 p-4 rounded-xl overflow-y-auto max-h-[380px] min-h-[200px]">
                  {result.rewrite}
                </div>
              </article>
            </div>
          ) : (
            /* Empty State Panel */
            <div className="border border-slate-800 bg-dark-900/20 border-dashed rounded-2xl p-12 flex-1 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-slate-900 rounded-full border border-slate-800 text-slate-500 animate-bounce mb-4">
                <Flame className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-300">Ready to Incinerate</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm leading-relaxed">
                Submit raw LinkedIn posts or screenshots above to generate a roasting review and a professional rewrite.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* History Area */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 w-full">
        <div className="border-t border-slate-800 pt-8">
          <h2 className="text-xl font-bold flex items-center gap-2.5 mb-6 text-slate-200">
            <History className="w-5 h-5 text-accent-purple" /> History Log ({history.length})
          </h2>

          {history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={(e) => toggleExpandItem(item.id, e)}
                    className="glow-card cursor-pointer rounded-xl p-5 border border-slate-850 hover:border-slate-700 bg-dark-900/40 text-left transition-all relative flex flex-col justify-between group animate-fade-in"
                  >
                    <div>
                      {/* Card Head */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                            item.mode === 'roast' 
                              ? 'bg-accent-roast/10 text-accent-roast' 
                              : 'bg-accent-constructive/10 text-accent-constructive'
                          }`}>
                            {item.mode === 'roast' ? '🔥 roast' : '🛠️ constructive'}
                          </span>
                          <button
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="p-1 rounded text-slate-500 hover:text-rose-450 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Roast"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Summary (always visible) */}
                      <div className="flex items-start gap-2 mb-3">
                        {item.input_type === 'image' ? (
                          <div className="shrink-0 w-8 h-8 rounded bg-slate-900 border border-slate-850 overflow-hidden flex items-center justify-center">
                            {item.input_content.startsWith('data:image') ? (
                              <img src={item.input_content} alt="Thumbnail" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-slate-650" />
                            )}
                          </div>
                        ) : (
                          <div className="shrink-0 w-8 h-8 rounded bg-slate-900 border border-slate-850 flex items-center justify-center">
                            <FileText className="w-3.5 h-3.5 text-slate-550" />
                          </div>
                        )}
                        <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed flex-1 pt-1 font-medium">
                          {item.input_type === 'text' ? item.input_content : 'Screenshot Analyzed'}
                        </p>
                      </div>

                      {/* Collapsed / Expanded Content Sections */}
                      {isExpanded ? (
                        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                          {item.input_type === 'text' && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Original Post:</span>
                              <p className="text-xs text-slate-300 bg-dark-950 p-2.5 rounded-lg border border-slate-850 max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed">{item.input_content}</p>
                            </div>
                          )}
                          
                          {item.input_type === 'image' && item.input_content.startsWith('data:image') && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Original Screenshot:</span>
                              <img src={item.input_content} alt="Screenshot" className="max-h-40 w-auto object-contain rounded border border-slate-850 mx-auto" />
                            </div>
                          )}

                          <div>
                            <span className="text-[10px] font-bold text-accent-roast uppercase tracking-wider block mb-1">The Roast 🔥</span>
                            <p className="text-xs text-slate-350 bg-dark-950 p-2.5 rounded-lg border border-accent-roast/20 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed">{item.roast_output}</p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-accent-constructive uppercase tracking-wider block mb-1">Translation ✨</span>
                            <p className="text-xs text-slate-350 bg-dark-950 p-2.5 rounded-lg border border-accent-constructive/20 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">{item.rewrite_output}</p>
                          </div>

                          <button
                            onClick={() => selectHistoryItem(item)}
                            className="w-full mt-2 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-accent-purple hover:text-white hover:border-accent-purple rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            Load back into workspace <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-900/60">
                      <span className="text-[10px] text-slate-500 font-semibold group-hover:text-slate-400 transition-colors flex items-center gap-1">
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" /> Click card to collapse
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" /> Click card to expand
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center border border-slate-850/50 border-dashed rounded-xl bg-dark-900/10">
              <p className="text-xs text-slate-500">History is empty. Once you trigger a roast, it will be saved here.</p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
