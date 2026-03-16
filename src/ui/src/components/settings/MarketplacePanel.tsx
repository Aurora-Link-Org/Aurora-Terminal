import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "../../context/I18nContext";
import {
  Download,
  RefreshCw,
  Check,
  Loader2,
  AlertCircle,
  PackageSearch,
  Search,
} from "lucide-react";

export interface RegistryPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  downloadUrl: string;
  iconUrl?: string;
  icon?: string;
}

interface MarketplacePanelProps {
  localPlugins: any[];
  pluginPath: string;
  onInstallSuccess: () => void;
}

const compareVersions = (v1: string, v2: string) => {
  const p1 = v1.split(".").map(Number);
  const p2 = v2.split(".").map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
};

export const MarketplacePanel: React.FC<MarketplacePanelProps> = ({
  localPlugins,
  pluginPath,
  onInstallSuccess,
}) => {
  const { t: translate } = useI18n();
  const t = {
    searchPlugins: translate("searchPlugins", "Search plugins..."),
    installing: translate("installing", "Installing"),
    update: translate("update", "Update"),
    installed: translate("installed", "Installed"),
    install: translate("install", "Install"),
    registryError: translate("registryError", "Failed to load plugin registry. Please check your connection or the registry URL."),
  };
  const [registryPlugins, setRegistryPlugins] = useState<RegistryPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [registryUrl, setRegistryUrl] = useState(
    "https://aurora-link-org.github.io/plugin-registry/registry.json",
  );

  useEffect(() => {
    fetchRegistry();
  }, [registryUrl]);

  const fetchRegistry = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(registryUrl);
      if (!response.ok) throw new Error("Failed to fetch registry");
      const data = await response.json();
      if (Array.isArray(data)) {
        setRegistryPlugins(data);
      } else {
        setRegistryPlugins(data.plugins || []);
      }
    } catch (err) {
      console.error(err);
      setError(
        t.registryError,
      );
      setRegistryPlugins([]);
    } finally {
      setLoading(false);
    }
  };

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleInstallOrUpdate = async (plugin: RegistryPlugin) => {
    setProcessingId(plugin.id);
    setToast({ message: `Installing ${plugin.name}...`, type: "info" });
    try {
      await invoke("install_plugin_from_url", {
        url: plugin.downloadUrl,
        pluginPath: pluginPath,
        metadata: plugin,
      });
      setToast({
        message: `${plugin.name} installed successfully!`,
        type: "success",
      });
      onInstallSuccess();
    } catch (err) {
      console.error("Install failed:", err);
      setToast({
        message: `Failed to install ${plugin.name}: ${err}`,
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPlugins = registryPlugins.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Loader2 size={32} className="animate-spin mb-4 text-emerald-500" />
        <p>Loading marketplace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
        <AlertCircle size={32} className="mb-4" />
        <p>{error}</p>
        <button
          onClick={fetchRegistry}
          className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
              : toast.type === "error"
                ? "bg-red-500/20 border-red-500/50 text-red-400"
                : "bg-blue-500/20 border-blue-500/50 text-blue-400"
          }`}
        >
          {toast.type === "success" ? (
            <Check size={18} />
          ) : toast.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <Loader2 size={18} className="animate-spin" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder={t.searchPlugins}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
          />
        </div>
        <input
          type="text"
          placeholder="Registry URL"
          value={registryUrl}
          onChange={(e) => setRegistryUrl(e.target.value)}
          className="w-1/3 bg-black/40 border border-white/10 rounded-lg py-2 px-4 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
          title="Custom Registry URL"
        />
      </div>

      {filteredPlugins.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <PackageSearch size={48} className="mx-auto mb-3 opacity-20" />
          <p>No plugins found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredPlugins.map((plugin) => {
            const localPlugin = localPlugins.find((p) => p.id === plugin.id);
            const isInstalled = !!localPlugin;
            const hasUpdate =
              isInstalled &&
              compareVersions(plugin.version, localPlugin.version) > 0;
            const isProcessing = processingId === plugin.id;

            return (
              <div
                key={plugin.id}
                className="p-4 rounded-xl border border-white/10 bg-black/20 flex flex-col gap-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                    {(() => {
                      let resolvedIconUrl = plugin.iconUrl || plugin.icon;
                      if (
                        resolvedIconUrl &&
                        !resolvedIconUrl.startsWith("http") &&
                        !resolvedIconUrl.startsWith("data:")
                      ) {
                        // Resolve relative icon path based on registryUrl
                        try {
                          resolvedIconUrl = new URL(resolvedIconUrl, registryUrl).href;
                        } catch (e) {
                          console.error("Failed to resolve icon URL:", e);
                        }
                      }

                      return resolvedIconUrl ? (
                        <img
                          src={resolvedIconUrl}
                          alt={plugin.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            (
                              e.target as HTMLImageElement
                            ).parentElement!.innerHTML =
                              '<div class="text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package-search"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><path d="m7.5 4.27 9 5.15"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/><circle cx="18.5" cy="15.5" r="2.5"/><path d="M20.27 17.27 22 19"/></svg></div>';
                          }}
                        />
                      ) : (
                        <PackageSearch size={28} className="text-slate-400" />
                      );
                    })()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-medium text-white truncate">
                        {plugin.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {plugin.author}
                    </p>
                    <p
                      className="text-sm text-slate-300 mt-2 line-clamp-2"
                      title={plugin.description}
                    >
                      {plugin.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                  <span className="text-xs px-2 py-1 rounded-md bg-white/5 text-slate-400 font-mono">
                    v{plugin.version}
                  </span>

                  <div className="flex justify-end">
                    {isProcessing ? (
                      <button
                        disabled
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium cursor-not-allowed"
                      >
                        <Loader2 size={14} className="animate-spin" />
                        {t.installing}
                      </button>
                    ) : hasUpdate ? (
                      <button
                        onClick={() => handleInstallOrUpdate(plugin)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-blue-900/20"
                      >
                        <RefreshCw size={14} />
                        {t.update}
                      </button>
                    ) : isInstalled ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-slate-400 rounded-lg text-xs font-medium cursor-default border border-white/5">
                          <Check size={14} />
                          {t.installed}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              setToast({
                                message: `Deleting ${plugin.name}...`,
                                type: "info",
                              });
                              await invoke("delete_plugin", {
                                pluginId: plugin.id,
                                pluginPath: pluginPath,
                              });
                              setToast({
                                message: `${plugin.name} deleted successfully!`,
                                type: "success",
                              });
                              onInstallSuccess();
                            } catch (err) {
                              console.error("Delete failed:", err);
                              setToast({
                                message: `Failed to delete ${plugin.name}: ${err}`,
                                type: "error",
                              });
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete Plugin"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleInstallOrUpdate(plugin)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-emerald-900/20"
                      >
                        <Download size={14} />
                        {t.install}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
