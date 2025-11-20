// ==UserScript==
// @name         No nodownload
// @namespace    Violentmonkey scripts
// @version      1.0
// @description  Enables video download by removing 'controlsList="nodownload"' from video elements. Does not add download buttons, just removes the restriction.
// @author       Boofdev
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function cleanVideo(video: HTMLVideoElement): void {
    if (video.hasAttribute('controlsList')) {
      const current = video.getAttribute('controlsList')!;
      const updated = current
        .split(/\s+/)
        .filter((val) => val.toLowerCase() !== 'nodownload')
        .join(' ');
      if (updated) {
        video.setAttribute('controlsList', updated);
      } else {
        video.removeAttribute('controlsList');
      }
    }
  }

  function cleanAllVideos(): void {
    const videos = document.querySelectorAll('video');
    videos.forEach(cleanVideo);
  }

  // Initial clean
  cleanAllVideos();

  // Watch for new video elements added to the DOM
  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node: Node) => {
        if (node.nodeType === 1) {
          const element = node as Element;
          if (element.tagName.toLowerCase() === 'video') {
            cleanVideo(element as HTMLVideoElement);
          } else {
            // If node is an element, it may contain video children
            element.querySelectorAll?.('video').forEach(cleanVideo);
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
