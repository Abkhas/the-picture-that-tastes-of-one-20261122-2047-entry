// Variant A — steaming bowl of ramen, chopsticks lifting noodles.
// Bold flat illustration, warm light, one hero dish, big in frame, no text.
import { Img, radial, ell, circ, line, arc, ring, wave, soft, savePNG } from "./pnglib.ts";
import type { RGB } from "./pnglib.ts";

const size = Number(process.argv[2] ?? 900);
const out = process.argv[3] ?? "dev/ramen.png";
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

// (No rim arc: an ellipse-rim highlight drawn as a circle floated above the bowl.)

savePNG(img, out);
console.log(out, size);
