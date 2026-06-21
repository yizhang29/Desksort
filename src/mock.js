// Fake Tauri backend for browser preview

const _rules = [
  { id: '1',  type: 'extension', value: '.jpg',  folder: 'Images' },
  { id: '2',  type: 'extension', value: '.jpeg', folder: 'Images' },
  { id: '3',  type: 'extension', value: '.png',  folder: 'Images' },
  { id: '4',  type: 'extension', value: '.gif',  folder: 'Images' },
  { id: '5',  type: 'extension', value: '.webp', folder: 'Images' },
  { id: '6',  type: 'extension', value: '.pdf',  folder: 'Documents' },
  { id: '7',  type: 'extension', value: '.docx', folder: 'Documents' },
  { id: '8',  type: 'extension', value: '.doc',  folder: 'Documents' },
  { id: '9',  type: 'extension', value: '.xlsx', folder: 'Documents' },
  { id: '10', type: 'extension', value: '.xls',  folder: 'Documents' },
  { id: '11', type: 'extension', value: '.txt',  folder: 'Documents' },
  { id: '12', type: 'extension', value: '.zip',  folder: 'Archives' },
  { id: '13', type: 'extension', value: '.rar',  folder: 'Archives' },
  { id: '14', type: 'extension', value: '.7z',   folder: 'Archives' },
  { id: '15', type: 'extension', value: '.tar',  folder: 'Archives' },
  { id: '16', type: 'extension', value: '.gz',   folder: 'Archives' },
  { id: '17', type: 'extension', value: '.js',   folder: 'Code' },
  { id: '18', type: 'extension', value: '.ts',   folder: 'Code' },
  { id: '19', type: 'extension', value: '.py',   folder: 'Code' },
  { id: '20', type: 'extension', value: '.rs',   folder: 'Code' },
  { id: '21', type: 'extension', value: '.html', folder: 'Code' },
  { id: '22', type: 'extension', value: '.css',  folder: 'Code' },
  { id: '23', type: 'extension', value: '.json', folder: 'Code' },
  { id: '24', type: 'extension', value: '.env',  folder: 'Code' },
  { id: '25', type: 'extension', value: '.mp4',  folder: 'Videos' },
  { id: '26', type: 'extension', value: '.mov',  folder: 'Videos' },
  { id: '27', type: 'extension', value: '.avi',  folder: 'Videos' },
  { id: '28', type: 'extension', value: '.mkv',  folder: 'Videos' },
];

const _settings = {
  desktop_path: null,
  skip_lnk: true,
  skip_hidden: true,
  undo_log: true,
  theme: 'system',
  auto_schedule: false,
  schedule_frequency: 'daily',
  last_organized: '2026-06-20T14:32:00Z',
};

const _history = [
  {
    id: 'mock-session-1',
    timestamp: '2026-06-20T14:32:00Z',
    moves: [
      { from: 'C:/Users/Yi/Desktop/photo.jpg',      to: 'C:/Users/Yi/Desktop/DeskSort/Images/photo.jpg' },
      { from: 'C:/Users/Yi/Desktop/report.pdf',     to: 'C:/Users/Yi/Desktop/DeskSort/Documents/report.pdf' },
      { from: 'C:/Users/Yi/Desktop/archive.zip',    to: 'C:/Users/Yi/Desktop/DeskSort/Archives/archive.zip' },
      { from: 'C:/Users/Yi/Desktop/script.py',      to: 'C:/Users/Yi/Desktop/DeskSort/Code/script.py' },
    ],
  },
  {
    id: 'mock-session-2',
    timestamp: '2026-06-18T09:10:00Z',
    moves: [
      { from: 'C:/Users/Yi/Desktop/demo.mp4',       to: 'C:/Users/Yi/Desktop/DeskSort/Videos/demo.mp4' },
      { from: 'C:/Users/Yi/Desktop/notes.txt',      to: 'C:/Users/Yi/Desktop/DeskSort/Documents/notes.txt' },
    ],
  },
];

let _customRules = [..._rules];
let _settingsState = { ..._settings };
let _historyState  = [..._history];

