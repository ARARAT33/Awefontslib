import opentype from 'opentype.js';
import { CompiledStudioFont, StudioFontMeta, StudioGlyphData } from '../types/font';

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Computes signed shoelace area of a 2D polygon.
 * Positive area in standard Y-up coordinates indicates counter-clockwise winding.
 */
export function polygonSignedArea(points: Point2D[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    area += p1.x * p2.y - p2.x * p1.y;
  }
  return area / 2;
}

/**
 * Ramer-Douglas-Peucker polyline simplification for closed polygons.
 */
function perpendicularDistance(pt: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(pt.x - lineStart.x, pt.y - lineStart.y);
  }
  const num = Math.abs(dy * pt.x - dx * pt.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
  const den = Math.hypot(dx, dy);
  return num / den;
}

export function simplifyOpenPolyline(points: Point2D[], epsilon: number): Point2D[] {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const left = simplifyOpenPolyline(points.slice(0, index + 1), epsilon);
    const right = simplifyOpenPolyline(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[end]];
}

export function simplifyClosedPolygon(points: Point2D[], epsilon: number): Point2D[] {
  if (points.length <= 4) return points;
  const half = Math.floor(points.length / 2);
  const firstHalf = simplifyOpenPolyline(points.slice(0, half + 1), epsilon);
  const secondHalf = simplifyOpenPolyline(points.slice(half).concat([points[0]]), epsilon);
  const merged = firstHalf.slice(0, -1).concat(secondHalf.slice(0, -1));
  return merged.length >= 3 ? merged : points;
}

/**
 * Traces exact closed boundary contours from a binary 2D grid (width x height, row-major, 1 = ink, 0 = empty).
 * Uses directed pixel-edge boundary extraction so outer shells and inner holes are cleanly separated.
 * Coordinates are returned in grid space (x right, y down).
 */
export function extractGridContours(grid: Uint8Array | number[], width: number, height: number): Point2D[][] {
  // Build directed boundary edges around filled pixels.
  // With y-down: for filled pixel (x, y), keeping interior on the right side of directed edge:
  // Top neighbor empty -> edge (x, y) -> (x+1, y)
  // Right neighbor empty -> edge (x+1, y) -> (x+1, y+1)
  // Bottom neighbor empty -> edge (x+1, y+1) -> (x, y+1)
  // Left neighbor empty -> edge (x, y+1) -> (x, y)
  const isFilled = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    return grid[y * width + x] > 0;
  };

  interface DirectedEdge {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    used: boolean;
  }

  const edges: DirectedEdge[] = [];
  const startMap = new Map<string, number[]>();

  const addEdge = (x1: number, y1: number, x2: number, y2: number) => {
    const idx = edges.length;
    edges.push({ x1, y1, x2, y2, used: false });
    const key = `${x1},${y1}`;
    const list = startMap.get(key);
    if (list) list.push(idx);
    else startMap.set(key, [idx]);
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!isFilled(x, y)) continue;
      if (!isFilled(x, y - 1)) addEdge(x, y, x + 1, y);
      if (!isFilled(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1);
      if (!isFilled(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1);
      if (!isFilled(x - 1, y)) addEdge(x, y + 1, x, y);
    }
  }

  const contours: Point2D[][] = [];

  for (let i = 0; i < edges.length; i++) {
    if (edges[i].used) continue;
    const loop: Point2D[] = [];
    let current = edges[i];
    current.used = true;
    loop.push({ x: current.x1, y: current.y1 });

    let safety = edges.length + 5;
    while (safety-- > 0) {
      const nextKey = `${current.x2},${current.y2}`;
      if (current.x2 === loop[0].x && current.y2 === loop[0].y) {
        break;
      }
      loop.push({ x: current.x2, y: current.y2 });
      const candidates = startMap.get(nextKey) || [];
      // Pick the first unused edge; if 2 candidates meet at a diagonal saddle, prefer turning right
      let chosenIdx = -1;
      for (const idx of candidates) {
        if (!edges[idx].used) {
          chosenIdx = idx;
          break;
        }
      }
      if (chosenIdx === -1) break;
      current = edges[chosenIdx];
      current.used = true;
    }

    if (loop.length >= 3) {
      // Collapse collinear intermediate vertices first
      const compact: Point2D[] = [];
      for (let k = 0; k < loop.length; k++) {
        const prev = loop[(k - 1 + loop.length) % loop.length];
        const curr = loop[k];
        const next = loop[(k + 1) % loop.length];
        const cross = (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x);
        if (cross !== 0) {
          compact.push(curr);
        }
      }
      if (compact.length >= 3) {
        contours.push(compact);
      }
    }
  }

  return contours;
}

