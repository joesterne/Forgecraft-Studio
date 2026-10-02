import React, { useState } from 'react';
import {
  X,
  History,
  RotateCcw,
  Plus,
  Clock,
  CheckCircle2,
  Box,
  Layers,
  Printer,
  Flame,
  ArrowRight,
  Bookmark,
  Calendar,
  AlertCircle,
  Eye,
  Check,
} from 'lucide-react';
import { CADDesign, DesignVersion } from '../types/cad';
import { calculatePrintStats } from '../utils/stlExporter';

interface VersionHistoryModalProps {
  design: CADDesign;
  onRevertToVersion: (version: DesignVersion) => void;
  onCreateSnapshot: (label: string) => void;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  design,
  onRevertToVersion,
  onCreateSnapshot,
  onClose,
}) => {
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [revertedId, setRevertedId] = useState<string | null>(null);

  const versions: DesignVersion[] = design.versions || [];
  const currentStats = calculatePrintStats(design.dimensions, design.printSettings);

  const handleCreateNewSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotLabel.trim()) return;
    onCreateSnapshot(snapshotLabel.trim());
    setSnapshotLabel('');
    setIsCreatingSnapshot(false);
  };

  const handleRevert = (version: DesignVersion) => {
    onRevertToVersion(version);
    setRevertedId(version.versionId);
    setTimeout(() => {
      setRevertedId(null);
    }, 2500);
  };

  const selectedVersion = versions.find((v) => v.versionId === selectedVersionId);
  const selectedStats = selectedVersion
    ? calculatePrintStats(selectedVersion.dimensions, selectedVersion.printSettings)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Version History & Cloud Checkpoints
                </h2>
                <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800/80">
                  {versions.length + 1} States
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate max-w-md">
                Active: {design.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreatingSnapshot ? (
              <button
                onClick={() => setIsCreatingSnapshot(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Checkpoint</span>
              </button>
            ) : (
              <form onSubmit={handleCreateNewSnapshot} className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Checkpoint name (e.g. V2 Thick Wall)..."
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
                />
                <button
                  type="submit"
                  disabled={!snapshotLabel.trim()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingSnapshot(false)}
                  className="p-1 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Timeline List */}
          <div className="md:col-span-7 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Timeline & Reversion Points
            </h3>

            {/* Current State Indicator */}
            <div className="p-3.5 bg-slate-800/40 border border-blue-500/50 rounded-2xl flex items-start justify-between shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 ring-4 ring-blue-500/20" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">Current Studio State</span>
                    <span className="text-[10px] font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-800">
                      LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(design.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {currentStats.weightGrams}g ({design.printSettings.material})
                  </p>
                  <div className="text-[11px] font-mono text-slate-300 mt-1">
                    {design.dimensions.width}×{design.dimensions.depth || design.dimensions.width}×{design.dimensions.height}mm (Wall: {design.dimensions.wallThickness}mm)
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-slate-500 font-mono px-2 py-1 bg-slate-900 rounded-lg">
                Active
              </span>
            </div>

            {/* Historical Checkpoints */}
            {versions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl space-y-2">
                <History className="w-8 h-8 mx-auto text-slate-600" />
                <p>No previous versions stored yet for this design.</p>
                <p className="text-[11px] text-slate-500">
                  New checkpoints are automatically saved when you modify dimensions, generate CAD, or click "Save Checkpoint".
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {versions.map((ver, idx) => {
                  const isSelected = selectedVersionId === ver.versionId;
                  const isJustReverted = revertedId === ver.versionId;
                  const verStats = calculatePrintStats(ver.dimensions, ver.printSettings);

                  return (
                    <div
                      key={ver.versionId}
                      className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/40'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2.5">
                          <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                            v{ver.versionNumber || versions.length - idx}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">
                              {ver.label || `Checkpoint ${versions.length - idx}`}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(ver.timestamp).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at{' '}
                              {new Date(ver.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Revert Action Button */}
                        <button
                          onClick={() => handleRevert(ver)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                            isJustReverted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-700 hover:border-indigo-500'
                          }`}
                          title="Restore design dimensions and settings to this state"
                        >
                          {isJustReverted ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Reverted!</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Revert</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Specs snippet */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>
                          {ver.dimensions.width}×{ver.dimensions.depth || ver.dimensions.width}×{ver.dimensions.height}mm
                        </span>
                        <span>{verStats.weightGrams}g ({ver.printSettings.material})</span>
                        <button
                          onClick={() => setSelectedVersionId(isSelected ? null : ver.versionId)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-sans"
                        >
                          {isSelected ? 'Close Compare' : 'Compare Diff'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Version Inspector & Diff Comparison */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {selectedVersion ? 'Version Difference Inspector' : 'Current Active Specs'}
            </h3>

            {selectedVersion && selectedStats ? (
              <div className="p-4 bg-slate-950/80 rounded-2xl border border-indigo-900/60 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">
                      Comparing: v{selectedVersion.versionNumber} vs. Current
                    </span>
                    <h4 className="text-xs font-bold text-slate-100">
                      {selectedVersion.label}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleRevert(selectedVersion)}
                    className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Apply</span>
                  </button>
                </div>

                {/* Diff Tables */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400">Width (X):</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500 line-through">{design.dimensions.width}mm</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-indigo-300 font-bold">{selectedVersion.dimensions.width}mm</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400">Height (Z):</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500 line-through">{design.dimensions.height}mm</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-indigo-300 font-bold">{selectedVersion.dimensions.height}mm</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400">Wall Thickness:</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500 line-through">{design.dimensions.wallThickness}mm</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-indigo-300 font-bold">{selectedVersion.dimensions.wallThickness}mm</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400">Material:</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500 line-through">{design.printSettings.material}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-indigo-300 font-bold">{selectedVersion.printSettings.material}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400">Estimated Weight:</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500 line-through">{currentStats.weightGrams}g</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-emerald-400 font-bold">{selectedStats.weightGrams}g</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg">
                    <span className="text-slate-400">Etsy Price:</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500 line-through">${design.etsyDetails?.suggestedPrice}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-amber-400 font-bold">${selectedVersion.etsyDetails?.suggestedPrice}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cloud Synced & Non-Destructive</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every version snapshot stores complete geometry bounds, slicer infill, material density, laser vector layers, and Etsy SEO metadata.
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When you revert, ForgeCraft automatically creates a rollback checkpoint so you can always step forward or backward through iterations safely.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>
            Click "Revert" on any checkpoint to immediately restore that state in the 3D viewport.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
