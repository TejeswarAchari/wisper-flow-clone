#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let window = app.get_webview_window("main").unwrap();
      
      #[cfg(target_os = "linux")]
      {
        use webkit2gtk::{WebViewExt, SettingsExt, PermissionRequestExt};
        
        window.with_webview(|webview| {
          let wv = webview.inner().clone();
          
          let settings = wv.settings().unwrap();
          settings.set_enable_media_stream(true);
          settings.set_enable_mediasource(true);
          settings.set_enable_webgl(true);
          settings.set_javascript_can_access_clipboard(true);
          
          wv.connect_permission_request(|_webview, request| {
            request.allow();
            true
          });
        }).unwrap();
      }
      
      #[cfg(debug_assertions)]
      {
        window.open_devtools();
      }
      
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
