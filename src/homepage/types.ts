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
