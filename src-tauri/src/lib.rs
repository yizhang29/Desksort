mod history;
mod organizer;
mod rules;

use history::{append_session, load_history, remove_session, Session};
use organizer::{clutter_score, execute_moves, get_desktop_path, plan_moves, scan_desktop, DesktopFile, PlannedMove};
use rules::{load_rules, match_rule, save_rules_to_path, rules_path, Rule, RulesConfig};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

// ---------- helpers ----------

fn app_data_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path().app_data_dir().expect("no app data dir")
}

fn get_settings(app_data: &PathBuf) -> Settings {
    let path = app_data.join("settings.json");
    if path.exists() {
        let content = std::fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        Settings::default()
    }
}

// ---------- types ----------

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Settings {
    pub desktop_path: Option<String>,
    pub skip_lnk: bool,
    pub skip_hidden: bool,
    pub undo_log: bool,
    pub theme: String,              // "system" | "light" | "dark"
    pub auto_schedule: bool,
    pub schedule_frequency: String, // "daily" | "weekly" | "login"
    pub last_organized: Option<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            desktop_path: None,
            skip_lnk: true,
            skip_hidden: true,
            undo_log: true,
            theme: "system".into(),
            auto_schedule: false,
            schedule_frequency: "daily".into(),
            last_organized: None,
        }
    }
}

#[derive(Serialize, Debug)]
pub struct DashboardData {
    pub file_count: usize,
    pub clutter_score: u32,
    pub last_organized: Option<String>,
    pub auto_schedule: bool,
    pub schedule_frequency: String,
    pub category_counts: CategoryCounts,
    pub desktop_path: String,
    pub os: String,
}

#[derive(Serialize, Debug, Default)]
pub struct CategoryCounts {
    pub images: usize,
    pub documents: usize,
    pub archives: usize,
    pub code: usize,
    pub videos: usize,
    pub other: usize,
}

// ---------- Tauri commands ----------

#[tauri::command]
fn get_desktop_files(app: tauri::AppHandle) -> Vec<DesktopFile> {
    let app_data = app_data_dir(&app);
    let settings = get_settings(&app_data);
    let desktop = settings
        .desktop_path
        .as_deref()
        .map(PathBuf::from)
        .or_else(get_desktop_path)
        .unwrap_or_default();
    scan_desktop(&desktop, settings.skip_lnk, settings.skip_hidden)
}

#[tauri::command]
fn get_dashboard(app: tauri::AppHandle) -> DashboardData {
    let app_data = app_data_dir(&app);
    let settings = get_settings(&app_data);
    let desktop = settings
        .desktop_path
        .as_deref()
        .map(PathBuf::from)
        .or_else(get_desktop_path)
        .unwrap_or_default();

    let files = scan_desktop(&desktop, settings.skip_lnk, settings.skip_hidden);
    let config = load_rules(&app_data);
    let score = clutter_score(files.len());

    let mut counts = CategoryCounts::default();
    for f in &files {
        let folder = match_rule(&config.rules, &f.name)
            .unwrap_or_else(|| "Other".to_string());
        match folder.as_str() {
            "Images"    => counts.images    += 1,
            "Documents" => counts.documents += 1,
            "Archives"  => counts.archives  += 1,
            "Code"      => counts.code      += 1,
            "Videos"    => counts.videos    += 1,
            _           => counts.other     += 1,
        }
    }

    let os = if cfg!(target_os = "windows") { "Windows".into() }
             else if cfg!(target_os = "macos") { "macOS".into() }
             else { "Linux".into() };

    DashboardData {
        file_count: files.len(),
        clutter_score: score,
        last_organized: settings.last_organized,
        auto_schedule: settings.auto_schedule,
        schedule_frequency: settings.schedule_frequency,
        category_counts: counts,
        desktop_path: desktop.to_string_lossy().to_string(),
        os,
    }
}

#[tauri::command]
fn get_clutter_score(app: tauri::AppHandle) -> u32 {
    let app_data = app_data_dir(&app);
    let settings = get_settings(&app_data);
    let desktop = settings
        .desktop_path
        .as_deref()
        .map(PathBuf::from)
        .or_else(get_desktop_path)
        .unwrap_or_default();
    let files = scan_desktop(&desktop, settings.skip_lnk, settings.skip_hidden);
    clutter_score(files.len())
}

