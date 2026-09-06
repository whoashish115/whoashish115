# Demo

These were rendered locally by running `worker.js` directly (no deployment needed to test the logic) — the SVG bytes are exactly what a deployed Worker would return for each query string.

![Website](demo/website.svg)
`?text=Website&color=e861b2`

![GitHub Quests](demo/github-quests.svg)
`?text=GitHub%20Quests&color=e861b2`

![Hello World](demo/hello-world-green.svg)
`?text=Hello%20World&color=22c55e&size=20`

![Monospace Text](demo/monospace-blue.svg)
`?text=Monospace%20Text&color=3b82f6&font=mono`

![Bold Purple](demo/bold-purple-700.svg)
`?text=Bold%20Purple&color=8b5cf6&weight=700`

![Conway's Game of Life](demo/conway-apostrophe.svg)
`?text=Conway%27s%20Game%20of%20Life&color=e861b2`

![Serif Heading](demo/serif-big.svg)
`?text=Serif%20Heading&color=f97316&font=serif&size=28`

Once deployed, replace `demo/<file>.svg` above with `https://YOUR-WORKER-URL/badge?...` to get the same render live from the API instead of a static file.

### Systems & Low-Level

- [<img src="../assets/link-badges/hypertracer.svg" alt="Hypertracer" align="start">](https://github.com/whoashish115/hypertracer) - From-scratch ray tracer in C++ with CUDA GPU acceleration and physically based rendering.
- [<img src="assets/link-badges/wintergreen.svg" alt="Wintergreen" align="start">](https://github.com/whoashish115/wintergreen) - Vector search library with Flat, IVF, HNSW, Product Quantization, and K-Means indexes in C++.
- [<img src="assets/link-badges/autiepie.svg" alt="Autiepie" align="start">](https://github.com/whoashish115/autiepie) - Regex engine in C++ using Thompson's NFA construction for backtracking-free linear-time matching.
- [<img src="assets/link-badges/uwun.svg" alt="Uwun" align="start">](https://github.com/whoashish115/uwun) - Lightweight cross-platform VPN tunneling IP traffic over mutual TLS using OpenSSL in modern C++.
