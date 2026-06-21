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
    <div class="schedule-page">
      <div class="card">
        <h3 class="section-title">Auto-Organize Schedule</h3>

        <div class="form-row">
          <label class="form-label">Enable auto-organize</label>
          <label class="switch">
            <input type="checkbox" id="auto-toggle" ${settings.auto_schedule ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>

        <div class="form-row ${settings.auto_schedule ? '' : 'disabled'}" id="freq-row">
          <label class="form-label">Frequency</label>
          <div class="radio-group">
            ${['daily', 'weekly', 'login'].map(f => `
              <label class="radio-label">
                <input type="radio" name="frequency" value="${f}" ${settings.schedule_frequency === f ? 'checked' : ''}>
                ${cap(f)}
              </label>
            `).join('')}
          </div>
        </div>

        <div class="schedule-note">
          <strong>Note:</strong> DeskSort's schedule runs each time the app opens.
          For true background scheduling on Windows, use Task Scheduler with the app's
          command-line flag <code>--organize</code> (coming in a future release).
        </div>

        <button class="btn btn-primary" id="btn-save-schedule">Save Schedule</button>
        <span id="schedule-saved" class="save-confirm hidden">Saved ✓</span>
      </div>

      <div class="card" style="margin-top:1rem">
        <h3 class="section-title">Run Now</h3>
        <p>Manually trigger an organization run from here or from the Dashboard.</p>
        <button class="btn btn-outline" id="btn-run-now">Organize Now</button>
        <div id="schedule-run-result"></div>
      </div>
    </div>
  `;

  const autoToggle = document.getElementById('auto-toggle');
  const freqRow = document.getElementById('freq-row');

  autoToggle.addEventListener('change', () => {
    freqRow.classList.toggle('disabled', !autoToggle.checked);
  });

  document.getElementById('btn-save-schedule').addEventListener('click', async () => {
    const freq = document.querySelector('input[name="frequency"]:checked')?.value || 'daily';
    settings.auto_schedule = autoToggle.checked;
    settings.schedule_frequency = freq;
    try {
      await invoke('save_settings_cmd', { settings });
      const saved = document.getElementById('schedule-saved');
      saved.classList.remove('hidden');
      setTimeout(() => saved.classList.add('hidden'), 2000);
    } catch (e) {
      alert(`Failed to save: ${e}`);
    }
  });

  document.getElementById('btn-run-now').addEventListener('click', async () => {
    const btn = document.getElementById('btn-run-now');
    const result = document.getElementById('schedule-run-result');
    btn.disabled = true;
    result.innerHTML = '<span class="muted">Organizing…</span>';
    try {
      const session = await invoke('run_organize');
      const count = session.moves.length;
      result.innerHTML = `<span class="success">${count === 0 ? 'Already organized!' : `Moved ${count} file${count !== 1 ? 's' : ''} ✓`}</span>`;
    } catch (e) {
      result.innerHTML = `<span class="error">Error: ${e}</span>`;
    }
    btn.disabled = false;
  });
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
