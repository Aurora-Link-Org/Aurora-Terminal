#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::sync::Mutex;
use tauri::Manager;

mod commands;
mod plugin_engine;
mod serial;
mod tcp;
mod ssh;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 初始化插件引擎 (Lua + Wasm) 并挂载到全局状态
            let engine = plugin_engine::PluginEngine::new(app.handle());
            app.manage(engine);
            Ok(())
        })
        .manage(serial::SerialState {
            ports: Mutex::new(HashMap::new()),
        })
        .manage(tcp::TcpState::new())
        .manage(ssh::SshState::new())
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::scan_plugins,
            commands::read_plugin_asset,
            commands::open_plugin_dir,
            commands::install_plugin_from_url,
            commands::delete_plugin,
            commands::get_ports,
            commands::open_port,
            commands::close_port,
            commands::send_data,
            commands::plugin_connect,
            commands::plugin_disconnect,
            commands::plugin_send
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
