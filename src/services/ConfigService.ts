
export interface AppConfig {
  enableBackgroundSynergy: boolean;
  useGeminiForSynergy: boolean;
  autoSyncCloud: boolean;
  enableAIInteractions: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  enableBackgroundSynergy: false,
  useGeminiForSynergy: false,
  autoSyncCloud: true,
  enableAIInteractions: false,
};

export const ConfigService = {
  getConfig(): AppConfig {
    const saved = localStorage.getItem('app_config');
    if (!saved) return DEFAULT_CONFIG;
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  updateConfig(updates: Partial<AppConfig>) {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem('app_config', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('config_updated', { detail: updated }));
    return updated;
  }
};
