
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Users, Database, Mail, Activity, BarChart3, Settings,
  Search, Trash2, Power, Play, CheckCircle, AlertCircle,
  Clock, Plus, RefreshCw, ArrowUpRight, ArrowDownRight, Globe, Server, X, ChevronRight
} from 'lucide-react';
import adminService, { AdminUser, AdminArticle, NewsletterLog, Analytics, SystemSettings } from '../services/adminService';

const Admin = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'analytics';
  const [userSearch, setUserSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [newsletters, setNewsletters] = useState<NewsletterLog[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [sysSettings, setSysSettings] = useState<SystemSettings>({});

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmColor?: string;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      switch (tab) {
        case 'analytics':
          const analyticsData = await adminService.getAnalytics();
          setAnalytics(analyticsData);
          break;
        case 'users':
          const usersData = await adminService.getAllUsers(userSearch);
          setUsers(usersData);
          break;
        case 'content':
          const articlesData = await adminService.getAllArticles();
          setArticles(articlesData);
          break;
        case 'newsletters':
          const newslettersData = await adminService.getNewsletterLogs();
          setNewsletters(newslettersData);
          break;
        case 'jobs':
          const jobsData = await adminService.getJobs();
          setJobs(jobsData);
          break;
        case 'settings':
          const settingsData = await adminService.getSettings();
          setSysSettings(settingsData);
          break;
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(error.message || error.response?.data?.detail || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // --- CRUD ACTIONS ---

  const toggleUserStatus = async (id: string) => {
    try {
      await adminService.toggleUserStatus(id);
      toast.success('User status updated');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

  const deleteUser = async (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Subscriber',
      message: 'Are you sure you want to remove this subscriber permanently? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        try {
          await adminService.deleteUser(id);
          toast.success('User deleted');
          await loadData();
        } catch (error: any) {
          toast.error(error.response?.data?.detail || 'Failed to delete user');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string || 'Password123!';

    try {
      await adminService.createUser(email, password);
      toast.success('User created successfully');
      setShowAddForm(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleAddArticle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const source = formData.get('source') as string;
    const summary = formData.get('summary') as string;

    try {
      await adminService.createArticle(title, source, summary);
      toast.success('Article created successfully');
      setShowAddForm(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create article');
    }
  };

  const deleteArticle = async (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Article',
      message: 'Remove this article from the repository? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        try {
          await adminService.deleteArticle(id);
          toast.success('Article deleted');
          await loadData();
        } catch (error: any) {
          toast.error(error.response?.data?.detail || 'Failed to delete article');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const handleAddNewsletterLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subject = formData.get('subject') as string;
    const recipients = parseInt(formData.get('recipients') as string) || 0;

    try {
      await adminService.createNewsletterLog(subject, recipients);
      toast.success('Newsletter log created');
      setShowAddForm(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create log');
    }
  };

  const deleteNewsletter = async (id: string) => {
    setConfirmModal({
      show: true,
      title: 'Delete Dispatch Record',
      message: 'Delete this dispatch record? This action cannot be undone.',
      confirmText: 'Delete',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        try {
          await adminService.deleteNewsletterLog(id);
          toast.success('Newsletter log deleted');
          await loadData();
        } catch (error: any) {
          toast.error(error.response?.data?.detail || 'Failed to delete log');
        }
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
      }
    });
  };

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);

  const viewJobDetail = (job: any) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };

  const sendNewsletterToAll = async () => {
    setConfirmModal({
      show: true,
      title: 'Send Newsletter to All Users',
      message: 'This will send personalized newsletters to all active users based on their preferences. Continue?',
      confirmText: 'Send to All',
      confirmColor: 'bg-[rgb(152,16,250)] hover:bg-[rgb(130,10,220)]',
      onConfirm: async () => {
        setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });

        try {
          const response = await adminService.sendNewsletter();
          toast.success('Newsletter job started! Emails are being sent in the background.');
        } catch (error: any) {
          toast.error(error.response?.data?.detail || 'Failed to start newsletter job');
        }
      }
    });
  };

  const updateGlobalSetting = async (key: string, value: any) => {
    try {
      await adminService.updateSettings(key, value);
      setSysSettings({ ...sysSettings, [key]: value });
      toast.success('Settings updated');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update settings');
    }
  };

  const handleAddFeed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;

    try {
      await adminService.addSource(url);
      toast.success('Source added');
      setShowAddForm(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to add source');
    }
  };

  const removeSource = async (source: string) => {
    try {
      await adminService.removeSource(source);
      toast.success('Source removed');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to remove source');
    }
  };

  const renderConfirmModal = () => {
    if (!confirmModal.show) return null;
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
          <h3 className="text-xl font-bold text-gray-900 mb-3">{confirmModal.title}</h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">{confirmModal.message}</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} })}
              className="flex-1 h-12 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={confirmModal.onConfirm}
              className={`flex-1 h-12 text-white font-bold rounded-xl transition-all ${confirmModal.confirmColor || 'bg-[rgb(152,16,250)] hover:bg-[rgb(130,10,220)]'}`}
            >
              {confirmModal.confirmText || 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderJobDetailModal = () => {
    if (!showJobDetail || !selectedJob) return null;

    const jobDetails = {
      'Article Scraper': {
        description: 'Automatically scrapes and indexes articles from configured sources',
        schedule: 'Every 6 hours',
        lastRun: selectedJob.time,
        status: selectedJob.status,
        metrics: {
          'Articles Scraped': '847',
          'Success Rate': '98.2%',
          'Avg Duration': '4.2 min',
          'Last Batch': '23 articles'
        }
      },
      'Newsletter Generator': {
        description: 'Generates and sends personalized newsletters to all active users',
        schedule: 'Daily at 6:00 AM',
        lastRun: selectedJob.time,
        status: selectedJob.status,
        metrics: {
          'Newsletters Sent': '3',
          'Success Rate': '100%',
          'Avg Duration': '2.8 min',
          'Total Recipients': '3 users'
        }
      },
      'Preference Sync': {
        description: 'Syncs user preferences and updates embedding vectors for better recommendations',
        schedule: 'Every 12 hours',
        lastRun: selectedJob.time,
        status: selectedJob.status,
        metrics: {
          'Users Synced': '3',
          'Success Rate': '100%',
          'Avg Duration': '0.5 min',
          'Embeddings Updated': '3'
        }
      }
    };

    const details = jobDetails[selectedJob.name as keyof typeof jobDetails];

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
          <button onClick={() => setShowJobDetail(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.name}</h3>
            <p className="text-sm text-gray-600">{details?.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Schedule</p>
              <p className="text-sm font-semibold text-gray-900">{details?.schedule}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Last Run</p>
              <p className="text-sm font-semibold text-gray-900">{details?.lastRun}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center gap-2">
                {details?.status === 'Success' ? (
                  <><CheckCircle className="w-4 h-4 text-emerald-600" /><span className="text-sm font-semibold text-emerald-600">Healthy</span></>
                ) : (
                  <><AlertCircle className="w-4 h-4 text-rose-600" /><span className="text-sm font-semibold text-rose-600">Error</span></>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Type</p>
              <p className="text-sm font-semibold text-gray-900">Automated</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-bold text-gray-900 mb-4">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              {details && Object.entries(details.metrics).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-600">{key}</span>
                  <span className="text-sm font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowJobDetail(false)}
              className="w-full h-12 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddModal = () => {
    if (!showAddForm) return null;
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
          <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>

          {tab === 'users' && (
            <form onSubmit={handleAddUser} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Add New Subscriber</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Email Address</label>
                  <input name="email" type="email" required placeholder="user@example.com" className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none text-sm font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Password (optional)</label>
                  <input name="password" type="password" placeholder="Default: Password123!" className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none text-sm font-medium" />
                </div>
              </div>
              <button type="submit" className="w-full h-12 bg-[rgb(152,16,250)] text-white font-bold rounded-xl hover:bg-[rgb(130,10,220)] transition-all">Create Record</button>
            </form>
          )}

          {tab === 'content' && (
            <form onSubmit={handleAddArticle} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Add Knowledge Signal</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Title</label>
                  <input name="title" required placeholder="Research Discovery Name" className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Source</label>
                  <input name="source" required placeholder="Nature, arXiv, etc." className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Summary</label>
                  <textarea name="summary" required rows={3} placeholder="Brief summary of the findings..." className="w-full p-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] resize-none" />
                </div>
              </div>
              <button type="submit" className="w-full h-12 bg-[rgb(152,16,250)] text-white font-bold rounded-xl hover:bg-[rgb(130,10,220)] transition-all">Store Article</button>
            </form>
          )}

          {tab === 'newsletters' && (
            <form onSubmit={handleAddNewsletterLog} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Log Manual Dispatch</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Subject</label>
                  <input name="subject" required placeholder="Subject Line" className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Recipient Count</label>
                  <input name="recipients" type="number" required placeholder="2480" className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)]" />
                </div>
              </div>
              <button type="submit" className="w-full h-12 bg-[rgb(152,16,250)] text-white font-bold rounded-xl hover:bg-[rgb(130,10,220)] transition-all">Record Entry</button>
            </form>
          )}

          {tab === 'settings' && (
            <form onSubmit={handleAddFeed} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900">Integrate Data Feed</h3>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Feed Endpoint (RSS/API)</label>
                <input name="url" required placeholder="https://domain.com/feed" className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)] outline-none text-sm font-medium" />
              </div>
              <button type="submit" className="w-full h-12 bg-[rgb(152,16,250)] text-white font-bold rounded-xl hover:bg-[rgb(130,10,220)] transition-all">Connect Pipeline</button>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8">
      {renderConfirmModal()}
      {renderAddModal()}
      {renderJobDetailModal()}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight capitalize">
          {tab === 'analytics' ? 'System Overview' : tab.replace('-', ' ')}
        </h1>
        <button onClick={handleRefresh} className={`p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-[rgb(152,16,250)] transition-all shadow-soft ${isRefreshing ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(152,16,250)]"></div>
        </div>
      ) : (
        <div className="min-h-[500px]">
          {tab === 'analytics' && analytics && (
             <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard title="Total Subscribers" value={analytics.metrics.totalUsers} delta="+4.2%" trend="up" />
                <MetricCard title="Active Users" value={analytics.metrics.activeUsers} delta="+2.1%" trend="up" />
                <MetricCard title="Total Articles" value={analytics.metrics.totalArticles} delta="+8.5%" trend="up" />
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-xl space-y-6 shadow-soft">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[rgb(152,16,250)]" /> Topic Engagement Density
                </h3>
                <div className="space-y-4">
                  {analytics.topicEngagement.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-gray-500">{item.topic}</span>
                        <span className="text-gray-900">{item.percentage}% Reach</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[rgb(152,16,250)] rounded-full" style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-soft">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search subscribers..." className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium focus:bg-white outline-none" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                </div>
                <button onClick={() => setShowAddForm(true)} className="px-6 py-2 bg-[rgb(152,16,250)] text-white text-xs font-bold rounded-lg hover:bg-[rgb(130,10,220)] flex items-center gap-2"><Plus className="w-4 h-4" /> Add User</button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-soft">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Subscriber</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.filter(u => u.email.toLowerCase().includes(userSearch.toLowerCase())).map(user => (
                      <tr key={user.id} className="text-sm">
                        <td className="px-6 py-4 font-semibold text-gray-900">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{user.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {user.role !== 'admin' && (
                            <>
                              <button onClick={() => toggleUserStatus(user.id)} className="text-gray-400 hover:text-[rgb(152,16,250)] p-1 rounded-md hover:bg-gray-100" title="Toggle Access"><Power className="w-4 h-4" /></button>
                              <button onClick={() => deleteUser(user.id)} className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-gray-100" title="Delete User"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'content' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-end">
                <button onClick={() => setShowAddForm(true)} className="px-6 py-2 bg-[rgb(152,16,250)] text-white text-xs font-bold rounded-lg hover:bg-[rgb(130,10,220)] flex items-center gap-2"><Plus className="w-4 h-4" /> Add Knowledge</button>
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                {articles.map(article => (
                  <div key={article.id} className="bg-white border border-gray-200 p-5 rounded-xl shadow-soft group relative">
                     <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-bold text-[rgb(152,16,250)] uppercase">{article.source}</span>
                      <button onClick={() => deleteArticle(article.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                     </div>
                     <h3 className="text-sm font-bold text-gray-900 mb-2">{article.title}</h3>
                     <p className="text-xs text-gray-500 italic line-clamp-2 leading-relaxed">"{article.summary}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'newsletters' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <button onClick={sendNewsletterToAll} className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Send to All Users
                </button>
                <button onClick={() => setShowAddForm(true)} className="px-6 py-2 bg-[rgb(152,16,250)] text-white text-xs font-bold rounded-lg hover:bg-[rgb(130,10,220)] flex items-center gap-2"><Plus className="w-4 h-4" /> Log Entry</button>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-soft">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Recipients</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {newsletters.map(nl => (
                      <tr key={nl.id} className="text-sm">
                        <td className="px-6 py-4 font-semibold text-gray-900">{nl.date}</td>
                        <td className="px-6 py-4 text-gray-600 italic">{nl.subject}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{nl.recipients}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => deleteNewsletter(nl.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'jobs' && (
            <div className="space-y-4 animate-in fade-in duration-500">
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => viewJobDetail(job)}
                  className="bg-white border border-gray-200 p-5 rounded-xl flex items-center justify-between shadow-soft cursor-pointer hover:border-[rgb(152,16,250)] hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      job.status === 'Success'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {job.status === 'Success' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{job.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Last Activity: {job.time}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          )}

          {tab === 'settings' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-soft space-y-6">
                <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Globe className="w-4 h-4 text-[rgb(152,16,250)]" /> Integrated Sources</h3>
                  <button onClick={() => setShowAddForm(true)} className="text-[10px] font-bold text-[rgb(152,16,250)] uppercase hover:underline"><Plus className="w-3.5 h-3.5 inline mr-1" /> Add Feed</button>
                </div>
                <div className="grid gap-3">
                  {(sysSettings.sources || []).map((source: string) => (
                    <div key={source} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100 group">
                      <span className="text-xs font-medium text-gray-700 italic truncate">{source}</span>
                      <button onClick={() => removeSource(source)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-soft space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">Dispatch Window</label>
                  <input type="time" value={sysSettings.schedule || '09:00'} onChange={(e) => updateGlobalSetting('schedule', e.target.value)} className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold outline-none focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)]" />
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-soft space-y-2">
                  <label className="text-sm font-semibold text-slate-700 block">SMTP Configuration</label>
                  <input type="text" placeholder="smtp.relay.net" value={sysSettings.smtp || ''} onChange={(e) => updateGlobalSetting('smtp', e.target.value)} className="w-full h-11 px-4 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold outline-none focus:border-[rgb(152,16,250)] focus:ring-1 focus:ring-[rgb(152,16,250)]" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, delta, trend }: any) => (
  <div className="bg-white border border-gray-200 p-6 rounded-2xl space-y-2 shadow-soft">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
    <div className="flex items-end justify-between">
      <h4 className="text-2xl font-black text-gray-900">{value}</h4>
      <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
        {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {delta}
      </div>
    </div>
  </div>
);

export default Admin;
