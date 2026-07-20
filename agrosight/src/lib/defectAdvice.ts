import type { DefectClass, Language } from '@/lib/constants'

export interface DefectAdvice {
  title: string
  severity: 'ok' | 'caution' | 'critical'
  summary: string
  steps: string[]
  askAssistant: string
}

const ADVICE_EN: Record<DefectClass, DefectAdvice> = {
  HEALTHY: {
    title: 'Plant health looks good',
    severity: 'ok',
    summary:
      'Leaf scan shows no strong disease signal. Keep monitoring and link this batch to price and market with your Grade Card.',
    steps: [
      'Continue routine field scouting every 3–5 days.',
      'Maintain balanced irrigation — avoid prolonged leaf wetness.',
      'Proceed to packaging / market listing if processing QA also passes.',
    ],
    askAssistant: 'My leaf scan is HEALTHY. What should I do next for harvest and selling?',
  },
  SURFACE_DEFECT: {
    title: 'Surface spots / early stress',
    severity: 'caution',
    summary:
      'Mild leaf damage detected. This often means early fungal stress, nutrient burn, or mechanical injury — treat early to protect yield.',
    steps: [
      'Isolate the affected plants / rows and re-inspect nearby leaves.',
      'Remove heavily spotted leaves; avoid overhead watering in the evening.',
      'Improve air flow (spacing / pruning) and check NPK balance in Advisory.',
      'If spots spread in 48 hours, apply a registered contact fungicide per local agri-extension guidance.',
      'Flag this batch for supervisor review before premium market listing.',
    ],
    askAssistant:
      'My leaf scan shows SURFACE_DEFECT. Explain what this means and give step-by-step field recommendations.',
  },
  BLIGHT_MOLD: {
    title: 'Blight / mold risk — act now',
    severity: 'critical',
    summary:
      'Strong blight or mold signal on the leaf. High contamination risk for the crop and processing line — quarantine and treat before harvest or intake.',
    steps: [
      'Quarantine the affected lot — do not mix with healthy batches.',
      'Destroy or safely dispose of severely infected plant material; sanitize tools.',
      'Stop overhead irrigation; keep canopy dry; increase spacing if possible.',
      'Consult local Krishi Vigyan Kendra / agri officer for a registered fungicide schedule for your crop.',
      'Reject or heavily discount this batch at processing intake; do not list as Grade A.',
      'Re-scan after treatment; require HITL supervisor sign-off before release.',
    ],
    askAssistant:
      'My leaf scan shows BLIGHT_MOLD. Give urgent quarantine and treatment recommendations for my crop.',
  },
}

const ADVICE_HI: Record<DefectClass, DefectAdvice> = {
  HEALTHY: {
    title: 'पौधे की सेहत अच्छी लग रही है',
    severity: 'ok',
    summary:
      'पत्ती स्कैन में गंभीर रोग संकेत नहीं। निगरानी जारी रखें और ग्रेड कार्ड से बाज़ार/मूल्य जोड़ें।',
    steps: [
      'हर 3–5 दिन खेत की जाँच करें।',
      'सिंचाई संतुलित रखें — पत्तों को लंबे समय गीला न रखें।',
      'प्रोसेसिंग QA पास हो तो पैकेजिंग/बाज़ार सूची आगे बढ़ाएँ।',
    ],
    askAssistant: 'मेरा पत्ती स्कैन HEALTHY है। कटाई और बिक्री के लिए आगे क्या करें?',
  },
  SURFACE_DEFECT: {
    title: 'सतह के धब्बे / प्रारंभिक तनाव',
    severity: 'caution',
    summary:
      'हल्की पत्ती क्षति मिली। जल्दी फफूंद/पोषक तनाव हो सकता है — उपज बचाने के लिए जल्दी कार्रवाई करें।',
    steps: [
      'प्रभावित पौधों को अलग करें और आसपास की पत्तियाँ दोबारा जाँचें।',
      'अधिक धब्बेदार पत्तियाँ हटाएँ; शाम को ऊपरी सिंचाई से बचें।',
      'हवा का प्रवाह बढ़ाएँ और Advisory में NPK जाँचें।',
      '48 घंटे में फैले तो स्थानीय कृषि सलाह के अनुसार फफूंदनाशक लगाएँ।',
      'प्रीमियम लिस्टिंग से पहले पर्यवेक्षक समीक्षा करें।',
    ],
    askAssistant:
      'मेरे पत्ती स्कैन में SURFACE_DEFECT है। इसका मतलब और खेत में कदम-दर-कदम सलाह दें।',
  },
  BLIGHT_MOLD: {
    title: 'ब्लाइट / फफूंद जोखिम — तुरंत कार्रवाई',
    severity: 'critical',
    summary:
      'पत्ती पर तेज़ ब्लाइट/फफूंद संकेत। फसल और प्रोसेसिंग लाइन के लिए खतरा — कटाई/इनटेक से पहले अलग करें और इलाज करें।',
    steps: [
      'प्रभावित लॉट को क्वारंटाइन करें — स्वस्थ बैच से न मिलाएँ।',
      'गंभीर संक्रमित सामग्री सुरक्षित निपटान; औज़ार साफ़ करें।',
      'ऊपरी सिंचाई बंद करें; पत्तों को सूखा रखें।',
      'अपनी फसल के लिए केवीके/कृषि अधिकारी से पंजीकृत फफूंदनाशक शेड्यूल लें।',
      'प्रोसेसिंग में रिजेक्ट/छूट; ग्रेड A में न बेचें।',
      'इलाज के बाद दोबारा स्कैन; रिलीज़ से पहले HITL साइन-ऑफ।',
    ],
    askAssistant:
      'मेरे पत्ती स्कैन में BLIGHT_MOLD है। तुरंत क्वारंटाइन और इलाज की सलाह दें।',
  },
}

export function getDefectAdvice(
  cls: DefectClass,
  language: Language = 'en',
): DefectAdvice {
  return language === 'hi' ? ADVICE_HI[cls] : ADVICE_EN[cls]
}
