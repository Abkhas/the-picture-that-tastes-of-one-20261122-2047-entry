// pnglib.ts — minimal pure-stdlib canvas + PNG encoder (no deps, no network).
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

export type RGB = [number, number, number];

export class Img {
  readonly w: number;
  readonly h: number;
  readonly d: Uint8Array;
  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.d = new Uint8Array(w * h * 4).fill(255);
  }
  px(x: number, y: number, r: number, g: number, b: number, a: number): void {
    const ix = x | 0, iy = y | 0;
    if (ix < 0 || iy < 0 || ix >= this.w || iy >= this.h) return;
    const o = (iy * this.w + ix) * 4;
    const d = this.d, ia = 1 - a;
    d[o] = r * a + d[o] * ia;
    d[o + 1] = g * a + d[o + 1] * ia;
    d[o + 2] = b * a + d[o + 2] * ia;
  }
}

export function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
export function mix(c0: RGB, c1: RGB, t: number): RGB {
  return [lerp(c0[0], c1[0], t), lerp(c0[1], c1[1], t), lerp(c0[2], c1[2], t)];
}
export function sh(c: RGB, f: number): RGB { return [c[0] * f, c[1] * f, c[2] * f]; }

export function vgrad(img: Img, c0: RGB, c1: RGB): void {
  for (let y = 0; y < img.h; y++) {
    const c = mix(c0, c1, y / (img.h - 1));
    for (let x = 0; x < img.w; x++) img.px(x, y, c[0], c[1], c[2], 1);
  }
}

export function radial(img: Img, cx: number, cy: number, r: number, c0: RGB, c1: RGB): void {
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const dx = (x - cx) / r, dy = (y - cy) / r;
      let t = Math.sqrt(dx * dx + dy * dy);
      if (t > 1) t = 1;
      const c = mix(c0, c1, t);
      img.px(x, y, c[0], c[1], c[2], 1);
    }
  }
}

export function ell(img: Img, cx: number, cy: number, rx: number, ry: number, c: RGB, a = 1): void {
  const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(img.w - 1, Math.ceil(cx + rx));
  const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(img.h - 1, Math.ceil(cy + ry));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) img.px(x, y, c[0], c[1], c[2], a);
    }
  }
}

export function circ(img: Img, cx: number, cy: number, r: number, c: RGB, a = 1): void {
  ell(img, cx, cy, r, r, c, a);
}

// Soft-edged ellipse (alpha falls off quadratically to the edge).
export function soft(img: Img, cx: number, cy: number, rx: number, ry: number, c: RGB, a = 1): void {
  const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(img.w - 1, Math.ceil(cx + rx));
  const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(img.h - 1, Math.ceil(cy + ry));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      const q = 1 - (dx * dx + dy * dy);
      if (q > 0) img.px(x, y, c[0], c[1], c[2], a * q * q);
    }
  }
}

export function rect(img: Img, x: number, y: number, w: number, h: number, c: RGB, a = 1): void {
  const x0 = Math.max(0, Math.floor(x)), x1 = Math.min(img.w - 1, Math.ceil(x + w));
  const y0 = Math.max(0, Math.floor(y)), y1 = Math.min(img.h - 1, Math.ceil(y + h));
  for (let yy = y0; yy <= y1; yy++) {
    for (let xx = x0; xx <= x1; xx++) img.px(xx, yy, c[0], c[1], c[2], a);
  }
}

// Even-odd scanline polygon fill.
export function poly(img: Img, pts: number[][], c: RGB, a = 1): void {
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  for (let y = Math.max(0, Math.ceil(minY)); y <= Math.min(img.h - 1, Math.floor(maxY)); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[i], p1 = pts[(i + 1) % pts.length];
      if ((p0[1] <= y && p1[1] > y) || (p1[1] <= y && p0[1] > y)) {
        xs.push(p0[0] + (y - p0[1]) * (p1[0] - p0[0]) / (p1[1] - p0[1]));
      }
    }
    xs.sort((x, y) => x - y);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.max(0, Math.ceil(xs[k])); x <= Math.min(img.w - 1, Math.floor(xs[k + 1])); x++) {
        img.px(x, y, c[0], c[1], c[2], a);
      }
    }
  }
}

export function line(img: Img, x0: number, y0: number, x1: number, y1: number, w: number, c: RGB, a = 1): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(len / 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    circ(img, lerp(x0, x1, t), lerp(y0, y1, t), w / 2, c, a);
  }
}

export function arc(img: Img, cx: number, cy: number, r: number, a0: number, a1: number, w: number, c: RGB, a = 1): void {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * r / 2));
  for (let i = 0; i <= n; i++) {
    const t = a0 + (a1 - a0) * i / n;
    circ(img, cx + Math.cos(t) * r, cy + Math.sin(t) * r, w / 2, c, a);
  }
}

export function ring(img: Img, cx: number, cy: number, r: number, w: number, c: RGB, a = 1): void {
  arc(img, cx, cy, r, 0, Math.PI * 2, w, c, a);
}

// Sine wave between two points (for noodles, lettuce edges).
export function wave(img: Img, x0: number, y0: number, x1: number, y1: number, amp: number, waves: number, w: number, c: RGB, a = 1): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(8, Math.ceil(len / 2));
  const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const off = Math.sin(t * waves * Math.PI * 2) * amp;
    circ(img, lerp(x0, x1, t) + nx * off, lerp(y0, y1, t) + ny * off, w / 2, c, a);
  }
}

const CRC_TABLE: Uint32Array = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

export function savePNG(img: Img, path: string): void {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.w, 0);
  ihdr.writeUInt32BE(img.h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(img.h * (1 + img.w * 4));
  for (let y = 0; y < img.h; y++) {
    raw[y * (1 + img.w * 4)] = 0;
    raw.set(img.d.subarray(y * img.w * 4, (y + 1) * img.w * 4), y * (1 + img.w * 4) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}
