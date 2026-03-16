import React, { useState } from "react";
import { AppSettings, ColorSchemeConfig } from "../../types";
import { CustomSelect } from "../common/CustomSelect";

interface AppearancePanelProps {
  localSettings: AppSettings;
  setLocalSettings: (settings: AppSettings) => void;
  activeColorScheme: ColorSchemeConfig;
  allColorSchemes: ColorSchemeConfig[];
  t: any;
}

export const AppearancePanel: React.FC<AppearancePanelProps> = ({
  localSettings,
  setLocalSettings,
  activeColorScheme,
  allColorSchemes,
  t,
}) => {
  const [isColorSchemeDropdownOpen, setIsColorSchemeDropdownOpen] =
    useState(false);
  const [availableFonts, setAvailableFonts] = useState([
    { value: "JetBrains Mono", label: "JetBrains Mono" },
    {
      value: "ComicShannsMono Nerd Font Mono",
      label: "ComicShannsMono Nerd Font Mono",
    },
    { value: "Consolas", label: "Consolas" },
    { value: "Fira Code", label: "Fira Code" },
    { value: "monospace", label: "System Monospace" },
  ]);

  React.useEffect(() => {
    const loadSystemFonts = async () => {
      if ('queryLocalFonts' in window) {
        try {
          const localFonts = await (window as any).queryLocalFonts();
          const fontNames = Array.from(new Set(localFonts.map((f: any) => f.family))) as string[];
          
          const newFonts = fontNames.map(name => ({ value: name, label: name }));
          
          // Merge built-in fonts with system fonts, avoiding duplicates
          const mergedFonts = [...availableFonts];
          for (const newFont of newFonts) {
            if (!mergedFonts.some(f => f.value === newFont.value)) {
              mergedFonts.push(newFont);
            }
          }
          
          setAvailableFonts(mergedFonts);
        } catch (err) {
          console.error("无法获取系统字体:", err);
        }
      }
    };

    loadSystemFonts();
  }, []); // Run once on mount

  return (
    <div className="space-y-6">
      {/* Preview Window */}
      <div
        className="mb-6 p-4 rounded-xl border border-white/10 font-mono text-sm shadow-inner transition-colors duration-300"
        style={{
          backgroundColor: activeColorScheme.colors.bg,
          color: activeColorScheme.colors.fg,
          fontFamily: localSettings.fontFamily,
          fontSize: `${localSettings.fontSize}px`,
          lineHeight: localSettings.lineHeight,
        }}
      >
        <div style={{ color: activeColorScheme.colors.purple }}>
          [System] Serial Port COM3 opened at 115200 bps.
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: activeColorScheme.colors.green }}>
            &gt; AT+GMR
          </span>
        </div>
        <div style={{ color: activeColorScheme.colors.fg }}>AT+GMR</div>
        <div style={{ color: activeColorScheme.colors.fg }}>[Response] OK</div>
        <div style={{ color: activeColorScheme.colors.fg }}>
          [Response] VERSION: 2.0.0
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span style={{ color: activeColorScheme.colors.green }}>
            &gt; AT+CIPSTATUS
          </span>
          <span
            className="w-2 h-4 bg-white/50 animate-pulse inline-block"
            style={{
              borderRadius:
                localSettings.cursorShape === "block"
                  ? "0px"
                  : localSettings.cursorShape === "bar"
                    ? "2px"
                    : "0px",
              width:
                localSettings.cursorShape === "block"
                  ? "8px"
                  : localSettings.cursorShape === "bar"
                    ? "2px"
                    : "8px",
              height: localSettings.cursorShape === "underline" ? "2px" : "1em",
              verticalAlign:
                localSettings.cursorShape === "underline" ? "bottom" : "middle",
              backgroundColor: activeColorScheme.colors.fg,
            }}
          ></span>
        </div>
      </div>

      {/* Color Scheme Dropdown */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-5">
        <div
          className="relative"
          tabIndex={0}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsColorSchemeDropdownOpen(false);
            }
          }}
        >
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t.colorScheme}
          </label>
          <div
            className="glass-input w-full max-w-md rounded-lg py-2 px-3 text-sm text-white outline-none bg-black/40 border border-white/10 hover:border-white/20 focus:border-emerald-500 transition-colors cursor-pointer flex items-center justify-between"
            onClick={() =>
              setIsColorSchemeDropdownOpen(!isColorSchemeDropdownOpen)
            }
          >
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
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
                    className="w-2 h-3 rounded-sm"
                    style={{
                      backgroundColor: (activeColorScheme.colors as any)[
                        colorKey
                      ],
                    }}
                  />
                ))}
              </div>
              <span>{activeColorScheme.name}</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform ${isColorSchemeDropdownOpen ? "rotate-180" : ""}`}
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

          {isColorSchemeDropdownOpen && (
            <div className="absolute z-50 w-full max-w-md mt-1 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto">
              {allColorSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/10 ${localSettings.colorScheme === scheme.id ? "bg-white/5" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setLocalSettings({
                      ...localSettings,
                      colorScheme: scheme.id,
                    });
                    setIsColorSchemeDropdownOpen(false);
                  }}
                >
                  <div className="flex gap-0.5">
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
                        className="w-2 h-3 rounded-sm"
                        style={{
                          backgroundColor: (scheme.colors as any)[colorKey],
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-white">{scheme.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Font */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t.fontFamily}
          </label>
          <CustomSelect
            value={localSettings.fontFamily}
            options={availableFonts}
            onChange={(val) =>
              setLocalSettings({ ...localSettings, fontFamily: val as string })
            }
            className="max-w-md"
          />
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t.fontSize}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="24"
                step="1"
                value={localSettings.fontSize}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    fontSize: parseInt(e.target.value),
                  })
                }
                className="flex-1 accent-emerald-500"
              />
              <span className="text-sm text-slate-400 w-8">
                {localSettings.fontSize}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t.lineHeight}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="2"
                step="0.1"
                value={localSettings.lineHeight}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    lineHeight: parseFloat(e.target.value),
                  })
                }
                className="flex-1 accent-emerald-500"
              />
              <span className="text-sm text-slate-400 w-8">
                {localSettings.lineHeight}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cursor */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t.cursorShape}
          </label>
          <CustomSelect
            value={localSettings.cursorShape}
            options={[
              { value: "bar", label: (t as any).cursor_bar },
              { value: "block", label: (t as any).cursor_block },
              { value: "underline", label: (t as any).cursor_underline },
            ]}
            onChange={(val) =>
              setLocalSettings({ ...localSettings, cursorShape: val as any })
            }
            className="max-w-xs"
          />
        </div>
      </div>
    </div>
  );
};
