// Country Configuration — India (South Asia, Rural Agricultural)
const indiaConfig = {
  country_code: "IND",
  country_name: "India",
  region: "South Asia",
  context: "Rural Agricultural Economy",
  flag_emoji: "🇮🇳",
  
  language: {
    code: "hi",
    name: "Hindi",
    direction: "ltr",
  },

  currency: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    usd_exchange: 83.5,
  },

  education_taxonomy: {
    levels: [
      { id: "none", label: "No Formal Education", isced: 0 },
      { id: "primary", label: "Primary (Class I-V)", isced: 1 },
      { id: "upper_primary", label: "Upper Primary (Class VI-VIII)", isced: 2 },
      { id: "secondary", label: "Secondary (Class IX-X)", isced: 3 },
      { id: "higher_secondary", label: "Higher Secondary (Class XI-XII)", isced: 3 },
      { id: "iti", label: "ITI / Vocational Training", isced: 4 },
      { id: "diploma", label: "Polytechnic Diploma", isced: 5 },
      { id: "graduate", label: "Graduate Degree (BA/BSc/BCom)", isced: 6 },
    ],
    credential_examples: [
      "Class X Board Certificate (CBSE/State)",
      "Class XII Board Certificate",
      "ITI Certificate (NCVT/SCVT)",
      "Polytechnic Diploma",
      "NSQF Level Certificate",
      "Bachelor's Degree",
    ],
  },

  labor_market: {
    key_sectors: ["Agriculture", "Construction", "Manufacturing", "ICT", "Trade & Hospitality"],
    opportunity_types: [
      { id: "formal", label: "Formal Employment", icon: "🏢" },
      { id: "self_employed", label: "Self-Employment", icon: "🏪" },
      { id: "apprenticeship", label: "Apprenticeship / Skill India", icon: "🔧" },
      { id: "gig", label: "Gig / Platform Work", icon: "📱" },
      { id: "training", label: "PMKVY / Skill Training", icon: "📚" },
      { id: "mgnrega", label: "MGNREGA / Government Scheme", icon: "🏛️" },
    ],
    informal_sector_dominance: true,
    key_challenges: [
      "Massive youth bulge with limited formal jobs",
      "Agriculture employs 42% but contributes only 16.5% to GDP",
      "Gender gap in labor force participation",
      "Urban-rural digital divide",
    ],
  },

  automation_calibration: {
    infrastructure_level: "medium-high",
    digital_penetration: 0.47,
    mobile_broadband_penetration: 0.55,
    adjustment_factor: 0.72,
    notes: "India's IT sector is globally competitive but automation risk is higher in BPO and data entry roles. Rural economy has very low automation penetration.",
  },

  demo_persona: {
    name: "Ravi",
    age: 20,
    location: "Rural Madhya Pradesh",
    education: "secondary",
    background: "Class X pass from government school. Helps family with farming (wheat, soybean). Knows tractor repair from watching his uncle. Uses smartphone for YouTube and WhatsApp. Interested in solar panel installation.",
    skills_input: "I help my family on the farm — planting wheat and soybean, operating the tractor, managing irrigation. I know how to repair tractor engines from watching my uncle. I use my smartphone for everything — WhatsApp, YouTube, Google Pay. I'm interested in learning about solar panels because many people in my village want them. I can also drive a motorcycle and have a learner's license for trucks.",
  },

  ui: {
    date_format: "DD/MM/YYYY",
    number_format: { decimal: ".", thousand: "," },
  },
};

export default indiaConfig;
