import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useI18n } from "../../context/I18nContext";
import { Trash2, LayoutDashboard, Repeat, Hash } from "lucide-react";
import { ConnectionPanel } from "./ConnectionPanel";
import { LogViewer } from "./LogViewer";
import { InputArea } from "./InputArea";
import { WidgetsPanel } from "./WidgetsPanel";
import { useSerial } from "../../hooks/useSerial";
import { usePluginConnection } from "../../hooks/usePluginConnection";

export const TerminalTab: React.FC<{ tabId: string }> = ({ tabId }) => {
  const {
    tabs,
    settings,
    appendLog,
    clearLogs,
    updateTab,
    activeTabId,
    incrementRx,
    incrementTx,
    resetCounters,
  } = useAppContext();
  const { t: translate } = useI18n();
  const tab = tabs.find((t) => t.id === tabId);
  const [input, setInput] = useState("");
  const [showWidgets, setShowWidgets] = useState(false);

  const [hexRx, setHexRx] = useState(false);
  const hexRxRef = useRef(hexRx);
  useEffect(() => {
    hexRxRef.current = hexRx;
  }, [hexRx]);

  const decoderRef = useRef(new TextDecoder());

  const [hexTx, setHexTx] = useState(false);
  const [loopSend, setLoopSend] = useState(false);
  const [loopInterval, setLoopInterval] = useState(1000);
  const loopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const serial = useSerial();
  const pluginConn = usePluginConnection();

  const connected = tab?.type === "serial" ? serial.connected : pluginConn.connected;

  const t = {
    connect: translate("connect", "Connect"),
    disconnect: translate("disconnect", "Disconnect"),
    port: translate("port", "Port"),
    baud: translate("baud", "Baud"),
    dataBits: translate("dataBits", "Data Bits"),
    stopBits: translate("stopBits", "Stop Bits"),
    parity: translate("parity", "Parity"),
    host: translate("host", "Host"),
    clear: translate("clear", "Clear"),
    send: translate("send", "Send"),
    placeholder: translate("placeholder", "Type command..."),
    widgets: translate("widgets", "Widgets"),
    protocol: translate("protocol", "Protocol"),
    hexRx: translate("hexRx", "Hex RX"),
    hexTx: translate("hexTx", "Hex TX"),
    loopSend: translate("loopSend", "Loop Send"),
    ms: translate("ms", "ms"),
    rx: translate("rx", "RX"),
    tx: translate("tx", "TX"),
  };

  useEffect(() => {
    return () => {
      if (loopTimerRef.current) {
        clearInterval(loopTimerRef.current);
      }
      serial.disconnect();
      pluginConn.disconnect();
    };
  }, []);

  const handleSend = async (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const dataToSend = input;

    const timestamp = settings.showTimestamp
      ? `[${new Date().toLocaleTimeString()}] `
      : "";
    appendLog(tabId, `${timestamp}> ${dataToSend}`);
    incrementTx(tabId, dataToSend.length);

    if (!loopSend) {
      setInput("");
    }

    let bytes: Uint8Array;
    if (hexTx) {
      const hexString = dataToSend.replace(/\s/g, "");
      const byteLen = Math.ceil(hexString.length / 2);
      bytes = new Uint8Array(byteLen);
      for (let i = 0; i < byteLen; i++) {
        bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
      }
    } else {
      bytes = new TextEncoder().encode(dataToSend);
    }

    if (tab?.type === "serial") {
      await serial.send(bytes);
    } else {
      await pluginConn.send(bytes);
    }
  };

  useEffect(() => {
    if (loopSend && connected) {
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
      loopTimerRef.current = setInterval(() => {
        handleSend(null);
      }, loopInterval);
    } else {
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
      loopTimerRef.current = null;
    }
  }, [loopSend, connected, loopInterval, input, handleSend]);

  if (!tab) return null;

  const handleDataReceived = (data: Uint8Array) => {
    const ts = settings.showTimestamp
      ? `[${new Date().toLocaleTimeString()}] `
      : "";
    let text = "";
    if (hexRxRef.current) {
      text =
        Array.from(data)
          .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
          .join(" ") + " ";
    } else {
      text = decoderRef.current.decode(data, { stream: true });
    }
    appendLog(tabId, `${ts}${text}`);
    incrementRx(tabId, data.length);
  };

  const handleConnect = async () => {
    if (!connected) {
      resetCounters(tabId);
      if (tab.type === "serial") {
        const baud = tab.serialSettings.baudRate;
        const portName = tab.serialSettings.port;

        if (!portName) {
          appendLog(tabId, "[System] Please select a port first.");
          return;
        }

        const success = await serial.connect(portName, baud, handleDataReceived);

        if (success) {
          updateTab(tabId, { title: `${portName} @ ${baud}` });
          const logMsg = `[System] Connected to ${portName} at ${baud} bps.`;
          appendLog(tabId, logMsg);
        } else {
          appendLog(tabId, "[System] Connection failed or canceled.");
        }
      } else {
        // Plugin connection
        const success = await pluginConn.connect(
          tab.type,
          tab.customSettings || {},
          handleDataReceived,
          () => {
            appendLog(tabId, `[System] ${tab.type.toUpperCase()} Connection closed by server.`);
          }
        );

        if (success) {
          updateTab(tabId, { title: `${tab.type} connection` });
          const logMsg = `[System] Connected via ${tab.type.toUpperCase()}.`;
          appendLog(tabId, logMsg);
        } else {
          appendLog(tabId, `[System] ${tab.type.toUpperCase()} Connection failed.`);
        }
      }
    } else {
      setLoopSend(false);
      if (tab.type === "serial") {
        await serial.disconnect();
      } else {
        await pluginConn.disconnect();
      }
      const logMsg = "[System] Disconnected.";
      appendLog(tabId, logMsg);
    }
  };

  return (
    <div className="flex h-full">
      <ConnectionPanel
        tab={tab}
        tabId={tabId}
        connected={connected}
        handleConnect={handleConnect}
        updateTab={updateTab}
        t={t}
      />

      <div className="flex flex-col flex-1 min-w-0 bg-black/10">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHexRx(!hexRx)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${hexRx ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
            >
              <Hash size={14} />
              {t.hexRx}
            </button>
            <button
              onClick={() => setHexTx(!hexTx)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${hexTx ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
            >
              <Hash size={14} />
              {t.hexTx}
            </button>

            <div className="h-4 w-[1px] bg-white/10 mx-1"></div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLoopSend(!loopSend)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${loopSend ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                disabled={!connected}
              >
                <Repeat size={14} />
                {t.loopSend}
              </button>
              {loopSend && (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={loopInterval}
                    onChange={(e) => setLoopInterval(parseInt(e.target.value))}
                    className="w-16 glass-input py-1 px-2 text-xs rounded text-white bg-black/40 border border-white/10"
                    min="10"
                  />
                  <span className="text-xs text-slate-500">{t.ms}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWidgets(!showWidgets)}
              className={`p-1.5 rounded-md transition-colors ${showWidgets ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
              title={t.widgets}
            >
              <LayoutDashboard size={16} />
            </button>
            <button
              onClick={() => clearLogs(tabId)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
              title={t.clear}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <LogViewer logs={tab.logs} activeTabId={activeTabId} tabId={tabId} />

        <InputArea
          input={input}
          setInput={setInput}
          handleSend={handleSend}
          connected={connected}
          t={t}
        />
      </div>

      {/* Widgets Panel (VOFA+ style) */}
      {showWidgets && (
        <WidgetsPanel tab={tab} tabId={tabId} t={t} />
      )}
    </div>
  );
};

