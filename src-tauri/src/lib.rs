mod commands;

use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::window_controls::minimize_window,
            commands::window_controls::maximize_window,
            commands::window_controls::unmaximize_window,
            commands::window_controls::close_window,
            commands::window_controls::is_window_maximized,
            commands::window_controls::is_window_focused,
            commands::window_controls::get_current_window_state,
            commands::window_controls::show_window,
            commands::app_info::get_path,
            commands::app_info::get_app_architecture,
            commands::app_info::get_app_path,
            commands::app_info::should_use_dark_colors,
            commands::shell_open::open_external,
            commands::shell_open::show_item_in_folder,
            commands::dialogs::show_open_dialog,
            commands::dialogs::show_save_dialog,
        ])
        .setup(|app| {
            let window = app
                .get_webview_window("main")
                .expect("main window not found");

            // Open devtools automatically in dev builds so JS errors are visible
            #[cfg(debug_assertions)]
            window.open_devtools();

            let win_clone = window.clone();

            // Forward window state changes to the renderer.
            // Mirrors registerWindowStateChangedEvents() in window-state.ts.
            window.on_window_event(move |event| {
                match event {
                    tauri::WindowEvent::Focused(true) => {
                        let _ = win_clone.emit("focus", ());
                    }
                    tauri::WindowEvent::Focused(false) => {
                        let _ = win_clone.emit("blur", ());
                    }
                    tauri::WindowEvent::Resized(..) => {
                        // Emit window-state-changed on resize; the renderer
                        // will call get_current_window_state to get the real state.
                        let _ = win_clone.emit("window-state-changed", "normal");
                    }
                    _ => {}
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
