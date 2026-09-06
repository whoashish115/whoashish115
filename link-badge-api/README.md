# link-badge-api

Renders any text as a transparent-background SVG in a color you choose — for making colored, non-boxed clickable links in a GitHub README (or anywhere else `<img>` tags work), where GitHub strips inline CSS/`style` attributes and a normal `[text](url)` link can't be recolored.

## Usage

```
GET /badge?text=Hello+World&color=e861b2&font=system&size=16&weight=600
```

| Param | Default | Notes |
|---|---|---|
| `text` | *(required)* | Any words/phrase, up to 200 chars. Width is fit tightly — no dead space. |
| `color` | `e861b2` | Hex, with or without `#`. |
| `font` | `system` | `system` (GitHub's UI font), `mono`, `serif`, or any raw CSS `font-family` string (e.g. `Georgia`). |
| `size` | `16` | Font size in px (8–96). |
| `weight` | `400` | CSS font-weight (100–900). |

In a README:

```md
[![Website](https://YOUR-WORKER-URL/badge?text=Website&color=e861b2)](https://example.com)
```

## Deploy (Cloudflare Workers, free tier)

```
cd link-badge-api
npx wrangler login
npx wrangler deploy
```

That prints your live URL (`https://link-badge-api.<your-subdomain>.workers.dev`). Swap that in for `YOUR-WORKER-URL` above.

## How it renders tightly with no dead space

There's no real font-measurement API available in a Worker, so width is computed from a per-character advance-width table (same approach shields.io uses internally) rather than guessed as a flat per-character estimate — narrow characters (`i l t f .` etc.) count for less, wide ones (`M W`) for more. The SVG height equals the font's baseline position with `overflow: visible`, so descenders (`g y p`) aren't clipped but the image's bottom edge still lines up with the surrounding text's baseline when placed inline.
