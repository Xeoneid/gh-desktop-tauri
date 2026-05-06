use tauri::command;

/// Maps Electron's app.getPath() path types to OS paths.
/// Mirrors the get-path IPC handler in main.ts.
#[command]
pub async fn get_path(path: String) -> Result<String, String> {
    let dir = match path.as_str() {
        "home" => dirs::home_dir(),
        "appData" => dirs::data_dir(),
        "userData" => dirs::data_local_dir(),
        "temp" => Some(std::env::temp_dir()),
        "documents" => dirs::document_dir(),
        "downloads" => dirs::download_dir(),
        "desktop" => dirs::desktop_dir(),
        "logs" => dirs::data_local_dir()
            .map(|p| p.join("GitHub Desktop").join("logs")),
        _ => None,
    };
    dir.map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| format!("Unknown path type: {path}"))
}

/// Returns architecture string matching the Architecture type:
/// 'x64' | 'arm64' | 'x64-emulated'
#[command]
pub async fn get_app_architecture() -> String {
    if cfg!(target_arch = "aarch64") {
        "arm64".into()
    } else {
        "x64".into()
    }
}

/// Returns the directory containing the application binary.
#[command]
pub async fn get_app_path() -> Result<String, String> {
    std::env::current_exe()
        .map(|p| {
            p.parent()
                .map(|d| d.to_string_lossy().into_owned())
                .unwrap_or_default()
        })
        .map_err(|e| e.to_string())
}

/// POC stub — returns false (light mode). Full implementation would
/// query the OS dark mode preference via platform APIs.
#[command]
pub async fn should_use_dark_colors() -> bool {
    false
}
