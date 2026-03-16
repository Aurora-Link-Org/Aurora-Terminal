# Aurora Terminal 插件开发白皮书 (API-Driven Architecture)

Aurora Terminal 提供了一个高性能、低内存占用的插件系统。基于 **Extism (WASM)** 和 **mlua (Lua)**，你可以轻松地为终端扩展新的协议（如 SSH、MQTT、Telnet）或数据处理逻辑。

## 核心架构理念：Host 提供 I/O，Plugin 实现协议

**你不应该在主程序（Rust）中硬编码具体的业务协议（如 SSH、Modbus）。**

WASM 插件运行在安全的沙箱中，无法直接调用操作系统的底层网络 API（如 `std::net::TcpStream`）。因此，Aurora Terminal 采用了 **“微内核 + 消息传递 (JSON-RPC)”** 的架构：

1. **Host (Aurora Rust 主程序)**：只负责提供**底层 Raw I/O 能力**（如 Raw TCP Socket、Raw Serial Port、UDP）和**UI 渲染接口**。
2. **Plugin (WASM 插件)**：作为一个纯粹的**状态机**。它不直接发起网络请求，而是通过 JSON 消息告诉 Host “请帮我连接到某个 IP”，并在收到 Host 传来的 TCP 数据时，解析协议（如 SSH 握手），再告诉 Host “请在屏幕上打印这些文字”。

这种架构彻底解耦了宿主和协议，使得你可以用任何语言编写插件，而无需修改一行 Rust 宿主代码！

## 插件目录结构

一个标准的 Aurora 插件是一个包含 `manifest.json` 的文件夹，通常结构如下：

```text
my-plugin/
├── manifest.json       # 插件清单文件（必须）
├── backend.wasm        # WASM 后端逻辑（可选）
├── script.lua          # Lua 数据处理脚本（可选）
├── ui.js               # 前端 UI 渲染逻辑（可选）
└── translations/       # 多语言翻译文件（可选）
    ├── en-US.json
    └── zh-CN.json
```

## Manifest 规范 (`manifest.json`)

`manifest.json` 是插件的入口，定义了插件的基本信息、UI 配置和后端入口。

```json
{
  "id": "ssh-client",
  "name": "SSH Client",
  "version": "1.0.0",
  "author": "Aurora Team",
  "description": "A full SSH client implemented in WASM.",
  "backend": "backend.wasm",
  "contributes": {
    "protocols": [
      {
        "id": "ssh",
        "label": "SSH Client",
        "settings": [
          { "id": "host", "label": "Host", "type": "string", "default": "127.0.0.1" },
          { "id": "port", "label": "Port", "type": "number", "default": 22 },
          { "id": "username", "label": "Username", "type": "string", "default": "root" }
        ]
      }
    ]
  }
}
```

## 后端开发 (WASM / Rust)

如果你需要处理复杂的数据解析或实现自定义协议，推荐使用 Rust 编译为 WASM。

### 1. 数据拦截与过滤 (Data Filter)
如果你只需要修改现有的数据流（例如将所有小写转大写），只需导出一个 `process` 函数：

```rust
use extism_pdk::*;

#[plugin_fn]
pub fn process(input: Vec<u8>) -> FnResult<Vec<u8>> {
    let mut output = input.clone();
    // 数据处理逻辑...
    Ok(output)
}
```

### 2. 完整协议实现 (JSON-RPC 模式)
如果你要实现一个全新的协议（如 SSH），你需要导出一个 `on_event` 函数来接收 Host 的事件，并返回指令：

```rust
use extism_pdk::*;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct HostEvent {
    event_type: String, // "init", "tcp_rx", "tcp_closed"
    payload: String,
}

#[derive(Serialize)]
struct PluginCommand {
    action: String,     // "tcp_connect", "tcp_write", "ui_print"
    payload: String,
}

#[plugin_fn]
pub fn on_event(input: String) -> FnResult<String> {
    let event: HostEvent = serde_json::from_str(&input)?;
    let mut commands = Vec::new();

    if event.event_type == "init" {
        // 插件初始化，要求 Host 打开一个底层的 TCP 连接
        commands.push(PluginCommand {
            action: "tcp_connect".to_string(),
            payload: "{\"host\": \"192.168.1.1\", \"port\": 22}".to_string(),
        });
    } else if event.event_type == "tcp_rx" {
        // 收到 Host 传来的底层 TCP 数据，进行 SSH 协议解析
        let parsed_text = parse_ssh_data(&event.payload);
        
        // 要求 Host 在 UI 上打印解析后的文本
        commands.push(PluginCommand {
            action: "ui_print".to_string(),
            payload: parsed_text,
        });
    }

    Ok(serde_json::to_string(&commands)?)
}
```

## 数据处理 (Lua)

对于简单的数据过滤、高亮或转换，可以直接使用 Lua 脚本。

1. 在 `manifest.json` 中指定 `"backend": "script.lua"`。
2. 编写 `script.lua`，实现 `on_data_received` 全局函数：

```lua
function on_data_received(data)
    -- 简单的替换逻辑
    local processed = string.gsub(data, "error", "ERROR")
    return processed
end
```

## 总结：为什么保留 `tcp.rs`？

你可能会问：既然所有协议都由插件实现，为什么主程序里还有 `tcp.rs`？

答案是：**`tcp.rs` 并不是一个“业务协议”，它是 Host 提供给插件的“底层基础设施 (Raw I/O Provider)”。**
WASM 插件无法自己调用网卡，它必须通过 JSON-RPC 告诉 Host：“请调用你的 `tcp.rs` 帮我连上这个 IP，然后把收到的字节流发给我”。

通过这种设计，你可以用 WASM 实现 SSH、MQTT、Redis 等无数种协议，而**永远不需要再修改主程序的 Rust 代码**！
