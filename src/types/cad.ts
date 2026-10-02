export type ModelType =
  | 'planter'
  | 'keychain'
  | 'cutter'
  | 'coaster'
  | 'organizer'
  | 'custom';

export interface ModelDimensions {
  width: number; // X in mm
  depth: number; // Y in mm
  height: number; // Z in mm
  wallThickness: number; // mm
  cornerRadius?: number; // mm
  bevelRadius?: number; // mm
  embossDepth?: number; // mm
  drainageHole?: number; // mm (for planters)
  holeDiameter?: number; // mm (for keychains/tags)
  text?: string; // for custom text / keychains
  patternSegments?: number; // e.g. sides for polygon/mandala
  cuttingEdgeThickness?: number; // mm for cutters (e.g. 0.7mm)
  stepWallThickness?: number; // mm for cutter upper frame
}

export type InfillPattern = 'gyroid' | 'grid' | 'honeycomb' | 'rectilinear';
export type MaterialType = 'PLA' | 'PETG' | 'TPU' | 'ABS' | 'Resin';

export interface PrintSettings {
  layerHeight: number; // mm (0.12, 0.16, 0.20, 0.28)
  infillDensity: number; // % (0 - 100)
  infillPattern: InfillPattern;
  wallCount: number; // perimeters (2 - 6)
  topLayers: number;
  bottomLayers: number;
  material: MaterialType;
  filamentCostPerKg: number; // $ (default 20)
  printSpeed: number; // mm/s
  supportsNeeded: boolean;
  nozzleDiameter?: number; // default 0.4
}

export type LaserMachineType = 'Diode 10W' | 'Diode 20W' | 'CO2 45W' | 'CO2 55W' | 'Fiber 20W';

export interface LaserSettings {
  enabled: boolean;
  material: string;
  laserType: LaserMachineType;
  cutSpeed: number; // mm/min
  cutPower: number; // %
  scoreSpeed: number; // mm/min
  scorePower: number; // %
  engraveSpeed: number; // mm/min
  engravePower: number; // %
  kerfCompensation: number; // mm (e.g. 0.15)
  passes?: number;
  airAssist?: boolean;
}

export interface EtsyDetails {
  suggestedPrice: number;
  materialCost: number;
  printTimeHours: number;
  profitMargin: number; // %
  title: string;
  tags: string[];
  description?: string;
  mockupUrl?: string;
}

export interface DesignVersion {
  versionId: string;
  versionNumber: number;
  timestamp: string;
  label: string;
  changeSummary: string;
  dimensions: ModelDimensions;
  printSettings: PrintSettings;
  laserSettings: LaserSettings;
  etsyDetails: EtsyDetails;
  thumbnailUrl?: string;
}

export interface CADDesign {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  modelType: ModelType;
  dimensions: ModelDimensions;
  printSettings: PrintSettings;
  laserSettings: LaserSettings;
  etsyDetails: EtsyDetails;
  updatedAt: string;
  isFavorite?: boolean;
  thumbnailUrl?: string;
  versions?: DesignVersion[];
}
