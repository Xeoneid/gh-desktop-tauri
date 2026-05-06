use tauri::{command, AppHandle};
use tauri_plugin_shell::ShellExt;

#[command]
pub async fn open_external(app: AppHandle, path: String) -> Result<bool, String> {
    app.shell()
        .open(&path, None)
        .map(|_| true)
        .map_err(|e| e.to_string())
}

#[command]
pub async fn show_item_in_folder(app: AppHandle, path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        app.shell()
            .command("explorer")
            .args(["/select,", &path])
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
    #[cfg(not(target_os = "windows"))]
    {
        app.shell()
            .open(&path, None)
            .map_err(|e| e.to_string())
    }
}
