/**
 * Parses userscript header and @xBuildOptions from source file
 */

import type { BuildOptions, ParsedHeader, ScriptMeta } from './types.js';

/**
 * Extract userscript header from source content
 */
function extractHeader(source: string): string | null {
  const headerMatch = source.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
  return headerMatch ? headerMatch[0] : null;
}

/**
 * Extract @xBuildOptions JSON from source content
 */
function extractBuildOptions(source: string): BuildOptions {
  const buildOptionsMatch = source.match(/\/\/\s*@xBuildOptions\s+(\{.*\})/);
  if (buildOptionsMatch) {
    try {
      return JSON.parse(buildOptionsMatch[1]) as BuildOptions;
    } catch {
      console.warn('Failed to parse @xBuildOptions, using defaults');
    }
  }
  return {};
}

/**
 * Parse userscript header text into header config for vite-userscript-plugin
 */
function parseHeaderToConfig(headerText: string): Record<string, unknown> {
  const lines = headerText
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*\/\/\s?/, '').trim())
    .filter(Boolean);

  const start = lines.findIndex((l) => /==UserScript==/.test(l));
  const end = lines.findIndex((l) => /==\/UserScript==/.test(l));
  const content = start >= 0 && end > start ? lines.slice(start + 1, end) : lines;

  const config: Record<string, unknown> = {};
  const re = /^@([A-Za-z:-]+)\s+(.*)$/;

  for (const line of content) {
    const m = line.match(re);
    if (!m) continue;

    const key = m[1].toLowerCase();
    const value = m[2].trim();

    // Handle keys that should be arrays
    const arrayKeys = ['match', 'include', 'exclude', 'grant', 'connect', 'require', 'resource'];
    
    if (arrayKeys.includes(key)) {
      if (!config[key]) {
        config[key] = [];
      }
      (config[key] as string[]).push(value);
    } else {
      // First value wins for single-value keys
      if (!config[key]) {
        config[key] = value;
      }
    }
  }

  return config;
}

/**
 * Parse header text into ScriptMeta for index.html generation
 */
function parseHeaderToMeta(headerText: string): ScriptMeta {
  const lines = headerText
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*\/\/\s?/, '').trim())
    .filter(Boolean);

  const start = lines.findIndex((l) => /==UserScript==/.test(l));
  const end = lines.findIndex((l) => /==\/UserScript==/.test(l));
  const content = start >= 0 && end > start ? lines.slice(start + 1, end) : lines;

  const meta: ScriptMeta = {
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
    outfile: '',
    sourceFile: '',
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
        if (!meta[key]) meta[key] = value;
        else if (Array.isArray(meta[key])) (meta[key] as string[]).push(value);
    }
  }

  return meta;
}

/**
 * Parse source file and extract all relevant information
 */
export function parseUserscript(source: string): ParsedHeader | null {
  const headerText = extractHeader(source);
  if (!headerText) {
    return null;
  }

  const buildOptions = extractBuildOptions(source);
  const header = parseHeaderToConfig(headerText);
  const meta = parseHeaderToMeta(headerText);

  return {
    header,
    buildOptions,
    meta,
  };
}

/**
 * Remove header from source to prevent duplication
 * (vite-userscript-plugin adds header automatically)
 */
export function removeHeader(source: string): string {
  return source.replace(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==\n?/, '').trim();
}
