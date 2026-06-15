/**
 * StorageAdapter interface
 * Defines the contract for getting and setting data.
 * All operations return Promises to ensure compatibility with asynchronous cloud storage engines in the future.
 */
export class StorageAdapter {
  /**
   * @param {string} key
   * @returns {Promise<any>} The parsed JSON data, or null if not found
   */
  async get(key) {
    return this.getSync(key);
  }

  /**
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async set(key, value) {
    this.setSync(key, value);
  }

  /**
   * @param {string} key
   * @returns {any}
   */
  getSync(key) {
    throw new Error('Method not implemented.');
  }

  /**
   * @param {string} key
   * @param {any} value
   */
  setSync(key, value) {
    throw new Error('Method not implemented.');
  }
}
