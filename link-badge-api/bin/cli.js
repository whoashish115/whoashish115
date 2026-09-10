#!/usr/bin/env node
// link-badge -- render text as a transparent, tightly-fitted coloured SVG.
//
//   link-badge "Hello World"                        # -> ./hello-world.svg
//   link-badge "Hello" --color c2428f --print       # -> stdout
//   link-badge batch badges.json --out-dir ./assets # -> many files
//   link-badge serve --port 8787                    # local preview server
//
// Zero dependencies. Node 18+.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";
import { DEFAULTS, LIMITS, renderSvg, resolveOptions, slugify } from "../src/render.js";

const OPTION_ALIASES = {
  c: "color",
  f: "font",
  s: "size",
  w: "weight",
  o: "out",
  d: "out-dir",
  p: "print",
  h: "help",
};

const BADGE_KEYS = new Set([
  "text", "color", "font", "size", "weight", "underline", "context", "name",
]);

function parseArgs(argv) {
  const positional = [];
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--") {
      positional.push(...argv.slice(i + 1));
      break;
    }

    if (arg.startsWith("--")) {
      let [key, value] = splitOnce(arg.slice(2), "=");
      if (key.startsWith("no-") && value === undefined) {
        flags[key.slice(3)] = false;
        continue;
      }
      if (value === undefined) {
        const next = argv[i + 1];
        // A bare `--flag` followed by another flag (or nothing) is a boolean.
        if (next === undefined || next.startsWith("-")) {
          value = true;
        } else {
          value = next;
          i++;
        }
      }
      flags[key] = value;
      continue;
    }

    if (arg.startsWith("-") && arg.length > 1 && !isNegativeNumber(arg)) {
      for (const [j, letter] of [...arg.slice(1)].entries()) {
        const key = OPTION_ALIASES[letter] ?? letter;
        const isLast = j === arg.length - 2;
        const next = argv[i + 1];
        if (isLast && next !== undefined && !next.startsWith("-")) {
          flags[key] = next;
          i++;
        } else {
          flags[key] = true;
        }
      }
      continue;
    }

    positional.push(arg);
  }

  return { positional, flags };
}

function splitOnce(str, sep) {
  const at = str.indexOf(sep);
  return at === -1 ? [str, undefined] : [str.slice(0, at), str.slice(at + 1)];
}

function isNegativeNumber(arg) {
  return /^-\d/.test(arg);
}

/** Pull only badge-shaped options out of parsed flags. */
function badgeOptionsFrom(flags) {
  const out = {};
  for (const key of BADGE_KEYS) {
    if (flags[key] !== undefined) out[key] = flags[key];
  }
  return out;
}

const HELP = `link-badge - render text as a transparent, tightly-fitted coloured SVG

USAGE
  link-badge <text> [options]              render one badge
  link-badge batch <manifest> [options]    render many badges
  link-badge serve [options]               local preview server

OPTIONS
  -c, --color <hex>     text colour, with or without '#'  (default ${DEFAULTS.color})
  -f, --font <name>     system | mono | serif | any CSS font-family
                                                          (default ${DEFAULTS.font})
  -s, --size <px>       font size, ${LIMITS.minSize}-${LIMITS.maxSize}                     (default ${DEFAULTS.size})
  -w, --weight <n>      font weight, ${LIMITS.minWeight}-${LIMITS.maxWeight}                 (default ${DEFAULTS.weight})
      --no-underline    render without the underline rule
      --context <px>    font-size of the text the badge sits next to, which
                        sets the vertical alignment  (default ${DEFAULTS.context};
                        16 is GitHub README body copy)
  -o, --out <file>      write to this file       (single-badge mode)
  -d, --out-dir <dir>   write into this directory (batch mode, default '.')
  -p, --print           write the SVG to stdout instead of a file
      --port <n>        port for 'serve'                  (default 8787)
  -h, --help            show this help

BATCH MANIFESTS
  .json  { "defaults": { "color": "c2428f" },
           "badges": [ { "text": "Website" },
                       { "text": "GitHub", "name": "gh", "weight": 400 } ] }
         A bare JSON array of strings or objects works too.
  .txt   one badge per line; '#' starts a comment. A line may be
         'Display Text | filename' to override the generated filename.
  -      read the manifest from stdin (format picked with --format json|txt)

  CLI options act as defaults for every entry; per-entry keys win.

PLACING A BADGE
  Use align="absmiddle" on the <img>, not align="middle" -- they are
  different rules and only absmiddle is the CSS vertical-align: middle
  this tool's geometry is built for:

    [<img src="badge.svg" alt="Label" align="absmiddle">](https://example.com)

EXAMPLES
  npx link-badge "Hello World" --color c2428f --size 18
  npx link-badge batch badges.json --out-dir assets/link-badges
  printf 'Website\\nGitHub\\n' | npx link-badge batch - --out-dir out
`;

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function parseTxtManifest(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [text, name] = line.split("|").map((part) => part.trim());
      return name ? { text, name } : { text };
    });
}

