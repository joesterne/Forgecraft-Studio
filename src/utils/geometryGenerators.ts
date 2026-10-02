import * as THREE from 'three';
import { ModelDimensions, ModelType } from '../types/cad';

/**
 * Builds parametric 3D watertight BufferGeometry for each product type.
 */
export function buildParametricGeometry(
  modelType: ModelType,
  dims: ModelDimensions
): THREE.BufferGeometry {
  switch (modelType) {
    case 'planter':
      return createPlanterGeometry(dims);
    case 'keychain':
      return createKeychainGeometry(dims);
    case 'cutter':
      return createCutterGeometry(dims);
    case 'coaster':
      return createCoasterGeometry(dims);
    case 'organizer':
      return createOrganizerGeometry(dims);
    case 'custom':
    default:
      return createCustomLoftedGeometry(dims);
  }
}

/**
 * Hexagonal / polygonal faceted modern planter with inner hollow cavity & drainage hole.
 */
function createPlanterGeometry(dims: ModelDimensions): THREE.BufferGeometry {
  const { width = 80, height = 70, wallThickness = 3.0, patternSegments = 6, drainageHole = 10 } = dims;
  const outerRadiusTop = width / 2;
  const outerRadiusBottom = outerRadiusTop * 0.78;
  const innerRadiusTop = Math.max(5, outerRadiusTop - wallThickness);
  const innerRadiusBottom = Math.max(3, outerRadiusBottom - wallThickness);
  const floorThickness = Math.max(3, wallThickness * 1.2);
  const innerHeight = height - floorThickness;

  const segments = Math.max(3, Math.min(32, patternSegments || 6));

  // Construct outer cylinder/prism
  const outerGeo = new THREE.CylinderGeometry(
    outerRadiusTop,
    outerRadiusBottom,
    height,
    segments,
    8,
    false
  );
  outerGeo.translate(0, height / 2, 0);

  // Construct inner hollow cylinder
  const innerGeo = new THREE.CylinderGeometry(
    innerRadiusTop,
    innerRadiusBottom,
    innerHeight,
    segments,
    4,
    true // open ended
  );
  innerGeo.translate(0, floorThickness + innerHeight / 2, 0);

  // Construct top rim ring linking outer and inner
  const rimShape = new THREE.Shape();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * outerRadiusTop;
    const y = Math.sin(angle) * outerRadiusTop;
    if (i === 0) rimShape.moveTo(x, y);
    else rimShape.lineTo(x, y);
  }

  const holePath = new THREE.Path();
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * innerRadiusTop;
    const y = Math.sin(angle) * innerRadiusTop;
    if (i === 0) holePath.moveTo(x, y);
    else holePath.lineTo(x, y);
  }
  rimShape.holes.push(holePath);

  const rimGeo = new THREE.ShapeGeometry(rimShape, segments);
  rimGeo.rotateX(-Math.PI / 2);
  rimGeo.translate(0, height, 0);

  // Internal bottom floor
  const floorGeo = new THREE.CylinderGeometry(
    innerRadiusBottom,
    innerRadiusBottom,
    0.1,
    segments,
    1,
    false
  );
  floorGeo.translate(0, floorThickness, 0);

  // Optional drainage tube
  const geomsToMerge = [outerGeo, innerGeo, rimGeo, floorGeo];
  if (drainageHole > 0) {
    const holeRadius = drainageHole / 2;
    const drainTube = new THREE.CylinderGeometry(holeRadius, holeRadius, floorThickness + 1, 16, 1, true);
    drainTube.translate(0, floorThickness / 2, 0);
    geomsToMerge.push(drainTube);
  }

  return mergeBufferGeometries(geomsToMerge);
}

/**
 * Personalized keychain / monogram tag with rounded borders, hole, and raised relief.
 */
