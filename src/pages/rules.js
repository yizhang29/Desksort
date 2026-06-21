import { invoke } from '../main.js';

export async function init(container) {
  container.innerHTML = `<div class="loading">Loading rules…</div>`;
  let rules;
  try {
    rules = await invoke('get_rules');
  } catch (e) {
    container.innerHTML = `<div class="error">Failed to load rules: ${e}</div>`;
    return;
  }
  render(container, rules);
}

function render(container, rules) {
  const builtinIds = Array.from({ length: 28 }, (_, i) => String(i + 1));
  const builtins = rules.filter(r => builtinIds.includes(r.id));
  const custom   = rules.filter(r => !builtinIds.includes(r.id));

  container.innerHTML = `
    <div class="rules-page">
      <section class="rules-section">
        <h3 class="section-title">Built-in Rules <span class="badge">${builtins.length}</span></h3>
        <table class="rules-table">
          <thead><tr><th>Match</th><th>Value</th><th>→ Folder</th></tr></thead>
          <tbody>
            ${builtins.map(r => `
              <tr>
                <td><span class="tag tag--${r.type}">${r.type}</span></td>
                <td><code>${r.value}</code></td>
                <td>${r.folder}/</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>

      <section class="rules-section">
        <h3 class="section-title">Custom Rules <span class="badge">${custom.length}</span></h3>
        ${custom.length === 0 ? '<p class="muted">No custom rules yet.</p>' : `
          <table class="rules-table">
            <thead><tr><th>Match</th><th>Value</th><th>→ Folder</th><th></th></tr></thead>
            <tbody>
              ${custom.map(r => `
                <tr data-id="${r.id}">
                  <td><span class="tag tag--${r.type}">${r.type}</span></td>
                  <td><code>${r.value}</code></td>
                  <td>${r.folder}/</td>
                  <td><button class="btn-icon btn-delete" data-id="${r.id}" title="Delete rule">✕</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </section>

      <section class="rules-section">
        <h3 class="section-title">Add Custom Rule</h3>
        <form class="add-rule-form" id="add-rule-form">
          <select id="rule-type" class="input">
            <option value="extension">Extension</option>
            <option value="keyword">Keyword</option>
          </select>
          <input id="rule-value" class="input" placeholder=".psd  or  invoice" required>
          <input id="rule-folder" class="input" placeholder="Folder name (e.g. Design)" required>
          <button type="submit" class="btn btn-primary">Add Rule</button>
        </form>
        <p class="hint">Extension example: <code>.psd</code> → Design/&nbsp;&nbsp;|&nbsp;&nbsp;Keyword example: <code>invoice</code> → Finance/</p>
      </section>
    </div>
  `;

  // Delete handlers
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const updated = rules.filter(r => r.id !== id);
      await saveAndRefresh(container, updated);
    });
  });

  // Add rule form
  container.querySelector('#add-rule-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const type   = document.getElementById('rule-type').value;
    let value    = document.getElementById('rule-value').value.trim();
    const folder = document.getElementById('rule-folder').value.trim();
    if (!value || !folder) return;

    // Normalise extension
    if (type === 'extension' && !value.startsWith('.')) value = '.' + value;

    const newRule = {
      id: Date.now().toString(),
      type,
      value,
      folder,
    };
    await saveAndRefresh(container, [...rules, newRule]);
  });
}

async function saveAndRefresh(container, rules) {
  try {
    await invoke('save_rules', { rules });
    render(container, rules);
  } catch (e) {
    alert(`Failed to save rules: ${e}`);
  }
}
