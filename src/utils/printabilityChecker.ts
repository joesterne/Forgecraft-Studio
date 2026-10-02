import * as THREE from 'three';
import { CADDesign, PrintSettings, ModelDimensions } from '../types/cad';
import { buildParametricGeometry } from './geometryGenerators';

export interface PrintabilityIssue {
  id: string;
  type: 'thin_wall' | 'steep_overhang' | 'unsupported_bridge' | 'bed_adhesion' | 'layer_ratio';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  recommendation: string;
  autoFixLabel?: string;
  suggestedDimensions?: Partial<ModelDimensions>;
  suggestedPrintSettings?: Partial<PrintSettings>;
}

export interface PrintabilityReport {
  score: number; // 0 to 100
  status: 'passed' | 'warning' | 'critical';
  summary: string;
  issues: PrintabilityIssue[];
  metrics: {
    wallThicknessMm: number;
    recommendedMinWallMm: number;
    maxOverhangAngleDeg: number;
    steepOverhangPercent: number;
    aspectRatio: number;
    layerHeightMm: number;
    supportsActive: boolean;
    hasSteepOverhangs: boolean;
    hasThinWalls: boolean;
  };
}

/**
 * Analyzes CAD design geometry and slicer settings for physical 3D printability issues.
 * Detects thin walls below nozzle diameter, steep downward overhangs, bed adhesion risks, and layer ratios.
 */