/**
 * Converts grid contours (y-down in [0..gridSize]) into an OpenType Path (y-up in font units).
 * Preserves winding order: in OpenType CFF/TTF, outer contours are clockwise in Y-up (negative shoelace area)
 * and holes are counter-clockwise in Y-up (positive shoelace area).
 * Since extractGridContours walks outer boundaries clockwise in Y-down, flipping Y (y_font = ascender - y_grid * scale)
 * makes outer contours counter-clockwise (area > 0) and holes clockwise (area < 0) — so we reverse each loop!
 */
export function contoursToOpenTypePath(
  contours: Point2D[][],
  gridSize: number,
  unitsPerEm: number,
  ascender: number,
  simplifyEpsilon = 0.65
): opentype.Path {
  const path = new opentype.Path();
  const scale = unitsPerEm / gridSize;

  for (const rawLoop of contours) {
    const simplified = simplifyClosedPolygon(rawLoop, simplifyEpsilon);
    if (simplified.length < 3) continue;

    // Transform to font coordinates (Y-up)
    const fontPts = simplified.map((p) => ({
      x: Math.round(p.x * scale),
      y: Math.round(ascender - p.y * scale),
    }));

    // In Y-down grid space, outer boundaries had positive shoelace area (CW in screen coords).
    // After Y-flip, reversing the point order restores CW in Y-up (area < 0) for outer shells
    // and CCW in Y-up (area > 0) for inner holes — matching PostScript/OpenType non-zero winding.
    const reversed = [...fontPts].reverse();
    path.moveTo(reversed[0].x, reversed[0].y);
    for (let i = 1; i < reversed.length; i++) {
      path.lineTo(reversed[i].x, reversed[i].y);
    }
    path.close();
  }

  return path;
}

/**
 * Rasterizes vector strokes from the Studio canvas (normalized 0..gridSize) onto a binary grid,
 * optionally combined with an image-traced bitmap mask.
 */
export function rasterizeGlyphToGrid(
  glyph: StudioGlyphData,
  canvasSize: number,
  gridSize = 96
): Uint8Array {
  const grid = new Uint8Array(gridSize * gridSize);

  // 1. Copy traced image mask if present
  if (glyph.tracedMask && glyph.tracedMask.length > 0 && glyph.gridSize) {
    const srcSize = glyph.gridSize;
    for (let y = 0; y < gridSize; y++) {
      const sy = Math.min(srcSize - 1, Math.floor((y / gridSize) * srcSize));
      for (let x = 0; x < gridSize; x++) {
        const sx = Math.min(srcSize - 1, Math.floor((x / gridSize) * srcSize));
        if (glyph.tracedMask[sy * srcSize + sx] > 0) {
          grid[y * gridSize + x] = 1;
        }
      }
    }
  }

  // 2. Rasterize strokes
  const scale = gridSize / canvasSize;
  const paintDisk = (cx: number, cy: number, radius: number, value: 0 | 1) => {
    const rCeil = Math.ceil(radius);
    const minX = Math.max(0, Math.floor(cx - rCeil));
    const maxX = Math.min(gridSize - 1, Math.ceil(cx + rCeil));
    const minY = Math.max(0, Math.floor(cy - rCeil));
    const maxY = Math.min(gridSize - 1, Math.ceil(cy + rCeil));
    const r2 = radius * radius;
    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        const dx = px + 0.5 - cx;
        const dy = py + 0.5 - cy;
        if (dx * dx + dy * dy <= r2) {
          grid[py * gridSize + px] = value;
        }
      }
    }
  };

  const paintNib = (cx: number, cy: number, width: number, angleDeg: number, value: 0 | 1) => {
    const rad = (angleDeg * Math.PI) / 180;
    const halfLen = width * 0.55;
    const thickness = Math.max(1.2, width * 0.22);
    const dx = Math.cos(rad) * halfLen;
    const dy = Math.sin(rad) * halfLen;
    const steps = Math.max(3, Math.ceil(halfLen * 2));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = cx - dx + 2 * dx * t;
      const py = cy - dy + 2 * dy * t;
      paintDisk(px, py, thickness, value);
    }
  };

  for (const stroke of glyph.strokes) {
    const val: 0 | 1 = stroke.tool === 'eraser' ? 0 : 1;
    const radius = Math.max(1.2, (stroke.brushWidth * scale) / 2);

    if (stroke.tool === 'rect' && stroke.points.length >= 2) {
      const p0 = stroke.points[0];
      const p1 = stroke.points[stroke.points.length - 1];
      const x1 = Math.max(0, Math.floor(Math.min(p0.x, p1.x) * scale));
      const x2 = Math.min(gridSize - 1, Math.ceil(Math.max(p0.x, p1.x) * scale));
      const y1 = Math.max(0, Math.floor(Math.min(p0.y, p1.y) * scale));
      const y2 = Math.min(gridSize - 1, Math.ceil(Math.max(p0.y, p1.y) * scale));
      for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
          grid[y * gridSize + x] = val;
        }
      }
      continue;
    }

    if (stroke.tool === 'circle' && stroke.points.length >= 2) {
      const p0 = stroke.points[0];
      const p1 = stroke.points[stroke.points.length - 1];
      const cx = ((p0.x + p1.x) / 2) * scale;
      const cy = ((p0.y + p1.y) / 2) * scale;
      const rx = Math.max(1, (Math.abs(p1.x - p0.x) / 2) * scale);
      const ry = Math.max(1, (Math.abs(p1.y - p0.y) / 2) * scale);
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const nx = (x + 0.5 - cx) / rx;
          const ny = (y + 0.5 - cy) / ry;
          if (nx * nx + ny * ny <= 1) {
            grid[y * gridSize + x] = val;
          }
        }
      }
      continue;
    }

    const pts = stroke.points;
    if (pts.length === 0) continue;

    if (pts.length === 1) {
      if (stroke.tool === 'calligraphy') {
        paintNib(pts[0].x * scale, pts[0].y * scale, stroke.brushWidth * scale, stroke.calligraphyAngle ?? -35, val);
      } else {
        paintDisk(pts[0].x * scale, pts[0].y * scale, radius, val);
      }
      continue;
    }

    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dist = Math.hypot((b.x - a.x) * scale, (b.y - a.y) * scale);
      const steps = Math.max(1, Math.ceil(dist * 2));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const cx = (a.x + (b.x - a.x) * t) * scale;
        const cy = (a.y + (b.y - a.y) * t) * scale;
        if (stroke.tool === 'calligraphy') {
          paintNib(cx, cy, stroke.brushWidth * scale, stroke.calligraphyAngle ?? -35, val);
        } else {
          paintDisk(cx, cy, radius, val);
        }
      }
    }
  }

  return grid;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

