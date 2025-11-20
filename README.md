# Userscripts

TypeScript-based userscripts with automatic compilation and bundling.

## Setup

Install dependencies using pnpm:

```bash
pnpm install
```

If you don't have pnpm installed, install it first:
```bash
npm install -g pnpm
```

## Development

### Project Structure

- `src/` - TypeScript source files (`.user.ts`)
- `dist/` - Compiled userscripts (`.user.js`)

### Building

Build all userscripts:

```bash
pnpm build
```

Watch for changes and rebuild automatically:

```bash
pnpm watch
```

Clean the dist directory:

```bash
pnpm clean
```

### Writing Userscripts

1. Create a new file in `src/` with the `.user.ts` extension
2. Add the userscript metadata header at the top:

```typescript
// ==UserScript==
// @name        My Script
// @namespace   Violentmonkey Scripts
// @match       https://example.com/*
// @grant       none
// @version     1.0
// @author      Your Name
// @description Script description
// ==/UserScript==
```

3. Write your TypeScript code below the header
4. Run `pnpm build` to compile
5. The compiled script will be in `dist/` with the header preserved

### Importing CSS Files

You can import CSS files directly in your TypeScript code:

```typescript
import styles from './styles.css';

// Apply the styles
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);
```

The CSS will be bundled as a string and minified along with your code.


## Installing Userscripts

After building, install the userscripts from the `dist/` directory using your userscript manager (Violentmonkey, Tampermonkey, etc.).

For GitHub-hosted scripts, update the URLs to point to the `dist/` folder:
- `@updateURL` and `@downloadURL` should point to `https://us.080609.xyz/scripts/scriptname.user.js`

## Scripts

### smoothScrollingEverywhere.user.ts
Universal smooth scrolling for (almost) all websites.

### inschool.user.ts
Fixes various issues on InSchool (inschool.visma.no), including:
- Timetable "now" line z-index fix
- Week number warning when viewing past/future weeks
- Visual indication for empty timetable days
