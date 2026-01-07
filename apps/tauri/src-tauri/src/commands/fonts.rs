//! Font commands
//!
//! Handles system font enumeration

use serde::{Deserialize, Serialize};
use std::collections::HashSet;

/// System font information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemFont {
    pub name: String,
    pub category: String,
}

/// Response for getting system fonts
#[derive(Debug, Serialize)]
pub struct GetSystemFontsResponse {
    pub success: bool,
    pub fonts: Vec<SystemFont>,
}

// Well-known monospace fonts
const MONOSPACE_FONTS: &[&str] = &[
    "Cascadia Code", "Cascadia Mono", "Consolas", "Courier", "Courier New",
    "DejaVu Sans Mono", "Droid Sans Mono", "Fira Code", "Fira Mono", "Hack",
    "IBM Plex Mono", "Inconsolata", "JetBrains Mono", "Menlo", "Monaco",
    "Noto Mono", "Noto Sans Mono", "PT Mono", "Roboto Mono", "SF Mono",
    "Source Code Pro", "Ubuntu Mono", "Victor Mono", "Maple Mono",
];

// Well-known serif fonts
const SERIF_FONTS: &[&str] = &[
    "Baskerville", "Book Antiqua", "Cambria", "Century", "Charter",
    "Crimson Text", "DejaVu Serif", "Didot", "EB Garamond", "Georgia",
    "Hoefler Text", "IBM Plex Serif", "Iowan Old Style", "Linux Libertine",
    "Lora", "Merriweather", "Noto Serif", "PT Serif", "Palatino",
    "Palatino Linotype", "Playfair Display", "Source Serif Pro", "Times",
    "Times New Roman",
];

// Well-known sans-serif fonts
const SANS_SERIF_FONTS: &[&str] = &[
    "Arial", "Avenir", "Avenir Next", "Calibri", "DejaVu Sans", "Fira Sans",
    "Franklin Gothic", "Gill Sans", "Helvetica", "Helvetica Neue",
    "IBM Plex Sans", "Inter", "Lato", "Lucida Grande", "Lucida Sans",
    "Montserrat", "Noto Sans", "Nunito", "Open Sans", "Optima", "Oswald",
    "PT Sans", "Poppins", "Raleway", "Roboto", "San Francisco", "Segoe UI",
    "SF Pro", "SF Pro Display", "SF Pro Text", "Source Sans Pro", "Tahoma",
    "Trebuchet MS", "Ubuntu", "Verdana",
];

/// Format a CamelCase or concatenated font name into proper display name
/// e.g., "MapleMono" -> "Maple Mono", "JetBrainsMono" -> "JetBrains Mono"
fn format_font_name(name: &str) -> String {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    
    // Handle already spaced names
    if trimmed.contains(' ') {
        return trimmed.to_string();
    }
    
    // Handle hyphenated names (keep only base name for display)
    let base_name = trimmed.split('-').next().unwrap_or(trimmed);
    
    // Insert spaces before uppercase letters (CamelCase splitting)
    let mut result = String::with_capacity(base_name.len() + 10);
    let chars: Vec<char> = base_name.chars().collect();
    
    for (i, &c) in chars.iter().enumerate() {
        if i > 0 && c.is_uppercase() {
            // Check if previous char is lowercase (camelCase boundary)
            // or if this starts a new word after a sequence of uppercase
            let prev = chars[i - 1];
            let next = chars.get(i + 1);
            
            if prev.is_lowercase() {
                // fooBar -> foo Bar
                result.push(' ');
            } else if prev.is_uppercase() && next.map_or(false, |n| n.is_lowercase()) {
                // XMLParser -> XML Parser (space before P)
                result.push(' ');
            }
        }
        result.push(c);
    }
    
    result
}

fn classify_font(name: &str) -> &'static str {
    let normalized = name.trim();
    
    // Check known font sets (with formatted name matching)
    let formatted = format_font_name(normalized);
    
    if MONOSPACE_FONTS.iter().any(|f| f.eq_ignore_ascii_case(&formatted) || f.eq_ignore_ascii_case(normalized)) {
        return "monospace";
    }
    if SERIF_FONTS.iter().any(|f| f.eq_ignore_ascii_case(&formatted) || f.eq_ignore_ascii_case(normalized)) {
        return "serif";
    }
    if SANS_SERIF_FONTS.iter().any(|f| f.eq_ignore_ascii_case(&formatted) || f.eq_ignore_ascii_case(normalized)) {
        return "sans-serif";
    }
    
    // Use naming heuristics
    let lower = normalized.to_lowercase();
    if lower.contains("mono") || lower.contains("code") || lower.contains("console") || lower.contains("courier") {
        return "monospace";
    }
    if lower.contains("serif") && !lower.contains("sans") {
        return "serif";
    }
    if lower.contains("sans") || lower.contains("gothic") || lower.contains("grotesk") {
        return "sans-serif";
    }
    
    "other"
}

