/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { Protocol, Widget, Tab, AppSettings } from "../types";
import { defaultColorSchemes, defaultSettings } from "../constants/theme";

interface AppContextType {
  tabs: Tab[];
  activeTabId: string | null;
  settings: AppSettings;
  previewSettings: AppSettings | null;
  activeSettings: AppSettings;
  setPreviewSettings: (settings: AppSettings | null) => void;
  addTab: (type?: Protocol) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  appendLog: (tabId: string, log: string) => void;
  clearLogs: (tabId: string) => void;
  addWidget: (tabId: string, type: Widget["type"]) => void;
  removeWidget: (tabId: string, widgetId: string) => void;
  incrementRx: (tabId: string, bytes: number) => void;
  incrementTx: (tabId: string, bytes: number) => void;
  resetCounters: (tabId: string) => void;
  reorderTabs: (startIndex: number, endIndex: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: "default-serial",
      title: "Serial",
      type: "serial",
      serialSettings: {
        port: "",
        baudRate: defaultSettings.defaultBaudRate,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
      },
      networkSettings: {
        host: "192.168.1.1",
        port: 8080,
      },
      logs: [
        "[System] Initialized SERIAL connection interface.",
      ],
      widgets: [],
      rxCount: 0,
      txCount: 0,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string | null>(
    "default-serial",
  );
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("aurora_settings");
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
    return defaultSettings;
  });
  const [previewSettings, setPreviewSettings] = useState<AppSettings | null>(
    null,
  );

  const activeSettings = previewSettings || settings;

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("aurora_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const allSchemes = [
      ...defaultColorSchemes,
      ...activeSettings.customColorSchemes,
    ];
    const activeScheme =
      allSchemes.find((s) => s.id === activeSettings.colorScheme) ||
      defaultColorSchemes[0];

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 15, g: 23, b: 42 };
    };

    const rgb = hexToRgb(activeScheme.colors.bg);
    document.documentElement.style.setProperty(
      "--glass-bg",
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${activeSettings.glassOpacity})`,
    );

    document.documentElement.style.setProperty(
      "--glass-blur",
      `${activeSettings.glassmorphism ? activeSettings.glassBlur : 0}px`,
    );
    document.documentElement.style.setProperty(
      "--term-font",
      activeSettings.fontFamily,
    );
    document.documentElement.style.setProperty(
      "--term-size",
      `${activeSettings.fontSize}px`,
    );
    document.documentElement.style.setProperty(
      "--term-lh",
      activeSettings.lineHeight.toString(),
    );

    document.documentElement.style.setProperty(
      "--bg-color",
      activeScheme.colors.bg,
    );
  }, [activeSettings]);

  const addTab = (type: Protocol = "serial") => {
    if (type === "settings") {
      const existingSettingsTab = tabs.find((t) => t.type === "settings");
      if (existingSettingsTab) {
        setActiveTabId(existingSettingsTab.id);
        return;
      }
    }

    const initialLog = `[System] Initialized ${type.toUpperCase()} connection interface.`;

    const newTab: Tab = {
      id: Math.random().toString(36).substring(7),
      title:
        type === "settings"
          ? "Settings"
          : `New ${type.toUpperCase()}`,
      type,
      serialSettings: {
        port: "",
        baudRate: settings.defaultBaudRate,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
      },
      networkSettings: {
        host: "192.168.1.1",
        port: 8080,
      },
      logs: type === "settings" ? [] : [initialLog],
      widgets: [],
      rxCount: 0,
      txCount: 0,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== id);
      if (activeTabId === id) {
        setActiveTabId(
          newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null,
        );
      }
      return newTabs;
    });
  };

  const setActiveTab = (id: string) => setActiveTabId(id);

  const updateTab = (id: string, updates: Partial<Tab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const appendLog = (tabId: string, log: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, logs: [...t.logs, log] } : t)),
    );
  };

  const clearLogs = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, logs: [] } : t)),
    );
  };

  const addWidget = (tabId: string, type: Widget["type"]) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === tabId) {
          const newWidget: Widget = {
            id: Math.random().toString(36).substring(7),
            type,
            title: `New ${type}`,
            config: {},
          };
          return { ...t, widgets: [...t.widgets, newWidget] };
        }
        return t;
      }),
    );
  };

  const removeWidget = (tabId: string, widgetId: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === tabId) {
          return { ...t, widgets: t.widgets.filter((w) => w.id !== widgetId) };
        }
        return t;
      }),
    );
  };

  const incrementRx = (tabId: string, bytes: number) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId ? { ...t, rxCount: t.rxCount + bytes } : t,
      ),
    );
  };

  const incrementTx = (tabId: string, bytes: number) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId ? { ...t, txCount: t.txCount + bytes } : t,
      ),
    );
  };

  const resetCounters = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, rxCount: 0, txCount: 0 } : t)),
    );
  };

  const reorderTabs = (startIndex: number, endIndex: number) => {
    setTabs((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  return (
    <AppContext.Provider
      value={{
        tabs,
        activeTabId,
        settings,
        previewSettings,
        activeSettings,
        setPreviewSettings,
        addTab,
        closeTab,
        setActiveTab,
        updateTab,
        updateSettings,
        appendLog,
        clearLogs,
        addWidget,
        removeWidget,
        incrementRx,
        incrementTx,
        resetCounters,
        reorderTabs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
};
