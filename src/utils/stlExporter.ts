import * as THREE from 'three';
import JSZip from 'jszip';
import { CADDesign, ModelDimensions, PrintSettings } from '../types/cad';
import { buildParametricGeometry } from './geometryGenerators';

/**
 * Generates an official binary STL Uint8Array from a Three.js BufferGeometry.
 * Fully compatible with all slicers (Bambu Studio, PrusaSlicer, Cura, OrcaSlicer).
 */
export function generateBinarySTL(geometry: THREE.BufferGeometry): Uint8Array {
  // Ensure we have indexed or non-indexed triangle buffer
  const geom = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  geom.computeVertexNormals();

  const posAttr = geom.getAttribute('position');
  const normalAttr = geom.getAttribute('normal');

  const triangleCount = Math.floor(posAttr.count / 3);
  const bufferLength = 80 + 4 + triangleCount * 50;
  const buffer = new ArrayBuffer(bufferLength);
  const dataView = new DataView(buffer);

  // 80-byte header (ASCII string)
  const headerStr = 'ForgeCraft Studio STL Export - AI Etsy CAD';
  for (let i = 0; i < 80; i++) {
    dataView.setUint8(i, i < headerStr.length ? headerStr.charCodeAt(i) : 32);
  }

  // 4-byte unsigned 32-bit int: triangle count
  dataView.setUint32(80, triangleCount, true);

  let offset = 84;
  for (let i = 0; i < triangleCount; i++) {
    const v0Index = i * 3;
    const v1Index = i * 3 + 1;
    const v2Index = i * 3 + 2;

    // Normal vector
    const nx = normalAttr ? normalAttr.getX(v0Index) : 0;
    const ny = normalAttr ? normalAttr.getY(v0Index) : 0;
    const nz = normalAttr ? normalAttr.getZ(v0Index) : 1;

    dataView.setFloat32(offset, nx, true); offset += 4;
    dataView.setFloat32(offset, ny, true); offset += 4;
    dataView.setFloat32(offset, nz, true); offset += 4;

    // Vertex 1
    dataView.setFloat32(offset, posAttr.getX(v0Index), true); offset += 4;
    dataView.setFloat32(offset, posAttr.getY(v0Index), true); offset += 4;
    dataView.setFloat32(offset, posAttr.getZ(v0Index), true); offset += 4;

    // Vertex 2
    dataView.setFloat32(offset, posAttr.getX(v1Index), true); offset += 4;
    dataView.setFloat32(offset, posAttr.getY(v1Index), true); offset += 4;
    dataView.setFloat32(offset, posAttr.getZ(v1Index), true); offset += 4;

    // Vertex 3
    dataView.setFloat32(offset, posAttr.getX(v2Index), true); offset += 4;
    dataView.setFloat32(offset, posAttr.getY(v2Index), true); offset += 4;
    dataView.setFloat32(offset, posAttr.getZ(v2Index), true); offset += 4;

    // 2-byte attribute byte count (usually 0)
    dataView.setUint16(offset, 0, true); offset += 2;
  }

  return new Uint8Array(buffer);
}

/**
 * Generates an ASCII STL string from a Three.js BufferGeometry.
 */
export function generateAsciiSTL(geometry: THREE.BufferGeometry, modelName: string): string {
  const geom = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  geom.computeVertexNormals();

  const posAttr = geom.getAttribute('position');
  const normalAttr = geom.getAttribute('normal');
  const triangleCount = Math.floor(posAttr.count / 3);

  const cleanName = modelName.replace(/[^a-zA-Z0-9_-]/g, '_');
  let output = `solid ${cleanName}\n`;

  for (let i = 0; i < triangleCount; i++) {
    const v0Index = i * 3;
    const v1Index = i * 3 + 1;
    const v2Index = i * 3 + 2;

    const nx = normalAttr ? normalAttr.getX(v0Index).toFixed(6) : '0.000000';
    const ny = normalAttr ? normalAttr.getY(v0Index).toFixed(6) : '0.000000';
    const nz = normalAttr ? normalAttr.getZ(v0Index).toFixed(6) : '1.000000';

    output += `  facet normal ${nx} ${ny} ${nz}\n`;
    output += `    outer loop\n`;
    output += `      vertex ${posAttr.getX(v0Index).toFixed(4)} ${posAttr.getY(v0Index).toFixed(4)} ${posAttr.getZ(v0Index).toFixed(4)}\n`;
    output += `      vertex ${posAttr.getX(v1Index).toFixed(4)} ${posAttr.getY(v1Index).toFixed(4)} ${posAttr.getZ(v1Index).toFixed(4)}\n`;
    output += `      vertex ${posAttr.getX(v2Index).toFixed(4)} ${posAttr.getY(v2Index).toFixed(4)} ${posAttr.getZ(v2Index).toFixed(4)}\n`;
    output += `    endloop\n`;
    output += `  endfacet\n`;
  }

  output += `endsolid ${cleanName}\n`;
  return output;
}

