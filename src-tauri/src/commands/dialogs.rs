use tauri::{command, AppHandle};
use tauri_plugin_dialog::DialogExt;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct OpenDialogOptions {
    pub title: Option<String>,
    pub default_path: Option<String>,
    pub properties: Option<Vec<String>>,
}

#[derive(Deserialize)]
pub struct SaveDialogOptions {
    pub title: Option<String>,
    pub default_name: Option<String>,
}

#[command]
pub async fn show_open_dialog(
    app: AppHandle,
    options: OpenDialogOptions,
) -> Result<Option<String>, String> {
    let is_dir = options
        .properties
        .as_deref()
        .unwrap_or(&[])
        .contains(&"openDirectory".to_string());

    let mut b = app.dialog().file();
    if let Some(t) = options.title {
        b = b.set_title(t);
    }

    Ok(if is_dir {
        b.blocking_pick_folder()
            .and_then(|fp| fp.into_path().ok())
            .map(|p| p.to_string_lossy().to_string())
    } else {
        b.blocking_pick_file()
            .and_then(|fp| fp.into_path().ok())
            .map(|p| p.to_string_lossy().to_string())
    })
}

#[command]
pub async fn show_save_dialog(
    app: AppHandle,
    options: SaveDialogOptions,
) -> Result<Option<String>, String> {
    let mut b = app.dialog().file();
    if let Some(t) = options.title {
        b = b.set_title(t);
    }
    if let Some(n) = options.default_name {
        b = b.set_file_name(n);
    }

    Ok(b.blocking_save_file()
        .and_then(|fp| fp.into_path().ok())
        .map(|p| p.to_string_lossy().to_string()))
}
