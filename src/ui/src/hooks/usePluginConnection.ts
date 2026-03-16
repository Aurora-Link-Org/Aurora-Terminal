import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const usePluginConnection = () => {
  const [connected, setConnected] = useState(false);
  const connectionIdRef = useRef<string>("");
  const unlistenRxRef = useRef<UnlistenFn | null>(null);
  const unlistenDiscRef = useRef<UnlistenFn | null>(null);

  const connect = async (
    protocol: string,
    settings: Record<string, any>,
    onData: (data: Uint8Array) => void,
    onDisconnect: () => void
  ) => {
    try {
      if (isTauri) {
        // 1. Call Rust backend to open connection
        const connectionId = await invoke<string>("plugin_connect", { protocol, settings });
        connectionIdRef.current = connectionId;

        // 2. Listen for plugin data
        unlistenRxRef.current = await listen<{ id: string; data: number[] }>(
          "plugin-rx",
          (event) => {
            if (event.payload.id === connectionId) {
              onData(new Uint8Array(event.payload.data));
            }
          }
        );

        // 3. Listen for plugin disconnect
        unlistenDiscRef.current = await listen<string>(
          "plugin-disconnected",
          (event) => {
            if (event.payload === connectionId) {
              setConnected(false);
              connectionIdRef.current = "";
              onDisconnect();
            }
          }
        );
      } else {
        // Mock
        const mockId = `mock-${protocol}-${Date.now()}`;
        connectionIdRef.current = mockId;
        console.log(`[Mock] Connected to ${protocol} with settings:`, settings);
        const mockInterval = setInterval(() => {
          if (connected) {
            onData(new TextEncoder().encode(`[Mock] ${protocol} Data\n`));
          }
        }, 2000);
        unlistenRxRef.current = () => clearInterval(mockInterval);
      }

      setConnected(true);
      return true;
    } catch (error) {
      console.error(`Failed to connect to ${protocol}:`, error);
      if (unlistenRxRef.current) unlistenRxRef.current();
      if (unlistenDiscRef.current) unlistenDiscRef.current();
      unlistenRxRef.current = null;
      unlistenDiscRef.current = null;
      return false;
    }
  };

  const disconnect = async () => {
    try {
      if (isTauri && connectionIdRef.current) {
        await invoke("plugin_disconnect", { id: connectionIdRef.current }).catch(
          console.error
        );
      } else if (!isTauri) {
        console.log(`[Mock] Disconnected from ${connectionIdRef.current}`);
      }
      if (unlistenRxRef.current) unlistenRxRef.current();
      if (unlistenDiscRef.current) unlistenDiscRef.current();
      unlistenRxRef.current = null;
      unlistenDiscRef.current = null;
    } catch (error) {
      console.error("Failed to disconnect plugin:", error);
    } finally {
      setConnected(false);
      connectionIdRef.current = "";
    }
  };

  const send = async (data: Uint8Array) => {
    if (connected && connectionIdRef.current) {
      try {
        if (isTauri) {
          await invoke("plugin_send", {
            id: connectionIdRef.current,
            data: Array.from(data),
          });
        } else {
          console.log(
            `[Mock] Sent to ${connectionIdRef.current}:`,
            new TextDecoder().decode(data)
          );
        }
      } catch (error) {
        console.error("Failed to send plugin data:", error);
      }
    }
  };

  return {
    connected,
    connect,
    disconnect,
    send,
  };
};
