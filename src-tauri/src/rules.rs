use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Rule {
    pub id: String,
    #[serde(rename = "type")]
    pub rule_type: String, // "extension" | "keyword"
    pub value: String,
    pub folder: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RulesConfig {
    pub rules: Vec<Rule>,
}

impl RulesConfig {
    pub fn default_rules() -> Self {
        let rules = vec![
            Rule { id: "1".into(), rule_type: "extension".into(), value: ".jpg".into(),  folder: "Images".into() },
            Rule { id: "2".into(), rule_type: "extension".into(), value: ".jpeg".into(), folder: "Images".into() },
            Rule { id: "3".into(), rule_type: "extension".into(), value: ".png".into(),  folder: "Images".into() },
            Rule { id: "4".into(), rule_type: "extension".into(), value: ".gif".into(),  folder: "Images".into() },
            Rule { id: "5".into(), rule_type: "extension".into(), value: ".webp".into(), folder: "Images".into() },
            Rule { id: "6".into(), rule_type: "extension".into(), value: ".pdf".into(),  folder: "Documents".into() },
            Rule { id: "7".into(), rule_type: "extension".into(), value: ".docx".into(), folder: "Documents".into() },
            Rule { id: "8".into(), rule_type: "extension".into(), value: ".doc".into(),  folder: "Documents".into() },
            Rule { id: "9".into(), rule_type: "extension".into(), value: ".xlsx".into(), folder: "Documents".into() },
            Rule { id: "10".into(), rule_type: "extension".into(), value: ".xls".into(), folder: "Documents".into() },
            Rule { id: "11".into(), rule_type: "extension".into(), value: ".txt".into(), folder: "Documents".into() },
            Rule { id: "12".into(), rule_type: "extension".into(), value: ".zip".into(), folder: "Archives".into() },
            Rule { id: "13".into(), rule_type: "extension".into(), value: ".rar".into(), folder: "Archives".into() },
            Rule { id: "14".into(), rule_type: "extension".into(), value: ".7z".into(),  folder: "Archives".into() },
            Rule { id: "15".into(), rule_type: "extension".into(), value: ".tar".into(), folder: "Archives".into() },
            Rule { id: "16".into(), rule_type: "extension".into(), value: ".gz".into(),  folder: "Archives".into() },
            Rule { id: "17".into(), rule_type: "extension".into(), value: ".js".into(),  folder: "Code".into() },
            Rule { id: "18".into(), rule_type: "extension".into(), value: ".ts".into(),  folder: "Code".into() },
            Rule { id: "19".into(), rule_type: "extension".into(), value: ".py".into(),  folder: "Code".into() },
            Rule { id: "20".into(), rule_type: "extension".into(), value: ".rs".into(),  folder: "Code".into() },
            Rule { id: "21".into(), rule_type: "extension".into(), value: ".html".into(), folder: "Code".into() },
            Rule { id: "22".into(), rule_type: "extension".into(), value: ".css".into(), folder: "Code".into() },
            Rule { id: "23".into(), rule_type: "extension".into(), value: ".json".into(), folder: "Code".into() },
            Rule { id: "24".into(), rule_type: "extension".into(), value: ".env".into(), folder: "Code".into() },
            Rule { id: "25".into(), rule_type: "extension".into(), value: ".mp4".into(), folder: "Videos".into() },
            Rule { id: "26".into(), rule_type: "extension".into(), value: ".mov".into(), folder: "Videos".into() },
            Rule { id: "27".into(), rule_type: "extension".into(), value: ".avi".into(), folder: "Videos".into() },
            Rule { id: "28".into(), rule_type: "extension".into(), value: ".mkv".into(), folder: "Videos".into() },
        ];
        RulesConfig { rules }
    }
}

pub fn rules_path(app_data: &PathBuf) -> PathBuf {
    app_data.join("rules.json")
}

pub fn load_rules(app_data: &PathBuf) -> RulesConfig {
    let path = rules_path(app_data);
    if path.exists() {
        let content = std::fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_else(|_| RulesConfig::default_rules())
    } else {
        let defaults = RulesConfig::default_rules();
        let _ = save_rules_to_path(&path, &defaults);
        defaults
    }
}

pub fn save_rules_to_path(path: &PathBuf, config: &RulesConfig) -> Result<(), String> {
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    std::fs::write(path, content).map_err(|e| e.to_string())
}

/// Returns first matching folder name for a file, or None.
pub fn match_rule(rules: &[Rule], filename: &str) -> Option<String> {
    let lower = filename.to_lowercase();
    for rule in rules {
        match rule.rule_type.as_str() {
            "extension" => {
                if lower.ends_with(&rule.value.to_lowercase()) {
                    return Some(rule.folder.clone());
                }
            }
            "keyword" => {
                if lower.contains(&rule.value.to_lowercase()) {
                    return Some(rule.folder.clone());
                }
            }
            _ => {}
        }
    }
    None
}
