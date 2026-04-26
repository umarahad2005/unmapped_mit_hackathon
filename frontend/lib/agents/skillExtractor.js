// Skills Signal Engine — Skill Extractor Agent
// Extracts structured skills from unstructured user input
// Uses pattern matching and NLP heuristics (Gemini API optional enhancement)

import { occupations } from '../data/occupations';

// Comprehensive skill patterns for LMIC contexts
const skillPatterns = [
  // Technical / Trade skills
  { patterns: ["repair", "fix", "mend", "troubleshoot"], category: "technical", subcategory: "repair_maintenance" },
  { patterns: ["phone repair", "mobile repair", "screen replacement", "battery"], category: "technical", subcategory: "electronics_repair", isco_codes: ["7421", "7422"] },
  { patterns: ["computer", "laptop", "desktop repair"], category: "technical", subcategory: "computer_repair", isco_codes: ["7422"] },
  { patterns: ["weld", "welding", "arc welding", "gas welding"], category: "technical", subcategory: "welding", isco_codes: ["7212"] },
  { patterns: ["electric", "wiring", "circuits", "electrical"], category: "technical", subcategory: "electrical_work", isco_codes: ["7411"] },
  { patterns: ["plumb", "pipes", "water system"], category: "technical", subcategory: "plumbing", isco_codes: ["7126"] },
  { patterns: ["carpent", "woodwork", "furniture"], category: "technical", subcategory: "carpentry", isco_codes: ["7115"] },
  { patterns: ["mechanic", "engine", "vehicle repair", "car repair", "motor"], category: "technical", subcategory: "automotive", isco_codes: ["7231"] },
  { patterns: ["tractor", "farm machinery", "agricultural equipment"], category: "technical", subcategory: "agricultural_machinery", isco_codes: ["7233", "8341"] },
  { patterns: ["solar", "solar panel", "photovoltaic", "renewable"], category: "technical", subcategory: "solar_energy", isco_codes: ["7411", "7412"] },
  { patterns: ["sew", "tailor", "dressm", "stitch", "cloth"], category: "technical", subcategory: "tailoring", isco_codes: ["7531"] },
  { patterns: ["cook", "bak", "food prep", "catering", "kitchen"], category: "technical", subcategory: "food_preparation", isco_codes: ["5120", "7512"] },
  { patterns: ["hair", "barber", "braid", "salon"], category: "technical", subcategory: "hairdressing", isco_codes: ["5141"] },
  { patterns: ["build", "construct", "mason", "brick", "cement"], category: "technical", subcategory: "construction", isco_codes: ["7112", "9312"] },
  { patterns: ["driv", "transport", "motorcycle", "truck", "bus"], category: "technical", subcategory: "driving", isco_codes: ["8322", "8331", "8332"] },

  // Digital skills
  { patterns: ["python", "javascript", "java", "programming", "coding", "code"], category: "digital", subcategory: "programming", isco_codes: ["2512", "2513"] },
  { patterns: ["html", "css", "web", "website"], category: "digital", subcategory: "web_development", isco_codes: ["2513"] },
  { patterns: ["excel", "spreadsheet", "google sheets"], category: "digital", subcategory: "spreadsheets" },
  { patterns: ["social media", "facebook", "instagram", "tiktok", "content"], category: "digital", subcategory: "social_media" },
  { patterns: ["graphic design", "photoshop", "canva", "design"], category: "digital", subcategory: "graphic_design", isco_codes: ["2166"] },
  { patterns: ["data entry", "typing"], category: "digital", subcategory: "data_entry", isco_codes: ["4131"] },
  { patterns: ["whatsapp", "smartphone", "mobile app"], category: "digital", subcategory: "mobile_literacy" },

  // Business / Entrepreneurship
  { patterns: ["sell", "sales", "market", "trading", "vendor", "shop"], category: "business", subcategory: "sales_trading", isco_codes: ["5211", "5221", "9510"] },
  { patterns: ["negotiat", "bargain", "deal", "supplier"], category: "business", subcategory: "negotiation" },
  { patterns: ["inventory", "stock", "manage", "supply"], category: "business", subcategory: "inventory_management" },
  { patterns: ["accounting", "bookkeep", "ledger", "financial record"], category: "business", subcategory: "accounting", isco_codes: ["2411", "4311"] },
  { patterns: ["business", "enterprise", "own business", "entrepreneur"], category: "business", subcategory: "entrepreneurship" },
  { patterns: ["customer", "client", "service"], category: "business", subcategory: "customer_service" },
  { patterns: ["mobile money", "payment", "m-pesa", "momo", "google pay"], category: "business", subcategory: "digital_payments" },

  // Agricultural skills
  { patterns: ["farm", "plant", "crop", "harvest", "cultivat"], category: "agricultural", subcategory: "crop_farming", isco_codes: ["6111", "9211"] },
  { patterns: ["livestock", "cattle", "poultry", "goat", "animal"], category: "agricultural", subcategory: "animal_husbandry", isco_codes: ["6121", "9212"] },
  { patterns: ["irrigat", "water management"], category: "agricultural", subcategory: "irrigation" },
  { patterns: ["fish", "aquaculture", "pond"], category: "agricultural", subcategory: "fishing", isco_codes: ["6221"] },

  // Soft / Transferable skills
  { patterns: ["language", "speak", "bilingual", "trilingual", "translat"], category: "soft", subcategory: "multilingual" },
  { patterns: ["teach", "tutor", "train", "mentor", "instruct"], category: "soft", subcategory: "teaching", isco_codes: ["2330", "2320"] },
  { patterns: ["lead", "supervise", "manage team", "organize"], category: "soft", subcategory: "leadership" },
  { patterns: ["communit", "volunteer", "social work"], category: "soft", subcategory: "community_engagement" },
  { patterns: ["child care", "babysit", "nanny", "children"], category: "soft", subcategory: "childcare", isco_codes: ["5311"] },
  { patterns: ["health", "first aid", "care", "nursing assist"], category: "soft", subcategory: "healthcare", isco_codes: ["5321"] },
];

