import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Eye,
  Camera,
  Maximize2,
  Box,
  Layers,
  Sparkles,
  AlertTriangle,
  Compass,
  Download,
  CheckCircle2,
  Printer,
  Flame,
  ArrowDownToLine,
} from 'lucide-react';
import { CADDesign } from '../types/cad';
import { buildParametricGeometry } from '../utils/geometryGenerators';
import { generateBinarySTL, generateLaserSVG, downloadFile } from '../utils/stlExporter';

interface Viewport3DProps {
  design: CADDesign;
  activeTab?: 'dimensions' | 'slicer' | 'laser';
  onGeometryReady?: (geometry: THREE.BufferGeometry) => void;
  onSnapshot?: (dataUrl: string) => void;
  onQuickExport?: (format: 'stl' | 'svg') => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  design,
  activeTab = 'dimensions',
  onGeometryReady,
  onSnapshot,
  onQuickExport,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport states
  const [renderMode, setRenderMode] = useState<'solid' | 'metallic' | 'wireframe' | 'overhang'>('solid');
  const [sliceProgress, setSliceProgress] = useState<number>(100);
  const [isSlicingActive, setIsSlicingActive] = useState<boolean>(false);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(true);
  const [hasOverhangs, setHasOverhangs] = useState<boolean>(false);

  // Quick Export State
  const [quickExportSuccess, setQuickExportSuccess] = useState<boolean>(false);
  const [isQuickExporting, setIsQuickExporting] = useState<boolean>(false);

  const isLaserActive = activeTab === 'laser';
  const exportFormatLabel = isLaserActive ? '.SVG' : '.STL';
  const exportDestinationLabel = isLaserActive ? 'Laser Cut & Engrave' : '3D Print Ready';

