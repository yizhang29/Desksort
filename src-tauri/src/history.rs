use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FileMove {
    pub from: String,
    pub to: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Session {
    pub id: String,
    pub timestamp: String,
    pub moves: Vec<FileMove>,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct HistoryLog {
    pub sessions: Vec<Session>,
}

pub fn history_path(app_data: &PathBuf) -> PathBuf {
    app_data.join("history.json")
}

pub fn load_history(app_data: &PathBuf) -> HistoryLog {
    let path = history_path(app_data);
    if path.exists() {
        let content = std::fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        HistoryLog::default()
    }
}

pub fn append_session(app_data: &PathBuf, session: Session) -> Result<(), String> {
    let path = history_path(app_data);
    let mut log = load_history(app_data);
    log.sessions.insert(0, session); // newest first
    let content = serde_json::to_string_pretty(&log).map_err(|e| e.to_string())?;
    std::fs::write(path, content).map_err(|e| e.to_string())
}

pub fn remove_session(app_data: &PathBuf, session_id: &str) -> Result<(), String> {
    let path = history_path(app_data);
    let mut log = load_history(app_data);
    log.sessions.retain(|s| s.id != session_id);
    let content = serde_json::to_string_pretty(&log).map_err(|e| e.to_string())?;
    std::fs::write(path, content).map_err(|e| e.to_string())
}
