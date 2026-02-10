use tauri::{
    tray::{MouseButton, MouseButtonState, TrayIconEvent},
    ActivationPolicy, Manager,
};
use tauri_plugin_nspopover::{AppExt, ToPopoverOptions, WindowExt};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_nspopover::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(ActivationPolicy::Accessory);

            let window = app.handle().get_webview_window("main").unwrap();
            window.to_popover(ToPopoverOptions {
                is_fullsize_content: true,
            });

            let tray = app.tray_by_id("main").unwrap();
            let handle = app.handle().clone();

            tray.on_tray_icon_event(move |_, event| match event {
                TrayIconEvent::Click {
                    button,
                    button_state,
                    ..
                } => {
                    if button == MouseButton::Left && button_state == MouseButtonState::Up {
                        if !handle.is_popover_shown() {
                            handle.show_popover();
                        } else {
                            handle.hide_popover();
                        }
                    }
                }
                _ => {}
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
