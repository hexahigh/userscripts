/**
 * Main build script for userscripts
 * Migrated from build.js to TypeScript with vite-userscript-plugin
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { build as viteBuild } from 'vite';
import { parseUserscript } from './parser.js';
import { createViteConfig, rootDir } from './vite-config.js';
import { generateHomepage } from './homepage.js';
import type { ScriptMeta, UserscriptEntry } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWatch = process.argv.includes('--watch');

// Directories
const srcDir = path.join(rootDir, 'src/scripts');
const distDir = path.join(rootDir, 'dist');
const scriptsOutDir = path.join(distDir, 'scripts');

/**
 * Ensure required directories exist
 */
function ensureDirectories(): void {
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  if (!fs.existsSync(scriptsOutDir)) {
    fs.mkdirSync(scriptsOutDir, { recursive: true });
  }
}

/**
 * Get all userscript files
 */
function getUserscriptFiles(): string[] {
  return fs
    .readdirSync(srcDir, { recursive: true })
    .filter((file): file is string => typeof file === 'string' && file.endsWith('.user.ts'));
}

/**
 * Parse a userscript file and create entry configuration
 */
function createUserscriptEntry(file: string): UserscriptEntry | null {
  const entryPath = path.join(srcDir, file);
  const source = fs.readFileSync(entryPath, 'utf8');
  
  const parsed = parseUserscript(source);
  if (!parsed) {
    console.warn(`⚠ No userscript header found in ${file}, skipping`);
    return null;
  }
  
  // Get the base filename for output (without .ts extension)
  const baseName = file.replace(/\.ts$/, '');
  const fileName = path.basename(baseName, '.user');
  
  return {
    entry: entryPath,
    fileName: fileName,
    header: parsed.header,
    buildOptions: parsed.buildOptions,
    meta: {
      ...parsed.meta,
      outfile: path.join('scripts', `${fileName}.user.js`),
      sourceFile: file,
    },
  };
}

/**
 * Build a single userscript
 */
async function buildUserscript(entry: UserscriptEntry): Promise<ScriptMeta | null> {
  try {
    const config = await createViteConfig(entry, scriptsOutDir);
    await viteBuild(config);
    
    console.log(`✓ Built ${entry.meta.sourceFile}${entry.buildOptions.plugins?.length ? ` [${entry.buildOptions.plugins.join(', ')}]` : ''}`);
    return entry.meta;
  } catch (error) {
    console.error(`✗ Error building ${entry.meta.sourceFile}:`, error);
    return null;
  }
}

/**
 * Main build function
 */
async function build(): Promise<void> {
  ensureDirectories();
  
  const files = getUserscriptFiles();
  console.log(`Found ${files.length} userscripts:`, files);
  
  const scriptsMeta: ScriptMeta[] = [];
  
  for (const file of files) {
    console.log(`\nProcessing: ${file}`);
    const entry = createUserscriptEntry(file);
    if (!entry) continue;
    
    const meta = await buildUserscript(entry);
    if (meta) {
      scriptsMeta.push(meta);
    }
  }
  
  console.log(`\nBuilt ${scriptsMeta.length} scripts successfully`);
  await generateHomepage(scriptsMeta);
}

/**
 * Watch mode
 */
async function watchMode(): Promise<void> {
  console.log('Watching for changes...');
  
  // Initial build
  await build();
  
  // Watch for changes
  fs.watch(srcDir, { recursive: true }, async (eventType, filename) => {
    if (filename && (filename.endsWith('.ts') || filename.endsWith('.css') || filename.endsWith('.svelte'))) {
      console.log(`\nChange detected in ${filename}, rebuilding...`);
      await build();
    }
  });
}

// Main execution
if (isWatch) {
  watchMode().catch((err) => {
    console.error('Watch mode failed:', err);
    process.exit(1);
  });
} else {
  build().catch((err) => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}
