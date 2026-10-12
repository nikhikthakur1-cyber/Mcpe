import JSZip from 'jszip';

export interface ZipAssetEntry {
  path: string; // e.g., 'textures/blocks/dirt.png' or 'vanilla_sounds/click.ogg'
  name: string;
  size: number;
  mimeType: string;
  category: 'textures' | 'sounds' | 'other';
  entry: JSZip.JSZipObject;
  objectUrl?: string;
  data?: Uint8Array;
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
}

class ZipAssetService {
  private filesMap = new Map<string, ZipAssetEntry>();
  private objectUrlCache = new Map<string, string>();
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

  /**
   * Normalizes relative asset paths (stripping leading slashes, backslashes, and folder wrappers)
   */
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

  /**
   * Resolves a path key to its exact normalized key inside filesMap
   */
  public resolveKey(pathKey: string): string | null {
    if (!pathKey) return null;
    const norm = this.normalizePath(pathKey);

    // 1. Direct match
    if (this.filesMap.has(norm)) return norm;

    // 2. With .png extension appended
    if (!norm.endsWith('.png') && this.filesMap.has(`${norm}.png`)) {
      return `${norm}.png`;
    }

    // 3. Manifest lookup (e.g., item ID or block ID from item_texture.json / terrain_texture.json)
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
   * Synchronously checks memory cache for an extracted Object URL, falling back to static asset path
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

    // Fuzzy scan
    for (const [k, url] of this.objectUrlCache.entries()) {
      if (k === norm || k.endsWith(norm) || norm.endsWith(k)) {
        this.objectUrlCache.set(norm, url);
        return url;
      }
    }

    return this.getStaticUrl(pathKey);
  }

