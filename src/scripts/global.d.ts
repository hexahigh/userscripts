// Type definitions for CSS imports
declare module '*.css' {
  const content: string;
  export default content;
}

// Type definitions for Svelte components
declare module '*.svelte' {
  import type { Component } from 'svelte';
  const component: Component<any, any, any>;
  export default component;
}

// Eruda plugins lack type definitions
declare module 'eruda-monitor';
declare module 'eruda-features';
declare module 'eruda-timing';
declare module 'eruda-code';
declare module 'eruda-benchmark';
declare module 'eruda-geolocation';
declare module 'eruda-orientation';
declare module 'eruda-touches';
declare module 'eruda-vue';
