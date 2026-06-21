/* ════════════════════════════════════════
   DESKSORT — main.js
   Self-contained UI controller.
   Works in browser preview (mock data) and
   inside Tauri (real invoke) automatically.
════════════════════════════════════════ */

// ── Theme ──────────────────────────────

function applyTheme(val) {
  const root = document.documentElement;
  if (val === 'dark')   { root.setAttribute('data-theme', 'dark'); }
  else if (val === 'light') { root.setAttribute('data-theme', 'light'); }
  else                  { root.removeAttribute('data-theme'); }
}

(function initTheme() {
  const saved = localStorage.getItem('desksort-theme') || 'system';
  applyTheme(saved);
  // sync theme seg control on settings page
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector(`#theme-seg [data-val="${saved}"]`);
    if (btn) {
      document.querySelectorAll('#theme-seg .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  });
})();

// ── Page navigation ─────────────────────

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  folders:   'Folders',
  rules:     'Rules',
  history:   'History',
  schedule:  'Schedule',
  settings:  'Settings',
};

function navigateTo(pageId) {
  // hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // show target
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  // update sidebar
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });

  // update title
  document.getElementById('page-title').textContent = PAGE_TITLES[pageId] || pageId;

  // tab bar only on dashboard
  const tabbar = document.getElementById('tabbar');
  tabbar.style.display = pageId === 'dashboard' ? '' : 'none';
}

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(el.dataset.page);
  });
});

// ── Segmented controls ──────────────────

document.querySelectorAll('.seg-ctrl').forEach(ctrl => {
  ctrl.addEventListener('click', e => {
    const btn = e.target.closest('.seg-btn');
    if (!btn) return;
    ctrl.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // theme seg special handling
    if (ctrl.id === 'theme-seg') {
      const val = btn.dataset.val;
      localStorage.setItem('desksort-theme', val);
      applyTheme(val);
    }

    // day picker row visibility
    const freqSegs = ['schedule-freq-seg', 'dash-freq-seg'];
    if (freqSegs.includes(ctrl.id)) {
      const isWeekly = btn.dataset.val === 'weekly';
      ['day-picker-row', 'dash-day-row'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isWeekly ? '' : 'none';
      });
    }
  });
});

// ── Day pills ───────────────────────────

document.querySelectorAll('.day-pills').forEach(group => {
  group.addEventListener('click', e => {
    const pill = e.target.closest('.day-pill');
    if (!pill) return;
    group.querySelectorAll('.day-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

// ── Toggle switches ─────────────────────

document.querySelectorAll('.toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const isOn = toggle.classList.toggle('on');
    toggle.setAttribute('aria-pressed', String(isOn));
  });
});

// ── Action bar: Organize Now ────────────

const btnOrganize = document.getElementById('btn-organize');

btnOrganize.addEventListener('click', () => {
  // show spinner
  btnOrganize.disabled = true;
  btnOrganize.innerHTML = '<span class="spinner"></span> Organizing…';

  setTimeout(() => {
    btnOrganize.disabled = false;
    btnOrganize.innerHTML = '<i class="ti ti-player-play"></i> Organize now';
    showToast('Desktop organized! 47 files sorted.');
  }, 1500);
});

// ── Action bar: Dry Run ─────────────────

const btnDryrun  = document.getElementById('btn-dryrun');
const overlay    = document.getElementById('dryrun-overlay');
const dryrunClose  = document.getElementById('dryrun-close');
const dryrunDismiss = document.getElementById('dryrun-dismiss');
const dryrunRun  = document.getElementById('dryrun-run');

btnDryrun.addEventListener('click', () => overlay.classList.remove('hidden'));

function closeDryrun() { overlay.classList.add('hidden'); }

dryrunClose.addEventListener('click', closeDryrun);
dryrunDismiss.addEventListener('click', closeDryrun);

// clicking outside the panel closes it
overlay.addEventListener('click', e => {
  if (e.target === overlay) closeDryrun();
});

dryrunRun.addEventListener('click', () => {
  closeDryrun();
  btnOrganize.click();
});

// ── Add rule shortcuts ──────────────────

// Dashboard "Add rule…" dashed card → navigate to Rules page
const dashAddRule = document.getElementById('dash-add-rule');
if (dashAddRule) {
  dashAddRule.addEventListener('click', () => navigateTo('rules'));
}

// Rules page add button
const rulesAddBtn = document.getElementById('rules-add-btn');
if (rulesAddBtn) {
  rulesAddBtn.addEventListener('click', () => showInlineForm('rules-inline-form'));
}

const rulesCancelBtn = document.getElementById('rules-cancel-btn');
if (rulesCancelBtn) rulesCancelBtn.addEventListener('click', () => hideInlineForm('rules-inline-form'));

function showInlineForm(id) {
  const form = document.getElementById(id);
  if (form) form.classList.remove('hidden');
}

function hideInlineForm(id) {
  const form = document.getElementById(id);
  if (form) form.classList.add('hidden');
}

// ── Toast ───────────────────────────────

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  // force reflow for transition
  void toast.offsetWidth;
  toast.classList.add('visible');
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.classList.add('hidden'), 220);
  }, 2800);
}

// ── Boot ────────────────────────────────

navigateTo('dashboard');
