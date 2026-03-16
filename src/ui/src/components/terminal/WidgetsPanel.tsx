import React from "react";
import { Tab } from "../../types";

interface WidgetsPanelProps {
  tab: Tab;
  tabId: string;
  t: any;
}

export const WidgetsPanel: React.FC<WidgetsPanelProps> = ({ tab, t }) => {
  return (
    <div className="w-80 border-l border-white/10 bg-black/20 flex flex-col">
      <div className="p-3 border-b border-white/10 text-sm font-bold text-slate-300 flex justify-between items-center">
        {t.widgets}
        <button className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30 transition-colors">
          + Add
        </button>
      </div>
      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        {tab.widgets && tab.widgets.length > 0 ? (
          tab.widgets.map((widget) => (
            <div key={widget.id} className="glass-panel p-3 rounded-xl border border-white/10">
              <div className="text-xs font-bold text-slate-300 mb-2">{widget.title}</div>
              <div className="text-xs text-slate-500">
                Type: {widget.type}
              </div>
              {/* Future: Render actual widget component based on widget.type */}
            </div>
          ))
        ) : (
          <div className="glass-panel p-4 rounded-xl border border-white/5 text-center text-slate-500 text-xs">
            No widgets added yet. Add charts, sliders, or buttons here.
          </div>
        )}
      </div>
    </div>
  );
};
