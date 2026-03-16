import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const useSerial = () => {
  const [connected, setConnected] = useState(false);
  const portNameRef = useRef<string>("");
  const unlistenRef = useRef<UnlistenFn | null>(null);

  const connect = async (
    portName: string,
    baudRate: number,
    onData: (data: Uint8Array) => void,
  ) => {
    try {
      if (isTauri) {
        // 1. Listen for serial data events from Rust backend
        unlistenRef.current = await listen<{ port: string; data: number[] }>(
          "serial-rx",
          (event) => {
            if (event.payload.port === portName) {
              onData(new Uint8Array(event.payload.data));
            }
          },
        );

        // 2. Call Rust backend open_port command
        await invoke("open_port", { portName, baudRate });
      } else {
        // Mock connection for browser environment
        console.log(`[Mock] Connected to ${portName} at ${baudRate} bps`);
        const mockInterval = setInterval(() => {
          if (connected) {
            onData(new TextEncoder().encode(`[Mock] Data from ${portName}\n`));
          }
        }, 2000);
        unlistenRef.current = () => clearInterval(mockInterval);
      }

      portNameRef.current = portName;
      setConnected(true);
      return true;
    } catch (error) {
      console.error("Failed to connect to serial port:", error);
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
      return false;
    }
  };

  const disconnect = async () => {
    try {
      if (isTauri && portNameRef.current) {
        await invoke("close_port", { portName: portNameRef.current }).catch(
          console.error,
        );
      } else if (!isTauri) {
        console.log(`[Mock] Disconnected from ${portNameRef.current}`);
      }
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setConnected(false);
      portNameRef.current = "";
    }
  };

  const send = async (data: Uint8Array) => {
    if (connected && portNameRef.current) {
      try {
        if (isTauri) {
          await invoke("send_data", {
            portName: portNameRef.current,
            data: Array.from(data),
          });
        } else {
          console.log(
            `[Mock] Sent to ${portNameRef.current}:`,
            new TextDecoder().decode(data),
          );
        }
      } catch (error) {
        console.error("Failed to send data:", error);
      }
    } else {
      console.log("Mock send:", data);
    }
  };

  return {
    connected,
    setConnected,
    connect,
    disconnect,
    send,
  };
};
