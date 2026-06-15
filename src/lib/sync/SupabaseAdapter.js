import { createClient } from '@supabase/supabase-js';
import { StorageAdapter } from './StorageAdapter.js';
import { getSyncConfig } from '../storage.js';

let cachedClient = null;
let cachedConfigKey = null;

function getClient() {
  const { supabaseUrl, supabaseAnonKey } = getSyncConfig();
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const configKey = `${supabaseUrl}::${supabaseAnonKey}`;
  if (!cachedClient || cachedConfigKey !== configKey) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey);
    cachedConfigKey = configKey;
  }
  return cachedClient;
}

export class SupabaseAdapter extends StorageAdapter {
  get client() {
    return getClient();
  }

  async getUser() {
    const client = this.client;
    if (!client) return null;
    const { data, error } = await client.auth.getUser();
    if (error) return null;
    return data?.user || null;
  }

  async signInWithMagicLink(email) {
    const client = this.client;
    if (!client) throw new Error('Dandy Sync is not configured.');
    const { error } = await client.auth.signInWithOtp({ email });
    if (error) throw error;
  }

  async signOut() {
    const client = this.client;
    if (!client) return;
    await client.auth.signOut();
  }

  onAuthStateChange(callback) {
    const client = this.client;
    if (!client) return () => {};
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
    return () => data.subscription.unsubscribe();
  }

  /**
   * @returns {Promise<{ updatedAt: string, data: Object } | null>}
   */
  async get() {
    const client = this.client;
    if (!client) return null;

    const user = await this.getUser();
    if (!user) return null;

    const { data, error } = await client
      .from('user_data')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to get data from Supabase:', error);
      throw error;
    }
    if (!data) return null;

    return { updatedAt: data.updated_at, data: data.data };
  }

  /**
   * @param {Object} payload The entire app state tree
   * @param {string} [expectedUpdatedAt] The `updated_at` value we last read, for optimistic concurrency
   * @returns {Promise<string>} The new `updated_at` value
   */
  async set(payload, expectedUpdatedAt = null) {
    const client = this.client;
    if (!client) throw new Error('Dandy Sync is not configured.');

    const user = await this.getUser();
    if (!user) throw new Error('Not signed in to Dandy Sync.');

    const now = new Date().toISOString();

    if (expectedUpdatedAt) {
      // Only overwrite if the row hasn't changed since we last read it.
      const { data, error } = await client
        .from('user_data')
        .update({ data: payload, updated_at: now })
        .eq('user_id', user.id)
        .eq('updated_at', expectedUpdatedAt)
        .select('updated_at');

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('409_CONFLICT');
      }
      return data[0].updated_at;
    }

    const { data, error } = await client
      .from('user_data')
      .upsert({ user_id: user.id, data: payload, updated_at: now })
      .select('updated_at')
      .single();

    if (error) throw error;
    return data.updated_at;
  }
}

export const supabaseAdapter = new SupabaseAdapter();
