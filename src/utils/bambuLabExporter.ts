import * as THREE from 'three';
import JSZip from 'jszip';
import { CADDesign, BambuLabSettings, BambuPrinterModel } from '../types/cad';
import { downloadFile } from './stlExporter';
import { buildParametricGeometry } from './geometryGenerators';

export interface BambuPrinterSpec {
  model: BambuPrinterModel;
  bedWidthMm: number;
  bedDepthMm: number;
  bedHeightMm: number;
  maxSpeedMms: number;
  maxAccelerationMms2: number;
  hasEnclosure: boolean;
  hasLidar: boolean;
  amsSupported: 'AMS 4-Slot' | 'AMS Lite' | 'Both';
  recommendedLayerHeight: number;
}

export const BAMBU_PRINTER_SPECS: Record<BambuPrinterModel, BambuPrinterSpec> = {
  'Bambu Lab X1-Carbon': {
    model: 'Bambu Lab X1-Carbon',
    bedWidthMm: 256,
    bedDepthMm: 256,
    bedHeightMm: 256,
    maxSpeedMms: 500,
    maxAccelerationMms2: 20000,
    hasEnclosure: true,
    hasLidar: true,
    amsSupported: 'AMS 4-Slot',
    recommendedLayerHeight: 0.16,
  },
  'Bambu Lab X1E': {
    model: 'Bambu Lab X1E',
    bedWidthMm: 256,
    bedDepthMm: 256,
    bedHeightMm: 256,
    maxSpeedMms: 500,
    maxAccelerationMms2: 20000,
    hasEnclosure: true,
    hasLidar: true,
    amsSupported: 'AMS 4-Slot',
    recommendedLayerHeight: 0.16,
  },
  'Bambu Lab P1S': {
    model: 'Bambu Lab P1S',
    bedWidthMm: 256,
    bedDepthMm: 256,
    bedHeightMm: 256,
    maxSpeedMms: 500,
    maxAccelerationMms2: 20000,
    hasEnclosure: true,
    hasLidar: false,
    amsSupported: 'AMS 4-Slot',
    recommendedLayerHeight: 0.20,
  },
  'Bambu Lab P1P': {
    model: 'Bambu Lab P1P',
    bedWidthMm: 256,
    bedDepthMm: 256,
    bedHeightMm: 256,
    maxSpeedMms: 500,
    maxAccelerationMms2: 20000,
    hasEnclosure: false,
    hasLidar: false,
    amsSupported: 'AMS 4-Slot',
    recommendedLayerHeight: 0.20,
  },
  'Bambu Lab A1': {
    model: 'Bambu Lab A1',
    bedWidthMm: 256,
    bedDepthMm: 256,
    bedHeightMm: 256,
    maxSpeedMms: 500,
    maxAccelerationMms2: 10000,
    hasEnclosure: false,
    hasLidar: false,
    amsSupported: 'AMS Lite',
    recommendedLayerHeight: 0.20,
  },
  'Bambu Lab A1 mini': {
    model: 'Bambu Lab A1 mini',
    bedWidthMm: 180,
    bedDepthMm: 180,
    bedHeightMm: 180,
    maxSpeedMms: 500,
    maxAccelerationMms2: 10000,
    hasEnclosure: false,
    hasLidar: false,
    amsSupported: 'AMS Lite',
    recommendedLayerHeight: 0.20,
  },
};

export const DEFAULT_BAMBU_SETTINGS: BambuLabSettings = {
  printerModel: 'Bambu Lab X1-Carbon',
  plateType: 'Textured PEI Plate',
  nozzleDiameter: 0.4,
  amsSlots: [
    { slotNumber: 1, filamentType: 'Bambu PLA Basic', colorHex: '#10B981', colorName: 'Bambu Green' },
    { slotNumber: 2, filamentType: 'Bambu PLA Matte', colorHex: '#FFFFFF', colorName: 'Matte Ivory White' },
    { slotNumber: 3, filamentType: 'Bambu PLA Basic', colorHex: '#F59E0B', colorName: 'Sunset Orange' },
    { slotNumber: 4, filamentType: 'Bambu Support for PLA', colorHex: '#06B6D4', colorName: 'Cyan Support' },
  ],
  activeSlot: 1,
  speedProfile: 'Standard (100%)',
  flowCalibration: true,
  timelapseEnabled: true,
  wipeTower: false,
};

