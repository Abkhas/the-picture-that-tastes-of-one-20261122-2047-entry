// Variant C — dark chocolate cake slice with glossy ganache + strawberry.
// Bold flat illustration, warm light, one hero dish, big in frame, no text.
import { Img, radial, ell, circ, poly, line, soft, savePNG } from "./pnglib.ts";

const size = Number(process.argv[2] ?? 900);
const out = process.argv[3] ?? "dev/cake.png";
const img = new Img(size, size);
const F = (f: number): number => f * size;

// Warm cream background, glowing centre.
radial(img, F(0.5), F(0.45), F(0.78), [250, 232, 205], [208, 158, 108]);
// Plate shadow + plate.
soft(img, F(0.5), F(0.88), F(0.42), F(0.045), [120, 70, 30], 0.30);
ell(img, F(0.5), F(0.85), F(0.40), F(0.06), [248, 244, 236]);

// Cake wedge: tall back at right, tip pointing left.
// A = top-back (0.70,0.36), B = bottom-back (0.70,0.78), C = tip (0.28,0.70).
poly(img, [[F(0.70), F(0.36)], [F(0.70), F(0.78)], [F(0.28), F(0.70)]], [74, 40, 26]);
// Warm light on the front face.
soft(img, F(0.55), F(0.55), F(0.16), F(0.12), [140, 80, 50], 0.28);

// Cream layers (horizontal bands clipped by the wedge edges).
// Edge A->C: x = 0.70 - (y-0.36) * (0.42/0.34).
poly(img, [[F(0.70), F(0.58)], [F(0.70), F(0.63)], [F(0.366), F(0.63)], [F(0.428), F(0.58)]], [243, 226, 196]);
poly(img, [[F(0.70), F(0.66)], [F(0.70), F(0.70)], [F(0.28), F(0.70)], [F(0.3295), F(0.66)]], [243, 226, 196]);

// Glossy ganache along the slanted top edge A->C.
line(img, F(0.70), F(0.36), F(0.28), F(0.70), F(0.035), [40, 20, 14]);
line(img, F(0.66), F(0.395), F(0.36), F(0.655), F(0.008), [130, 78, 48], 0.65);

// Ganache drip down the back face.
poly(img, [[F(0.685), F(0.38)], [F(0.70), F(0.38)], [F(0.70), F(0.50)], [F(0.692), F(0.50)]], [40, 20, 14]);

// Strawberry perched on top near the back.
ell(img, F(0.62), F(0.30), F(0.055), F(0.06), [205, 40, 45]);
poly(img, [[F(0.575), F(0.32)], [F(0.665), F(0.32)], [F(0.62), F(0.40)]], [205, 40, 45]);
circ(img, F(0.61), F(0.29), F(0.018), [228, 80, 80], 0.8);
// Strawberry seeds.
const seeds: ReadonlyArray<readonly [number, number]> = [
  [0.60, 0.30], [0.64, 0.31], [0.62, 0.34], [0.59, 0.33], [0.65, 0.35], [0.61, 0.37],
];
for (const [sx, sy] of seeds) ell(img, F(sx), F(sy), F(0.005), F(0.008), [250, 220, 180]);
// Strawberry leaves.
poly(img, [[F(0.62), F(0.235)], [F(0.585), F(0.26)], [F(0.655), F(0.26)]], [46, 130, 60]);
poly(img, [[F(0.62), F(0.24)], [F(0.60), F(0.265)], [F(0.64), F(0.265)]], [70, 160, 80]);

// Cream dollop on the plate beside the slice.
ell(img, F(0.80), F(0.79), F(0.05), F(0.028), [250, 244, 235]);
ell(img, F(0.80), F(0.765), F(0.032), F(0.022), [252, 248, 242]);
circ(img, F(0.795), F(0.755), F(0.010), [255, 255, 255], 0.9);

// Cocoa dust + crumbs on the plate.
const crumbs: ReadonlyArray<readonly [number, number, number]> = [
  [0.22, 0.80, 0.006], [0.26, 0.83, 0.005], [0.85, 0.83, 0.006], [0.88, 0.79, 0.004], [0.18, 0.84, 0.005],
];
for (const [cx, cy, r] of crumbs) circ(img, F(cx), F(cy), F(r), [90, 55, 35]);

savePNG(img, out);
console.log(out, size);
