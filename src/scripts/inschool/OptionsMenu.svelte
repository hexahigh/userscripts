<script lang="ts">
  import { onMount } from 'svelte';
  import './inschool.ui.css';

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

  let detailsElement: HTMLDetailsElement;

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

<details bind:this={detailsElement} class="dropdown relative">
  <summary class="btn btn-sm"> Options </summary>

  <div
    class="dropdown-content card card-compact w-80 bg-base-100 shadow-lg absolute right-0 mt-2 z-10"
    style="background: white; color: inherit; pointer-events: auto; z-index: 99999"
  >
    <div class="card-body p-4">
      <h3 class="card-title">InSchool Options</h3>

      <!-- Features -->
      <div class="mb-4">
        <h4 class="text-sm font-medium mb-2">Features</h4>
        <div class="space-y-2">
          {#each Object.entries(settings.enabledFeatures) as [feature, enabled]}
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                on:change={(e: Event) =>
                  updateFeature(feature as keyof Settings['enabledFeatures'], (e.target as HTMLInputElement).checked)}
                class="checkbox checkbox-sm"
              />
              <span class="text-sm">{feature.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</span
              >
            </label>
          {/each}
        </div>
      </div>

      <!-- Language -->
      <div class="mb-4">
        <h4 class="text-sm font-medium mb-2">Language</h4>
        <select
          value={settings.forcedLanguage}
          on:change={(e: Event) => updateLanguage((e.target as HTMLSelectElement).value as Settings['forcedLanguage'])}
          class="select select-bordered w-full"
        >
          <option value="auto">Auto-detect</option>
          <option value="no">Norwegian</option>
          <option value="en">English</option>
        </select>
      </div>

      <!-- Border Sides -->
      <div class="mb-4">
        <h4 class="text-sm font-medium mb-2">Timetable Item Borders</h4>
        <div class="grid grid-cols-2 gap-2">
          {#each Object.entries(settings.borderSides) as [side, enabled]}
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                on:change={(e: Event) =>
                  updateBorderSide(side as keyof Settings['borderSides'], (e.target as HTMLInputElement).checked)}
                class="checkbox checkbox-sm"
              />
              <span class="text-sm capitalize">{side}</span>
            </label>
          {/each}
        </div>
      </div>

      <button on:click={() => detailsElement && (detailsElement.open = false)} class="btn btn-block btn-outline">
        Close
      </button>
    </div>
  </div>
</details>

<style>
  /* Ensure the dropdown appears above other elements */
  .relative {
    position: relative;
  }
</style>