export function compileStudioFont(
  meta: StudioFontMeta,
  glyphMap: Record<string, StudioGlyphData>,
  canvasSize = 400
): CompiledStudioFont {
  const unitsPerEm = meta.unitsPerEm || 1000;
  const ascender = meta.ascender || 800;
  const descender = meta.descender || -200;
  const gridSize = 96;

  const notdefPath = new opentype.Path();
  notdefPath.moveTo(100, 0);
  notdefPath.lineTo(100, 700);
  notdefPath.lineTo(500, 700);
  notdefPath.lineTo(500, 0);
  notdefPath.close();
  notdefPath.moveTo(160, 60);
  notdefPath.lineTo(440, 60);
  notdefPath.lineTo(440, 640);
  notdefPath.lineTo(160, 640);
  notdefPath.close();

  const glyphs: opentype.Glyph[] = [
    new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: 600,
      path: notdefPath,
    }),
    new opentype.Glyph({
      name: 'space',
      unicode: 32,
      advanceWidth: 320,
      path: new opentype.Path(),
    }),
  ];

  let activeCount = 0;

  for (const data of Object.values(glyphMap)) {
    if (!data.char || data.unicode === 32) continue;
    const hasInk = data.strokes.length > 0 || (data.tracedMask && data.tracedMask.some((v) => v > 0));
    if (!hasInk) continue;

    const grid = rasterizeGlyphToGrid(data, canvasSize, gridSize);
    const contours = extractGridContours(grid, gridSize, gridSize);
    const path = contoursToOpenTypePath(contours, gridSize, unitsPerEm, ascender, 0.7);
    const bbox = path.getBoundingBox();
    const autoWidth = Number.isFinite(bbox.x2) ? Math.max(420, Math.round(bbox.x2 + 80)) : 650;

    glyphs.push(
      new opentype.Glyph({
        name: `uni${data.unicode.toString(16).toUpperCase().padStart(4, '0')}`,
        unicode: data.unicode,
        advanceWidth: data.advanceWidth || autoWidth,
        path,
      })
    );
    activeCount++;
  }

  const font = new opentype.Font({
    familyName: meta.familyName || 'PanglossCustom',
    styleName: meta.styleName || 'Regular',
    unitsPerEm,
    ascender,
    descender,
    designer: meta.designer || 'Pangloss Font Studio User',
    description: meta.description || 'Created locally in Pangloss Font Studio',
    license: meta.license || 'OFL-1.1',
    glyphs,
  });

  const buffer = font.toArrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  return {
    familyName: meta.familyName || 'PanglossCustom',
    buffer,
    base64,
    glyphCount: activeCount,
    compiledAt: Date.now(),
  };
}

export interface StudioParametricTransform {
  boldness: number; // -1 (thin) .. 0 (normal) .. +2 (heavy bold)
  slantDeg: number; // -18 .. +18 degrees oblique shear
  widthScale: number; // 0.75 .. 1.35 horizontal optical expansion
}