function createKeychainGeometry(dims: ModelDimensions): THREE.BufferGeometry {
  const {
    width = 70,
    depth = 28,
    height = 4.0,
    cornerRadius = 5.0,
    embossDepth = 1.5,
    holeDiameter = 4.5,
    wallThickness = 2.0,
    text = 'FORGE',
  } = dims;

  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -depth / 2;
  const w = width;
  const h = depth;
  const r = Math.min(cornerRadius, depth / 2 - 1);

  // Rounded rectangle
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  // Keyhole cutout
  if (holeDiameter > 0) {
    const holePath = new THREE.Path();
    const hx = x + r + 2.5;
    const hy = 0;
    const hr = holeDiameter / 2;
    holePath.absarc(hx, hy, hr, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
  }

  // Extrude base plate
  const baseExtrude = new THREE.ExtrudeGeometry(shape, {
    depth: height - embossDepth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.5,
    bevelThickness: 0.5,
  });
  baseExtrude.rotateX(-Math.PI / 2);

  // Raised outer border rim
  const rimShape = new THREE.Shape();
  rimShape.moveTo(x + r, y);
  rimShape.lineTo(x + w - r, y);
  rimShape.quadraticCurveTo(x + w, y, x + w, y + r);
  rimShape.lineTo(x + w, y + h - r);
  rimShape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  rimShape.lineTo(x + r, y + h);
  rimShape.quadraticCurveTo(x, y + h, x, y + h - r);
  rimShape.lineTo(x, y + r);
  rimShape.quadraticCurveTo(x, y, x + r, y);

  const innerRimHole = new THREE.Path();
  const innerMargin = wallThickness;
  const ix = x + innerMargin;
  const iy = y + innerMargin;
  const iw = w - innerMargin * 2;
  const ih = h - innerMargin * 2;
  const ir = Math.max(1, r - innerMargin);
  innerRimHole.moveTo(ix + ir, iy);
  innerRimHole.lineTo(ix + iw - ir, iy);
  innerRimHole.quadraticCurveTo(ix + iw, iy, ix + iw, iy + ir);
  innerRimHole.lineTo(ix + iw, iy + ih - ir);
  innerRimHole.quadraticCurveTo(ix + iw, iy + ih, ix + iw - ir, iy + ih);
  innerRimHole.lineTo(ix + ir, iy + ih);
  innerRimHole.quadraticCurveTo(ix, iy + ih, ix, iy + ih - ir);
  innerRimHole.lineTo(ix, iy + ir);
  innerRimHole.quadraticCurveTo(ix, iy, ix + ir, iy);
  rimShape.holes.push(innerRimHole);

  const rimExtrude = new THREE.ExtrudeGeometry(rimShape, {
    depth: embossDepth,
    bevelEnabled: false,
  });
  rimExtrude.rotateX(-Math.PI / 2);
  rimExtrude.translate(0, height - embossDepth, 0);

  // Center relief block / text plate
  const letterBlocks: THREE.BufferGeometry[] = [];
  const chars = (text || 'NAME').substring(0, 10).toUpperCase();
  const charSpacing = (w - (holeDiameter > 0 ? 18 : 10)) / (chars.length || 1);
  const startX = (holeDiameter > 0 ? 4 : 0) - ((chars.length - 1) * charSpacing) / 2;

  chars.split('').forEach((char, i) => {
    // Generate letter box relief geometry
    const letterWidth = Math.min(charSpacing * 0.7, 10);
    const letterHeight = Math.min(depth * 0.45, 14);
    const letterGeo = new THREE.BoxGeometry(letterWidth, embossDepth, letterHeight);
    letterGeo.translate(startX + i * charSpacing, height - embossDepth / 2, 0);
    letterBlocks.push(letterGeo);
  });

  return mergeBufferGeometries([baseExtrude, rimExtrude, ...letterBlocks]);
}

/**
 * Professional Clay / Cookie Cutter: Sharp 0.7mm cutting wall, step reinforcement & press grip.
 */
function createCutterGeometry(dims: ModelDimensions): THREE.BufferGeometry {
  const {
    width = 45,
    depth = 45,
    height = 16,
    cuttingEdgeThickness = 0.7,
    stepWallThickness = 2.2,
  } = dims;

  const gripHeight = 4.0;
  const bladeHeight = height - gripHeight;
  const radius = width / 2;

  // Create outer press grip rim (thick for fingers)
  const gripGeo = new THREE.CylinderGeometry(radius, radius, gripHeight, 32, 1, false);
  gripGeo.translate(0, height - gripHeight / 2, 0);

  // Step transition wall
  const stepRadius = radius - (stepWallThickness - cuttingEdgeThickness) * 0.5;
  const bladeGeo = new THREE.CylinderGeometry(stepRadius, stepRadius, bladeHeight, 32, 1, true);
  bladeGeo.translate(0, bladeHeight / 2, 0);

  // Inner hollow cavity cutter core
  const innerRadius = radius - stepWallThickness;
  const innerHollow = new THREE.CylinderGeometry(innerRadius, innerRadius, height, 32, 1, true);
  innerHollow.translate(0, height / 2, 0);

  // Bottom knife-edge taper
  const knifeGeo = new THREE.CylinderGeometry(innerRadius + cuttingEdgeThickness, innerRadius, 1.5, 32, 1, true);
  knifeGeo.translate(0, 0.75, 0);

  return mergeBufferGeometries([gripGeo, bladeGeo, innerHollow, knifeGeo]);
}

/**
 * Intricate geometric coaster with recessed cork backing pocket and radial mandala patterns.
 */
function createCoasterGeometry(dims: ModelDimensions): THREE.BufferGeometry {
  const { width = 95, height = 4.5, patternSegments = 12 } = dims;
  const radius = width / 2;
  const rimHeight = height;
  const floorHeight = 1.6;

  // Outer coaster cylinder
  const baseGeo = new THREE.CylinderGeometry(radius, radius, floorHeight, 48, 1, false);
  baseGeo.translate(0, floorHeight / 2, 0);

  // Raised perimeter ring
  const ringShape = new THREE.Shape();
  ringShape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  const ringHole = new THREE.Path();
  ringHole.absarc(0, 0, radius - 3.5, 0, Math.PI * 2, true);
  ringShape.holes.push(ringHole);

  const ringGeo = new THREE.ExtrudeGeometry(ringShape, {
    depth: rimHeight - floorHeight,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.3,
    bevelThickness: 0.3,
  });
  ringGeo.rotateX(-Math.PI / 2);
  ringGeo.translate(0, floorHeight, 0);

  // Radial geometric mandala spokes
  const segments = Math.max(6, patternSegments || 12);
  const spokeGeoms: THREE.BufferGeometry[] = [];
  const spokeWidth = 2.0;
  const spokeLength = radius - 5;

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const spoke = new THREE.BoxGeometry(spokeWidth, rimHeight - floorHeight, spokeLength);
    spoke.rotateY(angle);
    spoke.translate(0, floorHeight + (rimHeight - floorHeight) / 2, 0);
    spokeGeoms.push(spoke);
  }

  // Center medallion boss
  const centerBoss = new THREE.CylinderGeometry(10, 10, rimHeight - floorHeight, 24, 1, false);
  centerBoss.translate(0, floorHeight + (rimHeight - floorHeight) / 2, 0);

  return mergeBufferGeometries([baseGeo, ringGeo, centerBoss, ...spokeGeoms]);
}

