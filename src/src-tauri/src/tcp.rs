use std::collections::HashMap;
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tauri::{AppHandle, Emitter, State, Manager};

pub struct TcpState {
    pub connections: Arc<Mutex<HashMap<String, tokio::sync::mpsc::Sender<Vec<u8>>>>>,
}

impl TcpState {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

#[derive(Clone, serde::Serialize)]
pub struct TcpPayload {
    pub id: String,
    pub data: Vec<u8>,
}

pub async fn connect(
    id: String,
    host: String,
    port: u16,
    app: AppHandle,
    state: State<'_, TcpState>,
) -> Result<String, String> {
    let mut connections = state.connections.lock().await;

    if connections.contains_key(&id) {
        return Ok(format!("TCP connection {} is already open", id));
    }

    let addr = format!("{}:{}", host, port);
    let stream = TcpStream::connect(&addr).await.map_err(|e| format!("Failed to connect to {}: {}", addr, e))?;
    
    let (mut read_half, mut write_half) = stream.into_split();
    let (tx, mut rx) = tokio::sync::mpsc::channel::<Vec<u8>>(32);

    let id_clone = id.clone();
    let app_clone = app.clone();

    // Read task
    tokio::spawn(async move {
        let mut buf = vec![0; 4096];
        loop {
            match read_half.read(&mut buf).await {
                Ok(0) => {
                    // Connection closed
                    let _ = app_clone.emit("plugin-disconnected", id_clone.clone());
                    break;
                }
                Ok(n) => {
                    let raw_data = &buf[..n];
                    
                    // Pass data through plugin engine
                    let processed_data = if let Some(engine) = app_clone.try_state::<crate::plugin_engine::PluginEngine>() {
                        engine.process_data(raw_data)
                    } else {
                        raw_data.to_vec()
                    };

                    let _ = app_clone.emit(
                        "plugin-rx",
                        TcpPayload {
                            id: id_clone.clone(),
                            data: processed_data,
                        },
                    );
                }
                Err(_) => {
                    let _ = app_clone.emit("plugin-disconnected", id_clone.clone());
                    break;
                }
            }
        }
    });

    // Write task
    tokio::spawn(async move {
        while let Some(data) = rx.recv().await {
            if write_half.write_all(&data).await.is_err() {
                break;
            }
        }
    });

    connections.insert(id.clone(), tx);
    Ok(format!("Connected to {}", addr))
}

pub async fn disconnect(id: String, state: State<'_, TcpState>) -> Result<String, String> {
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
    state: State<'_, TcpState>,
) -> Result<String, String> {
    let connections = state.connections.lock().await;
    if let Some(tx) = connections.get(&id) {
        tx.send(data).await.map_err(|e| format!("Failed to send data: {}", e))?;
        Ok("Data sent".to_string())
    } else {
        Err(format!("Connection {} not found", id))
    }
}