import { mockInvoke } from './mock.js';

/* ─────────────────────────────────────────
   INVOKE — real Tauri or browser mock
───────────────────────────────────────── */
const invoke = window.__TAURI__?.core?.invoke ?? mockInvoke;

/* ─────────────────────────────────────────
   THEME
───────────────────────────────────────── */
function applyTheme(val) {
  const root = document.documentElement;
  if (val === 'dark')       root.setAttribute('data-theme', 'dark');
  else if (val === 'light') root.setAttribute('data-theme', 'light');
  else                      root.removeAttribute('data-theme');
}

(function initTheme() {
  applyTheme(localStorage.getItem('desksort-theme') || 'system');
})();

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function $(id) { return document.getElementById(id); }

function timeAgo(isoString) {
  if (!isoString) return 'Never';
  const diff = Date.now() - new Date(isoString).getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins  = Math.floor(diff / 60000);
  if (days > 1)  return `${days} days ago`;
  if (days === 1) return 'Yesterday';
  if (hours > 0) return `${hours}h ago`;
  if (mins  > 0) return `${mins}m ago`;
  return 'Just now';
}

function fmtDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCount(n) { return `${n} file${n !== 1 ? 's' : ''}`; }

function pillClass(rule) {
  return rule.type === 'keyword' ? 'pill--kw' : 'pill--ext';
}

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  void t.offsetWidth;
  t.classList.add('visible');
  setTimeout(() => {
    t.classList.remove('visible');
    setTimeout(() => t.classList.add('hidden'), 220);
  }, 2800);
}

/* ─────────────────────────────────────────
   DASHBOARD — load real data
───────────────────────────────────────── */
async function loadDashboard() {
  try {
    const data = await invoke('get_dashboard');

    // Topbar
    $('os-badge').textContent  = data.os;
    const shortPath = data.desktop_path.replace(/\\/g, '/').split('/').slice(-2).join('/');
    $('path-badge').textContent = '📂 ' + shortPath;
    $('path-badge').title       = data.desktop_path;

    // Metric cards
    $('stat-file-count').textContent = data.file_count;
    $('stat-clutter').textContent    = data.clutter_score;
    $('stat-clutter-bar').style.width = data.clutter_score + '%';

    if (data.last_organized) {
      $('stat-last-org').textContent     = timeAgo(data.last_organized);
      $('stat-last-org-sub').textContent = fmtDate(data.last_organized);
    } else {
      $('stat-last-org').textContent     = 'Never';
      $('stat-last-org-sub').textContent = '';
    }

    if (data.auto_schedule) {
      const freq = data.schedule_frequency;
      $('stat-schedule').textContent    = freq[0].toUpperCase() + freq.slice(1);
      $('stat-schedule-sub').textContent = 'Auto-organize on';
    } else {
      $('stat-schedule').textContent    = 'Off';
      $('stat-schedule-sub').textContent = 'Enable in Schedule';
    }

    // Folder counts
    const c = data.category_counts;
    $('fc-images').textContent    = fmtCount(c.images);
    $('fc-documents').textContent = fmtCount(c.documents);
    $('fc-archives').textContent  = fmtCount(c.archives);
    $('fc-code').textContent      = fmtCount(c.code);
    $('fc-other').textContent     = fmtCount(c.other);

  } catch (e) {
    console.error('loadDashboard failed:', e);
  }

  // Active rules list
  try {
    const rules = await invoke('get_rules');
    renderDashRules(rules);
  } catch (e) {
    console.error('loadRules for dash failed:', e);
  }
}

function renderDashRules(rules) {
  const list = $('dash-rules-list');
  // Group rules by folder to show concisely
  const byFolder = {};
  for (const r of rules) {
    if (!byFolder[r.folder]) byFolder[r.folder] = { ext: [], kw: [] };
    if (r.type === 'extension') byFolder[r.folder].ext.push(r.value);
    else byFolder[r.folder].kw.push(r.value);
  }

  let html = '';
  for (const [folder, groups] of Object.entries(byFolder)) {
    if (groups.ext.length) {
      html += `
        <div class="rule-item">
          <span class="pill pill--ext">${groups.ext.slice(0,4).join(' ')}${groups.ext.length > 4 ? ' …' : ''}</span>
          <i class="ti ti-arrow-right rule-arrow"></i>
          <span class="rule-dest">Move to <strong>${folder}/</strong></span>
        </div>`;
    }
    if (groups.kw.length) {
      html += `
        <div class="rule-item">
          <span class="pill pill--kw">keyword: ${groups.kw.join(', ')}</span>
          <i class="ti ti-arrow-right rule-arrow"></i>
          <span class="rule-dest">Move to <strong>${folder}/</strong></span>
        </div>`;
    }
  }
  html += `
    <div class="rule-item rule-item--add" id="dash-add-rule">
      <i class="ti ti-plus"></i><span>Add rule…</span>
    </div>`;
  list.innerHTML = html;

  $('dash-add-rule')?.addEventListener('click', () => navigateTo('rules'));
}

