export type Protocol = "serial" | "settings" | string;
export type Language = "en" | "zh" | "zh-CN" | "ja" | "ko" | "es" | "fr" | "de" | "ru" | "en-US";
export type ColorScheme = string;

export interface SerialSettings {
  port: string;
  baudRate: number;
  dataBits: 5 | 6 | 7 | 8;
  stopBits: 1 | 1.5 | 2;
  parity: "none" | "even" | "odd" | "mark" | "space";
}

export interface NetworkSettings {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface Widget {
  id: string;
  type: "chart" | "button" | "slider";
  title: string;
  config: any;
}

export interface Tab {
  id: string;
  title: string;
  type: Protocol;
  serialSettings: SerialSettings;
  networkSettings: NetworkSettings;
  customSettings?: Record<string, any>;
  logs: string[];
  widgets: Widget[];
  rxCount: number;
  txCount: number;
}

export interface ColorSchemeColors {
  bg: string;
  fg: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  purple: string;
  cyan: string;
  white: string;
}

export interface ColorSchemeConfig {
  id: string;
  name: string;
  colors: ColorSchemeColors;
  isCustom?: boolean;
}

// Plugin System Types
export interface PluginLanguageContribution {
  id: string;
  label: string;
  nativeLabel?: string;
  path: string;
}

export interface PluginThemeContribution {
  id: string;
  label: string;
  path: string;
}

export interface PluginProtocolSetting {
  id: string;
  label: string;
  type: "string" | "number" | "boolean" | "password";
  default?: any;
}

export interface PluginProtocolContribution {
  id: string;
  label: string;
  settings?: PluginProtocolSetting[];
}

export interface PluginContributions {
  languages?: PluginLanguageContribution[];
  themes?: PluginThemeContribution[];
  widgets?: any[];
  protocols?: PluginProtocolContribution[];
}

export interface PluginActivation {
  engine: "lua" | "wasm";
  entry: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  homepage?: string;
  repository?: string;
  activation?: PluginActivation;
  permissions?: string[];
  contributes?: PluginContributions;
  // Internal field added by Rust to track where this plugin is loaded from
  __pluginPath?: string;
}

export interface AppSettings {
  language: Language;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  glassmorphism: boolean;
  glassOpacity: number;
  glassBlur: number;
  defaultBaudRate: number;
  colorScheme: ColorScheme;
  customColorSchemes: ColorSchemeConfig[];
  showAurora: boolean;
  auroraSpeed: number;
  backgroundImage: string | null;
  cursorShape: "block" | "underline" | "bar";
  cursorBlink: boolean;
  scrollbackLines: number;
  copyOnSelect: boolean;
  pasteOnRightClick: boolean;
  pluginPath: string;
  showTimestamp: boolean;
}
