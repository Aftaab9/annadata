export type InspectMode = 'leaf' | 'produce'

export const INSPECT_MODE_COPY = {
  leaf: {
    title: 'Leaf Health',
    subtitle: 'Pre-harvest · plant disease on leaves',
    badge: 'PlantVillage TFLite',
    hint: 'Photograph a LEAF close-up. This diagnoses disease risk while the crop is growing — it does not grade harvested fruit.',
  },
  produce: {
    title: 'Produce Quality',
    subtitle: 'Post-harvest · batch freshness grade',
    badge: 'Produce CNN',
    hint: 'Photograph the harvested fruit/veg. This grades freshness for Grade A/B/C and fair price — separate from leaf disease.',
  },
} as const