/* ─────────────────────────────────────────
   RULES PAGE — load + render
───────────────────────────────────────── */
async function loadRules() {
  let rules = [];
  try { rules = await invoke('get_rules'); } catch (e) { console.error(e); }
  renderRulesTable(rules);
}

function renderRulesTable(rules) {
  const tbody = $('rules-tbody');
  if (!tbody) return;
  tbody.innerHTML = rules.map(r => `
    <tr>
      <td><span class="pill ${pillClass(r)}">${r.type}</span></td>
      <td><code>${r.value}</code></td>
      <td>${r.folder}/</td>
      <td class="td-actions">
        <button class="icon-btn icon-btn--danger" data-delete-id="${r.id}" title="Delete">
          <i class="ti ti-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.deleteId;
      const updated = rules.filter(r => r.id !== id);
      try {
        await invoke('save_rules', { rules: updated });
        renderRulesTable(updated);
      } catch (e) { showToast('Failed to delete rule'); }
    });
  });
}

/* ─────────────────────────────────────────
   HISTORY PAGE — load + render
───────────────────────────────────────── */
async function loadHistory() {
  const container = $('history-list');
  if (!container) return;
  let sessions = [];
  try { sessions = await invoke('get_history'); } catch (e) { console.error(e); }

  if (sessions.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted);padding:40px 0;text-align:center">No sessions yet. Run "Organize now" from the Dashboard.</div>`;
    return;
  }

  container.innerHTML = sessions.map(s => {
    const moves = s.moves || [];
    return `
      <div class="history-card">
        <div class="history-header">
          <div>
            <div class="history-date">${new Date(s.timestamp).toLocaleString()}</div>
            <div class="history-meta">${fmtCount(moves.length)} moved</div>
          </div>
          <button class="btn-danger-outline btn-sm" data-undo-id="${s.id}">
            <i class="ti ti-arrow-back-up"></i> Undo this session
          </button>
        </div>
        ${moves.length ? `
        <details class="history-details">
          <summary>Show file list</summary>
          <div class="history-moves">
            ${moves.slice(0, 5).map(m => `
              <div class="move-row">
                <span class="move-from">${m.from.split(/[\\/]/).pop()}</span>
                <i class="ti ti-arrow-right move-sep"></i>
                <span class="move-to">${m.to.split(/[\\/]/).slice(-2).join('/')}</span>
              </div>`).join('')}
            ${moves.length > 5 ? `<div class="move-row move-row--more">+ ${moves.length - 5} more files</div>` : ''}
          </div>
        </details>` : ''}
      </div>`;
  }).join('');

  container.querySelectorAll('[data-undo-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.undoId;
      btn.disabled = true;
      btn.textContent = 'Undoing…';
      try {
        await invoke('undo_session', { sessionId: id });
        showToast('Session undone ✓');
        await loadHistory();
        await loadDashboard();
      } catch (e) {
        showToast('Undo failed: ' + e);
        btn.disabled = false;
        btn.innerHTML = '<i class="ti ti-arrow-back-up"></i> Undo this session';
      }
    });
  });
}

/* ─────────────────────────────────────────
   SETTINGS PAGE — load + save
───────────────────────────────────────── */
async function loadSettings() {
  try {
    const s = await invoke('get_settings_cmd');
    const pathInput = $('desktop-path-input');
    if (pathInput) pathInput.value = s.desktop_path || '';

    // toggles
    document.querySelectorAll('#page-settings .toggle').forEach((tog, i) => {
      const keys = ['skip_lnk', 'skip_hidden', 'undo_log', 'auto_schedule'];
      const val = s[keys[i]];
      tog.classList.toggle('on', !!val);
      tog.setAttribute('aria-pressed', String(!!val));
    });

    // theme seg
    document.querySelectorAll('#theme-seg .seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.val === (s.theme || 'system'));
    });
  } catch (e) { console.error('loadSettings failed:', e); }
}

