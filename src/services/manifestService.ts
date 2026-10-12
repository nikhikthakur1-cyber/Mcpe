import { BedrockManifest, ValidationIssue } from '../types';
import { generateDistinctUUIDs, isValidUUID } from '../utils/uuid';

export function createDefaultManifest(
  name: string = 'My Resource Pack',
  description: string = 'Created with Bedrock Texture Studio'
): BedrockManifest {
  const { headerUuid, moduleUuid } = generateDistinctUUIDs();

  return {
    format_version: 2,
    header: {
      name: name.trim() || 'My Resource Pack',
      description: description.trim() || 'Custom Minecraft Bedrock resource pack',
      uuid: headerUuid,
      version: [1, 0, 0],
      min_engine_version: [1, 26, 52],
    },
    modules: [
      {
        type: 'resources',
        uuid: moduleUuid,
        version: [1, 0, 0],
        description: 'Resource pack module',
      },
    ],
    metadata: {
      authors: [],
      license: 'MIT',
      url: '',
    },
  };
}

export function formatManifestJSON(manifest: BedrockManifest): string {
  return JSON.stringify(manifest, null, 2);
}

export interface ParseManifestResult {
  manifest?: BedrockManifest;
  error?: string;
}

export function parseManifestJSON(rawJson: string): ParseManifestResult {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { error: 'Manifest root must be an object.' };
    }
    return { manifest: parsed as BedrockManifest };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON format';
    return { error: msg };
  }
}

export function validateManifest(manifest: Partial<BedrockManifest>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (manifest.format_version !== 2) {
    issues.push({
      id: 'manifest_format_version',
      severity: 'warning',
      title: 'Unexpected format_version',
      message: 'Bedrock resource pack manifests usually specify "format_version": 2.',
      fieldOrPath: 'format_version',
      fixAction: 'navigate_manifest',
    });
  }

  // Header validation
  if (!manifest.header) {
    issues.push({
      id: 'manifest_missing_header',
      severity: 'error',
      title: 'Missing Header',
      message: 'The manifest must define a "header" object.',
      fieldOrPath: 'header',
      fixAction: 'navigate_manifest',
    });
    return issues;
  }

  const { name, description, uuid, version, min_engine_version } = manifest.header;

  if (!name || typeof name !== 'string' || !name.trim()) {
    issues.push({
      id: 'manifest_empty_name',
      severity: 'error',
      title: 'Pack Name Missing',
      message: 'Header name cannot be empty. Minecraft requires a visible pack title.',
      fieldOrPath: 'header.name',
      fixAction: 'navigate_manifest',
    });
  }

  if (description === undefined || typeof description !== 'string') {
    issues.push({
      id: 'manifest_empty_description',
      severity: 'warning',
      title: 'Missing Description',
      message: 'Header description is recommended for Minecraft pack selection screen.',
      fieldOrPath: 'header.description',
      fixAction: 'navigate_manifest',
    });
  }

  if (!uuid || !isValidUUID(uuid)) {
    issues.push({
      id: 'manifest_invalid_header_uuid',
      severity: 'error',
      title: 'Invalid Header UUID',
      message: 'Header UUID must be a valid RFC4122 v4 string.',
      fieldOrPath: 'header.uuid',
      fixAction: 'navigate_manifest',
    });
  }

  if (
    !Array.isArray(version) ||
    version.length !== 3 ||
    version.some((v) => typeof v !== 'number' || v < 0 || !Number.isInteger(v))
  ) {
    issues.push({
      id: 'manifest_invalid_version',
      severity: 'error',
      title: 'Invalid Pack Version',
      message: 'Version must be a 3-element integer array, such as [1, 0, 0].',
      fieldOrPath: 'header.version',
      fixAction: 'navigate_manifest',
    });
  }

  if (
    !Array.isArray(min_engine_version) ||
    min_engine_version.length !== 3 ||
    min_engine_version.some((v) => typeof v !== 'number' || v < 0 || !Number.isInteger(v))
  ) {
    issues.push({
      id: 'manifest_invalid_engine_version',
      severity: 'warning',
      title: 'Invalid min_engine_version',
      message: 'Recommended format is a 3-element integer array, e.g. [1, 20, 0].',
      fieldOrPath: 'header.min_engine_version',
      fixAction: 'navigate_manifest',
    });
  }

  // Modules validation
  if (!Array.isArray(manifest.modules) || manifest.modules.length === 0) {
    issues.push({
      id: 'manifest_missing_modules',
      severity: 'error',
      title: 'No Modules Defined',
      message: 'The manifest must define at least one "resources" module.',
      fieldOrPath: 'modules',
      fixAction: 'navigate_manifest',
    });
    return issues;
  }

  const resourceModule = manifest.modules.find((m) => m && m.type === 'resources');
  if (!resourceModule) {
    issues.push({
      id: 'manifest_no_resource_module',
      severity: 'error',
      title: 'Missing Resources Module',
      message: 'A resource pack manifest requires a module with "type": "resources".',
      fieldOrPath: 'modules[0].type',
      fixAction: 'navigate_manifest',
    });
  } else {
    if (!resourceModule.uuid || !isValidUUID(resourceModule.uuid)) {
      issues.push({
        id: 'manifest_invalid_module_uuid',
        severity: 'error',
        title: 'Invalid Module UUID',
        message: 'Resource module UUID must be a valid RFC4122 v4 string.',
        fieldOrPath: 'modules[0].uuid',
        fixAction: 'navigate_manifest',
      });
    }

    if (
      uuid &&
      resourceModule.uuid &&
      uuid.trim().toLowerCase() === resourceModule.uuid.trim().toLowerCase()
    ) {
      issues.push({
        id: 'manifest_duplicate_uuid',
        severity: 'error',
        title: 'Duplicate Header and Module UUID',
        message:
          'Header UUID and Module UUID must be distinct! Duplicate UUIDs cause Minecraft import failures.',
        fieldOrPath: 'header.uuid',
        fixAction: 'regenerate_uuid',
      });
    }
  }

  return issues;
}
