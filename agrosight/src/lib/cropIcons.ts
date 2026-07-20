const CROP_ICONS: Record<string, string> = {
  rice: '🌾',
  maize: '🌽',
  chickpea: '🫘',
  cotton: '☁️',
  pigeonpeas: '🫛',
  mungbean: '🫘',
  blackgram: '🫘',
  lentil: '🫘',
  banana: '🍌',
  mango: '🥭',
  grapes: '🍇',
  watermelon: '🍉',
  apple: '🍎',
  coffee: '☕',
  jute: '🌿',
}

export function cropIcon(crop: string): string {
  return CROP_ICONS[crop.toLowerCase()] ?? '🌱'
}
