import { invoke } from '../main.js';

export async function init(container) {
  let settings;
  try {
    settings = await invoke('get_settings_cmd');
  } catch (e) {
    container.innerHTML = `<div class="error">Failed to load settings: ${e}</div>`;
    return;
  }
  render(container, settings);
}

function render(container, settings) {
  container.innerHTML = `
    <div class="settings-page">
      <div class="card">
        <h3 class="section-title">Desktop Path</h3>
        <div class="form-row">
          <label class="form-label">Custom path (leave blank for auto-detect)</label>
          <input type="text" id="desktop-path" class="input input--wide"
            value="${settings.desktop_path || ''}"
            placeholder="e.g. C:\\Users\\Name\\Desktop">
        </div>
      </div>

      <div class="card">
        <h3 class="section-title">File Filters</h3>
        <div class="form-row">
          <label class="form-label">Skip shortcut files (.lnk)</label>
          <label class="switch">
            <input type="checkbox" id="skip-lnk" ${settings.skip_lnk ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        <div class="form-row">
          <label class="form-label">Skip hidden files (start with .)</label>
          <label class="switch">
            <input type="checkbox" id="skip-hidden" ${settings.skip_hidden ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
        <div class="form-row">
          <label class="form-label">Enable undo log</label>
          <label class="switch">
            <input type="checkbox" id="undo-log" ${settings.undo_log ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title">Appearance</h3>
        <div class="form-row">
          <label class="form-label">Theme</label>
          <div class="radio-group">
            ${['system', 'light', 'dark'].map(t => `
              <label class="radio-label">
                <input type="radio" name="theme" value="${t}" ${settings.theme === t ? 'checked' : ''}>
                ${t[0].toUpperCase() + t.slice(1)}
              </label>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="settings-actions">
        <button class="btn btn-primary" id="btn-save-settings">Save Settings</button>
        <span id="settings-saved" class="save-confirm hidden">Saved ✓</span>
      </div>
    </div>
  `;

  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const updated = {
      ...settings,
      desktop_path: document.getElementById('desktop-path').value.trim() || null,
      skip_lnk:    document.getElementById('skip-lnk').checked,
      skip_hidden: document.getElementById('skip-hidden').checked,
      undo_log:    document.getElementById('undo-log').checked,
      theme:       document.querySelector('input[name="theme"]:checked')?.value || 'system',
    };

    try {
      await invoke('save_settings_cmd', { settings: updated });
      applyTheme(updated.theme);
      const saved = document.getElementById('settings-saved');
      saved.classList.remove('hidden');
      setTimeout(() => saved.classList.add('hidden'), 2000);
    } catch (e) {
      alert(`Failed to save: ${e}`);
    }
  });
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
}
