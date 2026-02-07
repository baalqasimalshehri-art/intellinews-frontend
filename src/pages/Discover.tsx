
import React, { useState, useEffect } from 'react';
import {
  Search, FileText,
  Bookmark, Share2, ArrowRight,
  ArrowLeft, Loader2, Sparkles, TrendingUp, Brain, Zap, Clock, Download, Settings, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../services/api';
import { authService } from '../services/authService';
import { useScrapingJob } from '../hooks/useScrapingJob';
import type { ArticleSummary } from '../types';

const Discover = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarks, setBookmarks] = useState<ArticleSummary[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [activeTab, setActiveTab] = useState<'explore' | 'saved'>('explore');
  const [selectedArticle, setSelectedArticle] = useState<ArticleSummary | null>(null);
  const [discoveredArticles, setDiscoveredArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scraping job tracking
  const { jobStatus, isActive: isJobActive, checkForActiveJob, startPolling, cancelJob } = useScrapingJob();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('saved_signals_data') || '[]');
    setBookmarks(saved);

    // Check for active scraping job on mount
    checkForActiveJob();

    // Auto-discover articles on mount based on user preferences
    discoverArticles();
  }, []);

  const discoverArticles = async (skipCache = false) => {
    setLoading(true);
    setError(null);

    try {
      // Get current user from authService
      const user = authService.getUser();

      if (!user) {
        toast.error('Please sign in to discover articles.');
        navigate('/login');
        return;
      }

      const prefs = user.preferences || {};

      // Check if user has set preferences
      console.log('[Discover] User preferences:', prefs);
      console.log('[Discover] Topics:', prefs.topics);

      if (!prefs.topics || (Array.isArray(prefs.topics) && prefs.topics.length === 0)) {
        console.log('[Discover] No topics found, showing empty state');
        setDiscoveredArticles([]);
        setLoading(false);
        setError('No preferences set. Please set your topics and keywords first.');
        return;
      }

      const topics = prefs.topics || ['AI', 'Machine Learning'];
      const keywords = prefs.keywords || [];
      const source = prefs.source || 'both';

      // Map source to backend format
      let sourceType: 'academic' | 'industry' | 'financial' | 'both' = 'both';
      if (source === 'academic') sourceType = 'academic';
      else if (source === 'industry') sourceType = 'industry';
      else if (source === 'financial') sourceType = 'financial';

      // Check cache first (unless skipCache is true)
      // Include source type in cache key so changing source invalidates cache
      if (!skipCache) {
        const cachedArticles = localStorage.getItem(`discover_articles_${user.id}_${sourceType}`);
        const cachedTimestamp = localStorage.getItem(`discover_articles_timestamp_${user.id}_${sourceType}`);

        if (cachedArticles && cachedTimestamp) {
          const cacheAge = Date.now() - parseInt(cachedTimestamp);
          const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

          if (cacheAge < CACHE_TTL) {
            // Cache is still valid, use cached data
            const articles = JSON.parse(cachedArticles);
            setDiscoveredArticles(articles);
            setLoading(false);
            return;
          }
        }
      }

      // Clear existing articles for fresh discovery
      setDiscoveredArticles([]);

      // Sequential discovery: Fetch articles in batches of 2
      const BATCH_SIZE = 2;
      const TOTAL_LIMIT = 20;
      let offset = 0;
      const allArticles: ArticleSummary[] = [];

      while (offset < TOTAL_LIMIT) {
        console.log(`[Discover] Fetching batch at offset ${offset}...`);

        // Fetch batch of articles
        const rankedArticles = await api.discoverArticles({
          userId: user.id,
          topics,
          keywords,
          sourceType,
          limit: BATCH_SIZE,
          offset
        });

        // Break if no more articles
        if (!rankedArticles || rankedArticles.length === 0) {
          console.log('[Discover] No more articles found');
          break;
        }

        // Transform batch
        const transformedBatch: ArticleSummary[] = rankedArticles.map(article => ({
          id: article.id,
          title: article.title,
          source: article.source,
          sourceType: article.sourceType,
          summary: article.summary,
          keyPoints: article.keyPoints || [],
          tags: article.tags || [],
          url: article.url,
          content: article.content,
          publishedDate: article.publishedDate,
          relevanceScore: article.relevanceScore,
          freshnessScore: article.freshnessScore,
          finalScore: article.finalScore,
          reasoning: article.reasoning
        }));

        // Add to all articles
        allArticles.push(...transformedBatch);

        // Update UI immediately with new batch (progressive display)
        setDiscoveredArticles([...allArticles]);

        console.log(`[Discover] Displayed ${allArticles.length} articles so far`);

        // Move to next batch
        offset += BATCH_SIZE;

        // Small delay between batches for better UX (optional)
        if (offset < TOTAL_LIMIT && transformedBatch.length === BATCH_SIZE) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Update cache with all discovered articles (include source type in cache key)
      localStorage.setItem(`discover_articles_${user.id}_${sourceType}`, JSON.stringify(allArticles));
      localStorage.setItem(`discover_articles_timestamp_${user.id}_${sourceType}`, Date.now().toString());

      if (allArticles.length === 0) {
        toast.info('No articles found. Try adjusting your preferences or run the scraper.');
        setError('No articles found in database.');
      } else {
        // Success message with final count
        if (skipCache) {
          toast.success(`Refreshed! Found ${allArticles.length} intelligent matches.`);
        } else {
          toast.success(`Discovered ${allArticles.length} intelligent matches using RAG retrieval.`);
        }
      }
    } catch (err: any) {
      console.error('Discovery error:', err);
      setError(err.message || 'Failed to discover articles');

      // Check if it's a database empty error or backend error
      if (err.message && err.message.includes('Not authenticated')) {
        toast.error('Please sign in to discover articles.');
        navigate('/login');
      } else if (err.message && (err.message.includes('500') || err.message.includes('Internal Server Error'))) {
        toast.error('Backend error. The database may be empty. Try scraping articles first.');
      } else {
        toast.warning('No articles found in database. Click "Scrape" to fetch personalized content!');
      }

      // Set empty array instead of sample data
      setDiscoveredArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeArticles = async () => {
    try {
      // Start background scraping job
      const result = await api.startBackgroundScrapingJob(10);

      // Start polling for job status
      startPolling(result.job_id);

      // Initial notification
      toast.info('Starting to find articles for you...', { duration: 3000 });
    } catch (error: any) {
      console.error('Scraping error:', error);

      // Better error messages
      if (error.message && error.message.includes('Not authenticated')) {
        toast.error('Please sign in to scrape articles.');
        navigate('/login');
      } else if (error.message && error.message.includes('set your preferences')) {
        toast.error('Please set your preferences (topics) before scraping.', {
          action: {
            label: 'Set Preferences',
            onClick: () => navigate('/preferences')
          }
        });
      } else {
        toast.error(error.message || 'Failed to start scraping. Please try again.');
      }
    }
  };

  // Auto-refresh articles when job completes
  useEffect(() => {
    if (jobStatus && jobStatus.status === 'completed') {
      // Job completed, refresh the article feed
      setTimeout(() => {
        discoverArticles();
      }, 2000);
    }
  }, [jobStatus?.status]);

  const toggleBookmark = (article: ArticleSummary) => {
    const isBookmarked = bookmarks.find(b => b.id === article.id);
    let updated;
    if (isBookmarked) {
      updated = bookmarks.filter(b => b.id !== article.id);
      toast.success('Removed from personal archive.');
    } else {
      updated = [...bookmarks, article];
      toast.success('Saved to personal archive.');
    }
    setBookmarks(updated);
    localStorage.setItem('saved_signals_data', JSON.stringify(updated));
  };

  const handleOpenDetail = (article: ArticleSummary) => {
    setSelectedArticle(article);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedArticle(null);
  };

  const handleShare = async (article: ArticleSummary, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareData = {
      title: `Intelligence Signal: ${article.title}`,
      text: `${article.title} - ${article.summary}`,
      url: article.url || window.location.origin + '/#/discover'
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}\n\nRead more: ${shareData.url}`);
        toast.success('Signal details copied to clipboard!');
      }
    }
  };

  const getFreshnessLabel = (score: number = 0) => {
    if (score >= 0.9) return { label: 'Just Published', color: 'emerald' };
    if (score >= 0.7) return { label: 'Recent', color: 'blue' };
    if (score >= 0.5) return { label: 'Fresh', color: 'cyan' };
    return { label: 'Archive', color: 'slate' };
  };

  const getSourceTypeColor = (type?: string) => {
    switch (type) {
      case 'academic': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'industry': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'financial': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const filteredExplore = discoveredArticles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSaved = bookmarks.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayArticles = activeTab === 'explore' ? filteredExplore : filteredSaved;

  // Detail View
  if (viewMode === 'detail' && selectedArticle) {
    const isBookmarked = bookmarks.find(b => b.id === selectedArticle.id);
    const freshness = getFreshnessLabel(selectedArticle.freshnessScore);

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-1 lg:px-0">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Intelligence Feed
        </button>

        <div className="bg-white border border-slate-100 rounded-2xl p-8 lg:p-12 shadow-sm space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${getSourceTypeColor(selectedArticle.sourceType)}`}>
                {selectedArticle.sourceType || 'general'}
              </span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                Source: {selectedArticle.source}
              </span>
              {selectedArticle.freshnessScore && (
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border bg-${freshness.color}-50 text-${freshness.color}-600 border-${freshness.color}-100`}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  {freshness.label}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-black leading-tight">
              {selectedArticle.title}
            </h1>

            <div className="flex flex-wrap gap-2">
              {selectedArticle.tags.map((tag: string) => (
                <span key={tag} className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* AI Reasoning Section */}
          {selectedArticle.reasoning && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-purple-600">
                <Brain className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-widest">AI Selection Reasoning</h3>
              </div>
              <p className="text-base text-slate-700 leading-relaxed font-normal">
                {selectedArticle.reasoning}
              </p>
            </div>
          )}

          {/* Scores Section */}
          <div className="grid grid-cols-3 gap-4">
            {selectedArticle.relevanceScore !== undefined && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[rgb(152,16,250)]">
                  {Math.round(selectedArticle.relevanceScore * 100)}%
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
                  Relevance
                </div>
              </div>
            )}
            {selectedArticle.freshnessScore !== undefined && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {Math.round(selectedArticle.freshnessScore * 100)}%
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
                  Freshness
                </div>
              </div>
            )}
            {selectedArticle.finalScore !== undefined && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(selectedArticle.finalScore * 100)}%
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">
                  Final Score
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-semibold text-black uppercase tracking-widest border-b border-slate-50 pb-3">Executive Summary</h3>
            <div className="prose prose-slate max-w-none text-base font-normal text-slate-600 leading-relaxed space-y-4">
              <p>{selectedArticle.summary}</p>
            </div>
          </div>

          {selectedArticle.keyPoints && selectedArticle.keyPoints.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-black uppercase tracking-widest border-b border-slate-50 pb-3">Key Points</h3>
              <ul className="space-y-2">
                {selectedArticle.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-base text-slate-600">
                    <Zap className="w-5 h-5 text-[rgb(152,16,250)] shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => toggleBookmark(selectedArticle)}
              className={`h-14 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-3 ${isBookmarked
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : 'bg-black text-white hover:bg-slate-900 shadow-lg active:scale-95'
                }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              {isBookmarked ? 'Saved to Archive' : 'Save Signal'}
            </button>
            <button
              onClick={(e) => handleShare(selectedArticle, e)}
              className="h-14 border border-slate-200 text-black font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 text-sm shadow-sm active:scale-95"
            >
              <Share2 className="w-4 h-4" /> Share Intelligence
            </button>
          </div>

          {selectedArticle.url && (
            <a
              href={selectedArticle.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-3 text-sm shadow-lg"
            >
              <ArrowRight className="w-5 h-5" /> Read Full Article
            </a>
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-[rgb(152,16,250)]" />
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">AI-Powered Discovery</h2>
          </div>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">
            Intelligent article ranking using RAG retrieval, semantic search, and context-aware AI
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[rgb(152,16,250)] transition-colors" />
            <input
              type="text"
              placeholder="Search breakthroughs, patents, or research trends..."
              className="w-full h-16 pl-14 pr-6 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:border-[rgb(152,16,250)] outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'explore' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Archive ({bookmarks.length})
            </button>
          </div>

          <div className="flex gap-3">
            {/* Cancel button - only show when job is active */}
            {isJobActive && (
              <button
                onClick={cancelJob}
                className="h-16 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all flex items-center gap-3 shadow-lg text-sm"
                title="Cancel analysis"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            )}

            <button
              onClick={handleScrapeArticles}
              disabled={isJobActive || loading}
              className="h-16 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center gap-3 shadow-lg text-sm"
              title={jobStatus?.message || 'Find new articles'}
            >
              {isJobActive ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="truncate max-w-[150px]">
                    {jobStatus?.current_step === 'fetching_academic' ? 'Finding papers...' :
                     jobStatus?.current_step === 'fetching_industry' ? 'Finding articles...' :
                     jobStatus?.current_step === 'fetching_financial' ? 'Finding news...' :
                     jobStatus?.current_step === 'processing' ? 'Analyzing...' :
                     'Working...'}
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Scrape
                </>
              )}
            </button>

            <button
              onClick={() => discoverArticles(true)}
              disabled={loading || isJobActive}
              className="h-16 px-8 bg-[rgb(152,16,250)] text-white font-bold rounded-2xl hover:bg-purple-700 transition-all flex items-center gap-3 shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {loading ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-20 text-center space-y-4 shadow-sm">
            <Loader2 className="w-16 h-16 text-[rgb(152,16,250)] animate-spin mx-auto" />
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-black">Analyzing preferences...</h4>
              <p className="text-sm text-slate-500 font-normal">Running RAG retrieval and AI ranking</p>
            </div>
          </div>
        ) : displayArticles.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-20 text-center space-y-6 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mx-auto text-slate-300">
              <Bookmark className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-black">No articles found</h4>
              <p className="text-sm text-slate-500 font-normal max-w-md mx-auto">
                {error && error.includes('No preferences set')
                  ? 'Please set your topics and keywords to discover personalized articles.'
                  : error
                    ? 'The database is empty. Click the "Scrape" button above to fetch fresh articles based on your preferences.'
                    : 'Try adjusting your preferences or run the scraper to populate the database.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => navigate('/preferences')}
                className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-semibold hover:border-[rgb(152,16,250)] hover:text-[rgb(152,16,250)] transition-all flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Change Preferences
              </button>
              {error && !error.includes('No preferences set') && (
                <button
                  onClick={() => handleScrapeArticles()}
                  className="px-6 py-3 bg-[rgb(152,16,250)] text-white rounded-xl font-semibold hover:bg-[rgb(132,0,230)] transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Scrape Articles
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {displayArticles.map((article) => {
              const isBookmarked = bookmarks.find(b => b.id === article.id);
              const freshness = getFreshnessLabel(article.freshnessScore);

              return (
                <div
                  key={article.id}
                  onClick={() => handleOpenDetail(article)}
                  className="bg-white border border-slate-100 rounded-3xl p-8 hover:border-[rgb(152,16,250)] transition-all group cursor-pointer shadow-sm flex flex-col sm:flex-row gap-8 relative overflow-hidden"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[rgb(152,16,250)] group-hover:bg-[rgb(152,16,250)] group-hover:text-white transition-all shrink-0">
                    <FileText className="w-8 h-8" />
                  </div>

                  <div className="flex-1 space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{article.source}</span>
                          <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded border ${getSourceTypeColor(article.sourceType)}`}>
                            {article.sourceType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {article.finalScore !== undefined && (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                              {Math.round(article.finalScore * 100)}% MATCH
                            </span>
                          )}
                          {article.freshnessScore !== undefined && (
                            <span className={`text-[9px] font-bold px-2 py-1 rounded border bg-${freshness.color}-50 text-${freshness.color}-600 border-${freshness.color}-100`}>
                              {freshness.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <h4 className="text-2xl font-black text-slate-900 group-hover:text-[rgb(152,16,250)] transition-colors leading-tight">
                        {article.title}
                      </h4>
                    </div>

                    <p className="text-base text-slate-500 line-clamp-2 leading-relaxed font-normal">
                      {article.summary}
                    </p>

                    {article.reasoning && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-lg p-3">
                        <p className="text-sm text-slate-600 line-clamp-2 italic">
                          <Brain className="w-4 h-4 inline mr-1 text-purple-600" />
                          {article.reasoning}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex gap-2 flex-wrap">
                        {article.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg uppercase tracking-tight">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-900 uppercase tracking-widest group-hover:gap-3 transition-all">
                        Full Brief <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Discover;
