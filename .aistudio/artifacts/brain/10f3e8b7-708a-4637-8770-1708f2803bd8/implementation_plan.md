# Minecraft Bedrock v1.26.52.3 Version Standardization & PNG Deduplication

A targeted plan to standardize all manifest generation, version checks, engine auditors, project templates, and UI components strictly to the current Play Store release of Minecraft Bedrock Edition (**v1.26.52.3**), while deduplicating catalog texture entries into clean 32-bit PNG formats.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed during Phase 1 alignment:

- **Confirmed Decision 1 (Fixed Target Version)**: Lock the target engine version strictly to **v1.26.52.3** (`min_engine_version: [1, 26, 52]`) across all `manifest.json` generation, new project initialization, version audit checkers, export packaging, and UI badges. Remove older/legacy version options (e.g. 1.20, 1.21.0).
- **Confirmed Decision 2 (PNG Format Deduplication)**: Deduplicate texture catalog slots and path resolution mappings so that duplicate keys or legacy file format variants (e.g. `.tga` duplicates) resolve cleanly to single 32-bit RGBA `.png` entries in the v1.26.52.3 format.

---

## 1. Overview & Core Concept

- **What It Does**: Aligns the entire Bedrock Studio applet with the latest Google Play Store release of Minecraft Bedrock Edition (**v1.26.52.3**). Every generated `manifest.json`, pack auditor check, new project template, and export package will strictly target v1.26.52.3. All texture catalog slots are deduplicated to single canonical PNG entries.
- **Target Persona**: Minecraft Bedrock creators publishing resource packs for the current Bedrock v1.26.52.3 release on Google Play, Android, iOS, Windows, and consoles.
- **Key Value**: Guaranteed 100% manifest validity with no outdated min_engine_version warnings in Minecraft, plus a clean, duplicate-free texture catalog.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. *New Project Initialization*: Creating a new project automatically generates a valid Bedrock v1.26.52.3 manifest (`"min_engine_version": [1, 26, 52]`) with format version `2`.
  2. *Manifest Editor & Version Badges*: The `ManifestEditor` displays a locked, clean version badge: `Target: Bedrock v1.26.52.3 (Current Play Store Release)`.
  3. *Audit & Export*: Running the version auditor (`versionAuditorService`) verifies compliance strictly against v1.26.52.3 rules, flagging deprecated syntax and confirming full pack compatibility.
  4. *Clean Texture Browsing*: Browsing the texture catalog presents zero duplicate slot cards; each item/block slot resolves to its canonical v1.26.52.3 PNG path.
- **Visual Identity & Theme**:
  - *Palette*: Deep obsidian canvas (`#0B0F14`), dark slate card surfaces (`#111822`), emerald status pills (`#10B981`), and sky blue highlights (`#38BDF8`).
  - *Version Badge*: Prominent emerald/sky gradient pill (`bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-mono`) highlighting `"v1.26.52.3 Active"`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Strict v1.26.52.3 Locking vs. Multi-Version Dropdown**
  - *Chosen Approach*: Lock manifest generation and version auditors exclusively to v1.26.52.3 (`[1, 26, 52]`).
  - *Why*: Prevents users from accidentally setting outdated engine versions that trigger pack loading failures or missing feature flags in current Minecraft Bedrock builds.
  - *Trade-off*: Removes manual selection of legacy engine versions (e.g. 1.16, 1.20), which is desirable as all active Play Store installs run v1.26.52+.
- **Decision 2: Deduplication to Canonical PNG Format**
  - *Chosen Approach*: Deduplicate `RAW_TEXTURE_CATALOG` and `vanillaTextureIndex.json` entries to unique `.png` file keys, stripping redundant `.tga` duplicates.
  - *Why*: Prevents duplicate texture cards in the browser grid and ensures 100% compatibility with Bedrock's `terrain_texture.json` and `item_texture.json` atlases.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Minecraft Bedrock v1.26.52.3                         │
│                    (Play Store Current Release)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────────────────┐             ┌──────────────────────┐
│         manifestService           │             │ versionAuditorService│
│  - min_engine_version: [1,26,52]  │             │  - Validates against │
│  - format_version: 2              │             │    v1.26.52.3 rules  │
└──────────────────┬────────────────┘             └──────────┬───────────┘
                   │                                         │
                   ▼                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Bedrock Texture Studio                          │
│  - ManifestEditor (Target: v1.26.52.3)                                 │
│  - ExportModal / NewProjectModal (Locked to [1, 26, 52])              │
│  - Deduplicated PNG Texture Catalog (zipAssetService & textureCatalog) │
└────────────────────────────────────────────────────────────────────────┘
```

- **File Modifications Plan**:
  1. `src/services/manifestService.ts`: Lock default `min_engine_version` to `[1, 26, 52]`.
  2. `src/services/versionAuditorService.ts`: Update compliance auditor rules to target v1.26.52.3.
  3. `src/data/formatSpecs.ts`: Update version references and format notes to v1.26.52.3.
  4. `src/data/textureCatalog.ts`: Deduplicate catalog array so each texture path is unique and formatted to `.png`.
  5. `src/components/manifest/ManifestEditor.tsx`: Replace multi-version dropdown selector with locked Bedrock v1.26.52.3 target badge.
  6. `src/components/modals/NewProjectModal.tsx` & `src/components/modals/ExportModal.tsx`: Update default version inputs and descriptors to v1.26.52.3.
  7. `src/components/layout/MinecraftSplashScreen.tsx` & `src/components/layout/TopBar.tsx`: Update UI version subtext to `Minecraft Bedrock v1.26.52.3`.
  8. `src/services/zipAssetService.ts`: Ensure key normalization strips duplicate extensions and maps `.tga` references to canonical `.png` files.
