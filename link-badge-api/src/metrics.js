// Per-character advance widths as a fraction of the em (font-size), extracted
// from the real Segoe UI / Segoe UI Bold font files with fonttools rather than
// guessed by category — narrow glyphs (i l t f .) count for less, wide ones
// (M W @) for more. See ../tools/extract_metrics.py.
//
// These drive the SVG's declared width. The rendered text is then pinned to
// that exact width with `textLength`, so a viewer whose system font differs
// from Segoe UI still gets text that fits the box instead of overflowing it.

export const FONT_STACKS = {
  system:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  serif: "Georgia, 'Times New Roman', serif",
};

export const CHAR_WIDTH_EM = {
  a: 0.5088, b: 0.5879, c: 0.4619, d: 0.5889, e: 0.5229, f: 0.313, g: 0.5889,
  h: 0.5659, i: 0.2422, j: 0.2422, k: 0.4971, l: 0.2422, m: 0.8613, n: 0.5659,
  o: 0.5859, p: 0.5879, q: 0.5889, r: 0.3477, s: 0.4243, t: 0.3389, u: 0.5659,
  v: 0.479, w: 0.7227, x: 0.459, y: 0.4839, z: 0.4521,
  A: 0.645, B: 0.5732, C: 0.6191, D: 0.7012, E: 0.5059, F: 0.4883, G: 0.686,
  H: 0.71, I: 0.2661, J: 0.3569, K: 0.5801, L: 0.4707, M: 0.8979, N: 0.748,
  O: 0.7539, P: 0.5601, Q: 0.7539, R: 0.5981, S: 0.5312, T: 0.5239, U: 0.687,
  V: 0.6211, W: 0.9341, X: 0.5898, Y: 0.5527, Z: 0.5703,
  "0": 0.5391, "1": 0.5391, "2": 0.5391, "3": 0.5391, "4": 0.5391,
  "5": 0.5391, "6": 0.5391, "7": 0.5391, "8": 0.5391, "9": 0.5391,
  " ": 0.2739, ".": 0.2168, ",": 0.2168, ":": 0.2168, ";": 0.2168,
  "!": 0.2842, "'": 0.23, "|": 0.2393, "@": 0.9551, "%": 0.8184,
  "-": 0.3999, "+": 0.6841, "_": 0.415, "/": 0.3896, "&": 0.8003,
  "(": 0.3018, ")": 0.3018, '"': 0.3921, "?": 0.4482,
  "[": 0.3018, "]": 0.3018, "{": 0.3271, "}": 0.3271,
  "<": 0.6841, ">": 0.6841, "=": 0.6841, "*": 0.4429, "#": 0.6353,
  "$": 0.5391, "^": 0.6841, "~": 0.6841, "`": 0.3018, "\\": 0.3896,
  "·": 0.2725, "–": 0.539, "—": 0.8618,
  "‘": 0.23, "’": 0.23, "“": 0.3921, "”": 0.3921,
  "…": 0.7998,
};

// Bold glyphs are measurably wider; reusing the regular table for bold text
// under-measures and clips the last characters.
export const CHAR_WIDTH_EM_BOLD = {
  a: 0.5381, b: 0.6201, c: 0.48, d: 0.6191, e: 0.541, f: 0.3833, g: 0.6191,
  h: 0.6021, i: 0.2842, j: 0.2842, k: 0.5591, l: 0.2842, m: 0.916, n: 0.605,
  o: 0.6113, p: 0.6201, q: 0.6191, r: 0.3979, s: 0.4399, t: 0.3892, u: 0.605,
  v: 0.542, w: 0.7974, x: 0.5522, y: 0.5381, z: 0.479,
  A: 0.7031, B: 0.6411, C: 0.624, D: 0.7373, E: 0.5322, F: 0.52, G: 0.7109,
  H: 0.7661, I: 0.3169, J: 0.4453, K: 0.6489, L: 0.5112, M: 0.957, N: 0.79,
  O: 0.7583, P: 0.6143, Q: 0.7583, R: 0.6528, S: 0.5605, T: 0.5859, U: 0.7231,
  V: 0.667, W: 1.0049, X: 0.6553, Y: 0.6069, Z: 0.6069,
  "0": 0.5752, "1": 0.5752, "2": 0.5752, "3": 0.5752, "4": 0.5752,
  "5": 0.5752, "6": 0.5752, "7": 0.5752, "8": 0.5752, "9": 0.5752,
  " ": 0.2759, ".": 0.271, ",": 0.271, ":": 0.271, ";": 0.271,
  "!": 0.3271, "'": 0.293, "|": 0.3262, "@": 0.9541, "%": 0.8672,
  "-": 0.4043, "+": 0.707, "_": 0.415, "/": 0.4434, "&": 0.8496,
  "(": 0.3691, ")": 0.3691, '"': 0.4932, "?": 0.438,
  "[": 0.3691, "]": 0.3691, "{": 0.3838, "}": 0.3838,
  "<": 0.707, ">": 0.707, "=": 0.707, "*": 0.5127, "#": 0.7002,
  "$": 0.5752, "^": 0.707, "~": 0.707, "`": 0.3691, "\\": 0.4434,
  "·": 0.3262, "–": 0.5752, "—": 0.8618,
  "‘": 0.293, "’": 0.293, "“": 0.4932, "”": 0.4932,
  "…": 0.813,
};

// Widths for characters absent from the tables above (CJK, emoji, rare
// punctuation). Deliberately generous: over-measuring leaves a little dead
// space, under-measuring clips glyphs.
export const DEFAULT_CHAR_WIDTH_EM = 0.55;
export const DEFAULT_CHAR_WIDTH_EM_BOLD = 0.6;
export const WIDE_CHAR_WIDTH_EM = 1.0; // full-width / CJK / emoji

const WIDE_RANGES = [
  [0x1100, 0x115f], [0x2e80, 0x303e], [0x3041, 0x33ff],
  [0x3400, 0x4dbf], [0x4e00, 0x9fff], [0xa000, 0xa4cf],
  [0xac00, 0xd7a3], [0xf900, 0xfaff], [0xfe30, 0xfe6f],
  [0xff00, 0xff60], [0xffe0, 0xffe6], [0x1f300, 0x1faff],
];

export function isWide(char) {
  const cp = char.codePointAt(0);
  return WIDE_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi);
}
