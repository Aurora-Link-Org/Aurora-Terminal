import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Protocol, Tab } from "../../types";
import { useI18n } from "../../context/I18nContext";
import {
  Terminal as TerminalIcon,
  Plug,
  Activity,
  Binary,
  Ban,
  CheckCircle,
  Monitor,
  ArrowDown,
  ArrowUp,
  Play,
  Square,
} from "lucide-react";
import { CustomSelect } from "../common/CustomSelect";
import { Button } from "../common/Button";

const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

interface ConnectionPanelProps {
  tab: Tab;
  tabId: string;
  connected: boolean;
  handleConnect: () => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;
  t: any;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  tab,
  tabId,
  connected,
  handleConnect,
  updateTab,
  t,
}) => {
  const { plugins } = useI18n();
  const [isPortDropdownOpen, setIsPortDropdownOpen] = useState(false);
  const [isBaudDropdownOpen, setIsBaudDropdownOpen] = useState(false);
  const baudRates = [
    4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600,
  ];

  // Save serial ports list from Rust backend
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);

  // Function to fetch serial ports
  const fetchSerialPorts = async () => {
    try {
      if (isTauri) {
        // Call Rust backend get_ports command
        const ports = await invoke<string[]>("get_ports");
        setAvailablePorts(ports);
      } else {
        // Mock data for browser environment
        setAvailablePorts(["COM1", "COM2", "COM3", "/dev/ttyUSB0"]);
      }
    } catch (error) {
      console.error("Failed to fetch serial ports:", error);
    }
  };

  // Fetch ports when dropdown opens and not connected
  useEffect(() => {
    if (isPortDropdownOpen && !connected) {
      fetchSerialPorts();
    }
  }, [isPortDropdownOpen, connected]);

  return (
    <div className="w-64 border-r border-white/10 bg-black/20 flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-5">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <TerminalIcon size={12} />
            {t.protocol}
          </label>
          <CustomSelect
            value={tab.type}
            options={[
              { value: "serial", label: "Serial" },
              ...plugins.flatMap(p => p.contributes?.protocols?.map(proto => ({
                value: proto.id,
                label: proto.label
              })) || [])
            ]}
            onChange={(val) => updateTab(tabId, { type: val as Protocol })}
            disabled={connected}
          />
        </div>

        {tab.type === "serial" ? (
          <>
            <div className="space-y-1.5 relative">
              <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Plug size={12} />
                {t.port}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="COM1 / /dev/ttyUSB0"
                  value={tab.serialSettings.port}
                  onChange={(e) =>
                    updateTab(tabId, {
                      serialSettings: {
                        ...tab.serialSettings,
                        port: e.target.value,
                      },
                    })
                  }
                  onFocus={() => setIsPortDropdownOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setIsPortDropdownOpen(false), 200)
                  }
                  className="w-full glass-input text-sm py-2 px-3 pr-8 rounded-lg text-white outline-none border border-white/10 hover:border-white/20 focus:border-emerald-500 transition-all duration-300 ease-out bg-black/40"
                  disabled={connected}
                />
                <div
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-white p-1"
                  onClick={() =>
                    !connected && setIsPortDropdownOpen(!isPortDropdownOpen)
                  }
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isPortDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Serial port list dropdown */}
              {isPortDropdownOpen && !connected && (
                <div className="absolute z-50 w-full mt-1 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {availablePorts.length > 0 ? (
                    availablePorts.map((port) => (
                      <div
                        key={port}
                        className="px-3 py-2 text-sm text-white cursor-pointer hover:bg-white/10"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          updateTab(tabId, {
                            serialSettings: { ...tab.serialSettings, port },
                          });
                          setIsPortDropdownOpen(false);
                        }}
                      >
                        {port}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-xs text-center text-slate-500">
                      No serial ports detected
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Activity size={12} />
                {t.baud}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={tab.serialSettings.baudRate || ""}
                  onChange={(e) =>
                    updateTab(tabId, {
                      serialSettings: {
                        ...tab.serialSettings,
                        baudRate: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  onFocus={() => setIsBaudDropdownOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setIsBaudDropdownOpen(false), 200)
                  }
                  className="w-full glass-input text-sm py-2 px-3 pr-8 rounded-lg text-white outline-none border border-white/10 hover:border-white/20 focus:border-emerald-500 transition-colors bg-black/40"
                  disabled={connected}
                />
                <div
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-white p-1"
                  onClick={() =>
                    !connected && setIsBaudDropdownOpen(!isBaudDropdownOpen)
                  }
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isBaudDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {isBaudDropdownOpen && !connected && (
                <div className="absolute z-50 w-full mt-1 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {baudRates.map((baud) => (
                    <div
                      key={baud}
                      className="px-3 py-2 text-sm text-white cursor-pointer hover:bg-white/10"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        updateTab(tabId, {
                          serialSettings: {
                            ...tab.serialSettings,
                            baudRate: baud,
                          },
                        });
                        setIsBaudDropdownOpen(false);
                      }}
                    >
                      {baud}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Binary size={12} />
                {t.dataBits}
              </label>
              <CustomSelect
                value={tab.serialSettings.dataBits}
                options={[
                  { value: 5, label: "5" },
                  { value: 6, label: "6" },
                  { value: 7, label: "7" },
                  { value: 8, label: "8" },
                ]}
                onChange={(val) =>
                  updateTab(tabId, {
                    serialSettings: {
                      ...tab.serialSettings,
                      dataBits: val as any,
                    },
                  })
                }
                disabled={connected}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Ban size={12} />
                {t.stopBits}
              </label>
              <CustomSelect
                value={tab.serialSettings.stopBits}
                options={[
                  { value: 1, label: "1" },
                  { value: 1.5, label: "1.5" },
                  { value: 2, label: "2" },
                ]}
                onChange={(val) =>
                  updateTab(tabId, {
                    serialSettings: {
                      ...tab.serialSettings,
                      stopBits: val as any,
                    },
                  })
                }
                disabled={connected}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <CheckCircle size={12} />
                {t.parity}
              </label>
              <CustomSelect
                value={tab.serialSettings.parity}
                options={[
                  { value: "none", label: "None" },
                  { value: "even", label: "Even" },
                  { value: "odd", label: "Odd" },
                  { value: "mark", label: "Mark" },
                  { value: "space", label: "Space" },
                ]}
                onChange={(val) =>
                  updateTab(tabId, {
                    serialSettings: {
                      ...tab.serialSettings,
                      parity: val as any,
                    },
                  })
                }
                disabled={connected}
              />
            </div>
          </>
        ) : (
          <>
            {plugins
              .flatMap((p) => p.contributes?.protocols || [])
              .find((p) => p.id === tab.type)
              ?.settings?.map((setting) => (
                <div key={setting.id} className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <Monitor size={12} />
                    {setting.label}
                  </label>
                  {setting.type === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={tab.customSettings?.[setting.id] ?? setting.default ?? false}
                      onChange={(e) =>
                        updateTab(tabId, {
                          customSettings: {
                            ...tab.customSettings,
                            [setting.id]: e.target.checked,
                          },
                        })
                      }
                      disabled={connected}
                    />
                  ) : (
                    <input
                      type={setting.type === "password" ? "password" : setting.type === "number" ? "number" : "text"}
                      value={tab.customSettings?.[setting.id] ?? setting.default ?? ""}
                      onChange={(e) =>
                        updateTab(tabId, {
                          customSettings: {
                            ...tab.customSettings,
                            [setting.id]: setting.type === "number" ? parseFloat(e.target.value) : e.target.value,
                          },
                        })
                      }
                      className="w-full glass-input text-sm py-2 px-3 rounded-lg text-white outline-none border border-white/10 hover:border-white/20 focus:border-emerald-500 transition-all duration-300 ease-out bg-black/40"
                      disabled={connected}
                    />
                  )}
                </div>
              ))}
          </>
        )}
      </div>

      {/* Rx/Tx Counters */}
      <div className="px-4 py-2 border-t border-white/10 bg-black/30 text-xs font-mono text-slate-400 flex justify-between">
        <div className="flex items-center gap-1.5">
          <ArrowDown size={12} className="text-emerald-400" />
          <span>
            {t.rx}: {tab.rxCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ArrowUp size={12} className="text-blue-400" />
          <span>
            {t.tx}: {tab.txCount}
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 bg-black/40">
        <Button
          onClick={handleConnect}
          variant={connected ? "danger" : "primary"}
          icon={connected ? <Square size={16} /> : <Play size={16} />}
          className="w-full"
        >
          {connected ? t.disconnect : t.connect}
        </Button>
      </div>
    </div>
  );
};
