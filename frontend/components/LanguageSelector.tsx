'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'hi' as Language, name: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr' as Language, name: 'मराठी', flag: '🇮🇳' },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const current = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {current?.flag} {current?.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? 'bg-accent' : ''}
          >
            {lang.flag} {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
