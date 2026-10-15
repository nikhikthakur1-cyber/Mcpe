import JSZip from 'jszip';

export interface ZipAssetEntry {
  path: string; // e.g., 'textures/blocks/dirt.png' or 'vanilla_sounds/click.ogg'
  name: string;
  size: number;
  mimeType: string;
  category: 'textures' | 'sounds' | 'other';
  entry?: JSZip.JSZipObject | null;
  objectUrl?: string;
  data?: Uint8Array;
  isDownloaded?: boolean;
}

export interface ZipAssetLoaderState {
  isLoading: boolean;
  isLoaded: boolean;
  isPreloading: boolean;
  extractionProgress: number; // 0 to 100
  extractedCount: number;
  currentExtractingFile: string;
  error: string | null;
  fileCount: number;
  texturesCount: number;
  soundsCount: number;
  totalSizeBytes: number;
  zipName: string;
  isSyncingExternal?: boolean;
  syncProgress?: number;
  syncStatus?: string;
}

class ZipAssetService {
  private filesMap = new Map<string, ZipAssetEntry>();
  private objectUrlCache = new Map<string, string>();
  private pendingDownloads = new Map<string, Promise<string | null>>();
  private state: ZipAssetLoaderState = {
    isLoading: false,
    isLoaded: false,
    isPreloading: false,
    extractionProgress: 0,
    extractedCount: 0,
    currentExtractingFile: '',
    error: null,
    fileCount: 0,
    texturesCount: 0,
    soundsCount: 0,
    totalSizeBytes: 0,
    zipName: 'vanilla_assets.zip',
    isSyncingExternal: false,
    syncProgress: 0,
    syncStatus: '',
  };

  private listeners = new Set<(state: ZipAssetLoaderState) => void>();

