import { api } from './api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  topics: string[];
  joinDate: string;
}

export interface AdminArticle {
  id: string;
  title: string;
  source: string;
  summary: string;
  tags: string[];
  date: string;
}

export interface NewsletterLog {
  id: number;
  subject: string;
  recipients: number;
  status: string;
  date: string;
  createdAt?: string;
}

export interface Analytics {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalArticles: number;
    recentArticles: number;
    totalNewsletters: number;
  };
  topicEngagement: Array<{
    topic: string;
    count: number;
    percentage: number;
  }>;
}

export interface SystemSettings {
  sources?: string[];
  schedule?: string;
  smtp?: string;
}

class AdminService {
  // ==================== USER MANAGEMENT ====================

  async getAllUsers(search?: string): Promise<AdminUser[]> {
    console.log('[AdminService] getAllUsers called with search:', search);
    const params = search ? { search } : {};
    console.log('[AdminService] Calling API with params:', params);
    const response = await api.get<{ success: boolean; users: AdminUser[] }>('/admin/users', { params });
    console.log('[AdminService] getAllUsers response:', response);
    return response.users;
  }

  async createUser(email: string, password: string, role: string = 'user'): Promise<void> {
    await api.post('/admin/users', { email, password, role });
  }

  async toggleUserStatus(userId: string): Promise<void> {
    await api.put(`/admin/users/${userId}/status`);
  }

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}`);
  }

  // ==================== ANALYTICS ====================

  async getAnalytics(): Promise<Analytics> {
    console.log('[AdminService] getAnalytics called');
    const response = await api.get<{ success: boolean } & Analytics>('/admin/analytics');
    console.log('[AdminService] getAnalytics response:', response);
    return {
      metrics: response.metrics,
      topicEngagement: response.topicEngagement
    };
  }

  // ==================== NEWSLETTER LOGS ====================

  async getNewsletterLogs(limit: number = 50): Promise<NewsletterLog[]> {
    const response = await api.get<{ success: boolean; newsletters: NewsletterLog[] }>('/admin/newsletters', { params: { limit } });
    return response.newsletters;
  }

  async createNewsletterLog(subject: string, recipients: number, status: string = 'Completed'): Promise<void> {
    await api.post('/admin/newsletters', { subject, recipients, status });
  }

  async deleteNewsletterLog(logId: string): Promise<void> {
    await api.delete(`/admin/newsletters/${logId}`);
  }

  // ==================== ARTICLES (CONTENT) ====================

  async getAllArticles(limit: number = 100): Promise<AdminArticle[]> {
    const response = await api.get<{ success: boolean; articles: AdminArticle[] }>('/admin/articles', { params: { limit } });
    return response.articles;
  }

  async createArticle(title: string, source: string, summary: string): Promise<void> {
    await api.post('/admin/articles', { title, source, summary });
  }

  async deleteArticle(articleId: string): Promise<void> {
    await api.delete(`/admin/articles/${articleId}`);
  }

  // ==================== SYSTEM SETTINGS ====================

  async getSettings(): Promise<SystemSettings> {
    const response = await api.get<{ success: boolean; settings: SystemSettings }>('/admin/settings');
    return response.settings;
  }

  async updateSettings(key: string, value: any): Promise<void> {
    await api.put('/admin/settings', { key, value });
  }

  async addSource(url: string): Promise<void> {
    const settings = await this.getSettings();
    const sources = settings.sources || [];
    await this.updateSettings('sources', [...sources, url]);
  }

  async removeSource(url: string): Promise<void> {
    const settings = await this.getSettings();
    const sources = (settings.sources || []).filter(s => s !== url);
    await this.updateSettings('sources', sources);
  }

  // ==================== JOBS ====================

  async getJobs(): Promise<any[]> {
    const response = await api.get<{ success: boolean; jobs: any[] }>('/admin/jobs');
    return response.jobs;
  }

  // ==================== NEWSLETTER ====================

  async sendNewsletter(email?: string): Promise<void> {
    await api.post('/admin/send-newsletter', { email });
  }
}

export default new AdminService();