/**
 * Generates an official 3MF model XML string (3D/3dmodel.model) from Three.js BufferGeometry.
 */
export function generate3MFModelXml(design: CADDesign, geometry: THREE.BufferGeometry): string {
  const geom = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  geom.computeVertexNormals();

  const pos = geom.getAttribute('position');
  const count = pos.count;

  // Center model slightly above plate
  const bbox = new THREE.Box3().setFromBufferAttribute(pos as THREE.BufferAttribute);
  const centerX = (bbox.max.x + bbox.min.x) / 2;
  const centerY = (bbox.max.y + bbox.min.y) / 2;
  const minZ = bbox.min.z;

  let verticesXml = '';
  let trianglesXml = '';

  for (let i = 0; i < count; i++) {
    const x = (pos.getX(i) - centerX).toFixed(3);
    const y = (pos.getY(i) - centerY).toFixed(3);
    const z = (pos.getZ(i) - minZ).toFixed(3);
    verticesXml += `          <vertex x="${x}" y="${y}" z="${z}" />\n`;
  }

  const triangleCount = Math.floor(count / 3);
  for (let t = 0; t < triangleCount; t++) {
    const v1 = t * 3;
    const v2 = t * 3 + 1;
    const v3 = t * 3 + 2;
    trianglesXml += `          <triangle v1="${v1}" v2="${v2}" v3="${v3}" />\n`;
  }

  const cleanName = design.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const bambu = design.bambuSettings || DEFAULT_BAMBU_SETTINGS;
  const spec = BAMBU_PRINTER_SPECS[bambu.printerModel] || BAMBU_PRINTER_SPECS['Bambu Lab X1-Carbon'];
  const bedCenterX = (spec.bedWidthMm / 2).toFixed(1);
  const bedCenterY = (spec.bedDepthMm / 2).toFixed(1);
  const activeAms = bambu.amsSlots.find((s) => s.slotNumber === bambu.activeSlot) || bambu.amsSlots[0];
  const hexColor = (activeAms.colorHex || '#10B981').toUpperCase();

  return `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021">
  <metadata name="Title">${cleanName}</metadata>
  <metadata name="Designer">ForgeCraft AI Studio</metadata>
  <metadata name="Application">ForgeCraft 3D CAD &amp; Bambu Project Engine</metadata>
  <metadata name="CreationDate">${new Date().toISOString()}</metadata>
  <resources>
    <m:colorgroup id="2">
      <m:color color="${hexColor}" />
    </m:colorgroup>
    <object id="1" type="model" pid="2" pindex="0">
      <mesh>
        <vertices>
${verticesXml}        </vertices>
        <triangles>
${trianglesXml}        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" transform="1 0 0 0 1 0 0 0 1 ${bedCenterX} ${bedCenterY} 0" />
  </build>
</model>`;
}

/**
 * Creates an official Bambu Studio .3mf Project Zip archive with full Bambu slicer metadata.
 */