export function applyParametricGridTransform(
  srcGrid: Uint8Array,
  gridSize: number,
  params: StudioParametricTransform
): Uint8Array {
  const { boldness = 0, slantDeg = 0, widthScale = 1 } = params;
  if (boldness === 0 && slantDeg === 0 && Math.abs(widthScale - 1) < 0.01) {
    return srcGrid;
  }

  // Step 1: Morphological dilation (boldness > 0) or erosion (boldness < 0)
  let morphed = srcGrid;
  if (boldness !== 0) {
    morphed = new Uint8Array(gridSize * gridSize);
    const radius = Math.min(3, Math.abs(Math.round(boldness)));
    const isDilate = boldness > 0;

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        let hit = isDilate ? 0 : 1;
        outer: for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy > radius * radius + 0.5) continue;
            const nx = x + dx;
            const ny = y + dy;
            const val =
              nx >= 0 && ny >= 0 && nx < gridSize && ny < gridSize
                ? srcGrid[ny * gridSize + nx]
                : 0;
            if (isDilate && val > 0) {
              hit = 1;
              break outer;
            }
            if (!isDilate && val === 0) {
              hit = 0;
              break outer;
            }
          }
        }
        morphed[y * gridSize + x] = hit;
      }
    }
  }

  // Step 2: Inverse affine shear (slant) + horizontal scale centered at (cx, baseline)
  if (slantDeg === 0 && Math.abs(widthScale - 1) < 0.01) {
    return morphed;
  }

  const transformed = new Uint8Array(gridSize * gridSize);
  const tanSlant = Math.tan((slantDeg * Math.PI) / 180);
  const cx = gridSize / 2;
  const baselineY = gridSize * 0.8;

  for (let y = 0; y < gridSize; y++) {
    const dy = baselineY - y;
    for (let x = 0; x < gridSize; x++) {
      const sx = Math.round(cx + (x - cx - tanSlant * dy) / Math.max(0.4, widthScale));
      if (sx >= 0 && sx < gridSize && morphed[y * gridSize + sx] > 0) {
        transformed[y * gridSize + x] = 1;
      }
    }
  }

  return transformed;
}

export function compileParametricStudioFont(
  meta: StudioFontMeta,
  glyphMap: Record<string, StudioGlyphData>,
  params: StudioParametricTransform,
  canvasSize = 400
): CompiledStudioFont {
  const unitsPerEm = meta.unitsPerEm || 1000;
  const ascender = meta.ascender || 800;
  const descender = meta.descender || -200;
  const gridSize = 96;

  const notdefPath = new opentype.Path();
  notdefPath.moveTo(100, 0);
  notdefPath.lineTo(100, 700);
  notdefPath.lineTo(500, 700);
  notdefPath.lineTo(500, 0);
  notdefPath.close();

  const glyphs: opentype.Glyph[] = [
    new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: 600,
      path: notdefPath,
    }),
    new opentype.Glyph({
      name: 'space',
      unicode: 32,
      advanceWidth: Math.round(320 * (params.widthScale || 1)),
      path: new opentype.Path(),
    }),
  ];

  let activeCount = 0;
  for (const data of Object.values(glyphMap)) {
    if (!data.char || data.unicode === 32) continue;
    const hasInk = data.strokes.length > 0 || (data.tracedMask && data.tracedMask.some((v) => v > 0));
    if (!hasInk) continue;

    const rawGrid = rasterizeGlyphToGrid(data, canvasSize, gridSize);
    const paramGrid = applyParametricGridTransform(rawGrid, gridSize, params);
    const contours = extractGridContours(paramGrid, gridSize, gridSize);
    const path = contoursToOpenTypePath(contours, gridSize, unitsPerEm, ascender, 0.7);
    const bbox = path.getBoundingBox();
    const autoWidth = Number.isFinite(bbox.x2) ? Math.max(420, Math.round(bbox.x2 + 80)) : 650;

    glyphs.push(
      new opentype.Glyph({
        name: `uni${data.unicode.toString(16).toUpperCase().padStart(4, '0')}`,
        unicode: data.unicode,
        advanceWidth: Math.round((data.advanceWidth || autoWidth) * (params.widthScale || 1)),
        path,
      })
    );
    activeCount++;
  }

  const font = new opentype.Font({
    familyName: meta.familyName || 'PanglossCustom',
    styleName: meta.styleName || 'Regular',
    unitsPerEm,
    ascender,
    descender,
    designer: meta.designer || 'Pangloss Font Studio User',
    description: meta.description || 'Created locally in Pangloss Font Studio',
    license: meta.license || 'OFL-1.1',
    glyphs,
  });

  const buffer = font.toArrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  return {
    familyName: meta.familyName || 'PanglossCustom',
    buffer,
    base64,
    glyphCount: activeCount,
    compiledAt: Date.now(),
  };
}
