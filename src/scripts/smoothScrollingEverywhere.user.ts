// ==UserScript==
// @name        Smooth Scrolling Everywhere
// @namespace   Violentmonkey Scripts
// @match       *://*/*
// @grant       none
// @version     2.0
// @author      Boofdev
// @description Universal smooth scrolling for (almost) all websites using Lenis
// @updateURL   https://us.080609.xyz/scripts/smoothScrollingEverywhere.user.js
// @downloadURL https://us.080609.xyz/scripts/smoothScrollingEverywhere.user.js
// @homepageURL https://us.080609.xyz
// ==/UserScript==

import Lenis from 'lenis';
import styles from 'lenis/dist/lenis.css';
import { addGlobalCSS } from '../util';

(function () {
  'use strict';

  // Initialize Lenis smooth scrolling
  const lenis = new Lenis({
    autoRaf: true,
    prevent: (node) =>
      node.classList.contains('no-lenis-scroll') ||
      node.classList.contains('no-smooth-scroll') ||
      node.classList.contains('dropdown-content'),
  });

  addGlobalCSS(styles);

  console.log('Lenis smooth scrolling initialized');
})();
