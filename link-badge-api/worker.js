// Cloudflare Worker front-end for the badge renderer.
//
//   GET /badge?text=Hello+World&color=c2428f&font=system&size=15&weight=700
//
// All of the geometry lives in src/render.js, shared with the CLI, so a badge
// served from here is byte-identical to one written by `link-badge`.

import { DEFAULTS, renderSvg, resolveOptions } from "./src/render.js";

const USAGE = `link-badge API

  GET /badge?text=Hello+World&color=${DEFAULTS.color}

  text       required, up to 200 chars
  color      hex, with or without '#'      (default ${DEFAULTS.color})
  font       system | mono | serif | any CSS font-family
  size       8-96                          (default ${DEFAULTS.size})
  weight     100-900                       (default ${DEFAULTS.weight})
  underline  true | false                  (default ${DEFAULTS.underline})
`;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname !== "/badge") {
      return new Response(USAGE, {
        status: url.pathname === "/" ? 200 : 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    const params = Object.fromEntries(url.searchParams);
    if (!resolveOptions(params).text) {
      return new Response("Missing ?text=", {
        status: 400,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    return new Response(renderSvg(params), {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "public, max-age=86400, immutable",
        "access-control-allow-origin": "*",
      },
    });
  },
};
