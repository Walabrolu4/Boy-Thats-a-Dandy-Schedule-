import { StorageAdapter } from './StorageAdapter.js';
import { getSyncConfig } from '../storage.js';

export class GitHubAdapter extends StorageAdapter {
  constructor() {
    super();
    this.baseUrl = 'https://api.github.com';
  }

  get config() {
    return getSyncConfig();
  }

  get headers() {
    const { githubToken } = this.config;
    return {
      'Authorization': `Bearer ${githubToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  get fileUrl() {
    const { githubUsername, githubRepo } = this.config;
    // We store the data in the root of the repo as dandy-routine-data.json
    return `${this.baseUrl}/repos/${githubUsername}/${githubRepo}/contents/dandy-routine-data.json`;
  }

  async get() {
    try {
      const response = await fetch(this.fileUrl, { headers: this.headers });
      if (response.status === 404) {
        return null; // File doesn't exist yet
      }
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      // data.content is base64 encoded
      const decoded = atob(data.content);

      // We must return the sha (as `version`) so we can use it to update later
      return {
        version: data.sha,
        data: JSON.parse(decoded)
      };
    } catch (e) {
      console.error('Failed to get data from GitHub:', e);
      throw e;
    }
  }

  /**
   * @param {Object} payload The entire app state tree
   * @param {string} [version] The previous sha if we know it, to prevent conflicting overwrites
   */
  async set(payload, version = null) {
    try {
      // If we don't have a sha, we must fetch the file first to get the current sha
      // Otherwise, the GitHub API will reject the update
      let currentSha = version;
      if (!currentSha) {
        try {
          const response = await fetch(this.fileUrl, { headers: this.headers });
          if (response.ok) {
            const data = await response.json();
            currentSha = data.sha;
          }
        } catch(e) {
          // 404 is fine, it means it's a new file
        }
      }

      const content = btoa(JSON.stringify(payload, null, 2));

      const body = {
        message: 'Sync Dandy Routine Data',
        content,
      };

      if (currentSha) {
        body.sha = currentSha;
      }

      const putResponse = await fetch(this.fileUrl, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(body)
      });

      if (!putResponse.ok) {
        const errorData = await putResponse.json();
        // Check for 409 Conflict
        if (putResponse.status === 409) {
            throw new Error('409_CONFLICT');
        }
        throw new Error(`Failed to save to GitHub: ${errorData.message}`);
      }

      const putData = await putResponse.json();
      return putData.content.sha; // Return the new sha
    } catch (e) {
      console.error('Failed to set data to GitHub:', e);
      throw e;
    }
  }
}

export const githubAdapter = new GitHubAdapter();
