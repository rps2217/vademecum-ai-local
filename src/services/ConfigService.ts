
export interface AppConfig {
  enableBackgroundSynergy: boolean;
  useGeminiForSynergy: boolean;
  autoSyncCloud: boolean;
  enableAIInteractions: boolean;
  useOllama: boolean;
}

const DEFAULT_CONFIG: AppConfig = {
  enableBackgroundSynergy: false,
  useGeminiForSynergy: false,
  autoSyncCloud: true,
  enableAIInteractions: false,
  useOllama: true,
};

export class ConfigService {
  private static instance: ConfigService;

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  getConfig(): AppConfig {
    const saved = localStorage.getItem('app_config');
    if (!saved) return DEFAULT_CONFIG;
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  updateConfig(updates: Partial<AppConfig>) {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem('app_config', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('config_updated', { detail: updated }));
    return updated;
  }
}

export const configService = ConfigService.getInstance();
