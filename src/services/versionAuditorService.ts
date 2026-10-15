import { BedrockManifest, ProjectFile } from '../types';

export interface BedrockVersionProfile {
  id: string;
  name: string;
  engineVersion: [number, number, number];
  description: string;
  majorAdditions: {
    category: 'blocks' | 'items' | 'entity' | 'ui';
    name: string;
    path: string;
    note: string;
  }[];
}

export const BEDROCK_VERSION_PROFILES: BedrockVersionProfile[] = [
  {
    id: '1.26.52.3',
    name: 'Bedrock / MCPE 1.26.52.3 (Current Play Store Release)',
    engineVersion: [1, 26, 52],
    description: 'Current active Minecraft Bedrock Edition release on Google Play Store with modern render pipeline, updated item frames, and expanded entity models.',
    majorAdditions: [
      {
        category: 'blocks',
        name: 'Crafter (Top & Side)',
        path: 'textures/blocks/crafter_top.png',
        note: 'Automated Redstone crafting block with animated powered states.',
      },
      {
        category: 'blocks',
        name: 'Heavy Core',
        path: 'textures/blocks/heavy_core.png',
        note: 'Trial Chamber relic block used to craft the Mace weapon.',
      },
      {
        category: 'blocks',
        name: 'Trial Spawner',
        path: 'textures/blocks/trial_spawner_side.png',
        note: 'Dynamic battle spawner in Trial Chambers.',
      },
      {
        category: 'blocks',
        name: 'Vault',
        path: 'textures/blocks/vault_top.png',
        note: 'Reward vault opened with trial keys.',
      },
      {
        category: 'blocks',
        name: 'Copper Bulb',
        path: 'textures/blocks/copper_bulb_lit.png',
        note: 'Toggling light source with oxidation stages.',
      },
      {
        category: 'items',
        name: 'Mace',
        path: 'textures/items/mace.png',
        note: 'Heavy smash weapon dealing fall-distance scaling damage.',
      },
      {
        category: 'items',
        name: 'Wind Charge',
        path: 'textures/items/wind_charge.png',
        note: 'Burst projectile dropped by defeated Breeze mobs.',
      },
      {
        category: 'items',
        name: 'Wolf Armor',
        path: 'textures/items/wolf_armor.png',
        note: 'Protective armadillo scute pet armor.',
      },
      {
        category: 'entity',
        name: 'Breeze',
        path: 'textures/entity/breeze/breeze.png',
        note: 'Hostile whirlwind mob found in Trial Chambers.',
      },
      {
        category: 'entity',
        name: 'Armadillo',
        path: 'textures/entity/armadillo/armadillo.png',
        note: 'Savanna mob shedding scutes for wolf armor crafting.',
      },
    ],
  },
];

export interface FolderAuditFinding {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  path?: string;
}

export interface VersionAuditResult {
  targetProfile: BedrockVersionProfile;
  engineVersionMatches: boolean;
  standardFoldersPresent: string[];
  missingStandardFolders: string[];
  javaEditionDetected: boolean;
  findings: FolderAuditFinding[];
  recommendedAdditionsCount: number;
}

const REQUIRED_STANDARD_FOLDERS = [
  'textures/blocks',
  'textures/items',
  'textures/entity',
  'textures/ui',
  'textures/environment',
];

export function auditBedrockStructure(
  files: Record<string, ProjectFile>,
  manifest: BedrockManifest,
  targetProfileId: string = '1.26.52.3'
): VersionAuditResult {
  const profile =
    BEDROCK_VERSION_PROFILES.find((p) => p.id === targetProfileId) ||
    BEDROCK_VERSION_PROFILES[0];

  const findings: FolderAuditFinding[] = [];
  const filePaths = Object.keys(files);

  // 1. Manifest Engine Version Check
  const currentEngine = manifest.header.min_engine_version || [1, 20, 0];
  const engineVersionMatches =
    currentEngine[0] === profile.engineVersion[0] &&
    currentEngine[1] === profile.engineVersion[1];

  if (!engineVersionMatches) {
    findings.push({
      type: 'warning',
      title: 'Target Engine Version Mismatch',
      description: `Manifest specifies min_engine_version [${currentEngine.join(
        ', '
      )}], but selected target is [${profile.engineVersion.join(
        ', '
      )}]. Minecraft will apply rules for the manifest's configured version.`,
      path: 'manifest.json',
    });
  } else {
    findings.push({
      type: 'success',
      title: `Bedrock v${profile.engineVersion.join('.')} Manifest Registered`,
      description: `Target engine version matches ${profile.name}.`,
      path: 'manifest.json',
    });
  }

  // 2. Check for accidental Java Edition structure
  const javaEditionDetected = filePaths.some(
    (p) =>
      p.startsWith('assets/minecraft/') ||
      p.startsWith('assets/') ||
      p.includes('pack.mcmeta')
  );

  if (javaEditionDetected) {
    findings.push({
      type: 'error',
      title: 'Java Edition Folder Structure Detected',
      description:
        'Found "assets/minecraft/" or "pack.mcmeta". Bedrock Edition does not read Java Edition directories. Move textures into "textures/blocks/" or "textures/items/".',
    });
  }

  // 3. Standard Folders Check
  const standardFoldersPresent: string[] = [];
  const missingStandardFolders: string[] = [];

  for (const folder of REQUIRED_STANDARD_FOLDERS) {
    const hasFiles = filePaths.some((p) => p.startsWith(`${folder}/`));
    if (hasFiles) {
      standardFoldersPresent.push(folder);
    } else {
      missingStandardFolders.push(folder);
    }
  }

  if (missingStandardFolders.length > 0) {
    findings.push({
      type: 'info',
      title: 'Unused Standard Subdirectories',
      description: `The pack currently has no custom assets in: ${missingStandardFolders.join(
        ', '
      )}. Standard Bedrock packs typically populate blocks and items.`,
    });
  }

  // 4. Check for Pack Icon
  const hasPackIcon = filePaths.some((p) => p.toLowerCase() === 'pack_icon.png');
  if (hasPackIcon) {
    findings.push({
      type: 'success',
      title: 'Valid Root pack_icon.png',
      description: 'Found pack_icon.png at archive root.',
      path: 'pack_icon.png',
    });
  } else {
    findings.push({
      type: 'warning',
      title: 'Missing pack_icon.png',
      description: 'Minecraft Bedrock will display a generic missing texture icon without a root pack_icon.png.',
      path: 'pack_icon.png',
    });
  }

  // 5. Check what 1.21 features are textured
  let customizedNewSlotsCount = 0;
  for (const addition of profile.majorAdditions) {
    const isPresent = filePaths.includes(addition.path);
    if (isPresent) {
      customizedNewSlotsCount++;
    }
  }

  if (customizedNewSlotsCount > 0) {
    findings.push({
      type: 'success',
      title: `Customized ${customizedNewSlotsCount} New ${profile.name} Assets`,
      description: `Pack includes custom textures for newly added blocks/items in this MCPE release.`,
    });
  } else {
    findings.push({
      type: 'info',
      title: `No ${profile.name} New Feature Textures Yet`,
      description: `Minecraft 1.21 introduced Crafters, Heavy Cores, Maces, and the Breeze. You can add custom PNGs for them in the Texture Browser.`,
    });
  }

  return {
    targetProfile: profile,
    engineVersionMatches,
    standardFoldersPresent,
    missingStandardFolders,
    javaEditionDetected,
    findings,
    recommendedAdditionsCount: profile.majorAdditions.length,
  };
}
