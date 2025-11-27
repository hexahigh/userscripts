<script lang="ts">
  import type { ScriptMeta } from './types';
  
  interface Props {
    scripts: ScriptMeta[];
  }
  
  let { scripts = [] }: Props = $props();
</script>

<div class="container">
  <h1>Simon's Userscripts</h1>
  <p><a href="https://github.com/hexahigh/userscripts" target="_blank">View Source on GitHub</a></p>
  
  <div class="intro">
    <p>A collection of userscripts made by me. Install any of these scripts using Violentmonkey or Tampermonkey.<br><span class="font-bold">Read install instructions below.</span></p>
  </div>

  {#if scripts.length > 0}
    <div class="scripts-grid">
      {#each scripts as script}
        <div class="script-item">
          <div class="script-info">
            <h3>{script.name}</h3>
            <p class="script-desc">{script.description}</p>
            {#if script.version}
              <p class="script-version">v{script.version}</p>
            {/if}
          </div>
          <a href={script.outfile} class="install-link">Install</a>
        </div>
      {/each}
    </div>
  {:else}
    <p style="text-align: center; color: #999; padding: 30px;">No userscripts found.</p>
  {/if}

  <h2>Installation Guide</h2>

  <div class="guide-section">
    <h3>Step 1: Install Violentmonkey or Tampermonkey</h3>
    <p>Violentmonkey and Tampermonkey are browser extensions that allow you to run userscripts. Download for your browser:</p>
    <ul>
      <li><strong>Chrome/Edge/Brave:</strong> <a href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en" target="_blank">Get Tampermonkey from Chrome Web Store</a></li>
      <li><strong>Firefox:</strong> <a href="https://addons.mozilla.org/firefox/addon/violentmonkey/" target="_blank">Get Violentmonkey from Firefox Add-ons</a></li>
      <li><strong>Safari:</strong> <a href="https://apps.apple.com/app/userscripts/id1463298887" target="_blank">Get Userscripts from App Store</a></li>
    </ul>
    <div class="warning">
       Safari users may need to follow additional steps to enable extensions. Please refer to the <a href="https://github.com/quoid/userscripts?tab=readme-ov-file#installation" target="_blank">Userscripts documentation</a> for more details.
    </div>
    <div class="success">
      Once installed, you'll see the Violentmonkey/Tampermonkey icon in your browser toolbar or in the extensions menu.
    </div>
  </div>

  <div class="guide-section">
    <h3>Step 2: Install a Userscript</h3>
    <ol>
      <li>Click on a script's <strong>Install</strong> button above, or directly visit the <code>.js</code> file in your browser.</li>
      <li>Violentmonkey will show an installation dialog displaying the script's permissions and metadata.</li>
      <li>Review the script details and click <strong>Confirm Installation</strong>.</li>
      <li>The script is now active! You'll see a notification once it's ready.</li>
    </ol>
  </div>

  <div class="guide-section">
    <h3>Step 3: Manage Your Scripts</h3>
    <p>Click the Violentmonkey icon in your toolbar to:</p>
    <ul>
      <li><strong>Enable/Disable</strong> scripts individually</li>
      <li><strong>Edit</strong> scripts to customize their behavior</li>
      <li><strong>Delete</strong> scripts you no longer want</li>
      <li>View <strong>script logs</strong> for debugging</li>
    </ul>
  </div>

  <div class="guide-section">
    <h3>Troubleshooting</h3>
    <ul>
      <li><strong>Script not running?</strong> Check that Violentmonkey is enabled in your browser settings, and that the script is enabled in the Violentmonkey dashboard.</li>
      <li><strong>Script causing issues?</strong> Temporarily disable it from the Violentmonkey menu to test.</li>
      <li><strong>Update check:</strong> Violentmonkey can auto-check for updates. Enable this in Violentmonkey settings.</li>
    </ul>
  </div>
</div>
