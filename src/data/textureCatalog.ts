import { TextureSlot } from '../types';

export const TEXTURE_CATALOG: TextureSlot[] = [
  // --- BLOCKS (textures/blocks/) ---
  {
    id: 'block_stone',
    name: 'Stone',
    category: 'blocks',
    path: 'textures/blocks/stone.png',
    description: 'Standard natural stone block texture.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#787878'
  },
  {
    id: 'block_dirt',
    name: 'Dirt',
    category: 'blocks',
    path: 'textures/blocks/dirt.png',
    description: 'Natural dirt surface texture.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#866043'
  },
  {
    id: 'block_grass_top',
    name: 'Grass Block (Top)',
    category: 'blocks',
    path: 'textures/blocks/grass_top.png',
    description: 'Top face of the grass block (greyscale colormapped or pre-colored).',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#5B8C32'
  },
  {
    id: 'block_grass_side',
    name: 'Grass Block (Side)',
    category: 'blocks',
    path: 'textures/blocks/grass_side_carried.png',
    description: 'Side face of the grass block with soil base.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#6B763C'
  },
  {
    id: 'block_cobblestone',
    name: 'Cobblestone',
    category: 'blocks',
    path: 'textures/blocks/cobblestone.png',
    description: 'Rough fractured stone block.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#636363'
  },
  {
    id: 'block_bedrock',
    name: 'Bedrock',
    category: 'blocks',
    path: 'textures/blocks/bedrock.png',
    description: 'Indestructible bottom layer bedrock.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#2B2B2B'
  },
  {
    id: 'block_obsidian',
    name: 'Obsidian',
    category: 'blocks',
    path: 'textures/blocks/obsidian.png',
    description: 'Dark volcanic glass block used for Nether portals.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#1A1126'
  },
  {
    id: 'block_crying_obsidian',
    name: 'Crying Obsidian',
    category: 'blocks',
    path: 'textures/blocks/crying_obsidian.png',
    description: 'Glowing purple crying obsidian block used for respawn anchors.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#3B185F'
  },
  {
    id: 'block_diamond_ore',
    name: 'Diamond Ore',
    category: 'blocks',
    path: 'textures/blocks/diamond_ore.png',
    description: 'Stone with embedded cyan diamond crystal flecks.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#55C9C9'
  },
  {
    id: 'block_deepslate_diamond_ore',
    name: 'Deepslate Diamond Ore',
    category: 'blocks',
    path: 'textures/blocks/deepslate_diamond_ore.png',
    description: 'Deepslate stone with embedded cyan diamond crystals.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#36989D'
  },
  {
    id: 'block_iron_ore',
    name: 'Iron Ore',
    category: 'blocks',
    path: 'textures/blocks/iron_ore.png',
    description: 'Standard stone with tan iron ore deposits.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#C4977E'
  },
  {
    id: 'block_gold_ore',
    name: 'Gold Ore',
    category: 'blocks',
    path: 'textures/blocks/gold_ore.png',
    description: 'Stone with golden mineral deposits.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#F5D442'
  },
  {
    id: 'block_ancient_debris_side',
    name: 'Ancient Debris (Side)',
    category: 'blocks',
    path: 'textures/blocks/ancient_debris_side.png',
    description: 'Nether ancient debris side texture.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#584236'
  },
  {
    id: 'block_netherite_block',
    name: 'Block of Netherite',
    category: 'blocks',
    path: 'textures/blocks/netherite_block.png',
    description: 'Dark forged metallic netherite alloy block.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#423D3F'
  },
  {
    id: 'block_glass',
    name: 'Glass',
    category: 'blocks',
    path: 'textures/blocks/glass.png',
    description: 'Transparent framed glass block with streak reflections.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#A0D2EB'
  },
  {
    id: 'block_oak_planks',
    name: 'Oak Planks',
    category: 'blocks',
    path: 'textures/blocks/planks_oak.png',
    description: 'Classic oak wooden floorboard planks.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#A17E4F'
  },
  {
    id: 'block_spruce_planks',
    name: 'Spruce Planks',
    category: 'blocks',
    path: 'textures/blocks/planks_spruce.png',
    description: 'Dark brown pine wood planks.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#6B4E2B'
  },
  {
    id: 'block_cherry_planks',
    name: 'Cherry Planks',
    category: 'blocks',
    path: 'textures/blocks/planks_cherry.png',
    description: 'Pale pink cherry blossom wooden planks.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#E29C9C'
  },
  {
    id: 'block_crafting_table_top',
    name: 'Crafting Table (Top)',
    category: 'blocks',
    path: 'textures/blocks/crafting_table_top.png',
    description: 'Worksurface with 3x3 crafting grid guidelines.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#AC824B'
  },
  {
    id: 'block_crafting_table_side',
    name: 'Crafting Table (Side)',
    category: 'blocks',
    path: 'textures/blocks/crafting_table_front.png',
    description: 'Carved side panel with tools hanging.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#8C673B'
  },
  {
    id: 'block_furnace_front_off',
    name: 'Furnace (Front Idle)',
    category: 'blocks',
    path: 'textures/blocks/furnace_front_off.png',
    description: 'Cobblestone furnace mouth when not cooking.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#4A4A4A'
  },
  {
    id: 'block_furnace_front_on',
    name: 'Furnace (Front Lit)',
    category: 'blocks',
    path: 'textures/blocks/furnace_front_on.png',
    description: 'Glowing flame furnace mouth while active.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#D97706'
  },
  {
    id: 'block_tnt_side',
    name: 'TNT (Side)',
    category: 'blocks',
    path: 'textures/blocks/tnt_side.png',
    description: 'Dynamite sticks bundle with TNT label band.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#DC2626'
  },
  {
    id: 'block_bookshelf',
    name: 'Bookshelf',
    category: 'blocks',
    path: 'textures/blocks/bookshelf.png',
    description: 'Wooden shelf stocked with colorful book spines.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#845C38'
  },
  {
    id: 'block_sand',
    name: 'Sand',
    category: 'blocks',
    path: 'textures/blocks/sand.png',
    description: 'Fine desert and shoreline sand grains.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#D9C89E'
  },
  {
    id: 'block_glowstone',
    name: 'Glowstone',
    category: 'blocks',
    path: 'textures/blocks/glowstone.png',
    description: 'Luminous crystalline Nether cluster block.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#F59E0B'
  },
  {
    id: 'block_sea_lantern',
    name: 'Sea Lantern',
    category: 'blocks',
    path: 'textures/blocks/sea_lantern.png',
    description: 'Cyan-white ocean monument luminescent block.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#70B9B0'
  },

  // --- ITEMS (textures/items/) ---
  {
    id: 'item_diamond',
    name: 'Diamond',
    category: 'items',
    path: 'textures/items/diamond.png',
    description: 'Precious cut gemstone diamond.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#4DEEEA'
  },
  {
    id: 'item_emerald',
    name: 'Emerald',
    category: 'items',
    path: 'textures/items/emerald.png',
    description: 'Bright green currency gemstone emerald.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#17DD62'
  },
  {
    id: 'item_netherite_ingot',
    name: 'Netherite Ingot',
    category: 'items',
    path: 'textures/items/netherite_ingot.png',
    description: 'Heavy dark netherite alloy ingot bar.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#473E41'
  },
  {
    id: 'item_iron_ingot',
    name: 'Iron Ingot',
    category: 'items',
    path: 'textures/items/iron_ingot.png',
    description: 'Standard smelted iron metal bar.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#D8D8D8'
  },
  {
    id: 'item_gold_ingot',
    name: 'Gold Ingot',
    category: 'items',
    path: 'textures/items/gold_ingot.png',
    description: 'Refined golden metal bullion ingot.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#FACC15'
  },
  {
    id: 'item_diamond_sword',
    name: 'Diamond Sword',
    category: 'items',
    path: 'textures/items/diamond_sword.png',
    description: 'Iconic cyan bladed diamond combat weapon.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#2BE1DC'
  },
  {
    id: 'item_netherite_sword',
    name: 'Netherite Sword',
    category: 'items',
    path: 'textures/items/netherite_sword.png',
    description: 'Reinforced dark netherite sword.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#363032'
  },
  {
    id: 'item_iron_sword',
    name: 'Iron Sword',
    category: 'items',
    path: 'textures/items/iron_sword.png',
    description: 'Standard forged iron sword blade.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#C4C4C4'
  },
  {
    id: 'item_diamond_pickaxe',
    name: 'Diamond Pickaxe',
    category: 'items',
    path: 'textures/items/diamond_pickaxe.png',
    description: 'Diamond mining tool head on wooden haft.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#2BE1DC'
  },
  {
    id: 'item_netherite_pickaxe',
    name: 'Netherite Pickaxe',
    category: 'items',
    path: 'textures/items/netherite_pickaxe.png',
    description: 'Heavy-duty netherite mining pickaxe.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#363032'
  },
  {
    id: 'item_diamond_axe',
    name: 'Diamond Axe',
    category: 'items',
    path: 'textures/items/diamond_axe.png',
    description: 'Heavy wood-chopping diamond blade.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#2BE1DC'
  },
  {
    id: 'item_diamond_helmet',
    name: 'Diamond Helmet',
    category: 'items',
    path: 'textures/items/diamond_helmet.png',
    description: 'Inventory sprite for diamond head protection.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#2BE1DC'
  },
  {
    id: 'item_diamond_chestplate',
    name: 'Diamond Chestplate',
    category: 'items',
    path: 'textures/items/diamond_chestplate.png',
    description: 'Inventory sprite for diamond body armor.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#2BE1DC'
  },
  {
    id: 'item_diamond_leggings',
    name: 'Diamond Leggings',
    category: 'items',
    path: 'textures/items/diamond_leggings.png',
    description: 'Inventory sprite for diamond greaves/pants.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#2BE1DC'
  },
  {
    id: 'item_diamond_boots',
    name: 'Diamond Boots',
    category: 'items',
    path: 'textures/items/diamond_boots.png',
    description: 'Inventory sprite for diamond armored footwear.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#2BE1DC'
  },
  {
    id: 'item_golden_apple',
    name: 'Golden Apple',
    category: 'items',
    path: 'textures/items/apple_golden.png',
    description: 'Gleaming enchanted or regular golden snack apple.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#F59E0B'
  },
  {
    id: 'item_ender_pearl',
    name: 'Ender Pearl',
    category: 'items',
    path: 'textures/items/ender_pearl.png',
    description: 'Dark teal teleportation orb from Endermen.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#0E5C57'
  },
  {
    id: 'item_totem',
    name: 'Totem of Undying',
    category: 'items',
    path: 'textures/items/totem.png',
    description: 'Golden winged statuette granting resurrection.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#F59E0B'
  },
  {
    id: 'item_bow_standby',
    name: 'Bow (Idle)',
    category: 'items',
    path: 'textures/items/bow_standby.png',
    description: 'Strung wooden recurve archery bow.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#8C673B'
  },
  {
    id: 'item_flint_and_steel',
    name: 'Flint and Steel',
    category: 'items',
    path: 'textures/items/flint_and_steel.png',
    description: 'Striker used to ignite fires and activate Nether portals.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#9CA3AF'
  },

  // --- ENTITY (textures/entity/) ---
  {
    id: 'entity_creeper',
    name: 'Creeper',
    category: 'entity',
    path: 'textures/entity/creeper/creeper.png',
    description: 'Classic green camouflaged explosive mob skin map.',
    recommendedWidth: 64,
    recommendedHeight: 32,
    sampleColor: '#16A34A'
  },
  {
    id: 'entity_zombie',
    name: 'Zombie',
    category: 'entity',
    path: 'textures/entity/zombie/zombie.png',
    description: 'Rotting undead monster skin texture layout.',
    recommendedWidth: 64,
    recommendedHeight: 64,
    sampleColor: '#15803D'
  },
  {
    id: 'entity_skeleton',
    name: 'Skeleton',
    category: 'entity',
    path: 'textures/entity/skeleton/skeleton.png',
    description: 'Archery skeleton bone structure UV texture.',
    recommendedWidth: 64,
    recommendedHeight: 32,
    sampleColor: '#BCBCBC'
  },
  {
    id: 'entity_enderman',
    name: 'Enderman',
    category: 'entity',
    path: 'textures/entity/enderman/enderman.png',
    description: 'Tall void stalker with purple eyes.',
    recommendedWidth: 64,
    recommendedHeight: 32,
    sampleColor: '#111827'
  },
  {
    id: 'entity_pig',
    name: 'Pig',
    category: 'entity',
    path: 'textures/entity/pig/pig.png',
    description: 'Pink farm animal skin layout.',
    recommendedWidth: 64,
    recommendedHeight: 32,
    sampleColor: '#F472B6'
  },
  {
    id: 'entity_cow',
    name: 'Cow',
    category: 'entity',
    path: 'textures/entity/cow/cow.png',
    description: 'Brown and white spotted bovine skin layout.',
    recommendedWidth: 64,
    recommendedHeight: 32,
    sampleColor: '#4A3728'
  },
  {
    id: 'entity_steve',
    name: 'Player (Steve)',
    category: 'entity',
    path: 'textures/entity/steve.png',
    description: 'Standard 4-pixel arm humanoid player model texture.',
    recommendedWidth: 64,
    recommendedHeight: 64,
    sampleColor: '#3B82F6'
  },
  {
    id: 'entity_alex',
    name: 'Player (Alex)',
    category: 'entity',
    path: 'textures/entity/alex.png',
    description: 'Slim 3-pixel arm humanoid player model texture.',
    recommendedWidth: 64,
    recommendedHeight: 64,
    sampleColor: '#10B981'
  },

  // --- UI (textures/ui/) ---
  {
    id: 'ui_crosshair',
    name: 'Crosshair Reticle',
    category: 'ui',
    path: 'textures/ui/cross_hair.png',
    description: 'Target crosshair reticle centered on player HUD.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#FFFFFF'
  },
  {
    id: 'ui_heart_new',
    name: 'Hearts HUD',
    category: 'ui',
    path: 'textures/ui/heart_new.png',
    description: 'Player health container spritesheet.',
    recommendedWidth: 9,
    recommendedHeight: 9,
    sampleColor: '#EF4444'
  },
  {
    id: 'ui_selected_hotbar_slot',
    name: 'Selected Hotbar Slot',
    category: 'ui',
    path: 'textures/ui/selected_hotbar_slot.png',
    description: 'Highlight bracket framing active hotbar item.',
    recommendedWidth: 24,
    recommendedHeight: 24,
    sampleColor: '#FFFFFF'
  },
  {
    id: 'ui_title',
    name: 'Minecraft Title Logo',
    category: 'ui',
    path: 'textures/ui/title.png',
    description: 'Main menu 3D blocky stone Minecraft title logo.',
    recommendedWidth: 256,
    recommendedHeight: 64,
    sampleColor: '#9CA3AF'
  },

  // --- ENVIRONMENT (textures/environment/) ---
  {
    id: 'env_sun',
    name: 'Sun',
    category: 'environment',
    path: 'textures/environment/sun.png',
    description: 'Bright square celestial day solar body.',
    recommendedWidth: 32,
    recommendedHeight: 32,
    sampleColor: '#FEF08A'
  },
  {
    id: 'env_moon_phases',
    name: 'Moon Phases',
    category: 'environment',
    path: 'textures/environment/moon_phases.png',
    description: 'Lunar phase cycle night sky spritesheet.',
    recommendedWidth: 128,
    recommendedHeight: 64,
    sampleColor: '#E2E8F0'
  },
  {
    id: 'env_clouds',
    name: 'Clouds',
    category: 'environment',
    path: 'textures/environment/clouds.png',
    description: 'Atmospheric sky cloud grid texture.',
    recommendedWidth: 256,
    recommendedHeight: 256,
    sampleColor: '#F8FAFC'
  },

  // --- 1.21 TRICKY TRIALS (MCPE 1.21+) ---
  {
    id: 'block_crafter_top',
    name: 'Crafter (Top)',
    category: 'blocks',
    path: 'textures/blocks/crafter_top.png',
    description: 'Automated redstone crafter face with slot indicator.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#8E5F46'
  },
  {
    id: 'block_heavy_core',
    name: 'Heavy Core',
    category: 'blocks',
    path: 'textures/blocks/heavy_core.png',
    description: 'Dense metallic Trial Chamber relic block.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#4A5568'
  },
  {
    id: 'block_trial_spawner',
    name: 'Trial Spawner (Side)',
    category: 'blocks',
    path: 'textures/blocks/trial_spawner_side.png',
    description: 'Challenging Trial Chamber spawner cage.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#78716C'
  },
  {
    id: 'block_vault',
    name: 'Vault (Top)',
    category: 'blocks',
    path: 'textures/blocks/vault_top.png',
    description: 'Reward vault opened with trial keys.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#57534E'
  },
  {
    id: 'block_copper_bulb',
    name: 'Copper Bulb (Lit)',
    category: 'blocks',
    path: 'textures/blocks/copper_bulb_lit.png',
    description: 'Redstone toggleable illuminating copper bulb.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#EA580C'
  },
  {
    id: 'item_mace',
    name: 'Mace',
    category: 'items',
    path: 'textures/items/mace.png',
    description: 'Heavy smash combat weapon forged from heavy core and breeze rod.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#CBD5E1'
  },
  {
    id: 'item_wind_charge',
    name: 'Wind Charge',
    category: 'items',
    path: 'textures/items/wind_charge.png',
    description: 'Swirling gale burst projectile item.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#BAE6FD'
  },
  {
    id: 'item_wolf_armor',
    name: 'Wolf Armor',
    category: 'items',
    path: 'textures/items/wolf_armor.png',
    description: 'Pet defense armor crafted from armadillo scutes.',
    recommendedWidth: 16,
    recommendedHeight: 16,
    sampleColor: '#A16207'
  },
  {
    id: 'entity_breeze',
    name: 'Breeze',
    category: 'entity',
    path: 'textures/entity/breeze/breeze.png',
    description: 'Trial Chamber whirlwind mob texture map.',
    recommendedWidth: 64,
    recommendedHeight: 64,
    sampleColor: '#7DD3FC'
  },
  {
    id: 'entity_armadillo',
    name: 'Armadillo',
    category: 'entity',
    path: 'textures/entity/armadillo/armadillo.png',
    description: 'Savanna rolling critter texture layout.',
    recommendedWidth: 64,
    recommendedHeight: 64,
    sampleColor: '#92400E'
  }
];

export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Textures',
  blocks: 'Blocks',
  items: 'Items',
  entity: 'Entities',
  ui: 'Interface',
  environment: 'Environment'
};
