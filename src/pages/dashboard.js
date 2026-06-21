import { invoke } from '../main.js';

export async function init(container) {
  container.innerHTML = `<div class="loading">Loading dashboard…</div>`;
  let data;
  try {
    data = await invoke('get_dashboard');
  } catch (e) {
    container.innerHTML = `<div class="error">Failed to load dashboard: ${e}</div>`;
    return;
  }

  const scoreColor = data.clutter_score < 30 ? '#4caf50'
                   : data.clutter_score < 70 ? '#ff9800'
                   : '#f44336';

  const lastOrg = data.last_organized
    ? new Date(data.last_organized).toLocaleString()
    : 'Never';

  const cats = [
    { name: 'Images',    icon: '🖼', count: data.category_counts.images },
    { name: 'Documents', icon: '📄', count: data.category_counts.documents },
    { name: 'Archives',  icon: '📦', count: data.category_counts.archives },
    { name: 'Code',      icon: '💻', count: data.category_counts.code },
    { name: 'Videos',    icon: '🎬', count: data.category_counts.videos },
    { name: 'Other',     icon: '📁', count: data.category_counts.other },
  ];

  container.innerHTML = `
    <div class="dashboard">
      <div class="stat-row">
        <div class="stat-card">
          <div class="stat-label">Loose Files</div>
          <div class="stat-value">${data.file_count}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Clutter Score</div>
          <div class="stat-value" style="color:${scoreColor}">${data.clutter_score}<span class="stat-unit">/100</span></div>
          <div class="score-bar-bg"><div class="score-bar" style="width:${data.clutter_score}%;background:${scoreColor}"></div></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Last Organized</div>
          <div class="stat-value stat-value--sm">${lastOrg}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Auto-Schedule</div>
          <div class="stat-value stat-value--sm">${data.auto_schedule ? '✅ ' + cap(data.schedule_frequency) : '⏸ Off'}</div>
        </div>
      </div>

      <h3 class="section-title">Folder Preview</h3>
      <div class="folder-grid">
        ${cats.map(c => `
          <div class="folder-card">
            <div class="folder-icon">${c.icon}</div>
            <div class="folder-name">${c.name}</div>
            <div class="folder-count">${c.count} file${c.count !== 1 ? 's' : ''}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="action-bar">
      <div class="action-bar-left">
        <label class="toggle-row">
          <span>Undo Log</span>
          <input type="checkbox" id="undo-toggle" ${await getUndoLog() ? 'checked' : ''}>
        </label>
      </div>
      <div class="action-bar-right">
        <button class="btn btn-outline" id="btn-dryrun">Dry Run</button>
        <button class="btn btn-primary" id="btn-organize">Organize Now</button>
      </div>
    </div>

    <div id="dry-run-result" class="dry-run-panel hidden"></div>
  `;

  document.getElementById('btn-organize').addEventListener('click', runOrganize);
  document.getElementById('btn-dryrun').addEventListener('click', dryRun);
  document.getElementById('undo-toggle').addEventListener('change', async (e) => {
    const s = await invoke('get_settings_cmd');
    s.undo_log = e.target.checked;
    await invoke('save_settings_cmd', { settings: s });
  });
}

async function getUndoLog() {
  try {
    const s = await invoke('get_settings_cmd');
    return s.undo_log;
  } catch { return true; }
}

async function dryRun() {
  const panel = document.getElementById('dry-run-result');
  panel.innerHTML = '<div class="loading">Calculating moves…</div>';
  panel.classList.remove('hidden');
  try {
    const moves = await invoke('preview_organize');
    if (moves.length === 0) {
      panel.innerHTML = '<div class="empty-state">✅ Desktop is already organized — no files to move.</div>';
      return;
    }
    panel.innerHTML = `
      <h4>Dry Run — ${moves.length} file${moves.length !== 1 ? 's' : ''} would move</h4>
      <table class="move-table">
        <thead><tr><th>File</th><th>→ Folder</th></tr></thead>
        <tbody>
          ${moves.map(m => `<tr><td>${m.filename}</td><td>${m.folder}/</td></tr>`).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    panel.innerHTML = `<div class="error">Error: ${e}</div>`;
  }
}

async function runOrganize() {
  const btn = document.getElementById('btn-organize');
  btn.disabled = true;
  btn.textContent = 'Organizing…';
  try {
    const session = await invoke('run_organize');
    const count = session.moves.length;
    showToast(count === 0
      ? 'Desktop already organized!'
      : `Moved ${count} file${count !== 1 ? 's' : ''} ✓`
    );
    // Refresh dashboard
    const container = document.getElementById('content');
    await init(container);
  } catch (e) {
    showToast(`Error: ${e}`, 'error');
    btn.disabled = false;
    btn.textContent = 'Organize Now';
  }
}

function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
