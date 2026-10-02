import React from 'react';
import { Sliders, Maximize2, ShieldCheck, Type, Ruler } from 'lucide-react';
import { CADDesign, ModelDimensions } from '../types/cad';

interface DimensionEditorProps {
  design: CADDesign;
  onChangeDimensions: (newDims: Partial<ModelDimensions>) => void;
}

export const DimensionEditor: React.FC<DimensionEditorProps> = ({
  design,
  onChangeDimensions,
}) => {
  const dims = design.dimensions;
  const isPlanter = design.modelType === 'planter';
  const isKeychain = design.modelType === 'keychain';
  const isCutter = design.modelType === 'cutter';
  const isCoaster = design.modelType === 'coaster';
  const isOrganizer = design.modelType === 'organizer';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Parametric Dimensions</h3>
            <p className="text-[11px] text-slate-400">Watertight millimeter tolerances for 3D printing</p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-1 bg-slate-800 text-blue-300 rounded-lg border border-slate-700">
          {dims.width} × {dims.depth || dims.width} × {dims.height} mm
        </span>
      </div>

      {/* Main Bounding Sliders */}
      <div className="space-y-4">
        {/* Width (X) */}
        <div>
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Width (X)
            </span>
            <span className="text-slate-200 font-mono">{dims.width} mm</span>
          </div>
          <input
            type="range"
            min={isKeychain ? 30 : 20}
            max={isPlanter || isOrganizer ? 200 : 120}
            step="1"
            value={dims.width}
            onChange={(e) => onChangeDimensions({ width: Number(e.target.value) })}
            className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
            <span>Compact</span>
            <span>Standard</span>
            <span>Oversized</span>
          </div>
        </div>

        {/* Depth (Y) - if applicable */}
        {!isPlanter && !isCoaster && (
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" /> Depth (Y)
              </span>
              <span className="text-slate-200 font-mono">{dims.depth || dims.width} mm</span>
            </div>
            <input
              type="range"
              min={isKeychain ? 15 : 20}
              max={150}
              step="1"
              value={dims.depth || dims.width}
              onChange={(e) => onChangeDimensions({ depth: Number(e.target.value) })}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        )}

        {/* Height (Z) */}
        <div>
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Height (Z)
            </span>
            <span className="text-slate-200 font-mono">{dims.height} mm</span>
          </div>
          <input
            type="range"
            min={isKeychain || isCoaster ? 2 : 10}
            max={isPlanter ? 150 : 80}
            step={isKeychain || isCoaster ? '0.5' : '1'}
            value={dims.height}
            onChange={(e) => onChangeDimensions({ height: Number(e.target.value) })}
            className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Wall Thickness */}
        <div>
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Wall Thickness
            </span>
            <span className="text-slate-200 font-mono">{dims.wallThickness} mm</span>
          </div>
          <input
            type="range"
            min="1.2"
            max="6.0"
            step="0.2"
            value={dims.wallThickness}
            onChange={(e) => onChangeDimensions({ wallThickness: Number(e.target.value) })}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            {dims.wallThickness < 1.6
              ? '⚠️ Thin: 2 perimeters with 0.4mm nozzle. Handle with care.'
              : dims.wallThickness >= 3.0
              ? '✅ Heavy duty: ultra-rigid and leak-proof.'
              : '✨ Balanced: ideal strength-to-weight ratio.'}
          </p>
        </div>
      </div>

      {/* Model-Specific Parametric Knobs */}
      <div className="pt-4 border-t border-slate-800 space-y-4">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Feature Customization
        </h4>

        {/* Custom Text for Keychain / Personalized */}
        {isKeychain && (
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1.5">
              Personalized Name / Monogram Text
            </label>
            <div className="relative">
              <Type className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                maxLength={12}
                value={dims.text || ''}
                onChange={(e) => onChangeDimensions({ text: e.target.value.toUpperCase() })}
                placeholder="E.g. EMMA, 2026, BEST DAD"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 font-mono tracking-wider focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-300">Emboss Relief Height</span>
                <span className="text-slate-200 font-mono">{dims.embossDepth || 1.5} mm</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="3.0"
                step="0.2"
                value={dims.embossDepth || 1.5}
                onChange={(e) => onChangeDimensions({ embossDepth: Number(e.target.value) })}
                className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Planter Drainage Hole & Segments */}
        {isPlanter && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-300">Bottom Drainage Hole</span>
                <span className="text-slate-200 font-mono">{dims.drainageHole || 10} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={dims.drainageHole ?? 10}
                onChange={(e) => onChangeDimensions({ drainageHole: Number(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-300">Polygon Geometry Sides</span>
                <span className="text-slate-200 font-mono">{dims.patternSegments || 6} Sides</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {[5, 6, 8, 12].map((sides) => (
                  <button
                    key={sides}
                    onClick={() => onChangeDimensions({ patternSegments: sides })}
                    className={`py-1 text-xs rounded-lg font-mono transition ${
                      dims.patternSegments === sides
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {sides === 5 ? 'Pent' : sides === 6 ? 'Hex' : sides === 8 ? 'Oct' : 'Smooth'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cutter Blade Sharpening */}
        {isCutter && (
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300">Knife Cutting Blade Thickness</span>
              <span className="text-amber-400 font-mono">{dims.cuttingEdgeThickness || 0.7} mm</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.2"
              step="0.1"
              value={dims.cuttingEdgeThickness || 0.7}
              onChange={(e) => onChangeDimensions({ cuttingEdgeThickness: Number(e.target.value) })}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              0.7mm produces ultra-clean cuts in polymer clay with zero post-sanding.
            </p>
          </div>
        )}

        {/* Corner Radii for Tags & Boxes */}
        {(isKeychain || isOrganizer) && (
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300">Corner Fillet Radius</span>
              <span className="text-slate-200 font-mono">{dims.cornerRadius || 4} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={dims.cornerRadius || 4}
              onChange={(e) => onChangeDimensions({ cornerRadius: Number(e.target.value) })}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};
