import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeOption = 'system' | 'light' | 'dark' | 'aviation' | 'sunset' | 'midnight';
type FontSizeOption = 'sm' | 'md' | 'lg';
type LanguageOption = 'zh-CN' | 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ru-RU' | 'ja-JP' | 'ko-KR';

export interface AppState {
  userProfile: {
    name: string;
    aircraft: string;
    country: string;
    rank: string;
  };
  preferences: {
    theme: ThemeOption;
    fontSize: FontSizeOption;
    llmImageGen: boolean;
    language: LanguageOption;
  };
  icaoPersona: {
    enabled: boolean;
    pronunciation: number;
    structure: number;
    vocabulary: number;
    fluency: number;
    comprehension: number;
    interaction: number;
  };
  updateUserProfile: (profile: Partial<AppState['userProfile']>) => void;
  updatePreferences: (prefs: Partial<AppState['preferences']>) => void;
  updateIcaoPersona: (persona: Partial<AppState['icaoPersona']>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userProfile: {
        name: 'ATC User',
        aircraft: 'B737-800',
        country: 'China',
        rank: 'Captain',
      },
      preferences: {
        theme: 'system',
        fontSize: 'md',
        llmImageGen: false,
        language: 'zh-CN',
      },
      icaoPersona: {
        enabled: false,
        pronunciation: 4,
        structure: 4,
        vocabulary: 4,
        fluency: 4,
        comprehension: 4,
        interaction: 4,
      },
      updateUserProfile: (profile) =>
        set((state) => ({ userProfile: { ...state.userProfile, ...profile } })),
      updatePreferences: (prefs) =>
        set((state) => ({ preferences: { ...state.preferences, ...prefs } })),
      updateIcaoPersona: (persona) =>
        set((state) => ({ icaoPersona: { ...state.icaoPersona, ...persona } })),
    }),
    {
      name: 'global-atc-master-settings',
    }
  )
);
