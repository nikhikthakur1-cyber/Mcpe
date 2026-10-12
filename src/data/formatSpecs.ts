/**
 * Specifications and requirements for Minecraft Bedrock & MCPE resource pack formats.
 * Grounded in Bedrock Edition v1.26.52.3 specifications.
 */

export interface FormatSpec {
  id: string;
  name: string;
  extension: string;
  category: 'textures' | 'models' | 'audio' | 'atlases' | 'metadata';
  description: string;
  colorDepth: string;
  recommendedDimensions: string;
  pathPattern: string;
  requiredFields?: string[];
  bedrockNote: string;
  exampleSnippet?: string;
}

export const BEDROCK_FORMAT_SPECS: FormatSpec[] = [
  {
    id: 'texture_png',
    name: 'Standard Texture (PNG)',
    extension: '.png',
    category: 'textures',
    description: '32-bit Portable Network Graphics with RGBA channels. Used for blocks, items, UI sprites, and particle effects.',
    colorDepth: '32-bit RGBA (8 bits per channel + 8-bit alpha channel)',
    recommendedDimensions: '16×16, 32×32, 64×64, 128×128 (Power-of-two square resolutions)',
    pathPattern: 'textures/blocks/<name>.png or textures/items/<name>.png',
    bedrockNote: 'Bedrock requires power-of-two dimensions (e.g. 16, 32, 64). Strip extra color profile metadata chunks (iCCP, sRGB) for optimal mobile render performance in MCPE.',
    exampleSnippet: `// Registered via terrain_texture.json:
"texture_data": {
  "custom_ruby_ore": {
    "textures": "textures/blocks/ruby_ore"
  }
}`
  },
  {
    id: 'texture_tga',
    name: 'Uncompressed Texture (TGA)',
    extension: '.tga',
    category: 'textures',
    description: 'Truevision TGA format with dedicated uncompressed alpha mask. Ideal for complex entity skins and transparent armor trims.',
    colorDepth: '24-bit RGB or 32-bit RGBA with uncompressed true-color alpha',
    recommendedDimensions: '64×32, 64×64, 128×128',
    pathPattern: 'textures/entity/<mob_name>/<skin>.tga',
    bedrockNote: 'Supported natively by Bedrock entity renderers. TGA prevents edge alpha bleeding artifacts on 3D geometry.',
  },
  {
    id: 'atlas_terrain',
    name: 'Terrain Texture Atlas (terrain_texture.json)',
    extension: '.json',
    category: 'atlases',
    description: 'Defines texture mappings for block models and terrain blocks in Minecraft Bedrock.',
    colorDepth: 'JSON UTF-8',
    recommendedDimensions: 'N/A',
    pathPattern: 'textures/terrain_texture.json',
    requiredFields: ['resource_pack_name', 'texture_name', 'texture_data'],
    bedrockNote: 'Path values omit the .png extension (e.g. "textures/blocks/my_block"). Array of paths can be provided for multi-face random variants.',
    exampleSnippet: `{
  "resource_pack_name": "vanilla",
  "texture_name": "atlas.terrain",
  "padding": 8,
  "num_mip_levels": 4,
  "texture_data": {
    "my_custom_block": {
      "textures": "textures/blocks/my_custom_block"
    }
  }
}`
  },
  {
    id: 'atlas_item',
    name: 'Item Texture Atlas (item_texture.json)',
    extension: '.json',
    category: 'atlases',
    description: 'Defines 2D sprite mappings for inventory items, tools, weapons, and food in Bedrock.',
    colorDepth: 'JSON UTF-8',
    recommendedDimensions: 'N/A',
    pathPattern: 'textures/item_texture.json',
    requiredFields: ['resource_pack_name', 'texture_name', 'texture_data'],
    bedrockNote: 'Item references in behavior definitions point to the key name defined in texture_data.',
    exampleSnippet: `{
  "resource_pack_name": "vanilla",
  "texture_name": "atlas.items",
  "texture_data": {
    "my_custom_sword": {
      "textures": "textures/items/my_custom_sword"
    }
  }
}`
  },
  {
    id: 'flipbook_textures',
    name: 'Animated Textures (flipbook_textures.json)',
    extension: '.json',
    category: 'atlases',
    description: 'Enables vertical frame-strip animated textures for blocks and items (e.g., flowing water, fire, glowing ores, animated weapons).',
    colorDepth: 'JSON UTF-8 array',
    recommendedDimensions: 'Image height = width × number of animation frames (e.g. 16×64 for 4 frames)',
    pathPattern: 'textures/flipbook_textures.json',
    requiredFields: ['flipbook_texture', 'atlas_tile', 'ticks_per_frame'],
    bedrockNote: 'The PNG file must be a vertical strip where each frame is stacked beneath the previous one.',
    exampleSnippet: `[
  {
    "flipbook_texture": "textures/blocks/glowing_gem",
    "atlas_tile": "glowing_gem",
    "ticks_per_frame": 4,
    "blend_frames": true
  }
]`
  },
  {
    id: 'pack_manifest',
    name: 'Pack Manifest (manifest.json)',
    extension: '.json',
    category: 'metadata',
    description: 'Root metadata defining resource pack identity, minimum engine version, and cryptographic UUIDs.',
    colorDepth: 'JSON UTF-8',
    recommendedDimensions: 'N/A',
    pathPattern: 'manifest.json',
    requiredFields: ['format_version', 'header', 'modules'],
    bedrockNote: 'Current Bedrock v1.26.52.3 requires format_version: 2 with min_engine_version: [1, 26, 52].',
    exampleSnippet: `{
  "format_version": 2,
  "header": {
    "name": "Custom Pack",
    "description": "Created with Bedrock Studio",
    "uuid": "UUID-HERE",
    "version": [1, 0, 0],
    "min_engine_version": [1, 26, 52]
  },
  "modules": [
    {
      "type": "resources",
      "uuid": "UUID-HERE",
      "version": [1, 0, 0]
    }
  ]
}`
  },
  {
    id: 'sounds_definitions',
    name: 'Sound Definitions (sound_definitions.json)',
    extension: '.json',
    category: 'audio',
    description: 'Registers custom audio sound events and links them to .ogg audio files in sounds/',
    colorDepth: 'JSON UTF-8',
    recommendedDimensions: 'N/A',
    pathPattern: 'sounds/sound_definitions.json',
    requiredFields: ['format_version', 'sound_definitions'],
    bedrockNote: 'Sound files should be Ogg Vorbis (.ogg) encoded at 44.1kHz stereo or mono.',
    exampleSnippet: `{
  "format_version": "1.14.0",
  "sound_definitions": {
    "block.gem.chime": {
      "category": "block",
      "sounds": [
        "sounds/blocks/gem/chime1",
        "sounds/blocks/gem/chime2"
      ]
    }
  }
}`
  }
];

