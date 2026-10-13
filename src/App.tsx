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
  Camera,
  Link2,
  Copy,
  Check,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import * as THREE from 'three';

import { CADDesign, ModelType, ModelDimensions, PrintSettings, LaserSettings, DesignVersion, BambuLabSettings } from './types/cad';
import { Viewport3D } from './components/Viewport3D';
import { DimensionEditor } from './components/DimensionEditor';
import { PrintOptimizer } from './components/PrintOptimizer';
import { BambuLabPanel } from './components/BambuLabPanel';
import { LaserStudio } from './components/LaserStudio';
import { PrintServiceApiModal } from './components/PrintServiceApiModal';
import { CloudLibrary } from './components/CloudLibrary';
import { TrendRadarModal } from './components/TrendRadarModal';
import { EtsyListingModal } from './components/EtsyListingModal';
import { ForgeCopilotChat } from './components/ForgeCopilotChat';
import { DescribeAndCreateModal } from './components/DescribeAndCreateModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { OnboardingTour } from './components/OnboardingTour';
import { AIMockupGeneratorModal } from './components/AIMockupGeneratorModal';
import { DesignCommentsModal } from './components/DesignCommentsModal';

import {
  generateBinarySTL,
  generateAsciiSTL,
  generateLaserSVG,
  generateDXFVector,
  downloadFile,
} from './utils/stlExporter';
import { downloadBambu3MF } from './utils/bambuLabExporter';
import { buildParametricGeometry } from './utils/geometryGenerators';