export function analyzePrintability(design: CADDesign): PrintabilityReport {
  const issues: PrintabilityIssue[] = [];
  const dims = design.dimensions;
  const print = design.printSettings;

  const wallThickness = dims.wallThickness ?? 2.0;
  const width = dims.width || 50;
  const depth = dims.depth || width;
  const height = dims.height || 40;
  const layerHeight = print.layerHeight || 0.2;
  const nozzleDiameter = 0.4; // Industry standard FDM nozzle

  // 1. Geometry Normal Analysis (Overhangs)
  let maxOverhangAngleDeg = 0;
  let steepOverhangCount = 0;
  let totalDownwardTriangles = 0;
  let totalTriangles = 0;

  try {
    const geometry = buildParametricGeometry(design.modelType, dims);
    const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    nonIndexed.computeVertexNormals();

    const normalAttr = nonIndexed.getAttribute('normal');
    if (normalAttr) {
      totalTriangles = Math.floor(normalAttr.count / 3);

      for (let i = 0; i < totalTriangles; i++) {
        const v0 = i * 3;
        // Average face normal from vertices
        const ny = (normalAttr.getY(v0) + normalAttr.getY(v0 + 1) + normalAttr.getY(v0 + 2)) / 3;

        // In Three.js: +Y is UP, -Y is DOWN towards the print bed.
        // Downward facing normals have ny < -0.01
        if (ny < -0.01) {
          totalDownwardTriangles++;
          // Overhang angle from vertical (0 deg = vertical wall, 90 deg = horizontal flat ceiling)
          const angleDeg = Math.asin(Math.min(1.0, Math.max(0.0, Math.abs(ny)))) * (180 / Math.PI);

          if (angleDeg > maxOverhangAngleDeg) {
            maxOverhangAngleDeg = angleDeg;
          }

          // Angles > 45° from vertical are generally unsupported without cooling/supports
          if (angleDeg > 45) {
            steepOverhangCount++;
          }
        }
      }
    }
    nonIndexed.dispose();
    geometry.dispose();
  } catch (err) {
    console.warn('Error analyzing geometry normals for printability:', err);
  }

  const steepOverhangPercent = totalTriangles > 0
    ? Number(((steepOverhangCount / totalTriangles) * 100).toFixed(1))
    : 0;

  const hasSteepOverhangs = maxOverhangAngleDeg > 48;
  const hasThinWalls = wallThickness < 1.0;

  // 2. Evaluate Thin Walls
  if (wallThickness < 0.75) {
    issues.push({
      id: 'crit_thin_wall',
      type: 'thin_wall',
      severity: 'critical',
      title: `Critically Thin Wall (${wallThickness}mm)`,
      message: `Wall thickness (${wallThickness}mm) is thinner than two nozzle passes (${(nozzleDiameter * 2).toFixed(1)}mm). Slicers may omit perimeter shells or cause delamination.`,
      recommendation: `Increase wall thickness to at least 1.6mm (4 perimeter loops) for durable Etsy products.`,
      autoFixLabel: 'Fix: Set Safe 1.6mm Walls',
      suggestedDimensions: { wallThickness: 1.6 },
    });
  } else if (wallThickness < 1.2) {
    issues.push({
      id: 'warn_thin_wall',
      type: 'thin_wall',
      severity: 'warning',
      title: `Marginal Wall Thickness (${wallThickness}mm)`,
      message: `A ${wallThickness}mm wall may flex under load or show infill bleed-through on translucent filaments.`,
      recommendation: `Increase to 1.8mm - 2.4mm for rigid structural durability.`,
      autoFixLabel: 'Optimize: Set 2.0mm Walls',
      suggestedDimensions: { wallThickness: 2.0 },
    });
  }

  // 3. Evaluate Cutter Blade Edge (For Clay / Cookie Cutters)
  if (design.modelType === 'cutter' && dims.cuttingEdgeThickness && dims.cuttingEdgeThickness < 0.4) {
    issues.push({
      id: 'warn_cutter_edge',
      type: 'thin_wall',
      severity: 'warning',
      title: `Extremely Sharp Blade Edge (${dims.cuttingEdgeThickness}mm)`,
      message: `Standard 0.4mm FDM nozzles cannot cleanly resolve edges under 0.4mm. The slicer will step or blunt this line.`,
      recommendation: `Use 0.6mm - 0.8mm for FDM printing, or switch to SLA Resin for razor-sharp edges.`,
      autoFixLabel: 'Set 0.7mm FDM Cutting Edge',
      suggestedDimensions: { cuttingEdgeThickness: 0.7 },
    });
  }

  // 4. Evaluate Overhangs vs Slicer Support Settings
  if (hasSteepOverhangs && !print.supportsNeeded) {
    const isExtreme = maxOverhangAngleDeg >= 65;
    issues.push({
      id: 'warn_overhangs_no_support',
      type: 'steep_overhang',
      severity: isExtreme ? 'critical' : 'warning',
      title: `Steep Downward Overhang (${Math.round(maxOverhangAngleDeg)}°)`,
      message: `Detected underside faces sloped at ${Math.round(maxOverhangAngleDeg)}° from vertical without supports enabled in your slicer settings. Molten filament may droop.`,
      recommendation: `Enable "Supports Needed" in Slicer settings or adjust model bevel/chamfer to 45° or less.`,
      autoFixLabel: 'Enable Slicer Supports',
      suggestedPrintSettings: { supportsNeeded: true },
    });
  }

  // 5. Evaluate Aspect Ratio & Bed Adhesion
  const baseFootprint = Math.min(width, depth);
  const aspectRatio = Number((height / (baseFootprint || 1)).toFixed(2));
  if (aspectRatio > 2.8) {
    issues.push({
      id: 'warn_tall_aspect_ratio',
      type: 'bed_adhesion',
      severity: 'warning',
      title: `Tall Slender Geometry (${aspectRatio}:1 Height-to-Width)`,
      message: `Tall models with a narrow base risk wobbling or detaching from the build plate due to nozzle friction near top layers.`,
      recommendation: `Use a 5mm outer brim in slicer or slightly widen base footprint to at least ${Math.round(height * 0.45)}mm.`,
      autoFixLabel: 'Widen Base Footprint',
      suggestedDimensions: { width: Math.max(width, Math.round(height * 0.45)), depth: Math.max(depth, Math.round(height * 0.45)) },
    });
  }

  // 6. Evaluate Layer Height Resolution
  if (layerHeight > 0.28 && (design.modelType === 'keychain' || design.modelType === 'coaster')) {
    issues.push({
      id: 'info_layer_resolution',
      type: 'layer_ratio',
      severity: 'info',
      title: `Coarse Layer Height (${layerHeight}mm)`,
      message: `A layer height of ${layerHeight}mm reduces print time but causes stair-stepping on relief text and detailed patterns.`,
      recommendation: `Set layer height to 0.16mm or 0.20mm for crisp Etsy buyer presentation.`,
      autoFixLabel: 'Set 0.16mm High Detail',
      suggestedPrintSettings: { layerHeight: 0.16 },
    });
  }

  // Calculate Overall Printability Score (0 to 100)
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 30;
    else if (issue.severity === 'warning') score -= 15;
    else if (issue.severity === 'info') score -= 5;
  }
  score = Math.max(10, Math.min(100, score));

  let status: 'passed' | 'warning' | 'critical' = 'passed';
  if (score < 60 || issues.some((i) => i.severity === 'critical')) {
    status = 'critical';
  } else if (score < 85 || issues.some((i) => i.severity === 'warning')) {
    status = 'warning';
  }

  let summary = 'Geometry passes all structural and slicing checks for 0.4mm nozzle FDM/Resin printers.';
  if (status === 'critical') {
    summary = 'Structural issues detected that may cause print failures or slicer errors.';
  } else if (status === 'warning') {
    summary = 'Printable with caution; recommended adjustments will improve surface quality and reliability.';
  }

  return {
    score,
    status,
    summary,
    issues,
    metrics: {
      wallThicknessMm: wallThickness,
      recommendedMinWallMm: 1.6,
      maxOverhangAngleDeg: Math.round(maxOverhangAngleDeg),
      steepOverhangPercent,
      aspectRatio,
      layerHeightMm: layerHeight,
      supportsActive: print.supportsNeeded,
      hasSteepOverhangs,
      hasThinWalls,
    },
  };
}
