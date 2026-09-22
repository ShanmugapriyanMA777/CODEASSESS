import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://xhikrplxtwzrxujmroqd.supabase.co';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWtycGx4dHd6cnh1am1yb3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTI4MjcsImV4cCI6MjA5OTI2ODgyN30.ZDDcI8ghkl7akNOthMWjnxWspCvQLA6GlwHR182DYDM';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Warning: Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.');
}

/**
 * Supercharged Supabase Client for Backend with Node.js WebSocket support
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: WebSocket as any,
  },
});

/**
 * Storage Helpers
 */
export const supabaseStorage = {
  /**
   * Upload a file/buffer to a Supabase bucket (e.g., student reports, avatar, code bundle)
   */
  uploadFile: async (bucket: string, filePath: string, fileBuffer: Buffer, mimeType: string = 'application/octet-stream') => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.error(`[Supabase Storage] Upload error to ${bucket}/${filePath}:`, err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get the public URL of an artifact in Supabase storage
   */
  getPublicUrl: (bucket: string, filePath: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  },

  /**
   * Download a file from a bucket
   */
  downloadFile: async (bucket: string, filePath: string) => {
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error) throw error;
    return data;
  },
};

/**
 * Real-time Broadcast Helper
 * Useful for broadcasting real-time submission evaluation events to Admin and Student portals
 */
export const broadcastAssessmentEvent = async (channelName: string, eventName: string, payload: any) => {
  try {
    const channel = supabase.channel(channelName);
    await channel.send({
      type: 'broadcast',
      event: eventName,
      payload,
    });
  } catch (err) {
    console.error(`[Supabase Realtime] Broadcast failed on ${channelName}:`, err);
  }
};
