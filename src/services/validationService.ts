import { ProjectData, ValidationIssue } from '../types';
import { validateManifest } from './manifestService';
import { sanitizeArchivePath } from './archiveService';

export function runFullValidation(project: ProjectData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Manifest Validation
  if (!project.manifest) {
    issues.push({
      id: 'missing_manifest',
      severity: 'error',
      title: 'Missing Manifest',
      message: 'The project does not have a manifest.json. Minecraft packs require a manifest to load.',
      fieldOrPath: 'manifest.json',
      fixAction: 'navigate_manifest',
    });
  } else {
    const manifestIssues = validateManifest(project.manifest);
    issues.push(...manifestIssues);
  }

  // 2. Check pack_icon.png
  const hasPackIcon = Object.keys(project.files).some(
    (p) => p.toLowerCase() === 'pack_icon.png'
  );
  if (!hasPackIcon) {
    issues.push({
      id: 'missing_pack_icon',
      severity: 'warning',
      title: 'Recommended: Pack Icon Missing',
      message: 'Adding a "pack_icon.png" at the root level provides a custom icon in Minecraft\'s resource pack list.',
      fieldOrPath: 'pack_icon.png',
      fixAction: 'navigate_explorer',
    });
  }

  // 3. File path safety and duplicate checks
  const seenNormalizedPaths = new Set<string>();
  let customTextureCount = 0;

  for (const [rawPath, file] of Object.entries(project.files)) {
    const sanitized = sanitizeArchivePath(rawPath);
    if (!sanitized) {
      issues.push({
        id: `unsafe_path_${rawPath}`,
        severity: 'error',
        title: 'Unsafe File Path',
        message: `File path "${rawPath}" contains illegal relative directory traversal (..) or invalid syntax.`,
        fieldOrPath: rawPath,
        fixAction: 'navigate_explorer',
      });
      continue;
    }

    const lower = sanitized.toLowerCase();
    if (seenNormalizedPaths.has(lower)) {
      issues.push({
        id: `duplicate_path_${lower}`,
        severity: 'error',
        title: 'Duplicate File Path',
        message: `Multiple files resolve to "${sanitized}". Paths in resource packs must be case-insensitively unique.`,
        fieldOrPath: sanitized,
        fixAction: 'navigate_explorer',
      });
    }
    seenNormalizedPaths.add(lower);

    if (file.isCustom || sanitized.startsWith('textures/')) {
      customTextureCount++;
    }

    // Check PNG format validity for image files
    if (sanitized.endsWith('.png')) {
      if (file.data.length < 8) {
        issues.push({
          id: `corrupt_png_${sanitized}`,
          severity: 'error',
          title: 'Truncated Image File',
          message: `Texture "${sanitized}" has fewer than 8 bytes and is corrupted or empty.`,
          fieldOrPath: sanitized,
          fixAction: 'navigate_textures',
        });
      } else {
        // PNG magic signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
        const isPngHeader =
          file.data[0] === 0x89 &&
          file.data[1] === 0x50 &&
          file.data[2] === 0x4e &&
          file.data[3] === 0x47 &&
          file.data[4] === 0x0d &&
          file.data[5] === 0x0a &&
          file.data[6] === 0x1a &&
          file.data[7] === 0x0a;

        if (!isPngHeader) {
          issues.push({
            id: `non_png_header_${sanitized}`,
            severity: 'warning',
            title: 'Non-Standard PNG Header',
            message: `"${sanitized}" does not have the standard 8-byte PNG file magic bytes. Minecraft may fail to decode it.`,
            fieldOrPath: sanitized,
            fixAction: 'navigate_textures',
          });
        }
      }
    }
  }

  // 4. Custom texture mapping consistency
  for (const [slotId, targetPath] of Object.entries(project.customSlots)) {
    if (!project.files[targetPath]) {
      issues.push({
        id: `missing_mapped_file_${slotId}`,
        severity: 'error',
        title: 'Custom Texture File Missing',
        message: `Slot "${slotId}" is mapped to "${targetPath}", but the file is missing from the project files.`,
        fieldOrPath: targetPath,
        fixAction: 'navigate_textures',
      });
    }
  }

  if (customTextureCount === 0) {
    issues.push({
      id: 'no_custom_textures',
      severity: 'info',
      title: 'No Custom Textures Yet',
      message: 'This pack currently has no custom textures. Add PNG textures in the Texture Browser to customize game blocks or items.',
      fixAction: 'navigate_textures',
    });
  }

  return issues;
}
