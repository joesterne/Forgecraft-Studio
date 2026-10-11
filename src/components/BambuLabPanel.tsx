import React, { useState } from 'react';
import {
  Printer,
  Download,
  CheckCircle2,
  Sparkles,
  Zap,
  Sliders,
  Layers,
  Palette,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  Check,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  CADDesign,
  BambuLabSettings,
  BambuPrinterModel,
  BambuPlateType,
  BambuAmsSlot,
} from '../types/cad';
import {
  BAMBU_PRINTER_SPECS,
  DEFAULT_BAMBU_SETTINGS,
  downloadBambu3MF,
} from '../utils/bambuLabExporter';

interface BambuLabPanelProps {
  design: CADDesign;
  onUpdateBambuSettings: (newSettings: BambuLabSettings) => void;
}

const PRESET_FILAMENT_COLORS = [
  { name: 'Bambu Green', hex: '#00AE42' },
  { name: 'Matte Ivory White', hex: '#F8FAFC' },
  { name: 'Matte Charcoal Black', hex: '#1E293B' },
  { name: 'Sunset Orange', hex: '#F97316' },
  { name: 'Bambu Crimson Red', hex: '#EF4444' },
  { name: 'Cobalt Blue', hex: '#3B82F6' },
  { name: 'Silk Gold', hex: '#EAB308' },
  { name: 'Cyan Support Material', hex: '#06B6D4' },
];

const BAMBU_FILAMENTS = [
  'Bambu PLA Basic',
  'Bambu PLA Matte',
  'Bambu PLA Silk',
  'Bambu PLA Tough',
  'Bambu PETG HF',
  'Bambu PETG-CF',
  'Bambu ABS',
  'Bambu ASA',
  'Bambu TPU 95A',
  'Bambu Support for PLA',
];

