// 主题管理模块
class ThemeManager {
  constructor() {
    this.theme = { mode: 'system', color: '#238f4a' };
    this.init();
  }

  async init() {
    // 初始化主题
    await this.loadTheme();
    this.applyTheme();
    // 监听主题变化
    this.setupThemeListeners();
    // 定期检查主题设置（每3秒）
    this.startThemeCheckInterval();
  }

  async loadTheme() {
    try {
      const { ipcRenderer } = require('electron');
      const result = await ipcRenderer.invoke('plugin:call', {
        pluginId: 'multiword',
        fnName: 'getTheme',
        args: []
      });
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
      // 监听主题更新事件
      ipcRenderer.on('theme:update', async (event, theme) => {
        if (theme && (theme.themeMode || theme.themeColor)) {
          this.theme = {
            mode: theme.themeMode || this.theme.mode,
            color: theme.themeColor || this.theme.color
          };
          this.applyTheme();
        }
      });
      
      // 监听系统主题变化
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

  startThemeCheckInterval() {
    // 每3秒检查一次主题设置
    setInterval(async () => {
      await this.loadTheme();
      this.applyTheme();
    }, 3000);
  }

  applyTheme() {
    const root = document.documentElement;
    
    // 确定实际模式
    let actualMode = this.theme.mode;
    if (actualMode === 'system') {
      actualMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // 应用模式
    if (actualMode === 'light') {
      root.classList.remove('dark-theme');
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
      root.classList.add('dark-theme');
    }

    // 应用主题色
    root.style.setProperty('--accent', this.theme.color);

    // 应用CSS变量
    if (actualMode === 'light') {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8f9fa');
      root.style.setProperty('--bg-tertiary', '#e9ecef');
      root.style.setProperty('--text-primary', '#212529');
      root.style.setProperty('--text-secondary', '#495057');
      root.style.setProperty('--border-color', '#dee2e6');
    } else {
      root.style.setProperty('--bg-primary', '#121212');
      root.style.setProperty('--bg-secondary', '#1f1f1f');
      root.style.setProperty('--bg-tertiary', '#2c2c2c');
      root.style.setProperty('--text-primary', '#e6e6e6');
      root.style.setProperty('--text-secondary', '#adb5bd');
      root.style.setProperty('--border-color', '#343a40');
    }
  }
}

// 导出单例
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
} else {
  window.ThemeManager = ThemeManager;
}

// 自动初始化
if (typeof window !== 'undefined') {
  window.themeManager = new ThemeManager();
}