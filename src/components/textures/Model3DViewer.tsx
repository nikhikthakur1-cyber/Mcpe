import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Box, Sword, Play, Pause, Layers } from 'lucide-react';
import { zipAssetService } from '../../services/zipAssetService';
import { getProceduralVanillaReferenceUrl } from '../../utils/vanillaTextureGenerator';

interface Model3DViewerProps {
  textureUrl?: string | null;
  textureData?: Uint8Array | null;
  category: 'blocks' | 'items' | 'entity' | 'ui' | 'environment' | string;
  recommendedDimensions?: { width: number; height: number };
  sampleColor?: string;
  name?: string;
  slotPath?: string;
  slotId?: string;
}

/**
 * Builds authentic 3D Minecraft voxel extruded geometry from item PNG pixels.
 * Every non-transparent pixel in the 16x16 / 32x32 sprite becomes a 3D pixel block.
 */
function createVoxelExtrudedMesh(
  image: HTMLImageElement,
  wireframe: boolean
): THREE.Object3D {
  const canvas = document.createElement('canvas');
  const size = Math.min(64, Math.max(16, image.width || 16));
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new THREE.Mesh();

  ctx.drawImage(image, 0, 0, size, size);
  const imgData = ctx.getImageData(0, 0, size, size);
  const pixels = imgData.data;

  const group = new THREE.Group();
  const pixelSize = 1.8 / size; // Scale to ~1.8 units
  const depth = pixelSize * 1.2; // Voxel thickness

  // Create instanced or merged voxels for performance
  const boxGeo = new THREE.BoxGeometry(pixelSize, pixelSize, depth);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const alpha = pixels[idx + 3];

      if (alpha > 20) {
        const r = pixels[idx] / 255;
        const g = pixels[idx + 1] / 255;
        const b = pixels[idx + 2] / 255;

        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(r, g, b),
          roughness: 0.7,
          metalness: 0.1,
          wireframe,
        });

        const voxel = new THREE.Mesh(boxGeo, mat);
        // Centered position
        const posX = (x - size / 2 + 0.5) * pixelSize;
        const posY = (size / 2 - y - 0.5) * pixelSize;
        voxel.position.set(posX, posY, 0);

        group.add(voxel);
      }
    }
  }

  // Slight tilt angle like holding item in-game
  group.rotation.z = Math.PI * 0.12;
  return group;
}

