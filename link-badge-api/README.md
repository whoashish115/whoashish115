# link-badge

Renders any text as a **transparent-background SVG in a colour you choose** — for coloured, non-boxed clickable links in a GitHub README (or anywhere else `<img>` works), where GitHub strips inline CSS and a plain `[text](url)` link can't be recoloured.

Zero dependencies. Node 18+. Works as a CLI, as a library, or as a Cloudflare Worker.

## One line

```bash
npx link-badge "Hello World" --color c2428f
```

That writes `./hello-world.svg`. Add `--print` to send it to stdout instead.

If you have this repo checked out rather than the published package, the same command is:

```bash
node link-badge-api/bin/cli.js "Hello World" --color c2428f
```

## Bulk generation

Point it at a manifest and it writes the whole set in one pass:

```bash
npx link-badge batch badges.json --out-dir assets/link-badges
```

**JSON manifest** — `defaults` apply to every entry, per-entry keys win:

```json
{
  "defaults": { "color": "C2428F", "size": 15, "weight": 700 },
  "badges": [
    { "text": "Hypertracer" },
    { "text": "E-Mail", "weight": 600 },
    { "text": "Custom filename", "name": "my-badge" }
  ]
}
```

A bare JSON array works too, and its items may be plain strings.

**Plain-text manifest** — one badge per line, `#` starts a comment, `Text | filename` overrides the generated filename:

```
# social links
Website
Hugging Face | hf
```

**stdin** — pass `-` as the manifest:

```bash
printf 'Website\nGitHub\nKaggle\n' | npx link-badge batch - --out-dir out
```

Filenames are slugged from the text (`Conway's Game of Life` → `conways-game-of-life.svg`). If two entries slug to the same name the second is written as `…-2.svg` with a warning, rather than silently overwriting the first.

## Options

| Flag | Default | Notes |
|---|---|---|
| `-c, --color <hex>` | `C2428F` | 3- or 6-digit hex, with or without `#`. Invalid values fall back to the default. |
| `-f, --font <name>` | `system` | `system` (GitHub's UI font), `mono`, `serif`, or any raw CSS `font-family` string. |
| `-s, --size <px>` | `15` | 8–96. |
| `-w, --weight <n>` | `700` | 100–900. |
| `--no-underline` | — | Drops the underline rule; the text keeps its exact width. |
| `--context <px>` | `16` | Font-size of the text the badge sits beside. Sets the vertical alignment — 16px is GitHub README body copy. |
| `-o, --out <file>` | — | Single-badge mode: exact output path. |
| `-d, --out-dir <dir>` | `.` | Directory to write into. |
| `-p, --print` | — | Write the SVG to stdout. |

`link-badge --help` prints the same list.

## Local preview server

```bash
npx link-badge serve --port 8787
# http://localhost:8787/badge?text=Hello+World&color=c2428f
```

Same query parameters as the deployed Worker, so you can iterate without deploying.

## Use in a README

```md
[<img src="assets/link-badges/website.svg" alt="Website" align="absmiddle">](https://example.com)
```

**Use `align="absmiddle"`, not `align="middle"`.** They look interchangeable and are not. Per the HTML rendering spec, `absmiddle` maps to CSS `vertical-align: middle` — the image's centre goes on the surrounding baseline *plus half its x-height* — whereas plain `middle` centres the image on the baseline itself. This tool's geometry targets the CSS meaning, so `middle` drops the badge by half an x-height (about 3.5px next to 16px text), which is exactly the "text sits slightly low" look. GitHub's HTML sanitiser preserves both values, so the wrong one fails silently.

## As a library

```js
import { renderSvg } from "link-badge";

renderSvg({ text: "Hello", color: "c2428f", size: 18 }); // -> "<svg …>"
```

`renderSvg` never throws on bad input; every value is validated and falls back to its default.

## Deploy the API (Cloudflare Workers, free tier)

```bash
cd link-badge-api
npx wrangler login
npx wrangler deploy
```

That prints a live URL (`https://link-badge-api.<your-subdomain>.workers.dev`). Then:

```md
[![Website](https://YOUR-WORKER-URL/badge?text=Website&color=c2428f)](https://example.com)
```

The Worker imports the same `src/render.js` as the CLI, so a badge served from it is byte-identical to one written to disk.

## How the geometry works

A Worker has no font-measurement API, so width comes from a per-character advance-width table extracted from the real Segoe UI and Segoe UI Bold font files with fonttools (`tools/extract_metrics.py`) — not a flat per-character estimate. Narrow glyphs (`i l t f .`) count for less, wide ones (`M W @`) for more, and bold has its own table because bold glyphs are measurably wider.

Three things that are easy to get wrong, and how they're handled:

- **Clipping.** An SVG embedded via `<img>` clips to its declared viewport — `overflow: visible` only applies to inline/DOM SVG. So ascender and descender room is baked into the height rather than left to overflow.
- **Font substitution.** The metrics are Segoe UI's, but a reader on macOS or Linux resolves the font stack to something else. `textLength` with `lengthAdjust="spacingAndGlyphs"` pins the rendered text to exactly the measured width, so a different font fits the box instead of spilling out of it or leaving a gap.
- **Baseline alignment.** `vertical-align: middle` puts the image's centre half an x-height above the surrounding baseline, so the glyph baseline coincides with the text's baseline only when `height = 2 × (baseline − xHeight/2)`. x-height is ~0.5em across the UI font stack, so half of it is `context / 4`. The glyph baseline is then pushed far enough down the box that what remains below it still clears the descenders and the underline — which is why small badges get headroom above the text rather than a shorter box.

Verified empirically, not just asserted: rasterising a badge and scanning pixels puts the ink bottom of a flat-bottomed `H` exactly on the declared baseline (0.00px error at 15px and 48px), and measuring the rendered offset against surrounding text across 768 combinations of badge size, body size, container (`p`/`li`/`td`/`h3`) and font family gives 0–0.16px at GitHub's 16px body — against +3.5px for the `align="middle"` version.

`test/render.test.js` asserts each of these across sizes 8–96:

```bash
npm test
```

## Regenerating this profile's badges

```bash
npm run badges   # badges.json -> ../assets/link-badges/
```

The README references only the files under `assets/link-badges/`, so this whole directory can be deleted once the badges are generated.
