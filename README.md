<div align="center">
  <img src="images/logo-background.png" alt="Aurora Terminal Logo" width="150">
  <h1>Aurora Terminal</h1>
  <p>A high-performance, extensible, and modern terminal emulator built with Rust and React.</p>

  <p>
    <a href="README_zh.md">简体中文</a> | <span>English</span>
  </p>

  <p>
    <a href="https://github.com/tauri-apps/tauri"><img src="https://img.shields.io/badge/Tauri-2.0-blue.svg?logo=tauri" alt="Tauri"></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-18-blue.svg?logo=react" alt="React"></a>
    <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-1.70+-orange.svg?logo=rust" alt="Rust"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-GPL%20v3-green.svg" alt="License"></a>
    <img src="https://img.shields.io/badge/Updated-Mar%202026-brightgreen.svg" alt="Updated">
  </p>
</div>

<br>

<div align="center">
  <img src="images/screenshot1.png" alt="Terminal Interface" width="800">
  <br><br>
  <img src="images/screenshot2.png" alt="Settings Interface" width="800">
</div>

## ✨ Features

- **🚀 High Performance**: Built on Tauri and Rust, ensuring low memory footprint and blazing fast execution.
- **🔌 API-Driven Plugin Architecture**: Extend functionality using WASM (Extism) or Lua (mlua). Add new protocols (SSH, MQTT, Telnet) without modifying the core Rust code.
- **🎨 Modern UI**: A sleek, customizable interface built with React, Tailwind CSS, and Framer Motion.
- **🌍 Internationalization**: Built-in support for multiple languages with persistent settings.
- **🛠️ Developer Friendly**: Easy-to-use plugin system with JSON-RPC communication.

## 🏗️ Architecture

Aurora Terminal uses a unique **Microkernel + Message Passing** architecture:

- **Host (Rust)**: Provides raw I/O capabilities (TCP, Serial, etc.) and UI rendering.
- **Plugins (WASM/Lua)**: Act as state machines, handling protocol logic and data processing via JSON-RPC.

For more details on plugin development, see the [Plugin Development Guide](docs/PLUGIN_DEVELOPMENT.md).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) (OS-specific build tools)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aurora-terminal.git
   cd aurora-terminal
   ```

2. Install frontend dependencies:
   ```bash
   cd src
   npm install
   cd ..
   ```

3. Generate application icons (Required before first run/build):
   ```bash
   npx @tauri-apps/cli@^2.0.0 icon images/logo-background.png
   ```

4. Run in development mode (This will automatically start both the React frontend and the Rust backend):
   ```bash
   npx @tauri-apps/cli@^2.0.0 dev
   ```

5. Build for production (This will automatically compile both frontend and backend into a single executable):
   ```bash
   npx @tauri-apps/cli@^2.0.0 build
   ```

## 📚 Documentation

- [Plugin Development Guide (English)](docs/PLUGIN_DEVELOPMENT.md)
- [插件开发指南 (中文)](docs/PLUGIN_DEVELOPMENT_zh.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.
