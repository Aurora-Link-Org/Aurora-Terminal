use extism::{Manifest, Plugin, Wasm};
use mlua::{Function, Lua};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

// We need to wrap Lua and Plugin in a way that allows them to be shared across threads
// safely, or we need to ensure they are only accessed from the thread they were created on.
// Since Tauri state must be Send + Sync, and Lua/Plugin are not inherently Send/Sync,
// we can use a Mutex, but we also need to tell Rust it's "safe" (even if we have to use unsafe impl Send/Sync).
// A better approach is to use a thread-local or a dedicated thread for plugin execution,
// but for simplicity here, we'll use a wrapper struct with unsafe impl Send + Sync.
// WARNING: This is a hack to make it compile. In a production app, you should carefully
// manage thread safety for Lua and Wasm plugins.

struct LuaWrapper(Lua);
unsafe impl Send for LuaWrapper {}
unsafe impl Sync for LuaWrapper {}

struct PluginWrapper(Plugin);
unsafe impl Send for PluginWrapper {}
unsafe impl Sync for PluginWrapper {}

pub struct PluginEngine {
    pub plugin_dir: PathBuf,
    lua_vm: Mutex<LuaWrapper>,
    wasm_plugins: Mutex<Vec<PluginWrapper>>,
    lua_scripts: Mutex<Vec<String>>,
}

impl PluginEngine {
    pub fn new(app_handle: &tauri::AppHandle) -> Self {
        let mut app_data_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get AppData directory");

        app_data_dir.push("plugins");

        if !app_data_dir.exists() {
            fs::create_dir_all(&app_data_dir).expect("Failed to create plugins directory");
            println!("Created default plugin directory at: {:?}", app_data_dir);
        } else {
            println!("Found plugin directory at: {:?}", app_data_dir);
        }

        let mut lang_dir = app_data_dir.clone();
        lang_dir.push("lang");
        if !lang_dir.exists() {
            fs::create_dir_all(&lang_dir).expect("Failed to create lang directory");
        }

        let lua = Lua::new();

        let engine = Self {
            plugin_dir: app_data_dir,
            lua_vm: Mutex::new(LuaWrapper(lua)),
            wasm_plugins: Mutex::new(Vec::new()),
            lua_scripts: Mutex::new(Vec::new()),
        };

        // Load all plugins on startup
        engine.reload_plugins();
        engine
    }

    /// Scans the plugin directory and loads all .lua and .wasm files
    pub fn reload_plugins(&self) {
        let mut wasm_plugins = self.wasm_plugins.lock().unwrap();
        let mut lua_scripts = self.lua_scripts.lock().unwrap();

        wasm_plugins.clear();
        lua_scripts.clear();

        if let Ok(entries) = fs::read_dir(&self.plugin_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Some(ext) = path.extension() {
                    if ext == "lua" {
                        if let Ok(code) = fs::read_to_string(&path) {
                            lua_scripts.push(code);
                            println!("Loaded Lua plugin: {:?}", path.file_name().unwrap());
                        }
                    } else if ext == "wasm" {
                        if let Ok(wasm_bytes) = fs::read(&path) {
                            let manifest = Manifest::new([Wasm::data(wasm_bytes)]);
                            // Create Extism plugin with WASI enabled (true)
                            match Plugin::new(&manifest, [], true) {
                                Ok(plugin) => {
                                    wasm_plugins.push(PluginWrapper(plugin));
                                    println!("Loaded Wasm plugin: {:?}", path.file_name().unwrap());
                                }
                                Err(e) => eprintln!("Failed to load Wasm plugin {:?}: {}", path, e),
                            }
                        }
                    }
                }
            }
        }
    }

    /// Process raw data through all loaded Lua and Wasm plugins
    pub fn process_data(&self, raw_data: &[u8]) -> Vec<u8> {
        let mut current_data = raw_data.to_vec();

        // 1. Process through Lua plugins
        if let Ok(lua_wrapper) = self.lua_vm.lock() {
            let lua = &lua_wrapper.0;
            let scripts = self.lua_scripts.lock().unwrap();
            for script in scripts.iter() {
                let result: Result<Vec<u8>, mlua::Error> = lua.scope(|_scope| {
                    let globals = lua.globals();

                    // Execute the script to register the `on_data_received` function
                    lua.load(script).exec()?;

                    if let Ok(on_data) = globals.get::<_, Function>("on_data_received") {
                        let lua_str = lua.create_string(&current_data)?;
                        let processed: mlua::String = on_data.call(lua_str)?;
                        Ok(processed.as_bytes().to_vec())
                    } else {
                        // If the function isn't defined, just pass the data through
                        Ok(current_data.clone())
                    }
                });

                match result {
                    Ok(new_data) => current_data = new_data,
                    Err(e) => eprintln!("Lua plugin error: {}", e),
                }
            }
        }

        // 2. Process through Wasm plugins (via Extism)
        if let Ok(mut wasm_plugins) = self.wasm_plugins.lock() {
            for plugin_wrapper in wasm_plugins.iter_mut() {
                let plugin = &mut plugin_wrapper.0;
                // We assume the Wasm plugin exports a function named "process"
                if plugin.function_exists("process") {
                    // Extism automatically handles passing the byte array into Wasm memory
                    // and reading the returned byte array back out!
                    match plugin.call::<&[u8], Vec<u8>>("process", &current_data) {
                        Ok(output) => {
                            current_data = output;
                        }
                        Err(e) => {
                            eprintln!("Wasm plugin error: {}", e);
                        }
                    }
                }
            }
        }

        current_data
    }

    /// Generic JSON-RPC caller for plugins (Host -> Plugin communication)
    pub fn call_plugin_json(&self, _plugin_id: &str, func: &str, payload: &str) -> Result<String, String> {
        let mut wasm_plugins = self.wasm_plugins.lock().unwrap();
        // In a real implementation, we would map `plugin_id` to a specific loaded plugin.
        // For this architecture demo, we route to the first available WASM plugin.
        if let Some(plugin_wrapper) = wasm_plugins.first_mut() {
            let plugin = &mut plugin_wrapper.0;
            if plugin.function_exists(func) {
                match plugin.call::<&[u8], Vec<u8>>(func, payload.as_bytes()) {
                    Ok(output) => {
                        return String::from_utf8(output).map_err(|e| e.to_string());
                    }
                    Err(e) => return Err(format!("WASM execution error: {}", e)),
                }
            }
        }
        Err("Plugin or function not found".to_string())
    }
}