  /**
   * IndexedDB persistence helper for fast instant zip caching
   */
  private async getCachedZipBlob(url: string): Promise<Blob | null> {
    try {
      return new Promise((resolve) => {
        const req = indexedDB.open('bedrock_assets_cache_db', 1);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('zips')) {
            db.createObjectStore('zips');
          }
        };
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('zips')) return resolve(null);
          const tx = db.transaction('zips', 'readonly');
          const store = tx.objectStore('zips');
          const getReq = store.get(url);
          getReq.onsuccess = () => resolve(getReq.result ? (getReq.result.blob as Blob) : null);
          getReq.onerror = () => resolve(null);
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  private async cacheZipBlob(url: string, blob: Blob): Promise<void> {
    try {
      return new Promise((resolve) => {
        const req = indexedDB.open('bedrock_assets_cache_db', 1);
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('zips')) {
            db.createObjectStore('zips');
          }
        };
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('zips')) return resolve();
          const tx = db.transaction('zips', 'readwrite');
          const store = tx.objectStore('zips');
          store.put({ blob, updatedAt: Date.now() }, url);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        };
        req.onerror = () => resolve();
      });
    } catch {
      // Ignore cache write errors
    }
  }

  /**
   * Loads and extracts assets from a ZIP URL with instant IndexedDB caching
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
      // 1. Instant Cache Lookup from IndexedDB (< 30ms)
      const cachedBlob = await this.getCachedZipBlob(url);
      if (cachedBlob && cachedBlob.size > 1000) {
        await this.processZipBlob(cachedBlob, this.state.zipName);
        this.state = {
          ...this.state,
          isLoading: false,
          isLoaded: true,
          error: null,
        };
        this.notify();

        // Background update check
        fetch(url)
          .then((res) => (res.ok ? res.blob() : null))
          .then((newBlob) => {
            if (newBlob && newBlob.size !== cachedBlob.size) {
              this.cacheZipBlob(url, newBlob);
            }
          })
          .catch(() => {});

        return true;
      }

      // 2. Fetch from network on initial cache miss
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`ZIP fetch returned HTTP ${response.status}. Falling back to static asset catalog index.`);
        await this.loadStaticCatalogIndex();
        return true;
      }

      const blob = await response.blob();
      await this.processZipBlob(blob, this.state.zipName);
      this.cacheZipBlob(url, blob); // Save to IndexedDB for instant future loads

      this.state = {
        ...this.state,
        isLoading: false,
        isLoaded: true,
        error: null,
      };
      this.notify();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load ZIP assets';
      console.warn('ZipAssetService load failed, engaging static index fallback:', msg);
      await this.loadStaticCatalogIndex();
      return true;
    }
  }

  /**
   * Fallback loader that indexes static vanilla assets directly from public/textures
   */
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
              entry: null as any,
            });
          }
        }
      }
    } catch (e) {
      console.warn('Static catalog index fetch failed:', e);
    }

    // Load item & terrain texture manifests
    try {
      const itemRes = await fetch('/textures/item_texture.json');
      if (itemRes.ok) this.parseManifestData(await itemRes.text());
      const terrainRes = await fetch('/textures/terrain_texture.json');
      if (terrainRes.ok) this.parseManifestData(await terrainRes.text());
    } catch {}

    this.state = {
      ...this.state,
      isLoading: false,
      isLoaded: true,
      error: null,
      fileCount: this.filesMap.size,
      texturesCount: this.filesMap.size,
    };
    this.notify();
  }

  /**
   * Helper to parse Bedrock item_texture.json or terrain_texture.json manifests
   */
  public parseManifestData(jsonString: string) {
    try {
      // Strip single line comments from Bedrock JSON files
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
    } catch {
      // Ignore manifest parse errors
    }
  }

  /**
   * Process and unpack raw ZIP blob into memory asset index
   */
  public async processZipBlob(blob: Blob | File, zipName: string = 'custom_assets.zip'): Promise<number> {
    // Revoke old object URLs to prevent memory leaks
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

    // Index Bedrock manifests for item/block name mappings
    const itemTexEntry = this.filesMap.get('textures/item_texture.json') || this.filesMap.get('item_texture.json');
    if (itemTexEntry) {
      itemTexEntry.entry.async('string').then((str) => this.parseManifestData(str)).catch(() => {});
    } else {
      fetch('/textures/item_texture.json').then((r) => r.ok ? r.text() : '').then((str) => str && this.parseManifestData(str)).catch(() => {});
    }

    const terrainTexEntry = this.filesMap.get('textures/terrain_texture.json') || this.filesMap.get('terrain_texture.json');
    if (terrainTexEntry) {
      terrainTexEntry.entry.async('string').then((str) => this.parseManifestData(str)).catch(() => {});
    } else {
      fetch('/textures/terrain_texture.json').then((r) => r.ok ? r.text() : '').then((str) => str && this.parseManifestData(str)).catch(() => {});
    }

    this.state = {
      isLoading: false,
      isLoaded: true,
      isPreloading: false,
      extractionProgress: 0,
      extractedCount: 0,
      currentExtractingFile: '',
      error: null,
      fileCount: this.filesMap.size,
      texturesCount,
      soundsCount,
      totalSizeBytes: blob.size,
      zipName,
    };

    this.notify();

    // Trigger texture pre-extraction in background
    this.preloadAllTextures().catch(() => {});

    return this.filesMap.size;
  }

  /**
   * Pre-extracts and caches texture Object URLs in memory for instant rendering
   */
  public async preloadAllTextures(
    onProgress?: (pct: number, count: number, currentFile: string) => void
  ): Promise<void> {
    if (this.state.isPreloading) return;

    const textureEntries = Array.from(this.filesMap.values()).filter(
      (item) => item.category === 'textures' && item.path.endsWith('.png')
    );

    if (textureEntries.length === 0) {
      this.state = {
        ...this.state,
        isPreloading: false,
        extractionProgress: 100,
      };
      this.notify();
      return;
    }

    this.state = {
      ...this.state,
      isPreloading: true,
      extractionProgress: 0,
      extractedCount: 0,
    };
    this.notify();

    const total = textureEntries.length;
    let completed = 0;
    const chunkSize = 30; // Batch process in chunks to maintain fluid UI frame rates

    for (let i = 0; i < total; i += chunkSize) {
      const chunk = textureEntries.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (item) => {
          try {
            const normKey = this.normalizePath(item.path);
            if (!this.objectUrlCache.has(normKey) && !this.objectUrlCache.has(item.path)) {
              const uint8 = await item.entry.async('uint8array');
              item.data = uint8;
              const blob = new Blob([uint8.buffer as ArrayBuffer], { type: item.mimeType });
              const objectUrl = URL.createObjectURL(blob);
              this.objectUrlCache.set(item.path, objectUrl);
              this.objectUrlCache.set(normKey, objectUrl);

              const filename = item.name.toLowerCase();
              this.objectUrlCache.set(filename, objectUrl);
              if (filename.endsWith('.png')) {
                this.objectUrlCache.set(filename.slice(0, -4), objectUrl);
              }
            }
          } catch {
            // Ignore single item extraction errors
          }
        })
      );

      completed += chunk.length;
      const progress = Math.min(100, Math.round((completed / total) * 100));
      const lastFile = chunk[chunk.length - 1]?.name || '';

      this.state = {
        ...this.state,
        extractionProgress: progress,
        extractedCount: completed,
        currentExtractingFile: lastFile,
      };
      if (onProgress) {
        onProgress(progress, completed, lastFile);
      }
      this.notify();

      // Short yield to event loop
      await new Promise((resolve) => setTimeout(resolve, 8));
    }

    this.state = {
      ...this.state,
      isPreloading: false,
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

  /**
   * Check if a specific file exists inside the ZIP index
   */
  public hasAsset(pathKey: string): boolean {
    const norm = this.normalizePath(pathKey);
    return this.filesMap.has(norm);
  }

  /**
   * Retrieves raw Uint8Array data for an asset from the ZIP
   */
  public async getAssetData(pathKey: string): Promise<Uint8Array | null> {
    const norm = this.normalizePath(pathKey);
    const item = this.filesMap.get(norm);
    if (!item) {
      // Try fuzzy search (e.g. without textures/ prefix)
      for (const [k, v] of this.filesMap.entries()) {
        if (k.endsWith(norm) || norm.endsWith(k)) {
          const data = await v.entry.async('uint8array');
          return data;
        }
      }
      return null;
    }

    if (item.data) return item.data;
    const data = await item.entry.async('uint8array');
    item.data = data;
    return data;
  }

  /**
   * Retrieves audio ArrayBuffer for Web Audio decoding directly from the ZIP
   */
  public async getSoundAudioBuffer(pathKey: string): Promise<ArrayBuffer | null> {
    const data = await this.getAssetData(pathKey);
    if (!data) return null;
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  }

  /**
   * Resolves a texture path into an Object Blob URL loaded directly from the ZIP
   */
  public async getTextureObjectUrl(pathKey: string): Promise<string | null> {
    const norm = this.normalizePath(pathKey);
    if (this.objectUrlCache.has(norm)) {
      return this.objectUrlCache.get(norm)!;
    }

    const item = this.filesMap.get(norm);
    if (!item || !item.entry) {
      // Fuzzy lookup
      for (const [k, v] of this.filesMap.entries()) {
        if (v.entry && (k.endsWith(norm) || norm.endsWith(k))) {
          const uint8 = await v.entry.async('uint8array');
          const blob = new Blob([uint8.buffer as ArrayBuffer], { type: v.mimeType });
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrlCache.set(norm, objectUrl);
          return objectUrl;
        }
      }
      return this.getStaticUrl(pathKey);
    }

    const uint8 = await this.getAssetData(norm);
    if (!uint8) return this.getStaticUrl(pathKey);

    const blob = new Blob([uint8.buffer as ArrayBuffer], { type: item.mimeType });
    const objectUrl = URL.createObjectURL(blob);
    this.objectUrlCache.set(norm, objectUrl);
    return objectUrl;
  }

  /**
   * Returns list of all entries inside the loaded ZIP
   */
  public listEntries(categoryFilter?: 'textures' | 'sounds' | 'other'): ZipAssetEntry[] {
    const result: ZipAssetEntry[] = [];
    for (const entry of this.filesMap.values()) {
      if (!categoryFilter || entry.category === categoryFilter) {
        result.push(entry);
      }
    }
    return result;
  }

  /**
   * Triggers download of the ZIP file
   */
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
