/**
 * IntelliNews API Service
 *
 * Connects React frontend to FastAPI backend with intelligent RAG-based article discovery,
 * context-aware AI ranking, and explainable recommendations.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================================================
// Type Definitions (matching backend Pydantic models)
// ============================================================================

export interface UserPreferencesPayload {
  topics: string[];
  keywords: string[];
  source: 'academic' | 'industry' | 'financial' | 'both';
  frequency: 'daily' | 'weekly' | 'monthly';
  summaryLength: 'concise' | 'detailed';
  duplicateFiltering?: boolean;
  deliveryTime?: string;
  deliveryDay?: string;
  deliveryDate?: number;
  autoScrape?: boolean;  // Control whether to auto-scrape after saving preferences
  timezone?: string;  // User's timezone (e.g., "America/New_York", "UTC")
}

export interface UserResponse {
  id: number;
  email: string;
  preferences: UserPreferencesPayload;
  created_at: string;
  updated_at: string;
}

export interface ArticleResponse {
  id: number;
  title: string;
  content: string;
  url: string;
  source: string;
  sourceType: 'academic' | 'industry' | 'financial';
  publishedDate: string;
  scrapedAt: string;
  summary: string;
  keyPoints: string[];
  tags: string[];
  metadata: any;
}

export interface RankedArticle extends ArticleResponse {
  relevanceScore: number;
  freshnessScore: number;
  finalScore: number;
  reasoning: string;
}

export interface ArticleDiscoveryRequest {
  userId: number;
  topics: string[];
  keywords: string[];
  sourceType?: 'academic' | 'industry' | 'financial' | 'both';
  limit?: number;
  offset?: number;
}

export interface ArticleStatsResponse {
  total_articles: number;
  by_source_type: {
    academic: number;
    industry: number;
    financial: number;
  };
  articles_last_24h: number;
  articles_last_week: number;
  avg_summary_length: number;
}

export interface SuggestedTopicsResponse {
  topics: string[];
  source: string;
  /** true when GPT produced the list, false when a static fallback was used */
  generated: boolean;
  reason?: string;
  articlesAnalysed?: number;
  trendWindowDays?: number;
}

export interface SuggestedKeywordsResponse {
  keywords: string[];
  topics: string[];
  generated: boolean;
  reason?: string;
  articlesMatched?: number;
}

// ============================================================================
// API Client Class
// ============================================================================

class IntelliNewsAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Generic request handler with error handling and authentication
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication token if available
    const token = this.getAuthToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    console.log('[API] Request:', {
      url,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      console.log('[API] Response:', {
        url,
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[API] Error response:', errorData);
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('[API] Success data:', data);
      return data;
    } catch (error) {
      console.error(`[API] Exception (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, options?: { params?: Record<string, any> }): Promise<T> {
    let url = endpoint;

    // Add query parameters if provided
    if (options?.params) {
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${endpoint}?${queryString}`;
      }
    }

    console.log('[API] GET request:', { endpoint, url, params: options?.params });
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ============================================================================
  // User Management
  // ============================================================================

  /**
   * Create a new user
   */
  async createUser(email: string, preferences: UserPreferencesPayload): Promise<UserResponse> {
    return this.request<UserResponse>('/api/users/', {
      method: 'POST',
      body: JSON.stringify({ email, preferences }),
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<UserResponse> {
    return this.request<UserResponse>(`/api/users/${userId}`);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserResponse> {
    return this.request<UserResponse>(`/api/users/email/${encodeURIComponent(email)}`);
  }

  /**
   * Update user preferences (with embedding generation)
   */
  async updateUserPreferences(
    userId: number,
    preferences: UserPreferencesPayload
  ): Promise<UserResponse> {
    return this.request<UserResponse>(
      `/api/users/preferences?user_id=${userId}`,
      {
        method: 'POST',
        body: JSON.stringify(preferences),
      }
    );
  }

  // ============================================================================
  // Article Discovery (RAG-based with AI Ranking)
  // ============================================================================

  /**
   * Discover ranked articles using RAG retrieval and AI-driven ranking
   *
   * This is the main intelligent discovery endpoint that:
   * 1. Uses semantic search (vector embeddings) to find relevant articles
   * 2. Applies hybrid ranking (70% relevance + 30% freshness)
   * 3. Generates AI explanations for why each article was selected
   * 4. Filters by recency (2025+ articles only)
   */
  async discoverArticles(
    request: ArticleDiscoveryRequest
  ): Promise<RankedArticle[]> {
    return this.request<RankedArticle[]>('/api/articles/discover', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get articles with optional filtering
   */
  async getArticles(params?: {
    sourceType?: string;
    limit?: number;
    offset?: number;
  }): Promise<ArticleResponse[]> {
    const queryParams = new URLSearchParams();
    if (params?.sourceType) queryParams.append('source_type', params.sourceType);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const endpoint = `/api/articles/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request<ArticleResponse[]>(endpoint);
  }

  /**
   * Get single article by ID
   */
  async getArticleById(articleId: number): Promise<ArticleResponse> {
    return this.request<ArticleResponse>(`/api/articles/${articleId}`);
  }

  /**
   * Get article statistics (for dashboard)
   */
  async getArticleStats(): Promise<ArticleStatsResponse> {
    return this.request<ArticleStatsResponse>('/api/articles/stats/summary');
  }

  // ============================================================================
  // AI Suggestions (dynamic topics & keywords)
  // ============================================================================

  /**
   * Get topics currently trending across recently scraped articles.
   * Derived from real article tag frequency, then cleaned up by GPT.
   */
  async getSuggestedTopics(
    source: string = 'both',
    limit: number = 24
  ): Promise<SuggestedTopicsResponse> {
    const params = new URLSearchParams({ source, limit: String(limit) });
    return this.request<SuggestedTopicsResponse>(`/api/suggestions/topics?${params}`);
  }

  /**
   * Get keywords relevant to the topics the user has selected.
   * Grounded in articles that actually match those topics.
   */
  async getSuggestedKeywords(
    topics: string[],
    source: string = 'both',
    limit: number = 12
  ): Promise<SuggestedKeywordsResponse> {
    return this.request<SuggestedKeywordsResponse>('/api/suggestions/keywords', {
      method: 'POST',
      body: JSON.stringify({ topics, source, limit }),
    });
  }

  // ============================================================================
  // Article Scraping
  // ============================================================================

  /**
   * Scrape articles based on current user's preferences
   *
   * This triggers dynamic scraping that:
   * 1. Uses the authenticated user's topics and keywords
   * 2. Scrapes from academic, industry, and/or financial sources
   * 3. Filters by relevance to user interests
   * 4. Generates embeddings and AI summaries
   * 5. Saves unique articles to database
   */
  async scrapeArticlesForMe(maxArticlesPerSource: number = 10): Promise<{
    success: boolean;
    message: string;
    articles_scraped: number;
    articles_saved: number;
    by_source: {
      academic: number;
      industry: number;
      financial: number;
    };
    topics: string[];
    keywords: string[];
  }> {
    return this.request('/api/scraping/scrape-for-me', {
      method: 'POST',
      body: JSON.stringify({ max_articles_per_source: maxArticlesPerSource }),
    });
  }

  /**
   * Scrape articles in the background (non-blocking)
   */
  async scrapeArticlesInBackground(maxArticlesPerSource: number = 10): Promise<{
    success: boolean;
    message: string;
    user_id: number;
    topics: string[];
  }> {
    return this.request('/api/scraping/scrape-for-me/background', {
      method: 'POST',
      body: JSON.stringify({ max_articles_per_source: maxArticlesPerSource }),
    });
  }

  /**
   * Get scraping status and database statistics
   */
  async getScrapingStatus(): Promise<{
    user_id: number;
    user_preferences: {
      topics: string[];
      keywords: string[];
      source_preference: string;
    };
    database_stats: {
      total_articles: number;
      academic_articles: number;
      industry_articles: number;
      financial_articles: number;
      relevant_for_user: number;
    };
    needs_scraping: boolean;
    recommendation: string;
  }> {
    return this.request('/api/scraping/scraping-status');
  }

  /**
   * Start a background scraping job with progress tracking
   * Returns immediately with a job ID
   */
  async startBackgroundScrapingJob(maxArticlesPerSource: number = 10): Promise<{
    job_id: number;
    message: string;
    status: any;
  }> {
    return this.request('/api/scraping/start-background-job', {
      method: 'POST',
      body: JSON.stringify({ max_articles_per_source: maxArticlesPerSource }),
    });
  }

  /**
   * Get the status of a scraping job by ID
   */
  async getJobStatus(jobId: number): Promise<{
    id: number;
    user_id: number;
    status: string;
    current_step: string;
    message: string;
    progress: {
      total_found: number;
      processed: number;
      saved: number;
    };
    source_stats: any;
    error_message: string | null;
    created_at: string;
    started_at: string | null;
    completed_at: string | null;
    updated_at: string;
  }> {
    return this.request(`/api/scraping/job-status/${jobId}`);
  }

  /**
   * Get the latest scraping job for the current user
   * Useful for checking if there's an ongoing job when user visits the page
   */
  async getMyLatestJob(): Promise<{
    has_job: boolean;
    message?: string;
    job?: any;
    is_active?: boolean;
  }> {
    return this.request('/api/scraping/my-latest-job');
  }

  /**
   * Get scraping history for the current user
   */
  async getMyScrapingHistory(): Promise<{
    user_id: number;
    total_jobs: number;
    jobs: any[];
  }> {
    return this.request('/api/scraping/my-history');
  }

  /**
   * Cancel a running scraping job
   */
  async cancelScrapingJob(jobId: number): Promise<{
    success: boolean;
    message: string;
    job: any;
  }> {
    return this.request(`/api/scraping/cancel-job/${jobId}`, {
      method: 'POST',
    });
  }

  // ============================================================================
  // Notifications
  // ============================================================================

  /**
   * Get all notifications for the current user
   */
  async getNotifications(includeDismissed: boolean = false): Promise<{
    notifications: any[];
    unreadCount: number;
  }> {
    return this.request(`/api/notifications?include_dismissed=${includeDismissed}`);
  }

  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(): Promise<{ unreadCount: number }> {
    return this.request('/api/notifications/unread-count');
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: 'POST'
    });
  }

  /**
   * Mark a notification as unread (toggle)
   */
  async markNotificationAsUnread(notificationId: string): Promise<{ success: boolean }> {
    return this.request(`/api/notifications/${notificationId}/unread`, {
      method: 'POST'
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    return this.request('/api/notifications/mark-all-read', {
      method: 'POST'
    });
  }

  /**
   * Dismiss (delete) a notification
   */
  async dismissNotification(notificationId: string): Promise<{ success: boolean }> {
    return this.request(`/api/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }

  // ============================================================================
  // User Profile
  // ============================================================================

  /**
   * Get current user's profile
   */
  async getMyProfile(): Promise<{
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at: string | null;
    preferences: any;
  }> {
    return this.request('/api/users/me/profile');
  }

  /**
   * Update current user's profile
   */
  async updateMyProfile(profileData: {
    name?: string;
    email?: string;
  }): Promise<{
    success: boolean;
    message: string;
    user: any;
  }> {
    return this.request('/api/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  /**
   * Change current user's password
   */
  async changeMyPassword(passwordData: {
    current_password: string;
    new_password: string;
  }): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('/api/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData)
    });
  }

  // ============================================================================
  // Password Reset
  // ============================================================================

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        new_password: newPassword
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  /**
   * Check if backend is healthy
   */
  async healthCheck(): Promise<{ status: string; environment: string; debug: boolean }> {
    return this.request('/health');
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const api = new IntelliNewsAPI();

// Export for testing/mocking
export default IntelliNewsAPI;
