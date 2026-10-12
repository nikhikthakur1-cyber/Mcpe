# Bedrock Texture Asset Indexing & Fast PNG Voxel Viewer Plan

Enhance the Minecraft Bedrock texture loader to pre-index and warm-cache all Bedrock PNG assets into memory during splash screen loading, eliminate missing asset gaps by mapping names through official `item_texture.json` and `terrain_texture.json` manifests, and polish 3D block and item voxel rendering with responsive controls and zero text overlap on mobile screens.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed by the user during Phase 1 interactive alignment:

- **Confirmed Loading Strategy**: Pre-index and warm-cache all official Minecraft Bedrock textures directly into memory during the startup splash screen load to guarantee instantaneous PNG texture rendering across all catalog lists and 3D voxel previews.
- **Confirmed Manifest Verification**: Resolve missing texture references by indexing official `item_texture.json` and `terrain_texture.json` manifests from the Bedrock resource pack so item identifiers always locate their true source PNG files without fallback artifacts or unexpected shapes.
- **Confirmed Mobile & Viewport Optimization**: Enable zero-overlap text layouts with a Compact List toggle and touch-optimized 3D voxel controls (including rotation, play/pause spin, and wireframe toggle).

---

## 1. Overview & Core Concept

### What It Does
Provides Minecraft Bedrock creators and modders with an instant, zero-lag texture browser and interactive 3D voxel viewer. All vanilla default PNG textures and custom user overrides load into memory during startup, mapped accurately via Bedrock JSON texture definitions.

### Target Audience
Minecraft Bedrock addon developers, texture pack creators, and visual asset modders building custom `.mcpack` resource packages.

### Key Value
- **Instant Texture Display**: Eliminates list loading delay by warming Object URLs in an in-memory LRU cache backed by IndexedDB.
- **Complete Asset Coverage**: Maps texture keys through `item_texture.json` and `terrain_texture.json` manifest definitions to locate all vanilla items and block textures.
- **3D Pixel Extruded Voxel Previews**: Renders 16×16 and 32×32 item sprites as authentic extruded 3D voxel models and 6-sided block cubes with touch and mouse rotation controls.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Splash Screen Startup**: A Minecraft-styled progress bar pre-indexes the Bedrock resource pack ZIP and extracts PNG textures into memory blobs.
2. **Browsing Catalog**: The user filters 4,880+ textures by category (`blocks`, `items`, `entity`, `ui`, `environment`) or searches by name. Standard vs. Compact List mode allows high-density mobile browsing.
3. **3D Voxel Inspection**: Clicking any card opens the 3D WebGL viewer. Users can toggle between **Block Cube** and **3D Item Voxel**, spin/pause rotation with the **Play/Pause** button, toggle **Wireframe**, or rotate manually via touch gestures.
4. **Custom Texture Override**: Users upload replacement PNGs to replace vanilla default textures and preview them in real time before export.

### Visual Identity & Theme
- **Aesthetic Direction**: Slate and dark obsidian palette inspired by Minecraft Bedrock developer consoles (`#0B0F14` canvas, `#0F1622` cards, `#101722` structural borders).
- **Color Accent**: Emerald accent (`#10B981`) for active custom badges and play controls; Sky blue (`#38BDF8`) for selection rings and 3D wireframes.
- **Typography**: Clean sans typography (`Plus Jakarta Sans`) paired with tabular monospace numerals (`JetBrains Mono`) for pixel dimensions and file sizes.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Startup In-Memory Texture Indexing
- **Chosen Approach**: Process `item_texture.json` and `terrain_texture.json` manifests during startup to map friendly item identifiers directly to relative ZIP paths, then pre-generate Object URLs in an in-memory Map.
- **Why**: Guarantees zero-latency image rendering when scrolling through large texture lists without triggering missing image errors.

### Decision 2: 3D Voxel Extrulsion Mesh Engine
- **Chosen Approach**: Three.js instanced box geometry where every non-transparent pixel in an item PNG becomes a 3D pixel block with handheld tilt angle (`Math.PI * 0.12`).
- **Why**: Matches authentic Minecraft in-hand item holding geometry with instant play/pause auto-spin controls.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Bedrock Texture App                             │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌─────────────────────┐             ┌────────────────────────────┐   │
│   │  vanilla_assets.zip │────────────>│      ZipAssetService       │   │
│   └─────────────────────┘             └─────────────┬──────────────┘   │
│                                                     │                  │
│                                                     ▼                  │
│                                       ┌────────────────────────────┐   │
│                                       │   In-Memory Object Cache   │   │
│                                       │   & IndexedDB Persistence  │   │
│                                       └─────────────┬──────────────┘   │
│                                                     │                  │
│                     ┌───────────────────────────────┴─────────────────┐│
│                     │                                                 ││
│                     ▼                                                 ▼│
│   ┌───────────────────────────────────┐    ┌─────────────────────────┐ │
│   │     TextureBrowser & Cards        │    │    Model3DViewer        │ │
│   │ (Compact Grid & Zero-Text Overlap)│    │ (Block & 3D Item Voxel) │ │
│   └───────────────────────────────────┘    └─────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Stores & State Management
- **ZipAssetService**: Singleton storing the extracted files Map, memory Object URL cache, and background extraction progress state.
- **Manifest Index Store**: Parses `item_texture.json` and `terrain_texture.json` to map texture keys (e.g., `diamond`, `apple`, `mace`) to relative texture file paths inside `textures/`.
- **Texture Browser Component**: Manages category filter, search query, view mode (`all` vs `custom`), card size (`comfortable` vs `compact`), and selected texture slot.
- **Model3DViewer Component**: Manages Three.js WebGL scene, camera, camera zoom, light sources, auto-spin animation frame (`autoRotateRef`), and voxel geometry generator.
