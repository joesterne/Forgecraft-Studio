import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  Tag,
  Clock,
  Box,
  Flame,
  Cloud,
  CheckCircle2,
  FileCode,
  FileArchive,
  History,
  CheckSquare,
  Square,
  Package,
  Loader2,
  X,
  FileCheck,
} from 'lucide-react';
import { CADDesign } from '../types/cad';
import {
  generateBinarySTL,
  generateAsciiSTL,
  generateLaserSVG,
  generateDXFVector,
  downloadFile,
  createBulkZipArchive,
} from '../utils/stlExporter';
import { buildParametricGeometry } from '../utils/geometryGenerators';

interface CloudLibraryProps {
  library: CADDesign[];
  activeDesignId: string;
  onSelectDesign: (design: CADDesign) => void;
  onDuplicateDesign: (design: CADDesign) => void;
  onDeleteDesign: (id: string) => void;
  onOpenVersionHistory?: (design: CADDesign) => void;
  onClose: () => void;
}

export const CloudLibrary: React.FC<CloudLibraryProps> = ({
  library,
  activeDesignId,
  onSelectDesign,
  onDuplicateDesign,
  onDeleteDesign,
  onOpenVersionHistory,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ percent: number; step: string } | null>(null);

  // Extract all unique tags
  const allTags = ['All', ...Array.from(new Set(library.flatMap((d) => d.tags || [])))];

  const filteredDesigns = library.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'All' || item.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredDesigns.map((d) => d.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleExportSTL = (design: CADDesign, binary: boolean) => {
    const geom = buildParametricGeometry(design.modelType, design.dimensions);
    const cleanName = design.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (binary) {
      const bytes = generateBinarySTL(geom);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'model/stl' });
      downloadFile(blob, `${cleanName}_binary.stl`);
    } else {
      const ascii = generateAsciiSTL(geom, design.name);
      const blob = new Blob([ascii], { type: 'text/plain' });
      downloadFile(blob, `${cleanName}_ascii.stl`);
    }
  };

  const handleExportLaserSVG = (design: CADDesign) => {
    const svg = generateLaserSVG(design);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    downloadFile(blob, `${design.name.toLowerCase().replace(/\s+/g, '_')}_vector.svg`);
  };

  const handleExportManufacturingBundle = (design: CADDesign) => {
    handleExportSTL(design, true);
    setTimeout(() => {
      handleExportLaserSVG(design);
    }, 400);
  };

  const handleBulkZipDownload = async () => {
    // If no designs selected, export all currently visible/filtered designs
    const targetDesigns = selectedIds.size > 0
      ? library.filter((d) => selectedIds.has(d.id))
      : filteredDesigns;

    if (targetDesigns.length === 0) return;

    try {
      setIsExportingZip(true);
      setZipProgress({ percent: 5, step: `Preparing ${targetDesigns.length} designs...` });

      const zipBlob = await createBulkZipArchive(targetDesigns, (percent, step) => {
        setZipProgress({ percent, step });
      });

      const timestamp = new Date().toISOString().slice(0, 10);
      downloadFile(zipBlob, `forgecraft_bulk_designs_${timestamp}.zip`);

      setZipProgress({ percent: 100, step: 'ZIP Download Complete!' });
      setTimeout(() => {
        setIsExportingZip(false);
        setZipProgress(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to generate bulk ZIP bundle:', err);
      setIsExportingZip(false);
      setZipProgress(null);
    }
  };

  const allFilteredSelected =
    filteredDesigns.length > 0 && filteredDesigns.every((d) => selectedIds.has(d.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Cloud Design Library</h2>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                  <CheckCircle2 className="w-3 h-3" /> Auto-Synced
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {library.length} Models
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Select designs for bulk ZIP download containing both 3D .STL and Laser .SVG vectors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition border border-slate-700"
            >
              Close Studio
            </button>
          </div>
        </div>

        {/* Search, Tag Filter, and Bulk Selection Action Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search designs by title, tags, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Select All Checkbox / Toggle */}
            <button
              onClick={allFilteredSelected ? clearSelection : selectAll}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                allFilteredSelected
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/60'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={allFilteredSelected ? 'Deselect all visible designs' : 'Select all visible designs'}
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{allFilteredSelected ? 'All Selected' : 'Select All'}</span>
            </button>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap font-medium transition ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Select Floating Action Banner (When >= 1 selected, or Bulk Export Trigger) */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/70 border-b border-indigo-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">
                {selectedIds.size > 0 ? (
                  <>
                    <span className="text-indigo-400 font-mono">{selectedIds.size}</span> of{' '}
                    <span className="font-mono">{library.length}</span> designs selected for export
                  </>
                ) : (
                  <>Select designs below or bulk download all visible models</>
                )}
              </span>
            </div>

            {selectedIds.size > 0 && (
              <button
                onClick={clearSelection}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2 ml-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Bulk Download ZIP Action Button */}
          <button
            onClick={handleBulkZipDownload}
            disabled={isExportingZip}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold shadow-md transition ${
              isExportingZip
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white border border-indigo-400/40 hover:scale-102'
            }`}
            title="Download ZIP archive containing .STL and .SVG files for selected designs"
          >
            {isExportingZip ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            ) : (
              <FileArchive className="w-4 h-4 text-indigo-200" />
            )}
            <span>
              {isExportingZip
                ? 'Creating ZIP...'
                : selectedIds.size > 0
                ? `Download Bulk ZIP (${selectedIds.size} Models)`
                : `Download All as ZIP (${filteredDesigns.length} Models)`}
            </span>
          </button>
        </div>

        {/* Progress Toast / Overlay when ZIP is generating */}
        {isExportingZip && zipProgress && (
          <div className="p-3 bg-indigo-950/90 border-b border-indigo-500/50 flex flex-col gap-1.5 px-6 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-indigo-200 font-mono">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>{zipProgress.step}</span>
              </span>
              <span className="font-bold">{zipProgress.percent}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
                style={{ width: `${zipProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Design Grid List */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDesigns.map((design) => {
            const isActive = design.id === activeDesignId;
            const isSelected = selectedIds.has(design.id);

            return (
              <div
                key={design.id}
                onClick={() => toggleSelect(design.id)}
                className={`group relative rounded-2xl border p-4 transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/30 border-indigo-500/80 shadow-lg ring-1 ring-indigo-500/50'
                    : isActive
                    ? 'bg-slate-800/60 border-blue-500/80 shadow-md shadow-blue-500/5'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  {/* Category, Checkbox, and Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => toggleSelect(design.id, e)}
                        className={`p-1 rounded-lg border transition ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                        }`}
                        title={isSelected ? 'Deselect this design' : 'Select for bulk ZIP export'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-900/60">
                        {design.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                        v{(design.versions?.length || 0) + 1}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(design.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-300 transition line-clamp-1">
                    {design.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {design.description}
                  </p>

                  {/* Dimensions & Tags */}
                  <div className="flex items-center gap-2 mt-3 text-[11px] font-mono text-slate-300">
                    <Box className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {design.dimensions.width} × {design.dimensions.depth || design.dimensions.width} × {design.dimensions.height} mm
                    </span>
                    <span className="text-slate-500 font-sans text-[10px]">
                      ({design.printSettings.material})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {design.tags?.slice(0, 3).map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div
                  className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleExportSTL(design, true)}
                      className="p-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg text-xs font-mono transition"
                      title="Download Binary .STL"
                    >
                      .STL
                    </button>
                    <button
                      onClick={() => handleExportLaserSVG(design)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 rounded-lg text-xs font-mono transition"
                      title="Download Laser Vector .SVG"
                    >
                      .SVG
                    </button>
                    <button
                      onClick={() => handleExportManufacturingBundle(design)}
                      className="p-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 rounded-lg text-xs transition"
                      title="Export Single Design Bundle (.STL + .SVG)"
                    >
                      <FileArchive className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (onOpenVersionHistory) {
                          onOpenVersionHistory(design);
                        }
                      }}
                      className="p-1.5 text-indigo-400 hover:text-indigo-200 hover:bg-slate-800 rounded-lg transition"
                      title={`View Version History (${(design.versions?.length || 0) + 1} states)`}
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDuplicateDesign(design)}
                      className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
                      title="Duplicate Design"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {library.length > 1 && (
                      <button
                        onClick={() => onDeleteDesign(design.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        title="Delete Design"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onSelectDesign(design);
                        onClose();
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      Edit in CAD
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
