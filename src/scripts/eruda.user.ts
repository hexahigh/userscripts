// ==UserScript==
// @name        Eruda
// @namespace   Violentmonkey Scripts
// @match       *://*/*
// @grant       none
// @version     1.0
// @author      Boofdev
// @description Eruda (mobile dev-console) as a userscript
// @updateURL   https://us.080609.xyz/scripts/eruda.user.js
// @downloadURL https://us.080609.xyz/scripts/eruda.user.js
// @homepageURL https://us.080609.xyz
// ==/UserScript==

import eruda from 'eruda';
import erudaMonitor from 'eruda-monitor';
import erudaFeatures from 'eruda-features';
import erudaTiming from 'eruda-timing';
import erudaCode from 'eruda-code';
import erudaBenchmark from 'eruda-benchmark';
import erudaGeolocation from 'eruda-geolocation';
import erudaOrientation from 'eruda-orientation';
import erudaTouches from 'eruda-touches';
import erudaVue from 'eruda-vue';

(function () {
  'use strict';

  // Wow, very complex
  eruda.init();

  // Also adding some plugins, cause why not
  eruda.add(erudaMonitor);
  eruda.add(erudaFeatures);
  eruda.add(erudaTiming);
  eruda.add(erudaCode);
  eruda.add(erudaBenchmark);
  eruda.add(erudaGeolocation);
  eruda.add(erudaOrientation);
  eruda.add(erudaTouches);
  eruda.add(erudaVue);
})();
