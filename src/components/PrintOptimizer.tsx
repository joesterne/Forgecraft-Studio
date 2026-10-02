import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  DollarSign,
  Clock,
  Weight,
  Layers,
  Sparkles,
  TrendingUp,
  Scale,
  SlidersHorizontal,
  Flame,
  Info,
  Package,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Zap,
  ShoppingBag,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  X,
  AlertCircle,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { CADDesign, MaterialType, InfillPattern, PrintSettings, ModelDimensions } from '../types/cad';
import { calculatePrintStats } from '../utils/stlExporter';
import { analyzePrintability, PrintabilityReport, PrintabilityIssue } from '../utils/printabilityChecker';

interface PrintOptimizerProps {
  design: CADDesign;
  onChangePrintSettings: (newSettings: Partial<PrintSettings>) => void;
  onChangeDimensions?: (newDims: Partial<ModelDimensions>) => void;
}

export const PrintOptimizer: React.FC<PrintOptimizerProps> = ({
  design,
  onChangePrintSettings,
  onChangeDimensions,
}) => {
  const p = design.printSettings;
  const stats = calculatePrintStats(design.dimensions, design.printSettings);

  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const [batchQuantity, setBatchQuantity] = useState<number>(1);
  const [isToastDismissed, setIsToastDismissed] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [showAllIssues, setShowAllIssues] = useState(false);

  // Run real-time physical printability check
  const printability: PrintabilityReport = useMemo(() => {
    return analyzePrintability(design);
  }, [design.dimensions, design.modelType, design.printSettings]);

  // Re-open toast if a new warning arises
  const issueKey = printability.issues.map((i) => i.id).join(',');
  useEffect(() => {
    setIsToastDismissed(false);
  }, [issueKey]);

  const handleManualRecheck = () => {
    setIsRechecking(true);
    setTimeout(() => {
      setIsRechecking(false);
      setIsToastDismissed(false);
    }, 450);
  };

  const handleAutoFix = (issue: PrintabilityIssue) => {
    if (issue.suggestedPrintSettings) {
      onChangePrintSettings(issue.suggestedPrintSettings);
    }
    if (issue.suggestedDimensions && onChangeDimensions) {
      onChangeDimensions(issue.suggestedDimensions);
    }
  };

  const materials: { id: MaterialType; name: string; desc: string; density: number; temp: string; color: string }[] = [
    { id: 'PLA', name: 'PLA / PLA Pro', desc: 'Easy, sharp detail, eco-friendly', density: 1.24, temp: '210°C / 60°C', color: 'text-blue-400' },
    { id: 'PETG', name: 'PETG Tough', desc: 'UV resistant, food-safe, strong', density: 1.27, temp: '240°C / 80°C', color: 'text-amber-400' },
    { id: 'ABS', name: 'ABS / ASA', desc: 'High heat, impact resistance', density: 1.05, temp: '250°C / 100°C', color: 'text-rose-400' },
    { id: 'TPU', name: 'TPU 95A', desc: 'Flexible, rubbery, impact proof', density: 1.21, temp: '225°C / 45°C', color: 'text-emerald-400' },
    { id: 'Resin', name: 'SLA Resin', desc: 'Ultra-high 0.05mm precision', density: 1.15, temp: 'UV 405nm', color: 'text-purple-400' },
  ];

  const infillPatterns: { id: InfillPattern; name: string; badge: string }[] = [
    { id: 'gyroid', name: 'Gyroid', badge: 'Best for Planters / Watertight' },
    { id: 'grid', name: 'Grid', badge: 'Fastest Print Speed' },
    { id: 'honeycomb', name: 'Honeycomb', badge: 'High Torsional Rigidity' },
  ];

  const currentWeight = stats.weightGrams;
  const qty = batchQuantity;

  // Dynamic animation key computed from all reactive print settings:
  // Re-keys the chart whenever materials, infill, layer height, walls, or batch quantity change,
  // triggering a smooth upward entrance animation from 0 to target values.
  const chartAnimationKey = `recharts-${p.material}-${p.infillDensity}-${p.layerHeight}-${p.wallCount}-${p.filamentCostPerKg || 20}-${batchQuantity}-${stats.weightGrams}`;

  // Prepare Recharts bar chart data based on selected settings and multiplier
  const chartData = [
    {
      category: 'Material Usage',
      cost: Number((stats.materialCost * qty).toFixed(2)),
      description: `${(stats.weightGrams * qty).toFixed(1)}g ${p.material} at $${p.filamentCostPerKg}/kg`,
      color: '#3b82f6',
      percentage: Number(((stats.materialCost / (stats.recommendedRetailPrice || 1)) * 100).toFixed(1)),
    },
    {
      category: 'Energy Costs',
      cost: Number((stats.electricityCost * qty).toFixed(2)),
      description: `${(stats.electricityKwh * qty).toFixed(2)} kWh (~120W printer load)`,
      color: '#f59e0b',
      percentage: Number(((stats.electricityCost / (stats.recommendedRetailPrice || 1)) * 100).toFixed(1)),
    },
    {
      category: 'Service Fees',
      cost: Number((stats.totalServiceFees * qty).toFixed(2)),
      description: `Etsy 6.5% + payment 3.5% + $${(stats.packagingCost * qty).toFixed(2)} packaging`,
      color: '#ec4899',
      percentage: Number(((stats.totalServiceFees / (stats.recommendedRetailPrice || 1)) * 100).toFixed(1)),
    },
    {
      category: 'Net Profit',
      cost: Number((stats.netProfit * qty).toFixed(2)),
      description: `Take-home earnings (${stats.profitMargin}% margin)`,
      color: '#10b981',
      percentage: stats.profitMargin,
    },
  ];

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-700/90 rounded-xl p-3 shadow-2xl text-xs space-y-1 z-50">
          <div className="font-bold text-slate-100 flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.color }}
            />
            <span>{data.category}</span>
          </div>
          <div className="text-base font-black font-mono" style={{ color: data.color }}>
            ${data.cost.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400">
            {data.description}
          </div>
          <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
            {data.percentage}% of retail revenue
          </div>
        </div>
      );
    }
    return null;
  };

  const primaryIssue = printability.issues[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* WARNING TOAST NOTIFICATION: STRUCTURAL / OVERHANG ISSUES */}
      {printability.issues.length > 0 && !isToastDismissed && primaryIssue && (
        <div
          className={`p-3.5 rounded-2xl border shadow-2xl transition-all duration-300 flex flex-col gap-2.5 animate-fadeIn ${
            primaryIssue.severity === 'critical'
              ? 'bg-rose-950/90 border-rose-500/80 text-rose-100 shadow-rose-950/50'
              : 'bg-amber-950/90 border-amber-500/80 text-amber-100 shadow-amber-950/50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  primaryIssue.severity === 'critical'
                    ? 'bg-rose-900/60 text-rose-300 border border-rose-500/60 animate-pulse'
                    : 'bg-amber-900/60 text-amber-300 border border-amber-500/60 animate-pulse'
                }`}
              >
                {primaryIssue.severity === 'critical' ? (
                  <ShieldAlert className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      primaryIssue.severity === 'critical'
                        ? 'bg-rose-500 text-slate-950'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    Printability Warning
                  </span>
                  <span className="text-xs font-bold text-white">
                    {primaryIssue.title}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {primaryIssue.message}
                </p>
                <p className="text-[11px] text-slate-300/90 font-medium">
                  💡 {primaryIssue.recommendation}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsToastDismissed(true)}
              className="p-1 rounded-lg hover:bg-black/30 text-slate-400 hover:text-white transition shrink-0"
              title="Dismiss warning notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Auto-Fix Action Bar in Toast */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
            <span className="text-[11px] text-slate-300 font-mono">
              Score: <strong className="text-white">{printability.score}/100</strong> ({printability.issues.length} issue{printability.issues.length > 1 ? 's' : ''})
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllIssues(!showAllIssues)}
                className="text-[11px] text-slate-300 hover:text-white underline underline-offset-2"
              >
                {showAllIssues ? 'Collapse Diagnostics' : 'Inspect All Checks'}
              </button>

              {primaryIssue.autoFixLabel && (
                <button
                  onClick={() => handleAutoFix(primaryIssue)}
                  className={`px-3 py-1 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5 ${
                    primaryIssue.severity === 'critical'
                      ? 'bg-white text-rose-950 hover:bg-rose-100'
                      : 'bg-amber-400 text-amber-950 hover:bg-amber-300'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{primaryIssue.autoFixLabel}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">3D Printing Slicer Settings</h3>
            <p className="text-[11px] text-slate-400">Tuned for Bambu Lab, Prusa, Creality & Resin</p>
          </div>
        </div>

        <span className="text-[11px] font-medium px-2.5 py-1 bg-emerald-950/60 text-emerald-300 rounded-lg border border-emerald-800/60 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {stats.profitMargin}% Etsy Margin
        </span>
      </div>

      {/* PRINTABILITY & STRUCTURAL PRE-FLIGHT CHECK */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                printability.status === 'passed'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : printability.status === 'warning'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
              }`}
            >
              {printability.status === 'passed' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <ShieldAlert className="w-4 h-4" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-100">Printability Pre-Flight Check</h4>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    printability.status === 'passed'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : printability.status === 'warning'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  }`}
                >
                  {printability.status === 'passed'
                    ? '100% Slicer Ready'
                    : `${printability.score}/100 - Issues Detected`}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {printability.summary}
              </p>
            </div>
          </div>

          <button
            onClick={handleManualRecheck}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
            title="Re-run structural and overhang geometry analysis"
          >
            <RefreshCw className={`w-3 h-3 ${isRechecking ? 'animate-spin text-blue-400' : ''}`} />
            <span>Scan</span>
          </button>
        </div>

        {/* Structural Metrics Radar Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Wall Thickness</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-bold font-mono text-slate-100">
                {printability.metrics.wallThicknessMm} mm
              </span>
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                  printability.metrics.wallThicknessMm >= 1.2
                    ? 'text-emerald-400 bg-emerald-950/60'
                    : 'text-amber-400 bg-amber-950/60'
                }`}
              >
                {printability.metrics.wallThicknessMm >= 1.2 ? 'Safe' : 'Thin'}
              </span>
            </div>
          </div>

          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Max Overhang</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-bold font-mono text-slate-100">
                {printability.metrics.maxOverhangAngleDeg}°
              </span>
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                  printability.metrics.maxOverhangAngleDeg <= 45
                    ? 'text-emerald-400 bg-emerald-950/60'
                    : 'text-rose-400 bg-rose-950/60'
                }`}
              >
                {printability.metrics.maxOverhangAngleDeg <= 45 ? '≤45° Safe' : '>45° Steep'}
              </span>
            </div>
          </div>

          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Slicer Supports</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-bold font-mono text-slate-100">
                {p.supportsNeeded ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => onChangePrintSettings({ supportsNeeded: !p.supportsNeeded })}
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded transition ${
                  p.supportsNeeded
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.supportsNeeded ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Aspect Ratio</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-bold font-mono text-slate-100">
                {printability.metrics.aspectRatio}:1
              </span>
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                  printability.metrics.aspectRatio < 2.5
                    ? 'text-emerald-400 bg-emerald-950/60'
                    : 'text-amber-400 bg-amber-950/60'
                }`}
              >
                {printability.metrics.aspectRatio < 2.5 ? 'Stable' : 'Slender'}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Issues Accordion */}
        {printability.issues.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <button
              onClick={() => setShowAllIssues(!showAllIssues)}
              className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white py-1 transition"
            >
              <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Detected Structural Findings ({printability.issues.length})</span>
              </span>
              {showAllIssues ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showAllIssues && (
              <div className="space-y-2 pt-1 animate-fadeIn">
                {printability.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            issue.severity === 'critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : issue.severity === 'warning'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {issue.severity}
                        </span>
                        <span className="font-bold text-slate-100">{issue.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {issue.message}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Recommendation: {issue.recommendation}
                      </p>
                    </div>

                    {issue.autoFixLabel && (
                      <button
                        onClick={() => handleAutoFix(issue)}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Wrench className="w-3 h-3" />
                        <span>{issue.autoFixLabel}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* DEDICATED MATERIAL WEIGHT ESTIMATOR */}
      <div className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 rounded-2xl border border-indigo-500/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <span>Material Weight Estimator</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80">
                  {p.material} ({stats.density} g/cm³)
                </span>
              </h4>
              <p className="text-[10px] text-slate-400">
                Calculated from dimensions, wall shells, infill density & material density
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
          >
            <Info className="w-3 h-3" />
            <span>{showFormulaDetails ? 'Hide Formula' : 'Formula'}</span>
          </button>
        </div>

        {/* Primary Weight Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-indigo-500/40 relative overflow-hidden">
            <span className="text-[11px] text-slate-400 block font-medium">Estimated Part Weight</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-100 font-mono tracking-tight">
                {currentWeight}
              </span>
              <span className="text-xs text-indigo-400 font-mono font-bold">grams</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Total volume: {stats.volumeCm3} cm³
            </span>
          </div>

          <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Solid Perimeter Shell</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-slate-200 font-mono">
                {Number((stats.solidShellVolumeCm3 * stats.density).toFixed(1))}
              </span>
              <span className="text-xs text-slate-400 font-mono">grams</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {stats.solidShellVolumeCm3} cm³ ({p.wallCount} perimeter loops)
            </span>
          </div>

          <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">Internal Infill</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-bold text-slate-200 font-mono">
                {Number((stats.infillVolumeCm3 * stats.density).toFixed(1))}
              </span>
              <span className="text-xs text-slate-400 font-mono">grams</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {stats.infillVolumeCm3} cm³ ({p.infillDensity}% {p.infillPattern})
            </span>
          </div>
        </div>

        {/* Material Density Benchmark Comparison Table */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Material Density Comparison</span>
            <span className="text-[10px] text-indigo-400 font-mono">Click to Switch Active Material</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {materials.map((mat) => {
              const weightForMat = stats.materialWeights[mat.id as keyof typeof stats.materialWeights];
              const isSelected = p.material === mat.id;
              const plaWeight = stats.materialWeights.PLA;
              const diffPercent = (((weightForMat - plaWeight) / plaWeight) * 100).toFixed(1);
              const isDiffZero = Math.abs(Number(diffPercent)) < 0.1;

              return (
                <button
                  key={mat.id}
                  onClick={() => onChangePrintSettings({ material: mat.id })}
                  className={`p-2.5 rounded-xl text-left border transition relative ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-400 ring-1 ring-indigo-400/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${mat.color}`}>
                      {mat.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {mat.density}g/cm³
                    </span>
                  </div>

                  <div className="text-sm font-black font-mono text-slate-100 mt-1">
                    {weightForMat}g
                  </div>

                  <div className="flex items-center justify-between text-[9px] mt-1 text-slate-400">
                    <span>vs PLA:</span>
                    <span
                      className={`font-mono font-medium ${
                        isSelected
                          ? 'text-indigo-300'
                          : Number(diffPercent) > 0
                          ? 'text-amber-400'
                          : Number(diffPercent) < 0
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {isSelected
                        ? 'Active'
                        : isDiffZero
                        ? '0.0%'
                        : Number(diffPercent) > 0
                        ? `+${diffPercent}%`
                        : `${diffPercent}%`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Mathematical Formula Drawer */}
        {showFormulaDetails && (
          <div className="p-3.5 bg-slate-950 rounded-xl border border-indigo-900/50 text-[11px] text-slate-300 space-y-2 font-mono leading-relaxed">
            <div className="text-indigo-400 font-bold">
              Weight Calculation Formula:
            </div>
            <div>
              1. Bounding Box: {design.dimensions.width}mm × {design.dimensions.depth || design.dimensions.width}mm × {design.dimensions.height}mm = {((design.dimensions.width * (design.dimensions.depth || design.dimensions.width) * design.dimensions.height) / 1000).toFixed(1)} cm³
            </div>
            <div>
              2. Shell Volume: {stats.solidShellVolumeCm3} cm³ (perimeters: {p.wallCount}x, top: {p.topLayers}x, bottom: {p.bottomLayers}x)
            </div>
            <div>
              3. Infill Volume: {stats.infillVolumeCm3} cm³ ({p.infillDensity}% {p.infillPattern})
            </div>
            <div>
              4. Total Volume: {stats.solidShellVolumeCm3} + {stats.infillVolumeCm3} = {stats.volumeCm3} cm³
            </div>
            <div className="text-emerald-400 font-bold">
              5. Final Weight: {stats.volumeCm3} cm³ × {stats.density} g/cm³ ({p.material}) = {stats.weightGrams} grams
            </div>
          </div>
        )}
      </div>

      {/* RECHARTS BAR CHART: MATERIAL USAGE, ENERGY COSTS & SERVICE FEES */}
      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <span>Production & Cost Breakdown</span>
                <span className="text-[10px] text-blue-400 font-medium bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-900/60">
                  Recharts Visualizer
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-900/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Reactive
                </span>
              </h4>
              <p className="text-[10px] text-slate-400">
                Material usage, energy consumption, and marketplace fees smoothly animated upon setting adjustments
              </p>
            </div>
          </div>

          {/* Batch Multiplier Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
            <span className="text-slate-400 px-1.5 text-[10px] font-medium">Batch:</span>
            {[1, 5, 10, 25].map((q) => (
              <button
                key={q}
                onClick={() => setBatchQuantity(q)}
                className={`px-2 py-0.5 rounded-lg font-mono font-medium transition ${
                  batchQuantity === q
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {q}x
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Bar Chart Container with Entrance Animations */}
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              key={chartAnimationKey}
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
              <Bar
                dataKey="cost"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationDuration={750}
                animationEasing="ease-out"
                animationBegin={60}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Metric Badges under Chart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800 transition-all duration-300">
            <span className="text-[10px] text-blue-400 flex items-center gap-1 font-medium">
              <Weight className="w-3 h-3" /> Raw Material
            </span>
            <p className="text-sm font-bold text-slate-100 font-mono mt-0.5">
              ${(stats.materialCost * qty).toFixed(2)}
            </p>
            <span className="text-[9px] text-slate-400">
              {(stats.weightGrams * qty).toFixed(1)}g total
            </span>
          </div>

          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800 transition-all duration-300">
            <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
              <Zap className="w-3 h-3" /> Energy Cost
            </span>
            <p className="text-sm font-bold text-slate-100 font-mono mt-0.5">
              ${(stats.electricityCost * qty).toFixed(2)}
            </p>
            <span className="text-[9px] text-slate-400">
              {(stats.electricityKwh * qty).toFixed(2)} kWh
            </span>
          </div>

          <div className="p-2 bg-slate-900/60 rounded-xl border border-slate-800 transition-all duration-300">
            <span className="text-[10px] text-pink-400 flex items-center gap-1 font-medium">
              <ShoppingBag className="w-3 h-3" /> Platform & Fees
            </span>
            <p className="text-sm font-bold text-slate-100 font-mono mt-0.5">
              ${(stats.totalServiceFees * qty).toFixed(2)}
            </p>
            <span className="text-[9px] text-slate-400">
              Etsy fees + mailer
            </span>
          </div>

          <div className="p-2 bg-slate-900/60 rounded-xl border border-emerald-900/40 bg-emerald-950/10 transition-all duration-300">
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Net Profit
            </span>
            <p className="text-sm font-bold text-emerald-300 font-mono mt-0.5">
              +${(stats.netProfit * qty).toFixed(2)}
            </p>
            <span className="text-[9px] text-emerald-400/80 font-medium">
              {stats.profitMargin}% profit margin
            </span>
          </div>
        </div>
      </div>

      {/* Etsy Maker Economics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" /> Print Time
          </span>
          <p className="text-base font-bold text-slate-100 font-mono">
            {Math.floor(stats.printTimeHours)}h {Math.round((stats.printTimeHours % 1) * 60)}m
          </p>
          <span className="text-[10px] text-slate-500">{stats.layerCount} layers</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-slate-500" /> Raw Filament
          </span>
          <p className="text-base font-bold text-amber-400 font-mono">${stats.materialCost}</p>
          <span className="text-[10px] text-slate-500">COGS: ${stats.totalCogs}</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" /> Etsy Retail
          </span>
          <p className="text-base font-bold text-emerald-400 font-mono">${stats.recommendedRetailPrice}</p>
          <span className="text-[10px] text-emerald-300 font-medium">+${stats.netProfit} profit</span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Package className="w-3 h-3 text-blue-400" /> Spool Yield
          </span>
          <p className="text-base font-bold text-blue-300 font-mono">~{stats.partsPerSpool} pcs</p>
          <span className="text-[10px] text-slate-500">1kg Spool</span>
        </div>
      </div>

      {/* Layer Height Tuning */}
      <div>
        <div className="flex justify-between text-xs mb-1.5 font-medium">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Layer Height (Resolution)
          </span>
          <span className="text-indigo-300 font-mono font-semibold">{p.layerHeight} mm</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { val: 0.12, label: '0.12 mm', sub: 'Jewelry / Ultra' },
            { val: 0.16, label: '0.16 mm', sub: 'Fine Quality' },
            { val: 0.20, label: '0.20 mm', sub: 'Standard Balance' },
            { val: 0.28, label: '0.28 mm', sub: 'Draft / Fast' },
          ].map((lh) => (
            <button
              key={lh.val}
              onClick={() => onChangePrintSettings({ layerHeight: lh.val })}
              className={`p-2 rounded-xl text-center border transition ${
                p.layerHeight === lh.val
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="text-xs font-bold font-mono">{lh.label}</div>
              <div className="text-[9px] text-slate-400">{lh.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Infill Density & Pattern */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1.5 font-medium">
            <span className="text-slate-300">Infill Density (Directly impacts weight & strength)</span>
            <span className="text-slate-200 font-mono">{p.infillDensity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={p.infillDensity}
            onChange={(e) => onChangePrintSettings({ infillDensity: Number(e.target.value) })}
            className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
            <span>0% Hollow ({Number((stats.solidShellVolumeCm3 * stats.density).toFixed(1))}g)</span>
            <span>15% Eco</span>
            <span>40% Heavy</span>
            <span>100% Solid ({Number(((stats.solidShellVolumeCm3 + stats.infillVolumeCm3 * (100 / (p.infillDensity || 1))) * stats.density).toFixed(1))}g)</span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-300 font-medium mb-1.5">Infill Pattern</label>
          <div className="grid grid-cols-3 gap-2">
            {infillPatterns.map((ip) => (
              <button
                key={ip.id}
                onClick={() => onChangePrintSettings({ infillPattern: ip.id })}
                className={`p-2 rounded-xl text-left border transition ${
                  p.infillPattern === ip.id
                    ? 'bg-emerald-600/15 border-emerald-500 text-emerald-200'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-semibold text-slate-200">{ip.name}</div>
                <div className="text-[9px] text-slate-400 truncate">{ip.badge}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Wall Loops, Slicer Supports & Filament Cost */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
        <div>
          <label className="block text-xs text-slate-300 font-medium mb-1">
            Wall Perimeters (Shells)
          </label>
          <div className="flex items-center gap-1.5">
            {[2, 3, 4, 5].map((w) => (
              <button
                key={w}
                onClick={() => onChangePrintSettings({ wallCount: w })}
                className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition ${
                  p.wallCount === w
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {w}x
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-300 font-medium mb-1">
            Slicer Supports
          </label>
          <button
            onClick={() => onChangePrintSettings({ supportsNeeded: !p.supportsNeeded })}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition border ${
              p.supportsNeeded
                ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{p.supportsNeeded ? 'Supports Enabled' : 'No Supports'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                p.supportsNeeded ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-xs text-slate-300 font-medium mb-1">
            Spool Cost ($/kg)
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">$</span>
            <input
              type="number"
              min="10"
              max="150"
              value={p.filamentCostPerKg || 20}
              onChange={(e) => onChangePrintSettings({ filamentCostPerKg: Number(e.target.value) })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
