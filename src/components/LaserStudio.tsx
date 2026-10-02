import React, { useState } from 'react';
import {
  Flame,
  FileCode,
  Download,
  Sliders,
  CheckCircle2,
  Layers,
  Zap,
  Info,
  Ruler,
  Maximize2,
} from 'lucide-react';
import { CADDesign, LaserSettings, LaserMachineType } from '../types/cad';
import {
  generateLaserSVG,
  generateDXFVector,
  downloadFile,
} from '../utils/stlExporter';

interface LaserStudioProps {
  design: CADDesign;
  onChangeLaserSettings: (settings: Partial<LaserSettings>) => void;
}

export const LaserStudio: React.FC<LaserStudioProps> = ({
  design,
  onChangeLaserSettings,
}) => {
  const l = design.laserSettings || {
    enabled: true,
    material: '3mm Basswood Plywood',
    laserType: 'Diode 20W',
    cutSpeed: 300,
    cutPower: 100,
    scoreSpeed: 1200,
    scorePower: 35,
    engraveSpeed: 3500,
    engravePower: 50,
    kerfCompensation: 0.15,
  };

  const [activeTab, setActiveTab] = useState<'preview' | 'params' | 'materials'>('preview');

  const machinePresets: { id: LaserMachineType; name: string; desc: string }[] = [
    { id: 'Diode 10W', name: 'Diode 10W', desc: 'xTool D1, Falcon, Sculpfun' },
    { id: 'Diode 20W', name: 'Diode 20W / 40W', desc: 'xTool S1, Falcon 2, Atomstack' },
    { id: 'CO2 45W', name: 'CO2 45W / 55W', desc: 'Glowforge Plus/Pro, OMTech, Boss' },
    { id: 'Fiber 20W', name: 'Galvo Fiber 20W', desc: 'Metal & slate high-speed engraving' },
  ];

  const materialPresets = [
    { name: '3mm Basswood Plywood', cutSpd: 300, cutPwr: 100, scrSpd: 1200, scrPwr: 35, engSpd: 3500, engPwr: 50, kerf: 0.14 },
    { name: '5mm Birch Plywood', cutSpd: 180, cutPwr: 100, scrSpd: 1000, scrPwr: 40, engSpd: 3000, engPwr: 55, kerf: 0.16 },
    { name: '3mm Cast Acrylic (Clear/Black)', cutSpd: 220, cutPwr: 95, scrSpd: 1500, scrPwr: 25, engSpd: 4000, engPwr: 40, kerf: 0.12 },
    { name: 'Full Grain Leather (2mm)', cutSpd: 400, cutPwr: 80, scrSpd: 1800, scrPwr: 20, engSpd: 4500, engPwr: 35, kerf: 0.10 },
    { name: 'Natural Slate Coaster', cutSpd: 0, cutPwr: 0, scrSpd: 800, scrPwr: 60, engSpd: 2500, engPwr: 75, kerf: 0.05 },
    { name: 'Anodized Aluminum Tag', cutSpd: 0, cutPwr: 0, scrSpd: 600, scrPwr: 80, engSpd: 3000, engPwr: 85, kerf: 0.02 },
  ];

  const applyMaterialPreset = (preset: typeof materialPresets[0]) => {
    onChangeLaserSettings({
      material: preset.name,
      cutSpeed: preset.cutSpd,
      cutPower: preset.cutPwr,
      scoreSpeed: preset.scrSpd,
      scorePower: preset.scrPwr,
      engraveSpeed: preset.engSpd,
      engravePower: preset.engPwr,
      kerfCompensation: preset.kerf,
    });
  };

  const handleExportSVG = () => {
    const svgString = generateLaserSVG(design);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    downloadFile(blob, `${design.name.toLowerCase().replace(/\s+/g, '_')}_laser_cut.svg`);
  };

  const handleExportDXF = () => {
    const dxfString = generateDXFVector(design);
    const blob = new Blob([dxfString], { type: 'application/dxf;charset=utf-8' });
    downloadFile(blob, `${design.name.toLowerCase().replace(/\s+/g, '_')}_laser_cut.dxf`);
  };

  const handleExportSpecSheet = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${design.name} - Manufacturing Spec Sheet</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
    h1 { margin-bottom: 4px; }
    .badge { display: inline-block; background: #e2e8f0; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    .color-cut { color: #dc2626; font-weight: bold; }
    .color-score { color: #2563eb; font-weight: bold; }
    .color-engrave { color: #0f172a; font-weight: bold; }
  </style>
</head>
<body>
  <h1>${design.name}</h1>
  <div class="badge">ForgeCraft Studio - Precision Manufacturing Spec</div>
  <p><strong>Category:</strong> ${design.category} | <strong>Dimensions:</strong> ${design.dimensions.width}mm × ${design.dimensions.depth || design.dimensions.width}mm × ${design.dimensions.height}mm</p>
  
  <h3>Laser Manufacturing & Kerf Parameters</h3>
  <table>
    <tr><th>Workpiece Material</th><td>${l.material}</td></tr>
    <tr><th>Laser Machine</th><td>${l.laserType}</td></tr>
    <tr><th>Kerf Offset Compensation</th><td>${l.kerfCompensation} mm (applied to toolpath)</td></tr>
    <tr><th class="color-cut">Cut (Through-Cut)</th><td>Speed: ${l.cutSpeed} mm/min | Power: ${l.cutPower}%</td></tr>
    <tr><th class="color-score">Score (Vector Line)</th><td>Speed: ${l.scoreSpeed} mm/min | Power: ${l.scorePower}%</td></tr>
    <tr><th class="color-engrave">Engrave (Raster Fill)</th><td>Speed: ${l.engraveSpeed} mm/min | Power: ${l.engravePower}%</td></tr>
  </table>

  <h3>Etsy Economics & Sourcing</h3>
  <table>
    <tr><th>Suggested Retail Price</th><td>$${design.etsyDetails?.suggestedPrice || 19.99}</td></tr>
    <tr><th>Estimated Raw Material Cost</th><td>$${design.etsyDetails?.materialCost || 1.50}</td></tr>
    <tr><th>Target Net Profit Margin</th><td>${design.etsyDetails?.profitMargin || 85}%</td></tr>
  </table>
  <br>
  <p style="font-size: 11px; color: #64748b;">Generated by ForgeCraft Studio for Etsy Creators. All rights reserved.</p>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    downloadFile(blob, `${design.name.toLowerCase().replace(/\s+/g, '_')}_spec_sheet.html`);
  };

  const { width, depth = width, cornerRadius = 4, holeDiameter = 0, text = '' } = design.dimensions;
  const padding = 15;
  const viewW = width + padding * 2;
  const viewH = (depth || width) + padding * 2;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Laser Engraving & Vector Studio</h3>
            <p className="text-[11px] text-slate-400">
              LightBurn & Glowforge ready: Cut (Red), Score (Blue), Engrave (Black)
            </p>
          </div>
        </div>

        {/* Quick Vector Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSVG}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-md transition"
            title="Download LightBurn/Glowforge Layered SVG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.SVG Vector</span>
          </button>
          <button
            onClick={handleExportDXF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition"
            title="Download AutoCAD DXF for CNC & Laser"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>.DXF Vector</span>
          </button>
          <button
            onClick={handleExportSpecSheet}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs rounded-xl transition"
            title="Download Manufacturing Blueprint Spec"
          >
            Spec
          </button>
        </div>
      </div>

      {/* Navigation sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
            activeTab === 'preview'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          2D Vector Workpiece
        </button>
        <button
          onClick={() => setActiveTab('params')}
          className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
            activeTab === 'params'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Speeds & Kerf Offset
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-3 py-1 text-xs rounded-lg font-medium transition ${
            activeTab === 'materials'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Material Presets
        </button>
      </div>

      {/* Tab 1: 2D Vector Workpiece Visualizer */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="relative w-full h-64 bg-[#0a0c10] border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-4">
            {/* SVG Interactive Canvas */}
            <svg
              viewBox={`0 0 ${viewW} ${viewH}`}
              className="max-h-full max-w-full drop-shadow-lg"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
            >
              {/* Background grid markings */}
              <defs>
                <pattern id="laser-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width={viewW} height={viewH} fill="url(#laser-grid)" />

              {/* Laser Cut Vector (Red) */}
              {design.modelType === 'coaster' ? (
                <circle
                  cx={viewW / 2}
                  cy={viewH / 2}
                  r={width / 2}
                  fill="#1c1917"
                  stroke="#ef4444"
                  strokeWidth="1.2"
                />
              ) : (
                <rect
                  x={padding}
                  y={padding}
                  width={width}
                  height={depth || width}
                  rx={cornerRadius}
                  ry={cornerRadius}
                  fill="#1c1917"
                  stroke="#ef4444"
                  strokeWidth="1.2"
                />
              )}

              {/* Hole Cutout (Red) */}
              {holeDiameter > 0 && (
                <circle
                  cx={padding + (cornerRadius > 0 ? cornerRadius + 2 : 6)}
                  cy={viewH / 2}
                  r={holeDiameter / 2}
                  fill="#0a0c10"
                  stroke="#ef4444"
                  strokeWidth="1.2"
                />
              )}

              {/* Score Line (Blue dashed) */}
              {design.modelType === 'coaster' ? (
                <circle
                  cx={viewW / 2}
                  cy={viewH / 2}
                  r={width / 2 - 4}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              ) : (
                <rect
                  x={padding + 3.5}
                  y={padding + 3.5}
                  width={width - 7}
                  height={(depth || width) - 7}
                  rx={Math.max(1, cornerRadius - 2)}
                  ry={Math.max(1, cornerRadius - 2)}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              )}

              {/* Raster Engrave Fill (Text / Artwork in warm gold/black) */}
              <text
                x={viewW / 2 + (holeDiameter > 0 ? 3 : 0)}
                y={viewH / 2 + 2}
                fontSize={Math.min((depth || width) * 0.32, width / ((text || design.name).length * 0.65))}
                fill="#fcd34d"
                fontFamily="Inter, sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {text || (design.modelType === 'keychain' ? 'ALEX' : design.name.substring(0, 10))}
              </text>
            </svg>

            {/* Canvas Legend */}
            <div className="absolute bottom-2.5 left-3 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px]">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-0.5 bg-rose-500 rounded" /> Cut (#FF0000)
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-0.5 border-t border-dashed border-blue-500" /> Score (#0000FF)
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2 h-2 bg-amber-400 rounded-sm" /> Engrave Fill
              </span>
            </div>

            <div className="absolute top-2.5 right-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
              Workpiece: {width} × {depth || width} mm
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Speeds, Power & Kerf Offset */}
      {activeTab === 'params' && (
        <div className="space-y-4">
          {/* Laser Machine Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Laser Machine Class</label>
            <div className="grid grid-cols-2 gap-2">
              {machinePresets.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onChangeLaserSettings({ laserType: m.id })}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    l.laserType === m.id
                      ? 'bg-rose-500/15 border-rose-500 text-rose-200'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-100">{m.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Kerf Compensation */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-amber-400" /> Kerf Offset Compensation
              </span>
              <span className="text-amber-400 font-mono">{l.kerfCompensation} mm</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="0.30"
              step="0.01"
              value={l.kerfCompensation}
              onChange={(e) => onChangeLaserSettings({ kerfCompensation: Number(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Expands outer boundaries by the beam beam width for snug press-fit box joints and inlays.
            </p>
          </div>

          {/* Speeds & Powers Matrix */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Cut */}
            <div className="p-2.5 bg-slate-950/70 rounded-xl border border-rose-950 space-y-1.5">
              <span className="text-[11px] font-bold text-rose-400">1. Vector Cut</span>
              <div className="text-[10px] text-slate-400">
                Speed: <span className="font-mono text-slate-200">{l.cutSpeed} mm/min</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Power: <span className="font-mono text-rose-300">{l.cutPower}%</span>
              </div>
            </div>

            {/* Score */}
            <div className="p-2.5 bg-slate-950/70 rounded-xl border border-blue-950 space-y-1.5">
              <span className="text-[11px] font-bold text-blue-400">2. Vector Score</span>
              <div className="text-[10px] text-slate-400">
                Speed: <span className="font-mono text-slate-200">{l.scoreSpeed} mm/min</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Power: <span className="font-mono text-blue-300">{l.scorePower}%</span>
              </div>
            </div>

            {/* Engrave */}
            <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-400">3. Raster Engrave</span>
              <div className="text-[10px] text-slate-400">
                Speed: <span className="font-mono text-slate-200">{l.engraveSpeed} mm/min</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Power: <span className="font-mono text-amber-300">{l.engravePower}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Material Presets */}
      {activeTab === 'materials' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            One-click apply calibrated laser speeds, power levels, and kerf tolerances:
          </p>

          <div className="grid grid-cols-2 gap-2">
            {materialPresets.map((mat) => (
              <button
                key={mat.name}
                onClick={() => applyMaterialPreset(mat)}
                className={`p-3 rounded-xl border text-left transition ${
                  l.material === mat.name
                    ? 'bg-rose-500/15 border-rose-500 text-rose-200'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-semibold text-slate-100 flex items-center justify-between">
                  <span>{mat.name}</span>
                  {l.material === mat.name && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Cut: {mat.cutSpd}mm/m @ {mat.cutPwr}% | Kerf: {mat.kerf}mm
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
