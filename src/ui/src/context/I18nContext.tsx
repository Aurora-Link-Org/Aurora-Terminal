import React, { createContext, useContext, useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "./AppContext";
import { Language, PluginManifest } from "../types";

export interface LanguageOption {
  id: string;
  label: string;
  nativeLabel?: string;
}

export interface I18nContextType {
  t: (key: string, defaultValue?: string) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
  availableLanguages: LanguageOption[];
  plugins: PluginManifest[];
  reloadPlugins: () => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { settings, updateSettings } = useAppContext();
  const [language, setLanguageState] = useState<Language>(
    (settings.language as Language) || "en-US",
  );
  const [availableLanguages, setAvailableLanguages] = useState<
    LanguageOption[]
  >([{ id: "en-US", label: "English", nativeLabel: "English" }]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);

  const reloadPlugins = () => {
    // Load all plugins and extract languages
    const processPlugins = (loadedPlugins: PluginManifest[]) => {
      setPlugins(loadedPlugins);
      const langs: LanguageOption[] = [
        { id: "en-US", label: "English", nativeLabel: "English" },
      ];
      loadedPlugins.forEach((plugin) => {
        if (plugin.contributes?.languages) {
          plugin.contributes.languages.forEach((lang) => {
            if (!langs.find((l) => l.id === lang.id)) {
              langs.push({
                id: lang.id,
                label: lang.label,
                nativeLabel: lang.nativeLabel,
              });
            }
          });
        }
      });
      setAvailableLanguages(langs);
    };

    const isTauri =
      typeof window !== "undefined" &&
      ("__TAURI_INTERNALS__" in window || "__TAURI_IPC__" in window);

    if (isTauri) {
      try {
        invoke<PluginManifest[]>("scan_plugins", {
          pluginPath: settings.pluginPath,
        })
          .then(processPlugins)
          .catch((e) => {
            console.error("Failed to scan plugins via Tauri:", e);
            // Fallback to mock data for web preview
            processPlugins([
              {
                id: "mock-zh-cn",
                name: "Chinese Language Pack",
                version: "1.0.0",
                author: "Mock Author",
                description: "Mock Chinese translation for web preview",
                homepage: "https://example.com/zh-cn",
                contributes: {
                  languages: [
                    {
                      id: "zh-CN",
                      label: "Chinese",
                      nativeLabel: "简体中文",
                      path: "zh-CN.json",
                    },
                  ],
                },
              },
            ]);
          });
      } catch (error) {
        console.error("Tauri invoke not available:", error);
        // Fallback to mock data for web preview
        processPlugins([
          {
            id: "mock-zh-cn",
            name: "Chinese Language Pack",
            version: "1.0.0",
            author: "Mock Author",
            description: "Mock Chinese translation for web preview",
            homepage: "https://example.com/zh-cn",
            contributes: {
              languages: [
                {
                  id: "zh-CN",
                  label: "Chinese",
                  nativeLabel: "简体中文",
                  path: "zh-CN.json",
                },
              ],
            },
          },
        ]);
      }
    } else {
      // Fallback to mock data for web preview
      processPlugins([
        {
          id: "mock-zh-cn",
          name: "Chinese Language Pack",
          version: "1.0.0",
          author: "Mock Author",
          description: "Mock Chinese translation for web preview",
          homepage: "https://example.com/zh-cn",
          contributes: {
            languages: [
              {
                id: "zh-CN",
                label: "Chinese",
                nativeLabel: "简体中文",
                path: "zh-CN.json",
              },
            ],
          },
        },
      ]);
    }
  };

  useEffect(() => {
    reloadPlugins();
  }, [settings.pluginPath]);

  useEffect(() => {
    if (language === "en-US") {
      setTranslations({});
      return;
    }

    // Find the plugin that provides this language
    let targetPlugin: PluginManifest | undefined;
    let assetPath: string | undefined;

    for (const plugin of plugins) {
      const langContrib = plugin.contributes?.languages?.find(
        (l) => l.id === language,
      );
      if (langContrib) {
        targetPlugin = plugin;
        assetPath = langContrib.path;
        break;
      }
    }

    if (targetPlugin && targetPlugin.id === "mock-zh-cn") {
      setTranslations({
        "menu.file": "文件",
        "menu.edit": "编辑",
        "menu.view": "查看",
        "menu.help": "帮助",
        "action.connect": "连接",
        "action.disconnect": "断开连接",
        startup: "启动",
        interaction: "交互",
        appearance: "外观",
        colorScheme: "配色方案",
        rendering: "渲染",
        plugins: "插件",
        language: "语言",
        fontFamily: "字体",
        fontSize: "字号",
        lineHeight: "行高",
        glass: "毛玻璃效果",
        glassOpacity: "背景不透明度",
        glassBlur: "模糊半径",
        baud: "波特率",
        aurora: "极光背景效果",
        cursorShape: "光标形状",
        cursorBlink: "光标闪烁",
        scrollbackLines: "回滚行数",
        copyOnSelect: "选中时复制",
        pasteOnRightClick: "右键粘贴",
        showTimestamp: "显示时间戳",
        save: "保存",
        discard: "放弃更改",
        pluginPath: "插件路径",
        newScheme: "新建方案",
        duplicateScheme: "复制方案",
        deleteScheme: "删除方案",
        editScheme: "编辑方案",
        schemeName: "方案名称",
        colors: "颜色",
        color_bg: "背景",
        color_fg: "默认文本",
        color_black: "时间戳",
        color_red: "错误信息",
        color_green: "接收数据",
        color_yellow: "警告信息",
        color_blue: "发送数据",
        color_purple: "数字/十六进制",
        color_cyan: "系统信息",
        color_white: "高亮文本",
        desc_baud: "打开新串口连接时的默认波特率。",
        desc_copyOnSelect: "选中时自动将文本复制到剪贴板。",
        desc_pasteOnRightClick: "在终端中右键单击时从剪贴板粘贴。",
        desc_showTimestamp: "在终端日志中显示时间戳。",
        desc_aurora: "启用硬件加速的动态流体背景效果。",
        desc_glass: "在面板上启用毛玻璃效果。",
        auroraSpeed: "极光流动速度",
        backgroundImage: "自定义背景图片",
        desc_backgroundImage: "上传图片作为背景（将覆盖极光效果）。",
        cursor_bar: "条形 ( | )",
        cursor_block: "块形 ( █ )",
        cursor_underline: "下划线 ( _ )",
        desc_pluginPath: "指定加载外部插件的目录路径。",
        installFromUrl: "通过 URL 安装",
        install: "安装",
        desc_installFromUrl: "输入插件 ZIP 文件的直接下载链接，将自动下载并解压。",
        installedPlugins: "已安装的插件",
        noPluginsFound: "在指定目录中未找到插件。",
        current: "当前",
        newSchemeDefault: "新方案",
        copySuffix: " 副本",
        port: "端口",
        dataBits: "数据位",
        stopBits: "停止位",
        parity: "校验位",
        host: "主机",
        clear: "清空",
        send: "发送",
        placeholder: "输入命令...",
        widgets: "小组件",
        protocol: "协议",
        hexRx: "Hex 接收",
        hexTx: "Hex 发送",
        loopSend: "循环发送",
        ms: "毫秒",
        rx: "接收",
        tx: "发送",
        connect: "连接",
        disconnect: "断开连接",
        // Keep plugin system keys for UI consistency
        reloadPlugins: "重新加载插件",
        explore: "探索",
        installed: "已安装",
        settingsTab: "设置",
        marketplace: "市场",
        openDirectory: "打开目录",
        languageLabel: "语言",
        themeLabel: "主题",
        searchPlugins: "搜索插件",
        installing: "正在安装",
        update: "更新",
        registryError: "无法加载插件注册表。请检查您的网络连接或注册表 URL。",
        deleteConfirm: "确定删除？",
        installSuccess: "插件安装成功！请重启应用或重新加载插件。",
        invalidUrl: "请输入有效的 URL",
        addWidget: "添加",
        noWidgets: "尚未添加小组件。在此处添加图表、滑块或按钮。",
        typeLabel: "类型"
      });
      return;
    }

    if (targetPlugin && targetPlugin.__pluginPath && assetPath) {
      try {
        invoke<string>("read_plugin_asset", {
          pluginPath: targetPlugin.__pluginPath,
          assetPath: assetPath,
        })
          .then((jsonStr) => {
            try {
              const parsed = JSON.parse(jsonStr);
              // Handle both flat JSON and JSON with a "translations" object
              const translationsData = parsed.translations
                ? parsed.translations
                : parsed;
              setTranslations(translationsData);
            } catch (e) {
              console.error("Failed to parse language pack:", e);
            }
          })
          .catch((e) => {
            console.error("Failed to load language pack:", e);
            setTranslations({});
          });
      } catch (error) {
        console.error("Tauri invoke not available:", error);
        setTranslations({});
      }
    } else {
      setTranslations({});
    }
  }, [language, plugins]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    updateSettings({ language: lang });
  };

  const t = (key: string, defaultValue?: string) => {
    return translations[key] || defaultValue || key;
  };

  return (
    <I18nContext.Provider
      value={{
        t,
        language,
        setLanguage,
        availableLanguages,
        plugins,
        reloadPlugins,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
};