/// Get system fonts by scanning font directories (fast method)
#[tauri::command]
pub async fn get_system_fonts() -> GetSystemFontsResponse {
    let mut fonts = Vec::new();
    let mut seen = HashSet::new();
    
    #[cfg(target_os = "macos")]
    {
        // Scan font directories directly (much faster than system_profiler)
        let home_fonts = dirs::home_dir()
            .map(|h| h.join("Library/Fonts").to_string_lossy().to_string())
            .unwrap_or_default();
        
        let font_dirs = vec![
            "/System/Library/Fonts".to_string(),
            "/System/Library/Fonts/Supplemental".to_string(),
            "/Library/Fonts".to_string(),
            home_fonts,
        ];
        
        for dir in font_dirs.iter().filter(|d| !d.is_empty()) {
            scan_font_directory(dir, &mut fonts, &mut seen);
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        let font_dir = std::env::var("WINDIR")
            .map(|w| format!("{}\\Fonts", w))
            .unwrap_or_else(|_| "C:\\Windows\\Fonts".to_string());
        
        scan_font_directory(&font_dir, &mut fonts, &mut seen);
    }
    
    #[cfg(target_os = "linux")]
    {
        // On Linux, use fc-list command (still fast)
        use std::process::Command;
        
        if let Ok(output) = Command::new("fc-list")
            .args([":", "family"])
            .output()
        {
            if let Ok(list) = String::from_utf8(output.stdout) {
                for line in list.lines() {
                    let raw_name = line.split(',').next().unwrap_or("").trim();
                    if !raw_name.is_empty() {
                        let name = format_font_name(raw_name);
                        if seen.insert(name.clone()) {
                            let category = classify_font(&name).to_string();
                            fonts.push(SystemFont { name, category });
                        }
                    }
                }
            }
        }
    }
    
    // Sort fonts: monospace first, then sans-serif, serif, others
    fonts.sort_by(|a, b| {
        let cat_order = |cat: &str| -> u8 {
            match cat {
                "monospace" => 0,
                "sans-serif" => 1,
                "serif" => 2,
                _ => 3,
            }
        };
        let cat_cmp = cat_order(&a.category).cmp(&cat_order(&b.category));
        if cat_cmp != std::cmp::Ordering::Equal {
            cat_cmp
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });
    
    GetSystemFontsResponse {
        success: true,
        fonts,
    }
}

/// Scan a directory for font files and extract font family names
fn scan_font_directory(dir: &str, fonts: &mut Vec<SystemFont>, seen: &mut HashSet<String>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    
    for entry in entries.flatten() {
        let path = entry.path();
        
        // Handle subdirectories (e.g., font family folders)
        if path.is_dir() {
            // Don't recurse too deep, just one level
            if let Ok(sub_entries) = std::fs::read_dir(&path) {
                for sub_entry in sub_entries.flatten() {
                    process_font_file(&sub_entry.path(), fonts, seen);
                }
            }
            continue;
        }
        
        process_font_file(&path, fonts, seen);
    }
}

/// Process a single font file and extract the family name
fn process_font_file(path: &std::path::Path, fonts: &mut Vec<SystemFont>, seen: &mut HashSet<String>) {
    let Some(ext) = path.extension() else {
        return;
    };
    
    let ext_lower = ext.to_string_lossy().to_lowercase();
    if ext_lower != "ttf" && ext_lower != "otf" && ext_lower != "ttc" {
        return;
    }
    
    let Some(stem) = path.file_stem() else {
        return;
    };
    
    let raw_name = stem.to_string_lossy();
    
    // Skip font variants (Bold, Italic, Light, etc.)
    let lower = raw_name.to_lowercase();
    if lower.contains("bold") || lower.contains("italic") || lower.contains("light") 
        || lower.contains("medium") || lower.contains("thin") || lower.contains("black")
        || lower.contains("semibold") || lower.contains("extrabold") || lower.contains("extralight")
        || lower.contains("regular") || lower.contains("oblique") {
        // Try to extract base name
        let base = extract_base_font_name(&raw_name);
        if !base.is_empty() {
            let name = format_font_name(&base);
            if !name.is_empty() && seen.insert(name.clone()) {
                let category = classify_font(&name).to_string();
                fonts.push(SystemFont { name, category });
            }
        }
        return;
    }
    
    // Format the font name properly
    let name = format_font_name(&raw_name);
    
    if !name.is_empty() && seen.insert(name.clone()) {
        let category = classify_font(&name).to_string();
        fonts.push(SystemFont { name, category });
    }
}

/// Extract base font name by removing style suffixes
fn extract_base_font_name(name: &str) -> String {
    // Common patterns: "FontName-Bold", "FontName Bold", "FontNameBold"
    let result = name
        .split('-').next().unwrap_or(name)
        .split('_').next().unwrap_or(name);
    
    // Remove trailing style words
    let styles = ["Bold", "Italic", "Light", "Medium", "Thin", "Black", 
                  "SemiBold", "ExtraBold", "ExtraLight", "Regular", "Oblique",
                  "Condensed", "Expanded", "Narrow", "Wide"];
    
    let mut cleaned = result.to_string();
    for style in styles {
        if cleaned.ends_with(style) {
            cleaned = cleaned[..cleaned.len() - style.len()].to_string();
        }
    }
    
    cleaned.trim().to_string()
}
