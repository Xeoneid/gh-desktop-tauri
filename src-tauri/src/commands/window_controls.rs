use tauri::{command, AppHandle, Manager, WebviewWindow};

fn get_main(app: &AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window("main")
        .ok_or_else(|| "main window not found".into())
}

#[command]
pub async fn minimize_window(app: AppHandle) -> Result<(), String> {
    get_main(&app)?.minimize().map_err(|e| e.to_string())
}

#[command]
pub async fn maximize_window(app: AppHandle) -> Result<(), String> {
    get_main(&app)?.maximize().map_err(|e| e.to_string())
}

#[command]
pub async fn unmaximize_window(app: AppHandle) -> Result<(), String> {
    get_main(&app)?.unmaximize().map_err(|e| e.to_string())
}

#[command]
pub async fn close_window(app: AppHandle) -> Result<(), String> {
    get_main(&app)?.close().map_err(|e| e.to_string())
}

#[command]
pub async fn is_window_maximized(app: AppHandle) -> Result<bool, String> {
    get_main(&app)?.is_maximized().map_err(|e| e.to_string())
}

#[command]
pub async fn is_window_focused(app: AppHandle) -> Result<bool, String> {
    get_main(&app)?.is_focused().map_err(|e| e.to_string())
}

/// Called by the renderer when it finishes initializing.
/// Mirrors the `renderer-ready` IPC channel that triggers AppWindow.show()
/// via the onDidLoad emitter in app-window.ts.
#[command]
pub async fn show_window(app: AppHandle) -> Result<(), String> {
    let w = get_main(&app)?;
    w.show().map_err(|e| e.to_string())?;
    w.set_focus().map_err(|e| e.to_string())
}

/// Returns window state matching the WindowState type:
/// 'minimized' | 'normal' | 'maximized' | 'full-screen' | 'hidden'
#[command]
pub async fn get_current_window_state(app: AppHandle) -> Result<String, String> {
    let w = get_main(&app)?;
    let state = if w.is_fullscreen().map_err(|e| e.to_string())? {
        "full-screen"
    } else if w.is_maximized().map_err(|e| e.to_string())? {
        "maximized"
    } else if w.is_minimized().map_err(|e| e.to_string())? {
        "minimized"
    } else if !w.is_visible().map_err(|e| e.to_string())? {
        "hidden"
    } else {
        "normal"
    };
    Ok(state.to_string())
}