export const Model3DViewer: React.FC<Model3DViewerProps> = ({
  textureUrl,
  textureData,
  category,
  sampleColor = '#38BDF8',
  slotPath,
  slotId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const autoRotateRef = useRef(autoRotate);
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const [wireframe, setWireframe] = useState(false);
  const [modelType, setModelType] = useState<'cube' | 'item'>(
    category === 'items' ? 'item' : 'cube'
  );

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const activeObjRef = useRef<THREE.Object3D | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Drag controls
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    setModelType(category === 'items' ? 'item' : 'cube');
  }, [category]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 280;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e14);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.2, 1.8, 2.8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(4, 6, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.5);
    dirLight2.position.set(-4, -2, -4);
    scene.add(dirLight2);

    // 5. Asynchronously Load Texture Image & Build Mesh
    let isCancelled = false;
    let blobUrlToRevoke: string | null = null;

    const attachObject = (obj: THREE.Object3D) => {
      if (isCancelled) return;
      if (activeObjRef.current) {
        scene.remove(activeObjRef.current);
      }
      scene.add(obj);
      activeObjRef.current = obj;
    };

    const renderProceduralFallback = () => {
      if (isCancelled) return;
      const refUrl = getProceduralVanillaReferenceUrl(
        slotId || slotPath || 'block',
        sampleColor
      );
      const refImg = new Image();
      refImg.crossOrigin = 'Anonymous';
      refImg.onload = () => {
        if (isCancelled) return;
        if (modelType === 'item') {
          const voxelMesh = createVoxelExtrudedMesh(refImg, wireframe);
          attachObject(voxelMesh);
        } else {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(refUrl, (loadedTex) => {
            if (isCancelled) return;
            loadedTex.magFilter = THREE.NearestFilter;
            loadedTex.minFilter = THREE.NearestFilter;
            loadedTex.generateMipmaps = false;

            const geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
            const material = new THREE.MeshStandardMaterial({
              map: loadedTex,
              roughness: 0.8,
              metalness: 0.1,
              wireframe,
            });
            attachObject(new THREE.Mesh(geometry, material));
          });
        }
      };
      refImg.src = refUrl;
    };

    const loadTextureAndRender = async () => {
      let resolvedSrc: string | null = null;

      // 1. Custom uploaded binary data
      if (textureData && textureData.length > 0) {
        const blob = new Blob([textureData.buffer as ArrayBuffer], { type: 'image/png' });
        blobUrlToRevoke = URL.createObjectURL(blob);
        resolvedSrc = blobUrlToRevoke;
      } else {
        // 2. Multi-candidate lookup from zipAssetService
        const candidates = [slotPath, slotId, name, textureUrl].filter(Boolean) as string[];
        for (const cand of candidates) {
          if (cand.startsWith('blob:') || cand.startsWith('data:')) {
            resolvedSrc = cand;
            break;
          }
          const syncUrl = zipAssetService.getTextureObjectUrlSync(cand);
          if (syncUrl) {
            resolvedSrc = syncUrl;
            break;
          }
          const asyncUrl = await zipAssetService.getTextureObjectUrl(cand);
          if (asyncUrl) {
            resolvedSrc = asyncUrl;
            break;
          }
        }
      }

      // 3. Fallback if no URL found
      if (!resolvedSrc) {
        renderProceduralFallback();
        return;
      }

      if (isCancelled) return;

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        if (isCancelled) return;
        if (modelType === 'item') {
          // Pixel Extruded 3D Voxel Mesh
          const voxelMesh = createVoxelExtrudedMesh(img, wireframe);
          attachObject(voxelMesh);
        } else {
          // 3D Minecraft Block Cube
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(
            resolvedSrc!,
            (loadedTex) => {
              if (isCancelled) return;
              loadedTex.magFilter = THREE.NearestFilter;
              loadedTex.minFilter = THREE.NearestFilter;
              loadedTex.generateMipmaps = false;
              loadedTex.needsUpdate = true;

              const geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4);
              const material = new THREE.MeshStandardMaterial({
                map: loadedTex,
                roughness: 0.7,
                metalness: 0.1,
                wireframe,
              });
              const cubeMesh = new THREE.Mesh(geometry, material);
              attachObject(cubeMesh);
            },
            undefined,
            () => {
              renderProceduralFallback();
            }
          );
        }
      };
      img.onerror = () => {
        renderProceduralFallback();
      };
      img.src = resolvedSrc;
    };

    loadTextureAndRender();

    // 6. Animation
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      if (activeObjRef.current && autoRotateRef.current && !isDraggingRef.current) {
        activeObjRef.current.rotation.y += 0.012;
      }
      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      isCancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      if (blobUrlToRevoke) URL.revokeObjectURL(blobUrlToRevoke);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [textureUrl, textureData, slotPath, slotId, modelType, wireframe, sampleColor]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !activeObjRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - prevMouseRef.current.x;
    const deltaY = e.touches[0].clientY - prevMouseRef.current.y;

    activeObjRef.current.rotation.y += deltaX * 0.015;
    activeObjRef.current.rotation.x += deltaY * 0.015;

    prevMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !activeObjRef.current) return;
    const deltaX = e.clientX - prevMouseRef.current.x;
    const deltaY = e.clientY - prevMouseRef.current.y;

    activeObjRef.current.rotation.y += deltaX * 0.015;
    activeObjRef.current.rotation.x += deltaY * 0.015;

    prevMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    e.preventDefault();
    const zoomSpeed = 0.002;
    const newPos = cameraRef.current.position.z + e.deltaY * zoomSpeed;
    if (newPos > 1.0 && newPos < 7.0) {
      cameraRef.current.position.z = newPos;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080B10] rounded-xl border border-[#1E293B] overflow-hidden select-none">
      {/* Controls Bar */}
      <div className="p-2.5 bg-[#0D131C] border-b border-[#1E293B] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setModelType('cube')}
            className={`px-2 py-1 rounded font-medium flex items-center gap-1 text-[11px] transition-colors ${
              modelType === 'cube'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="3D Minecraft Voxel Block"
          >
            <Box className="w-3.5 h-3.5" />
            <span>Block</span>
          </button>

          <button
            onClick={() => setModelType('item')}
            className={`px-2 py-1 rounded font-medium flex items-center gap-1 text-[11px] transition-colors ${
              modelType === 'item'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="3D Pixel Extruded Voxel Item"
          >
            <Sword className="w-3.5 h-3.5" />
            <span>3D Item Voxel</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setAutoRotate((prev) => !prev);
            }}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 text-[11px] font-medium ${
              autoRotate
                ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-[#141C26]'
            }`}
            title={autoRotate ? 'Pause 3D Spin' : 'Play 3D Spin'}
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-slate-300" />}
            <span className="hidden sm:inline">{autoRotate ? 'Spinning' : 'Paused'}</span>
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            className={`p-1.5 rounded transition-colors ${
              wireframe ? 'text-sky-400 bg-sky-500/10' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Wireframe Voxel Mesh"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              if (activeObjRef.current) {
                activeObjRef.current.rotation.set(0, 0, modelType === 'item' ? Math.PI * 0.12 : 0);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1E293B] rounded transition-colors"
            title="Reset Orientation"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="flex-1 w-full min-h-[220px] cursor-grab active:cursor-grabbing relative overflow-hidden flex items-center justify-center touch-none"
      >
        <span className="text-slate-600 font-mono text-[11px] absolute">
          Generating Pixel Extruded 3D Voxel...
        </span>
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-[#090D14] border-t border-[#1E293B] flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>360° Pixel Extruded Mesh</span>
        <span className="text-emerald-400">Minecraft Handheld Depth</span>
      </div>
    </div>
  );
};