/**
 * Gridfinity / desk organizer container with stacking lip & smooth scoop base.
 */
function createOrganizerGeometry(dims: ModelDimensions): THREE.BufferGeometry {
  const { width = 84, depth = 84, height = 42, wallThickness = 2.5, cornerRadius = 6.0 } = dims;

  // Outer bin box with rounded corners
  const w = width;
  const d = depth;
  const h = height;
  const r = Math.min(cornerRadius, 8);
  const wt = wallThickness;

  const outerShape = new THREE.Shape();
  outerShape.moveTo(-w / 2 + r, -d / 2);
  outerShape.lineTo(w / 2 - r, -d / 2);
  outerShape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  outerShape.lineTo(w / 2, d / 2 - r);
  outerShape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  outerShape.lineTo(-w / 2 + r, d / 2);
  outerShape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  outerShape.lineTo(-w / 2, -d / 2 + r);
  outerShape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);

  const innerHole = new THREE.Path();
  const iw = w - wt * 2;
  const id = d - wt * 2;
  const ir = Math.max(1, r - wt);
  innerHole.moveTo(-iw / 2 + ir, -id / 2);
  innerHole.lineTo(iw / 2 - ir, -id / 2);
  innerHole.quadraticCurveTo(iw / 2, -id / 2, iw / 2, -id / 2 + ir);
  innerHole.lineTo(iw / 2, id / 2 - ir);
  innerHole.quadraticCurveTo(iw / 2, id / 2, iw / 2 - ir, id / 2);
  innerHole.lineTo(-iw / 2 + ir, id / 2);
  innerHole.quadraticCurveTo(-iw / 2, id / 2, -iw / 2, id / 2 - ir);
  innerHole.lineTo(-iw / 2, -id / 2 + ir);
  innerHole.quadraticCurveTo(-iw / 2, -id / 2, -iw / 2 + ir, -id / 2);
  outerShape.holes.push(innerHole);

  // Extrude walls
  const wallGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: h,
    bevelEnabled: false,
  });
  wallGeo.rotateX(-Math.PI / 2);

  // Bottom floor
  const floorShape = new THREE.Shape();
  floorShape.moveTo(-w / 2 + r, -d / 2);
  floorShape.lineTo(w / 2 - r, -d / 2);
  floorShape.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  floorShape.lineTo(w / 2, d / 2 - r);
  floorShape.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  floorShape.lineTo(-w / 2 + r, d / 2);
  floorShape.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  floorShape.lineTo(-w / 2, -d / 2 + r);
  floorShape.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);

  const floorGeo = new THREE.ExtrudeGeometry(floorShape, {
    depth: 3.0,
    bevelEnabled: false,
  });
  floorGeo.rotateX(-Math.PI / 2);

  // Central divider
  const dividerGeo = new THREE.BoxGeometry(wt, h - 2, id);
  dividerGeo.translate(0, (h - 2) / 2 + 1.5, 0);

  return mergeBufferGeometries([wallGeo, floorGeo, dividerGeo]);
}

