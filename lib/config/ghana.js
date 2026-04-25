// Country Configuration — Ghana (Sub-Saharan Africa, Urban Informal Economy)
// This file is the entire country-specific configuration
// Swap this file to reconfigure UNMAPPED for a different country WITHOUT code changes

const ghanaConfig = {
  country_code: "GHA",
  country_name: "Ghana",
  region: "Sub-Saharan Africa",
  context: "Urban Informal Economy",
  flag_emoji: "🇬🇭",
  
  language: {
    code: "en",
    name: "English",
    direction: "ltr",
  },

  currency: {
    code: "GHS",
    symbol: "₵",
    name: "Ghanaian Cedi",
    usd_exchange: 15.8,
  },

  education_taxonomy: {
    levels: [
      { id: "none", label: "No Formal Education", isced: 0 },
      { id: "primary", label: "Primary School (P1-P6)", isced: 1 },
      { id: "jss", label: "Junior Secondary (JHS)", isced: 2 },
      { id: "sss", label: "Senior Secondary (SHS)", isced: 3 },
      { id: "vocational", label: "Vocational / Technical Training", isced: 4 },
      { id: "tertiary", label: "Tertiary (University/Polytechnic)", isced: 6 },
    ],
    credential_examples: [
      "BECE (Basic Education Certificate)",
      "WASSCE (West African SSS Certificate)",
      "National Vocational Training Certificate",
      "HND (Higher National Diploma)",
      "Bachelor's Degree",
    ],
  },

  labor_market: {
    key_sectors: ["Agriculture", "Trade & Hospitality", "Construction", "ICT", "Manufacturing"],
    opportunity_types: [
      { id: "formal", label: "Formal Employment", icon: "🏢" },
      { id: "self_employed", label: "Self-Employment / Own Business", icon: "🏪" },
      { id: "apprenticeship", label: "Apprenticeship", icon: "🔧" },
      { id: "gig", label: "Gig / Platform Work", icon: "📱" },
      { id: "training", label: "Training Program", icon: "📚" },
    ],
    informal_sector_dominance: true,
    key_challenges: [
      "High youth informality (>80%)",
      "Skills mismatch between education and employer needs",
      "Limited formal credentialing for informal skills",
      "Digital divide between urban and rural areas",
    ],
  },

  automation_calibration: {
    infrastructure_level: "medium",
    digital_penetration: 0.53,
    mobile_broadband_penetration: 0.68,
    adjustment_factor: 0.65,
    notes: "Ghana has a growing digital economy (mobile money, fintech) but limited industrial automation. Most automation risk is concentrated in financial services and manufacturing.",
  },

  demo_persona: {
    name: "Amara",
    age: 22,
    location: "Accra",
    education: "sss",
    background: "Secondary school certificate holder who speaks three languages, has been running a phone repair business since age 17, and taught herself basic coding from YouTube videos.",
    skills_input: "I repair mobile phones and tablets. I've been doing this since I was 17 — people in my neighborhood bring me broken screens, battery issues, software problems. I speak English, Twi, and some Hausa. I taught myself Python and HTML from YouTube. I also help my aunt sell clothes at Makola Market on weekends. I can negotiate with suppliers and manage inventory.",
  },

  ui: {
    date_format: "DD/MM/YYYY",
    number_format: { decimal: ".", thousand: "," },
  },
};

export default ghanaConfig;
