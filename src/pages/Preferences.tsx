
import React, { useState, useEffect } from 'react';
import {
  Save, Check, Plus, X,
  Clock, CheckCircle, RefreshCw as RefreshIcon,
  Lock, Sliders, Layers, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { TOPIC_CATEGORIES, KEYWORD_RECOMMENDATIONS, INITIAL_PREFERENCES, getTopicsForSource, getKeywordsForSource } from '../constants';
import { DeliveryFrequency, ContentSource, UserPreferences } from '../types';
import { api } from '../services/api';
import { authService } from '../services/authService';

const Preferences = () => {
  const [prefs, setPrefs] = useState<UserPreferences>(INITIAL_PREFERENCES);
  const [keywordInput, setKeywordInput] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [customTopicPool, setCustomTopicPool] = useState<string[]>([]);
  const [customKeywordPool, setCustomKeywordPool] = useState<string[]>([]);

  // Domain-aware suggestions based on selected source
  const domainTopics = getTopicsForSource(prefs.source);
  const domainKeywords = getKeywordsForSource(prefs.source);

  // Dynamic placeholders based on source
  const getTopicPlaceholder = () => {
    switch (prefs.source) {
      case ContentSource.ACADEMIC:
        return 'e.g. Neuroscience, Climate Science...';
      case ContentSource.INDUSTRY:
        return 'e.g. Cloud Computing, Cybersecurity...';
      case ContentSource.FINANCIAL:
        return 'e.g. Cryptocurrency, Real Estate...';
      default:
        return 'e.g. Machine Learning, FinTech...';
    }
  };

  const getKeywordPlaceholder = () => {
    switch (prefs.source) {
      case ContentSource.ACADEMIC:
        return 'e.g. Peer Review, Clinical Trials...';
      case ContentSource.INDUSTRY:
        return 'e.g. Kubernetes, DevOps...';
      case ContentSource.FINANCIAL:
        return 'e.g. Gold Prices, Inflation...';
      default:
        return 'e.g. Neural Networks, Market Trends...';
    }
  };

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const userData = localStorage.getItem('user_data');
        if (!userData) return;

        const user = JSON.parse(userData);
        const currentUser = await api.getUserById(user.id);

        if (currentUser && currentUser.preferences) {
          const userPrefs = currentUser.preferences;
          const userTopics = userPrefs.topics || ['Artificial Intelligence'];
          const userKeywords = userPrefs.keywords || ['LLMs', 'Neural Networks'];

          // Map source type to ContentSource enum
          let sourceEnum = ContentSource.BOTH;
          if (userPrefs.source === 'academic') sourceEnum = ContentSource.ACADEMIC;
          else if (userPrefs.source === 'industry') sourceEnum = ContentSource.INDUSTRY;
          else if (userPrefs.source === 'financial') sourceEnum = ContentSource.FINANCIAL;

          setPrefs({
            ...INITIAL_PREFERENCES,
            email: currentUser.email || '',
            topics: userTopics,
            keywords: userKeywords,
            frequency: (userPrefs.frequency?.toUpperCase() as DeliveryFrequency) || DeliveryFrequency.DAILY,
            deliveryTime: userPrefs.deliveryTime || '09:00',
            deliveryDay: userPrefs.deliveryDay || 'Monday',
            deliveryDate: userPrefs.deliveryDate || 1,
            source: sourceEnum,
            summaryLength: userPrefs.summaryLength || 'concise',
            duplicateFiltering: userPrefs.duplicateFiltering !== undefined ? userPrefs.duplicateFiltering : true
          });

          // Extract custom topics
          const customTopics = userTopics.filter((t: string) => !TOPIC_CATEGORIES.includes(t));
          setCustomTopicPool(customTopics);

          // Extract custom keywords
          const customKws = userKeywords.filter((k: string) => !KEYWORD_RECOMMENDATIONS.includes(k));
          setCustomKeywordPool(customKws);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        toast.error('Failed to load preferences');
      }
    };

    loadPreferences();
  }, []);

  const handleSave = async () => {
    setSaveStatus('saving');

    try {
      const userData = localStorage.getItem('user_data');
      if (!userData) {
        toast.error('User not found. Please sign in again.');
        setSaveStatus('idle');
        return;
      }

      const user = JSON.parse(userData);

      // Map ContentSource enum to backend format
      let sourceType: 'academic' | 'industry' | 'financial' | 'both' = 'both';
      if (prefs.source === ContentSource.ACADEMIC) sourceType = 'academic';
      else if (prefs.source === ContentSource.INDUSTRY) sourceType = 'industry';
      else if (prefs.source === ContentSource.FINANCIAL) sourceType = 'financial';
      else sourceType = 'both';

      // Update user preferences in backend (without auto-scraping)
      const result: any = await api.updateUserPreferences(user.id, {
        topics: prefs.topics,
        keywords: prefs.keywords,
        source: sourceType,
        frequency: prefs.frequency.toLowerCase() as 'daily' | 'weekly' | 'monthly',
        summaryLength: prefs.summaryLength,
        duplicateFiltering: prefs.duplicateFiltering,
        deliveryTime: prefs.deliveryTime,
        deliveryDay: prefs.deliveryDay,
        deliveryDate: prefs.deliveryDate,
        autoScrape: false  // Don't auto-scrape when saving preferences
      });

      // Update user data in localStorage with new preferences
      const updatedUser = {
        ...user,
        preferences: {
          topics: prefs.topics,
          keywords: prefs.keywords,
          source: sourceType,
          frequency: prefs.frequency.toLowerCase(),
          summaryLength: prefs.summaryLength,
          duplicateFiltering: prefs.duplicateFiltering,
          deliveryTime: prefs.deliveryTime,
          deliveryDay: prefs.deliveryDay,
          deliveryDate: prefs.deliveryDate
        }
      };

      // Use authService to update user data properly
      authService.updateUser(updatedUser);

      // Show success message (no auto-scraping)
      toast.success('Preferences saved! Go to Discover and click "Scrape" or "Refresh" to find articles.', {
        duration: 4000
      });

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
      setSaveStatus('idle');
    }
  };

  // Topics Handlers
  const toggleTopic = (topic: string) => {
    setPrefs(prev => ({
      ...prev,
      topics: prev.topics.includes(topic) 
        ? prev.topics.filter(t => t !== topic) 
        : [...prev.topics, topic]
    }));
  };

  const addTopic = () => {
    if (!topicInput.trim()) {
      toast.info('Enter a valid topic name.');
      return;
    }
    const val = topicInput.trim();
    // Check if it's not already in domain topics or custom pool
    if (!customTopicPool.includes(val) && !domainTopics.includes(val)) {
      setCustomTopicPool(prev => [...prev, val]);
    }
    if (!prefs.topics.includes(val)) {
      setPrefs(prev => ({ ...prev, topics: [...prev.topics, val] }));
    }
    setTopicInput('');
  };

  const removeCustomTopicFromPool = (e: React.MouseEvent, t: string) => {
    e.stopPropagation();
    setCustomTopicPool(prev => prev.filter(x => x !== t));
    setPrefs(prev => ({ ...prev, topics: prev.topics.filter(x => x !== t) }));
  };

  // Keywords Handlers
  const toggleKeyword = (kw: string) => {
    setPrefs(prev => ({
      ...prev,
      keywords: prev.keywords.includes(kw) 
        ? prev.keywords.filter(k => k !== kw) 
        : [...prev.keywords, kw]
    }));
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) {
      toast.info('Enter a specific keyword.');
      return;
    }
    const val = keywordInput.trim();
    // Check if it's not already in domain keywords or custom pool
    if (!customKeywordPool.includes(val) && !domainKeywords.includes(val)) {
      setCustomKeywordPool(prev => [...prev, val]);
    }
    if (!prefs.keywords.includes(val)) {
      setPrefs(prev => ({ ...prev, keywords: [...prev.keywords, val] }));
    }
    setKeywordInput('');
  };

  const removeCustomKeywordFromPool = (e: React.MouseEvent, k: string) => {
    e.stopPropagation();
    setCustomKeywordPool(prev => prev.filter(x => x !== k));
    setPrefs(prev => ({ ...prev, keywords: prev.keywords.filter(x => x !== k) }));
  };

  const unsubscribe = () => {
    if (window.confirm('Irreversibly terminate your research dispatches?')) {
      const userName = localStorage.getItem('userName');
      const users = JSON.parse(localStorage.getItem('news_users') || '[]');
      const filtered = users.filter((u: any) => u.name !== userName);
      localStorage.setItem('news_users', JSON.stringify(filtered));
      localStorage.clear();
      toast.info("Subscription terminated.");
      window.location.href = '#/login';
    }
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-40">
      <div className="space-y-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Protocols</h1>
        <p className="text-slate-500 font-medium">Fine-tune your research automation and delivery vectors.</p>
      </div>

      <div className="grid gap-8">
        {/* Delivery Section */}
        <section className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-[rgb(152,16,250)] border border-purple-100">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black leading-tight">Delivery Scheduling</h2>
              <p className="text-sm font-medium text-slate-400">Manage dispatch window and sequence frequency</p>
            </div>
          </div>
          <div className="p-10 space-y-10">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 block">Sequence Frequency</label>
              <div className="grid sm:grid-cols-3 gap-6">
                {[
                  { id: DeliveryFrequency.DAILY, label: 'Daily', sub: 'Every 24 hours' },
                  { id: DeliveryFrequency.WEEKLY, label: 'Weekly', sub: 'Standard cycle' },
                  { id: DeliveryFrequency.MONTHLY, label: 'Monthly', sub: 'Global wrap-up' }
                ].map((freq) => (
                  <button 
                    key={freq.id}
                    onClick={() => setPrefs({...prefs, frequency: freq.id})}
                    className={`text-left p-6 rounded-2xl border transition-all ${
                      prefs.frequency === freq.id 
                      ? 'border-[rgb(152,16,250)] bg-white ring-2 ring-[rgb(152,16,250)] shadow-lg shadow-purple-50' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <p className={`text-lg font-bold ${prefs.frequency === freq.id ? 'text-black' : 'text-slate-600'}`}>{freq.label}</p>
                    <p className="text-sm text-slate-400 font-medium mt-1">{freq.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-slate-50">
              {prefs.frequency === DeliveryFrequency.WEEKLY && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Delivery Vector (Day)</label>
                  <select 
                    value={prefs.deliveryDay}
                    onChange={(e) => setPrefs({...prefs, deliveryDay: e.target.value})}
                    className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:border-[rgb(152,16,250)] outline-none"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
              {prefs.frequency === DeliveryFrequency.MONTHLY && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Monthly Trigger (Date)</label>
                  <select 
                    value={prefs.deliveryDate}
                    onChange={(e) => setPrefs({...prefs, deliveryDate: parseInt(e.target.value)})}
                    className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:border-[rgb(152,16,250)] outline-none"
                  >
                    {Array.from({length: 28}, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}{getOrdinal(d)} of month</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Target Window (UTC)</label>
                <input 
                  type="time" 
                  value={prefs.deliveryTime}
                  onChange={(e) => setPrefs({...prefs, deliveryTime: e.target.value})}
                  className="w-full h-14 px-5 rounded-xl border border-slate-200 bg-white text-sm font-bold focus:border-[rgb(152,16,250)] outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Content Signals */}
        <section className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
              <Sliders className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black leading-tight">Content Filters</h2>
              <p className="text-sm font-medium text-slate-400">Define interest domains and deep-tracking signals</p>
            </div>
          </div>
          <div className="p-10 space-y-12">
            
            {/* Topics */}
            <div className="space-y-6">
              <label className="text-sm font-bold text-slate-700 block">Interest Domains (Topics)</label>
              <div className="flex gap-3 max-w-xl">
                <input
                  type="text"
                  placeholder={getTopicPlaceholder()}
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTopic()}
                  className="flex-1 h-14 px-5 rounded-xl border border-slate-200 text-base focus:border-[rgb(152,16,250)] outline-none transition-all shadow-sm"
                />
                <button onClick={addTopic} className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:bg-black transition-all shadow-lg"><Plus className="w-6 h-6" /></button>
              </div>
              <div className="flex flex-wrap gap-5 pt-2">
                {domainTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`px-6 py-4 rounded-xl text-sm font-bold border transition-all ${
                      prefs.topics.includes(topic)
                      ? 'bg-[rgb(152,16,250)] text-white border-[rgb(152,16,250)] shadow-xl shadow-purple-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
                {customTopicPool.filter(t => !domainTopics.includes(t)).map(t => (
                  <div key={t} className="relative group">
                    <button
                      onClick={() => toggleTopic(t)}
                      className={`px-6 py-4 rounded-xl text-sm font-bold border transition-all ${
                        prefs.topics.includes(t)
                        ? 'bg-[rgb(152,16,250)] text-white border-[rgb(152,16,250)] shadow-xl shadow-purple-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                    <button
                      onClick={(e) => removeCustomTopicFromPool(e, t)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20"
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-6">
              <label className="text-sm font-bold text-slate-700 block">Deep Tracking (Keywords)</label>
              <div className="flex gap-3 max-w-xl">
                <input
                  type="text"
                  placeholder={getKeywordPlaceholder()}
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  className="flex-1 h-14 px-5 rounded-xl border border-slate-200 text-base focus:border-[rgb(152,16,250)] outline-none transition-all shadow-sm"
                />
                <button onClick={addKeyword} className="w-14 h-14 rounded-xl bg-[rgb(152,16,250)] text-white flex items-center justify-center hover:bg-[rgb(130,10,220)] transition-all shadow-lg shadow-purple-100"><Plus className="w-6 h-6" /></button>
              </div>
              <div className="flex flex-wrap gap-5 pt-2">
                {domainKeywords.map(kw => (
                  <button
                    key={kw}
                    onClick={() => toggleKeyword(kw)}
                    className={`px-6 py-4 rounded-xl text-sm font-bold border transition-all ${
                      prefs.keywords.includes(kw)
                      ? 'bg-[rgb(152,16,250)] text-white border-[rgb(152,16,250)] shadow-xl shadow-purple-200'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {kw}
                  </button>
                ))}
                {customKeywordPool.filter(k => !domainKeywords.includes(k)).map(k => (
                  <div key={k} className="relative group">
                    <button
                      onClick={() => toggleKeyword(k)}
                      className={`px-6 py-4 rounded-xl text-sm font-bold border transition-all ${
                        prefs.keywords.includes(k)
                        ? 'bg-[rgb(152,16,250)] text-white border-[rgb(152,16,250)] shadow-xl shadow-purple-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {k}
                    </button>
                    <button
                      onClick={(e) => removeCustomKeywordFromPool(e, k)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20"
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Research Sources */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 block">Research Sources</label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: ContentSource.ACADEMIC, label: 'Academic', sub: 'Scholarly papers', icon: '🎓' },
                  { id: ContentSource.INDUSTRY, label: 'Industry', sub: 'Tech & business', icon: '🏢' },
                  { id: ContentSource.FINANCIAL, label: 'Financial', sub: 'Markets & finance', icon: '💰' },
                  { id: ContentSource.BOTH, label: 'All Sources', sub: 'Complete coverage', icon: '🌐' }
                ].map((src) => (
                  <button
                    key={src.id}
                    onClick={() => setPrefs({...prefs, source: src.id})}
                    className={`text-left p-6 rounded-2xl border transition-all ${
                      prefs.source === src.id
                      ? 'border-[rgb(152,16,250)] bg-white ring-2 ring-[rgb(152,16,250)] shadow-lg shadow-purple-50'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="text-2xl mb-2">{src.icon}</div>
                    <p className={`text-base font-bold ${prefs.source === src.id ? 'text-black' : 'text-slate-600'}`}>
                      {src.label}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">{src.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 block">Synthesis Density</label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                  {[
                    { id: 'concise', label: 'Concise', sub: 'Brief takeaways' },
                    { id: 'detailed', label: 'Detailed', sub: 'Technical analysis' }
                  ].map(l => (
                    <button 
                      key={l.id}
                      onClick={() => setPrefs({...prefs, summaryLength: l.id as 'concise' | 'detailed'})}
                      className={`flex-1 p-4 rounded-xl transition-all ${
                        prefs.summaryLength === l.id 
                        ? 'bg-white text-[rgb(152,16,250)] shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <p className="text-sm font-black">{l.label}</p>
                      <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{l.sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 block">System Intelligence</label>
                <button 
                  onClick={() => setPrefs({...prefs, duplicateFiltering: !prefs.duplicateFiltering})}
                  className={`w-full p-6 rounded-2xl border transition-all flex items-center justify-between ${
                    prefs.duplicateFiltering 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700 ring-2 ring-emerald-500/10' 
                    : 'bg-slate-50 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${prefs.duplicateFiltering ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">Deduplication Logic</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Minimize signal redundancy</p>
                    </div>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${prefs.duplicateFiltering ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${prefs.duplicateFiltering ? 'left-7' : 'left-1'}`} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Access Settings */}
        <section className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black leading-tight">Advanced Controls</h2>
              <p className="text-sm font-medium text-slate-400">Manage security and account termination</p>
            </div>
          </div>
          <div className="p-10 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Revoke Subscription</h3>
              <p className="text-base text-slate-500 font-normal leading-relaxed max-w-lg">Permanently stop all automated research dispatches and wipe historical archives.</p>
            </div>
            <button 
              onClick={unsubscribe}
              className="h-16 px-10 bg-white border border-rose-200 text-rose-600 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-50 transition-all shadow-sm active:scale-[0.98] whitespace-nowrap"
            >
              Terminate Dispatch
            </button>
          </div>
        </section>
      </div>

      <div className="fixed bottom-10 right-10 lg:left-[320px] lg:right-10 z-[70] transition-all">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-8 rounded-[3rem] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="hidden sm:block pl-4">
              <p className="text-base font-bold text-black">Unapplied Protocol Changes</p>
              <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">Requires system re-synchronization</p>
            </div>
            <button 
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="h-16 px-16 bg-[rgb(152,16,250)] text-white font-black rounded-[2rem] text-xs uppercase tracking-widest hover:bg-[rgb(130,10,220)] transition-all flex items-center gap-4 shadow-2xl shadow-purple-200 active:scale-[0.98] disabled:opacity-50"
            >
              {saveStatus === 'saving' ? <RefreshIcon className="w-5 h-5 animate-spin" /> : saveStatus === 'saved' ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saveStatus === 'saving' ? 'Processing...' : saveStatus === 'saved' ? 'Protocols Updated' : 'Apply System Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