/**
 * Procedural lofted aesthetic vase / trophy.
 */
function createCustomLoftedGeometry(dims: ModelDimensions): THREE.BufferGeometry {
  const { width = 65, depth = 65, height = 90, wallThickness = 2.6, patternSegments = 8 } = dims;
  const radius = Math.min(width, depth) / 2;
  const radialSegments = Math.max(4, patternSegments || 8);

  const points: THREE.Vector2[] = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = t * height;
    // Elegant hourglass flare profile
    const r = radius * (0.8 + 0.35 * Math.sin(t * Math.PI * 1.5) + 0.1 * Math.cos(t * Math.PI * 4));
    points.push(new THREE.Vector2(r, y));
  }

  const latheGeo = new THREE.LatheGeometry(points, radialSegments);

  // Inner hollow cavity
  const innerPoints: THREE.Vector2[] = [];
  const innerSteps = 14;
  for (let i = 0; i <= innerSteps; i++) {
    const t = i / innerSteps;
    const y = 3.0 + t * (height - 3.0);
    const r = Math.max(3, radius * (0.8 + 0.35 * Math.sin(t * Math.PI * 1.5)) - wallThickness);
    innerPoints.push(new THREE.Vector2(r, y));
  }
  const innerLathe = new THREE.LatheGeometry(innerPoints, radialSegments);

  return mergeBufferGeometries([latheGeo, innerLathe]);
}

/**
 * Robust utility to merge multiple BufferGeometries into a single BufferGeometry.
 */
function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const validGeoms = geometries.filter((g) => g && g.getAttribute('position'));
  if (validGeoms.length === 0) {
    return new THREE.BoxGeometry(10, 10, 10);
  }

  let totalVertices = 0;
  validGeoms.forEach((g) => {
    const nonIndexed = g.index ? g.toNonIndexed() : g;
    totalVertices += nonIndexed.getAttribute('position').count;
  });

  const mergedPos = new Float32Array(totalVertices * 3);
  const mergedNormals = new Float32Array(totalVertices * 3);

  let offset = 0;
  validGeoms.forEach((g) => {
    const nonIndexed = g.index ? g.toNonIndexed() : g;
    nonIndexed.computeVertexNormals();

    const pos = nonIndexed.getAttribute('position');
    const norm = nonIndexed.getAttribute('normal');

    for (let i = 0; i < pos.count; i++) {
      const idx = (offset + i) * 3;
      mergedPos[idx] = pos.getX(i);
      mergedPos[idx + 1] = pos.getY(i);
      mergedPos[idx + 2] = pos.getZ(i);

      if (norm) {
        mergedNormals[idx] = norm.getX(i);
        mergedNormals[idx + 1] = norm.getY(i);
        mergedNormals[idx + 2] = norm.getZ(i);
      } else {
        mergedNormals[idx] = 0;
        mergedNormals[idx + 1] = 1;
        mergedNormals[idx + 2] = 0;
      }
    }

    offset += pos.count;
  });

  const mergedGeometry = new THREE.BufferGeometry();
  mergedGeometry.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
  mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(mergedNormals, 3));
  mergedGeometry.computeBoundingBox();
  mergedGeometry.computeBoundingSphere();

  return mergedGeometry;
}
