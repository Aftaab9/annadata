const CROP_ICONS: Record<string, string> = {
  maize: '🌽',
  soybean: '🫘',
  pepper: '🌶️',
  tomato: '🍅',
  potato: '🥔',
  apple: '🍎',
}

export function cropIcon(crop: string): string {
  return CROP_ICONS[crop.toLowerCase()] ?? '🌱'
}
