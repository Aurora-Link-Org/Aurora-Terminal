import React from 'react';
import { AppSettings, ColorSchemeConfig } from '../../types';
import { X, Save } from 'lucide-react';
import { Button } from '../common/Button';

interface ColorSchemeEditorProps {
  tempScheme: ColorSchemeConfig;
  setTempScheme: (scheme: ColorSchemeConfig | null) => void;
  localSettings: AppSettings;
  setLocalSettings: (settings: AppSettings) => void;
  setEditingSchemeId: (id: string | null) => void;
  t: any;
}

export const ColorSchemeEditor: React.FC<ColorSchemeEditorProps> = ({
  tempScheme, setTempScheme, localSettings, setLocalSettings, setEditingSchemeId, t
}) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">{t.editScheme}</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setEditingSchemeId(null);
              setTempScheme(null);
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">{t.schemeName}</label>
          <input 
            type="text"
            value={tempScheme.name}
            onChange={(e) => setTempScheme({ ...tempScheme, name: e.target.value })}
            className="glass-input w-full rounded-lg py-2 px-3 text-sm text-white outline-none bg-black/40 border border-white/10 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-4">{t.colors}</label>
          <div className="grid grid-cols-2 gap-4">
            {['bg', 'fg', 'black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white'].map((key) => {
              const value = (tempScheme.colors as any)[key];
              return (
              <div key={key} className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20">
                  <input 
                    type="color"
                    value={value}
                    onChange={(e) => setTempScheme({
                      ...tempScheme,
                      colors: { ...tempScheme.colors, [key]: e.target.value }
                    })}
                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 uppercase mb-1">{(t as any)[`color_${key}`] || key}</div>
                  <div className="text-sm font-mono text-white">{value}</div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button 
            onClick={() => {
              if (tempScheme) {
                const exists = localSettings.customColorSchemes.some(s => s.id === tempScheme.id);
                let newCustomSchemes;
                if (exists) {
                  newCustomSchemes = localSettings.customColorSchemes.map(s => s.id === tempScheme.id ? tempScheme : s);
                } else {
                  newCustomSchemes = [...localSettings.customColorSchemes, tempScheme];
                }
                
                setLocalSettings({
                  ...localSettings,
                  customColorSchemes: newCustomSchemes,
                  colorScheme: tempScheme.id
                });
                setEditingSchemeId(null);
                setTempScheme(null);
              }
            }}
            icon={<Save size={16} />}
          >
            {t.save}
          </Button>
        </div>
      </div>
    </div>
  );
};
