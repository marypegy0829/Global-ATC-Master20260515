import { useAppStore } from "../store/useAppStore";
import { 
  User, Plane, MapPin, Award, 
  Brain, Volume2, Layers, BookA, Mic, Ear, Users,
  Palette, Type, Image as ImageIcon, Globe, ChevronRight
} from "lucide-react";
import { cn } from "../lib/utils";
import React from "react";
import { motion, AnimatePresence } from "motion/react";

function SettingsGroup({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="mb-8">
      {title && <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider pl-4 mb-2">{title}</h2>}
      <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-100/80 overflow-hidden divide-y divide-gray-100 flex flex-col">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ 
  icon: Icon, 
  iconColor, 
  title, 
  children,
  onClick
}: { 
  icon: React.ElementType; 
  iconColor: string; 
  title: string; 
  children?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between min-h-[50px] px-4 py-3 md:px-5",
        onClick && "cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3.5">
        <div className={cn("w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shadow-sm", iconColor)}>
          <Icon className="w-4 h-4 text-white" strokeWidth={2} />
        </div>
        <span className="text-[17px] font-medium text-gray-900 capitalize tracking-tight">{title}</span>
      </div>
      <div className="flex items-center text-gray-500">
        {children}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-aviation focus-visible:ring-offset-2",
        checked ? "bg-green-500" : "bg-gray-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)] ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-[20px]" : "translate-x-0"
        )}
      />
    </button>
  );
}

function SegmentedControl({ value, onChange, min = 1, max = 6 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className="flex bg-gray-100/80 p-[3px] rounded-[10px] w-full max-w-[200px] ml-4">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "flex-1 py-1 text-[14px] font-semibold rounded-[8px] transition-all duration-200",
            value === opt 
              ? "bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.1)]" 
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function InputField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="text-right bg-transparent text-[17px] text-gray-500 hover:text-gray-700 focus:outline-none focus:text-aviation w-full min-w-[100px]"
    />
  );
}

function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="relative flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent text-right text-[17px] text-gray-500 hover:text-gray-700 focus:outline-none pr-6 cursor-pointer font-medium"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-gray-900 bg-white">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronRight className="w-[18px] h-[18px] text-gray-400 absolute right-0 pointer-events-none" />
    </div>
  );
}

