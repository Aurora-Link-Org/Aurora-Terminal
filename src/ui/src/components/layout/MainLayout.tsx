import { useAppContext } from "../../context/AppContext";
import { AuroraBackground } from "../common/AuroraBackground";
import { TerminalTab } from "../terminal/TerminalTab";
import { SettingsTab } from "../settings/SettingsTab";
import { TopBar } from "./TopBar";
import { Settings } from "lucide-react";

export const MainLayout = () => {
  const { tabs, activeTabId, activeSettings, addTab } = useAppContext();

  return (
    <div
      className="h-screen w-full flex flex-col relative overflow-hidden"
      style={{
        backgroundColor: activeSettings.showAurora
          ? "transparent"
          : "var(--bg-color, #020617)",
        backgroundImage: activeSettings.backgroundImage
          ? `url(${activeSettings.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {activeSettings.showAurora && !activeSettings.backgroundImage && (
        <AuroraBackground speed={activeSettings.auroraSpeed} />
      )}

      <div
        className="h-12 glass-panel border-b-0 border-x-0 rounded-none flex items-end px-2 gap-1 z-10"
      >
        <div
          className="flex items-center gap-2 px-4 pb-2 font-bold text-emerald-400 tracking-wider select-none"
        >
          <span className="text-lg">AuroraSerial</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
            v1.0
          </span>
        </div>

        <TopBar />

        <div className="flex items-center gap-2 pb-2 pr-2">
          <button
            onClick={() => addTab("settings")}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative z-0 flex">
        <div className="flex-1 glass-panel m-2 rounded-xl overflow-hidden shadow-2xl border border-white/10 relative">
          {tabs.length > 0 ? (
            tabs.map((tab) => (
              <div
                key={tab.id}
                className="absolute inset-0"
                style={{ display: activeTabId === tab.id ? "block" : "none" }}
              >
                {tab.type === "settings" ? (
                  <SettingsTab tabId={tab.id} />
                ) : (
                  <TerminalTab tabId={tab.id} />
                )}
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              No active tabs. Open a new connection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
