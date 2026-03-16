import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useI18n } from "../../context/I18nContext";
import { ColorSchemeConfig, Language } from "../../types";
import { defaultColorSchemes } from "../../constants/theme";
import { invoke } from "@tauri-apps/api/core";
import {
  Monitor,
  Palette,
  TerminalSquare,
  Sparkles,
  Plug,
  Plus,
  Copy,
  Trash2,
  Edit2,
  X,
  FolderOpen,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { CustomSelect } from "../common/CustomSelect";
import { AppearancePanel } from "./AppearancePanel";
import { ColorSchemeEditor } from "./ColorSchemeEditor";
import { MarketplacePanel } from "./MarketplacePanel";

export const SettingsTab: React.FC<{ tabId: string }> = () => {
  const { settings, updateSettings, setPreviewSettings } = useAppContext();
  const { t: translate, language, setLanguage, availableLanguages, plugins, reloadPlugins } = useI18n();
  const [localSettings, setLocalSettings] = useState(settings);
  const [activeMenu, setActiveMenu] = useState<
    | "startup"
    | "interaction"
    | "appearance"
    | "colorScheme"
    | "rendering"
    | "plugins"
  >("appearance");
  const [pluginTab, setPluginTab] = useState<"explore" | "installed" | "settings">("explore");
  const [deletingPluginId, setDeletingPluginId] = useState<string | null>(null);
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);

  const [isReloading, setIsReloading] = useState(false);

  const [pluginUrl, setPluginUrl] = useState("");
  const [isInstallingPlugin, setIsInstallingPlugin] = useState(false);
  const [installPluginError, setInstallPluginError] = useState("");
  const [installPluginSuccess, setInstallPluginSuccess] = useState("");
  const [tempScheme, setTempScheme] = useState<ColorSchemeConfig | null>(null);

  // Sync local settings if global settings change externally
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Update preview settings whenever local settings change
  React.useEffect(() => {
    // When editing a scheme, we want to preview THAT scheme, even if it's not saved to localSettings yet
    if (editingSchemeId && tempScheme) {
      // Create a temporary settings object for preview
      const preview = {
        ...localSettings,
        colorScheme: tempScheme.id,
        customColorSchemes: [
          ...localSettings.customColorSchemes.filter(
            (s) => s.id !== tempScheme.id,
          ),
          tempScheme,
        ],
      };
      setPreviewSettings(preview);
    } else {
      setPreviewSettings(localSettings);
    }
  }, [localSettings, setPreviewSettings, editingSchemeId, tempScheme]);

  // Clear preview settings on unmount
  React.useEffect(() => {
    return () => setPreviewSettings(null);
  }, [setPreviewSettings]);

  const t = {
    startup: translate("startup", "Startup"),
    interaction: translate("interaction", "Interaction"),
    appearance: translate("appearance", "Appearance"),
    colorScheme: translate("colorScheme", "Color Scheme"),
    rendering: translate("rendering", "Rendering"),
    plugins: translate("plugins", "Plugins"),
    language: translate("language", "Language"),
    fontFamily: translate("fontFamily", "Font Family"),
    fontSize: translate("fontSize", "Font Size"),
    lineHeight: translate("lineHeight", "Line Height"),
    glass: translate("glass", "Glassmorphism"),
    glassOpacity: translate("glassOpacity", "Background Opacity"),
    glassBlur: translate("glassBlur", "Blur Radius"),
    baud: translate("baud", "Default Baud Rate"),
    aurora: translate("aurora", "Aurora Background Effect"),
    cursorShape: translate("cursorShape", "Cursor Shape"),
    cursorBlink: translate("cursorBlink", "Cursor Blink"),
    scrollbackLines: translate("scrollbackLines", "Scrollback Lines"),
    copyOnSelect: translate("copyOnSelect", "Copy on Select"),
    pasteOnRightClick: translate("pasteOnRightClick", "Paste on Right Click"),
    showTimestamp: translate("showTimestamp", "Show Timestamp"),
    save: translate("save", "Save"),
    discard: translate("discard", "Discard Changes"),
    pluginPath: translate("pluginPath", "Plugin Path"),
    newScheme: translate("newScheme", "New Scheme"),
    duplicateScheme: translate("duplicateScheme", "Duplicate Scheme"),
    deleteScheme: translate("deleteScheme", "Delete Scheme"),
    editScheme: translate("editScheme", "Edit Scheme"),
    schemeName: translate("schemeName", "Scheme Name"),
    colors: translate("colors", "Colors"),
    color_bg: translate("color_bg", "Background"),
    color_fg: translate("color_fg", "Default Text"),
    color_black: translate("color_black", "Timestamp"),
    color_red: translate("color_red", "Error Message"),
    color_green: translate("color_green", "Receive Data"),
    color_yellow: translate("color_yellow", "Warning Message"),
    color_blue: translate("color_blue", "Send Data"),
    color_purple: translate("color_purple", "Number/Hex"),
    color_cyan: translate("color_cyan", "System Info"),
    color_white: translate("color_white", "Highlight Text"),
    desc_baud: translate("desc_baud", "The default baud rate when opening a new serial connection."),
    desc_copyOnSelect: translate("desc_copyOnSelect", "Automatically copy text to clipboard when selected."),
    desc_pasteOnRightClick: translate("desc_pasteOnRightClick", "Paste from clipboard when right-clicking in the terminal."),
    desc_showTimestamp: translate("desc_showTimestamp", "Show timestamp in terminal logs."),
    desc_aurora: translate("desc_aurora", "Enable hardware-accelerated dynamic fluid background effect."),
    desc_glass: translate("desc_glass", "Enable frosted glass effects on panels."),
    auroraSpeed: translate("auroraSpeed", "Aurora Flow Speed"),
    backgroundImage: translate("backgroundImage", "Custom Background Image"),
    desc_backgroundImage: translate("desc_backgroundImage", "Upload an image as background (will override Aurora effect)."),
    cursor_bar: translate("cursor_bar", "Bar ( | )"),
    cursor_block: translate("cursor_block", "Block ( █ )"),
    cursor_underline: translate("cursor_underline", "Underline ( _ )"),
    desc_pluginPath: translate("desc_pluginPath", "Specify the directory path to load external plugins from."),
    installFromUrl: translate("installFromUrl", "Install from URL"),
    install: translate("install", "Install"),
    desc_installFromUrl: translate("desc_installFromUrl", "Enter the direct URL to a plugin ZIP file to download and extract it automatically."),
    installedPlugins: translate("installedPlugins", "Installed Plugins"),
    noPluginsFound: translate("noPluginsFound", "No plugins found in the specified directory."),
    current: translate("current", "Active"),
    newSchemeDefault: translate("newSchemeDefault", "New Scheme"),
    copySuffix: translate("copySuffix", " Copy"),
  };

  const menuItems = [
    { id: "startup", label: t.startup, icon: <Monitor size={16} /> },
    {
      id: "interaction",
      label: t.interaction,
      icon: <TerminalSquare size={16} />,
    },
    { id: "appearance", label: t.appearance, icon: <Palette size={16} /> },
    { id: "colorScheme", label: t.colorScheme, icon: <Palette size={16} /> },
    { id: "rendering", label: t.rendering, icon: <Sparkles size={16} /> },
    { id: "plugins", label: t.plugins, icon: <Plug size={16} /> },
  ] as const;

  const allColorSchemes = [
    ...defaultColorSchemes,
    ...localSettings.customColorSchemes,
  ];
  const activeColorScheme =
    editingSchemeId && tempScheme
      ? tempScheme
      : allColorSchemes.find((s) => s.id === localSettings.colorScheme) ||
        defaultColorSchemes[0];

  const handleSave = () => {
    updateSettings(localSettings);
  };

  const handleInstallPlugin = async () => {
    if (!pluginUrl.trim()) {
      setInstallPluginError((t as any).invalidUrl || "Please enter a valid URL");
      return;
    }

    setIsInstallingPlugin(true);
    setInstallPluginError("");
    setInstallPluginSuccess("");

    try {
      await invoke("install_plugin_from_url", {
        url: pluginUrl.trim(),
        pluginPath: localSettings.pluginPath,
      });
      setInstallPluginSuccess((t as any).installSuccess || "Plugin installed successfully! Please restart the app or reload plugins.");
      setPluginUrl("");
    } catch (err) {
      console.error("Failed to install plugin:", err);
      setInstallPluginError(String(err));
    } finally {
      setIsInstallingPlugin(false);
    }
  };

  const handleDiscard = () => {
    setLocalSettings(settings);
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  return (
    <div className="flex h-full w-full bg-transparent relative">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 bg-black/20 overflow-y-auto py-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${activeMenu === item.id ? "bg-emerald-500/20 text-emerald-400 border-l-2 border-emerald-400" : "text-slate-300 hover:bg-white/5 border-l-2 border-transparent"}`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-black/10 pb-24">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            {menuItems.find((m) => m.id === activeMenu)?.label}
          </h2>

          {activeMenu === "startup" && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t.baud}
                </label>
                <CustomSelect
                  value={localSettings.defaultBaudRate}
                  options={[
                    4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800,
                    921600,
                  ].map((b) => ({ value: b, label: b.toString() }))}
                  onChange={(val) =>
                    setLocalSettings({
                      ...localSettings,
                      defaultBaudRate: val as number,
                    })
                  }
                  className="max-w-xs"
                />
                <p className="text-xs text-slate-500 mt-2">{t.desc_baud}</p>
              </div>
            </div>
          )}

          {activeMenu === "interaction" && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {t.copyOnSelect}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {t.desc_copyOnSelect}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        copyOnSelect: !localSettings.copyOnSelect,
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.copyOnSelect ? "bg-emerald-500" : "bg-slate-700"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${localSettings.copyOnSelect ? "left-7" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {t.pasteOnRightClick}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {t.desc_pasteOnRightClick}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        pasteOnRightClick: !localSettings.pasteOnRightClick,
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.pasteOnRightClick ? "bg-emerald-500" : "bg-slate-700"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${localSettings.pasteOnRightClick ? "left-7" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {t.showTimestamp}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {(t as any).desc_showTimestamp ||
                        "Show timestamp in terminal logs."}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        showTimestamp: !localSettings.showTimestamp,
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.showTimestamp ? "bg-emerald-500" : "bg-slate-700"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${localSettings.showTimestamp ? "left-7" : "left-1"}`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t.scrollbackLines}
                  </label>
                  <input
                    type="number"
                    value={localSettings.scrollbackLines}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        scrollbackLines: parseInt(e.target.value),
                      })
                    }
                    className="glass-input w-full max-w-xs rounded-lg py-2 px-3 text-sm text-white outline-none bg-black/40 border border-white/10 hover:border-white/20 focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {activeMenu === "appearance" && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t.language}
                  </label>
                  <CustomSelect
                    value={language}
                    options={availableLanguages.map((l) => ({ 
                      value: l.id, 
                      label: l.nativeLabel && l.label !== l.nativeLabel ? `${translate(l.id, l.label)} - ${l.nativeLabel}` : translate(l.id, l.label) 
                    }))}
                    onChange={(val) => setLanguage(val as Language)}
                    className="max-w-xs"
                  />
                </div>
              </div>
              <AppearancePanel
                localSettings={localSettings}
                setLocalSettings={setLocalSettings}
                activeColorScheme={activeColorScheme}
                allColorSchemes={allColorSchemes}
                t={t}
              />
            </div>
          )}

          {activeMenu === "colorScheme" && (
            <div className="space-y-6">
              {!editingSchemeId ? (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-white">
                      {t.colorScheme}
                    </h3>
                    <button
                      onClick={() => {
                        const newScheme: ColorSchemeConfig = {
                          id: `custom-${Date.now()}`,
                          name: (t as any).newSchemeDefault,
                          colors: { ...defaultColorSchemes[0].colors },
                          isCustom: true,
                        };
                        setTempScheme(newScheme);
                        setEditingSchemeId(newScheme.id);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors"
                    >
                      <Plus size={14} />
                      {t.newScheme}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {allColorSchemes.map((scheme) => (
                      <div
                        key={scheme.id}
                        className={`p-4 rounded-xl border transition-all flex items-center gap-4 group ${localSettings.colorScheme === scheme.id ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}
                      >
                        <div
                          className="flex gap-1 flex-shrink-0 cursor-pointer"
                          onClick={() =>
                            setLocalSettings({
                              ...localSettings,
                              colorScheme: scheme.id,
                            })
                          }
                        >
                          {[
                            "black",
                            "red",
                            "green",
                            "yellow",
                            "blue",
                            "purple",
                            "cyan",
                            "white",
                          ].map((colorKey, i) => (
                            <div
                              key={i}
                              className="w-4 h-6 rounded-sm shadow-sm border border-white/10"
                              style={{
                                backgroundColor: (scheme.colors as any)[
                                  colorKey
                                ],
                              }}
                            />
                          ))}
                        </div>
                        <div
                          className="text-sm font-medium text-white flex-1 cursor-pointer"
                          onClick={() =>
                            setLocalSettings({
                              ...localSettings,
                              colorScheme: scheme.id,
                            })
                          }
                        >
                          {scheme.name}
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              const newScheme: ColorSchemeConfig = {
                                ...scheme,
                                id: `custom-${Date.now()}`,
                                name: `${scheme.name}${(t as any).copySuffix}`,
                                isCustom: true,
                              };
                              setTempScheme(newScheme);
                              setEditingSchemeId(newScheme.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md"
                            title={t.duplicateScheme}
                          >
                            <Copy size={14} />
                          </button>

                          {scheme.isCustom && (
                            <>
                              <button
                                onClick={() => {
                                  setTempScheme({ ...scheme });
                                  setEditingSchemeId(scheme.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md"
                                title={t.editScheme}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  const newCustomSchemes =
                                    localSettings.customColorSchemes.filter(
                                      (s) => s.id !== scheme.id,
                                    );
                                  let newActiveScheme =
                                    localSettings.colorScheme;
                                  if (localSettings.colorScheme === scheme.id) {
                                    newActiveScheme = defaultColorSchemes[0].id;
                                  }
                                  setLocalSettings({
                                    ...localSettings,
                                    customColorSchemes: newCustomSchemes,
                                    colorScheme: newActiveScheme,
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"
                                title={t.deleteScheme}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>

                        {localSettings.colorScheme === scheme.id && (
                          <div className="text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {(t as any).current}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <ColorSchemeEditor
                  tempScheme={tempScheme!}
                  setTempScheme={setTempScheme}
                  localSettings={localSettings}
                  setLocalSettings={setLocalSettings}
                  setEditingSchemeId={setEditingSchemeId}
                  t={t}
                />
              )}
            </div>
          )}

          {activeMenu === "plugins" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-end mb-2">
                <button
                  onClick={() => {
                    reloadPlugins();
                    setIsReloading(true);
                    setTimeout(() => setIsReloading(false), 1500);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
                >
                  <RefreshCw size={16} className={isReloading ? "animate-spin" : ""} />
                  {isReloading 
                    ? ((t as any).reloaded || (language === "zh" || language === "zh-CN" ? "已刷新" : "Reloaded"))
                    : ((t as any).reloadPlugins || "Reload Plugins")}
                </button>
              </div>

              <div className="flex gap-2 border-b border-white/10 pb-4 mb-4">
                <button 
                  onClick={() => setPluginTab("explore")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pluginTab === "explore" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                >
                  {(t as any).explore || "Explore"}
                </button>
                <button 
                  onClick={() => setPluginTab("installed")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pluginTab === "installed" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                >
                  {(t as any).installed || "Installed"} ({plugins.length})
                </button>
                <button 
                  onClick={() => setPluginTab("settings")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${pluginTab === "settings" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
                >
                  {(t as any).settingsTab || "Settings"}
                </button>
              </div>

              {pluginTab === "explore" && (
                <MarketplacePanel 
                  localPlugins={plugins} 
                  pluginPath={localSettings.pluginPath}
                  onInstallSuccess={reloadPlugins}
                />
              )}

              {pluginTab === "installed" && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  {plugins.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Plug size={48} className="mx-auto mb-3 opacity-20" />
                      <p>{(t as any).noPluginsFound}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {plugins.map((plugin) => (
                        <div key={plugin.id} className="p-4 rounded-xl border border-white/10 bg-black/20 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-base font-medium text-emerald-400">{plugin.name}</h4>
                              <div className="text-xs text-slate-400 flex gap-3 mt-1">
                                <span>v{plugin.version}</span>
                                <span>by {plugin.author}</span>
                                <span className="font-mono text-slate-500">{plugin.id}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {plugin.activation?.engine && (
                                <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono text-slate-300 uppercase">
                                  {plugin.activation.engine}
                                </span>
                              )}
                              {deletingPluginId === plugin.id ? (
                                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg">
                                  <span className="text-xs text-red-400">{(t as any).deleteConfirm || "Delete?"}</span>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await invoke("delete_plugin", { pluginId: plugin.id, pluginPath: localSettings.pluginPath });
                                        setDeletingPluginId(null);
                                        reloadPlugins();
                                      } catch (e) {
                                        console.error("Failed to delete plugin:", e);
                                      }
                                    }}
                                    className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded transition-colors"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setDeletingPluginId(null)}
                                    className="text-xs text-slate-300 hover:text-white px-2 py-0.5 rounded transition-colors"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeletingPluginId(plugin.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                  title="Delete Plugin"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-slate-300 mt-2">{plugin.description}</p>
                          
                          {(plugin.homepage || plugin.repository) && (
                            <div className="flex gap-4 mt-2">
                              {plugin.homepage && (
                                <a href={plugin.homepage} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1">
                                  Homepage
                                </a>
                              )}
                              {plugin.repository && (
                                <a href={plugin.repository} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1">
                                  Repository
                                </a>
                              )}
                            </div>
                          )}

                          {/* Display contributions if any */}
                          {plugin.contributes && (
                            <div className="mt-3 pt-3 border-t border-white/5 flex gap-2 flex-wrap">
                              {plugin.contributes.languages?.map(lang => (
                                <span key={lang.id} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs border border-blue-500/20">
                                  {(t as any).languageLabel || "Language"}: {lang.label}
                                </span>
                              ))}
                              {plugin.contributes.themes?.map(theme => (
                                <span key={theme.id} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs border border-purple-500/20">
                                  {(t as any).themeLabel || "Theme"}: {theme.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {pluginTab === "settings" && (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-slate-300">
                          {t.pluginPath}
                        </label>
                        <button
                          onClick={() => {
                            try {
                              invoke("open_plugin_dir", { pluginPath: localSettings.pluginPath });
                            } catch (e) {
                              console.error("Tauri invoke not available:", e);
                            }
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                        >
                          <FolderOpen size={14} />
                          {(t as any).openDirectory || "Open Directory"}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={localSettings.pluginPath}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              pluginPath: e.target.value,
                            })
                          }
                          placeholder="/path/to/plugins"
                          className="glass-input flex-1 rounded-lg py-2 px-3 text-sm text-white outline-none bg-black/40 border border-white/10 hover:border-white/20 focus:border-emerald-500 transition-colors"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {(t as any).desc_pluginPath}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <h3 className="text-lg font-medium text-white mb-4">{(t as any).installFromUrl}</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pluginUrl}
                        onChange={(e) => setPluginUrl(e.target.value)}
                        placeholder="https://github.com/user/repo/releases/download/v1.0.0/plugin.zip"
                        className="glass-input flex-1 rounded-lg py-2 px-3 text-sm text-white outline-none bg-black/40 border border-white/10 hover:border-white/20 focus:border-emerald-500 transition-colors"
                        disabled={isInstallingPlugin}
                      />
                      <button
                        onClick={handleInstallPlugin}
                        disabled={isInstallingPlugin || !pluginUrl.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {isInstallingPlugin ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Download size={16} />
                        )}
                        {(t as any).install}
                      </button>
                    </div>
                    {installPluginError && (
                      <p className="text-xs text-red-400 mt-2">{installPluginError}</p>
                    )}
                    {installPluginSuccess && (
                      <p className="text-xs text-emerald-400 mt-2">{installPluginSuccess}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      {(t as any).desc_installFromUrl}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMenu === "rendering" && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {t.aurora}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {t.desc_aurora}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        showAurora: !localSettings.showAurora,
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.showAurora ? "bg-emerald-500" : "bg-slate-700"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${localSettings.showAurora ? "left-7" : "left-1"}`}
                    />
                  </button>
                </div>

                {localSettings.showAurora && (
                  <div className="pl-4 border-l-2 border-white/10 space-y-4 mb-6">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        {(t as any).auroraSpeed} (
                        {localSettings.auroraSpeed.toFixed(1)}x)
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="5.0"
                        step="0.1"
                        value={localSettings.auroraSpeed}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            auroraSpeed: parseFloat(e.target.value),
                          })
                        }
                        className="w-full max-w-md accent-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10">
                  <label className="block text-sm font-medium text-white mb-2">
                    {(t as any).backgroundImage}
                  </label>
                  <div className="flex items-center gap-4">
                    {localSettings.backgroundImage && (
                      <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-white/20 group">
                        <img
                          src={localSettings.backgroundImage}
                          alt="Background"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() =>
                            setLocalSettings({
                              ...localSettings,
                              backgroundImage: null,
                            })
                          }
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors border border-white/10 flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setLocalSettings({
                                ...localSettings,
                                backgroundImage: event.target?.result as string,
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <span>Upload Image</span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {(t as any).desc_backgroundImage}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {t.glass}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {t.desc_glass}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setLocalSettings({
                        ...localSettings,
                        glassmorphism: !localSettings.glassmorphism,
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.glassmorphism ? "bg-emerald-500" : "bg-slate-700"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${localSettings.glassmorphism ? "left-7" : "left-1"}`}
                    />
                  </button>
                </div>

                {localSettings.glassmorphism && (
                  <div className="pl-4 border-l-2 border-white/10 space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        {t.glassOpacity} (
                        {Math.round(localSettings.glassOpacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={localSettings.glassOpacity}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            glassOpacity: parseFloat(e.target.value),
                          })
                        }
                        className="w-full max-w-md accent-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">
                        {t.glassBlur} ({localSettings.glassBlur}px)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="1"
                        value={localSettings.glassBlur}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            glassBlur: parseInt(e.target.value),
                          })
                        }
                        className="w-full max-w-md accent-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save / Discard Footer */}
      {hasChanges && (
        <div className="absolute bottom-0 right-0 left-64 p-4 border-t border-white/10 backdrop-blur-xl bg-black/40 flex justify-end gap-3 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <button
            onClick={handleDiscard}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {t.discard}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-colors"
          >
            {t.save}
          </button>
        </div>
      )}
    </div>
  );
};
