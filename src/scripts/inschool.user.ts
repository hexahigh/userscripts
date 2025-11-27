// ==UserScript==
// @name        InSchool fixes
// @namespace   Violentmonkey Scripts
// @match       https://*.inschool.visma.no/*
// @grant       none
// @version     1.3
// @author      Boofdev
// @description Fixes various issues on InSchool
// @updateURL   https://us.080609.xyz/scripts/inschool.user.js
// @downloadURL https://us.080609.xyz/scripts/inschool.user.js
// @homepageURL https://us.080609.xyz
// ==/UserScript==

import styles from './inschool.css';
import langConfig from './inschool.lang.json';
import { createLocalization } from '../util/localize';
import { addGlobalCSS } from '../util';

const i18n = createLocalization(langConfig);

// Detect language from html lang attribute and set accordingly
const siteLang = document.documentElement.lang;
if (siteLang === 'no') {
  i18n.setLanguage('no');
} else {
  i18n.setLanguage('en');
}

let academicYear: AcademicYear | null = null;

function lightenColor(color: string, percent: number = 20): string {
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }
  return color;
}

(function () {
  'use strict';

  let isUpdating = false;
  let debounceTimer: number | null = null;

  async function initialize() {
    academicYear = await getAcademicYear();
    addGlobalCSS(styles);
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

            // Use localization system for warning message
            const warningText = i18n.getMessage('weekWarning', {
              viewingWeek: displayedWeek,
              currentWeek: currentWeek,
            });

            warningDiv.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="flex-shrink: 0;"><path fill="currentColor" d="M2.725 21q-.275 0-.5-.137t-.35-.363t-.137-.488t.137-.512l9.25-16q.15-.25.388-.375T12 3t.488.125t.387.375l9.25 16q.15.25.138.513t-.138.487t-.35.363t-.5.137zM12 18q.425 0 .713-.288T13 17t-.288-.712T12 16t-.712.288T11 17t.288.713T12 18m0-3q.425 0 .713-.288T13 14v-3q0-.425-.288-.712T12 10t-.712.288T11 11v3q0 .425.288.713T12 15"/></svg>
              <span style="flex: 1;">${warningText}</span>
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
  if (!academicYear) return;
  const timetableDays = document.querySelectorAll<HTMLDivElement>('div.Timetable-TimetableDays_day');

  // get week number
  const weekElement = document.querySelector<HTMLHeadingElement>('h2.subheading2.userTimetable_currentWeek');
  if (!weekElement) return;
  const weekText = weekElement.textContent;
  const weekMatch = weekText?.match(/\d+/);
  const displayedWeek = weekMatch ? parseInt(weekMatch[0]) : null;
  if (displayedWeek === null) return;

  // match first four digit year in text
  const yearMatch = weekText?.match(/\d{4}/);
  const displayedYear = yearMatch ? parseInt(yearMatch[0]) : null;

  // calculate start of week (Monday) for the displayed week
  const year = displayedYear || new Date().getFullYear();
  const jan1 = new Date(year, 0, 1);
  const jan1Day = jan1.getDay() || 7; // 1=mon,7=sun
  const daysToFirstMonday = jan1Day === 1 ? 0 : 8 - jan1Day;
  const firstMonday = new Date(jan1.getTime() + daysToFirstMonday * 24 * 60 * 60 * 1000);
  const weekStart = new Date(firstMonday.getTime() + (displayedWeek - 1) * 7 * 24 * 60 * 60 * 1000);

  timetableDays.forEach((day, index) => {
    const dayDate = new Date(weekStart.getTime() + index * 24 * 60 * 60 * 1000);
    const itemsContainer = day.querySelector<HTMLDivElement>('div.Timetable-Items');

    if (itemsContainer) {
      const hasChildren = itemsContainer.children.length > 0;

      // remove existing holiday text
      const existingHoliday = day.querySelector('.holiday-text');
      if (existingHoliday) existingHoliday.remove();

      if (!hasChildren) {
        // check if holiday
        const schoolDay = academicYear!.schoolDays.find((sd) => {
          const sdDate = new Date(sd.date);
          return sdDate.toDateString() === dayDate.toDateString();
        });
        if (schoolDay && schoolDay.schoolDayTypeId !== null) {
          const dayType = academicYear!.dayTypes.find((dt) => dt.id === schoolDay.schoolDayTypeId);
          if (dayType) {
            // it's a holiday
            day.classList.add('holiday-timetable-day');
            day.classList.remove('empty-timetable-day');
            day.style.background = `repeating-linear-gradient(45deg, ${dayType.colour}, ${
              dayType.colour
            } 10px, ${lightenColor(dayType.colour)} 10px, ${lightenColor(dayType.colour)} 20px)`;
            // add text
            const textDiv = document.createElement('div');
            textDiv.className = 'holiday-text';
            textDiv.textContent = dayType.name;
            textDiv.style.cssText =
              'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #333; font-weight: bold; z-index: 10; pointer-events: none;';
            day.style.position = 'relative';
            day.appendChild(textDiv);
          } else {
            day.classList.add('empty-timetable-day');
            day.classList.remove('holiday-timetable-day');
            day.style.background = '';
          }
        } else {
          day.classList.add('empty-timetable-day');
          day.classList.remove('holiday-timetable-day');
          day.style.background = '';
        }
      } else {
        day.classList.remove('empty-timetable-day');
        day.classList.remove('holiday-timetable-day');
        day.style.background = '';
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
        breakEl.textContent = i18n.getMessage('breakDuration', {
          minutes: durationMinutes,
        });

        itemsContainer.appendChild(breakEl);
      }
    }
  });
}

function getWindowData(): WindowData {
  const windowAny = window as any;
  return {
    schoolType: windowAny.schoolType,
    locale: windowAny.locale,
    snowplow: windowAny.snowplow,
    index_county: windowAny.index_county,
    index_academicYearId: windowAny.index_academicYearId,
    index_academicYearCode: windowAny.index_academicYearCode,
    index_academicYear: windowAny.index_academicYear,
    index_tenant: windowAny.index_tenant,
    index_userInfoId: windowAny.index_userInfoId,
    launch_darkly_token: windowAny.launch_darkly_token,
    a11yStatement: windowAny.a11yStatement,
    role: windowAny.role,
    index_displayName: windowAny.index_displayName,
    index_email: windowAny.index_email,
    index_school_name: windowAny.index_school_name,
    index_userMainRole: windowAny.index_userMainRole,
    index_typeId: windowAny.index_typeId,
    isProduction: windowAny.isProduction,
    resourceBaseUrl: windowAny.resourceBaseUrl,
    assetsUrl: windowAny.assetsUrl,
    misVersion: windowAny.misVersion,
  };
}

async function getAcademicYear(): Promise<AcademicYear> {
  const id = getWindowData().index_academicYearId;
  const url = `${window.location.protocol}//${window.location.hostname}/control/calendar/v2/academicyears/${id}`;

  const resp = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await resp.json();
  return data;
}

type AcademicYear = {
  id: number;
  version: number;
  tenant: number;
  code: string;
  name: string;
  studentStartDate: Date;
  currentYear: boolean;
  terms: {
    id: number;
    version: number;
    startDate: Date;
    endDate: Date;
    code: string;
    name: string;
    term: string;
    current: boolean;
  }[];
  year: number;
  daysInCycle: number;
  editable: boolean;
  schoolDays: {
    date: Date;
    schoolDayTypeId: number | null;
  }[];
  dayTypes: {
    id: number;
    version: number;
    code: string;
    name: string;
    description: string;
    colour: string;
    planningDay: boolean;
  }[];
  endDate: Date;
  startDate: Date;
};

type WindowData = {
  schoolType: 'V' | string;
  locale: 'no_NO' | string;
  snowplow: Function;
  index_county: number;
  index_academicYearId: number;
  index_academicYearCode: number;
  index_academicYear: number;
  index_tenant: number;
  index_userInfoId: number;
  launch_darkly_token: string;
  a11yStatement: string;
  role: string;
  index_displayName: string;
  index_email: string;
  index_school_name: string;
  index_userMainRole: string;
  index_typeId: number;
  isProduction: boolean;
  resourceBaseUrl: string;
  assetsUrl: string;
  misVersion: string;
};
