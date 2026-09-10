# Demo

Rendered with `npm run demo` (`demo/demo.json` → `demo/`). The SVG bytes are exactly what a deployed Worker returns for the equivalent query string.

| Badge | Options |
|---|---|
| ![Website](demo/website.svg) | *(defaults)* |
| ![GitHub Quests](demo/github-quests.svg) | `weight: 600` |
| ![Hello World](demo/hello-world-green.svg) | `color: 22c55e, size: 20` |
| ![Monospace Text](demo/monospace-blue.svg) | `color: 3b82f6, font: mono` |
| ![Bold Pink](demo/bold-pink-700.svg) | *(defaults — weight 700)* |
| ![Conway's Game of Life](demo/conway-apostrophe.svg) | apostrophe measured correctly |
| ![Serif Heading](demo/serif-big.svg) | `color: f97316, font: serif, size: 28` |
| ![No underline](demo/no-underline.svg) | `underline: false` |
| ![Descenders](demo/descenders.svg) | descenders are not clipped |

Inline against prose, which is the real test of the baseline maths:

- [<img src="../assets/link-badges/hypertracer.svg" alt="Hypertracer" align="absmiddle">](https://github.com/whoashish115/hypertracer) - From-scratch ray tracer in C++ with CUDA GPU acceleration and physically based rendering.
- [<img src="../assets/link-badges/wintergreen.svg" alt="Wintergreen" align="absmiddle">](https://github.com/whoashish115/wintergreen) - Vector search library with Flat, IVF, HNSW, Product Quantization, and K-Means indexes in C++.
- [<img src="../assets/link-badges/autiepie.svg" alt="Autiepie" align="absmiddle">](https://github.com/whoashish115/autiepie) - Regex engine in C++ using Thompson's NFA construction for backtracking-free linear-time matching.
- [<img src="../assets/link-badges/uwun.svg" alt="Uwun" align="absmiddle">](https://github.com/whoashish115/uwun) - Lightweight cross-platform VPN tunneling IP traffic over mutual TLS using OpenSSL in modern C++.

Once deployed, swap `demo/<file>.svg` for `https://YOUR-WORKER-URL/badge?...` to get the same render live.
