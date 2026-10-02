import React, { useState, useEffect } from 'react';
import {
  Box,
  Layers,
  Flame,
  Cloud,
  TrendingUp,
  Share2,
  ShoppingBag,
  Download,
  Sparkles,
  Sliders,
  Printer,
  ChevronDown,
  Wand2,
  MessageSquare,
  FileCode,
  FileArchive,
  RefreshCw,
  Plus,
  Compass,
  History,
} from 'lucide-react';
import * as THREE from 'three';

import { CADDesign, ModelType, ModelDimensions, PrintSettings, LaserSettings, DesignVersion } from './types/cad';
import { Viewport3D } from './components/Viewport3D';
import { DimensionEditor } from './components/DimensionEditor';
import { PrintOptimizer } from './components/PrintOptimizer';
import { LaserStudio } from './components/LaserStudio';
import { PrintServiceApiModal } from './components/PrintServiceApiModal';
import { CloudLibrary } from './components/CloudLibrary';
import { TrendRadarModal } from './components/TrendRadarModal';
import { EtsyListingModal } from './components/EtsyListingModal';
import { ForgeCopilotChat } from './components/ForgeCopilotChat';
import { DescribeAndCreateModal } from './components/DescribeAndCreateModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { OnboardingTour } from './components/OnboardingTour';

import {
  generateBinarySTL,
  generateAsciiSTL,
  generateLaserSVG,
  generateDXFVector,
  downloadFile,
} from './utils/stlExporter';
import { buildParametricGeometry } from './utils/geometryGenerators';

