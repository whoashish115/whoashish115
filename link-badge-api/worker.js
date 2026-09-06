// Colored-text link badge generator — Cloudflare Worker.
// GET /badge?text=Hello+World&color=e861b2&font=system&size=16
//
// Renders a transparent-background SVG containing only the given text in the
// given color, tightly sized to the text (no padding/dead space), with the
// baseline positioned so it lines up with surrounding prose when used inline
// via markdown: [![Label](https://your-worker.dev/badge?text=Label)](url)

const FONT_STACKS = {
  system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  serif: "Georgia, 'Times New Roman', serif",
};

// Real per-character advance widths (as a fraction of font-size/em),
// extracted directly from the actual Segoe UI font file via fonttools —
// not guessed categories. See extract_metrics.py.
const CHAR_WIDTH_EM = {
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
};
const DEFAULT_CHAR_WIDTH_EM = 0.55; // fallback for characters not in the table above

function charWidthEm(c, monospace) {
  if (monospace) return 0.6;
  return CHAR_WIDTH_EM[c] ?? DEFAULT_CHAR_WIDTH_EM;
}

function textWidthPx(text, fontSize, monospace) {
  let em = 0;
  for (const c of text) em += charWidthEm(c, monospace);
  return em * fontSize;
}

function xmlEscape(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isHexColor(s) {
  return /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(s);
}

function renderSvg({ text, color, fontFamily, fontSize, weight, monospace }) {
  // `<img>`-embedded SVGs clip to their declared viewport regardless of
  // `overflow: visible` (that only works for inline/DOM-embedded SVGs), so
  // real headroom/descender room has to be baked into height/baseline math
  // instead of relying on overflow to reveal it.
  const textWidth = textWidthPx(text, fontSize, monospace);
  const width = Math.max(Math.round(textWidth) + 1, 4);
  // Standard formula, always the same regardless of text/color/font.
  // Rendered with align="middle" so the browser centers the image against
  // the line instead of us hand-computing baseline offsets.
  const baselineY = Math.ceil(fontSize * 0.68);
  const underlineY = baselineY + 4;
  const height = Math.max(baselineY + Math.max(5, Math.ceil(fontSize * 0.16)), underlineY + 5);
  const underline = `<line x1="0" y1="${underlineY}" x2="${Math.round(textWidth)}" y2="${underlineY}" stroke="#${color}" stroke-width="1"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" height="${height}" width="${width}"><text x="0" y="${baselineY}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${weight}" fill="#${color}">${xmlEscape(text)}</text>${underline}</svg>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/badge") {
      return new Response(
        "Colored-text badge API. Try /badge?text=Hello+World&color=e861b2",
        { status: 200, headers: { "content-type": "text/plain" } }
      );
    }

    const text = (url.searchParams.get("text") || "").slice(0, 200);
    if (!text) {
      return new Response("Missing ?text=", { status: 400 });
    }

    let color = url.searchParams.get("color") || "e861b2";
    color = color.replace(/^#/, "");
    if (!isHexColor(color)) color = "e861b2";

    const fontParam = url.searchParams.get("font") || "system";
    const fontFamily = FONT_STACKS[fontParam] || fontParam; // pass through arbitrary font-family strings too
    const monospace = fontParam === "mono";

    let fontSize = parseInt(url.searchParams.get("size") || "14", 10);
    if (!Number.isFinite(fontSize) || fontSize < 8 || fontSize > 96) fontSize = 14;

    let weight = url.searchParams.get("weight") || "400";
    if (!/^[0-9]{3}$/.test(weight)) weight = "400";

    const svg = renderSvg({ text, color, fontFamily, fontSize, weight, monospace });

    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=86400",
        "access-control-allow-origin": "*",
      },
    });
  },
};
