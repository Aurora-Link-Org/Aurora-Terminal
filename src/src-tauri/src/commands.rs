use tauri::{command, AppHandle, Manager, State};
use crate::serial::SerialState;
use crate::serial;

#[command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// --- Plugin System Commands ---

#[command]
pub fn scan_plugins(plugin_path: Option<String>, app: AppHandle) -> Result<Vec<serde_json::Value>, String> {
    let target_dir = if let Some(path) = plugin_path.filter(|p| !p.is_empty()) {
        std::path::PathBuf::from(path)
    } else {
        let mut d = app
            .path()
            .app_data_dir()
            .expect("Failed to get AppData directory");
        d.push("plugins");
        d
    };

    let mut plugins = Vec::new();

    if let Ok(entries) = std::fs::read_dir(&target_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let manifest_path = path.join("manifest.json");
                if manifest_path.exists() {
                    if let Ok(content) = std::fs::read_to_string(&manifest_path) {
                        if let Ok(mut json) = serde_json::from_str::<serde_json::Value>(&content) {
                            if let Some(obj) = json.as_object_mut() {
                                obj.insert(
                                    "__pluginPath".to_string(),
                                    serde_json::Value::String(path.to_string_lossy().to_string()),
                                );
                            }
                            plugins.push(json);
                        }
                    }
                }
            }
        }
    }
    
    Ok(plugins)
}

#[command]
pub fn read_plugin_asset(plugin_path: String, asset_path: String) -> Result<String, String> {
    let mut path = std::path::PathBuf::from(plugin_path);
    path.push(&asset_path);
    
    if path.exists() {
        std::fs::read_to_string(path).map_err(|e| e.to_string())
    } else {
        Err(format!("Asset not found: {}", asset_path))
    }
}

