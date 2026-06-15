import { createClient } from '@supabase/supabase-js';
import { StorageAdapter } from './StorageAdapter.js';

// Dandy Sync is a single managed backend shared by all users - the project
// URL and publishable anon key are baked in at build time, not user-configured.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Optional early-access lock: if set, only this email may sign in to Dandy Sync.
// This is a UI-level convenience only - the real enforcement is a Postgres
// trigger on auth.users in the Supabase project (see supabase/lock_dandy_sync_email.sql),
// since the anon key is public in the built app.
const ALLOWED_EMAIL = import.meta.env.VITE_DANDY_SYNC_ALLOWED_EMAIL;

let cachedClient = null;

function getClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!cachedClient) {
    cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
    if (ALLOWED_EMAIL && email.trim().toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
      throw new Error('Dandy Sync is currently limited to the project owner during early access. Use GitHub sync instead, or self-host with your own Supabase project.');
    }
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
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
   * @returns {Promise<{ display_name: string|null, avatar_url: string|null } | null>}
   */
  async getProfile() {
    const client = this.client;
    if (!client) return null;

    const user = await this.getUser();
    if (!user) return null;

    const { data, error } = await client
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data || { display_name: null, avatar_url: null };
  }

  async updateProfile({ display_name }) {
    const client = this.client;
    if (!client) throw new Error('Dandy Sync is not configured.');

    const user = await this.getUser();
    if (!user) throw new Error('Not signed in to Dandy Sync.');

    const { error } = await client
      .from('profiles')
      .upsert({ user_id: user.id, display_name, updated_at: new Date().toISOString() });

    if (error) throw error;
  }

  /**
   * @param {File} file
   * @returns {Promise<string>} The new avatar's public URL
   */
  async uploadAvatar(file) {
    const client = this.client;
    if (!client) throw new Error('Dandy Sync is not configured.');

    const user = await this.getUser();
    if (!user) throw new Error('Not signed in to Dandy Sync.');

    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await client.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = client.storage.from('avatars').getPublicUrl(path);

    const { error } = await client
      .from('profiles')
      .upsert({ user_id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() });
    if (error) throw error;

    return publicUrl;
  }

  async removeAvatar() {
    const client = this.client;
    if (!client) throw new Error('Dandy Sync is not configured.');

    const user = await this.getUser();
    if (!user) throw new Error('Not signed in to Dandy Sync.');

    await client.storage.from('avatars').remove(
      ['png', 'jpg', 'jpeg', 'webp', 'gif'].map(ext => `${user.id}/avatar.${ext}`)
    );

    const { error } = await client
      .from('profiles')
      .upsert({ user_id: user.id, avatar_url: null, updated_at: new Date().toISOString() });
    if (error) throw error;
  }

  /**
   * @returns {Promise<{ version: string, data: Object } | null>}
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

    return { version: data.updated_at, data: data.data };
  }

  /**
   * @param {Object} payload The entire app state tree
   * @param {string} [version] The `updated_at` value we last read, for optimistic concurrency
   * @returns {Promise<string>} The new `updated_at` value
   */
  async set(payload, version = null) {
    const client = this.client;
    if (!client) throw new Error('Dandy Sync is not configured.');

    const user = await this.getUser();
    if (!user) throw new Error('Not signed in to Dandy Sync.');

    const now = new Date().toISOString();

    if (version) {
      // Only overwrite if the row hasn't changed since we last read it.
      const { data, error } = await client
        .from('user_data')
        .update({ data: payload, updated_at: now })
        .eq('user_id', user.id)
        .eq('updated_at', version)
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