export interface CustomAssetTemplate {
  id: string;
  title: string;
  category: 'block' | 'item' | 'flipbook' | 'entity';
  description: string;
  defaultTexturePath: string;
  targetJsonPath: string;
  suggestedDimensions: { width: number; height: number };
  sampleJsonSnippet: (name: string, pathWithoutExt: string) => string;
}

export const ASSET_TEMPLATES: CustomAssetTemplate[] = [
  {
    id: 'custom_block',
    title: 'Custom Block Texture & Terrain Atlas',
    category: 'block',
    description: 'Create a custom block texture and register it in textures/terrain_texture.json for Bedrock.',
    defaultTexturePath: 'textures/blocks/custom_block.png',
    targetJsonPath: 'textures/terrain_texture.json',
    suggestedDimensions: { width: 16, height: 16 },
    sampleJsonSnippet: (name, path) => `{
  "resource_pack_name": "vanilla",
  "texture_name": "atlas.terrain",
  "padding": 8,
  "num_mip_levels": 4,
  "texture_data": {
    "${name}": {
      "textures": "${path}"
    }
  }
}`
  },
  {
    id: 'custom_item',
    title: 'Custom Item / Weapon / Tool Texture',
    category: 'item',
    description: 'Create a custom 2D item icon and register it in textures/item_texture.json.',
    defaultTexturePath: 'textures/items/custom_item.png',
    targetJsonPath: 'textures/item_texture.json',
    suggestedDimensions: { width: 16, height: 16 },
    sampleJsonSnippet: (name, path) => `{
  "resource_pack_name": "vanilla",
  "texture_name": "atlas.items",
  "texture_data": {
    "${name}": {
      "textures": "${path}"
    }
  }
}`
  },
  {
    id: 'custom_flipbook',
    title: 'Animated Flipbook Texture (Moving Texture)',
    category: 'flipbook',
    description: 'Create a vertical sprite strip animation and register it in textures/flipbook_textures.json.',
    defaultTexturePath: 'textures/blocks/custom_animated.png',
    targetJsonPath: 'textures/flipbook_textures.json',
    suggestedDimensions: { width: 16, height: 64 },
    sampleJsonSnippet: (name, path) => `[
  {
    "flipbook_texture": "${path}",
    "atlas_tile": "${name}",
    "ticks_per_frame": 4,
    "blend_frames": true
  }
]`
  },
  {
    id: 'custom_entity',
    title: 'Custom Entity / Mob Texture Map',
    category: 'entity',
    description: 'Add a custom mob or critter texture for Bedrock entity models.',
    defaultTexturePath: 'textures/entity/custom_mob/custom_mob.png',
    targetJsonPath: 'textures/terrain_texture.json',
    suggestedDimensions: { width: 64, height: 64 },
    sampleJsonSnippet: (_name, path) => `// Bedrock links mob textures directly through entity client definition (.json)
// pointing to: "${path}"`
  }
];