export const BambuLabPanel: React.FC<BambuLabPanelProps> = ({
  design,
  onUpdateBambuSettings,
}) => {
  const bambu = design.bambuSettings || DEFAULT_BAMBU_SETTINGS;
  const currentSpec = BAMBU_PRINTER_SPECS[bambu.printerModel] || BAMBU_PRINTER_SPECS['Bambu Lab X1-Carbon'];

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeColorPickerSlot, setActiveColorPickerSlot] = useState<number | null>(null);

  // Check if active model fits inside the printer build volume
  const { width, depth, height } = design.dimensions;
  const actualDepth = depth || width;
  const fitsWidth = width <= currentSpec.bedWidthMm;
  const fitsDepth = actualDepth <= currentSpec.bedDepthMm;
  const fitsHeight = height <= currentSpec.bedHeightMm;
  const fitsBed = fitsWidth && fitsDepth && fitsHeight;

  const handleUpdate = (partial: Partial<BambuLabSettings>) => {
    onUpdateBambuSettings({
      ...bambu,
      ...partial,
    });
  };

  const handleUpdateAmsSlot = (slotNumber: number, partial: Partial<BambuAmsSlot>) => {
    const updatedSlots = bambu.amsSlots.map((slot) =>
      slot.slotNumber === slotNumber ? { ...slot, ...partial } : slot
    );
    handleUpdate({ amsSlots: updatedSlots });
  };

  const handleDownload3MF = async () => {
    setIsDownloading(true);
    try {
      await downloadBambu3MF(design);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Bambu 3MF download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-emerald-500/30 shadow-xl space-y-4 relative overflow-hidden">
      {/* Background Decorative Emerald Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/15 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-inner">
            <Printer className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Bambu Lab Studio Integration</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Official .3MF Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Generate native Bambu Studio &amp; OrcaSlicer project files with tuned layer profiles and AMS 4-color mapping.
            </p>
          </div>
        </div>

        {/* 1-Click Export 3MF Action Button */}
        <button
          onClick={handleDownload3MF}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 border border-emerald-400/40 transition active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-200" />
              <span>Project .3MF Ready!</span>
            </>
          ) : (
            <>
              <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>Export Bambu Project (.3mf)</span>
            </>
          )}
        </button>
      </div>

      {/* Printer Model Selection Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-slate-200 flex items-center gap-1.5">
            <span>1. Select Bambu Printer Target</span>
          </label>
          <span className="text-[10px] text-slate-400 font-mono">
            Build Area: {currentSpec.bedWidthMm} × {currentSpec.bedDepthMm} × {currentSpec.bedHeightMm} mm
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {(Object.keys(BAMBU_PRINTER_SPECS) as BambuPrinterModel[]).map((modelName) => {
            const spec = BAMBU_PRINTER_SPECS[modelName];
            const isSelected = bambu.printerModel === modelName;

            return (
              <button
                key={modelName}
                onClick={() => handleUpdate({ printerModel: modelName })}
                className={`p-2.5 rounded-xl text-left border transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 text-white shadow-md'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <span className={`text-[11px] font-bold block truncate ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {modelName.replace('Bambu Lab ', '')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                    {spec.bedWidthMm}×{spec.bedHeightMm}mm
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500">
                  <span>{spec.maxSpeedMms}mm/s</span>
                  {spec.hasLidar && <span className="text-emerald-400 font-semibold">LiDAR</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Build Volume Fitment, Plate Type, Nozzle & Speed row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Bed Fitment Status */}
        <div className={`p-3 rounded-xl border flex items-center gap-3 ${
          fitsBed
            ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300'
            : 'bg-rose-950/30 border-rose-800/80 text-rose-300'
        }`}>
          <div className={`p-2 rounded-xl border shrink-0 ${
            fitsBed
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
          }`}>
            {fitsBed ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold block truncate">
              {fitsBed ? 'Fits Bambu Build Plate' : 'Exceeds Build Volume!'}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {width}×{actualDepth}×{height} mm | Bed: {currentSpec.bedWidthMm}×{currentSpec.bedDepthMm}
            </span>
          </div>
        </div>

        {/* Build Plate Type */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Build Plate Surface
          </label>
          <select
            value={bambu.plateType}
            onChange={(e) => handleUpdate({ plateType: e.target.value as BambuPlateType })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
          >
            <option value="Textured PEI Plate">🌟 Gold Textured PEI</option>
            <option value="Smooth PEI / High Temp Plate">✨ Smooth PEI / High Temp</option>
            <option value="Engineering Plate">⚙️ Engineering Plate</option>
            <option value="Cool Plate">❄️ Cool Plate</option>
          </select>
        </div>

        {/* Nozzle Diameter */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Nozzle Size
            </label>
            <span className="text-[9px] text-emerald-400 font-mono">
              {bambu.nozzleDiameter || 0.4}mm
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[0.2, 0.4, 0.6, 0.8].map((dia) => (
              <button
                key={dia}
                type="button"
                onClick={() => handleUpdate({ nozzleDiameter: dia as any })}
                className={`py-1 px-1 rounded-lg text-center transition border ${
                  (bambu.nozzleDiameter || 0.4) === dia
                    ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title={dia === 0.2 ? '0.2mm - High Detail / Keychains' : dia === 0.4 ? '0.4mm - Standard' : dia === 0.6 ? '0.6mm - Fast / CF' : '0.8mm - High Flow'}
              >
                <div className="text-[10px] font-mono leading-tight">{dia}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Speed Profile Mode */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Bambu Speed Preset
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'Silent (50%)', label: '50%', sub: 'Quiet' },
              { id: 'Standard (100%)', label: '100%', sub: 'Std' },
              { id: 'Sport (124%)', label: '124%', sub: 'Sport' },
              { id: 'Ludicrous (166%)', label: '166%', sub: 'Fast' },
            ].map((sp) => (
              <button
                key={sp.id}
                onClick={() => handleUpdate({ speedProfile: sp.id as any })}
                className={`py-1 px-1 rounded-lg text-center transition border ${
                  bambu.speedProfile === sp.id
                    ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title={sp.id}
              >
                <div className="text-[10px] font-mono leading-tight">{sp.label}</div>
                <div className="text-[8px] text-slate-400">{sp.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bambu AMS (Automatic Material System) 4-Color Slot Manager */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-slate-200 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Bambu AMS Multi-Color Slot Manager</span>
          </label>
          <span className="text-[10px] text-emerald-400 font-mono">
            Active: Slot {bambu.activeSlot} ({bambu.amsSlots.find((s) => s.slotNumber === bambu.activeSlot)?.filamentType})
          </span>
        </div>

        {/* 4 AMS Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {bambu.amsSlots.map((slot) => {
            const isActive = bambu.activeSlot === slot.slotNumber;

            return (
              <div
                key={slot.slotNumber}
                onClick={() => handleUpdate({ activeSlot: slot.slotNumber })}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isActive
                    ? 'bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/40 shadow-md'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveColorPickerSlot(
                          activeColorPickerSlot === slot.slotNumber ? null : slot.slotNumber
                        );
                      }}
                      className="w-5 h-5 rounded-full border-2 border-slate-700 shadow-sm shrink-0 transition hover:scale-110"
                      style={{ backgroundColor: slot.colorHex }}
                      title="Click to change slot color"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">
                        Slot {slot.slotNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block max-w-[120px]">
                        {slot.colorName}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isActive ? 'Assigned' : 'Select'}
                  </span>
                </div>

                {/* Filament Type selector */}
                <select
                  value={slot.filamentType}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleUpdateAmsSlot(slot.slotNumber, { filamentType: e.target.value });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {BAMBU_FILAMENTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>

                {/* Color Swatch Dropdown if active */}
                {activeColorPickerSlot === slot.slotNumber && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-slate-900 border border-slate-700 rounded-xl space-y-1.5 animate-fadeIn"
                  >
                    <span className="text-[9px] text-slate-400 font-semibold block">
                      Choose Filament Color:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PRESET_FILAMENT_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => {
                            handleUpdateAmsSlot(slot.slotNumber, {
                              colorHex: c.hex,
                              colorName: c.name,
                            });
                            setActiveColorPickerSlot(null);
                          }}
                          className="w-full aspect-square rounded-lg border border-slate-600 transition hover:scale-105"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bambu High-Speed CoreXY vs Standard Printer Performance Comparison */}
      <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">
              Bambu CoreXY High-Speed Printing Efficiency
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
            Up to 500 mm/s • {currentSpec.maxAccelerationMms2.toLocaleString()} mm/s²
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Standard Bed Slinger (~60mm/s)</span>
            <div className="text-sm font-bold text-slate-300 font-mono mt-0.5">
              ~{Math.floor(((design.dimensions.height / design.printSettings.layerHeight) * 1.8) / 60)}h {Math.round(((design.dimensions.height / design.printSettings.layerHeight) * 1.8) % 60)}m
            </div>
            <span className="text-[9px] text-slate-500">Traditional Ender/Prusa rate</span>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
            <span className="text-[10px] text-emerald-300 block font-semibold flex items-center gap-1">
              <span>{bambu.printerModel.replace('Bambu Lab ', '')} ({bambu.speedProfile.split(' ')[0]})</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <div className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
              ~{Math.floor((((design.dimensions.height / design.printSettings.layerHeight) * 1.8 * 0.38 * (bambu.speedProfile === 'Ludicrous (166%)' ? 0.6 : bambu.speedProfile === 'Sport (124%)' ? 0.8 : bambu.speedProfile === 'Silent (50%)' ? 2.0 : 1.0)) / 60))}h {Math.round((((design.dimensions.height / design.printSettings.layerHeight) * 1.8 * 0.38 * (bambu.speedProfile === 'Ludicrous (166%)' ? 0.6 : bambu.speedProfile === 'Sport (124%)' ? 0.8 : bambu.speedProfile === 'Silent (50%)' ? 2.0 : 1.0)) % 60))}m
            </div>
            <span className="text-[9px] text-emerald-400 font-medium">Bambu Active Tuned</span>
          </div>

          <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 flex flex-col justify-between">
            <span className="text-[10px] text-indigo-300 block font-semibold">Production Velocity</span>
            <div className="text-sm font-bold text-indigo-300 font-mono mt-0.5">
              Save ~{Math.max(0, Math.floor((((design.dimensions.height / design.printSettings.layerHeight) * 1.8) * 0.62) / 60))}h {Math.max(0, Math.round((((design.dimensions.height / design.printSettings.layerHeight) * 1.8) * 0.62) % 60))}m / item
            </div>
            <span className="text-[9px] text-indigo-400 font-medium">2.6× faster Etsy turnaround</span>
          </div>
        </div>
      </div>

      {/* Recommended Hotend & Bed Thermal Settings for Active Material */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
        <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 block uppercase font-mono">Target Nozzle Temp</span>
          <span className="font-bold text-amber-400 font-mono">
            {(bambu.amsSlots.find((s) => s.slotNumber === bambu.activeSlot)?.filamentType || '').includes('PETG')
              ? '255°C'
              : (bambu.amsSlots.find((s) => s.slotNumber === bambu.activeSlot)?.filamentType || '').includes('ABS')
              ? '265°C'
              : (bambu.amsSlots.find((s) => s.slotNumber === bambu.activeSlot)?.filamentType || '').includes('TPU')
              ? '230°C'
              : '220°C'}
          </span>
        </div>
        <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 block uppercase font-mono">Recommended Bed Temp</span>
          <span className="font-bold text-amber-400 font-mono">
            {bambu.plateType === 'Cool Plate'
              ? '35°C'
              : (bambu.amsSlots.find((s) => s.slotNumber === bambu.activeSlot)?.filamentType || '').includes('PETG')
              ? '70°C'
              : (bambu.amsSlots.find((s) => s.slotNumber === bambu.activeSlot)?.filamentType || '').includes('ABS')
              ? '95°C'
              : '55°C'}
          </span>
        </div>
        <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 block uppercase font-mono">Max Volumetric Flow</span>
          <span className="font-bold text-emerald-400 font-mono">
            {(bambu.amsSlots.find((s) => s.slotNumber === bambu.activeSlot)?.filamentType || '').includes('TPU')
              ? '3.5 mm³/s'
              : (bambu.amsSlots.find((s) => s.slotNumber === bambu.activeSlot)?.filamentType || '').includes('PETG')
              ? '18 mm³/s'
              : '21 mm³/s'}
          </span>
        </div>
        <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800">
          <span className="text-[9px] text-slate-400 block uppercase font-mono">Chamber Status</span>
          <span className="font-bold text-slate-300">
            {currentSpec.hasEnclosure ? 'Enclosed / Filter Active' : 'Open Air Cooling'}
          </span>
        </div>
      </div>

      {/* Advanced Bambu Slicer Flags */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={bambu.flowCalibration}
              onChange={(e) => handleUpdate({ flowCalibration: e.target.checked })}
              className="accent-emerald-500 rounded"
            />
            <span className="text-[11px]">Dynamic Flow Rate Calibration</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={bambu.timelapseEnabled}
              onChange={(e) => handleUpdate({ timelapseEnabled: e.target.checked })}
              className="accent-emerald-500 rounded"
            />
            <span className="text-[11px]">Chamber Timelapse Video</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={bambu.wipeTower}
              onChange={(e) => handleUpdate({ wipeTower: e.target.checked })}
              className="accent-emerald-500 rounded"
            />
            <span className="text-[11px]">Purge Wipe Tower</span>
          </label>
        </div>

        <div className="text-[10px] text-slate-500 font-mono">
          Layer: {design.printSettings.layerHeight}mm • Infill: {design.printSettings.infillDensity}%
        </div>
      </div>
    </div>
  );
};