export async function generateBambu3MF(
  design: CADDesign,
  geometry?: THREE.BufferGeometry
): Promise<Blob> {
  const zip = new JSZip();
  const bambu = design.bambuSettings || DEFAULT_BAMBU_SETTINGS;
  const geom = geometry || buildParametricGeometry(design.modelType, design.dimensions);

  // 1. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
  <Default Extension="json" ContentType="application/json"/>
  <Default Extension="config" ContentType="text/plain"/>
  <Default Extension="txt" ContentType="text/plain"/>
</Types>`;
  zip.file('[Content_Types].xml', contentTypesXml);

  // 2. _rels/.rels
  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;
  zip.file('_rels/.rels', relsXml);

  // 3. 3D/3dmodel.model (3MF Geometry)
  const model3dXml = generate3MFModelXml(design, geom);
  zip.file('3D/3dmodel.model', model3dXml);

  // 4. Metadata/BambuStudio.json
  const activeAms = bambu.amsSlots.find((s) => s.slotNumber === bambu.activeSlot) || bambu.amsSlots[0];
  const printerSpec = BAMBU_PRINTER_SPECS[bambu.printerModel] || BAMBU_PRINTER_SPECS['Bambu Lab X1-Carbon'];

  const bambuStudioJson = {
    version: '1.9.3.50',
    header: 'BambuStudio 3MF project file generated by ForgeCraft',
    printer_model: bambu.printerModel,
    plate_type: bambu.plateType,
    nozzle_diameter: bambu.nozzleDiameter,
    bed_dimensions: {
      x: printerSpec.bedWidthMm,
      y: printerSpec.bedDepthMm,
      z: printerSpec.bedHeightMm,
    },
    ams: {
      slots: bambu.amsSlots,
      active_slot: bambu.activeSlot,
      active_color: activeAms.colorHex,
      active_filament: activeAms.filamentType,
    },
    slicer_profile: {
      layer_height: design.printSettings.layerHeight,
      infill_density: design.printSettings.infillDensity,
      infill_pattern: design.printSettings.infillPattern,
      wall_loops: design.printSettings.wallCount,
      top_layers: design.printSettings.topLayers,
      bottom_layers: design.printSettings.bottomLayers,
      supports: design.printSettings.supportsNeeded,
      speed_profile: bambu.speedProfile,
      flow_calibration: bambu.flowCalibration,
      timelapse: bambu.timelapseEnabled,
    },
  };
  zip.file('Metadata/BambuStudio.json', JSON.stringify(bambuStudioJson, null, 2));

  // 5. Metadata/model_settings.config (Key-value text config for Bambu Studio slicer)
  const modelSettingsConfig = `; Bambu Studio Model Configuration
; Generated by ForgeCraft 3D CAD
printer_model = ${bambu.printerModel}
curr_bed_type = ${bambu.plateType}
nozzle_diameter = ${bambu.nozzleDiameter}
filament_type = ${activeAms.filamentType}
filament_colour = ${activeAms.colorHex}
layer_height = ${design.printSettings.layerHeight}
infill_density = ${design.printSettings.infillDensity}%
infill_pattern = ${design.printSettings.infillPattern}
wall_loops = ${design.printSettings.wallCount}
supports_enabled = ${design.printSettings.supportsNeeded ? 1 : 0}
flow_calibration = ${bambu.flowCalibration ? 1 : 0}
timelapse = ${bambu.timelapseEnabled ? 1 : 0}
speed_profile = ${bambu.speedProfile}
`;
  zip.file('Metadata/model_settings.config', modelSettingsConfig);

  // 6. Metadata/slice_info.config
  const sliceInfoConfig = `[plate_1]
bed_type = ${bambu.plateType}
printer_name = ${bambu.printerModel}
filament_id = ${activeAms.filamentType}
filament_color = ${activeAms.colorHex}
ams_slot = ${bambu.activeSlot}
prediction_hours = ${(design.dimensions.height / 25).toFixed(1)}
layer_count = ${Math.ceil(design.dimensions.height / design.printSettings.layerHeight)}
`;
  zip.file('Metadata/slice_info.config', sliceInfoConfig);

  // 7. Metadata/README_BAMBU.txt
  const readmeText = `=====================================================
BAMBU LAB 3MF PROJECT FILE
Generated by ForgeCraft Studio for: ${design.name}
=====================================================

PRINTER TARGET: ${bambu.printerModel}
BUILD PLATE: ${bambu.plateType} (${printerSpec.bedWidthMm} x ${printerSpec.bedDepthMm} x ${printerSpec.bedHeightMm} mm)
NOZZLE: ${bambu.nozzleDiameter} mm
ACTIVE AMS SLOT: Slot ${bambu.activeSlot} - ${activeAms.colorName} (${activeAms.colorHex})
FILAMENT: ${activeAms.filamentType}
LAYER RESOLUTION: ${design.printSettings.layerHeight} mm
INFILL: ${design.printSettings.infillDensity}% (${design.printSettings.infillPattern})
SUPPORTS: ${design.printSettings.supportsNeeded ? 'Enabled' : 'Disabled'}

HOW TO USE:
1. Double-click this .3mf file to open directly in Bambu Studio or OrcaSlicer.
2. The model will appear pre-centered on your Bambu build plate with exact layer heights, nozzle settings, and AMS color assigned.
3. Click "Slice Plate" and send directly to your printer via Bambu Cloud, SD Card, or Bambu Handy!
`;
  zip.file('Metadata/README_BAMBU.txt', readmeText);

  // Generate binary 3MF package blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return zipBlob;
}

/**
 * Downloads a complete Bambu Studio .3mf Project File to the user's computer.
 */
export async function downloadBambu3MF(
  design: CADDesign,
  geometry?: THREE.BufferGeometry
): Promise<void> {
  const blob = await generateBambu3MF(design, geometry);
  const cleanName = design.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  downloadFile(blob, `${cleanName}_bambu_project.3mf`);
}
