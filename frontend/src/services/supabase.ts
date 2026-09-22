import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://xhikrplxtwzrxujmroqd.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWtycGx4dHd6cnh1am1yb3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTI4MjcsImV4cCI6MjA5OTI2ODgyN30.ZDDcI8ghkl7akNOthMWjnxWspCvQLA6GlwHR182DYDM';

/**
 * Frontend Supabase Client
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Real-time Subscription Helpers for Frontend
 */
export const supabaseRealtime = {
  /**
   * Listen to live submission updates (for Admin Live Activity & Student status)
   */
  subscribeToSubmissions: (assessmentId: string | null, onNewSubmission: (payload: any) => void) => {
    const channel = supabase
      .channel('realtime:submissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Submission',
          filter: assessmentId ? `assessmentId=eq.${assessmentId}` : undefined,
        },
        (payload) => {
          onNewSubmission(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Listen to anti-cheating alerts in real time during proctored assessments
   */
  subscribeToAntiCheatingAlerts: (assessmentId: string, onAlert: (event: any) => void) => {
    const channel = supabase
      .channel(`realtime:suspicious:${assessmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'SuspiciousEvent',
          filter: `assessmentId=eq.${assessmentId}`,
        },
        (payload) => {
          onAlert(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Listen to live leaderboard score updates
   */
  subscribeToLeaderboard: (assessmentId: string, onUpdate: (result: any) => void) => {
    const channel = supabase
      .channel(`realtime:leaderboard:${assessmentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'AssessmentResult',
          filter: `assessmentId=eq.${assessmentId}`,
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
