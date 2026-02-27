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
import { Check } from 'lucide-react';

const languages = [
  { code: 'en' as Language, native: 'English', english: 'English', flag: '🇬🇧' },
  { code: 'hi' as Language, native: 'हिंदी', english: 'Hindi', flag: '🇮🇳' },
  { code: 'ur' as Language, native: 'اردو', english: 'Urdu', flag: '🇮🇳' },
  { code: 'bn' as Language, native: 'বাংলা', english: 'Bengali', flag: '🇮🇳' },
  { code: 'mr' as Language, native: 'मराठी', english: 'Marathi', flag: '🇮🇳' },
  { code: 'te' as Language, native: 'తెలుగు', english: 'Telugu', flag: '🇮🇳' },
  { code: 'ta' as Language, native: 'தமிழ்', english: 'Tamil', flag: '🇮🇳' },
  { code: 'gu' as Language, native: 'ગુજરાતી', english: 'Gujarati', flag: '🇮🇳' },
  { code: 'kn' as Language, native: 'ಕನ್ನಡ', english: 'Kannada', flag: '🇮🇳' },
  { code: 'ml' as Language, native: 'മലയാളം', english: 'Malayalam', flag: '🇮🇳' },
  { code: 'pa' as Language, native: 'ਪੰਜਾਬੀ', english: 'Punjabi', flag: '🇮🇳' },
  { code: 'or' as Language, native: 'ଓଡ଼ିଆ', english: 'Odia', flag: '🇮🇳' },
  { code: 'as' as Language, native: 'অসমীয়া', english: 'Assamese', flag: '🇮🇳' },
  { code: 'mai' as Language, native: 'मैथिली', english: 'Maithili', flag: '🇮🇳' },
  { code: 'lus' as Language, native: 'Mizo ṭawng', english: 'Mizo', flag: '🇮🇳' },
  { code: 'mni' as Language, native: 'ꯃꯩꯇꯩꯂꯣꯟ', english: 'Meitei', flag: '🇮🇳' },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const current = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 px-3">
          <span className="text-lg">{current?.flag}</span>
          <span className="font-medium text-sm">{current?.native}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px] max-h-[400px] overflow-y-auto p-1">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`
              px-3 py-2.5 cursor-pointer rounded-md transition-colors
              hover:bg-accent hover:text-accent-foreground
              ${language === lang.code ? 'bg-accent/50' : ''}
            `}
          >
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-lg leading-none">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium text-sm leading-tight">
                    {lang.native}
                  </span>
                  {lang.native !== lang.english && (
                    <span className="text-xs text-muted-foreground leading-tight">
                      ({lang.english})
                    </span>
                  )}
                </div>
              </div>
              {language === lang.code && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


