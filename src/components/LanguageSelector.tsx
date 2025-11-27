'use client'

import type { Language } from '@/types'
import { LANGUAGES } from '@/lib/constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface LanguageSelectorProps {
  value: Language
  onChange: (language: Language) => void
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="language-select" className="text-purple-300 font-semibold">Output Language</Label>
      <Select value={value} onValueChange={(val: string) => onChange(val as Language)}>
        <SelectTrigger id="language-select" className="w-full bg-slate-950/50 border-purple-500/30 text-white hover:border-purple-400 focus:border-purple-400 focus:ring-purple-400/50">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                <span className="text-sm text-gray-500">({lang.nativeName})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