function parseJsonManifest(source) {
  let data;
  try {
    data = JSON.parse(source);
  } catch (error) {
    throw new Error(`manifest is not valid JSON: ${error.message}`);
  }

  const badges = Array.isArray(data) ? data : data.badges;
  if (!Array.isArray(badges)) {
    throw new Error("manifest must be an array, or an object with a 'badges' array");
  }

  const defaults = Array.isArray(data) ? {} : (data.defaults ?? {});
  return badges.map((entry) => ({
    ...defaults,
    ...(typeof entry === "string" ? { text: entry } : entry),
  }));
}

async function loadManifest(source, format) {
  const raw = source === "-" ? await readStdin() : await readFile(source, "utf8");
  const kind =
    format ??
    (source === "-"
      ? raw.trimStart().startsWith("{") || raw.trimStart().startsWith("[")
        ? "json"
        : "txt"
      : path.extname(source).toLowerCase() === ".json"
        ? "json"
        : "txt");

  return kind === "json" ? parseJsonManifest(raw) : parseTxtManifest(raw);
}

async function writeSvg(file, svg) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, svg, "utf8");
}

async function runSingle(text, flags) {
  const options = { ...badgeOptionsFrom(flags), text };
  const resolved = resolveOptions(options);
  if (!resolved.text) throw new Error("no text to render (text was empty after cleanup)");

  const svg = renderSvg(options);

  if (flags.print) {
    process.stdout.write(svg);
    return;
  }

  const out = flags.out ?? path.join(String(flags["out-dir"] ?? "."), `${slugify(resolved.text)}.svg`);
  await writeSvg(out, svg);
  console.log(`${out}  ${resolved.text}`);
}

async function runBatch(manifestPath, flags) {
  if (!manifestPath) throw new Error("batch needs a manifest path (or '-' for stdin)");

  const entries = await loadManifest(manifestPath, flags.format);
  const cliDefaults = badgeOptionsFrom(flags);
  delete cliDefaults.name;

  const outDir = String(flags["out-dir"] ?? flags.out ?? ".");
  const used = new Map();
  let written = 0;
  const problems = [];

  for (const [index, entry] of entries.entries()) {
    // CLI flags are defaults; per-entry keys win.
    const options = { ...cliDefaults, ...entry };
    const resolved = resolveOptions(options);

    if (!resolved.text) {
      problems.push(`entry ${index + 1}: empty text, skipped`);
      continue;
    }

    let name = (entry.name ? slugify(entry.name) : slugify(resolved.text)) || "badge";
    // Two different badges that slug to the same name would silently overwrite
    // each other, so disambiguate instead.
    if (used.has(name)) {
      const n = used.get(name) + 1;
      used.set(name, n);
      problems.push(`entry ${index + 1}: '${name}.svg' already taken, wrote '${name}-${n}.svg'`);
      name = `${name}-${n}`;
    } else {
      used.set(name, 1);
    }

    await writeSvg(path.join(outDir, `${name}.svg`), renderSvg(options));
    written++;
  }

  console.log(`wrote ${written} badge${written === 1 ? "" : "s"} to ${path.resolve(outDir)}`);
  for (const problem of problems) console.warn(`  warning: ${problem}`);
}

function runServe(flags) {
  const port = Number.parseInt(flags.port ?? 8787, 10) || 8787;

  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (url.pathname !== "/badge") {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      res.end(`link-badge dev server\n\nTry /badge?text=Hello+World&color=${DEFAULTS.color}\n`);
      return;
    }

    const options = Object.fromEntries(url.searchParams);
    if (!resolveOptions(options).text) {
      res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      res.end("Missing ?text=\n");
      return;
    }

    res.writeHead(200, {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    });
    res.end(renderSvg(options));
  });

  server.listen(port, () => {
    console.log(`link-badge dev server on http://localhost:${port}/badge?text=Hello+World`);
  });
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));

  if (flags.help || (positional.length === 0 && Object.keys(flags).length === 0)) {
    process.stdout.write(HELP);
    return;
  }

  const [command, ...rest] = positional;

  if (command === "batch") return runBatch(rest[0], flags);
  if (command === "serve") return runServe(flags);
  return runSingle(positional.join(" "), flags);
}

main().catch((error) => {
  console.error(`link-badge: ${error.message}`);
  process.exitCode = 1;
});