export default function App() {
  // Cloud library state
  const [library, setLibrary] = useState<CADDesign[]>([]);
  const [activeDesign, setActiveDesign] = useState<CADDesign | null>(null);
  const [activeTab, setActiveTab] = useState<'dimensions' | 'slicer' | 'laser'>('dimensions');

  // Modals & Panels
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isTrendRadarOpen, setIsTrendRadarOpen] = useState(false);
  const [isPrintApiOpen, setIsPrintApiOpen] = useState(false);
  const [isEtsyListingOpen, setIsEtsyListingOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isDescribeModalOpen, setIsDescribeModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyTargetDesign, setHistoryTargetDesign] = useState<CADDesign | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Auto-launch onboarding tour for first-time visitors
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('forgecraft_tour_completed');
    if (!hasCompletedTour) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // AI Prompt Bar State
  const [aiIdeaPrompt, setAiIdeaPrompt] = useState('');
  const [isGeneratingCad, setIsGeneratingCad] = useState(false);

  // Internal geometry reference from viewport
  const currentGeometryRef = React.useRef<THREE.BufferGeometry | null>(null);

  // Fetch initial library on mount
  useEffect(() => {
    fetch('/api/library')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.library && data.library.length > 0) {
          setLibrary(data.library);
          setActiveDesign(data.library[0]);
        }
      })
      .catch((err) => console.error('Error fetching library:', err));
  }, []);

  // Update cloud library item when active design changes
  const saveToLibrary = (updated: CADDesign) => {
    setActiveDesign(updated);
    setLibrary((prev) => {
      const idx = prev.findIndex((d) => d.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });

    // Sync with server
    fetch('/api/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch((e) => console.warn('Cloud sync error:', e));
  };

  // Helper to create timestamped version checkpoints
  const createSnapshot = (
    design: CADDesign,
    label: string,
    changeSummary: string
  ): DesignVersion => {
    const existing = design.versions || [];
    return {
      versionId: `ver-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      versionNumber: existing.length + 1,
      timestamp: new Date().toISOString(),
      label,
      changeSummary,
      dimensions: { ...design.dimensions },
      printSettings: { ...design.printSettings },
      laserSettings: { ...design.laserSettings },
      etsyDetails: { ...design.etsyDetails },
      thumbnailUrl: design.thumbnailUrl,
    };
  };

  const handleRevertToVersion = (version: DesignVersion) => {
    const target = historyTargetDesign || activeDesign;
    if (!target) return;

    // Create a rollback checkpoint of current state before reverting
    const backup = createSnapshot(
      target,
      `Pre-revert Snapshot (prior to v${version.versionNumber})`,
      `Auto-backup created before rolling back to ${version.label}`
    );

    const reverted: CADDesign = {
      ...target,
      dimensions: { ...version.dimensions },
      printSettings: { ...version.printSettings },
      laserSettings: { ...version.laserSettings },
      etsyDetails: { ...version.etsyDetails },
      updatedAt: new Date().toISOString(),
      versions: [backup, ...(target.versions || [])].slice(0, 30),
    };

    saveToLibrary(reverted);
    setHistoryTargetDesign(reverted);
  };

  const handleCreateSnapshot = (label: string) => {
    const target = historyTargetDesign || activeDesign;
    if (!target) return;

    const snap = createSnapshot(
      target,
      label,
      `Manual checkpoint saved at ${new Date().toLocaleTimeString()}`
    );

    const updated: CADDesign = {
      ...target,
      updatedAt: new Date().toISOString(),
      versions: [snap, ...(target.versions || [])].slice(0, 30),
    };

    saveToLibrary(updated);
    setHistoryTargetDesign(updated);
  };

  // Switch Model Template
  const handleSelectTemplate = (type: ModelType) => {
    if (!activeDesign) return;
    let newDims: ModelDimensions;
    let newName = activeDesign.name;
    let newCategory = activeDesign.category;

    if (type === 'planter') {
      newName = 'Modern Geometric Hexagon Succulent Planter';
      newCategory = 'Home Decor';
      newDims = { width: 85, depth: 85, height: 70, wallThickness: 2.8, drainageHole: 10, patternSegments: 6 };
    } else if (type === 'keychain') {
      newName = 'Personalized Name Plate Keychain';
      newCategory = 'Personalized Gifts';
      newDims = { width: 70, depth: 26, height: 4.5, wallThickness: 2.0, cornerRadius: 4.5, holeDiameter: 4.5, embossDepth: 1.5, text: 'ALEX' };
    } else if (type === 'cutter') {
      newName = 'Botanical Clay Earring Cutter';
      newCategory = 'Craft & Baking';
      newDims = { width: 45, depth: 45, height: 16, cuttingEdgeThickness: 0.7, stepWallThickness: 2.2, wallThickness: 2.0 };
    } else if (type === 'coaster') {
      newName = 'Intricate Radial Mandala Coaster';
      newCategory = 'Laser Engraved';
      newDims = { width: 95, depth: 95, height: 4.5, patternSegments: 12, wallThickness: 3.0 };
    } else if (type === 'organizer') {
      newName = 'Gridfinity Modular Desk Bin';
      newCategory = 'Desk Organization';
      newDims = { width: 84, depth: 84, height: 42, wallThickness: 2.4, cornerRadius: 6.0 };
    } else {
      newName = 'Custom Lofted Modern Sculptural Form';
      newCategory = 'Home Decor';
      newDims = { width: 70, depth: 70, height: 95, wallThickness: 2.6, patternSegments: 8 };
    }

    const updated: CADDesign = {
      ...activeDesign,
      name: newName,
      category: newCategory,
      modelType: type,
      dimensions: newDims,
      updatedAt: new Date().toISOString(),
    };
    saveToLibrary(updated);
  };

  // Dimensions change handler
  const handleDimensionsChange = (newDims: Partial<ModelDimensions>) => {
    if (!activeDesign) return;
    const updated: CADDesign = {
      ...activeDesign,
      dimensions: {
        ...activeDesign.dimensions,
        ...newDims,
      },
      updatedAt: new Date().toISOString(),
    };
    saveToLibrary(updated);
  };

  // Slicer settings change handler
  const handlePrintSettingsChange = (newSettings: Partial<PrintSettings>) => {
    if (!activeDesign) return;
    const updated: CADDesign = {
      ...activeDesign,
      printSettings: {
        ...activeDesign.printSettings,
        ...newSettings,
      },
      updatedAt: new Date().toISOString(),
    };
    saveToLibrary(updated);
  };

  // Laser settings change handler
  const handleLaserSettingsChange = (newSettings: Partial<LaserSettings>) => {
    if (!activeDesign) return;
    const updated: CADDesign = {
      ...activeDesign,
      laserSettings: {
        ...activeDesign.laserSettings,
        ...newSettings,
      },
      updatedAt: new Date().toISOString(),
    };
    saveToLibrary(updated);
  };

  // AI Idea to Parametric CAD generator
  const handleGenerateAiCad = async (promptOverride?: string) => {
    const prompt = promptOverride || aiIdeaPrompt.trim();
    if (!prompt) return;

    setIsGeneratingCad(true);
    try {
      const res = await fetch('/api/generate-cad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          baseType: activeDesign?.modelType || 'planter',
        }),
      });

      const data = await res.json();
      if (data.success && data.model) {
        const m = data.model;
        const newDesign: CADDesign = {
          id: `design-${Date.now()}`,
          name: m.name || 'AI Generated Etsy Product',
          category: m.category || 'Home Decor',
          description: m.description || prompt,
          tags: m.etsyEconomics?.seoKeywords || ['AI Generated', 'Etsy Trending', '3D Print'],
          modelType: (m.modelType as ModelType) || activeDesign?.modelType || 'planter',
          dimensions: m.dimensions || activeDesign?.dimensions || { width: 70, depth: 70, height: 60, wallThickness: 2.5 },
          printSettings: {
            layerHeight: m.printOptimization?.recommendedLayerHeight || 0.2,
            infillDensity: m.printOptimization?.recommendedInfill || 20,
            infillPattern: m.printOptimization?.infillPattern || 'gyroid',
            wallCount: m.printOptimization?.wallPerimeters || 3,
            topLayers: 4,
            bottomLayers: 4,
            material: m.printOptimization?.material || 'PLA',
            filamentCostPerKg: 20,
            printSpeed: 60,
            supportsNeeded: !!m.printOptimization?.supportsNeeded,
          },
          laserSettings: {
            enabled: !!m.laserOptimization?.laserApplicable,
            material: m.laserOptimization?.suggestedMaterial || '3mm Basswood Plywood',
            laserType: 'Diode 20W',
            cutSpeed: m.laserOptimization?.cutSpeed || 300,
            cutPower: m.laserOptimization?.cutPower || 100,
            scoreSpeed: m.laserOptimization?.scoreSpeed || 1200,
            scorePower: m.laserOptimization?.scorePower || 35,
            engraveSpeed: m.laserOptimization?.engraveSpeed || 3500,
            engravePower: m.laserOptimization?.engravePower || 50,
            kerfCompensation: m.laserOptimization?.kerf || 0.15,
          },
          etsyDetails: {
            suggestedPrice: m.etsyEconomics?.suggestedRetailPrice || 18.0,
            materialCost: m.etsyEconomics?.estimatedCogs || 1.5,
            printTimeHours: m.printOptimization?.estimatedPrintTimeHours || 2.0,
            profitMargin: m.etsyEconomics?.estimatedProfitMargin || 85,
            title: `${m.name} - 3D Printed & Laser Precision Product, Etsy Best Seller`,
            tags: m.etsyEconomics?.seoKeywords || ['3d printed', 'etsy gift', 'unique home decor'],
          },
          updatedAt: new Date().toISOString(),
          isFavorite: false,
        };

        saveToLibrary(newDesign);
        if (!promptOverride) setAiIdeaPrompt('');
      }
    } catch (err) {
      console.error('Failed to generate CAD model:', err);
    } finally {
      setIsGeneratingCad(false);
    }
  };

  // Export handlers
  const handleExportSTL = (binary: boolean) => {
    if (!activeDesign) return;
    const geom = currentGeometryRef.current || buildParametricGeometry(activeDesign.modelType, activeDesign.dimensions);
    const cleanName = activeDesign.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

    if (binary) {
      const bytes = generateBinarySTL(geom);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'model/stl' });
      downloadFile(blob, `${cleanName}.stl`);
    } else {
      const ascii = generateAsciiSTL(geom, activeDesign.name);
      const blob = new Blob([ascii], { type: 'text/plain' });
      downloadFile(blob, `${cleanName}_ascii.stl`);
    }
    setIsExportDropdownOpen(false);
  };

  const handleExportSVG = () => {
    if (!activeDesign) return;
    const svg = generateLaserSVG(activeDesign);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    downloadFile(blob, `${activeDesign.name.toLowerCase().replace(/\s+/g, '_')}_laser_cut.svg`);
    setIsExportDropdownOpen(false);
  };

  const handleExportDXF = () => {
    if (!activeDesign) return;
    const dxf = generateDXFVector(activeDesign);
    const blob = new Blob([dxf], { type: 'application/dxf;charset=utf-8' });
    downloadFile(blob, `${activeDesign.name.toLowerCase().replace(/\s+/g, '_')}_laser_cut.dxf`);
    setIsExportDropdownOpen(false);
  };

  const handleExportBundle = () => {
    handleExportSTL(true);
    setTimeout(() => handleExportSVG(), 300);
    setIsExportDropdownOpen(false);
  };

  if (!activeDesign) {
    return (
      <div className="min-h-screen bg-[#0d1017] flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3 text-sm">
          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
          <span>Initializing ForgeCraft CAD Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d13] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Compass className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ForgeCraft Studio
              </span>
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60 hidden sm:inline-block">
                Etsy 3D & Laser
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Parametric .STL Generator • Slicer Optimization • Laser Vectors
            </p>
          </div>
        </div>

        {/* Center: AI Idea Input Bar */}
        <div className="flex-1 max-w-xl mx-2 hidden md:block">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerateAiCad();
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={aiIdeaPrompt}
              onChange={(e) => setAiIdeaPrompt(e.target.value)}
              placeholder="Describe an Etsy product idea (e.g. 'Faceted twist succulent pot with saucer')..."
              className="w-full bg-slate-950/90 border border-slate-700/80 rounded-xl pl-3.5 pr-28 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={!aiIdeaPrompt.trim() || isGeneratingCad}
              className="absolute right-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-40"
            >
              {isGeneratingCad ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingCad ? 'Creating CAD...' : 'AI CAD'}</span>
            </button>
          </form>
        </div>

        {/* Right Navigation & Action Triggers */}
        <div className="flex items-center gap-2">
          {/* Describe & Create Button */}
          <button
            onClick={() => setIsDescribeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition hover:scale-105"
            title="Describe any design via voice or text and create it instantly"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Describe & Create</span>
          </button>

          {/* Trend Radar Button */}
          <button
            onClick={() => setIsTrendRadarOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition shadow-sm"
            title="Scan live Google search trends on Etsy"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">Trend Radar</span>
          </button>

          {/* Cloud Library Button */}
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            title="Open Cloud Library"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline">Library</span>
          </button>

          {/* Version History Button */}
          <button
            onClick={() => {
              setHistoryTargetDesign(activeDesign);
              setIsHistoryModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition shadow-sm"
            title="View design version history & restore previous states"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">History</span>
            <span className="text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded-full font-mono text-indigo-300 border border-indigo-800/80">
              v{(activeDesign.versions?.length || 0) + 1}
            </span>
          </button>

          {/* Direct Print API Service Button */}
          <button
            onClick={() => setIsPrintApiOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
            title="Direct 3D Print Dropship API"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Print API</span>
          </button>

          {/* Etsy Listing Studio Button */}
          <button
            onClick={() => setIsEtsyListingOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-orange-300 border border-orange-500/30 rounded-xl text-xs font-semibold transition"
            title="Etsy SEO Listing & Mockup Studio"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
            <span className="hidden lg:inline">Etsy Listing</span>
          </button>

          {/* Onboarding Tour Button */}
          <button
            id="tour-nav-button"
            onClick={() => setIsTourOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition shadow-sm"
            title="Interactive Onboarding Tour (Dimensions, Slicer, Laser)"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Tour</span>
          </button>

          {/* Export Dropdown */}
          <div id="tour-export-button" className="relative">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                <button
                  onClick={() => handleExportSTL(true)}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between transition"
                >
                  <span className="font-semibold text-white">Download .STL (Binary)</span>
                  <span className="text-[10px] text-blue-400 font-mono">Bambu/Prusa</span>
                </button>

                <button
                  onClick={() => handleExportSTL(false)}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-between transition"
                >
                  <span>Download .STL (ASCII)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Text CAD</span>
                </button>

                <div className="w-full h-px bg-slate-800 my-1" />

                <button
                  onClick={handleExportSVG}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800 text-rose-300 flex items-center justify-between transition"
                >
                  <span className="font-semibold">Download .SVG Vector</span>
                  <span className="text-[10px] text-rose-400 font-mono">Laser Cut</span>
                </button>

                <button
                  onClick={handleExportDXF}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-800 text-slate-300 flex items-center justify-between transition"
                >
                  <span>Download .DXF Vector</span>
                  <span className="text-[10px] text-slate-400 font-mono">AutoCAD/CNC</span>
                </button>

                <div className="w-full h-px bg-slate-800 my-1" />

                <button
                  onClick={handleExportBundle}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 font-semibold flex items-center gap-2 transition"
                >
                  <FileArchive className="w-3.5 h-3.5" />
                  <span>Export Single (.STL+.SVG)</span>
                </button>

                <button
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    setIsLibraryOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 font-semibold flex items-center justify-between transition"
                  title="Select multiple designs in Cloud Library to create a combined ZIP archive"
                >
                  <div className="flex items-center gap-1.5">
                    <FileArchive className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Bulk Export ZIP</span>
                  </div>
                  <span className="text-[10px] bg-indigo-900/80 px-1.5 py-0.5 rounded font-mono text-indigo-200">
                    {library.length} models
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Template Switcher Pills */}
      <div className="bg-slate-950/60 border-b border-slate-800/80 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
          Etsy Niche:
        </span>
        {[
          { type: 'planter' as ModelType, label: '🪴 Geometric Planter' },
          { type: 'keychain' as ModelType, label: '🏷️ Name Keychain' },
          { type: 'cutter' as ModelType, label: '🌸 Clay/Cookie Cutter' },
          { type: 'coaster' as ModelType, label: '☕ Laser Mandala Coaster' },
          { type: 'organizer' as ModelType, label: '📦 Gridfinity Bin' },
          { type: 'custom' as ModelType, label: '🏺 Sculptural Vase' },
        ].map((t) => (
          <button
            key={t.type}
            onClick={() => handleSelectTemplate(t.type)}
            className={`px-3 py-1 rounded-xl whitespace-nowrap font-medium transition ${
              activeDesign.modelType === t.type
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Workspace Grid */}
      <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1700px] w-full mx-auto">
        {/* Left Column: 3D Viewport Canvas */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Quick Describe & Create Action Banner */}
          <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-amber-950/20 border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span>Describe a Design & Create It in 3D</span>
                  <span className="text-[10px] text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">
                    Voice & Text CAD
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Speak or type any product idea to generate parametric .STL and laser files for your Etsy shop.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDescribeModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Describe & Create</span>
            </button>
          </div>

          <div id="tour-viewport" className="flex-1 min-h-[480px] lg:min-h-[580px] w-full">
            <Viewport3D
              design={activeDesign}
              activeTab={activeTab}
              onGeometryReady={(geom) => {
                currentGeometryRef.current = geom;
              }}
              onSnapshot={(dataUrl) => {
                // Save snapshot as thumbnail
                saveToLibrary({
                  ...activeDesign,
                  thumbnailUrl: dataUrl,
                  etsyDetails: {
                    ...activeDesign.etsyDetails,
                    mockupUrl: dataUrl,
                  },
                });
              }}
            />
          </div>

          {/* Quick Stats Banner under viewport */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-blue-400" />
              <div>
                <span className="text-[10px] text-slate-400 block">Outer Bounds</span>
                <span className="font-mono text-slate-200">
                  {activeDesign.dimensions.width}×{activeDesign.dimensions.depth || activeDesign.dimensions.width}×{activeDesign.dimensions.height}mm
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-[10px] text-slate-400 block">Print Material</span>
                <span className="font-mono text-slate-200">
                  {activeDesign.printSettings.material} ({activeDesign.printSettings.layerHeight}mm)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <div>
                <span className="text-[10px] text-slate-400 block">Laser Kerf</span>
                <span className="font-mono text-slate-200">
                  {activeDesign.laserSettings.kerfCompensation}mm offset
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-400 block">Target Etsy Retail</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ${activeDesign.etsyDetails?.suggestedPrice || 18.5} ({activeDesign.etsyDetails?.profitMargin || 85}% margin)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Parametric Controls & Manufacturing Tools */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          {/* Workbench Tabs */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-2xl">
            <button
              id="tour-tab-dimensions"
              onClick={() => setActiveTab('dimensions')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition ${
                activeTab === 'dimensions'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Dimensions</span>
            </button>

            <button
              id="tour-tab-slicer"
              onClick={() => setActiveTab('slicer')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition ${
                activeTab === 'slicer'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>3D Slicer</span>
            </button>

            <button
              id="tour-tab-laser"
              onClick={() => setActiveTab('laser')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition ${
                activeTab === 'laser'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Laser & Vector</span>
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="flex-1">
            {activeTab === 'dimensions' && (
              <DimensionEditor
                design={activeDesign}
                onChangeDimensions={handleDimensionsChange}
              />
            )}

            {activeTab === 'slicer' && (
              <PrintOptimizer
                design={activeDesign}
                onChangePrintSettings={handlePrintSettingsChange}
                onChangeDimensions={handleDimensionsChange}
              />
            )}

            {activeTab === 'laser' && (
              <LaserStudio
                design={activeDesign}
                onChangeLaserSettings={handleLaserSettingsChange}
              />
            )}
          </div>
        </section>
      </main>

      {/* Floating AI Copilot Chat Toggle Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-2xl border border-blue-400/30 transition hover:scale-105"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-xs font-bold">Ask ForgeCopilot</span>
        </button>
      )}

      {/* Multi-turn AI Copilot Chat Window */}
      <ForgeCopilotChat
        currentDesign={activeDesign}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onUpdateModel={(newModel) => saveToLibrary(newModel)}
      />

      {/* Describe a Design & Create It Voice/Text Modal */}
      {isDescribeModalOpen && (
        <DescribeAndCreateModal
          currentDesign={activeDesign}
          onDesignCreated={(newDesign) => {
            saveToLibrary(newDesign);
            setIsDescribeModalOpen(false);
          }}
          onClose={() => setIsDescribeModalOpen(false)}
        />
      )}

      {/* Cloud Library Modal */}
      {isLibraryOpen && (
        <CloudLibrary
          library={library}
          activeDesignId={activeDesign.id}
          onSelectDesign={(d) => setActiveDesign(d)}
          onDuplicateDesign={(d) => {
            const copy: CADDesign = {
              ...d,
              id: `design-${Date.now()}`,
              name: `${d.name} (Copy)`,
              updatedAt: new Date().toISOString(),
            };
            saveToLibrary(copy);
          }}
          onDeleteDesign={(id) => {
            setLibrary((prev) => prev.filter((d) => d.id !== id));
            fetch(`/api/library/${id}`, { method: 'DELETE' }).catch(console.warn);
            if (activeDesign.id === id && library.length > 1) {
              const remaining = library.filter((d) => d.id !== id);
              setActiveDesign(remaining[0]);
            }
          }}
          onOpenVersionHistory={(d) => {
            setHistoryTargetDesign(d);
            setIsHistoryModalOpen(true);
          }}
          onClose={() => setIsLibraryOpen(false)}
        />
      )}

      {/* Version History Modal */}
      {isHistoryModalOpen && (historyTargetDesign || activeDesign) && (
        <VersionHistoryModal
          design={historyTargetDesign || activeDesign}
          onRevertToVersion={handleRevertToVersion}
          onCreateSnapshot={handleCreateSnapshot}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setHistoryTargetDesign(null);
          }}
        />
      )}

      {/* Trend Radar Modal */}
      {isTrendRadarOpen && (
        <TrendRadarModal
          onApplyTrendCad={(prompt, category) => {
            handleGenerateAiCad(prompt);
          }}
          onClose={() => setIsTrendRadarOpen(false)}
        />
      )}

      {/* Direct Print Dropship API Modal */}
      {isPrintApiOpen && (
        <PrintServiceApiModal
          design={activeDesign}
          onClose={() => setIsPrintApiOpen(false)}
        />
      )}

      {/* Etsy Listing & Mockup Modal */}
      {isEtsyListingOpen && (
        <EtsyListingModal
          design={activeDesign}
          onUpdateDesignListing={(title, tags, price) => {
            const updated: CADDesign = {
              ...activeDesign,
              etsyDetails: {
                ...activeDesign.etsyDetails,
                title,
                tags,
                suggestedPrice: price,
              },
            };
            saveToLibrary(updated);
          }}
          onClose={() => setIsEtsyListingOpen(false)}
        />
      )}

      {/* Onboarding Tour Step-by-Step Tooltip Overlay */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onTabChange={(tab) => setActiveTab(tab)}
      />
    </div>
  );
}