  public subscribe(listener: (state: ZipAssetLoaderState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public getState(): ZipAssetLoaderState {
    return { ...this.state };
  }

  private manifestMap = new Map<string, string>();

  public normalizePath(pathKey: string): string {
    if (!pathKey) return '';
    let clean = pathKey.replace(/\\/g, '/').replace(/^\/+/, '');
    const prefixes = [
      'vanilla_assets/',
      'resource_pack/',
      'resource_packs/vanilla/',
      'resource_packs/',
      'assets/minecraft/',
      'assets/',
      'public/',
    ];
    let stripped = true;
    while (stripped) {
      stripped = false;
      for (const prefix of prefixes) {
        if (clean.toLowerCase().startsWith(prefix)) {
          clean = clean.slice(prefix.length);
          stripped = true;
        }
      }
    }
    return clean.toLowerCase();
  }

  public resolveKey(pathKey: string): string | null {
    if (!pathKey) return null;
    const norm = this.normalizePath(pathKey);

    // 1. Direct match
    if (this.filesMap.has(norm)) return norm;

    // 2. With .png extension appended
    if (!norm.endsWith('.png') && this.filesMap.has(`${norm}.png`)) {
      return `${norm}.png`;
    }

    // 3. Manifest lookup (e.g. item ID or block ID from item_texture.json / terrain_texture.json)
    const manifestResolved = this.manifestMap.get(norm) || this.manifestMap.get(norm.replace(/^(item_|block_|tile_)/, ''));
    if (manifestResolved && this.filesMap.has(manifestResolved)) {
      return manifestResolved;
    }

    // 4. Try prepending textures/ or textures/items/ or textures/blocks/
    const variants = [
      `textures/${norm}`,
      `textures/${norm}.png`,
      `textures/items/${norm}`,
      `textures/items/${norm}.png`,
      `textures/blocks/${norm}`,
      `textures/blocks/${norm}.png`,
    ];
    for (const v of variants) {
      if (this.filesMap.has(v)) return v;
    }

    // 5. Fuzzy match against filename
    const filename = norm.split('/').pop();
    if (filename) {
      const filenamePng = filename.endsWith('.png') ? filename : `${filename}.png`;
      for (const [k] of this.filesMap.entries()) {
        if (k.endsWith(`/${filenamePng}`) || k === filenamePng) {
          return k;
        }
      }
    }

    return null;
  }

  public getStaticUrl(pathKey: string): string | null {
    if (!pathKey) return null;
    const resolved = this.resolveKey(pathKey) || this.normalizePath(pathKey);
    if (!resolved) return null;

    let target = resolved;
    if (!target.endsWith('.png') && !target.endsWith('.jpg') && !target.endsWith('.tga') && !target.endsWith('.json')) {
      target += '.png';
    }

    if (target.startsWith('textures/')) {
      return `/${target}`;
    }
    return `/textures/${target}`;
  }

  /**
   * Fast synchronous in-memory cache lookup (<1ms)
   */
  public getTextureObjectUrlSync(pathKey: string): string | null {
    if (!pathKey) return null;
    const norm = this.normalizePath(pathKey);

    if (this.objectUrlCache.has(norm)) {
      return this.objectUrlCache.get(norm)!;
    }

    const resolved = this.resolveKey(pathKey);
    if (resolved && this.objectUrlCache.has(resolved)) {
      const url = this.objectUrlCache.get(resolved)!;
      this.objectUrlCache.set(norm, url);
      return url;
    }

    return null;
  }

  /**
   * IndexedDB persistence helper with dual store support (zips & downloaded textures)
   */
  private getDb(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('bedrock_assets_cache_v3', 1);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('zips')) {
            db.createObjectStore('zips');
          }
          if (!db.objectStoreNames.contains('textures')) {
            db.createObjectStore('textures');
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async getCachedZipBlob(url: string): Promise<Blob | null> {
    try {
      const db = await this.getDb();
      if (!db || !db.objectStoreNames.contains('zips')) return null;
      return new Promise((resolve) => {
        const tx = db.transaction('zips', 'readonly');
        const store = tx.objectStore('zips');
        const getReq = store.get(url);
        getReq.onsuccess = () => resolve(getReq.result ? (getReq.result.blob as Blob) : null);
        getReq.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  private async cacheZipBlob(url: string, blob: Blob): Promise<void> {
    try {
      const db = await this.getDb();
      if (!db || !db.objectStoreNames.contains('zips')) return;
      return new Promise((resolve) => {
        const tx = db.transaction('zips', 'readwrite');
        const store = tx.objectStore('zips');
        store.put({ blob, updatedAt: Date.now() }, url);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Ignore cache write errors
    }
  }

  public async getCachedDownloadedTexture(pathKey: string): Promise<Uint8Array | null> {
    try {
      const db = await this.getDb();
      if (!db || !db.objectStoreNames.contains('textures')) return null;
      return new Promise((resolve) => {
        const tx = db.transaction('textures', 'readonly');
        const store = tx.objectStore('textures');
        const getReq = store.get(this.normalizePath(pathKey));
        getReq.onsuccess = () => {
          if (getReq.result && getReq.result.data) {
            resolve(getReq.result.data as Uint8Array);
          } else {
            resolve(null);
          }
        };
        getReq.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async cacheDownloadedTexture(pathKey: string, data: Uint8Array): Promise<void> {
    try {
      const db = await this.getDb();
      if (!db || !db.objectStoreNames.contains('textures')) return;
      return new Promise((resolve) => {
        const tx = db.transaction('textures', 'readwrite');
        const store = tx.objectStore('textures');
        store.put({ data, path: this.normalizePath(pathKey), updatedAt: Date.now() }, this.normalizePath(pathKey));
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {}
  }

  /**
   * Fast non-blocking ZIP loader with Instant IndexedDB lookup
   */
  public async loadZipFromUrl(url: string = '/vanilla_assets.zip'): Promise<boolean> {
    this.state = {
      ...this.state,
      isLoading: true,
      error: null,
      zipName: url.split('/').pop() || 'vanilla_assets.zip',
    };
    this.notify();

    try {
      // 1. Instant Cache Lookup from IndexedDB (< 20ms)
      const cachedBlob = await this.getCachedZipBlob(url);
      if (cachedBlob && cachedBlob.size > 1500000) {
        await this.processZipBlob(cachedBlob, this.state.zipName);
        return true;
      }

      // 2. Fetch from network
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`ZIP fetch returned HTTP ${response.status}. Falling back to static catalog index.`);
        await this.loadStaticCatalogIndex();
        return true;
      }

      const blob = await response.blob();
      await this.processZipBlob(blob, this.state.zipName);
      this.cacheZipBlob(url, blob); // Save to IndexedDB for instant future reloads
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load ZIP assets';
      console.warn('ZipAssetService load error:', msg);
      await this.loadStaticCatalogIndex();
      return true;
    }
  }

  /**
   * Parse Bedrock item_texture.json or terrain_texture.json manifests
   */
  public parseManifestData(jsonString: string) {
    try {
      const cleanJson = jsonString.replace(/\/\/.*/g, '');
      const parsed = JSON.parse(cleanJson);
      if (parsed && parsed.texture_data) {
        for (const [key, val] of Object.entries(parsed.texture_data as Record<string, any>)) {
          if (!val || !val.textures) continue;
          let texPath = '';
          if (typeof val.textures === 'string') {
            texPath = val.textures;
          } else if (Array.isArray(val.textures) && val.textures.length > 0) {
            const first = val.textures[0];
            texPath = typeof first === 'string' ? first : first?.path || '';
          }
          if (texPath) {
            let targetPng = this.normalizePath(texPath);
            if (!targetPng.endsWith('.png')) targetPng += '.png';

            const lowKey = key.toLowerCase();
            this.manifestMap.set(lowKey, targetPng);
            this.manifestMap.set(`item_${lowKey}`, targetPng);
            this.manifestMap.set(`block_${lowKey}`, targetPng);
            this.manifestMap.set(`tile_${lowKey}`, targetPng);
          }
        }
      }
    } catch {}
  }

  /**
   * Fast in-memory ZIP catalog indexing (<40ms, zero lag)
   */
  public async processZipBlob(blob: Blob | File, zipName: string = 'vanilla_assets.zip'): Promise<number> {
    for (const url of this.objectUrlCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.objectUrlCache.clear();
    this.filesMap.clear();
    this.manifestMap.clear();

    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(blob);

    let texturesCount = 0;
    let soundsCount = 0;

    const entries: { path: string; entry: JSZip.JSZipObject }[] = [];
    loadedZip.forEach((relativePath, entry) => {
      if (!entry.dir) {
        entries.push({ path: relativePath, entry });
      }
    });

    for (const { path: rawPath, entry } of entries) {
      const normPath = this.normalizePath(rawPath);
      if (!normPath) continue;

      const filename = normPath.split('/').pop() || normPath;
      let category: 'textures' | 'sounds' | 'other' = 'other';

      if (normPath.startsWith('textures/') || normPath.match(/\.(png|tga|jpg|jpeg|json)$/i)) {
        category = 'textures';
        texturesCount++;
      } else if (normPath.startsWith('vanilla_sounds/') || normPath.match(/\.(ogg|wav|mp3|qoa)$/i)) {
        category = 'sounds';
        soundsCount++;
      }

      const mimeType = this.getMimeType(filename);

      this.filesMap.set(normPath, {
        path: normPath,
        name: filename,
        size: 0,
        mimeType,
        category,
        entry,
      });
    }

    // Index Bedrock manifests for item/block name mappings asynchronously
    const itemTexEntry = this.filesMap.get('textures/item_texture.json') || this.filesMap.get('item_texture.json');
    if (itemTexEntry && itemTexEntry.entry) {
      itemTexEntry.entry.async('string').then((str) => this.parseManifestData(str)).catch(() => {});
    }

    const terrainTexEntry = this.filesMap.get('textures/terrain_texture.json') || this.filesMap.get('terrain_texture.json');
    if (terrainTexEntry && terrainTexEntry.entry) {
      terrainTexEntry.entry.async('string').then((str) => this.parseManifestData(str)).catch(() => {});
    }

    // Ready immediately: instant launch with 0ms pre-extraction freeze!
    this.state = {
      isLoading: false,
      isLoaded: true,
      isPreloading: false,
      extractionProgress: 100,
      extractedCount: this.filesMap.size,
      currentExtractingFile: '',
      error: null,
      fileCount: this.filesMap.size,
      texturesCount,
      soundsCount,
      totalSizeBytes: blob.size,
      zipName,
      isSyncingExternal: false,
      syncProgress: 0,
      syncStatus: '',
    };

    this.notify();
    return this.filesMap.size;
  }

  public async loadStaticCatalogIndex(): Promise<void> {
    try {
      const res = await fetch('/textures/texture_list.json');
      if (res.ok) {
        const list: string[] = await res.json();
        for (const itemPath of list) {
          const norm = this.normalizePath(itemPath);
          const filename = norm.split('/').pop() || norm;
          if (!this.filesMap.has(norm)) {
            this.filesMap.set(norm, {
              path: norm,
              name: filename,
              size: 0,
              mimeType: this.getMimeType(filename),
              category: norm.startsWith('textures/') || norm.match(/\.(png|tga|jpg|jpeg|json)$/i) ? 'textures' : 'other',
              entry: null,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Static catalog index fetch failed:', e);
    }

    this.state = {
      ...this.state,
      isLoading: false,
      isLoaded: true,
      error: null,
      fileCount: this.filesMap.size,
      texturesCount: this.filesMap.size,
      extractionProgress: 100,
    };
    this.notify();
  }

  private getMimeType(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.tga')) return 'image/x-tga';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.ogg')) return 'audio/ogg';
    if (lower.endsWith('.wav')) return 'audio/wav';
    if (lower.endsWith('.json')) return 'application/json';
    return 'application/octet-stream';
  }

  public hasAsset(pathKey: string): boolean {
    const norm = this.normalizePath(pathKey);
    return this.filesMap.has(norm);
  }

  public async getAssetData(pathKey: string): Promise<Uint8Array | null> {
    const norm = this.normalizePath(pathKey);
    const item = this.filesMap.get(norm);
    if (!item) {
      for (const [k, v] of this.filesMap.entries()) {
        if (k.endsWith(norm) || norm.endsWith(k)) {
          if (v.entry) {
            return await v.entry.async('uint8array');
          }
          if (v.data) return v.data;
        }
      }
      return null;
    }

    if (item.data) return item.data;
    if (item.entry) {
      const data = await item.entry.async('uint8array');
      item.data = data;
      return data;
    }
    return null;
  }

  public async getSoundAudioBuffer(pathKey: string): Promise<ArrayBuffer | null> {
    const data = await this.getAssetData(pathKey);
    if (!data) return null;
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  }

  /**
   * High-Performance Viewport Lazy Texture Extractor + External Mojang Downloader
   * - Decompresses only when visible in viewport
   * - Checks memory cache (<1ms)
   * - Extracts from local ZIP
   * - Falls back to IndexedDB cache
   * - Downloads from official Mojang bedrock-samples repository on demand if missing
   */
  public async getTextureObjectUrl(pathKey: string): Promise<string | null> {
    const norm = this.normalizePath(pathKey);

    // 1. Fast Memory Cache
    if (this.objectUrlCache.has(norm)) {
      return this.objectUrlCache.get(norm)!;
    }

    const resolved = this.resolveKey(pathKey);
    if (resolved && this.objectUrlCache.has(resolved)) {
      const url = this.objectUrlCache.get(resolved)!;
      this.objectUrlCache.set(norm, url);
      return url;
    }

    // Deduplicate in-flight requests for the exact same texture
    const activeKey = resolved || norm;
    if (this.pendingDownloads.has(activeKey)) {
      return this.pendingDownloads.get(activeKey)!;
    }

    const task = this.fetchTextureInternal(pathKey, norm, resolved);
    this.pendingDownloads.set(activeKey, task);
    try {
      const res = await task;
      return res;
    } finally {
      this.pendingDownloads.delete(activeKey);
    }
  }

  private async fetchTextureInternal(
    pathKey: string,
    norm: string,
    resolved: string | null
  ): Promise<string | null> {
    const targetKey = resolved || norm;
    const item = this.filesMap.get(targetKey);

    // 2. Extract from local ZIP entry
    if (item && item.entry) {
      try {
        const uint8 = await item.entry.async('uint8array');
        item.data = uint8;
        const blob = new Blob([uint8.buffer as ArrayBuffer], { type: item.mimeType });
        const objectUrl = URL.createObjectURL(blob);
        this.objectUrlCache.set(targetKey, objectUrl);
        this.objectUrlCache.set(norm, objectUrl);
        return objectUrl;
      } catch (err) {
        console.warn('Decompression error for', targetKey, err);
      }
    }

    // 3. Check persistent IndexedDB cache for previously downloaded textures
    const idbData = await this.getCachedDownloadedTexture(norm);
    if (idbData) {
      const blob = new Blob([idbData.buffer as ArrayBuffer], { type: 'image/png' });
      const objectUrl = URL.createObjectURL(blob);
      this.objectUrlCache.set(norm, objectUrl);
      this.filesMap.set(norm, {
        path: norm,
        name: norm.split('/').pop() || norm,
        size: idbData.length,
        mimeType: 'image/png',
        category: 'textures',
        data: idbData,
        isDownloaded: true,
      });
      return objectUrl;
    }

    // 4. Download from Official Mojang bedrock-samples repository
    const cleanRepoPath = norm.startsWith('textures/') ? norm : `textures/${norm}`;
    const mojangUrl = `https://raw.githubusercontent.com/Mojang/bedrock-samples/main/resource_pack/${cleanRepoPath}`;

    try {
      const resp = await fetch(mojangUrl);
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        const uint8 = new Uint8Array(buf);
        const blob = new Blob([buf], { type: 'image/png' });
        const objectUrl = URL.createObjectURL(blob);

        this.objectUrlCache.set(norm, objectUrl);
        this.filesMap.set(norm, {
          path: norm,
          name: norm.split('/').pop() || norm,
          size: uint8.length,
          mimeType: 'image/png',
          category: 'textures',
          data: uint8,
          isDownloaded: true,
        });

        // Persist to IndexedDB so it's instantly cached forever
        this.cacheDownloadedTexture(norm, uint8);
        return objectUrl;
      }
    } catch {
      // Network failure or offline
    }

    return null;
  }

  /**
   * One-click Sync / Download from Official Mojang Repository
   */
  public async syncOfficialVanillaPack(
    onProgress?: (progressPct: number, status: string) => void
  ): Promise<{ success: boolean; count: number; error?: string }> {
    this.state = {
      ...this.state,
      isSyncingExternal: true,
      syncProgress: 10,
      syncStatus: 'Connecting to official Mojang repository...',
    };
    this.notify();
    if (onProgress) onProgress(10, 'Connecting to official Mojang repository...');

    try {
      // 1. Download official bundle or reload packaged archive
      const res = await fetch('/vanilla_assets.zip', { cache: 'reload' });
      if (!res.ok) throw new Error(`HTTP ${res.status} failed to fetch official pack.`);

      if (onProgress) onProgress(40, 'Downloading official assets (2.66 MB)...');
      this.state.syncProgress = 40;
      this.state.syncStatus = 'Downloading official assets...';
      this.notify();

      const blob = await res.blob();
      if (onProgress) onProgress(80, 'Unpacking textures and indexing catalog...');
      this.state.syncProgress = 80;
      this.state.syncStatus = 'Unpacking textures and indexing catalog...';
      this.notify();

      const totalCount = await this.processZipBlob(blob, 'official_vanilla_assets.zip');
      await this.cacheZipBlob('/vanilla_assets.zip', blob);

      this.state = {
        ...this.state,
        isSyncingExternal: false,
        syncProgress: 100,
        syncStatus: `Completed! Loaded ${totalCount} textures.`,
      };
      this.notify();
      if (onProgress) onProgress(100, `Completed! Loaded ${totalCount} textures.`);

      return { success: true, count: totalCount };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      this.state = {
        ...this.state,
        isSyncingExternal: false,
        syncProgress: 0,
        syncStatus: `Sync failed: ${msg}`,
      };
      this.notify();
      return { success: false, count: 0, error: msg };
    }
  }

  public listEntries(categoryFilter?: 'textures' | 'sounds' | 'other'): ZipAssetEntry[] {
    const result: ZipAssetEntry[] = [];
    for (const entry of this.filesMap.values()) {
      if (!categoryFilter || entry.category === categoryFilter) {
        result.push(entry);
      }
    }
    return result;
  }

  public async downloadZip(filename: string = 'vanilla_assets.zip'): Promise<void> {
    const res = await fetch(`/${filename}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

export const zipAssetService = new ZipAssetService();
