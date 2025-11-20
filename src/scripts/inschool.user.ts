// ==UserScript==
// @name        InSchool fixes
// @namespace   Violentmonkey Scripts
// @match       https://*.inschool.visma.no/*
// @grant       none
// @version     1.1
// @author      Boofdev
// @description Fixes various issues on InSchool
// @updateURL   https://us.080609.xyz/scripts/inschool.user.js
// @downloadURL https://us.080609.xyz/scripts/inschool.user.js
// @homepageURL https://github.com/hexahigh/userscripts
// ==/UserScript==

import styles from './inschool.css';

(function () {
  'use strict';

  let isUpdating = false;
  let debounceTimer: number | null = null;

  function initialize() {
    applyCSS();
    weekWarning();
    markEmptyDays();
    markBreaks();

    const observer = new MutationObserver(() => {
      if (isUpdating) return;

      // Debounce rapid mutations
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = window.setTimeout(() => {
        isUpdating = true;

        weekWarning();
        markEmptyDays();
        markBreaks();

        isUpdating = false;
        debounceTimer = null;
      }, 300);
    });

    // Start observing the document for added/changed nodes
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Wait for the DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();

function weekWarning(): void {
  const weekElement = document.querySelector<HTMLHeadingElement>('h2.subheading2.userTimetable_currentWeek');
  if (weekElement) {
    // Parse the week number from the text content (first numbers encountered)
    const weekText = weekElement.textContent;
    const weekMatch = weekText?.match(/\d+/);
    const displayedWeek = weekMatch ? parseInt(weekMatch[0]) : null;

    if (displayedWeek !== null) {
      // Calculate the current ISO week number
      const currentWeek = getISOWeekNumber(new Date());

      // Check if warning already exists
      const existingWarning = document.querySelector('.week-warning-message');

      if (displayedWeek !== currentWeek) {
        // Only add warning if it doesn't exist
        if (!existingWarning) {
          const targetElement = document.querySelector('div.vs-panel-heading.dashboard-widget__heading');
          if (targetElement) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'week-warning-message';
            warningDiv.style.cssText =
              'display: flex; align-items: center; gap: 8px; padding: 12px; margin-top: 8px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; color: #856404;';
            warningDiv.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="flex-shrink: 0;"><path fill="currentColor" d="M2.725 21q-.275 0-.5-.137t-.35-.363t-.137-.488t.137-.512l9.25-16q.15-.25.388-.375T12 3t.488.125t.387.375l9.25 16q.15.25.138.513t-.138.487t-.35.363t-.5.137zM12 18q.425 0 .713-.288T13 17t-.288-.712T12 16t-.712.288T11 17t.288.713T12 18m0-3q.425 0 .713-.288T13 14v-3q0-.425-.288-.712T12 10t-.712.288T11 11v3q0 .425.288.713T12 15"/></svg>
              <span style="flex: 1;">Warning: You are viewing week ${displayedWeek}, but the current week is ${currentWeek}.</span>
            `;
            targetElement.insertAdjacentElement('afterend', warningDiv);
          }
        }
      } else {
        // Remove warning if weeks match
        if (existingWarning) {
          existingWarning.remove();
        }
      }
    }
  }
}

function applyCSS(): void {
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(styles));
  (document.head || document.documentElement).appendChild(style);
}

function getISOWeekNumber(date: Date): number {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
  // Get first day of year
  const yearStart = new Date(tempDate.getFullYear(), 0, 1);
  // Calculate full weeks to nearest Thursday
  const weekNumber = Math.ceil(((tempDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNumber;
}

function markEmptyDays(): void {
  const timetableDays = document.querySelectorAll<HTMLDivElement>('div.Timetable-TimetableDays_day');

  timetableDays.forEach((day) => {
    const itemsContainer = day.querySelector<HTMLDivElement>('div.Timetable-Items');

    if (itemsContainer) {
      const hasChildren = itemsContainer.children.length > 0;

      if (!hasChildren) {
        day.classList.add('empty-timetable-day');
      } else {
        day.classList.remove('empty-timetable-day');
      }
    }
  });
}

function markBreaks(): void {
  const timetableDays = document.querySelectorAll<HTMLDivElement>('div.Timetable-TimetableDays_day');

  timetableDays.forEach((day) => {
    const itemsContainer = day.querySelector<HTMLDivElement>('div.Timetable-Items');

    if (!itemsContainer) return;

    const items = Array.from(itemsContainer.querySelectorAll<HTMLDivElement>('div.popup-container'));

    if (items.length === 0) return;

    // Only proceed if items have changed (count or order)
    const itemCount = items.length;
    const lastCount = (itemsContainer as any)._lastBreakCount;
    if (lastCount === itemCount) {
      return; // Skip if same number of items
    }
    (itemsContainer as any)._lastBreakCount = itemCount;

    // Remove existing breaks
    const existingBreaks = itemsContainer.querySelectorAll('.timetable-break');
    existingBreaks.forEach((el) => el.remove());

    // Sort items by top position to ensure we process them in order
    const sortedItems = items.sort((a, b) => {
      const topA = parseInt(a.style.top || '0', 10);
      const topB = parseInt(b.style.top || '0', 10);
      return topA - topB;
    });

    for (let i = 0; i < sortedItems.length - 1; i++) {
      const currentItem = sortedItems[i];
      const nextItem = sortedItems[i + 1];

      const currentTop = parseInt(currentItem.style.top || '0', 10);

      // Find the inner item to get height
      const innerItem = currentItem.querySelector<HTMLDivElement>('.Timetable-TimetableItem');
      if (!innerItem) continue;

      const currentHeight = parseInt(innerItem.style.height || '0', 10);
      const currentBottom = currentTop + currentHeight;

      const nextTop = parseInt(nextItem.style.top || '0', 10);

      const gap = nextTop - currentBottom;

      // 120px = 60 minutes => 1px = 0.5 minutes => 2px = 1 minute
      // 5 minutes = 10px
      if (gap > 10) {
        const durationMinutes = Math.round(gap / 2);

        const breakEl = document.createElement('div');
        breakEl.className = 'timetable-break';
        breakEl.style.top = `${currentBottom}px`;
        breakEl.style.height = `${gap}px`;
        breakEl.textContent = `${durationMinutes} min break`;

        itemsContainer.appendChild(breakEl);
      }
    }
  });
}
