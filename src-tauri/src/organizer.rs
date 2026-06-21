use crate::rules::{match_rule, Rule};
use crate::history::{FileMove, Session};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DesktopFile {
    pub name: String,
    pub path: String,
    pub extension: String,
    pub size_bytes: u64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PlannedMove {
    pub from: String,
    pub to: String,
    pub folder: String,
    pub filename: String,
}

pub fn get_desktop_path() -> Option<PathBuf> {
    dirs::desktop_dir()
}

/// Returns all organizable files on the desktop (no folders, no .lnk, no hidden).
pub fn scan_desktop(desktop: &Path, skip_lnk: bool, skip_hidden: bool) -> Vec<DesktopFile> {
    let mut files = Vec::new();
    let entries = match std::fs::read_dir(desktop) {
        Ok(e) => e,
        Err(_) => return files,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            continue;
        }
        let name = match path.file_name().and_then(|n| n.to_str()) {
            Some(n) => n.to_string(),
            None => continue,
        };

        // Skip hidden files
        if skip_hidden && name.starts_with('.') {
            continue;
        }

        let ext = path.extension()
            .and_then(|e| e.to_str())
            .map(|e| format!(".{}", e.to_lowercase()))
            .unwrap_or_default();

        // Skip shortcuts
        if skip_lnk && ext == ".lnk" {
            continue;
        }

        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);

        files.push(DesktopFile {
            name,
            path: path.to_string_lossy().to_string(),
            extension: ext,
            size_bytes: size,
        });
    }
    files
}

/// Computes planned moves without executing them.
pub fn plan_moves(
    files: &[DesktopFile],
    rules: &[Rule],
    desktop: &Path,
) -> Vec<PlannedMove> {
    let desksort_root = desktop.join("DeskSort");
    let mut moves = Vec::new();

    for file in files {
        let folder = match_rule(rules, &file.name)
            .unwrap_or_else(|| "Other".to_string());

        let dest_dir = desksort_root.join(&folder);
        let dest_path = dest_dir.join(&file.name);

        moves.push(PlannedMove {
            from: file.path.clone(),
            to: dest_path.to_string_lossy().to_string(),
            folder,
            filename: file.name.clone(),
        });
    }
    moves
}

/// Executes file moves and returns a Session for the history log.
pub fn execute_moves(planned: &[PlannedMove]) -> Session {
    let session_id = uuid::Uuid::new_v4().to_string();
    let timestamp = chrono::Utc::now().to_rfc3339();
    let mut moves = Vec::new();

    for m in planned {
        let dest = PathBuf::from(&m.to);
        if let Some(parent) = dest.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        // Avoid overwriting — append a counter suffix if needed
        let final_dest = unique_dest(&dest);
        match std::fs::rename(&m.from, &final_dest) {
            Ok(_) => {
                moves.push(FileMove {
                    from: m.from.clone(),
                    to: final_dest.to_string_lossy().to_string(),
                });
            }
            Err(e) => {
                eprintln!("Failed to move {}: {}", m.from, e);
            }
        }
    }

    Session { id: session_id, timestamp, moves }
}

/// Returns a path that doesn't exist yet, appending (1), (2)… if needed.
fn unique_dest(dest: &Path) -> PathBuf {
    if !dest.exists() {
        return dest.to_path_buf();
    }
    let stem = dest.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
    let ext = dest.extension().and_then(|e| e.to_str()).map(|e| format!(".{}", e)).unwrap_or_default();
    let parent = dest.parent().unwrap_or(Path::new("."));
    let mut counter = 1u32;
    loop {
        let candidate = parent.join(format!("{} ({}){}", stem, counter, ext));
        if !candidate.exists() {
            return candidate;
        }
        counter += 1;
    }
}

/// Calculates clutter score 0-100 based on loose file count.
pub fn clutter_score(file_count: usize) -> u32 {
    // 0 files = 0, 50+ files = 100
    let score = (file_count as f64 / 50.0 * 100.0).min(100.0) as u32;
    score
}