// Skill source classification
function classifySource(text) {
  const lower = text.toLowerCase();
  if (lower.includes("self-taught") || lower.includes("youtube") || lower.includes("online") || lower.includes("taught myself")) return "self_taught";
  if (lower.includes("school") || lower.includes("university") || lower.includes("college") || lower.includes("certificate")) return "formal_education";
  if (lower.includes("apprentice") || lower.includes("trained by") || lower.includes("learned from")) return "apprenticeship";
  if (lower.includes("work") || lower.includes("job") || lower.includes("business") || lower.includes("since")) return "work_experience";
  if (lower.includes("volunteer") || lower.includes("community")) return "community";
  return "informal_experience";
}

// Extract skills from free-text input
export function extractSkills(inputText) {
  const lower = inputText.toLowerCase();
  const extractedSkills = [];
  const matchedPatterns = new Set();

  for (const pattern of skillPatterns) {
    for (const keyword of pattern.patterns) {
      if (lower.includes(keyword) && !matchedPatterns.has(pattern.subcategory)) {
        matchedPatterns.add(pattern.subcategory);
        
        // Generate human-readable skill name
        const skillName = pattern.subcategory
          .split('_')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        extractedSkills.push({
          id: `skill_${pattern.subcategory}_${Date.now()}`,
          name: skillName,
          category: pattern.category,
          subcategory: pattern.subcategory,
          source: classifySource(inputText),
          isco_codes: pattern.isco_codes || [],
          confidence: calculateConfidence(lower, pattern.patterns),
          matched_keywords: pattern.patterns.filter(p => lower.includes(p)),
        });
        break;
      }
    }
  }

  // Extract languages mentioned
  const languages = extractLanguages(lower);
  if (languages.length > 0) {
    extractedSkills.push({
      id: `skill_languages_${Date.now()}`,
      name: `Multilingual (${languages.join(', ')})`,
      category: "soft",
      subcategory: "multilingual",
      source: "self_reported",
      isco_codes: [],
      confidence: 0.95,
      languages: languages,
    });
  }

  return extractedSkills;
}

function calculateConfidence(text, patterns) {
  const matches = patterns.filter(p => text.includes(p)).length;
  const base = 0.6;
  const bonus = Math.min(matches * 0.12, 0.35);
  return Math.min(base + bonus, 0.98);
}

function extractLanguages(text) {
  const languageList = [
    "english", "french", "spanish", "portuguese", "arabic", "swahili", "hausa",
    "yoruba", "igbo", "twi", "akan", "ewe", "ga", "fante", "dagbani",
    "hindi", "bengali", "tamil", "telugu", "marathi", "gujarati", "kannada",
    "malayalam", "punjabi", "urdu", "nepali", "sinhala",
    "mandarin", "chinese", "cantonese", "japanese", "korean", "vietnamese",
    "thai", "indonesian", "malay", "tagalog", "filipino",
    "amharic", "tigrinya", "somali", "zulu", "xhosa", "afrikaans",
  ];
  return languageList.filter(lang => text.includes(lang))
    .map(lang => lang.charAt(0).toUpperCase() + lang.slice(1));
}

// Map extracted skills to ISCO-08 occupations
export function mapToOccupations(skills) {
  const iscoCodeSet = new Set();
  skills.forEach(skill => {
    skill.isco_codes.forEach(code => iscoCodeSet.add(code));
  });

  return occupations
    .filter(occ => iscoCodeSet.has(occ.isco_code))
    .map(occ => ({
      ...occ,
      matched_skills: skills.filter(s => s.isco_codes.includes(occ.isco_code)).map(s => s.name),
      match_confidence: skills
        .filter(s => s.isco_codes.includes(occ.isco_code))
        .reduce((sum, s) => sum + s.confidence, 0) / skills.filter(s => s.isco_codes.includes(occ.isco_code)).length,
    }))
    .sort((a, b) => b.match_confidence - a.match_confidence);
}

// Generate portable skills profile
export function generateProfile(personalInfo, skills, mappedOccupations, countryConfig) {
  return {
    version: "1.0",
    generated_at: new Date().toISOString(),
    standard: "ISCO-08 / ESCO",
    profile: {
      name: personalInfo.name,
      age: personalInfo.age,
      location: personalInfo.location,
      education_level: personalInfo.education,
      country: countryConfig.country_code,
    },
    skills_summary: {
      total_skills: skills.length,
      by_category: {
        technical: skills.filter(s => s.category === "technical").length,
        digital: skills.filter(s => s.category === "digital").length,
        business: skills.filter(s => s.category === "business").length,
        agricultural: skills.filter(s => s.category === "agricultural").length,
        soft: skills.filter(s => s.category === "soft").length,
      },
    },
    skills: skills.map(s => ({
      name: s.name,
      category: s.category,
      source: s.source,
      confidence: s.confidence,
      isco_codes: s.isco_codes,
    })),
    mapped_occupations: mappedOccupations.slice(0, 10).map(o => ({
      isco_code: o.isco_code,
      title: o.title,
      match_confidence: o.match_confidence,
      automation_risk: o.automation_risk,
    })),
    portability_note: "This profile uses ISCO-08 international standards and is portable across countries and sectors.",
  };
}