async function saveSettings() {
  try {
    const current = await invoke('get_settings_cmd');
    const toggles = document.querySelectorAll('#page-settings .toggle');
    const keys    = ['skip_lnk', 'skip_hidden', 'undo_log', 'auto_schedule'];
    keys.forEach((k, i) => { current[k] = toggles[i]?.classList.contains('on') ?? current[k]; });
    current.desktop_path = $('desktop-path-input')?.value?.trim() || null;
    current.theme = document.querySelector('#theme-seg .seg-btn.active')?.dataset.val || 'system';
    await invoke('save_settings_cmd', { settings: current });
    applyTheme(current.theme);
    showToast('Settings saved ✓');
  } catch (e) { showToast('Failed to save settings'); }
}

/* ─────────────────────────────────────────
   SCHEDULE PAGE — load + save
───────────────────────────────────────── */
async function loadSchedule() {
  try {
    const s = await invoke('get_settings_cmd');
    const tog = $('schedule-toggle');
    if (tog) {
      tog.classList.toggle('on', !!s.auto_schedule);
      tog.setAttribute('aria-pressed', String(!!s.auto_schedule));
    }
    document.querySelectorAll('#schedule-freq-seg .seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.val === (s.schedule_frequency || 'daily'));
    });
  } catch (e) { console.error('loadSchedule failed:', e); }
}

async function saveSchedule() {
  try {
    const current  = await invoke('get_settings_cmd');
    const tog      = $('schedule-toggle');
    current.auto_schedule       = tog?.classList.contains('on') ?? false;
    current.schedule_frequency  = document.querySelector('#schedule-freq-seg .seg-btn.active')?.dataset.val || 'daily';
    await invoke('save_settings_cmd', { settings: current });
    showToast('Schedule saved ✓');
  } catch (e) { showToast('Failed to save schedule'); }
}

/* ─────────────────────────────────────────
   ADD RULE (rules page)
───────────────────────────────────────── */
async function saveNewRule() {
  const typeBtn = document.querySelector('#rules-type-seg .seg-btn.active');
  const type    = typeBtn?.dataset.val || 'extension';
  let   value   = $('rules-val-input')?.value.trim();
  const folder  = $('rules-folder-input')?.value.trim();
  if (!value || !folder) { showToast('Fill in both fields'); return; }
  if (type === 'extension' && !value.startsWith('.')) value = '.' + value;
  try {
    const rules = await invoke('get_rules');
    const newRule = { id: Date.now().toString(), type, value, folder };
    await invoke('save_rules', { rules: [...rules, newRule] });
    $('rules-val-input').value    = '';
    $('rules-folder-input').value = '';
    hideInlineForm('rules-inline-form');
    await loadRules();
    showToast('Rule added ✓');
  } catch (e) { showToast('Failed to save rule'); }
}

/* ─────────────────────────────────────────
   ORGANIZE NOW
───────────────────────────────────────── */
const btnOrganize = $('btn-organize');

btnOrganize.addEventListener('click', async () => {
  btnOrganize.disabled = true;
  btnOrganize.innerHTML = '<span class="spinner"></span> Organizing…';
  try {
    const session = await invoke('run_organize');
    const count   = session.moves?.length ?? 0;
    showToast(count === 0 ? 'Already organized!' : `${count} file${count !== 1 ? 's' : ''} sorted ✓`);
    await loadDashboard();
  } catch (e) {
    showToast('Organize failed: ' + e);
  } finally {
    btnOrganize.disabled = false;
    btnOrganize.innerHTML = '<i class="ti ti-player-play"></i> Organize now';
  }
});

/* ─────────────────────────────────────────
   DRY RUN
───────────────────────────────────────── */
const btnDryrun     = $('btn-dryrun');
const overlay       = $('dryrun-overlay');
const dryrunClose   = $('dryrun-close');
const dryrunDismiss = $('dryrun-dismiss');
const dryrunRun     = $('dryrun-run');