export default function Settings() {
  const { userProfile, preferences, icaoPersona, updateUserProfile, updatePreferences, updateIcaoPersona } = useAppStore();

  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col max-w-3xl mx-auto w-full">
      <header className="mb-8 mt-4 md:mt-0">
        <h1 className="text-[2.2rem] md:text-[2.8rem] font-bold tracking-tight mb-2 text-gray-900 leading-tight">
          个人设置
        </h1>
        <p className="text-[1.05rem] text-gray-500 font-medium pb-2">
          管理您的飞行员档案、CBTA能力模型及系统偏好。
        </p>
      </header>

      <div className="flex-1 overflow-y-auto pb-12 pr-1 -mr-1">
        {/* Group 1: Profile & Identity */}
        <SettingsGroup title="Profile & Identity">
          <SettingsRow icon={User} iconColor="bg-blue-500" title="姓名 (Name)">
            <InputField value={userProfile.name} onChange={(v) => updateUserProfile({ name: v })} placeholder="例如: Captain Leo" />
          </SettingsRow>
          <SettingsRow icon={Plane} iconColor="bg-orange-500" title="机型 (Aircraft)">
            <InputField value={userProfile.aircraft} onChange={(v) => updateUserProfile({ aircraft: v })} placeholder="例如: B737-800" />
          </SettingsRow>
          <SettingsRow icon={MapPin} iconColor="bg-green-500" title="国家 (Country)">
            <InputField value={userProfile.country} onChange={(v) => updateUserProfile({ country: v })} placeholder="例如: China" />
          </SettingsRow>
          <SettingsRow icon={Award} iconColor="bg-purple-500" title="级别 (Rank)">
            <InputField value={userProfile.rank} onChange={(v) => updateUserProfile({ rank: v })} placeholder="例如: Captain" />
          </SettingsRow>
        </SettingsGroup>

        {/* Group 2: ICAO CBTA Persona */}
        <SettingsGroup title="CBTA Persona (ICAO能力模型)">
          <SettingsRow icon={Brain} iconColor="bg-aviation" title="启用能力人设">
            <Toggle checked={icaoPersona.enabled} onChange={(v) => updateIcaoPersona({ enabled: v })} />
          </SettingsRow>
          
          <AnimatePresence>
            {icaoPersona.enabled && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-gray-50"
              >
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  <SettingsRow icon={Volume2} iconColor="bg-indigo-400" title="发音 (Pronunciation)">
                    <SegmentedControl value={icaoPersona.pronunciation} onChange={(v) => updateIcaoPersona({ pronunciation: v })} />
                  </SettingsRow>
                  <SettingsRow icon={Layers} iconColor="bg-teal-400" title="结构 (Structure)">
                    <SegmentedControl value={icaoPersona.structure} onChange={(v) => updateIcaoPersona({ structure: v })} />
                  </SettingsRow>
                  <SettingsRow icon={BookA} iconColor="bg-pink-400" title="词汇 (Vocabulary)">
                    <SegmentedControl value={icaoPersona.vocabulary} onChange={(v) => updateIcaoPersona({ vocabulary: v })} />
                  </SettingsRow>
                  <SettingsRow icon={Mic} iconColor="bg-amber-400" title="流利度 (Fluency)">
                    <SegmentedControl value={icaoPersona.fluency} onChange={(v) => updateIcaoPersona({ fluency: v })} />
                  </SettingsRow>
                  <SettingsRow icon={Ear} iconColor="bg-cyan-500" title="理解力 (Comprehension)">
                    <SegmentedControl value={icaoPersona.comprehension} onChange={(v) => updateIcaoPersona({ comprehension: v })} />
                  </SettingsRow>
                  <SettingsRow icon={Users} iconColor="bg-rose-500" title="交互能力 (Interaction)">
                    <SegmentedControl value={icaoPersona.interaction} onChange={(v) => updateIcaoPersona({ interaction: v })} />
                  </SettingsRow>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SettingsGroup>

        {/* Group 3: App Preferences */}
        <SettingsGroup title="App Preferences">
          <SettingsRow icon={Palette} iconColor="bg-gray-800 dark:bg-gray-600" title="主题风格 (Theme)">
            <SelectField 
              value={preferences.theme} 
              onChange={(v) => updatePreferences({ theme: v as any })}
              options={[
                { label: '跟随系统', value: 'system' },
                { label: '浅色', value: 'light' },
                { label: '深色', value: 'dark' },
                { label: '深空蓝', value: 'aviation' },
                { label: '日落', value: 'sunset' },
                { label: '午夜', value: 'midnight' },
              ]}
            />
          </SettingsRow>
          <SettingsRow icon={Type} iconColor="bg-slate-500" title="字体大小 (Font Size)">
            <SelectField 
              value={preferences.fontSize} 
              onChange={(v) => updatePreferences({ fontSize: v as any })}
              options={[
                { label: '小 (Small)', value: 'sm' },
                { label: '中 (Medium)', value: 'md' },
                { label: '大 (Large)', value: 'lg' },
              ]}
            />
          </SettingsRow>
          <SettingsRow icon={ImageIcon} iconColor="bg-fuchsia-500" title="大模型生图辅助">
            <Toggle checked={preferences.llmImageGen} onChange={(v) => updatePreferences({ llmImageGen: v })} />
          </SettingsRow>
          <SettingsRow icon={Globe} iconColor="bg-sky-500" title="系统语言 (Language)">
            <SelectField 
              value={preferences.language} 
              onChange={(v) => updatePreferences({ language: v as any })}
              options={[
                { label: '简体中文', value: 'zh-CN' },
                { label: 'English (US)', value: 'en-US' },
                { label: 'Español', value: 'es-ES' },
                { label: 'Français', value: 'fr-FR' },
                { label: 'Deutsch', value: 'de-DE' },
                { label: 'Русский', value: 'ru-RU' },
                { label: '日本語', value: 'ja-JP' },
                { label: '한국어', value: 'ko-KR' },
              ]}
            />
          </SettingsRow>
        </SettingsGroup>

        <p className="text-center text-xs text-gray-400 mt-6 mb-8 uppercase tracking-widest font-semibold">
          Global ATC Master v1.0.0
        </p>
      </div>
    </div>
  );
}
