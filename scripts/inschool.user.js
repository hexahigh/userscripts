// ==UserScript==
// @name        InSchool fixes
// @namespace   Violentmonkey Scripts
// @match       https://*.inschool.visma.no/*
// @grant       none
// @version     1.0
// @author      Boofdev
// @description Fixes various issues on InSchool
// @updateURL   https://raw.githubusercontent.com/hexahigh/userscripts/main/scripts/inschool.user.js
// @downloadURL https://raw.githubusercontent.com/hexahigh/userscripts/main/scripts/inschool.user.js
// @homepageURL https://github.com/hexahigh/userscripts
// ==/UserScript==

const css = `
/* Fix z-index of timetable "now" line */
.Timetable-TimetableNowLine {
    z-index: 1 !important;
    opacity: 0.8 !important;
    height: 2px !important;
}
`;

(function () {
  "use strict";

  const style = document.createElement("style");
  style.appendChild(document.createTextNode(css));
  (document.head || document.documentElement).appendChild(style);
})();
