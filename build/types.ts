/**
 * Build system types
 */

export interface BuildOptions {
  plugins?: ('svelte' | 'tailwind')[];
}

export interface ScriptMeta {
  name: string;
  description: string;
  version: string;
  namespace: string;
  author: string;
  matches: string[];
  includes: string[];
  grants: string[];
  connects: string[];
  raw: string;
  outfile: string;
  sourceFile: string;
  [key: string]: unknown;
}

export interface ParsedHeader {
  header: Record<string, unknown>;
  buildOptions: BuildOptions;
  meta: ScriptMeta;
}

export interface UserscriptEntry {
  entry: string;
  fileName: string;
  header: Record<string, unknown>;
  buildOptions: BuildOptions;
  meta: ScriptMeta;
}
