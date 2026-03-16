use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{AppHandle, State};

pub struct SshState {
    pub connections: Arc<Mutex<HashMap<String, tokio::sync::mpsc::Sender<Vec<u8>>>>>,
}

impl SshState {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

pub async fn connect(
    id: String,
    host: String,
    port: u16,
    _username: String,
    _password: Option<String>,
    _app: AppHandle,
    state: State<'_, SshState>,
) -> Result<String, String> {
    let mut connections = state.connections.lock().await;

    if connections.contains_key(&id) {
        return Ok(format!("SSH connection {} is already open", id));
    }

    // TODO: Implement actual SSH connection using `russh` or `ssh2` crate.
    // This is a placeholder. You need to:
    // 1. Add `russh` to Cargo.toml
    // 2. Establish SSH session and open a channel
    // 3. Spawn read/write tasks similar to tcp.rs
    // 4. Emit "plugin-rx" and "plugin-disconnected" events

    Err("SSH protocol is not yet fully implemented. Please see src-tauri/src/ssh.rs".to_string())
}

pub async fn disconnect(id: String, state: State<'_, SshState>) -> Result<String, String> {
    let mut connections = state.connections.lock().await;
    if connections.remove(&id).is_some() {
        Ok(format!("Disconnected {}", id))
    } else {
        Err(format!("Connection {} not found", id))
    }
}

pub async fn send_data(
    id: String,
    data: Vec<u8>,
    state: State<'_, SshState>,
) -> Result<String, String> {
    let connections = state.connections.lock().await;
    if let Some(tx) = connections.get(&id) {
        tx.send(data).await.map_err(|e| format!("Failed to send data: {}", e))?;
        Ok("Data sent".to_string())
    } else {
        Err(format!("Connection {} not found", id))
    }
}