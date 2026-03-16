use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, State};

use crate::plugin_engine::PluginEngine;

pub struct SerialState {
    pub ports: Mutex<HashMap<String, Box<dyn serialport::SerialPort>>>,
}

#[derive(Clone, serde::Serialize)]
pub struct SerialPayload {
    pub port: String,
    pub data: Vec<u8>,
}

pub fn get_ports() -> Result<Vec<String>, String> {
    match serialport::available_ports() {
        Ok(ports) => Ok(ports.into_iter().map(|p| p.port_name).collect()),
        Err(e) => Err(format!("Failed to get ports: {}", e)),
    }
}

pub fn open_port(
    port_name: String,
    baud_rate: u32,
    app: AppHandle,
    state: State<'_, SerialState>,
) -> Result<String, String> {
    let mut ports = state.ports.lock().unwrap();

    if ports.contains_key(&port_name) {
        return Ok(format!("Port {} is already open", port_name));
    }

    let port = serialport::new(port_name.clone(), baud_rate)
        .timeout(Duration::from_millis(10))
        .open()
        .map_err(|e| format!("Failed to open port: {}", e))?;

    let mut read_port = port.try_clone().map_err(|e| format!("Failed to clone port: {}", e))?;
    let port_name_clone = port_name.clone();

    // 开启独立线程读取串口数据
    thread::spawn(move || {
        let mut serial_buf: Vec<u8> = vec![0; 1024];
        loop {
            match read_port.read(serial_buf.as_mut_slice()) {
                Ok(t) if t > 0 => {
                    let raw_data = &serial_buf[..t];

                    // 【核心】将原始数据送入 Lua / Wasm 插件引擎进行处理
                    let processed_data = if let Some(engine) = app.try_state::<PluginEngine>() {
                        engine.process_data(raw_data)
                    } else {
                        raw_data.to_vec()
                    };

                    // 将处理后的数据发送给前端
                    let _ = app.emit(
                        "serial-rx",
                        SerialPayload {
                            port: port_name_clone.clone(),
                            data: processed_data,
                        },
                    );
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {
                    continue;
                }
                Err(_) => {
                    break;
                }
                _ => {}
            }
        }
    });

    ports.insert(port_name.clone(), port);
    println!("Opening port {} at {} baud", port_name, baud_rate);
    Ok(format!("Port {} opened successfully", port_name))
}

pub fn close_port(port_name: String, state: State<'_, SerialState>) -> Result<String, String> {
    let mut ports = state.ports.lock().unwrap();
    if ports.remove(&port_name).is_some() {
        println!("Closing port {}", port_name);
        Ok(format!("Port {} closed successfully", port_name))
    } else {
        Err(format!("Port {} is not open", port_name))
    }
}

pub fn send_data(
    port_name: String,
    data: Vec<u8>,
    state: State<'_, SerialState>,
) -> Result<String, String> {
    let mut ports = state.ports.lock().unwrap();
    if let Some(port) = ports.get_mut(&port_name) {
        port.write_all(&data)
            .map_err(|e| format!("Failed to write data: {}", e))?;
        println!("Sending data to {}", port_name);
        Ok(format!("Data sent to {}", port_name))
    } else {
        Err("Port not open".to_string())
    }
}