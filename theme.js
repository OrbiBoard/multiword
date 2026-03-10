const CSS_VARS = {
  dark: {
    '--bg': '#121621',
    '--fg': '#ededed',
    '--muted': '#94a3b8',
    '--panel': 'rgba(255, 255, 255, 0.04)',
    '--item-bg': 'rgba(255, 255, 255, 0.04)',
    '--border': 'rgba(255, 255, 255, 0.12)',
    '--bg-primary': '#121621',
    '--bg-secondary': '#1f1f1f',
    '--bg-tertiary': '#2c2c2c',
    '--text-primary': '#e6e6e6',
    '--text-secondary': '#adb5bd',
    '--border-color': '#343a40'
  },
  light: {
    '--bg': '#f3f4f6',
    '--fg': '#1f2937',
    '--muted': '#6b7280',
    '--panel': '#ffffff',
    '--item-bg': '#f3f4f6',
    '--border': '#e5e7eb',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8f9fa',
    '--bg-tertiary': '#e9ecef',
    '--text-primary': '#212529',
    '--text-secondary': '#495057',
    '--border-color': '#dee2e6'
  }
};

function adjustBrightness(hex, percent) {
  if (!hex || typeof hex !== 'string') return '#238f4a';
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return hex;
  const num = parseInt(cleanHex, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 35, g: 143, b: 74 };
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return { r: 35, g: 143, b: 74 };
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16)
  };
}

function getSystemDarkMode() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (e) {
    return false;
  }
}

function getEffectiveMode(mode) {
  if (mode === 'system') {
    return getSystemDarkMode() ? 'dark' : 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

function applyTheme(mode, color) {
  const root = document.documentElement;
  const effectiveMode = getEffectiveMode(mode);
  const accent = color || '#238f4a';
  const { r, g, b } = hexToRgb(accent);
  
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  
  const vars = CSS_VARS[effectiveMode] || CSS_VARS.dark;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  const activeColor = effectiveMode === 'dark' 
    ? `rgba(${r}, ${g}, ${b}, 0.25)`
    : `rgba(${r}, ${g}, ${b}, 0.1)`;
  root.style.setProperty('--active', activeColor);
  
  if (effectiveMode === 'dark') {
    root.classList.remove('light-theme', 'theme-light');
    root.classList.add('dark-theme', 'theme-dark');
  } else {
    root.classList.remove('dark-theme', 'theme-dark');
    root.classList.add('light-theme', 'theme-light');
  }
}

class ThemeManager {
  constructor() {
    this.theme = { mode: 'system', color: '#238f4a' };
    this.init();
  }

  async init() {
    await this.loadTheme();
    this.applyTheme();
    this.setupThemeListeners();
  }

  async loadTheme() {
    try {
      const { ipcRenderer } = require('electron');
      const result = await ipcRenderer.invoke('config:getTheme');
      if (result.ok) {
        this.theme = {
          mode: result.mode || 'system',
          color: result.color || '#238f4a'
        };
      }
    } catch (e) {
      console.error('加载主题失败:', e);
    }
  }

  setupThemeListeners() {
    try {
      const { ipcRenderer } = require('electron');
      
      ipcRenderer.on('sys:theme-changed', (_e, theme) => {
        if (theme) {
          this.theme = {
            mode: theme.mode || this.theme.mode,
            color: theme.color || this.theme.color
          };
          this.applyTheme();
        }
      });
      
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
          if (this.theme.mode === 'system') {
            this.applyTheme();
          }
        });
      }
    } catch (e) {
      console.error('设置主题监听器失败:', e);
    }
  }

  applyTheme() {
    applyTheme(this.theme.mode, this.theme.color);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
} else {
  window.ThemeManager = ThemeManager;
}

if (typeof window !== 'undefined') {
  window.themeManager = new ThemeManager();
}
