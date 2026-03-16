import React, { useState } from "react";
import {
  Plus,
  X,
  TerminalSquare,
  Network,
  Settings,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";

export const TopBar = () => {
  const { tabs, activeTabId, addTab, closeTab, setActiveTab, reorderTabs } =
    useAppContext();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderTabs(draggedIndex, index);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "serial":
        return <TerminalSquare size={14} className="text-emerald-400" />;
      case "settings":
        return <Settings size={14} className="text-slate-400" />;
      default:
        return <Network size={14} className="text-blue-400" />;
    }
  };

  return (
    <div className="flex-1 flex items-end gap-1 overflow-x-auto no-scrollbar pt-2">
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDragEnter={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          onClick={() => setActiveTab(tab.id)}
          className={`group flex items-center gap-2 px-4 py-2 min-w-[140px] max-w-[200px] rounded-t-xl cursor-pointer transition-all border border-b-0 select-none ${activeTabId === tab.id ? "bg-slate-900/80 border-white/10 text-white" : "bg-black/20 border-transparent text-slate-400 hover:bg-black/40"} ${draggedIndex === index ? "opacity-50" : "opacity-100"}`}
        >
          {getIcon(tab.type)}
          <span className="text-xs font-medium truncate flex-1 pointer-events-none">
            {tab.title}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            className={`p-0.5 rounded-md hover:bg-white/10 ${activeTabId === tab.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          >
            <X size={12} />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-1 pb-1.5 pl-2">
        <button
          onClick={() => addTab("serial")}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="New Tab"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};
