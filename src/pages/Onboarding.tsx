
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, ArrowLeft, Globe, Zap, RefreshCw, CheckCircle, BookOpen, Plus, X, AlertCircle, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { KEYWORD_RECOMMENDATIONS } from '../constants';
import { api } from '../services/api';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [keywordInput, setKeywordInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  
  // Topic Pools — seeded statically, then replaced by trend-derived suggestions
  const [PREDEFINED_TOPICS, setPredefinedTopics] = useState<string[]>([
    'AI', 'Security', 'FinTech', 'BioTech'
  ]);
  const [userAddedTopics, setUserAddedTopics] = useState<string[]>([]);

  // Keyword Pools
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>(
    KEYWORD_RECOMMENDATIONS.slice(0, 5)
  );
  const [userAddedKeywords, setUserAddedKeywords] = useState<string[]>([]);

  const [prefs, setPrefs] = useState<{
    domain: string;
    frequency: string;
    topics: string[];
    summaryLength: string;
    duplicateFiltering: boolean;
    keywords: string[];
    deliveryTime: string;
    deliveryDay: string;
    deliveryDate: number;
  }>({
    domain: 'both',
    frequency: 'daily',
    topics: ['AI'],
    summaryLength: 'standard',
    duplicateFiltering: true,
    keywords: ['LLMs'],
    deliveryTime: '09:00',
    deliveryDay: 'Monday',
    deliveryDate: 1
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Pull trending topics for the chosen domain. Falls back to the seeded list.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.getSuggestedTopics(prefs.domain, 12);
        if (!cancelled && res.topics?.length) setPredefinedTopics(res.topics);
      } catch (err) {
        console.warn('[Onboarding] Topic suggestions unavailable, using defaults:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [prefs.domain]);

  // Suggest keywords for whatever topics the user has picked so far.
  const onboardingTopicsKey = prefs.topics.join('|');
  useEffect(() => {
    const topics = onboardingTopicsKey ? onboardingTopicsKey.split('|') : [];
    if (!topics.length) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.getSuggestedKeywords(topics, prefs.domain, 8);
        if (!cancelled && res.keywords?.length) setSuggestedKeywords(res.keywords);
      } catch (err) {
        console.warn('[Onboarding] Keyword suggestions unavailable, using defaults:', err);
      }
    }, 600);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [onboardingTopicsKey, prefs.domain]);

  const handleNext = async () => {
    if (step === 2) {
      if (prefs.topics.length === 0) {
        toast.error("At least one topic is required.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      // Save preferences to backend
      try {
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');

        if (!user.id) {
          toast.error("User not found. Please sign in again.");
          navigate('/login');
          return;
        }

        // Map domain to source type
        let sourceType: 'academic' | 'industry' | 'financial' | 'both' = 'both';
        if (prefs.domain === 'academic') sourceType = 'academic';
        else if (prefs.domain === 'industry') sourceType = 'industry';
        else if (prefs.domain === 'financial') sourceType = 'financial';

        await api.updateUserPreferences(user.id, {
          topics: prefs.topics,
          keywords: prefs.keywords,
          source: sourceType,
          frequency: prefs.frequency.toLowerCase() as 'daily' | 'weekly' | 'monthly',
          summaryLength: prefs.summaryLength,
          duplicateFiltering: prefs.duplicateFiltering,
          deliveryTime: prefs.deliveryTime,
          deliveryDay: prefs.deliveryDay,
          deliveryDate: prefs.deliveryDate
        });

        toast.success("Preferences saved successfully!");
        navigate('/dashboard');
      } catch (error: any) {
        console.error('Error saving preferences:', error);
        toast.error(error.message || 'Failed to save preferences');
      }
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => setStep(step - 1);

  // Topics Logic
  const addTopic = () => {
    if (!topicInput.trim()) {
      toast.info('Enter a topic name.');
      return;
    }
    const val = topicInput.trim();
    if (!userAddedTopics.includes(val) && !PREDEFINED_TOPICS.includes(val)) {
      setUserAddedTopics(prev => [...prev, val]);
    }
    if (!prefs.topics.includes(val)) {
      setPrefs(prev => ({ ...prev, topics: [...prev.topics, val] }));
    }
    setTopicInput('');
  };

  const toggleTopic = (t: string) => {
    setPrefs(prev => ({
      ...prev,
      topics: prev.topics.includes(t) ? prev.topics.filter(x => x !== t) : [...prev.topics, t]
    }));
  };

  const deleteCustomTopic = (e: React.MouseEvent, t: string) => {
    e.stopPropagation();
    setUserAddedTopics(prev => prev.filter(x => x !== t));
    setPrefs(prev => ({ ...prev, topics: prev.topics.filter(x => x !== t) }));
  };

  // Keywords Logic
  const addKeyword = () => {
    if (!keywordInput.trim()) {
      toast.info('Enter a keyword.');
      return;
    }
    const val = keywordInput.trim();
    if (!userAddedKeywords.includes(val) && !suggestedKeywords.includes(val)) {
      setUserAddedKeywords(prev => [...prev, val]);
    }
    if (!prefs.keywords.includes(val)) {
      setPrefs(prev => ({ ...prev, keywords: [...prev.keywords, val] }));
    }
    setKeywordInput('');
  };

  const toggleKeyword = (k: string) => {
    setPrefs(prev => ({
      ...prev,
      keywords: prev.keywords.includes(k) ? prev.keywords.filter(x => x !== k) : [...prev.keywords, k]
    }));
  };

  const deleteCustomKeyword = (e: React.MouseEvent, k: string) => {
    e.stopPropagation();
    setUserAddedKeywords(prev => prev.filter(x => x !== k));
    setPrefs(prev => ({ ...prev, keywords: prev.keywords.filter(x => x !== k) }));
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const getConfirmationText = () => {
    const timeStr = `at ${prefs.deliveryTime} UTC`;
    if (prefs.frequency === 'daily') return `Daily dispatch ${timeStr} verified.`;
    if (prefs.frequency === 'weekly') return `Weekly dispatch on ${prefs.deliveryDay}s ${timeStr} verified.`;
    return `Monthly dispatch on the ${prefs.deliveryDate}${getOrdinal(prefs.deliveryDate)} ${timeStr} verified.`;
  };

  return (
    <div className="min-h-[calc(100vh-76px)] flex items-center justify-center p-6 bg-[#F8FAFC] font-sans">
      <div className="w-full max-w-[580px] bg-white border border-slate-200 rounded-[24px] p-8 lg:p-10 space-y-10 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Progress & Header */}
        <div className="space-y-6">
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`h-1 w-10 rounded-full transition-all duration-500 ${step >= i ? 'bg-[rgb(152,16,250)]' : 'bg-slate-100'}`} 
              />
            ))}
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {step === 1 && "Personalize your feed"}
              {step === 2 && "Define your signals"}
              {step === 3 && "Intelligence preview"}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
                {step === 1 && "Configure delivery schedule and sources."}
                {step === 2 && "Select the signals and topics you track."}
                {step === 3 && "Your first automated dispatch is ready."}
            </p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Content Domain</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'academic', label: 'Academic', icon: BookOpen },
                  { id: 'industry', label: 'Industry', icon: Globe },
                  { id: 'financial', label: 'Financial', icon: TrendingUp },
                  { id: 'both', label: 'All Sources', icon: Zap }
                ].map(domain => (
                  <button 
                    key={domain.id}
                    onClick={() => setPrefs({...prefs, domain: domain.id})}
                    className={`flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl border transition-all ${
                        prefs.domain === domain.id 
                        ? 'border-[rgb(152,16,250)] bg-purple-50/30 ring-1 ring-[rgb(152,16,250)]' 
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <domain.icon className={`w-5 h-5 ${prefs.domain === domain.id ? 'text-[rgb(152,16,250)]' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${prefs.domain === domain.id ? 'text-slate-900' : 'text-slate-500'}`}>{domain.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Dispatch Schedule</label>
              <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1.5">
                {['daily', 'weekly', 'monthly'].map(f => (
                  <button 
                    key={f}
                    onClick={() => setPrefs({...prefs, frequency: f})}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        prefs.frequency === f 
                        ? 'bg-white text-[rgb(152,16,250)] shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-50">
              <div className="grid grid-cols-2 gap-4">
                {prefs.frequency === 'weekly' && (
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Day</label>
                    <select 
                      value={prefs.deliveryDay}
                      onChange={(e) => setPrefs({...prefs, deliveryDay: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold focus:border-[rgb(152,16,250)] outline-none bg-white"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                )}
                {prefs.frequency === 'monthly' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Date</label>
                    <select 
                      value={prefs.deliveryDate}
                      onChange={(e) => setPrefs({...prefs, deliveryDate: parseInt(e.target.value)})}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold focus:border-[rgb(152,16,250)] outline-none bg-white"
                    >
                      {Array.from({length: 28}, (_, i) => i + 1).map(d => (
                        <option key={d} value={d}>{d}{getOrdinal(d)} of month</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2 col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Time (UTC)</label>
                  <input 
                    type="time" 
                    value={prefs.deliveryTime}
                    onChange={(e) => setPrefs({...prefs, deliveryTime: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 text-sm font-bold focus:border-[rgb(152,16,250)] outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* TOPICS */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Intelligence Topics</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="e.g. Energy Storage, Robotics..."
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                  className="flex-1 h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:border-[rgb(152,16,250)] outline-none"
                />
                <button 
                  onClick={addTopic}
                  className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-all shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                {PREDEFINED_TOPICS.map(t => (
                  <button 
                    key={t}
                    onClick={() => toggleTopic(t)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        prefs.topics.includes(t) 
                        ? 'bg-[rgb(152,16,250)] border-[rgb(152,16,250)] text-white shadow-md' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
                {userAddedTopics.map(t => (
                  <div key={t} className="relative group">
                    <button 
                      onClick={() => toggleTopic(t)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          prefs.topics.includes(t) 
                          ? 'bg-[rgb(152,16,250)] border-[rgb(152,16,250)] text-white shadow-md' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                    <button 
                      onClick={(e) => deleteCustomTopic(e, t)} 
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20"
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* KEYWORDS */}
            <div className="space-y-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Deep Tracking Keywords</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="e.g. LLMs, Proteomics..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  className="flex-1 h-12 px-4 rounded-xl border border-slate-200 text-sm font-medium focus:border-[rgb(152,16,250)] outline-none"
                />
                <button 
                  onClick={addKeyword}
                  className="w-12 h-12 rounded-xl bg-[rgb(152,16,250)] text-white flex items-center justify-center hover:bg-[rgb(130,10,220)] transition-all shadow-lg shadow-purple-100"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                {suggestedKeywords.map(k => (
                  <button 
                    key={k}
                    onClick={() => toggleKeyword(k)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        prefs.keywords.includes(k) 
                        ? 'bg-[rgb(152,16,250)] border-[rgb(152,16,250)] text-white shadow-md' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {k}
                  </button>
                ))}
                {userAddedKeywords.map(k => (
                  <div key={k} className="relative group">
                    <button 
                      onClick={() => toggleKeyword(k)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          prefs.keywords.includes(k) 
                          ? 'bg-[rgb(152,16,250)] border-[rgb(152,16,250)] text-white shadow-md' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {k}
                    </button>
                    <button 
                      onClick={(e) => deleteCustomKeyword(e, k)} 
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20"
                    >
                      <X className="w-3 h-3 stroke-[3]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Density</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                        {['concise', 'detailed'].map(l => (
                            <button 
                                key={l}
                                onClick={() => setPrefs({...prefs, summaryLength: l})}
                                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${prefs.summaryLength === l ? 'bg-white text-[rgb(152,16,250)] shadow-sm' : 'text-slate-500'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Intelligent Filter</label>
                    <button 
                        onClick={() => setPrefs({...prefs, duplicateFiltering: !prefs.duplicateFiltering})}
                        className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all border flex items-center justify-between ${
                            prefs.duplicateFiltering ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'
                        }`}
                    >
                        <span>Deduplication</span>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${prefs.duplicateFiltering ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${prefs.duplicateFiltering ? 'left-[18px]' : 'left-0.5'}`} />
                        </div>
                    </button>
                </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Compiling initial feed...</p>
                  <p className="text-[11px] text-slate-400 mt-1">Your intelligence pipeline is now active.</p>
                </div>
            </div>
            
            <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-[rgb(152,16,250)] flex items-center justify-center text-white shadow-lg shrink-0">
                    <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Subscription Active</h3>
                    <p className="text-[12px] text-[rgb(152,16,250)] font-bold">{getConfirmationText()}</p>
                </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-100 space-y-3">
            <button 
                onClick={handleNext} 
                disabled={isGenerating}
                className={`w-full h-14 bg-[rgb(152,16,250)] text-white font-black rounded-xl transition-all text-base flex items-center justify-center gap-2 shadow-xl hover:shadow-purple-100 active:scale-[0.98] ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : step === 3 ? "Launch Dashboard" : "Sync Profile"}
                {!isGenerating && <ChevronRight className="w-5 h-5" />}
            </button>
            
            {step > 1 && !isGenerating && (
                <button 
                    onClick={handleBack} 
                    className="w-full h-12 text-slate-400 font-bold rounded-xl hover:text-slate-600 transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Go back
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
