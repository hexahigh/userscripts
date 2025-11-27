/**
 * Homepage prerenderer using Svelte SSR
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
import type { ScriptMeta } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * HTML template with CSS
 */
function createHtmlTemplate(body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Simon's Userscripts</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px 20px;
    }

    h1 {
      font-size: 2rem;
      margin-bottom: 10px;
    }

    h2 {
      font-size: 1.4rem;
      margin: 30px 0 15px 0;
      color: #222;
    }

    h3 {
      font-size: 1.1rem;
      margin: 20px 0 10px 0;
    }

    p, li {
      margin-bottom: 10px;
      font-size: 0.95rem;
    }

    a {
      color: #0066cc;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .intro {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 30px;
      border-left: 4px solid #0066cc;
    }

    .guide-section {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 20px;
    }

    .guide-section ol, .guide-section ul {
      margin: 10px 0 10px 20px;
    }

    .guide-section li {
      margin-bottom: 8px;
    }

    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.9em;
    }

    .scripts-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 15px;
      margin-bottom: 30px;
    }

    .script-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #0066cc;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .script-info h3 {
      margin: 0 0 5px 0;
      font-size: 1rem;
    }

    .script-desc {
      color: #666;
      font-size: 0.9rem;
      margin: 0;
    }

    .script-version {
      color: #999;
      font-size: 0.85rem;
      margin-top: 3px;
    }

    .install-link {
      display: inline-block;
      background: #0066cc;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-weight: 600;
      white-space: nowrap;
      margin-left: 15px;
      flex-shrink: 0;
    }

    .install-link:hover {
      background: #0052a3;
      text-decoration: none;
    }

    .font-bold {
      font-weight: bold;
    }

    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      border-radius: 4px;
      margin: 15px 0;
      font-size: 0.9rem;
    }

    .success {
      background: #d4edda;
      border-left: 4px solid #28a745;
      padding: 12px;
      border-radius: 4px;
      margin: 15px 0;
      font-size: 0.9rem;
    }

    @media (max-width: 600px) {
      h1 {
        font-size: 1.5rem;
      }

      h2 {
        font-size: 1.2rem;
      }

      .script-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .install-link {
        margin-left: 0;
        margin-top: 10px;
        width: 100%;
        text-align: center;
      }
    }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

/**
 * Clean SSR output from Svelte hydration markers
 */
function cleanSsrOutput(html: string): string {
  return html
    .replace(/<!--\[-->/g, '')
    .replace(/<!--\]-->/g, '')
    .replace(/<!---->/g, '');
}

/**
 * Generate index.html using prerendered Svelte
 */
export async function generateHomepage(scriptsMeta: ScriptMeta[]): Promise<void> {
  try {
    const svelteSourcePath = path.join(rootDir, 'src', 'homepage', 'Index.svelte');
    const source = fs.readFileSync(svelteSourcePath, 'utf8');
    
    // Compile Svelte component for SSR
    const compiled = compile(source, {
      generate: 'server',
      hydratable: false,
      dev: false,
      css: 'injected',
      name: 'Index',
    });
    
    // Write compiled code to temp file in a sandboxed location
    const tempDir = path.join(rootDir, '.temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Use a unique filename to avoid module cache issues
    const tempModuleName = `homepage-ssr-${Date.now()}.mjs`;
    const tempModulePath = path.join(tempDir, tempModuleName);
    
    // Validate path is within expected directory
    const normalizedPath = path.normalize(tempModulePath);
    if (!normalizedPath.startsWith(tempDir)) {
      throw new Error('Invalid temp file path');
    }
    
    fs.writeFileSync(tempModulePath, compiled.js.code);
    
    try {
      // Dynamic import the compiled module
      const module = await import(`file://${tempModulePath}`);
      const Component = module.default;
      
      // Render with props using Svelte 5 server render
      const result = render(Component, {
        props: { scripts: scriptsMeta },
      });
      
      // Clean the SSR output and wrap in HTML template
      const cleanedBody = cleanSsrOutput(result.body);
      const fullHtml = createHtmlTemplate(cleanedBody);
      
      // Write the final HTML
      const distDir = path.join(rootDir, 'dist');
      fs.writeFileSync(path.join(distDir, 'index.html'), fullHtml, 'utf8');
      
      console.log('✓ Generated dist/index.html (Svelte SSR)');
    } finally {
      // Clean up temp file asynchronously to avoid issues with module cache
      try {
        fs.unlinkSync(tempModulePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (err) {
    console.error('✗ Error generating index.html with Svelte SSR:', err);
    // Fallback to Liquid template
    console.log('  Falling back to Liquid template...');
    await generateHomepageLiquid(scriptsMeta);
  }
}

/**
 * Fallback: Generate index.html using Liquid template
 */
async function generateHomepageLiquid(scriptsMeta: ScriptMeta[]): Promise<void> {
  const { Liquid } = await import('liquidjs');
  
  const engine = new Liquid();
  const templatePath = path.join(rootDir, 'src', 'index.liquid');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  
  const html = await engine.parseAndRender(templateContent, { scripts: scriptsMeta });
  const distDir = path.join(rootDir, 'dist');
  fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
  console.log('✓ Generated dist/index.html (Liquid fallback)');
}
