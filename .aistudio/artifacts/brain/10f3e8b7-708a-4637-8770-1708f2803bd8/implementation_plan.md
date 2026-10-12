# Implementation Plan: Bedrock v1.26.52.3 Texture Manager & Tree Enhancements

Deliver seamless, high-performance texture management for Minecraft Bedrock & MCPE v1.26.52.3, featuring vanilla reference inspection with selective packaging, zero-lag connection graph navigation, an interactive custom asset creation wizard, and complete Bedrock format specifications.

## 1. Vanilla Reference Texture Viewer & Selective .mcpack Packaging
- **Vanilla Reference Generation & Display**:
  - Enhance `TextureCard` and `TextureInspector` to display authentic procedural/vanilla reference pixel previews side-by-side or as default previews when a texture has not yet been customized.
  - Add search and category filtering across all vanilla game textures (Blocks, Items, Entities, UI, Environment) with instant name/path search.
  - Clear visual distinction between "Vanilla Reference (Display Only)" and "Custom Texture (Installed)".
- **Guaranteed Selective Packaging**:
  - Verify and reinforce `generateMcPackArchive` in `archiveService.ts` and `ExportModal.tsx` so that **only customized textures and user-added files** are written into the final `.mcpack` zip file. Default/reference catalog items remain virtual and do not inflate pack size or override vanilla assets unnecessarily.

## 2. Zero-Lag JSON ↔ Texture Connection Tree
- **Performance Overhaul in `ConnectionTreeView.tsx`**:
  - Replace heavy full re-renders with memoized node trees and lazy-expanded branches (only rendering children for nodes currently open in view).
  - Offload deep JSON search indexing using lightweight substring pre-indexing so typing in the filter bar never drops frames.
  - Instant toggle transitions and on-demand canvas preview decoding for inspected textures.

## 3. "Create Custom JSON & Texture" Wizard Modal
- **New Asset Wizard Button in Connection Tree**:
  - Add a prominent **"+ New Custom Asset / JSON"** action button to the Connection Tree toolbar.
  - Interactive popup modal guiding the creator through:
    1. **Asset Type Selection**: Custom Block (with `terrain_texture.json` registration), Custom Item (with `item_texture.json` registration), Animated Texture (with `flipbook_textures.json`), or Custom Entity / Particle.
    2. **Bedrock Requirements & Schema**: Displays exact required paths, format version standards for 1.26.52.3, and key properties Minecraft requires to load the asset without errors.
    3. **Scaffold & Replace**: One-click scaffold that creates both the target JSON definition and the placeholder PNG/TGA file in the project, automatically opening the JSON editor or texture inspector for immediate editing.

## 4. Bedrock v1.26.52.3 Format & Code Specifications Guide
- **Comprehensive Format Reference**:
  - Add a dedicated **Bedrock Format Guide** modal or inspector tab detailing:
    - **PNG**: 32-bit RGBA, power-of-two dimensions (16×16 to 512×512), no color profiles/sRGB chunks that trigger Bedrock render glitches.
    - **TGA**: Uncompressed 32-bit with 8-bit alpha channel for entities, banners, and particle flipbooks.
    - **JSON Atlases**: `terrain_texture.json` (format 1.10.0+), `item_texture.json` (format 1.10.0+), and `flipbook_textures.json` array syntax.
    - **manifest.json**: `format_version: 2`, `min_engine_version: [1, 26, 52]`.
    - **sounds.json & sound_definitions.json**: Audio category assignments for custom sound effects.

## Verification & Testing
1. **Compilation & Linting**: Run `compile_applet` and `lint_applet` to ensure zero TypeScript or build errors.
2. **Export Inspection**: Test exporting a pack with only 1 customized texture to verify that the generated `.mcpack` zip contains only the manifest, pack icon, and that single custom texture.
3. **Performance Check**: Open Connection Tree with multiple JSON files and verify instantaneous responsiveness.
4. **Wizard Verification**: Create a new custom block/item through the wizard and verify that the JSON and PNG are correctly registered in the connection tree.
