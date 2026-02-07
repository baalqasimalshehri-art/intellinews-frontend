/**
 * React Hook for Scraping Job Status Polling
 *
 * Automatically polls for scraping job status and provides
 * real-time updates to the UI with user-friendly messages
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';

interface ScrapingJobStatus {
  id: number;
  user_id: number;
  status: string; // pending, running, completed, failed
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
  error_message: string | null;
}

interface UseScrapingJobReturn {
  jobStatus: ScrapingJobStatus | null;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  startPolling: (jobId: number) => void;
  stopPolling: () => void;
  cancelJob: () => Promise<void>;
  checkForActiveJob: () => Promise<void>;
}

export function useScrapingJob(): UseScrapingJobReturn {
  const [jobStatus, setJobStatus] = useState<ScrapingJobStatus | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const lastMessage = useRef<string>('');
  const pollingStartTime = useRef<number>(0);
  const errorCount = useRef<number>(0);
  const pollCount = useRef<number>(0);
  const isPolling = useRef<boolean>(false);
  const MAX_POLLING_DURATION = 5 * 60 * 1000; // 5 minutes max

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearTimeout(pollingInterval.current);
      pollingInterval.current = null;
    }
    setIsActive(false);
    errorCount.current = 0;
    pollCount.current = 0;
    isPolling.current = false;
    console.log('[useScrapingJob] Polling stopped');
  }, []);

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: number) => {
    // Prevent concurrent polling requests
    if (isPolling.current) {
      console.log('[useScrapingJob] Skipping poll - request already in progress');
      return false;
    }

    isPolling.current = true;
    pollCount.current += 1;

    try {
      // Check if polling has exceeded maximum duration
      const elapsedTime = Date.now() - pollingStartTime.current;
      if (elapsedTime > MAX_POLLING_DURATION) {
        console.error('[useScrapingJob] Polling timeout - exceeded 5 minutes');
        stopPolling();
        setError('Analysis took too long. Please try again with fewer topics or check your internet connection.');
        toast.error('Analysis timeout. The process took too long. Please try again.', { duration: 5000 });
        return true;
      }

      console.log(`[useScrapingJob] Poll #${pollCount.current} for job ${jobId}`);
      const status = await api.getJobStatus(jobId);
      setJobStatus(status);
      errorCount.current = 0; // Reset error count on success

      // Show toast notification when message changes (user-friendly updates)
      if (status.message && status.message !== lastMessage.current) {
        // Only show toasts for meaningful updates
        if (status.status === 'running') {
          toast.info(status.message, { duration: 3000 });
        } else if (status.status === 'completed') {
          toast.success(status.message, { duration: 5000 });
        } else if (status.status === 'failed') {
          toast.error(status.error_message || status.message, { duration: 5000 });
        } else if (status.status === 'cancelled') {
          toast.info(status.message || 'Analysis cancelled', { duration: 3000 });
        }
        lastMessage.current = status.message;
      }

      // Stop polling if job is complete, failed, or cancelled
      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        console.log(`[useScrapingJob] Job finished with status: ${status.status}. Stopping polling.`);
        stopPolling();
        return true; // Job finished
      }

      return false; // Still running
    } catch (err: any) {
      console.error('Error polling job status:', err);
      setError(err.message || 'Failed to get job status');
      errorCount.current += 1;

      // Stop polling after 3 consecutive errors
      if (errorCount.current >= 3) {
        console.error('[useScrapingJob] Stopping polling after 3 consecutive errors');
        stopPolling();
        toast.error('Unable to check analysis status. Please refresh the page and try again.', { duration: 5000 });
        return true;
      }

      return false;
    } finally {
      isPolling.current = false;
    }
  }, [stopPolling]);

  // Calculate progressive polling interval
  const getPollingInterval = useCallback(() => {
    const count = pollCount.current;

    // Progressive polling: start fast, slow down over time
    if (count < 5) return 2000;      // First 5 polls: every 2 seconds
    if (count < 15) return 3000;     // Next 10 polls: every 3 seconds
    if (count < 30) return 5000;     // Next 15 polls: every 5 seconds
    return 10000;                    // After 30 polls: every 10 seconds
  }, []);

  // Start polling for a specific job
  const startPolling = useCallback((jobId: number) => {
    // Stop any existing polling
    stopPolling();

    setIsActive(true);
    setError(null);
    lastMessage.current = '';
    pollingStartTime.current = Date.now(); // Track start time
    errorCount.current = 0; // Reset error count
    pollCount.current = 0; // Reset poll count

    // Poll immediately
    pollJobStatus(jobId);

    // Use dynamic interval with progressive polling
    const schedulePoll = () => {
      const interval = getPollingInterval();
      console.log(`[useScrapingJob] Next poll in ${interval}ms (poll count: ${pollCount.current})`);

      pollingInterval.current = setTimeout(() => {
        pollJobStatus(jobId).then((finished) => {
          if (!finished) {
            schedulePoll(); // Schedule next poll if not finished
          }
        });
      }, interval);
    };

    // Schedule first poll
    schedulePoll();
  }, [pollJobStatus, stopPolling, getPollingInterval]);

  // Cancel the current job
  const cancelJob = useCallback(async () => {
    if (!jobStatus) {
      console.warn('[useScrapingJob] No job to cancel');
      return;
    }

    try {
      console.log('[useScrapingJob] Cancelling job:', jobStatus.id);
      const result = await api.cancelScrapingJob(jobStatus.id);

      if (result.success) {
        toast.success('Analysis cancelled successfully', { duration: 3000 });
        setJobStatus(result.job);
        stopPolling();
      } else {
        toast.error(result.message, { duration: 3000 });
      }
    } catch (err: any) {
      console.error('[useScrapingJob] Error cancelling job:', err);
      toast.error('Failed to cancel analysis. Please try again.', { duration: 3000 });
    }
  }, [jobStatus, stopPolling]);

  // Check if user has an active job on mount
  const checkForActiveJob = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.getMyLatestJob();

      if (result.has_job && result.is_active && result.job) {
        // User has an active job, start polling
        setJobStatus(result.job);
        startPolling(result.job.id);
      }
    } catch (err: any) {
      console.error('Error checking for active job:', err);
      // Don't show error to user, just log it
    } finally {
      setIsLoading(false);
    }
  }, [startPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    jobStatus,
    isActive,
    isLoading,
    error,
    startPolling,
    stopPolling,
    cancelJob,
    checkForActiveJob,
  };
}
