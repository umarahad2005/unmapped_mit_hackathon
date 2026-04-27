// Country Configuration — Bangladesh (South Asia, Rural Agricultural Economy)
// Mirrors unmapped_fast_api/config/bangladesh_rural.json
// This is the second leg of the canonical Ghana ↔ Bangladesh demo.

const bangladeshConfig = {
  country_code: "BGD",
  country_name: "Bangladesh",
  region: "South Asia",
  context: "Rural Agricultural Economy",
  flag_emoji: "🇧🇩",

  language: {
    code: "bn",
    name: "Bengali",
    direction: "ltr",
  },

  currency: {
    code: "BDT",
    symbol: "৳",
    name: "Bangladeshi Taka",
    usd_exchange: 110,
  },

  education_taxonomy: {
    levels: [
      { id: "none", label: "No Formal Education", isced: 0 },
      { id: "primary", label: "Primary (Class I-V)", isced: 1 },
      { id: "secondary", label: "Secondary (Class VI-X)", isced: 2 },
      { id: "ssc", label: "SSC Certificate", isced: 3 },
      { id: "hsc", label: "HSC Certificate", isced: 3 },
      { id: "vocational", label: "Vocational / SSC (Vocational)", isced: 4 },
      { id: "diploma", label: "Diploma in Engineering / Polytechnic", isced: 5 },
      { id: "tertiary", label: "Bachelor's Degree", isced: 6 },
    ],
    credential_examples: [
      "PSC (Primary School Certificate)",
      "JSC (Junior School Certificate)",
      "SSC (Secondary School Certificate)",
      "HSC (Higher Secondary Certificate)",
      "SSC Vocational",
      "Diploma in Engineering",
    ],
  },

  labor_market: {
    key_sectors: ["Agriculture", "Garments & Textiles", "Construction", "Trade", "Remittance Economy"],
    opportunity_types: [
      { id: "agri_coop", label: "Agricultural Cooperative", icon: "🌾" },
      { id: "self_employed", label: "Self-Employment", icon: "🏪" },
      { id: "informal_wage", label: "Informal Wage Work", icon: "🔧" },
      { id: "training", label: "Skill Training (NSDA)", icon: "📚" },
    ],
    informal_sector_dominance: true,
    key_challenges: [
      "Minimal rural digital infrastructure (ITU 19%)",
      "Gender mobility restrictions limit female employment access",
      "Climate vulnerability — agriculture-heavy economy",
      "STEP dataset unavailable — skill levels harder to verify directly",
    ],
  },

  automation_calibration: {
    infrastructure_level: "minimal",
    digital_penetration: 0.19,
    mobile_broadband_penetration: 0.31,
    adjustment_factor: 0.55,
    notes:
      "Bangladesh's rural economy faces among the lowest digital penetration in our config set — global automation scores massively over-state displacement here. The 0.55 multiplier reflects this honest delta.",
  },

  structural_barriers: {
    wbl_score: 49.4,
    gender_mobility_restriction: true,
    gender_workplace_restriction: false,
  },

  demo_persona: {
    name: "Nusrat",
    age: 21,
    location: "Rural Rangpur",
    education: "ssc",
    background:
      "SSC pass from a rural school. Helps run her family's small rice and vegetable plot. Sews garments at home for a small piece-rate. Has used a mobile phone for two years; access is shared with her brother.",
    skills_input:
      "I help my family farm rice and vegetables. I know when to plant and harvest, how to manage water in the dry months. I sew garments — shirts, kameez — at home, the cooperative pays per piece. I use a mobile phone for prayers, weather, and to message my cousin in Dhaka. I want to learn tailoring patterns so I can train other women in our village.",
  },

  ui: {
    date_format: "DD/MM/YYYY",
    number_format: { decimal: ".", thousand: "," },
  },
};

export default bangladeshConfig;