  const handleQuickExport = () => {
    if (onQuickExport) {
      onQuickExport(isLaserActive ? 'svg' : 'stl');
      setQuickExportSuccess(true);
      setTimeout(() => setQuickExportSuccess(false), 2200);
      return;
    }

    setIsQuickExporting(true);
    try {
      const cleanName = design.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      if (isLaserActive) {
        const svgContent = generateLaserSVG(design);
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        downloadFile(blob, `${cleanName}_laser.svg`);
      } else {
        const geom = currentGeometryRef.current || buildParametricGeometry(design.modelType, design.dimensions);
        const bytes = generateBinarySTL(geom);
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'model/stl' });
        downloadFile(blob, `${cleanName}.stl`);
      }
      setQuickExportSuccess(true);
      setTimeout(() => setQuickExportSuccess(false), 2200);
    } catch (err) {
      console.error('Quick export failed:', err);
    } finally {
      setIsQuickExporting(false);
    }
  };

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.Mesh | null>(null);
  const clipPlaneRef = useRef<THREE.Plane | null>(null);
  const currentGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const bboxHelperRef = useRef<THREE.BoxHelper | null>(null);

  // Mouse interaction state for manual orbit control without external OrbitControls dependency
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const sphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 180,
    theta: Math.PI / 4,
    phi: Math.PI / 3,
  });

  // Setup Three scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x11131a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 2000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    // Lighting setup for crisp CAD visualization
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(120, 200, 150);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x88aaff, 0.6);
    dirLight2.position.set(-150, 100, -100);
    scene.add(dirLight2);

    const bottomBounce = new THREE.DirectionalLight(0x445566, 0.4);
    bottomBounce.position.set(0, -100, 0);
    scene.add(bottomBounce);

    // Build Plate Grid (250mm x 250mm with 10mm & 50mm increments)
    const gridHelper = new THREE.GridHelper(260, 26, 0xf59e0b, 0x272e3f);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Build plate border
    const bedBorderGeo = new THREE.BoxGeometry(260, 1.5, 260);
    const bedBorderMat = new THREE.MeshBasicMaterial({ color: 0x1f2432, wireframe: true });
    const bedBorder = new THREE.Mesh(bedBorderGeo, bedBorderMat);
    bedBorder.position.y = -0.75;
    scene.add(bedBorder);

    // Clipping plane for layer slicing simulation
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000);
    clipPlaneRef.current = clipPlane;
    renderer.clippingPlanes = [clipPlane];

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isAutoRotate) {
        sphericalRef.current.theta += 0.006;
      }

      // Update camera position from spherical coordinates
      const { radius, theta, phi } = sphericalRef.current;
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);

      camera.position.set(x, y, z);
      camera.lookAt(0, (design.dimensions.height || 40) / 2, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const newW = containerRef.current.clientWidth;
      const newH = containerRef.current.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update geometry when design changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove old mesh
    if (meshRef.current) {
      scene.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
      meshRef.current = null;
    }
    if (wireframeMeshRef.current) {
      scene.remove(wireframeMeshRef.current);
      wireframeMeshRef.current.geometry.dispose();
      (wireframeMeshRef.current.material as THREE.Material).dispose();
      wireframeMeshRef.current = null;
    }
    if (bboxHelperRef.current) {
      scene.remove(bboxHelperRef.current);
      bboxHelperRef.current = null;
    }

    // Build new geometry
    const geometry = buildParametricGeometry(design.modelType, design.dimensions);
    currentGeometryRef.current = geometry;
    if (onGeometryReady) {
      onGeometryReady(geometry);
    }

    // Analyze overhang angles (>45 degrees relative to Z/Y up)
    let detectedOverhang = false;
    const norm = geometry.getAttribute('normal');
    if (norm) {
      for (let i = 0; i < norm.count; i++) {
        const ny = norm.getY(i);
        // If facing downwards steeper than 45 deg
        if (ny < -0.707) {
          detectedOverhang = true;
          break;
        }
      }
    }
    setHasOverhangs(detectedOverhang);

    // Create Material based on selected render mode
    let material: THREE.Material;
    if (renderMode === 'metallic') {
      material = new THREE.MeshStandardMaterial({
        color: 0xe0a96d, // warm silk gold / bronze filament
        metalness: 0.75,
        roughness: 0.28,
        clippingPlanes: isSlicingActive && clipPlaneRef.current ? [clipPlaneRef.current] : [],
        clipShadows: true,
      });
    } else if (renderMode === 'overhang') {
      material = new THREE.MeshStandardMaterial({
        color: detectedOverhang ? 0xef4444 : 0x10b981,
        roughness: 0.5,
        clippingPlanes: isSlicingActive && clipPlaneRef.current ? [clipPlaneRef.current] : [],
      });
    } else {
      // Solid matte / terracotta / studio clay
      material = new THREE.MeshStandardMaterial({
        color: 0x3b82f6, // Vibrant Cobalt Studio Blue
        roughness: 0.45,
        metalness: 0.1,
        clippingPlanes: isSlicingActive && clipPlaneRef.current ? [clipPlaneRef.current] : [],
        clipShadows: true,
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // Optional Wireframe overlay
    if (renderMode === 'wireframe') {
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        clippingPlanes: isSlicingActive && clipPlaneRef.current ? [clipPlaneRef.current] : [],
      });
      const wireMesh = new THREE.Mesh(geometry.clone(), wireMat);
      scene.add(wireMesh);
      wireframeMeshRef.current = wireMesh;
    }

    // Bounding Box Helper
    if (showBoundingBox) {
      const boxHelper = new THREE.BoxHelper(mesh, 0xf59e0b);
      scene.add(boxHelper);
      bboxHelperRef.current = boxHelper;
    }
  }, [design.dimensions, design.modelType, renderMode, showBoundingBox, isSlicingActive]);

  // Handle Layer Slicing Simulation Height
  useEffect(() => {
    if (!clipPlaneRef.current || !meshRef.current) return;
    const totalHeight = design.dimensions.height || 50;
    if (isSlicingActive) {
      const sliceHeight = (sliceProgress / 100) * totalHeight;
      clipPlaneRef.current.constant = sliceHeight;
    } else {
      clipPlaneRef.current.constant = 1000;
    }
  }, [sliceProgress, isSlicingActive, design.dimensions.height]);

  // Mouse / Touch Orbit controls handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;

    sphericalRef.current.theta -= deltaX * 0.008;
    sphericalRef.current.phi = Math.max(
      0.1,
      Math.min(Math.PI / 2 - 0.05, sphericalRef.current.phi - deltaY * 0.008)
    );

    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    sphericalRef.current.radius = Math.max(
      40,
      Math.min(500, sphericalRef.current.radius + e.deltaY * 0.25)
    );
  };

  // Camera presets
  const setCameraView = (type: 'iso' | 'top' | 'front' | 'right') => {
    switch (type) {
      case 'iso':
        sphericalRef.current = { radius: 180, theta: Math.PI / 4, phi: Math.PI / 3.2 };
        break;
      case 'top':
        sphericalRef.current = { radius: 190, theta: 0, phi: 0.05 };
        break;
      case 'front':
        sphericalRef.current = { radius: 180, theta: 0, phi: Math.PI / 2 - 0.08 };
        break;
      case 'right':
        sphericalRef.current = { radius: 180, theta: Math.PI / 2, phi: Math.PI / 2 - 0.08 };
        break;
    }
  };

  // Snapshot capture
  const handleTakeSnapshot = () => {
    if (!canvasRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    if (onSnapshot) {
      onSnapshot(dataUrl);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[440px] bg-[#0c0e14] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Top Left: Model info & Real-time Dimensions Badge */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs shadow-lg flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200 tracking-wide">{design.name}</span>
          <span className="text-slate-400 font-mono text-[11px] border-l border-slate-700 pl-2">
            {design.dimensions.width} × {design.dimensions.depth || design.dimensions.width} × {design.dimensions.height} mm
          </span>
        </div>

        {hasOverhangs && (
          <div className="bg-amber-950/80 border border-amber-600/50 rounded-lg px-3 py-1 text-[11px] text-amber-200 flex items-center gap-1.5 shadow-md">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Overhangs &gt; 45° detected. Supports or reorientation suggested.</span>
          </div>
        )}
      </div>

      {/* Top Right: Camera Presets & Snapshot */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-1.5 rounded-xl shadow-lg">
        <button
          onClick={() => setCameraView('iso')}
          className="px-2.5 py-1 text-xs rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Isometric View"
        >
          ISO
        </button>
        <button
          onClick={() => setCameraView('top')}
          className="px-2 py-1 text-xs rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Top Down"
        >
          TOP
        </button>
        <button
          onClick={() => setCameraView('front')}
          className="px-2 py-1 text-xs rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Front View"
        >
          FRONT
        </button>
        <div className="w-px h-4 bg-slate-700 mx-0.5" />
        <button
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`p-1.5 rounded-lg transition ${
            isAutoRotate ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Auto Rotate Turntable"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleTakeSnapshot}
          className="p-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition"
          title="Take High-Res Product Shot"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Quick Export Action Button (Adaptive to Active Tab) */}
      <div className="absolute top-16 right-4 z-20 pointer-events-auto">
        <button
          id="tour-quick-export-button"
          onClick={handleQuickExport}
          disabled={isQuickExporting}
          className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl shadow-2xl font-bold text-xs transition-all duration-300 transform active:scale-95 border cursor-pointer ${
            quickExportSuccess
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/50'
              : isLaserActive
              ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white border-rose-400/50 shadow-rose-950/50 hover:shadow-rose-900/40'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-blue-400/50 shadow-blue-950/50 hover:shadow-blue-900/40'
          }`}
          title={`Click to one-click download ${exportFormatLabel} for the active ${activeTab} workspace`}
        >
          {quickExportSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200 animate-bounce" />
              <div className="flex flex-col text-left leading-tight">
                <span className="font-extrabold text-white">Downloaded {exportFormatLabel}!</span>
                <span className="text-[9px] text-emerald-100 font-normal">File saved to downloads</span>
              </div>
            </>
          ) : (
            <>
              <div className="p-1 rounded-lg bg-black/20 group-hover:bg-black/30 transition">
                {isLaserActive ? (
                  <Flame className="w-4 h-4 text-amber-200 shrink-0" />
                ) : (
                  <Printer className="w-4 h-4 text-cyan-200 shrink-0" />
                )}
              </div>
              <div className="flex flex-col text-left leading-tight">
                <span className="font-extrabold flex items-center gap-1.5 tracking-wide">
                  <span>Quick Export</span>
                  <span className="font-mono bg-black/30 px-1.5 py-0.2 rounded text-[10px] text-white/95 border border-white/20">
                    {exportFormatLabel}
                  </span>
                </span>
                <span className="text-[9px] text-white/80 font-medium">
                  {exportDestinationLabel}
                </span>
              </div>
              <ArrowDownToLine className="w-3.5 h-3.5 ml-1 opacity-80 group-hover:translate-y-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* Bottom Bar: Render Modes & Slicing Simulator */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        {/* Render Shading Selector */}
        <div className="flex items-center gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 p-1 rounded-xl shadow-lg">
          <button
            onClick={() => setRenderMode('solid')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              renderMode === 'solid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Solid Studio
          </button>
          <button
            onClick={() => setRenderMode('metallic')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              renderMode === 'metallic'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Silk Gold
          </button>
          <button
            onClick={() => setRenderMode('wireframe')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              renderMode === 'wireframe'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mesh Grid
          </button>
          <button
            onClick={() => setRenderMode('overhang')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
              renderMode === 'overhang'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overhangs
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <button
            onClick={() => setShowBoundingBox(!showBoundingBox)}
            className={`p-1.5 rounded-lg text-xs transition ${
              showBoundingBox ? 'text-amber-400 bg-amber-500/15' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Bounding Dimensions Box"
          >
            <Box className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Slicing Layer Height Simulation */}
        <div className="flex items-center gap-2.5 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 px-3.5 py-1.5 rounded-xl shadow-lg">
          <button
            onClick={() => setIsSlicingActive(!isSlicingActive)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition ${
              isSlicingActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Layer Cut</span>
          </button>

          {isSlicingActive && (
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="100"
                value={sliceProgress}
                onChange={(e) => setSliceProgress(Number(e.target.value))}
                className="w-28 accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-indigo-300 w-9">
                {Math.round((sliceProgress / 100) * (design.dimensions.height || 50))}mm
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
