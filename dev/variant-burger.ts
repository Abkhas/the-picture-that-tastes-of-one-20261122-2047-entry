// Variant B — glossy burger, melted cheese dripping, sesame bun.
// Bold flat illustration, warm light, one hero dish, big in frame, no text.
import { Img, radial, ell, circ, poly, line, arc, wave, soft, savePNG } from "./pnglib.ts";

const size = Number(process.argv[2] ?? 900);
const out = process.argv[3] ?? "dev/burger.png";
const img = new Img(size, size);
const F = (f: number): number => f * size;

// Warm mustard background, glowing centre.
radial(img, F(0.5), F(0.45), F(0.78), [252, 226, 170], [224, 168, 98]);
// Plate shadow + plate.
soft(img, F(0.5), F(0.90), F(0.42), F(0.045), [120, 70, 30], 0.30);
ell(img, F(0.5), F(0.885), F(0.42), F(0.055), [240, 232, 218]);

// Bottom bun.
ell(img, F(0.5), F(0.815), F(0.29), F(0.075), [216, 152, 62]);
ell(img, F(0.5), F(0.83), F(0.27), F(0.05), [180, 118, 45], 0.6);

// Beef patty, charred edges.
ell(img, F(0.5), F(0.745), F(0.325), F(0.07), [88, 48, 26]);
ell(img, F(0.38), F(0.735), F(0.05), F(0.018), [60, 30, 16], 0.7);
ell(img, F(0.62), F(0.755), F(0.045), F(0.016), [60, 30, 16], 0.7);
ell(img, F(0.5), F(0.72), F(0.20), F(0.03), [120, 70, 38], 0.5);

// Melted cheese draped over the patty, dripping down.
poly(img, [
  [F(0.19), F(0.69)], [F(0.81), F(0.69)],
  [F(0.78), F(0.70)], [F(0.74), F(0.735)], [F(0.70), F(0.705)],
  [F(0.60), F(0.70)], [F(0.55), F(0.75)], [F(0.50), F(0.705)],
  [F(0.38), F(0.70)], [F(0.34), F(0.745)], [F(0.30), F(0.70)],
  [F(0.22), F(0.695)],
], [245, 160, 40]);
// Cheese gloss.
line(img, F(0.26), F(0.70), F(0.46), F(0.70), F(0.006), [255, 205, 110], 0.7);

// Tomato slice.
ell(img, F(0.5), F(0.665), F(0.29), F(0.032), [205, 55, 40]);
ell(img, F(0.5), F(0.658), F(0.26), F(0.02), [228, 90, 70], 0.6);

// Lettuce, wavy green edge peeking out.
wave(img, F(0.18), F(0.64), F(0.82), F(0.64), F(0.012), 6, F(0.028), [96, 168, 74]);
ell(img, F(0.20), F(0.645), F(0.035), F(0.018), [120, 185, 90]);
ell(img, F(0.80), F(0.645), F(0.035), F(0.018), [120, 185, 90]);

// Top bun: golden dome (upper half-ellipse), warm gradient feel via layered domes.
const dome: number[][] = [];
for (let i = 0; i <= 40; i++) {
  const a = Math.PI + (Math.PI * i) / 40;
  dome.push([F(0.5) + Math.cos(a) * F(0.31), F(0.615) + Math.sin(a) * F(0.20)]);
}
poly(img, dome, [222, 158, 66]);
ell(img, F(0.5), F(0.56), F(0.24), F(0.13), [238, 180, 95], 0.8);
// Dome gloss.
soft(img, F(0.38), F(0.47), F(0.14), F(0.06), [255, 220, 160], 0.55);
arc(img, F(0.5), F(0.615), F(0.30), Math.PI * 1.2, Math.PI * 1.8, F(0.007), [255, 215, 150], 0.5);

// Sesame seeds.
const seeds: ReadonlyArray<readonly [number, number]> = [
  [0.38, 0.47], [0.48, 0.43], [0.58, 0.46], [0.66, 0.52],
  [0.34, 0.55], [0.44, 0.53], [0.55, 0.55], [0.62, 0.42],
];
for (const [sx, sy] of seeds) ell(img, F(sx), F(sy), F(0.013), F(0.007), [250, 230, 180]);

savePNG(img, out);
console.log(out, size);
