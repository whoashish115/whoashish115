// Core renderer, shared by the CLI (bin/cli.js) and the Cloudflare Worker
// (worker.js). No dependencies, no Node built-ins -- runs anywhere.

import {
  FONT_STACKS,
  CHAR_WIDTH_EM,
  CHAR_WIDTH_EM_BOLD,
  DEFAULT_CHAR_WIDTH_EM,
  DEFAULT_CHAR_WIDTH_EM_BOLD,
  WIDE_CHAR_WIDTH_EM,
  isWide,
} from "./metrics.js";

export const DEFAULTS = {
  color: "C2428F",
  font: "system",
  size: 15,
  weight: 700,
  underline: true,
  context: 16, // font-size (px) of the text the badge sits next to
};

export const LIMITS = {
  maxTextLength: 200,
  minSize: 8,
  maxSize: 96,
  minWeight: 100,
  maxWeight: 900,
};

const MONO_ADVANCE_EM = 0.6; // monospace advance is weight-independent

function charWidthEm(char, monospace, bold) {
  if (monospace) return isWide(char) ? MONO_ADVANCE_EM * 2 : MONO_ADVANCE_EM;
  if (isWide(char)) return WIDE_CHAR_WIDTH_EM;
  const table = bold ? CHAR_WIDTH_EM_BOLD : CHAR_WIDTH_EM;
  const fallback = bold ? DEFAULT_CHAR_WIDTH_EM_BOLD : DEFAULT_CHAR_WIDTH_EM;
  return table[char] ?? fallback;
}

export function textWidthPx(text, fontSize, monospace, bold) {
  let em = 0;
  for (const char of text) em += charWidthEm(char, monospace, bold);
  return em * fontSize;
}

