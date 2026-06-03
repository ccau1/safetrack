import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'zh_TW', label: '繁體中文' },
  { code: 'zh_CN', label: '简体中文' },
];

function resolveLangCode(i18nLang: string): string {
  if (i18nLang.startsWith('zh_CN') || i18nLang.startsWith('zh-Hans')) return 'zh_CN';
  if (i18nLang.startsWith('zh')) return 'zh_TW';
  return 'en';
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = resolveLangCode(i18n.language);

  return (
    <Select value={currentLang} onValueChange={(code) => i18n.changeLanguage(code)}>
      <SelectTrigger
        className="h-8 w-auto gap-1 border-0 bg-transparent px-2 text-xs text-[#5C5C5C] hover:text-[#1A1A1A] focus:ring-0"
        aria-label="Select language"
      >
        <Globe size={14} />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent className="bg-white border-[#E5E4E0] rounded-[10px] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        {languages.map((lang) => (
          <SelectItem
            key={lang.code}
            value={lang.code}
            className="text-sm text-[#1A1A1A] focus:bg-[#F7F6F2] cursor-pointer"
          >
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
