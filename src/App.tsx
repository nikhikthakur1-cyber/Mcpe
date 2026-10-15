import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ActiveTab, BedrockManifest, ProjectData, ProjectFile, TextureSlot, ValidationIssue } from './types';
import { createDefaultManifest, formatManifestJSON, parseManifestJSON } from './services/manifestService';
import { generateDefaultPackIcon } from './services/iconGeneratorService';
import { runFullValidation } from './services/validationService';
import { saveProjectToStorage, loadProjectFromStorage } from './services/storageService';
import { ImportArchiveResult } from './services/archiveService';
import { TEXTURE_CATALOG } from './data/textureCatalog';
import {
  buildConnectionGraph,
} from './services/jsonLinkerService';

import { TopBar } from './components/layout/TopBar';
import { StatusBar } from './components/layout/StatusBar';
import { TextureBrowser } from './components/textures/TextureBrowser';
import { FileTree } from './components/explorer/FileTree';
import { ManifestEditor } from './components/manifest/ManifestEditor';
import { ValidationPanel } from './components/validation/ValidationPanel';
import { ConnectionTreeView } from './components/tree/ConnectionTreeView';
import { UniversalJsonEditor } from './components/json/UniversalJsonEditor';
import { VanillaSamplesExplorer } from './components/samples/VanillaSamplesExplorer';

import { NewProjectModal } from './components/modals/NewProjectModal';
import { ImportModal } from './components/modals/ImportModal';
import { ExportModal } from './components/modals/ExportModal';
import { PackIconModal } from './components/modals/PackIconModal';
import { FileContentModal } from './components/explorer/FileContentModal';
import { VersionAuditModal } from './components/audit/VersionAuditModal';
import { CreateAssetWizardModal } from './components/modals/CreateAssetWizardModal';
import { BedrockFormatGuideModal } from './components/modals/BedrockFormatGuideModal';
import { ZipAssetManagerModal } from './components/modals/ZipAssetManagerModal';
import { MissingZipAlertModal } from './components/modals/MissingZipAlertModal';
import { MinecraftSplashScreen } from './components/layout/MinecraftSplashScreen';
import { zipAssetService, ZipAssetLoaderState } from './services/zipAssetService';
import { generatePlaceholderTexturePng } from './utils/placeholderTextureGenerator';

