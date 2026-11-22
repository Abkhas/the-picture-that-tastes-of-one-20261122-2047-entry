// The picture that tastes of one ingredient — steaming bowl of ramen.
// Pure Node stdlib: builds an RGBA pixel buffer, encodes PNG with node:zlib.
// Writes ONE image to /output/entry.png (override for local testing via OUTPUT_PATH).
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

type RGB = [number, number, number];

class Img {
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

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function mix(c0: RGB, c1: RGB, t: number): RGB {
  return [lerp(c0[0], c1[0], t), lerp(c0[1], c1[1], t), lerp(c0[2], c1[2], t)];
}

function radial(img: Img, cx: number, cy: number, r: number, c0: RGB, c1: RGB): void {
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

function ell(img: Img, cx: number, cy: number, rx: number, ry: number, c: RGB, a = 1): void {
  const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(img.w - 1, Math.ceil(cx + rx));
  const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(img.h - 1, Math.ceil(cy + ry));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) img.px(x, y, c[0], c[1], c[2], a);
    }
  }
}

function circ(img: Img, cx: number, cy: number, r: number, c: RGB, a = 1): void {
  ell(img, cx, cy, r, r, c, a);
}

function soft(img: Img, cx: number, cy: number, rx: number, ry: number, c: RGB, a = 1): void {
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

function line(img: Img, x0: number, y0: number, x1: number, y1: number, w: number, c: RGB, a = 1): void {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.ceil(len / 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    circ(img, lerp(x0, x1, t), lerp(y0, y1, t), w / 2, c, a);
  }
}

function arc(img: Img, cx: number, cy: number, r: number, a0: number, a1: number, w: number, c: RGB, a = 1): void {
  const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * r / 2));
  for (let i = 0; i <= n; i++) {
    const t = a0 + (a1 - a0) * i / n;
    circ(img, cx + Math.cos(t) * r, cy + Math.sin(t) * r, w / 2, c, a);
  }
}

function ring(img: Img, cx: number, cy: number, r: number, w: number, c: RGB, a = 1): void {
  arc(img, cx, cy, r, 0, Math.PI * 2, w, c, a);
}

function wave(img: Img, x0: number, y0: number, x1: number, y1: number, amp: number, waves: number, w: number, c: RGB, a = 1): void {
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

function savePNG(img: Img, path: string): void {
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
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, png);
}

// ---- Scene: one steaming bowl of ramen, chopsticks lifting noodles ----
const size = 900;
const out = process.env.OUTPUT_PATH ?? "/output/entry.png";
const img = new Img(size, size);
const F = (f: number): number => f * size;

// Warm cream background, glowing centre behind the bowl.
radial(img, F(0.5), F(0.42), F(0.78), [250, 238, 210], [212, 162, 100]);
// Table shadow under the bowl.
ell(img, F(0.5), F(0.87), F(0.36), F(0.05), [120, 70, 30], 0.28);

// Bowl: deep red lacquer, rim catching light.
ell(img, F(0.5), F(0.60), F(0.37), F(0.21), [142, 38, 28]);
ell(img, F(0.5), F(0.585), F(0.37), F(0.21), [168, 52, 36]);
ell(img, F(0.5), F(0.66), F(0.36), F(0.16), [110, 26, 20], 0.55);

// Broth: rich orange, glossy.
ell(img, F(0.5), F(0.575), F(0.315), F(0.155), [216, 122, 42]);
ell(img, F(0.5), F(0.565), F(0.29), F(0.135), [232, 148, 62]);
soft(img, F(0.38), F(0.52), F(0.16), F(0.05), [255, 210, 130], 0.5);

// Noodle swirls floating on the broth.
arc(img, F(0.44), F(0.56), F(0.10), 0.3, 4.6, F(0.014), [246, 212, 136]);
arc(img, F(0.56), F(0.59), F(0.085), 2.2, 6.0, F(0.013), [246, 212, 136]);
arc(img, F(0.50), F(0.60), F(0.06), 0.0, 5.2, F(0.012), [240, 200, 120]);

// Chashu slices (left).
ell(img, F(0.30), F(0.55), F(0.055), F(0.035), [196, 110, 80]);
ell(img, F(0.30), F(0.55), F(0.04), F(0.024), [214, 140, 105]);

// Soft egg, yolk glowing.
ell(img, F(0.36), F(0.60), F(0.075), F(0.05), [250, 244, 230]);
circ(img, F(0.36), F(0.60), F(0.032), [238, 140, 40]);
circ(img, F(0.355), F(0.595), F(0.014), [255, 190, 90], 0.8);

// Narutomaki (right).
circ(img, F(0.65), F(0.60), F(0.045), [250, 246, 238]);
arc(img, F(0.65), F(0.60), F(0.026), 0.5, 5.0, F(0.008), [230, 110, 130]);

// Green onion rings.
const onions: ReadonlyArray<readonly [number, number]> = [[0.47, 0.52], [0.55, 0.52], [0.60, 0.55], [0.42, 0.55], [0.52, 0.63]];
for (const [gx, gy] of onions) {
  ring(img, F(gx), F(gy), F(0.013), F(0.006), [46, 130, 60]);
  circ(img, F(gx), F(gy), F(0.005), [120, 190, 90]);
}

// Chopsticks from top-right, lifting a tangle of noodles.
line(img, F(0.56), F(0.30), F(0.86), F(0.08), F(0.016), [107, 66, 38]);
line(img, F(0.56), F(0.335), F(0.88), F(0.115), F(0.016), [90, 54, 30]);
wave(img, F(0.565), F(0.315), F(0.52), F(0.52), F(0.018), 2.5, F(0.013), [246, 212, 136]);
wave(img, F(0.575), F(0.32), F(0.545), F(0.52), F(0.016), 3, F(0.012), [240, 200, 120]);
wave(img, F(0.555), F(0.31), F(0.50), F(0.50), F(0.014), 2, F(0.011), [250, 222, 150]);

// Steam rising in three soft columns.
const steam: ReadonlyArray<readonly [number, number]> = [[0.42, 0], [0.5, 1.2], [0.58, 2.4]];
for (const [sx, ph] of steam) {
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const y = F(0.44) - t * F(0.22);
    const x = F(sx) + Math.sin(t * 3 + ph) * F(0.02);
    soft(img, x, y, F(0.02), F(0.035), [255, 255, 255], 0.16 * (1 - t * 0.5));
  }
}

savePNG(img, out);
console.log(out, size);
