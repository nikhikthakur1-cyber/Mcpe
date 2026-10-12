import JSZip from 'jszip';
import { BedrockManifest, ProjectFile } from '../types';
import { formatManifestJSON, parseManifestJSON } from './manifestService';

/**
 * Normalizes relative file paths, blocking path traversal and stripping leading slashes.
 */
export function sanitizeArchivePath(rawPath: string): string | null {
  const normalized = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  // Disallow directory traversal segments
  const parts = normalized.split('/');
  if (parts.some((p) => p === '..' || p === '.')) {
    return null;
  }
  return normalized;
}

export interface ExportArchiveOptions {
  manifest: BedrockManifest;
  files: Record<string, ProjectFile>;
  filename: string;
}

/**
 * Generates a clean .mcpack (ZIP format) archive with contents at the root level.
 */
export async function generateMcPackArchive({
  manifest,
  files,
}: ExportArchiveOptions): Promise<Blob> {
  const zip = new JSZip();

  // 1. Write root-level manifest.json
  const manifestContent = formatManifestJSON(manifest);
  zip.file('manifest.json', manifestContent);

  // 2. Add all project files at their relative paths
  for (const [pathKey, file] of Object.entries(files)) {
    const cleanPath = sanitizeArchivePath(pathKey);
    if (!cleanPath) continue;

    // Never duplicate manifest.json from virtual files if already generated
    if (cleanPath.toLowerCase() === 'manifest.json') continue;

    zip.file(cleanPath, file.data);
  }

  // 3. Compress into ZIP / .mcpack Blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    mimeType: 'application/octet-stream',
  });

  return blob;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const cleanName = filename.endsWith('.mcpack') ? filename : `${filename}.mcpack`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export interface ImportArchiveResult {
  manifest?: BedrockManifest;
  rawManifestText?: string;
  manifestError?: string;
  files: Record<string, ProjectFile>;
  warning?: string;
}

/**
 * Reads a .mcpack or .zip archive file and unpacks files into the project representation.
 * Automatically normalizes any single top-level directory wrapper.
 */
export async function importArchiveFile(file: File): Promise<ImportArchiveResult> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  // Find all file entries
  const fileEntries: { path: string; entry: JSZip.JSZipObject }[] = [];
  loadedZip.forEach((relativePath, entry) => {
    if (!entry.dir) {
      fileEntries.push({ path: relativePath, entry });
    }
  });

  if (fileEntries.length === 0) {
    throw new Error('The imported archive is empty.');
  }

  // Check if all files are nested under a single root folder (e.g. MyPack/manifest.json)
  let rootPrefix = '';
  const firstPath = fileEntries[0].path;
  const firstSlashIndex = firstPath.indexOf('/');
  if (firstSlashIndex !== -1) {
    const candidatePrefix = firstPath.slice(0, firstSlashIndex + 1);
    const allHavePrefix = fileEntries.every((f) => f.path.startsWith(candidatePrefix));
    if (allHavePrefix) {
      // Check if manifest.json exists either inside or at root
      const hasManifestInside = fileEntries.some(
        (f) => f.path.toLowerCase() === `${candidatePrefix.toLowerCase()}manifest.json`
      );
      if (hasManifestInside) {
        rootPrefix = candidatePrefix;
      }
    }
  }

  const filesMap: Record<string, ProjectFile> = {};
  let manifestEntry: JSZip.JSZipObject | null = null;
  let manifestPath = '';

  for (const { path: rawEntryPath, entry } of fileEntries) {
    let cleanPath = rawEntryPath;
    if (rootPrefix && cleanPath.startsWith(rootPrefix)) {
      cleanPath = cleanPath.slice(rootPrefix.length);
    }

    const sanitized = sanitizeArchivePath(cleanPath);
    if (!sanitized) continue;

    if (sanitized.toLowerCase() === 'manifest.json') {
      manifestEntry = entry;
      manifestPath = sanitized;
      continue;
    }

    const data = await entry.async('uint8array');
    const name = sanitized.split('/').pop() || sanitized;
    const isPng = sanitized.toLowerCase().endsWith('.png');
    const mimeType = isPng ? 'image/png' : 'application/octet-stream';

    filesMap[sanitized] = {
      path: sanitized,
      name,
      data,
      mimeType,
      updatedAt: Date.now(),
    };
  }

  let parsedManifest: BedrockManifest | undefined;
  let rawManifestText: string | undefined;
  let manifestError: string | undefined;

  if (manifestEntry) {
    rawManifestText = await manifestEntry.async('string');
    const parseRes = parseManifestJSON(rawManifestText);
    if (parseRes.error) {
      manifestError = parseRes.error;
    } else {
      parsedManifest = parseRes.manifest;
    }
  } else {
    manifestError = 'Archive does not contain a "manifest.json" file.';
  }

  return {
    manifest: parsedManifest,
    rawManifestText,
    manifestError,
    files: filesMap,
  };
}