export default function App() {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('textures');
  const [selectedSlot, setSelectedSlot] = useState<TextureSlot | null>(TEXTURE_CATALOG[0]);
  const [inspectedFile, setInspectedFile] = useState<ProjectFile | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active JSON editor file
  const [editingJsonFilePath, setEditingJsonFilePath] = useState<string | null>(null);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [isVersionAuditOpen, setIsVersionAuditOpen] = useState(false);
  const [isCreateAssetWizardOpen, setIsCreateAssetWizardOpen] = useState(false);
  const [isFormatGuideOpen, setIsFormatGuideOpen] = useState(false);
  const [isZipModalOpen, setIsZipModalOpen] = useState(false);
  const [zipState, setZipState] = useState<ZipAssetLoaderState>(zipAssetService.getState());
  const [isZipSkipped, setIsZipSkipped] = useState(false);
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Subscribe to Zip Asset Service state changes
  useEffect(() => {
    const unsubscribe = zipAssetService.subscribe((s) => {
      setZipState(s);
    });
    return unsubscribe;
  }, []);

  // Auto dismiss splash screen as soon as ZIP index is loaded
  useEffect(() => {
    if (zipState.isLoaded) {
      const timer = setTimeout(() => setShowSplash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [zipState.isLoaded]);

  // Initialize or load from IndexedDB + Load Vanilla Assets ZIP
  useEffect(() => {
    // 1. Asynchronously initialize ZIP Asset Reader in background
    zipAssetService.loadZipFromUrl('/vanilla_assets.zip').catch(() => {});

    const initApp = async () => {
      try {
        const saved = await loadProjectFromStorage();
        if (saved && saved.manifest) {
          setProject(saved);
          setValidationIssues(runFullValidation(saved));
          return;
        }
      } catch {
        // Storage lookup fallback
      }

      // Default Starter Project
      const initialManifest = createDefaultManifest(
        'Bedrock Adventure Pack',
        'Custom Minecraft Bedrock resource pack'
      );
      let defaultIconBytes: Uint8Array = new Uint8Array();
      try {
        defaultIconBytes = await generateDefaultPackIcon('BEDROCK');
      } catch {
        // icon fallback
      }

      const files: Record<string, ProjectFile> = {};
      if (defaultIconBytes.length > 0) {
        files['pack_icon.png'] = {
          path: 'pack_icon.png',
          name: 'pack_icon.png',
          data: defaultIconBytes,
          mimeType: 'image/png',
          updatedAt: Date.now(),
        };
      }

      const newProj: ProjectData = {
        id: initialManifest.header.uuid,
        name: initialManifest.header.name,
        description: initialManifest.header.description,
        manifest: initialManifest,
        files,
        customSlots: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setProject(newProj);
      setValidationIssues(runFullValidation(newProj));
      saveProjectToStorage(newProj).catch(() => {});
    };

    initApp();
  }, []);

  // Update validation when project changes
  useEffect(() => {
    if (project) {
      setValidationIssues(runFullValidation(project));
    }
  }, [project]);

  // Compute Connection Graph
  const connectionGraph = useMemo(() => {
    if (!project) return null;
    return buildConnectionGraph(project.files, project.manifest);
  }, [project]);

  // Create New Project Handler
  const handleCreateNewProject = async (
    name: string,
    description: string,
    version: [number, number, number],
    engineVersion: [number, number, number],
    includeDefaultIcon: boolean
  ) => {
    const manifest = createDefaultManifest(name, description);
    manifest.header.version = version;
    manifest.header.min_engine_version = engineVersion;
    manifest.modules[0].version = version;

    const files: Record<string, ProjectFile> = {};
    if (includeDefaultIcon) {
      try {
        const iconData = await generateDefaultPackIcon(name);
        files['pack_icon.png'] = {
          path: 'pack_icon.png',
          name: 'pack_icon.png',
          data: iconData,
          mimeType: 'image/png',
          updatedAt: Date.now(),
        };
      } catch {
        // Fallback
      }
    }

    const newProject: ProjectData = {
      id: manifest.header.uuid,
      name,
      description,
      manifest,
      files,
      customSlots: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProject(newProject);
    setIsDirty(false);
    setSelectedSlot(TEXTURE_CATALOG[0]);
    setEditingJsonFilePath(null);
    await saveProjectToStorage(newProject);
    showToast(`Created new resource pack "${name}"`);
  };

  // Import Archive Handler
  const handleImportArchive = async (result: ImportArchiveResult) => {
    const manifest =
      result.manifest || createDefaultManifest('Imported Resource Pack', 'Imported Bedrock Pack');

    // Detect any files matching texture catalog paths and map them to custom slots
    const customSlots: Record<string, string> = {};
    for (const slot of TEXTURE_CATALOG) {
      if (result.files[slot.path]) {
        customSlots[slot.id] = slot.path;
        result.files[slot.path].isCustom = true;
        result.files[slot.path].slotId = slot.id;
      }
    }

    const importedProject: ProjectData = {
      id: manifest.header.uuid || Date.now().toString(),
      name: manifest.header.name || 'Imported Pack',
      description: manifest.header.description || '',
      manifest,
      files: result.files,
      customSlots,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setProject(importedProject);
    setIsDirty(true);
    setEditingJsonFilePath(null);
    await saveProjectToStorage(importedProject);
    showToast(`Imported ${Object.keys(result.files).length} files from archive`);
  };

  // Save Project to IndexedDB
  const handleSaveProject = async () => {
    if (!project) return;
    try {
      await saveProjectToStorage(project);
      setIsDirty(false);
      showToast('Project saved locally to IndexedDB');
    } catch {
      showToast('Failed to save project');
    }
  };

  // Upload texture to specific slot
  const handleUploadTexture = async (slot: TextureSlot, file: File) => {
    if (!project) return;

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    if (data.length < 8) {
      throw new Error('Selected image file is empty or corrupted.');
    }

    const updatedFiles = { ...project.files };
    updatedFiles[slot.path] = {
      path: slot.path,
      name: slot.path.split('/').pop() || `${slot.id}.png`,
      data,
      mimeType: 'image/png',
      isCustom: true,
      slotId: slot.id,
      updatedAt: Date.now(),
    };

    const updatedSlots = { ...project.customSlots, [slot.id]: slot.path };

    const updatedProject: ProjectData = {
      ...project,
      files: updatedFiles,
      customSlots: updatedSlots,
      updatedAt: Date.now(),
    };

    setProject(updatedProject);
    setIsDirty(true);
    showToast(`Mapped ${slot.name} to ${slot.path}`);
  };

  // Remove custom texture from slot
  const handleRemoveCustomTexture = (slot: TextureSlot) => {
    if (!project) return;

    const updatedFiles = { ...project.files };
    delete updatedFiles[slot.path];

    const updatedSlots = { ...project.customSlots };
    delete updatedSlots[slot.id];

    const updatedProject: ProjectData = {
      ...project,
      files: updatedFiles,
      customSlots: updatedSlots,
      updatedAt: Date.now(),
    };

    setProject(updatedProject);
    setIsDirty(true);
    showToast(`Removed custom texture for ${slot.name}`);
  };

  // Manifest changes
  const handleManifestChange = (updatedManifest: BedrockManifest) => {
    if (!project) return;

    const updatedProject: ProjectData = {
      ...project,
      name: updatedManifest.header.name,
      description: updatedManifest.header.description,
      manifest: updatedManifest,
      updatedAt: Date.now(),
    };

    setProject(updatedProject);
    setIsDirty(true);
  };

  // Upload arbitrary file in Explorer
  const handleUploadCustomFile = async (path: string, file: File) => {
    if (!project) return;

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const updatedFiles = { ...project.files };
    updatedFiles[path] = {
      path,
      name: path.split('/').pop() || 'file',
      data,
      mimeType: file.type || 'application/octet-stream',
      isCustom: true,
      updatedAt: Date.now(),
    };

    const matchedSlot = TEXTURE_CATALOG.find((s) => s.path === path);
    const updatedSlots = { ...project.customSlots };
    if (matchedSlot) {
      updatedSlots[matchedSlot.id] = path;
      updatedFiles[path].slotId = matchedSlot.id;
    }

    const updatedProject: ProjectData = {
      ...project,
      files: updatedFiles,
      customSlots: updatedSlots,
      updatedAt: Date.now(),
    };

    setProject(updatedProject);
    setIsDirty(true);
    showToast(`Added "${path}" to pack`);
  };

  // Delete file in Explorer
  const handleDeleteFile = (path: string) => {
    if (!project) return;

    const updatedFiles = { ...project.files };
    delete updatedFiles[path];

    const updatedSlots = { ...project.customSlots };
    for (const [slotId, slotPath] of Object.entries(updatedSlots)) {
      if (slotPath === path) delete updatedSlots[slotId];
    }

    const updatedProject: ProjectData = {
      ...project,
      files: updatedFiles,
      customSlots: updatedSlots,
      updatedAt: Date.now(),
    };

    setProject(updatedProject);
    setIsDirty(true);
    showToast(`Deleted "${path}"`);
  };

  // Pack Icon update
  const handleSaveIcon = (data: Uint8Array) => {
    if (!project) return;

    const updatedFiles = { ...project.files };
    updatedFiles['pack_icon.png'] = {
      path: 'pack_icon.png',
      name: 'pack_icon.png',
      data,
      mimeType: 'image/png',
      updatedAt: Date.now(),
    };

    const updatedProject = {
      ...project,
      files: updatedFiles,
      updatedAt: Date.now(),
    };

    setProject(updatedProject);
    setIsDirty(true);
    showToast('Updated pack_icon.png');
  };

  // Open JSON in Universal JSON Editor
  const handleOpenJsonEditor = (filePath: string) => {
    setEditingJsonFilePath(filePath);
  };

  // Save JSON from Universal JSON Editor
  const handleSaveJsonContent = (filePath: string, updatedText: string) => {
    if (!project) return;

    if (filePath.toLowerCase() === 'manifest.json') {
      const parseRes = parseManifestJSON(updatedText);
      if (parseRes.manifest) {
        handleManifestChange(parseRes.manifest);
        showToast('Saved manifest.json');
      } else {
        showToast('Cannot save invalid manifest JSON');
      }
      return;
    }

    const encoded = new TextEncoder().encode(updatedText);
    const updatedFiles = { ...project.files };
    const name = filePath.split('/').pop() || 'data.json';

    updatedFiles[filePath] = {
      path: filePath,
      name,
      data: encoded,
      mimeType: 'application/json',
      updatedAt: Date.now(),
    };

    const updatedProject: ProjectData = {
      ...project,
      files: updatedFiles,
      updatedAt: Date.now(),
    };

    setProject(updatedProject);
    setIsDirty(true);
    showToast(`Saved ${name}`);
  };

  const handleJumpToExplorer = (path: string) => {
    setActiveTab('explorer');
    if (project && project.files[path]) {
      setInspectedFile(project.files[path]);
    }
  };

  const handleSelectTextureFromTree = (path: string) => {
    // If it's a known slot, select that slot
    const slot = TEXTURE_CATALOG.find((s) => s.path === path);
    if (slot) {
      setSelectedSlot(slot);
    }
  };

  const handleUpdateEngineVersion = (newEngineVersion: [number, number, number]) => {
    if (!project) return;
    const updated = {
      ...project,
      manifest: {
        ...project.manifest,
        header: {
          ...project.manifest.header,
          min_engine_version: newEngineVersion,
        },
      },
      updatedAt: Date.now(),
    };
    setProject(updated);
    setIsDirty(true);
    showToast(`Updated min_engine_version to [${newEngineVersion.join(', ')}]`);
  };

  const handleScaffoldFolders = () => {
    if (!project) return;
    const updatedFiles = { ...project.files };
    const standardFolders = [
      'textures/blocks',
      'textures/items',
      'textures/entity',
      'textures/ui',
      'textures/environment',
      'textures/particle',
      'textures/colormap',
      'ui',
      'particles',
      'fogs',
      'texts',
    ];
    let addedCount = 0;
    for (const folder of standardFolders) {
      const readmePath = `${folder}/README.txt`;
      if (!updatedFiles[readmePath]) {
        updatedFiles[readmePath] = {
          path: readmePath,
          name: 'README.txt',
          data: new TextEncoder().encode(`Minecraft Bedrock Edition ${folder} directory`),
          mimeType: 'text/plain',
          updatedAt: Date.now(),
        };
        addedCount++;
      }
    }

    // Also scaffold standard terrain_texture.json and item_texture.json if missing
    if (!updatedFiles['textures/terrain_texture.json']) {
      const defaultTerrainJson = {
        resource_pack_name: project.name || 'BedrockPack',
        texture_name: 'atlas.terrain',
        padding: 8,
        num_mip_levels: 4,
        texture_data: {},
      };
      updatedFiles['textures/terrain_texture.json'] = {
        path: 'textures/terrain_texture.json',
        name: 'terrain_texture.json',
        data: new TextEncoder().encode(JSON.stringify(defaultTerrainJson, null, 2)),
        mimeType: 'application/json',
        updatedAt: Date.now(),
      };
      addedCount++;
    }

    if (!updatedFiles['textures/item_texture.json']) {
      const defaultItemJson = {
        resource_pack_name: project.name || 'BedrockPack',
        texture_name: 'atlas.items',
        texture_data: {},
      };
      updatedFiles['textures/item_texture.json'] = {
        path: 'textures/item_texture.json',
        name: 'item_texture.json',
        data: new TextEncoder().encode(JSON.stringify(defaultItemJson, null, 2)),
        mimeType: 'application/json',
        updatedAt: Date.now(),
      };
      addedCount++;
    }

    const updated = {
      ...project,
      files: updatedFiles,
      updatedAt: Date.now(),
    };
    setProject(updated);
    setIsDirty(true);
    showToast(`Scaffolded ${addedCount} standard Bedrock folders & registry JSON files!`);
  };

  const handleCreateCustomAsset = async ({
    assetType,
    name,
    texturePath,
    jsonPath,
    initialJsonContent,
  }: {
    assetType: 'block' | 'item' | 'flipbook' | 'entity';
    name: string;
    texturePath: string;
    jsonPath: string;
    initialJsonContent?: string;
  }) => {
    if (!project) return;
    const updatedFiles = { ...project.files };

    // 1. Generate placeholder PNG texture
    const textureFilename = texturePath.split('/').pop() || `${name}.png`;
    const textureData = await generatePlaceholderTexturePng(
      name,
      assetType === 'flipbook' ? 16 : assetType === 'entity' ? 64 : 16,
      assetType === 'flipbook' ? 64 : assetType === 'entity' ? 64 : 16,
      assetType === 'item' ? '#38bdf8' : '#10b981'
    );

    updatedFiles[texturePath] = {
      path: texturePath,
      name: textureFilename,
      data: textureData,
      mimeType: 'image/png',
      isCustom: true,
      updatedAt: Date.now(),
    };

    // 2. Register / update the target JSON definition
    const existingJsonFile = updatedFiles[jsonPath];
    if (existingJsonFile) {
      try {
        const text = new TextDecoder('utf-8').decode(existingJsonFile.data);
        const parsed = JSON.parse(text);
        const textureRefPath = texturePath.replace(/\.png$/, '');

        if (jsonPath.includes('terrain_texture.json') || jsonPath.includes('item_texture.json')) {
          if (!parsed.texture_data) parsed.texture_data = {};
          parsed.texture_data[name] = { textures: textureRefPath };
        } else if (jsonPath.includes('flipbook_textures.json') && Array.isArray(parsed)) {
          parsed.push({
            flipbook_texture: textureRefPath,
            atlas_tile: name,
            ticks_per_frame: 4,
            blend_frames: true,
          });
        }
        const updatedJsonStr = JSON.stringify(parsed, null, 2);
        updatedFiles[jsonPath] = {
          ...existingJsonFile,
          data: new TextEncoder().encode(updatedJsonStr),
          updatedAt: Date.now(),
        };
      } catch {
        // Fallback: create fresh if parse fails
        if (initialJsonContent) {
          updatedFiles[jsonPath] = {
            path: jsonPath,
            name: jsonPath.split('/').pop() || 'definition.json',
            data: new TextEncoder().encode(initialJsonContent),
            mimeType: 'application/json',
            updatedAt: Date.now(),
          };
        }
      }
    } else if (initialJsonContent) {
      updatedFiles[jsonPath] = {
        path: jsonPath,
        name: jsonPath.split('/').pop() || 'definition.json',
        data: new TextEncoder().encode(initialJsonContent),
        mimeType: 'application/json',
        updatedAt: Date.now(),
      };
    }

    const updatedProject: ProjectData = {
      ...project,
      files: updatedFiles,
      updatedAt: Date.now(),
    };

    setProject(updatedProject);
    setIsDirty(true);
    showToast(`Created custom asset ${name} & updated ${jsonPath}`);
  };

  const handleSelectSlotFromAudit = (slotPath: string) => {
    const slot = TEXTURE_CATALOG.find((s) => s.path === slotPath);
    if (slot) {
      setSelectedSlot(slot);
      setActiveTab('textures');
      setEditingJsonFilePath(null);
    }
  };

  if (!project) {
    return (
      <div className="h-screen w-screen bg-[#0B0F14] flex items-center justify-center text-slate-400 font-mono text-xs">
        Initializing Bedrock Studio...
      </div>
    );
  }

  const customTexturesCount = Object.keys(project.customSlots).length;
  const totalFilesCount = Object.keys(project.files).length + 1; // + manifest.json

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B0F14] text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Contract */}
      <TopBar
        packName={project.name}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setEditingJsonFilePath(null);
        }}
        onNewProject={() => setIsNewModalOpen(true)}
        onImport={() => setIsImportModalOpen(true)}
        onSave={handleSaveProject}
        onExport={() => setIsExportModalOpen(true)}
        onOpenAudit={() => setIsVersionAuditOpen(true)}
        onOpenZipModal={() => setIsZipModalOpen(true)}
        isDirty={isDirty}
        validationIssues={validationIssues}
        customTexturesCount={customTexturesCount}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 overflow-hidden relative">
        {/* If user has an active JSON file opened in Universal JSON Editor */}
        {editingJsonFilePath ? (
          <UniversalJsonEditor
            initialFilePath={editingJsonFilePath}
            files={project.files}
            manifest={project.manifest}
            onSave={handleSaveJsonContent}
            onClose={() => setEditingJsonFilePath(null)}
          />
        ) : (
          <>
            {activeTab === 'textures' && (
              <TextureBrowser
                customSlots={project.customSlots}
                files={project.files}
                selectedSlot={selectedSlot}
                onSelectSlot={setSelectedSlot}
                onUploadTexture={handleUploadTexture}
                onRemoveCustomTexture={handleRemoveCustomTexture}
                onJumpToExplorer={handleJumpToExplorer}
                onOpenZipModal={() => setIsZipModalOpen(true)}
              />
            )}

            {activeTab === 'explorer' && (
              <div className="flex h-full w-full overflow-hidden">
                <div className={`h-full transition-all duration-200 shrink-0 ${isTreeCollapsed ? 'w-12' : 'w-72 md:w-80'}`}>
                  <FileTree
                    files={project.files}
                    onSelectFile={setInspectedFile}
                    onDeleteFile={handleDeleteFile}
                    onUploadCustomFile={handleUploadCustomFile}
                    onEditJsonFile={handleOpenJsonEditor}
                    onScaffoldStandardStructure={handleScaffoldFolders}
                    isCollapsed={isTreeCollapsed}
                    onToggleCollapse={() => setIsTreeCollapsed(!isTreeCollapsed)}
                  />
                </div>
                <div className="flex-1 bg-[#090D12] p-6 flex flex-col items-center justify-center text-center">
                  <div className="max-w-md p-6 rounded-xl border border-[#1E293B] bg-[#111822] space-y-3">
                    <h3 className="text-sm font-bold text-slate-100">Virtual File System Explorer</h3>
                    <p className="text-xs text-slate-400">
                      Inspect and manage every root and subdirectory asset packaged inside your Bedrock resource pack.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={handleScaffoldFolders}
                        className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-xs font-semibold rounded text-sky-400 border border-sky-500/30 transition-colors"
                      >
                        Scaffold Pro Folders
                      </button>
                      <button
                        onClick={() => setIsIconModalOpen(true)}
                        className="px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-xs font-semibold rounded text-slate-200 transition-colors"
                      >
                        Configure pack_icon.png
                      </button>
                      <button
                        onClick={() => handleOpenJsonEditor('manifest.json')}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold rounded text-emerald-400 border border-emerald-500/30 transition-colors"
                      >
                        Edit manifest.json
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'samples' && (
              <VanillaSamplesExplorer
                onCopyPath={(p) => showToast(`Copied sample path: ${p}`)}
                onImportSampleFile={async (samplePath) => {
                  try {
                    const res = await fetch(`/vanilla_samples/${samplePath}`);
                    if (!res.ok) throw new Error('Failed to download vanilla sample');
                    const arrayBuf = await res.arrayBuffer();
                    const uint8 = new Uint8Array(arrayBuf);
                    const fileName = samplePath.split('/').pop() || 'sample.json';
                    const mime = samplePath.endsWith('.json') ? 'application/json' : samplePath.endsWith('.lang') ? 'text/plain' : 'application/octet-stream';
                    
                    const updatedFiles = { ...project.files };
                    updatedFiles[samplePath] = {
                      path: samplePath,
                      name: fileName,
                      data: uint8,
                      mimeType: mime,
                      updatedAt: Date.now(),
                    };
                    const updated = {
                      ...project,
                      files: updatedFiles,
                      updatedAt: Date.now(),
                    };
                    setProject(updated);
                    setIsDirty(true);
                    showToast(`Imported ${fileName} into pack!`);
                  } catch (err: unknown) {
                    showToast(err instanceof Error ? err.message : 'Error importing sample');
                  }
                }}
              />
            )}



            {activeTab === 'manifest' && (
              <ManifestEditor
                manifest={project.manifest}
                onChange={handleManifestChange}
                validationIssues={validationIssues}
              />
            )}

            {activeTab === 'tree' && connectionGraph && (
              <ConnectionTreeView
                graph={connectionGraph}
                files={project.files}
                onOpenJsonEditor={handleOpenJsonEditor}
                onSelectTexture={handleSelectTextureFromTree}
                onRefreshGraph={() => {
                  if (project) {
                    setValidationIssues(runFullValidation(project));
                    showToast('Connection graph updated');
                  }
                }}
                onOpenCreateAssetWizard={() => setIsCreateAssetWizardOpen(true)}
                onOpenFormatGuide={() => setIsFormatGuideOpen(true)}
              />
            )}

            {activeTab === 'validation' && (
              <ValidationPanel
                issues={validationIssues}
                onNavigateTab={setActiveTab}
                onRefreshValidation={() => setValidationIssues(runFullValidation(project))}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Status Bar */}
      <StatusBar
        selectedSlotPath={selectedSlot?.path || null}
        customTexturesCount={customTexturesCount}
        totalFilesCount={totalFilesCount}
        isDirty={isDirty}
        validationIssues={validationIssues}
      />

      {/* Modals */}
      <NewProjectModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreateNewProject}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirmImport={handleImportArchive}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        manifest={project.manifest}
        files={project.files}
        validationIssues={validationIssues}
      />

      <PackIconModal
        isOpen={isIconModalOpen}
        onClose={() => setIsIconModalOpen(false)}
        currentIconData={project.files['pack_icon.png']?.data || null}
        packName={project.name}
        onSaveIcon={handleSaveIcon}
      />

      <FileContentModal
        file={inspectedFile}
        onClose={() => setInspectedFile(null)}
        onEditJson={handleOpenJsonEditor}
      />

      <VersionAuditModal
        isOpen={isVersionAuditOpen}
        onClose={() => setIsVersionAuditOpen(false)}
        manifest={project.manifest}
        files={project.files}
        onUpdateEngineVersion={handleUpdateEngineVersion}
        onScaffoldFolders={handleScaffoldFolders}
        onSelectSlotFromAudit={handleSelectSlotFromAudit}
      />

      <CreateAssetWizardModal
        isOpen={isCreateAssetWizardOpen}
        onClose={() => setIsCreateAssetWizardOpen(false)}
        onCreateAsset={handleCreateCustomAsset}
      />

      <BedrockFormatGuideModal
        isOpen={isFormatGuideOpen}
        onClose={() => setIsFormatGuideOpen(false)}
      />

      <ZipAssetManagerModal
        isOpen={isZipModalOpen}
        onClose={() => setIsZipModalOpen(false)}
        onShowToast={showToast}
      />

      <MissingZipAlertModal
        isOpen={Boolean(zipState.error && !isZipSkipped)}
        errorMessage={zipState.error}
        onSkip={() => {
          setIsZipSkipped(true);
          showToast('Proceeding with procedural synthetic fallbacks');
        }}
        onRetry={() => {
          setIsZipSkipped(false);
          zipAssetService.loadZipFromUrl('/vanilla_assets.zip');
        }}
      />

      {/* Startup Minecraft Preloader Splash Screen */}
      {showSplash && (
        <MinecraftSplashScreen
          zipState={zipState}
          onSkip={() => setShowSplash(false)}
        />
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 right-6 z-50 bg-[#141E28] border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-lg shadow-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
