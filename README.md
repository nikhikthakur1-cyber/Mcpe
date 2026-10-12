# ⛏ Bedrock Texture Studio & Resource Pack Engine

A full-featured, professional web application designed to create, inspect, edit, preview, and package **Minecraft: Bedrock Edition** (`.mcpack` & `.zip`) resource packs. Built with React 19, TypeScript, Tailwind CSS, Three.js 3D Voxel Viewports, and Web Canvas Pixel Editors.

---

## 🌟 Key Features

### 🎨 1. Texture Catalog & Browser (4,880+ Vanilla Slots)
- **Comprehensive Bedrock Catalog**: Includes default textures for blocks, items, armor, equipment, mobs, particles, environment, and Bedrock UI screens (`textures/ui/texturesPackedUi/*`).
- **Strict Minecraft Creative Inventory Ordering**: Organized by equipment sets (Leather ➔ Chainmail ➔ Iron ➔ Gold ➔ Diamond ➔ Netherite ➔ Trims), tools, weapons, crops, and multi-face blocks.
- **Directional Multi-Face Badges**: Explicit indicators for `⬆️ Top Face`, `⬇️ Bottom`, `▶️ Front Face`, `↔️ Side Face`, `🛡️ Armor Layer 1`, and `🛡️ Armor Layer 2`.
- **Infinite Dynamic Scroll Container**: Scroll smoothly through thousands of textures with automatic dynamic loading.

### 🧊 2. Interactive 3D Voxel Viewport
- **3D Voxel Block Mesh**: Renders blocks as 3D voxel cubes with nearest-neighbor crisp pixel filtering.
- **3D Pixel-Extruded Voxel Items**: Converts 2D item PNG sprites (swords, armor, apples, tools) into volumetric 3D pixel-extruded meshes matching Minecraft in-hand item thickness.
- **360° Drag & Zoom Controls**: Mouse drag to rotate across 3D axes, scroll wheel zoom, auto-spin toggle, wireframe toggle, and instant 2D/3D mode toggling.

### 📁 3. Resource Pack File Explorer & Sample Asset Library
- **Bedrock UI Screens & Samples**: Over 200 canonical UI screen definitions (`hud_screen.json`, `chest_screen.json`, `_global_variables.json`), particle definitions (`particles/`), and biome fogs (`fogs/`).
- **File Explorer**: Tree view of your resource pack directory with custom file uploads, image previews, and text/JSON editing.

### 📄 4. Universal Manifest.json Editor
- **Bedrock Manifest v2**: Real-time editor for header name, description, UUIDs, format version, and engine minimum version (`min_engine_version`).
- **One-Click UUID Generator**: Instantly generates cryptographically secure RFC 4122 UUIDs for `header` and `modules`.

### 🔗 5. Visual Connection Tree & Json Linker
- **Dependency Graph**: Maps relationships between `manifest.json`, `terrain_texture.json`, `item_texture.json`, and texture images.
- **Unreferenced Texture Detection**: Audits textures not listed in definition JSONs.

### 🛡️ 6. MCPE Version & Folder Auditor
- **Format Audit**: Verifies `.mcpack` directory structure, `pack_icon.png` (256x256), `manifest.json` schema, and target MCPE version compatibility.

### 📦 7. One-Click .mcpack Export & Import
- **Lightweight Export**: Bundles only customized/added files into standard `.mcpack` files ready to install on Android, iOS, Windows, or Xbox.
- **Import Support**: Drag and drop `.mcpack` or `.zip` files to load existing packs.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4
- **3D Viewport**: Three.js (Nearest-neighbor pixel art filtering, custom voxel geometry)
- **Icons**: Lucide React
- **Packaging**: JSZip, FileSaver

---

## 🚀 Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open preview in browser
# Local dev server runs on http://localhost:3000
```

---

## 📱 Building as an Android App (.apk / .aab)

This project supports building into a native Android App (`.apk` and `.aab`) via Capacitor and GitHub Actions.

---

## 🤖 GitHub Action Workflow (.github/workflows/build-android.yml)

The completed GitHub Action workflow below automatically builds debug and release Android APKs and AABs whenever code is pushed to `main` or `master`.