export default function App() {
  // Cloud library state
  const [library, setLibrary] = useState<CADDesign[]>([]);
  const [activeDesign, setActiveDesign] = useState<CADDesign | null>(null);
  const [activeTab, setActiveTab] = useState<'dimensions' | 'slicer' | 'bambu' | 'laser'>('dimensions');

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
  const [isMockupModalOpen, setIsMockupModalOpen] = useState(false);
  const [currentSnapshot, setCurrentSnapshot] = useState<string | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [commentsTargetDesign, setCommentsTargetDesign] = useState<CADDesign | null>(null);

  // Quick Share & Export States for Remote Teams & 3D Printers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [printerTarget, setPrinterTarget] = useState<'sdcard' | 'octoprint' | 'klipper' | 'laser'>('sdcard');
  const [shareToast, setShareToast] = useState<{ message: string; type: 'link' | 'path' | 'download' } | null>(null);

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

  // Fetch initial library on mount & support remote link sharing via query params
  useEffect(() => {
    fetch('/api/library')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.library && data.library.length > 0) {
          setLibrary(data.library);

          const params = new URLSearchParams(window.location.search);
          const targetDesignId = params.get('design');
          const exportFormat = params.get('export');

          if (targetDesignId) {
            const found = data.library.find((d: CADDesign) => d.id === targetDesignId);
            if (found) {
              setActiveDesign(found);
            } else {
              setActiveDesign(data.library[0]);
            }
          } else {
            setActiveDesign(data.library[0]);
          }

          if (exportFormat) {
            window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
            setTimeout(() => {
              triggerSharedExport(exportFormat);
            }, 800);
          }
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

  // Bambu Lab settings change handler
  const handleBambuSettingsChange = (newSettings: BambuLabSettings) => {
    if (!activeDesign) return;
    const updated: CADDesign = {
      ...activeDesign,
      bambuSettings: newSettings,
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

  const handleExportBambu3MF = async () => {
    if (!activeDesign) return;
    const geom = currentGeometryRef.current || buildParametricGeometry(activeDesign.modelType, activeDesign.dimensions);
    await downloadBambu3MF(activeDesign, geom);
    setIsExportDropdownOpen(false);
  };

  // Helper to copy text with modern API and reliable fallback
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn('Clipboard writeText failed, using fallback', err);
    }
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.focus();
      el.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(el);
      return successful;
    } catch (err) {
      console.error('Copy fallback failed:', err);
      return false;
    }
  };

  // Get clean export filename for a format
  const getExportFilename = (format: string): string => {
    if (!activeDesign) return 'forgecraft_model';
    const clean = activeDesign.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    switch (format) {
      case 'bambu3mf':
        return `${clean}_bambu_project.3mf`;
      case 'stl_binary':
        return `${clean}.stl`;
      case 'stl_ascii':
        return `${clean}_ascii.stl`;
      case 'svg_vector':
        return `${clean}_laser_cut.svg`;
      case 'dxf_vector':
        return `${clean}_laser_cut.dxf`;
      case 'bundle':
        return `${clean}_bundle.zip`;
      case 'bulk_zip':
        return `forgecraft_bulk_designs.zip`;
      default:
        return `${clean}.stl`;
    }
  };

  // Generates shareable web download deep link for remote team members
  const getDownloadLink = (format: string): string => {
    const origin = window.location.origin || '';
    const path = window.location.pathname || '';
    if (format === 'bulk_zip') {
      return `${origin}${path}?export=bulk_zip`;
    }
    const designId = activeDesign?.id || 'active-design';
    return `${origin}${path}?design=${encodeURIComponent(designId)}&export=${encodeURIComponent(format)}`;
  };

  // Generates printer-calibrated filesystem / queue path
  const getFilePath = (format: string, target = printerTarget): string => {
    const filename = getExportFilename(format);
    switch (target) {
      case 'octoprint':
        return `/home/pi/.octoprint/uploads/${filename}`;
      case 'klipper':
        return `/home/pi/printer_data/gcodes/${filename}`;
      case 'laser':
        return `/laser/jobs/${filename}`;
      case 'sdcard':
      default:
        return `/sdcard/models/${filename}`;
    }
  };

  // 1-Click Copy Download Link
  const handleCopyDownloadLink = async (format: string, formatLabel: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = getDownloadLink(format);
    const ok = await copyTextToClipboard(link);
    if (ok) {
      const key = `${format}-link`;
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2500);
      setShareToast({
        message: `Copied download link for ${formatLabel}! Share with remote teams for 1-click model download.`,
        type: 'link',
      });
      setTimeout(() => setShareToast(null), 3500);
    }
  };

  // 1-Click Copy File Path
  const handleCopyFilePath = async (format: string, formatLabel: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const path = getFilePath(format);
    const ok = await copyTextToClipboard(path);
    if (ok) {
      const key = `${format}-path`;
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2500);
      setShareToast({
        message: `Copied printer file path (${path})! Ready for OctoPrint, Klipper, or SD card.`,
        type: 'path',
      });
      setTimeout(() => setShareToast(null), 3500);
    }
  };

  // Automatically triggers export from URL parameters
  const triggerSharedExport = (format: string) => {
    switch (format) {
      case 'bambu3mf':
      case '3mf':
        handleExportBambu3MF();
        setShareToast({ message: '🚀 Automatically downloaded Bambu .3MF project from shared link!', type: 'download' });
        break;
      case 'stl_binary':
      case 'stl':
        handleExportSTL(true);
        setShareToast({ message: '🚀 Automatically downloaded .STL (Binary) from shared link!', type: 'download' });
        break;
      case 'stl_ascii':
        handleExportSTL(false);
        setShareToast({ message: '🚀 Automatically downloaded .STL (ASCII) from shared link!', type: 'download' });
        break;
      case 'svg':
      case 'svg_vector':
        handleExportSVG();
        setShareToast({ message: '🚀 Automatically downloaded .SVG Laser vector from shared link!', type: 'download' });
        break;
      case 'dxf':
      case 'dxf_vector':
        handleExportDXF();
        setShareToast({ message: '🚀 Automatically downloaded .DXF CAD vector from shared link!', type: 'download' });
        break;
      case 'bundle':
        handleExportBundle();
        setShareToast({ message: '🚀 Automatically downloaded model bundle from shared link!', type: 'download' });
        break;
      case 'bulk_zip':
        setIsLibraryOpen(true);
        setShareToast({ message: '🚀 Opened Cloud Library for bulk export from shared link!', type: 'download' });
        break;
      default:
        handleExportSTL(true);
        break;
    }
    setTimeout(() => setShareToast(null), 4000);
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

          {/* AI Lifestyle Mockup Generator Button */}
          <button
            onClick={() => setIsMockupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition shadow-sm"
            title="AI Lifestyle Mockup Studio for Etsy Listings"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">AI Mockups</span>
          </button>

          {/* Team Collaboration Notes Button */}
          <button
            onClick={() => {
              if (activeDesign) {
                setCommentsTargetDesign(activeDesign);
                setIsCommentsModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition shadow-sm"
            title="Team Collaboration & Iteration Notes"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Notes</span>
            {(activeDesign?.comments?.length || 0) > 0 && (
              <span className="bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded-full font-black text-[10px]">
                {activeDesign?.comments?.length}
              </span>
            )}
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

          {/* Export & Remote Share Dropdown */}
          <div id="tour-export-button" className="relative">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform duration-200 ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportDropdownOpen && (
              <>
                {/* Backdrop to dismiss on outside click */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExportDropdownOpen(false)}
                />

                <div className="absolute right-0 mt-2 w-[360px] sm:w-[410px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 z-50 space-y-2.5 max-h-[85vh] overflow-y-auto">
                  {/* Dropdown Header & Remote Share Context */}
                  <div className="flex items-start justify-between pb-2 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-blue-400" />
                        <h4 className="text-xs font-bold text-white tracking-wide">Export & Remote Share Hub</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Download locally or copy links & paths for remote teams & 3D printers
                      </p>
                    </div>
                    <button
                      onClick={() => setIsExportDropdownOpen(false)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="Close Export Menu"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Printer Path Target Preset Selector */}
                  <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-300">Target Printer Path Preset:</span>
                      <span className="font-mono text-amber-400/90 text-[9px] truncate max-w-[190px]">
                        {printerTarget === 'sdcard' && '/sdcard/models/...'}
                        {printerTarget === 'octoprint' && '~/.octoprint/uploads/...'}
                        {printerTarget === 'klipper' && '~/printer_data/gcodes/...'}
                        {printerTarget === 'laser' && '/laser/jobs/...'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                      {[
                        { id: 'sdcard', label: 'SD Card' },
                        { id: 'octoprint', label: 'OctoPrint' },
                        { id: 'klipper', label: 'Klipper' },
                        { id: 'laser', label: 'Laser/CNC' },
                      ].map((tgt) => (
                        <button
                          key={tgt.id}
                          onClick={() => setPrinterTarget(tgt.id as any)}
                          className={`px-1.5 py-1 rounded-lg font-medium transition text-center truncate ${
                            printerTarget === tgt.id
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          {tgt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Export Options List with 1-Click Download, Copy Link, and Copy Path Buttons */}
                  <div className="space-y-1.5">
                    {[
                      {
                        key: 'bambu3mf',
                        name: 'Bambu Studio (.3MF)',
                        desc: 'Official X1/P1/A1 project file with AMS 4-color profile',
                        badge: 'X1/P1/A1',
                        badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800/80',
                        icon: Printer,
                        iconColor: 'text-emerald-400 bg-emerald-500/10',
                        onDownload: handleExportBambu3MF,
                      },
                      {
                        key: 'stl_binary',
                        name: 'Download .STL (Binary)',
                        desc: 'Standard CAD mesh for Bambu, Prusa, Cura, Orca',
                        badge: 'Standard CAD',
                        badgeColor: 'bg-blue-950 text-blue-300 border-blue-800/80',
                        icon: Box,
                        iconColor: 'text-blue-400 bg-blue-500/10',
                        onDownload: () => handleExportSTL(true),
                      },
                      {
                        key: 'stl_ascii',
                        name: 'Download .STL (ASCII)',
                        desc: 'Human-readable text CAD with facet normal list',
                        badge: 'Text CAD',
                        badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
                        icon: FileCode,
                        iconColor: 'text-slate-400 bg-slate-700/30',
                        onDownload: () => handleExportSTL(false),
                      },
                      {
                        key: 'svg_vector',
                        name: 'Download .SVG Vector',
                        desc: 'Laser Cut & Engrave vector (Cut, Score, Engrave)',
                        badge: 'Laser Cut',
                        badgeColor: 'bg-rose-950 text-rose-300 border-rose-800/80',
                        icon: Flame,
                        iconColor: 'text-rose-400 bg-rose-500/10',
                        onDownload: handleExportSVG,
                      },
                      {
                        key: 'dxf_vector',
                        name: 'Download .DXF Vector',
                        desc: 'AutoCAD & CNC router 2D path geometry',
                        badge: 'AutoCAD/CNC',
                        badgeColor: 'bg-amber-950 text-amber-300 border-amber-800/80',
                        icon: Layers,
                        iconColor: 'text-amber-400 bg-amber-500/10',
                        onDownload: handleExportDXF,
                      },
                      {
                        key: 'bundle',
                        name: 'Export Single (.STL + .SVG)',
                        desc: 'Combined 3D print mesh + laser vector package',
                        badge: 'Bundle',
                        badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800/80',
                        icon: FileArchive,
                        iconColor: 'text-indigo-400 bg-indigo-500/10',
                        onDownload: handleExportBundle,
                      },
                      {
                        key: 'bulk_zip',
                        name: 'Bulk Export ZIP',
                        desc: `Multi-design bundle from Cloud Library (${library.length} models)`,
                        badge: `${library.length} models`,
                        badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800/80',
                        icon: FileArchive,
                        iconColor: 'text-cyan-400 bg-cyan-500/10',
                        onDownload: () => {
                          setIsExportDropdownOpen(false);
                          setIsLibraryOpen(true);
                        },
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isLinkCopied = copiedKey === `${item.key}-link`;
                      const isPathCopied = copiedKey === `${item.key}-path`;

                      return (
                        <div
                          key={item.key}
                          className="p-2 bg-slate-800/40 hover:bg-slate-800/70 rounded-xl border border-slate-700/50 hover:border-slate-600 transition space-y-2 group"
                        >
                          {/* Top Row: Info & Badge */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`p-1.5 rounded-lg ${item.iconColor} shrink-0`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="truncate">
                                <span className="font-semibold text-xs text-white block truncate">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {item.desc}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          </div>

                          {/* Action Buttons Row: Download | Copy Link | Copy Path */}
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-700/40">
                            <button
                              onClick={item.onDownload}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-[11px] font-bold shadow-sm transition active:scale-[0.98]"
                              title={`Download ${item.name} directly to browser`}
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </button>

                            <button
                              onClick={(e) => handleCopyDownloadLink(item.key, item.name, e)}
                              className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition ${
                                isLinkCopied
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/80 shadow-sm'
                                  : 'bg-slate-900 hover:bg-slate-750 text-cyan-300 hover:text-cyan-200 border-cyan-500/30 hover:border-cyan-500/60'
                              }`}
                              title="Copy download link for remote teams or external slicers"
                            >
                              {isLinkCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="font-semibold text-emerald-300">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-3 h-3 text-cyan-400" />
                                  <span>Copy Link</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={(e) => handleCopyFilePath(item.key, item.name, e)}
                              className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition ${
                                isPathCopied
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/80 shadow-sm'
                                  : 'bg-slate-900 hover:bg-slate-750 text-amber-300 hover:text-amber-200 border-amber-500/30 hover:border-amber-500/60'
                              }`}
                              title={`Copy printer queue path (${getFilePath(item.key)})`}
                            >
                              {isPathCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="font-semibold text-emerald-300">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-amber-400" />
                                  <span>Copy Path</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
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
                setCurrentSnapshot(dataUrl);
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
          <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-2xl gap-1">
            <button
              id="tour-tab-dimensions"
              onClick={() => setActiveTab('dimensions')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition ${
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition ${
                activeTab === 'slicer'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>3D Slicer</span>
            </button>

            <button
              id="tour-tab-bambu"
              onClick={() => setActiveTab('bambu')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition ${
                activeTab === 'bambu'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Bambu Lab</span>
            </button>

            <button
              id="tour-tab-laser"
              onClick={() => setActiveTab('laser')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition ${
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
                onChangeBambuSettings={handleBambuSettingsChange}
              />
            )}

            {activeTab === 'bambu' && (
              <BambuLabPanel
                design={activeDesign}
                onUpdateBambuSettings={handleBambuSettingsChange}
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
          onOpenComments={(d) => {
            setCommentsTargetDesign(d);
            setIsCommentsModalOpen(true);
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
          onOpenMockupStudio={() => setIsMockupModalOpen(true)}
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

      {/* AI Lifestyle Mockup Generator Modal */}
      {isMockupModalOpen && activeDesign && (
        <AIMockupGeneratorModal
          design={activeDesign}
          currentViewportSnapshot={currentSnapshot || activeDesign.thumbnailUrl}
          onSaveMockupToDesign={(mockupUrl) => {
            const updated: CADDesign = {
              ...activeDesign,
              thumbnailUrl: mockupUrl,
              etsyDetails: {
                ...activeDesign.etsyDetails,
                mockupUrl,
              },
              updatedAt: new Date().toISOString(),
            };
            saveToLibrary(updated);
          }}
          onOpenEtsyListing={() => setIsEtsyListingOpen(true)}
          onClose={() => setIsMockupModalOpen(false)}
        />
      )}

      {/* Team Collaboration & Iteration Notes Modal */}
      {isCommentsModalOpen && (commentsTargetDesign || activeDesign) && (
        <DesignCommentsModal
          design={commentsTargetDesign || activeDesign!}
          onUpdateComments={(updatedDesign) => {
            saveToLibrary(updatedDesign);
            setCommentsTargetDesign(updatedDesign);
          }}
          onClose={() => {
            setIsCommentsModalOpen(false);
            setCommentsTargetDesign(null);
          }}
        />
      )}

      {/* Onboarding Tour Step-by-Step Tooltip Overlay */}
      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Quick Share / Export Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900/95 border border-cyan-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0 border border-cyan-500/20">
            {shareToast.type === 'link' ? (
              <Link2 className="w-4 h-4 text-cyan-400" />
            ) : shareToast.type === 'path' ? (
              <Copy className="w-4 h-4 text-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="flex-1 text-xs">
            <p className="font-semibold text-slate-100">{shareToast.message}</p>
          </div>
          <button
            onClick={() => setShareToast(null)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
