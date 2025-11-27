<script lang="ts">
  import { onMount } from 'svelte';

  interface Settings {
    enabledFeatures: {
      weekWarning: boolean;
      markEmptyDays: boolean;
      markBreaks: boolean;
    };
    forcedLanguage: 'auto' | 'no' | 'en';
    borderSides: {
      top: boolean;
      right: boolean;
      bottom: boolean;
      left: boolean;
    };
  }

  let settings: Settings = {
    enabledFeatures: {
      weekWarning: true,
      markEmptyDays: true,
      markBreaks: true,
    },
    forcedLanguage: 'auto',
    borderSides: {
      top: false,
      right: false,
      bottom: false,
      left: true,
    },
  };

  let isOpen = false;

  function loadSettings() {
    const stored = localStorage.getItem('inschool-options');
    if (stored) {
      try {
        settings = { ...settings, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }

  function saveSettings() {
    localStorage.setItem('inschool-options', JSON.stringify(settings));
    // Dispatch custom event to notify the main script
    window.dispatchEvent(new CustomEvent('inschool-settings-changed', { detail: settings }));
  }

  function toggleMenu() {
    isOpen = !isOpen;
  }

  function updateFeature(feature: keyof Settings['enabledFeatures'], enabled: boolean) {
    settings.enabledFeatures[feature] = enabled;
    saveSettings();
  }

  function updateLanguage(language: Settings['forcedLanguage']) {
    settings.forcedLanguage = language;
    saveSettings();
  }

  function updateBorderSide(side: keyof Settings['borderSides'], enabled: boolean) {
    settings.borderSides[side] = enabled;
    saveSettings();
  }

  onMount(() => {
    loadSettings();
  });
</script>

<div class="relative">
  <button
    on:click={toggleMenu}
    class="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
  >
    Options
  </button>

  {#if isOpen}
    <div class="absolute right-0 z-10 mt-2 w-80 bg-white border border-gray-300 rounded-md shadow-lg">
      <div class="p-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">InSchool Options</h3>

        <!-- Features -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Features</h4>
          <div class="space-y-2">
            {#each Object.entries(settings.enabledFeatures) as [feature, enabled]}
              <label class="flex items-center">
                <input
                  type="checkbox"
                  checked={enabled}
                  on:change={(e) => updateFeature(feature as keyof Settings['enabledFeatures'], e.target.checked)}
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700"
                  >{feature.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</span
                >
              </label>
            {/each}
          </div>
        </div>

        <!-- Language -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Language</h4>
          <select
            value={settings.forcedLanguage}
            on:change={(e) => updateLanguage(e.target.value as Settings['forcedLanguage'])}
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="auto">Auto-detect</option>
            <option value="no">Norwegian</option>
            <option value="en">English</option>
          </select>
        </div>

        <!-- Border Sides -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Timetable Item Borders</h4>
          <div class="grid grid-cols-2 gap-2">
            {#each Object.entries(settings.borderSides) as [side, enabled]}
              <label class="flex items-center">
                <input
                  type="checkbox"
                  checked={enabled}
                  on:change={(e) => updateBorderSide(side as keyof Settings['borderSides'], e.target.checked)}
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span class="ml-2 text-sm text-gray-700 capitalize">{side}</span>
              </label>
            {/each}
          </div>
        </div>

        <button
          on:click={toggleMenu}
          class="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Close
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Ensure the dropdown appears above other elements */
  .relative {
    position: relative;
  }
</style>
