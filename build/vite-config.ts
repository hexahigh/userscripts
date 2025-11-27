/**
 * Vite configuration builder for userscripts
 * Uses Vite directly (without vite-userscript-plugin to avoid process.exit issue)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import type { InlineConfig, PluginOption, Plugin } from 'vite';
import type { UserscriptEntry } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const require = createRequire(import.meta.url);

/**
 * Create a custom CSS plugin that imports CSS as minified strings
 * Returns CSS content directly as a JS string export
 */
function createCssTextPlugin(): Plugin {
  // Load CleanCSS synchronously
  const CleanCSS = require('clean-css');
  
  return {
    name: 'css-text',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      // Handle CSS imports
      if (source.endsWith('.css')) {
        const resolution = await this.resolve(source, importer, {
          skipSelf: true,
          ...options,
        });
        if (resolution && !resolution.external) {
          // Add ?raw suffix - Vite treats this as raw file import
          return resolution.id + '?raw';
        }
      }
      return null;
    },
    transform(code, id) {
      // Transform CSS files with ?raw to export minified CSS string
      if (id.endsWith('.css?raw')) {
        const realId = id.replace('?raw', '');
        const cssCode = fs.readFileSync(realId, 'utf8');
        const minified = new CleanCSS({}).minify(cssCode).styles;
        return {
          code: `export default ${JSON.stringify(minified)};`,
          map: null,
        };
      }
      return null;
    },
  };
}

/**
 * Generate userscript header banner from header config
 */
function generateBanner(header: Record<string, unknown>): string {
  const lines: string[] = ['// ==UserScript=='];
  
  // Calculate max key length for alignment
  const maxKeyLength = Math.max(...Object.keys(header).map((key) => key.length)) + 1;
  
  for (const [key, value] of Object.entries(header)) {
    if (value === undefined) continue;
    
    const addSpaces = ' '.repeat(maxKeyLength - key.length);
    
    if (Array.isArray(value)) {
      for (const v of value) {
        const stringValue = Array.isArray(v) ? v.join(' ') : v === true ? '' : String(v);
        lines.push(`// @${key}${addSpaces}${stringValue}`);
      }
    } else {
      const stringValue = value === true ? '' : String(value);
      lines.push(`// @${key}${addSpaces}${stringValue}`);
    }
  }
  
  lines.push('// ==/UserScript==');
  return lines.join('\n');
}

/**
 * Plugin to prepend userscript header to output
 */
function createUserscriptHeaderPlugin(entry: UserscriptEntry): PluginOption {
  const banner = generateBanner(entry.header);
  
  return {
    name: 'userscript-header',
    generateBundle(options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' && fileName.endsWith('.js')) {
          chunk.code = `${banner}\n\n${chunk.code}`;
        }
      }
    },
  };
}

/**
 * Build Vite configuration for a userscript
 */
export async function createViteConfig(
  entry: UserscriptEntry,
  outDir: string
): Promise<InlineConfig> {
  const plugins: PluginOption[] = [
    createCssTextPlugin(),
  ];
  
  const buildOptions = entry.buildOptions;
  
  // Add Svelte plugin if requested
  if (buildOptions.plugins?.includes('svelte')) {
    const { svelte } = await import('@sveltejs/vite-plugin-svelte');
    plugins.push(svelte({
      compilerOptions: {
        // Required for userscripts - output as IIFE-compatible code
        css: 'injected',
      },
      // Emit CSS in JS for userscripts
      emitCss: false,
    }));
  }
  
  // Add Tailwind plugin if requested
  if (buildOptions.plugins?.includes('tailwind')) {
    const tailwindcss = (await import('@tailwindcss/vite')).default;
    plugins.push(tailwindcss());
  }
  
  // Add userscript header plugin
  plugins.push(createUserscriptHeaderPlugin(entry));

  return {
    root: rootDir,
    plugins,
    build: {
      outDir,
      emptyOutDir: false,
      lib: {
        entry: entry.entry,
        formats: ['iife'],
        name: entry.fileName.replace(/[^a-zA-Z0-9]/g, '_'),
        fileName: () => `${entry.fileName}.user.js`,
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
      // Required to avoid issues with multiple builds
      watch: null,
      minify: 'esbuild',
    },
    // Suppress console output for cleaner build logs
    logLevel: 'warn',
    // Resolve from project root
    resolve: {
      alias: {
        '@': path.resolve(rootDir, 'src'),
      },
    },
  };
}

export { rootDir };
