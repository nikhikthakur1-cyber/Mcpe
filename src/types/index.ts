export type TextureCategory = 'blocks' | 'items' | 'entity' | 'ui' | 'environment' | 'particle';

export interface TextureSlot {
  id: string;
  name: string;
  category: TextureCategory;
  path: string; // Exact Bedrock resource pack relative path
  description: string;
  recommendedWidth: number;
  recommendedHeight: number;
  sampleColor?: string; // Fallback subtle theme color for preview
  iconType?: string;
}

export interface BedrockManifestHeader {
  name: string;
  description: string;
  uuid: string;
  version: [number, number, number];
  min_engine_version: [number, number, number];
}

export interface BedrockManifestModule {
  type: 'resources';
  uuid: string;
  version: [number, number, number];
  description?: string;
}

export interface BedrockManifestMetadata {
  authors?: string[];
  license?: string;
  url?: string;
}

export interface BedrockManifest {
  format_version: 2;
  header: BedrockManifestHeader;
  modules: BedrockManifestModule[];
  metadata?: BedrockManifestMetadata;
}

export interface ProjectFile {
  path: string; // Cleaned relative path, e.g. "textures/blocks/stone.png"
  name: string; // Filename, e.g. "stone.png"
  data: Uint8Array;
  mimeType: string;
  isCustom?: boolean;
  slotId?: string;
  updatedAt: number;
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  manifest: BedrockManifest;
  files: Record<string, ProjectFile>; // path -> file
  customSlots: Record<string, string>; // slotId -> path
  createdAt: number;
  updatedAt: number;
}

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  title: string;
  message: string;
  fieldOrPath?: string;
  fixAction?: 'navigate_manifest' | 'navigate_textures' | 'navigate_explorer' | 'regenerate_uuid';
}

export type ActiveTab = 'textures' | 'explorer' | 'manifest' | 'tree' | 'validation';

export interface TextureReference {
  rawReference: string; // e.g. "textures/blocks/stone" or "textures/blocks/stone.png"
  resolvedPath: string; // "textures/blocks/stone.png"
  exists: boolean;
  jsonKeyPath: string; // e.g. "texture_data.stone.textures"
}

export interface JsonDefinitionLink {
  jsonPath: string; // e.g. "textures/terrain_texture.json"
  title: string;
  type: 'manifest' | 'terrain' | 'item' | 'generic';
  references: TextureReference[];
}

export interface ConnectionGraph {
  jsonNodes: JsonDefinitionLink[];
  unreferencedTextures: string[];
  totalLinkedTextures: number;
  missingReferencesCount: number;
}
