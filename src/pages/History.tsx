import React, { useState, useEffect } from 'react';
import {
  Mail, Search, Calendar,
  ArrowLeft, Download, Share2, CheckCircle,
  ExternalLink, Zap, ArrowRight, Clock, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

interface ScrapingJob {
  id: number;
  status: string;
  current_step: string;
  message: string;
  progress: {
    total_found: number;
    processed: number;
    saved: number;
  };
  source_stats: {
    academic?: number;
    industry?: number;
    financial?: number;
  };
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

const History = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedJob, setSelectedJob] = useState<ScrapingJob | null>(null);
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getMyScrapingHistory();
      setJobs(response.jobs || []);
    } catch (err: any) {
      console.error('Error loading history:', err);
      setError(err.message || 'Failed to load scraping history');
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDetail = (job: ScrapingJob) => {
    setSelectedJob(job);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedJob(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-100';
      case 'running': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'failed': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'running': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  if (viewMode === 'detail' && selectedJob) {
    const duration = selectedJob.completed_at && selectedJob.created_at
      ? Math.round((new Date(selectedJob.completed_at).getTime() - new Date(selectedJob.created_at).getTime()) / 1000)
      : 0;

    return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <button
          onClick={handleBackToList}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </button>

        <div className="bg-white border border-slate-100 rounded-3xl p-8 lg:p-12 shadow-sm space-y-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${getStatusColor(selectedJob.status)}`}>
                  {selectedJob.status}
                </span>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  {formatDate(selectedJob.created_at)}
                </span>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-black leading-tight tracking-tight">
              Scraping Job #{selectedJob.id}
            </h1>

            <p className="text-lg text-slate-600 font-normal leading-relaxed max-w-4xl">
              {selectedJob.message}
            </p>
          </div>

          {/* Job Statistics */}
          <div className="grid sm:grid-cols-3 gap-6 pt-6">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Articles Found</div>
              <div className="text-3xl font-bold text-black">{selectedJob.progress.total_found}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Processed</div>
              <div className="text-3xl font-bold text-black">{selectedJob.progress.processed}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Saved</div>
              <div className="text-3xl font-bold text-[rgb(152,16,250)]">{selectedJob.progress.saved}</div>
            </div>
          </div>

          {/* Source Breakdown */}
          {selectedJob.source_stats && Object.keys(selectedJob.source_stats).length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Source Breakdown</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {selectedJob.source_stats.academic !== undefined && (
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Academic</div>
                    <div className="text-2xl font-bold text-purple-900">{selectedJob.source_stats.academic}</div>
                  </div>
                )}
                {selectedJob.source_stats.industry !== undefined && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Industry</div>
                    <div className="text-2xl font-bold text-blue-900">{selectedJob.source_stats.industry}</div>
                  </div>
                )}
                {selectedJob.source_stats.financial !== undefined && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <div className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Financial</div>
                    <div className="text-2xl font-bold text-green-900">{selectedJob.source_stats.financial}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="font-semibold text-slate-700">Started:</span>
              <span className="ml-2 text-slate-600">{formatDate(selectedJob.created_at)}</span>
            </div>
            {selectedJob.completed_at && (
              <>
                <div>
                  <span className="font-semibold text-slate-700">Completed:</span>
                  <span className="ml-2 text-slate-600">{formatDate(selectedJob.completed_at)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Duration:</span>
                  <span className="ml-2 text-slate-600">{duration}s</span>
                </div>
              </>
            )}
          </div>

          {selectedJob.error_message && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-6">
              <div className="text-sm font-semibold text-red-700 mb-2">Error Message</div>
              <div className="text-sm text-red-600">{selectedJob.error_message}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[rgb(152,16,250)]" />
        <p className="mt-4 text-slate-600">Loading scraping history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-20 text-center space-y-4">
        <div className="text-red-600 text-xl font-bold">Error Loading History</div>
        <p className="text-slate-600">{error}</p>
        <button
          onClick={loadHistory}
          className="px-6 py-3 bg-[rgb(152,16,250)] text-white rounded-xl font-semibold hover:bg-[rgb(132,0,230)] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 px-1 uppercase tracking-widest">Your Scraping History</h3>
          <button
            onClick={loadHistory}
            className="px-4 py-2 text-sm font-semibold text-[rgb(152,16,250)] hover:bg-purple-50 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative group flex-1 max-w-2xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[rgb(152,16,250)] transition-colors" />
            <input
              type="text"
              placeholder="Search scraping jobs..."
              className="w-full h-14 pl-14 pr-6 rounded-2xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:border-[rgb(152,16,250)] outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm font-semibold text-slate-600">
            Total Jobs: {jobs.length}
          </div>
        </div>
      </section>

      <div className="grid gap-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => handleOpenDetail(job)}
              className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-[rgb(152,16,250)] hover:shadow-lg transition-all group cursor-pointer shadow-sm flex items-start gap-6 relative"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-[rgb(152,16,250)] group-hover:text-white transition-all shrink-0 border ${getStatusColor(job.status)}`}>
                {getStatusIcon(job.status)}
              </div>

              <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {formatDate(job.created_at)}
                    </span>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded border ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-black group-hover:text-[rgb(152,16,250)] transition-colors leading-tight pr-12">
                    Job #{job.id}
                  </h4>
                </div>

                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-normal pr-4">
                  {job.message}
                </p>

                <div className="flex items-center justify-between pt-2 flex-wrap gap-4">
                  <div className="flex items-center gap-6 text-xs font-semibold text-slate-600">
                    <div>Found: <span className="text-black">{job.progress.total_found}</span></div>
                    <div>Saved: <span className="text-[rgb(152,16,250)]">{job.progress.saved}</span></div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-widest group-hover:gap-3 transition-all">
                    View Details <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl py-32 text-center space-y-6 shadow-sm">
            <Mail className="w-16 h-16 mx-auto text-slate-300" />
            <div>
              <h4 className="text-xl font-bold text-slate-900 tracking-tight mb-2">No Scraping History</h4>
              <p className="text-slate-500">
                {searchQuery ? 'No jobs match your search.' : 'Your scraping jobs will appear here.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