#[command]
pub fn open_plugin_dir(plugin_path: Option<String>, app: AppHandle) -> Result<(), String> {
    let target_dir = if let Some(path) = plugin_path.filter(|p| !p.is_empty()) {
        std::path::PathBuf::from(path)
    } else {
        let mut d = app
            .path()
            .app_data_dir()
            .expect("Failed to get AppData directory");
        d.push("plugins");
        d
    };

    if !target_dir.exists() {
        std::fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer")
        .arg(&target_dir)
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .arg(&target_dir)
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open")
        .arg(&target_dir)
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn install_plugin_from_url(
    url: String, 
    plugin_path: Option<String>, 
    metadata: Option<serde_json::Value>,
    app: AppHandle
) -> Result<String, String> {
    let target_dir = if let Some(path) = plugin_path.filter(|p| !p.is_empty()) {
        std::path::PathBuf::from(path)
    } else {
        let mut d = app
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?;
        d.push("plugins");
        d
    };

    if !target_dir.exists() {
        std::fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
    }

    // Determine plugin ID for folder name
    let plugin_id = metadata.as_ref()
        .and_then(|m| m.get("id"))
        .and_then(|id| id.as_str())
        .unwrap_or("unknown_plugin")
        .to_string();
    
    let plugin_folder = target_dir.join(&plugin_id);
    if !plugin_folder.exists() {
        std::fs::create_dir_all(&plugin_folder).map_err(|e| e.to_string())?;
    }

    // Download the file
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to download plugin: {}", e))?;
        
    if !response.status().is_success() {
        return Err(format!("Failed to download plugin: HTTP {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read downloaded bytes: {}", e))?;

    // Try to treat as ZIP first
    let is_zip = url.to_lowercase().ends_with(".zip") || bytes.starts_with(b"PK\x03\x04");
    
    if is_zip {
        let reader = std::io::Cursor::new(&bytes);
        let mut archive = zip::ZipArchive::new(reader)
            .map_err(|e| format!("Failed to read ZIP archive: {}", e))?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| format!("Failed to read file in ZIP: {}", e))?;
            let outpath = match file.enclosed_name() {
                Some(path) => plugin_folder.join(path),
                None => continue,
            };

            if (*file.name()).ends_with('/') {
                std::fs::create_dir_all(&outpath).map_err(|e| format!("Failed to create directory: {}", e))?;
            } else {
                if let Some(p) = outpath.parent() {
                    if !p.exists() {
                        std::fs::create_dir_all(&p).map_err(|e| format!("Failed to create directory: {}", e))?;
                    }
                }
                let mut outfile = std::fs::File::create(&outpath).map_err(|e| format!("Failed to create extracted file: {}", e))?;
                std::io::copy(&mut file, &mut outfile).map_err(|e| format!("Failed to write extracted file: {}", e))?;
            }
        }
    } else {
        // Single file download
        let filename = url.split('/').last().unwrap_or("plugin.data");
        let file_path = plugin_folder.join(filename);
        std::fs::write(&file_path, &bytes)
            .map_err(|e| format!("Failed to save plugin file: {}", e))?;
            
        // If we have metadata, generate a manifest.json
        if let Some(meta) = metadata {
            let mut manifest = meta.clone();
            
            if let Some(obj) = manifest.as_object_mut() {
                let plugin_type = obj.get("type").and_then(|t| t.as_str()).unwrap_or("tool").to_string();
                
                // If it's a localization file, add the contributes section if missing
                if (plugin_type == "localization" || plugin_id.contains("localization") || plugin_id.contains("language") || plugin_id.contains("chinese")) && obj.get("contributes").is_none() {
                    // Guess language ID from filename or ID
                    let lang_id = if filename.contains("zh-CN") || plugin_id.contains("chinese") {
                        "zh-CN"
                    } else {
                        "en-US"
                    };
                    
                    let contributes = serde_json::json!({
                        "languages": [
                            {
                                "id": lang_id,
                                "label": if lang_id == "zh-CN" { "Chinese" } else { "English" },
                                "nativeLabel": if lang_id == "zh-CN" { "简体中文" } else { "English" },
                                "path": filename
                            }
                        ]
                    });
                    
                    obj.insert("contributes".to_string(), contributes);
                } else if obj.get("main").is_none() && obj.get("backend").is_none() {
                    // Auto-wire scripts and wasm
                    if filename.ends_with(".js") {
                        obj.insert("main".to_string(), serde_json::Value::String(filename.to_string()));
                    } else if filename.ends_with(".wasm") || filename.ends_with(".lua") {
                        obj.insert("backend".to_string(), serde_json::Value::String(filename.to_string()));
                    }
                }
            }
            
            let manifest_path = plugin_folder.join("manifest.json");
            let manifest_content = serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?;
            std::fs::write(manifest_path, manifest_content).map_err(|e| e.to_string())?;
        }
    }

    Ok("Plugin installed successfully".to_string())
}

#[command]
pub fn delete_plugin(plugin_id: String, plugin_path: Option<String>, app: AppHandle) -> Result<String, String> {
    let target_dir = if let Some(path) = plugin_path.filter(|p| !p.is_empty()) {
        std::path::PathBuf::from(path)
    } else {
        let mut d = app
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?;
        d.push("plugins");
        d
    };

    let plugin_folder = target_dir.join(&plugin_id);
    if plugin_folder.exists() {
        std::fs::remove_dir_all(&plugin_folder).map_err(|e| format!("Failed to delete plugin: {}", e))?;
        Ok(format!("Plugin {} deleted successfully", plugin_id))
    } else {
        Err(format!("Plugin {} not found", plugin_id))
    }
}

// --- Serial Commands ---

#[command]
pub fn get_ports() -> Result<Vec<String>, String> {
    serial::get_ports()
}

#[command]
pub fn open_port(
    port: String,
    baud_rate: u32,
    app: AppHandle,
    state: State<'_, SerialState>,
) -> Result<String, String> {
    serial::open_port(port, baud_rate, app, state)
}

#[command]
pub fn close_port(port: String, state: State<'_, SerialState>) -> Result<String, String> {
    serial::close_port(port, state)
}

#[command]
pub fn send_data(
    port: String,
    data: Vec<u8>,
    state: State<'_, SerialState>,
) -> Result<String, String> {
    serial::send_data(port, data, state)
}

// --- Plugin Connection Commands (Placeholders) ---

#[command]
pub async fn plugin_connect(
    protocol: String,
    settings: serde_json::Value,
    app: AppHandle,
    tcp_state: State<'_, crate::tcp::TcpState>,
    ssh_state: State<'_, crate::ssh::SshState>,
) -> Result<String, String> {
    let connection_id = format!("{}-{}", protocol, std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
    
    if protocol == "tcp" {
        let host = settings.get("host").and_then(|h| h.as_str()).unwrap_or("127.0.0.1").to_string();
        let port = settings.get("port").and_then(|p| p.as_u64()).unwrap_or(8080) as u16;
        
        crate::tcp::connect(connection_id.clone(), host, port, app, tcp_state).await?;
        return Ok(connection_id);
    } else if protocol == "ssh" {
        let host = settings.get("host").and_then(|h| h.as_str()).unwrap_or("127.0.0.1").to_string();
        let port = settings.get("port").and_then(|p| p.as_u64()).unwrap_or(22) as u16;
        let username = settings.get("username").and_then(|u| u.as_str()).unwrap_or("root").to_string();
        let password = settings.get("password").and_then(|p| p.as_str()).map(|s| s.to_string());
        
        crate::ssh::connect(connection_id.clone(), host, port, username, password, app, ssh_state).await?;
        return Ok(connection_id);
    }

    // Placeholder for other plugin connection logic
    println!("Plugin connect requested for protocol: {} with settings: {:?}", protocol, settings);
    Ok(connection_id)
}

#[command]
pub async fn plugin_disconnect(
    id: String,
    tcp_state: State<'_, crate::tcp::TcpState>,
    ssh_state: State<'_, crate::ssh::SshState>,
) -> Result<String, String> {
    if id.starts_with("tcp-") {
        return crate::tcp::disconnect(id, tcp_state).await;
    } else if id.starts_with("ssh-") {
        return crate::ssh::disconnect(id, ssh_state).await;
    }

    // Placeholder for other plugin disconnection logic
    println!("Plugin disconnect requested for id: {}", id);
    Ok(format!("Disconnected {}", id))
}

#[command]
pub async fn plugin_send(
    id: String,
    data: Vec<u8>,
    tcp_state: State<'_, crate::tcp::TcpState>,
    ssh_state: State<'_, crate::ssh::SshState>,
) -> Result<String, String> {
    if id.starts_with("tcp-") {
        return crate::tcp::send_data(id, data, tcp_state).await;
    } else if id.starts_with("ssh-") {
        return crate::ssh::send_data(id, data, ssh_state).await;
    }

    // Placeholder for other plugin send logic
    println!("Plugin send requested for id: {} with {} bytes", id, data.len());
    Ok(format!("Data sent to {}", id))
}

