import { invoke } from '../main.js';

export async function init(container) {
  container.innerHTML = `<div class="loading">Loading history…</div>`;
  let sessions;
  try {
    sessions = await invoke('get_history');
  } catch (e) {
    container.innerHTML = `<div class="error">Failed to load history: ${e}</div>`;
    return;
  }
  render(container, sessions);
}

function render(container, sessions) {
  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No history yet</h3>
        <p>Run "Organize Now" from the Dashboard to see sessions here.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="history-page">
      ${sessions.map(s => {
        const date = new Date(s.timestamp).toLocaleString();
        const count = s.moves.length;
        return `
          <div class="history-card" data-id="${s.id}">
            <div class="history-header">
              <div>
                <div class="history-date">${date}</div>
                <div class="history-summary">${count} file${count !== 1 ? 's' : ''} moved</div>
              </div>
              <button class="btn btn-outline btn-sm btn-undo" data-id="${s.id}">↩ Undo</button>
            </div>
            ${count > 0 ? `
              <details class="history-details">
                <summary>Show files</summary>
                <table class="move-table">
                  <thead><tr><th>From</th><th>To</th></tr></thead>
                  <tbody>
                    ${s.moves.map(m => `
                      <tr>
                        <td class="path">${shortPath(m.from)}</td>
                        <td class="path">${shortPath(m.to)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </details>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.btn-undo').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = 'Undoing…';
      try {
        await invoke('undo_session', { sessionId: id });
        await init(container);
      } catch (e) {
        btn.disabled = false;
        btn.textContent = '↩ Undo';
        alert(`Undo failed: ${e}`);
      }
    });
  });
}

function shortPath(p) {
  const parts = p.replace(/\\/g, '/').split('/');
  return parts.slice(-3).join('/');
}
