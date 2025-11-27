export interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  bio?: string
}

export type Language = 'en' | 'id' | 'zh' | 'ru' | 'ar' | 'th' | 'vi'

export interface LanguageOption {
  code: Language
  name: string
  nativeName: string
  flag: string
}

export interface GestureTranslation {
  id: string
  originalText: string
  translatedText: string
  language: Language
  timestamp: number
  imageUrl?: string
}

export interface DonationToken {
  symbol: 'ETH' | 'USDC'
  address?: string
  decimals: number
}
