import { BedrockManifest, ConnectionGraph, JsonDefinitionLink, ProjectFile, TextureReference } from '../types';

/**
 * Normalizes texture references: in Bedrock, JSON mappings often omit the .png extension.
 */
function resolveBedrockTexturePath(ref: string, availablePaths: Set<string>): { resolved: string; exists: boolean } {
  const cleanRef = ref.replace(/\\/g, '/').replace(/^\/+/, '');
  const withPng = cleanRef.endsWith('.png') ? cleanRef : `${cleanRef}.png`;

  if (availablePaths.has(withPng)) {
    return { resolved: withPng, exists: true };
  }
  if (availablePaths.has(cleanRef)) {
    return { resolved: cleanRef, exists: true };
  }
  return { resolved: withPng, exists: false };
}

/**
 * Recursively scans a JSON object for values that look like texture references.
 */
function extractTextureRefs(
  data: unknown,
  availablePaths: Set<string>,
  currentPath: string = ''
): TextureReference[] {
  const refs: TextureReference[] = [];

  if (typeof data === 'string') {
    const val = data.trim();
    if (
      val.startsWith('textures/') ||
      val.endsWith('.png') ||
      val.toLowerCase() === 'pack_icon.png' ||
      val.toLowerCase() === 'pack_icon'
    ) {
      const { resolved, exists } = resolveBedrockTexturePath(val, availablePaths);
      refs.push({
        rawReference: val,
        resolvedPath: resolved,
        exists,
        jsonKeyPath: currentPath,
      });
    }
  } else if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      refs.push(...extractTextureRefs(data[i], availablePaths, currentPath ? `${currentPath}[${i}]` : `[${i}]`));
    }
  } else if (data && typeof data === 'object') {
    for (const [key, val] of Object.entries(data)) {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      refs.push(...extractTextureRefs(val, availablePaths, nextPath));
    }
  }

  return refs;
}

/**
 * Builds the fast Connection Graph linking JSON files to textures.
 */
export function buildConnectionGraph(
  files: Record<string, ProjectFile>,
  manifest: BedrockManifest
): ConnectionGraph {
  const availablePaths = new Set(Object.keys(files));
  const jsonNodes: JsonDefinitionLink[] = [];
  const referencedPathsSet = new Set<string>();

  // 1. Root manifest.json
  const manifestRefs: TextureReference[] = [];
  const { resolved: iconPath, exists: iconExists } = resolveBedrockTexturePath('pack_icon.png', availablePaths);
  manifestRefs.push({
    rawReference: 'pack_icon.png',
    resolvedPath: iconPath,
    exists: iconExists,
    jsonKeyPath: 'root.pack_icon',
  });
  if (iconExists) referencedPathsSet.add(iconPath);

  jsonNodes.push({
    jsonPath: 'manifest.json',
    title: 'Pack Manifest (manifest.json)',
    type: 'manifest',
    references: manifestRefs,
  });

  // 2. Scan all JSON files in the project
  for (const [filePath, file] of Object.entries(files)) {
    if (!filePath.toLowerCase().endsWith('.json') || filePath.toLowerCase() === 'manifest.json') {
      continue;
    }

    try {
      const text = new TextDecoder('utf-8').decode(file.data);
      // Fast check: if text doesn't contain "textures" or ".png", skip deep traversal
      if (!text.includes('textures') && !text.includes('.png') && !text.includes('pack_icon')) {
        jsonNodes.push({
          jsonPath: filePath,
          title: file.name,
          type: 'generic',
          references: [],
        });
        continue;
      }

      const parsed = JSON.parse(text);
      const refs = extractTextureRefs(parsed, availablePaths);

      refs.forEach((r) => {
        if (r.exists) referencedPathsSet.add(r.resolvedPath);
      });

      let type: 'terrain' | 'item' | 'generic' = 'generic';
      let title = file.name;

      if (filePath.includes('terrain_texture.json')) {
        type = 'terrain';
        title = 'Terrain Texture Atlas (terrain_texture.json)';
      } else if (filePath.includes('item_texture.json')) {
        type = 'item';
        title = 'Item Texture Atlas (item_texture.json)';
      }

      jsonNodes.push({
        jsonPath: filePath,
        title,
        type,
        references: refs,
      });
    } catch {
      jsonNodes.push({
        jsonPath: filePath,
        title: file.name,
        type: 'generic',
        references: [],
      });
    }
  }

  // 3. Find unreferenced PNG textures
  const unreferencedTextures: string[] = [];
  for (const path of availablePaths) {
    if (path.toLowerCase().endsWith('.png') && !referencedPathsSet.has(path)) {
      unreferencedTextures.push(path);
    }
  }

  let totalLinked = 0;
  let missingCount = 0;
  for (const node of jsonNodes) {
    for (const ref of node.references) {
      if (ref.exists) totalLinked++;
      else missingCount++;
    }
  }

  return {
    jsonNodes,
    unreferencedTextures,
    totalLinkedTextures: totalLinked,
    missingReferencesCount: missingCount,
  };
}
