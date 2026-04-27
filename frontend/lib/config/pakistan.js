// Country Configuration — Pakistan (South Asia, Urban Mixed Informal Economy)
// Mirrors unmapped_fast_api/config/pakistan_urban.json
// The home country of the team that built UNMAPPED.

const pakistanConfig = {
  country_code: "PAK",
  country_name: "Pakistan",
  region: "South Asia",
  context: "Urban Mixed Informal Economy",
  flag_emoji: "🇵🇰",

  language: {
    code: "ur",
    name: "Urdu",
    direction: "ltr",
  },

  currency: {
    code: "PKR",
    symbol: "₨",
    name: "Pakistani Rupee",
    usd_exchange: 280,
  },

  education_taxonomy: {
    levels: [
      { id: "none", label: "No Formal Education", isced: 0 },
      { id: "primary", label: "Primary (Class 1-5)", isced: 1 },
      { id: "middle", label: "Middle (Class 6-8)", isced: 2 },
      { id: "matric", label: "Matric / SSC (Class 9-10)", isced: 3 },
      { id: "intermediate", label: "Intermediate / FA / FSc (Class 11-12)", isced: 3 },
      { id: "vocational", label: "Vocational / TEVTA Certificate", isced: 4 },
      { id: "diploma", label: "Diploma of Associate Engineer (DAE)", isced: 5 },
      { id: "tertiary", label: "Bachelor's Degree", isced: 6 },
    ],
    credential_examples: [
      "Matric Certificate (BISE)",
      "Intermediate / FSc / FA",
      "TEVTA Certificate",
      "Diploma of Associate Engineer (DAE)",
      "NAVTTC Certificate",
      "Bachelor's Degree",
    ],
  },

  labor_market: {
    key_sectors: ["Agriculture", "Wholesale & Retail Trade", "Construction", "Manufacturing", "ICT & BPO"],
    opportunity_types: [
      { id: "formal", label: "Formal Employment", icon: "🏢" },
      { id: "self_employed", label: "Self-Employment / Business", icon: "🏪" },
      { id: "informal_wage", label: "Informal Wage Work", icon: "🔧" },
      { id: "gig", label: "Gig / Platform Work", icon: "📱" },
      { id: "training", label: "TEVTA / Skill Training", icon: "📚" },
    ],
    informal_sector_dominance: true,
    key_challenges: [
      "Informal sector ~71% of non-agricultural employment",
      "Female labor-force participation among the lowest in the region (~22%)",
      "Skills gap between TEVTA output and employer demand",
      "Urban-rural digital divide; ~32% national digital penetration",
    ],
  },

  automation_calibration: {
    infrastructure_level: "low",
    digital_penetration: 0.32,
    mobile_broadband_penetration: 0.54,
    adjustment_factor: 0.65,
    notes:
      "Pakistan's automation exposure is materially lower than global Frey-Osborne baselines suggest — ~35% of routine jobs are in informal/manual contexts where automation has not yet penetrated. The 0.65 multiplier captures this honestly.",
  },

  structural_barriers: {
    wbl_score: 55.6,
    gender_mobility_restriction: true,
    gender_workplace_restriction: false,
  },

  demo_persona: {
    name: "Ayesha",
    age: 23,
    location: "Karachi (Korangi)",
    education: "intermediate",
    background:
      "Intermediate (FSc) holder from a government college. Helps her family with a small home-based stitching business via informal orders from a local boutique. Self-taught in basic Excel and Canva from YouTube on a shared Android. Speaks Urdu, English, and Sindhi.",
    skills_input:
      "I help my family run a stitching business from home — we take orders from a boutique in Tariq Road, three or four sets a week. I cut, stitch, and finish kameez and shalwar. I learned Canva and Excel from YouTube, so I make our orders sheet and the boutique's Instagram posts. I speak Urdu, Sindhi, and English. I want to start taking orders directly so we don't lose half the money to the middleman.",
  },

  ui: {
    date_format: "DD/MM/YYYY",
    number_format: { decimal: ".", thousand: "," },
  },
};

export default pakistanConfig;