#[tauri::command]
fn preview_organize(app: tauri::AppHandle) -> Vec<PlannedMove> {
    let app_data = app_data_dir(&app);
    let settings = get_settings(&app_data);
    let desktop = settings
        .desktop_path
        .as_deref()
        .map(PathBuf::from)
        .or_else(get_desktop_path)
        .unwrap_or_default();
    let files = scan_desktop(&desktop, settings.skip_lnk, settings.skip_hidden);
    let config = load_rules(&app_data);
    plan_moves(&files, &config.rules, &desktop)
}

#[tauri::command]
fn run_organize(app: tauri::AppHandle) -> Result<Session, String> {
    let app_data = app_data_dir(&app);
    let settings = get_settings(&app_data);
    let desktop = settings
        .desktop_path
        .as_deref()
        .map(PathBuf::from)
        .or_else(get_desktop_path)
        .unwrap_or_default();
    let files = scan_desktop(&desktop, settings.skip_lnk, settings.skip_hidden);
    let config = load_rules(&app_data);
    let planned = plan_moves(&files, &config.rules, &desktop);

    if planned.is_empty() {
        return Ok(Session {
            id: uuid::Uuid::new_v4().to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            moves: vec![],
        });
    }

    let session = execute_moves(&planned);

    // Update last_organized in settings
    let mut s = get_settings(&app_data);
    s.last_organized = Some(chrono::Utc::now().to_rfc3339());
    let _ = std::fs::write(
        app_data.join("settings.json"),
        serde_json::to_string_pretty(&s).unwrap_or_default(),
    );

    if settings.undo_log {
        append_session(&app_data, session.clone())?;
    }

    Ok(session)
}

#[tauri::command]
fn undo_session(app: tauri::AppHandle, session_id: String) -> Result<(), String> {
    let app_data = app_data_dir(&app);
    let log = load_history(&app_data);
    let session = log
        .sessions
        .iter()
        .find(|s| s.id == session_id)
        .ok_or_else(|| "Session not found".to_string())?
        .clone();

    for m in &session.moves {
        let from = std::path::Path::new(&m.from);
        let to = std::path::Path::new(&m.to);
        if to.exists() {
            if let Some(parent) = from.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            std::fs::rename(to, from)
                .map_err(|e| format!("Failed to restore {}: {}", m.to, e))?;
        }
    }

    remove_session(&app_data, &session_id)?;
    Ok(())
}

#[tauri::command]
fn get_history(app: tauri::AppHandle) -> Vec<Session> {
    let app_data = app_data_dir(&app);
    load_history(&app_data).sessions
}

#[tauri::command]
fn get_rules(app: tauri::AppHandle) -> Vec<Rule> {
    let app_data = app_data_dir(&app);
    load_rules(&app_data).rules
}

#[tauri::command]
fn save_rules(app: tauri::AppHandle, rules: Vec<Rule>) -> Result<(), String> {
    let app_data = app_data_dir(&app);
    let path = rules_path(&app_data);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    save_rules_to_path(&path, &RulesConfig { rules })
}

#[tauri::command]
fn get_settings_cmd(app: tauri::AppHandle) -> Settings {
    let app_data = app_data_dir(&app);
    get_settings(&app_data)
}

#[tauri::command]
fn save_settings_cmd(app: tauri::AppHandle, settings: Settings) -> Result<(), String> {
    let app_data = app_data_dir(&app);
    std::fs::create_dir_all(&app_data).map_err(|e| e.to_string())?;
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    std::fs::write(app_data.join("settings.json"), content).map_err(|e| e.to_string())
}

// ---------- app entry ----------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Ensure app data dir exists
            let app_data = app.path().app_data_dir().expect("no app data dir");
            std::fs::create_dir_all(&app_data).ok();
            // Seed default rules if not present
            load_rules(&app_data);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_desktop_files,
            get_dashboard,
            get_clutter_score,
            preview_organize,
            run_organize,
            undo_session,
            get_history,
            get_rules,
            save_rules,
            get_settings_cmd,
            save_settings_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error running DeskSort");
}
