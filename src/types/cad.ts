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
  materialPreset?: string; // e.g. 'PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'PC', etc.
  materialDensity?: number; // density in g/cm³ (e.g. 1.24 for PLA, 1.27 for PETG, 1.05 for ABS, 1.21 for TPU)
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

export type CommentCategory =
  | 'iteration'
  | 'team_note'
  | 'production'
  | 'qa_check'
  | 'client_feedback';

export type AuthorRole = 'Maker' | 'Designer' | 'Print Tech' | 'Shop Manager' | 'Client';

export interface DesignComment {
  id: string;
  authorName: string;
  authorRole: AuthorRole;
  avatarColor: string;
  content: string;
  category: CommentCategory;
  timestamp: string;
  pinned?: boolean;
  resolved?: boolean;
  taggedVersion?: string; // e.g. "v1", "v2", or custom version name
  snapshotUrl?: string; // optional attached snapshot
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

export type BambuPrinterModel =
  | 'Bambu Lab X1-Carbon'
  | 'Bambu Lab X1E'
  | 'Bambu Lab P1S'
  | 'Bambu Lab P1P'
  | 'Bambu Lab A1'
  | 'Bambu Lab A1 mini';

export type BambuPlateType =
  | 'Textured PEI Plate'
  | 'Smooth PEI / High Temp Plate'
  | 'Engineering Plate'
  | 'Cool Plate';

export interface BambuAmsSlot {
  slotNumber: 1 | 2 | 3 | 4;
  filamentType: string;
  colorHex: string;
  colorName: string;
}

export interface BambuLabSettings {
  printerModel: BambuPrinterModel;
  plateType: BambuPlateType;
  nozzleDiameter: 0.2 | 0.4 | 0.6 | 0.8;
  amsSlots: BambuAmsSlot[];
  activeSlot: 1 | 2 | 3 | 4;
  speedProfile: 'Standard (100%)' | 'Sport (124%)' | 'Ludicrous (166%)' | 'Silent (50%)';
  flowCalibration: boolean;
  timelapseEnabled: boolean;
  wipeTower: boolean;
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
  bambuSettings?: BambuLabSettings;
  etsyDetails: EtsyDetails;
  updatedAt: string;
  isFavorite?: boolean;
  thumbnailUrl?: string;
  versions?: DesignVersion[];
  comments?: DesignComment[];
}
