import { useEffect } from 'react';
import { AppSettings } from '../types';
import { defaultColorSchemes } from '../constants/theme';

export const useTheme = (activeSettings: AppSettings) => {
  useEffect(() => {
    const allSchemes = [...defaultColorSchemes, ...activeSettings.customColorSchemes];
    const activeScheme = allSchemes.find(s => s.id === activeSettings.colorScheme) || defaultColorSchemes[0];
    
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 15, g: 23, b: 42 };
    };
    
    const rgb = hexToRgb(activeScheme.colors.bg);
    document.documentElement.style.setProperty('--glass-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${activeSettings.glassOpacity})`);
    
    document.documentElement.style.setProperty('--glass-blur', `${activeSettings.glassmorphism ? activeSettings.glassBlur : 0}px`);
    document.documentElement.style.setProperty('--term-font', activeSettings.fontFamily);
    document.documentElement.style.setProperty('--term-size', `${activeSettings.fontSize}px`);
    document.documentElement.style.setProperty('--term-lh', activeSettings.lineHeight.toString());
    
    document.documentElement.style.setProperty('--bg-color', activeScheme.colors.bg);
  }, [activeSettings]);
};