btnDryrun.addEventListener('click', async () => {
  overlay.classList.remove('hidden');
  const body = overlay.querySelector('.overlay-body');
  body.innerHTML = '<div style="color:var(--text-muted);padding:20px 0">Calculating…</div>';
  try {
    const moves = await invoke('preview_organize');
    if (moves.length === 0) {
      body.innerHTML = '<div style="color:var(--text-muted);padding:20px 0">Nothing to move — desktop is already organized.</div>';
    } else {
      body.innerHTML = moves.map(m => `
        <div class="move-row">
          <span class="move-from">${m.filename}</span>
          <i class="ti ti-arrow-right move-sep"></i>
          <span class="move-to">${m.folder}/</span>
        </div>`).join('') +
        `<div class="overlay-footer-note">${moves.length} file${moves.length !== 1 ? 's' : ''} total</div>`;
    }
  } catch (e) {
    body.innerHTML = `<div style="color:var(--danger)">Error: ${e}</div>`;
  }
});

function closeDryrun() { overlay.classList.add('hidden'); }
dryrunClose.addEventListener('click', closeDryrun);
dryrunDismiss.addEventListener('click', closeDryrun);
overlay.addEventListener('click', e => { if (e.target === overlay) closeDryrun(); });
dryrunRun.addEventListener('click', () => { closeDryrun(); btnOrganize.click(); });

/* ─────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────── */
const PAGE_TITLES = {
  dashboard: 'Dashboard', folders: 'Folders', rules: 'Rules',
  history: 'History', schedule: 'Schedule', settings: 'Settings',
};

const PAGE_LOADERS = {
  dashboard: loadDashboard,
  rules:     loadRules,
  history:   loadHistory,
  schedule:  loadSchedule,
  settings:  loadSettings,
};

async function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = $('page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  $('page-title').textContent = PAGE_TITLES[page] || page;
  if (PAGE_LOADERS[page]) await PAGE_LOADERS[page]();
}

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.page); });
});

/* ─────────────────────────────────────────
   SEGMENTED CONTROLS
───────────────────────────────────────── */
document.querySelectorAll('.seg-ctrl').forEach(ctrl => {
  ctrl.addEventListener('click', e => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    ctrl.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (ctrl.id === 'theme-seg') {
      localStorage.setItem('desksort-theme', btn.dataset.val);
      applyTheme(btn.dataset.val);
    }
    const freqSegs = ['schedule-freq-seg'];
    if (freqSegs.includes(ctrl.id)) {
      const isWeekly = btn.dataset.val === 'weekly';
      const dayRow = $('day-picker-row');
      if (dayRow) dayRow.style.display = isWeekly ? '' : 'none';
    }
  });
});

/* ─────────────────────────────────────────
   TOGGLE SWITCHES
───────────────────────────────────────── */
document.querySelectorAll('.toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const isOn = toggle.classList.toggle('on');
    toggle.setAttribute('aria-pressed', String(isOn));
  });
});

/* ─────────────────────────────────────────
   DAY PILLS
───────────────────────────────────────── */
document.querySelectorAll('.day-pills').forEach(group => {
  group.addEventListener('click', e => {
    const pill = e.target.closest('.day-pill');
    if (!pill) return;
    group.querySelectorAll('.day-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

/* ─────────────────────────────────────────
   SAVE BUTTONS
───────────────────────────────────────── */
$('rules-add-btn')?.addEventListener('click', () => showInlineForm('rules-inline-form'));
$('rules-cancel-btn')?.addEventListener('click', () => hideInlineForm('rules-inline-form'));
$('rules-save-btn')?.addEventListener('click', saveNewRule);
$('btn-save-settings')?.addEventListener('click', saveSettings);
$('btn-save-schedule')?.addEventListener('click', saveSchedule);

function showInlineForm(id) { $(id)?.classList.remove('hidden'); }
function hideInlineForm(id) { $(id)?.classList.add('hidden'); }

/* ─────────────────────────────────────────
   TOPBAR BADGE IDs (add to HTML if missing)
───────────────────────────────────────── */
// ensure topbar badge has id
(function ensureBadgeIds() {
  const badge = document.querySelector('.topbar-badge');
  if (badge && !$('os-badge')) {
    const icon = badge.querySelector('i');
    const span = badge.querySelector('span');
    if (icon) icon.id = 'os-badge';
    if (span) span.id = 'path-badge';
  }
})();

/* ─────────────────────────────────────────
   BOOT
───────────────────────────────────────── */
navigateTo('dashboard');
