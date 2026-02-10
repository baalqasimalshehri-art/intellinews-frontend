
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, History, Settings, Clock, Loader2, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';
import StatCard from '../components/dashboard/StatCard';
import ToolCard from '../components/dashboard/ToolCard';
import { api, RankedArticle } from '../services/api';
import { authService } from '../services/authService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.warn('Failed to parse localStorage value, using fallback.', error);
      return fallback;
    }
  };
  const [schedule, setSchedule] = useState<{ frequency: string; time: string; details?: string }>({
    frequency: 'Daily',
    time: '09:00 UTC'
  });
  const [stats, setStats] = useState({
    totalArticles: 0,
    academicArticles: 0,
    industryArticles: 0,
    financialArticles: 0,
    articlesLast24h: 0,
    articlesLastWeek: 0,
    topicsTracked: 0,
    savedSignals: 0
  });
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<RankedArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapingStatus, setScrapingStatus] = useState<string>('Scrape Articles');

  useEffect(() => {
    // Redirect admins to admin panel
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
      navigate('/admin');
      return;
    }

    fetchUserDataAndArticles();
  }, []);

  const fetchUserDataAndArticles = async () => {
    try {
      // Get current user from backend
      const user = authService.getUser();

      if (!user) {
        console.error('No user found in localStorage');
        setLoading(false);
        setArticlesLoading(false);
        return;
      }

      const prefs = user.preferences || {};

      // Update schedule from user preferences
      if (prefs.frequency) {
        const freq = prefs.frequency.charAt(0).toUpperCase() + prefs.frequency.slice(1);
        let details = '';
        if (prefs.frequency === 'weekly') details = `every ${prefs.deliveryDay || 'Monday'}`;
        if (prefs.frequency === 'monthly') details = `on the ${prefs.deliveryDate || 1}${getOrdinal(prefs.deliveryDate || 1)}`;

        setSchedule({
          frequency: freq,
          time: `${prefs.deliveryTime || '09:00'} ${prefs.timezone || 'UTC'}`,
          details: details
        });
      }

      // Track topics count
      const topicsCount = prefs.topics?.length || 0;
      setStats(prev => ({ ...prev, topicsTracked: topicsCount }));

      // Get saved signals count (still using localStorage for saved articles)
      const saved = safeJsonParse<any[]>(localStorage.getItem('saved_signals_data'), []);
      setStats(prev => ({ ...prev, savedSignals: saved.length }));

      // Fetch backend stats and articles in parallel
      await Promise.all([
        fetchBackendStats(),
        fetchRecommendedArticles(user.id, prefs)
      ]);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setLoading(false);
      setArticlesLoading(false);
    }
  };

  const fetchRecommendedArticles = async (userId: number, preferences: any) => {
    try {
      setArticlesLoading(true);

      // Only fetch articles if user has set preferences
      if (!preferences.topics || preferences.topics.length === 0) {
        console.log('No topics set, skipping article fetch');
        setArticlesLoading(false);
        return;
      }

      const rankedArticles = await api.discoverArticles({
        userId,
        topics: preferences.topics || [],
        keywords: preferences.keywords || [],
        sourceType: preferences.source || 'both',
        limit: 5 // Show top 5 articles on dashboard
      });

      setArticles(rankedArticles);
    } catch (error) {
      console.error('Failed to fetch recommended articles:', error);
      // Don't show error to user, just log it
    } finally {
      setArticlesLoading(false);
    }
  };

  const fetchBackendStats = async () => {
    try {
      const backendStats = await api.getArticleStats();
      const bySourceType = backendStats?.by_source_type ?? { academic: 0, industry: 0, financial: 0 };
      setStats(prev => ({
        ...prev,
        totalArticles: backendStats?.total_articles ?? 0,
        academicArticles: bySourceType.academic ?? 0,
        industryArticles: bySourceType.industry ?? 0,
        financialArticles: bySourceType.financial ?? 0,
        articlesLast24h: backendStats?.articles_last_24h ?? 0,
        articlesLastWeek: backendStats?.articles_last_week ?? 0
      }));
    } catch (error) {
      console.error('Failed to fetch backend stats:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeArticles = async () => {
    setScraping(true);
    setScrapingStatus('Initializing...');
    toast.info('Starting article scraping based on your preferences... This may take up to a minute.');

    try {
      setScrapingStatus('Fetching articles...');

      const result = await api.scrapeArticlesForMe(10);

      setScrapingStatus('Processing...');

      toast.success(
        `Successfully scraped ${result.articles_scraped} articles! ` +
        `Saved ${result.articles_saved} new articles to your library.`
      );

      // Refresh articles and stats after scraping
      setScrapingStatus('Refreshing...');
      const user = authService.getUser();
      if (user) {
        await Promise.all([
          fetchBackendStats(),
          fetchRecommendedArticles(user.id, user.preferences || {})
        ]);
      }

      setScrapingStatus('Scrape Articles');
    } catch (error: any) {
      console.error('Scraping error:', error);

      // Better error messages
      if (error.message && error.message.includes('Not authenticated')) {
        toast.error('Please sign in to scrape articles.');
        navigate('/login');
      } else if (error.message && error.message.includes('set your preferences')) {
        toast.error('Please set your preferences (topics) before scraping.');
        navigate('/preferences');
      } else {
        toast.error(error.message || 'Failed to scrape articles. Please check your internet connection and try again.');
      }

      setScrapingStatus('Scrape Articles');
    } finally {
      setScraping(false);
    }
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const metrics = [
    { label: "Total Articles", value: loading ? "..." : stats.totalArticles.toString() },
    { label: "Topics Tracked", value: stats.topicsTracked.toString() },
    { label: "Saved Signals", value: stats.savedSignals.toString() },
    { label: "Last 24h", value: loading ? "..." : stats.articlesLast24h.toString() }
  ];

  const tools = [
    {
      icon: Compass,
      title: "Search Intelligence",
      desc: "Exhaustive research summaries across global sources.",
      color: "bg-cyan-400",
      lightColor: "bg-[#E0F7FA]",
      onClick: () => navigate('/discover')
    },
    {
      icon: History,
      title: "Signal Archive",
      desc: "Review and analyze your previously dispatched insights.",
      color: "bg-[rgb(152,16,250)]",
      lightColor: "bg-[#F3E5F5]",
      onClick: () => navigate('/history')
    },
    {
      icon: Settings,
      title: "System Settings",
      desc: "Adjust topics, delivery, and density for maximum signal accuracy.",
      color: "bg-amber-500",
      lightColor: "bg-[#FFF8E1]",
      onClick: () => navigate('/preferences')
    }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Top Matrix & Cycle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Performance Matrix */}
        <div className="lg:col-span-3 flex flex-col">
          <h3 className="text-sm font-semibold text-black px-1 uppercase tracking-widest mb-6">Your Performance Matrix</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1">
            {metrics.map((m, idx) => (
              <StatCard key={idx} label={m.label} value={m.value} />
            ))}
          </div>
        </div>

        {/* Intelligence Cycle */}
        <div className="lg:col-span-1 flex flex-col self-stretch">
           <h3 className="text-sm font-semibold text-black px-1 uppercase tracking-widest mb-6">Intelligence Cycle</h3>
           <div className="bg-[rgb(152,16,250)] p-8 rounded-2xl shadow-xl shadow-purple-200 text-white space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <Clock className="w-6 h-6 text-purple-200" />
                   <span className="text-xs font-bold uppercase tracking-widest text-purple-100">Next Dispatch</span>
                </div>
                <div className="space-y-2">
                   <p className="text-3xl font-black">{schedule.frequency}</p>
                   <p className="text-base text-purple-100 font-medium leading-relaxed">{schedule.time}<br />{schedule.details}</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/preferences')}
                className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-[11px] font-black uppercase tracking-widest border border-white/20"
              >
                Reschedule Dispatch
              </button>
           </div>
        </div>
      </div>

      {/* Tools Section */}
      <section className="space-y-6">
        <h3 className="text-sm font-semibold text-black px-1 uppercase tracking-widest">Intelligence Tools</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((t, idx) => (
            <ToolCard key={idx} {...t} />
          ))}
        </div>
      </section>

      {/* Recommended Articles Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black px-1 uppercase tracking-widest">Top Intelligence Signals</h3>
          <button
            onClick={() => navigate('/discover')}
            className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 uppercase tracking-wider"
          >
            View All →
          </button>
        </div>

        {articlesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center space-y-6">
            <div>
              <p className="text-gray-600 text-sm mb-4">No articles found matching your preferences yet.</p>
              <p className="text-gray-500 text-xs">
                {stats.topicsTracked === 0
                  ? "Set your preferences to start receiving personalized intelligence."
                  : stats.totalArticles === 0
                  ? "Scrape articles to populate your personalized feed."
                  : "Articles will appear here once the system processes new content."}
              </p>
            </div>

            {stats.topicsTracked === 0 ? (
              <button
                onClick={() => navigate('/preferences')}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
              >
                Set Preferences
              </button>
            ) : stats.totalArticles === 0 ? (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleScrapeArticles}
                  disabled={scraping}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2 justify-center"
                >
                  {scraping ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {scrapingStatus}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {scrapingStatus}
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/discover')}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
                >
                  Explore Discover
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/discover')}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors"
              >
                Explore Articles
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.open(article.url, '_blank')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                        article.sourceType === 'academic' ? 'bg-blue-100 text-blue-700' :
                        article.sourceType === 'industry' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {article.sourceType}
                      </span>
                      <span className="text-xs text-gray-500">{article.source}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(article.publishedDate).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 leading-snug hover:text-cyan-600 transition-colors">
                      {article.title}
                    </h4>

                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                      {article.summary}
                    </p>

                    {article.reasoning && (
                      <div className="bg-cyan-50 border-l-4 border-cyan-500 p-3 rounded">
                        <p className="text-xs text-cyan-900 italic">
                          <span className="font-bold">Why recommended: </span>
                          {article.reasoning}
                        </p>
                      </div>
                    )}

                    {article.tags && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {article.tags.slice(0, 4).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-medium rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-cyan-600">
                        {Math.round(article.finalScore * 100)}
                      </span>
                      <span className="text-xs text-gray-500">score</span>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
