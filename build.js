import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Liquid } from 'liquidjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWatch = process.argv.includes('--watch');

// Ensure dist/scripts directory exists
if (!fs.existsSync('dist/scripts')) {
  fs.mkdirSync('dist/scripts', { recursive: true });
}

// Plugin to import CSS files as strings
const cssPlugin = {
  name: 'css-text',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await fs.promises.readFile(args.path, 'utf8');
      return {
        contents: `export default ${JSON.stringify(css)}`,
        loader: 'js',
      };
    });
  },
};

// Plugin to extract and preserve userscript headers
const userscriptHeaderPlugin = {
  name: 'userscript-header',
  setup(build) {
    build.onLoad({ filter: /\.ts$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, 'utf8');

      // Extract userscript header (everything between ==UserScript== markers)
      const headerMatch = source.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);

      if (headerMatch) {
        const header = headerMatch[0];
        // Remove header from source
        const sourceWithoutHeader = source.replace(headerMatch[0], '').trim();

        // Store header for later use
        const headerPath = args.path.replace(/\.ts$/, '.header');
        await fs.promises.writeFile(headerPath, header);

        return {
          contents: sourceWithoutHeader,
          loader: 'ts',
        };
      }

      return null;
    });
  },
};

// Get all TypeScript files in src directory
const srcDir = path.join(__dirname, 'src/scripts');
const files = fs.readdirSync(srcDir, { recursive: true }).filter((file) => file.endsWith('.user.ts'));

async function build() {
  // Collect metadata for index.html
  const scriptsMeta = [];
  for (const file of files) {
    const entryPoint = path.join(srcDir, file);
    const outfile = path.join(__dirname, 'dist/scripts', file.replace('.ts', '.js'));
    const headerPath = entryPoint.replace(/\.ts$/, '.header');

    try {
      // Build with esbuild
      await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        outfile: outfile,
        format: 'iife',
        platform: 'browser',
        target: 'es2020',
        minify: true,
        plugins: [cssPlugin, userscriptHeaderPlugin],
        logLevel: 'info',
      });

      // Prepend header if it exists
      if (fs.existsSync(headerPath)) {
        const header = await fs.promises.readFile(headerPath, 'utf8');
        const bundled = await fs.promises.readFile(outfile, 'utf8');
        await fs.promises.writeFile(outfile, `${header}\n\n${bundled}`);

        // Parse header for metadata to include in index.html
        try {
          const meta = parseUserscriptHeader(header);
          // store filename relative to dist
          meta.outfile = path.join('scripts', path.basename(outfile));
          meta.sourceFile = file;
          scriptsMeta.push(meta);
        } catch (e) {
          console.warn(`Warning: failed to parse header for ${file}:`, e);
        }

        // Clean up temporary header file
        await fs.promises.unlink(headerPath);
      }

      console.log(`✓ Built ${file}`);
    } catch (error) {
      console.error(`✗ Error building ${file}:`, error);
    }
  }

  // After building all scripts, generate dist/index.html
  try {
    if (!fs.existsSync(path.join(__dirname, 'dist'))) {
      fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
    }

    const engine = new Liquid();
    const templatePath = path.join(__dirname, 'src', 'index.liquid');
    const templateContent = await fs.promises.readFile(templatePath, 'utf8');

    const html = await engine.parseAndRender(templateContent, { scripts: scriptsMeta });
    await fs.promises.writeFile(path.join(__dirname, 'dist', 'index.html'), html, 'utf8');
    console.log('✓ Generated dist/index.html');
  } catch (err) {
    console.error('✗ Error generating index.html:', err);
  }
}

// Parse userscript header block into metadata object
function parseUserscriptHeader(headerText) {
  // strip comment markers and split into lines
  const lines = headerText
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*\/\/\s?/, '').trim())
    .filter(Boolean);

  // find the content between ==UserScript== and ==/UserScript==
  const start = lines.findIndex((l) => /==UserScript==/.test(l));
  const end = lines.findIndex((l) => /==\/UserScript==/.test(l));
  const content = start >= 0 && end > start ? lines.slice(start + 1, end) : lines;

  const meta = {
    name: '',
    description: '',
    version: '',
    namespace: '',
    author: '',
    matches: [],
    includes: [],
    grants: [],
    connects: [],
    raw: headerText,
  };

  const re = /^@([A-Za-z:-]+)\s+(.*)$/;
  for (const line of content) {
    const m = line.match(re);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();

    switch (key) {
      case 'name':
        meta.name = meta.name || value;
        break;
      case 'description':
        meta.description = meta.description || value;
        break;
      case 'version':
        meta.version = meta.version || value;
        break;
      case 'namespace':
        meta.namespace = meta.namespace || value;
        break;
      case 'author':
        meta.author = meta.author || value;
        break;
      case 'match':
        meta.matches.push(value);
        break;
      case 'include':
        meta.includes.push(value);
        break;
      case 'grant':
        meta.grants.push(value);
        break;
      case 'connect':
        meta.connects.push(value);
        break;
      default:
        // store unknown keys as-is on meta
        if (!meta[key]) meta[key] = value;
        else if (Array.isArray(meta[key])) meta[key].push(value);
    }
  }

  return meta;
}

if (isWatch) {
  console.log('Watching for changes...');

  // Initial build
  build();

  // Watch for changes
  fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.ts') || filename.endsWith('.css'))) {
      console.log(`\nChange detected in ${filename}, rebuilding...`);
      build();
    }
  });
} else {
  build();
}