const COMMANDS = {
  get_dashboard: () => ({
    file_count: 12,
    clutter_score: 48,
    last_organized: _settingsState.last_organized,
    auto_schedule: _settingsState.auto_schedule,
    schedule_frequency: _settingsState.schedule_frequency,
    category_counts: { images: 4, documents: 3, archives: 1, code: 2, videos: 1, other: 1 },
    desktop_path: 'C:/Users/Yi/Desktop',
    os: 'Windows (preview)',
  }),

  get_desktop_files: () => [
    { name: 'photo.jpg',      path: 'C:/Users/Yi/Desktop/photo.jpg',      extension: '.jpg',  size_bytes: 204800 },
    { name: 'report.pdf',     path: 'C:/Users/Yi/Desktop/report.pdf',     extension: '.pdf',  size_bytes: 512000 },
    { name: 'archive.zip',    path: 'C:/Users/Yi/Desktop/archive.zip',    extension: '.zip',  size_bytes: 1048576 },
    { name: 'script.py',      path: 'C:/Users/Yi/Desktop/script.py',      extension: '.py',   size_bytes: 2048 },
    { name: 'notes.txt',      path: 'C:/Users/Yi/Desktop/notes.txt',      extension: '.txt',  size_bytes: 1024 },
    { name: 'demo.mp4',       path: 'C:/Users/Yi/Desktop/demo.mp4',       extension: '.mp4',  size_bytes: 52428800 },
    { name: 'random.xyz',     path: 'C:/Users/Yi/Desktop/random.xyz',     extension: '.xyz',  size_bytes: 4096 },
  ],

  get_clutter_score: () => 48,

  preview_organize: () => [
    { from: 'C:/Users/Yi/Desktop/photo.jpg',   to: 'C:/Users/Yi/Desktop/DeskSort/Images/photo.jpg',        folder: 'Images',    filename: 'photo.jpg' },
    { from: 'C:/Users/Yi/Desktop/report.pdf',  to: 'C:/Users/Yi/Desktop/DeskSort/Documents/report.pdf',    folder: 'Documents', filename: 'report.pdf' },
    { from: 'C:/Users/Yi/Desktop/archive.zip', to: 'C:/Users/Yi/Desktop/DeskSort/Archives/archive.zip',    folder: 'Archives',  filename: 'archive.zip' },
    { from: 'C:/Users/Yi/Desktop/script.py',   to: 'C:/Users/Yi/Desktop/DeskSort/Code/script.py',          folder: 'Code',      filename: 'script.py' },
    { from: 'C:/Users/Yi/Desktop/notes.txt',   to: 'C:/Users/Yi/Desktop/DeskSort/Documents/notes.txt',     folder: 'Documents', filename: 'notes.txt' },
    { from: 'C:/Users/Yi/Desktop/demo.mp4',    to: 'C:/Users/Yi/Desktop/DeskSort/Videos/demo.mp4',         folder: 'Videos',    filename: 'demo.mp4' },
    { from: 'C:/Users/Yi/Desktop/random.xyz',  to: 'C:/Users/Yi/Desktop/DeskSort/Other/random.xyz',        folder: 'Other',     filename: 'random.xyz' },
  ],

  run_organize: () => {
    _settingsState.last_organized = new Date().toISOString();
    const session = {
      id: 'mock-' + Date.now(),
      timestamp: new Date().toISOString(),
      moves: COMMANDS.preview_organize(),
    };
    _historyState.unshift(session);
    return session;
  },

  undo_session: ({ sessionId }) => {
    _historyState = _historyState.filter(s => s.id !== sessionId);
  },

  get_history: () => _historyState,

  get_rules: () => _customRules,

  save_rules: ({ rules }) => { _customRules = rules; },

  get_settings_cmd: () => ({ ..._settingsState }),

  save_settings_cmd: ({ settings }) => { _settingsState = { ...settings }; },
};

export function mockInvoke(cmd, args = {}) {
  if (!(cmd in COMMANDS)) {
    return Promise.reject(`[mock] Unknown command: ${cmd}`);
  }
  return Promise.resolve(COMMANDS[cmd](args));
}