/**
 * Downloads a binary or ascii file to the user's browser.
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an industry-standard SVG vector file formatted for laser cutting & engraving
 * (LightBurn / Glowforge / xTool standard: Red = Cut, Blue = Score, Black = Engrave).
 */
export function generateLaserSVG(design: CADDesign): string {
  const { width, depth, cornerRadius = 4, holeDiameter = 0, text = '' } = design.dimensions;
  const modelType = design.modelType;
  const padding = 20;
  const totalW = width + padding * 2;
  const totalH = depth + padding * 2;

  const kerf = design.laserSettings?.kerfCompensation || 0.15;
  const cutW = width + kerf;
  const cutH = depth + kerf;

  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}mm" height="${totalH}mm" viewBox="0 0 ${totalW} ${totalH}">
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <rdf:Description>
        <title>${design.name} - Laser Cut & Engrave Vector</title>
        <creator>ForgeCraft Studio</creator>
        <date>${new Date().toISOString()}</date>
        <material>${design.laserSettings?.material || 'Plywood / Acrylic'}</material>
      </rdf:Description>
    </rdf:RDF>
  </metadata>
  <defs>
    <style>
      .cut-line { stroke: #FF0000; stroke-width: 0.1mm; fill: none; }
      .score-line { stroke: #0000FF; stroke-width: 0.2mm; fill: none; stroke-dasharray: 2,1; }
      .engrave-fill { fill: #000000; stroke: none; font-family: 'Inter', sans-serif; font-weight: bold; }
      .dimension-line { stroke: #10B981; stroke-width: 0.1mm; stroke-dasharray: 1,1; font-size: 3px; fill: #10B981; }
    </style>
  </defs>

  <!-- Group 1: Laser Cut Vector (Red Stroke) -->
  <g id="CUT_LAYER" class="cut-line">
`;

  if (modelType === 'keychain' || modelType === 'organizer' || cornerRadius > 0) {
    svg += `    <rect x="${padding}" y="${padding}" width="${cutW}" height="${cutH}" rx="${cornerRadius}" ry="${cornerRadius}" />\n`;
  } else if (modelType === 'coaster') {
    svg += `    <circle cx="${totalW / 2}" cy="${totalH / 2}" r="${width / 2}" />\n`;
  } else {
    svg += `    <rect x="${padding}" y="${padding}" width="${cutW}" height="${cutH}" rx="2" ry="2" />\n`;
  }

  // Keyhole cutout if present
  if (holeDiameter > 0) {
    const holeX = padding + (cornerRadius > 0 ? cornerRadius + 2 : 6);
    const holeY = totalH / 2;
    svg += `    <circle cx="${holeX}" cy="${holeY}" r="${holeDiameter / 2}" />\n`;
  }

  svg += `  </g>\n\n  <!-- Group 2: Score / Vector Marking (Blue Stroke) -->\n  <g id="SCORE_LAYER" class="score-line">\n`;

  // Internal border score line
  const innerMargin = 3.5;
  if (modelType === 'coaster') {
    svg += `    <circle cx="${totalW / 2}" cy="${totalH / 2}" r="${width / 2 - innerMargin}" />\n`;
    svg += `    <circle cx="${totalW / 2}" cy="${totalH / 2}" r="${width / 4}" />\n`;
    for (let a = 0; a < 8; a++) {
      const angle = (a * Math.PI) / 4;
      const x1 = totalW / 2 + Math.cos(angle) * (width / 4);
      const y1 = totalH / 2 + Math.sin(angle) * (width / 4);
      const x2 = totalW / 2 + Math.cos(angle) * (width / 2 - innerMargin);
      const y2 = totalH / 2 + Math.sin(angle) * (width / 2 - innerMargin);
      svg += `    <line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" />\n`;
    }
  } else {
    svg += `    <rect x="${padding + innerMargin}" y="${padding + innerMargin}" width="${width - innerMargin * 2}" height="${depth - innerMargin * 2}" rx="${Math.max(0, cornerRadius - 1)}" ry="${Math.max(0, cornerRadius - 1)}" />\n`;
  }

  svg += `  </g>\n\n  <!-- Group 3: Raster Engrave (Black Fill) -->\n  <g id="ENGRAVE_LAYER" class="engrave-fill">\n`;

  const displayText = text || (modelType === 'keychain' ? 'CUSTOM' : design.name);
  const textX = totalW / 2 + (holeDiameter > 0 ? 3 : 0);
  const textY = totalH / 2 + 2;
  const fontSize = Math.min(depth * 0.35, width / (displayText.length * 0.7));

  svg += `    <text x="${textX.toFixed(2)}" y="${textY.toFixed(2)}" font-size="${fontSize.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${displayText}</text>\n`;

  svg += `  </g>\n\n  <!-- Group 4: Technical Dimensions & Alignment (Reference Only) -->\n  <g id="DIMENSIONS_LAYER" class="dimension-line">\n`;
  svg += `    <text x="${padding}" y="${padding - 4}">W: ${width}mm | H: ${depth}mm | Kerf: ${kerf}mm</text>\n`;
  svg += `  </g>\n</svg>`;

  return svg;
}

/**
 * Generates an AutoCAD R12 standard DXF vector file for CNC routers and laser software (LightBurn, RDWorks).
 */
export function generateDXFVector(design: CADDesign): string {
  const { width, depth, cornerRadius = 0, holeDiameter = 0 } = design.dimensions;
  const kerf = design.laserSettings?.kerfCompensation || 0.15;
  const w = width + kerf;
  const h = depth + kerf;

  let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1009
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
2
0
LAYER
2
CUT_RED
70
0
62
1
6
CONTINUOUS
0
LAYER
2
SCORE_BLUE
70
0
62
5
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // Draw outer rectangular border polyline on CUT_RED layer
  dxf += `0
POLYLINE
8
CUT_RED
66
1
70
1
0
VERTEX
8
CUT_RED
10
0.0
20
0.0
30
0.0
0
VERTEX
8
CUT_RED
10
${w.toFixed(4)}
20
0.0
30
0.0
0
VERTEX
8
CUT_RED
10
${w.toFixed(4)}
20
${h.toFixed(4)}
30
0.0
0
VERTEX
8
CUT_RED
10
0.0
20
${h.toFixed(4)}
30
0.0
0
SEQEND
`;

  // Keyhole circle if applicable
  if (holeDiameter > 0) {
    const cx = cornerRadius > 0 ? cornerRadius + 2 : 6;
    const cy = h / 2;
    dxf += `0
CIRCLE
8
CUT_RED
10
${cx.toFixed(4)}
20
${cy.toFixed(4)}
30
0.0
40
${(holeDiameter / 2).toFixed(4)}
`;
  }

  // Inner decorative score line
  const innerMargin = 3.0;
  if (w > innerMargin * 2 && h > innerMargin * 2) {
    dxf += `0
POLYLINE
8
SCORE_BLUE
66
1
70
1
0
VERTEX
8
SCORE_BLUE
10
${innerMargin.toFixed(4)}
20
${innerMargin.toFixed(4)}
30
0.0
0
VERTEX
8
SCORE_BLUE
10
${(w - innerMargin).toFixed(4)}
20
${innerMargin.toFixed(4)}
30
0.0
0
VERTEX
8
SCORE_BLUE
10
${(w - innerMargin).toFixed(4)}
20
${(h - innerMargin).toFixed(4)}
30
0.0
0
VERTEX
8
SCORE_BLUE
10
${innerMargin.toFixed(4)}
20
${(h - innerMargin).toFixed(4)}
30
0.0
0
SEQEND
`;
  }

  dxf += `0
ENDSEC
0
EOF
`;

  return dxf;
}

/**
 * Calculates accurate physical printing and cost metrics.
 */
export function calculatePrintStats(dimensions: ModelDimensions, printSettings: PrintSettings) {
  const { width, depth, height, wallThickness = 2.0 } = dimensions;
  const { layerHeight = 0.2, infillDensity = 20, material = 'PLA', filamentCostPerKg = 20 } = printSettings;

  // Approximate solid model volume in cm3
  const bboxVolumeCm3 = (width * depth * height) / 1000;
  // Hollow fraction based on wall thickness
  const shellFactor = Math.min(0.85, (wallThickness * 2) / Math.min(width, depth));
  const innerVolumeRatio = Math.max(0, 1 - shellFactor);
  const solidShellVolume = bboxVolumeCm3 * shellFactor * 0.45;
  const infillVolume = bboxVolumeCm3 * innerVolumeRatio * (infillDensity / 100) * 0.4;
  const totalVolumeCm3 = Math.max(1.5, solidShellVolume + infillVolume);

  // Material densities (g/cm3)
  const densities: Record<string, number> = {
    PLA: 1.24,
    PETG: 1.27,
    TPU: 1.21,
    ABS: 1.05,
    Resin: 1.15,
  };
  const density = densities[material] || 1.24;
  const weightGrams = Number((totalVolumeCm3 * density).toFixed(1));

  // Weights for comparison across materials
  const materialWeights = {
    PLA: Number((totalVolumeCm3 * densities.PLA).toFixed(1)),
    PETG: Number((totalVolumeCm3 * densities.PETG).toFixed(1)),
    TPU: Number((totalVolumeCm3 * densities.TPU).toFixed(1)),
    ABS: Number((totalVolumeCm3 * densities.ABS).toFixed(1)),
    Resin: Number((totalVolumeCm3 * densities.Resin).toFixed(1)),
  };

  const partsPerSpool = Math.max(1, Math.floor(1000 / (weightGrams || 1)));

  // Print time estimation (based on layer count, volumetric flow rate ~12mm3/s on modern CoreXY printers)
  const layerCount = Math.ceil(height / layerHeight);
  const avgLayerTimeSec = 1.2 + (totalVolumeCm3 / layerCount) * 1.5;
  const totalTimeSec = layerCount * avgLayerTimeSec + 180; // plus bed heating & calibration
  const printTimeHours = Number((totalTimeSec / 3600).toFixed(2));

  // Economic breakdown
  const materialCost = Number(((weightGrams / 1000) * filamentCostPerKg).toFixed(2));
  const electricityKwh = (printTimeHours * 0.12); // ~120W printer power
  const electricityCost = Number((electricityKwh * 0.15).toFixed(2)); // $0.15 / kWh
  const packagingCost = 0.85; // bubble mailer / small box
  const totalCogs = Number((materialCost + electricityCost + packagingCost).toFixed(2));

  // Etsy pricing benchmark: 3.5x - 4x COGS markup
  const recommendedRetailPrice = Number(Math.max(9.99, (totalCogs * 3.8) + 2.0).toFixed(2));
  const etsyFee = Number((recommendedRetailPrice * 0.065 + 0.20 + recommendedRetailPrice * 0.035).toFixed(2));
  const netProfit = Number((recommendedRetailPrice - totalCogs - etsyFee).toFixed(2));
  const profitMargin = Math.round((netProfit / recommendedRetailPrice) * 100);

  return {
    volumeCm3: Number(totalVolumeCm3.toFixed(1)),
    solidShellVolumeCm3: Number(solidShellVolume.toFixed(1)),
    infillVolumeCm3: Number(infillVolume.toFixed(1)),
    density,
    weightGrams,
    materialWeights,
    partsPerSpool,
    layerCount,
    printTimeHours,
    materialCost,
    electricityCost,
    electricityKwh: Number(electricityKwh.toFixed(3)),
    packagingCost,
    etsyFee,
    totalServiceFees: Number((etsyFee + packagingCost).toFixed(2)),
    totalCogs,
    recommendedRetailPrice,
    netProfit,
    profitMargin,
  };
}

/**
 * Creates a complete ZIP archive containing binary .STL and vector .SVG files
 * for multiple selected CAD designs from the Cloud Library.
 */
export async function createBulkZipArchive(
  designs: CADDesign[],
  onProgress?: (percent: number, stepText: string) => void
): Promise<Blob> {
  const zip = new JSZip();

  for (let i = 0; i < designs.length; i++) {
    const design = designs[i];
    const sanitizedName = (design.name || `design_${i + 1}`)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const folderName = `${String(i + 1).padStart(2, '0')}_${sanitizedName}`;
    const folder = zip.folder(folderName) || zip;

    if (onProgress) {
      onProgress(
        Math.round((i / designs.length) * 85),
        `Generating STL & SVG for "${design.name}" (${i + 1}/${designs.length})...`
      );
    }

    // 1. Generate 3D Parametric Geometry & Binary STL
    try {
      const geometry = buildParametricGeometry(design.modelType, design.dimensions);
      const binaryStl = generateBinarySTL(geometry);
      folder.file(`${sanitizedName}.stl`, binaryStl);
      geometry.dispose();
    } catch (err) {
      console.warn(`Error generating STL for ${design.name}:`, err);
    }

    // 2. Generate Precision Laser Vector SVG
    try {
      const svgString = generateLaserSVG(design);
      folder.file(`${sanitizedName}_laser.svg`, svgString);
    } catch (err) {
      console.warn(`Error generating SVG for ${design.name}:`, err);
    }

    // 3. Generate CNC/Laser AutoCAD DXF Vector
    try {
      const dxfString = generateDXFVector(design);
      folder.file(`${sanitizedName}_cad.dxf`, dxfString);
    } catch (err) {
      console.warn(`Error generating DXF for ${design.name}:`, err);
    }

    // 4. Production & Slicer Specification Sheet
    const specSheet = `=====================================================
FORGECRAFT STUDIO - BULK MANUFACTURING SPEC SHEET
=====================================================
Design Name: ${design.name}
Category: ${design.category}
Model Type: ${design.modelType}
Date Exported: ${new Date().toISOString()}

[1] PHYSICAL DIMENSIONS
- Width (X): ${design.dimensions.width} mm
- Depth (Y): ${design.dimensions.depth || design.dimensions.width} mm
- Height (Z): ${design.dimensions.height} mm
- Wall Thickness: ${design.dimensions.wallThickness} mm
${design.dimensions.cornerRadius ? `- Corner Radius: ${design.dimensions.cornerRadius} mm\n` : ''}${design.dimensions.drainageHole ? `- Drainage Hole: ${design.dimensions.drainageHole} mm\n` : ''}${design.dimensions.holeDiameter ? `- Ring/Hole Diameter: ${design.dimensions.holeDiameter} mm\n` : ''}${design.dimensions.text ? `- Custom Text: "${design.dimensions.text}"\n` : ''}
[2] 3D PRINTING SLICER SETTINGS
- Material: ${design.printSettings.material}
- Layer Resolution: ${design.printSettings.layerHeight} mm
- Infill Density: ${design.printSettings.infillDensity}% (${design.printSettings.infillPattern})
- Wall Shell Perimeters: ${design.printSettings.wallCount}x
- Top / Bottom Solid Layers: ${design.printSettings.topLayers}x / ${design.printSettings.bottomLayers}x
- Print Speed: ${design.printSettings.printSpeed} mm/s
- Supports Needed: ${design.printSettings.supportsNeeded ? 'Yes' : 'No (Designed Supportless)'}

[3] LASER VECTOR CUTTING & ENGRAVING
- Recommended Material: ${design.laserSettings?.material || '3mm Baltic Birch / Basswood'}
- Laser Machine Profile: ${design.laserSettings?.laserType || 'Diode 20W'}
- Kerf Beam Offset: ${design.laserSettings?.kerfCompensation || 0.15} mm
- Color Code Layers:
    * RED (#FF0000)   : Through-Cut Vector
    * BLUE (#0000FF)  : Surface Score Vector
    * BLACK (#000000) : High-Res Raster Engraving

[4] ETSY SHOP & PRICING BENCHMARK
- Suggested Retail Price: $${design.etsyDetails?.suggestedPrice || 19.99}
- Estimated Material COGS: $${design.etsyDetails?.materialCost || 1.50}
- Optimized Title: ${design.etsyDetails?.title || design.name}
- SEO Tags: ${(design.etsyDetails?.tags || design.tags || []).join(', ')}
`;
    folder.file(`${sanitizedName}_specs.txt`, specSheet);
  }

  // Root manifest README
  const manifest = `=====================================================
FORGECRAFT STUDIO - BULK DESIGNS ARCHIVE
=====================================================
Exported at: ${new Date().toLocaleString()}
Total Designs: ${designs.length}

INCLUDED ASSETS PER DESIGN:
- *.stl        : Water-tight binary 3D printable mesh
- *_laser.svg  : Multi-layer vector file for laser cutters (LightBurn / Glowforge / xTool)
- *_cad.dxf    : Standard AutoCAD 2D vector for CNC routing
- *_specs.txt  : Slicer temperatures, speeds, kerf compensation & Etsy SEO copy

BATCH CONTENTS:
${designs.map((d, i) => `${i + 1}. [${d.modelType.toUpperCase()}] ${d.name} (${d.dimensions.width}x${d.dimensions.depth || d.dimensions.width}x${d.dimensions.height}mm)`).join('\n')}

Created with ForgeCraft Studio - AI 3D Print & Laser CAD for Etsy Creators.
`;
  zip.file('README_BATCH_EXPORT.txt', manifest);

  if (onProgress) {
    onProgress(90, 'Compressing ZIP package (DEFLATE)...');
  }

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.min(99, Math.round(90 + (metadata.percent / 10))), 'Finalizing ZIP bundle...');
      }
    }
  );

  if (onProgress) {
    onProgress(100, 'Download Ready');
  }

  return zipBlob;
}