function xmlEscape(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function isHexColor(value) {
  return /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(value);
}

export function normalizeColor(value, fallback = DEFAULTS.color) {
  const hex = String(value ?? "").trim().replace(/^#/, "");
  return isHexColor(hex) ? hex : fallback;
}

// Strip control characters that would make the SVG document invalid, and
// collapse whitespace runs so the measured width matches the rendered width.
export function normalizeText(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIMITS.maxTextLength);
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  const s = String(value).toLowerCase();
  return !(s === "false" || s === "0" || s === "no" || s === "off");
}

/**
 * Resolve loose/untrusted input (query string, JSON manifest, argv) into a
 * fully validated option set. Never throws on a bad value -- it falls back.
 */
export function resolveOptions(input = {}) {
  const fontKey = String(input.font ?? DEFAULTS.font);

  let size = Number.parseFloat(input.size ?? DEFAULTS.size);
  if (!Number.isFinite(size) || size < LIMITS.minSize || size > LIMITS.maxSize) {
    size = DEFAULTS.size;
  }

  let weight = Number.parseInt(input.weight ?? DEFAULTS.weight, 10);
  if (!Number.isFinite(weight) || weight < LIMITS.minWeight || weight > LIMITS.maxWeight) {
    weight = DEFAULTS.weight;
  }

  return {
    text: normalizeText(input.text),
    color: normalizeColor(input.color),
    font: fontKey,
    fontFamily: FONT_STACKS[fontKey] ?? fontKey, // allow raw font-family strings
    monospace: fontKey === "mono",
    size: Math.round(size),
    weight: Math.round(weight / 100) * 100,
    underline:
      input.underline === undefined ? DEFAULTS.underline : toBoolean(input.underline),
    context: resolveContext(input.context),
  };
}

function resolveContext(value) {
  const n = Number.parseFloat(value ?? DEFAULTS.context);
  if (!Number.isFinite(n) || n < LIMITS.minSize || n > LIMITS.maxSize) return DEFAULTS.context;
  return n;
}

/**
 * Render the badge SVG.
 *
 * Geometry notes -- these are the parts that used to go wrong:
 *
 * - An SVG embedded via `<img>` clips to its declared viewport; `overflow:
 *   visible` only applies to inline/DOM SVG. So ascender and descender room
 *   has to be baked into the height, not left to overflow.
 * - `textLength` + `lengthAdjust="spacingAndGlyphs"` pins the rendered text to
 *   exactly the width we measured. Our metrics come from Segoe UI, but a
 *   viewer on macOS or Linux resolves the font stack to something else -- this
 *   makes that font fit the box instead of spilling out of it or leaving a
 *   gap, so the badge is never clipped and never padded.
 * - Vertical alignment. The badge must be placed with `align="absmiddle"`,
 *   NOT `align="middle"`. Per the HTML rendering spec they are different:
 *   `absmiddle` maps to CSS `vertical-align: middle`, which centres the image
 *   on the parent's baseline *plus half the parent's x-height*, while plain
 *   `middle` centres it on the baseline itself. Using `middle` with geometry
 *   built for the CSS meaning drops the text by half an x-height (~3.5px next
 *   to 16px text), which reads as the badge sitting low against the prose.
 *
 *   So: image centre lands at `contextBaseline - xHeight/2`, and the glyph
 *   baseline sits `baseline` px down from the image top. Setting
 *   `height = 2 * (baseline - xHeight/2)` makes those coincide, i.e. the badge
 *   shares a baseline with the text beside it. `context` is the surrounding
 *   font-size (16px is GitHub's README body); x-height is ~0.5em for every
 *   font in the UI stack, so half of it is `context / 4`.
 *
 *   `baseline` is then pushed down far enough that what remains below it still
 *   clears the descenders and the underline -- which is why small badges get a
 *   little headroom above the text rather than a shorter box.
  */
export function renderSvg(input = {}) {
  const o = resolveOptions(input);
  const bold = o.weight >= 600;

  const textWidth = textWidthPx(o.text, o.size, o.monospace, bold);
  const width = Math.max(Math.ceil(textWidth), 1);

  // Half the x-height of the surrounding text: the offset CSS
  // `vertical-align: middle` adds above the baseline. x-height is ~0.5em
  // across the UI font stack, so half of it is a quarter of the font-size.
  const halfXHeight = o.context / 4;

  const ascender = Math.ceil(o.size * 0.8);
  const descent = Math.ceil(o.size * 0.24);
  const underlineOffset = Math.max(2, Math.round(o.size * 0.14));
  const strokeWidth = o.size >= 24 ? 2 : 1;

  // Room that must exist below the glyph baseline, inside the box.
  const below = Math.max(descent, o.underline ? underlineOffset + strokeWidth + 1 : 0);

  // height = 2 * (baseline - halfXHeight) is what makes the glyph baseline
  // land on the surrounding text's baseline. That leaves
  // `baseline - 2 * halfXHeight` px below the glyphs, so the baseline has to
  // sit at least that far down for descenders and the underline to fit.
  const baseline = Math.max(ascender, Math.ceil(2 * halfXHeight + below));
  const underlineY = baseline + underlineOffset;
  const height = Math.round(2 * (baseline - halfXHeight));

  const label = xmlEscape(o.text);
  const underline = o.underline
    ? `<line x1="0" y1="${underlineY}" x2="${width}" y2="${underlineY}" ` +
      `stroke="#${o.color}" stroke-width="${strokeWidth}"/>`
    : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}"` +
    ` width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<title>${label}</title>` +
    `<text x="0" y="${baseline}" textLength="${width}" lengthAdjust="spacingAndGlyphs"` +
    ` font-family="${xmlEscape(o.fontFamily)}" font-size="${o.size}"` +
    ` font-weight="${o.weight}" fill="#${o.color}">${label}</text>` +
    underline +
    `</svg>\n`
  );
}

/** Filename-safe slug, used when a batch entry doesn't name its output file. */
export function slugify(text) {
  const slug = String(text)
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .replace(/['‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "badge";
}
