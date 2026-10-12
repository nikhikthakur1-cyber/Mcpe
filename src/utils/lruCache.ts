/**
 * LRU (Least Recently Used) Blob URL Cache.
 * Keeps memory usage minimal for large texture packs by evicting and revoking older Object URLs.
 */
class LruBlobUrlCache {
  private cache = new Map<string, string>(); // key -> objectUrl
  private maxCapacity: number;

  constructor(maxCapacity: number = 48) {
    this.maxCapacity = maxCapacity;
  }

  get(key: string): string | undefined {
    const url = this.cache.get(key);
    if (url) {
      // Refresh recency
      this.cache.delete(key);
      this.cache.set(key, url);
    }
    return url;
  }

  set(key: string, data: Uint8Array, mimeType: string = 'image/png'): string {
    if (this.cache.has(key)) {
      const existingUrl = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, existingUrl);
      return existingUrl;
    }

    if (this.cache.size >= this.maxCapacity) {
      // Evict oldest item (first entry in Map)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        const oldestUrl = this.cache.get(oldestKey);
        if (oldestUrl) {
          try {
            URL.revokeObjectURL(oldestUrl);
          } catch {
            // ignore
          }
        }
        this.cache.delete(oldestKey);
      }
    }

    const blob = new Blob([data as BlobPart], { type: mimeType });
    const newUrl = URL.createObjectURL(blob);
    this.cache.set(key, newUrl);
    return newUrl;
  }

  clear(): void {
    for (const url of this.cache.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    this.cache.clear();
  }
}

export const textureUrlCache = new LruBlobUrlCache(48);
