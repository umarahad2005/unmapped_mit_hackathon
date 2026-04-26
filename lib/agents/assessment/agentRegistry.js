// Agent Registry — Classifies skills and routes to specialist agents
// This is the orchestrator "brain" for the assessment system

import { GoogleGenAI } from "@google/genai";

// Domain definitions with their specialist agent IDs
export const DOMAINS = {
  technical: {
    id: "technical",
    label: "Technical & Trade Skills",
    icon: "🔧",
    subdomains: [
      "electronics_repair", "phone_repair", "welding", "electrical_work",
      "plumbing", "carpentry", "automotive", "construction", "tailoring",
      "food_preparation", "hairdressing", "solar_energy", "driving",
    ],
  },
  digital: {
    id: "digital",
    label: "Digital & Computing Skills",
    icon: "💻",
    subdomains: [
      "programming", "web_development", "spreadsheets", "social_media",
      "graphic_design", "data_entry", "mobile_literacy", "networking",
      "cybersecurity", "cloud_computing",
    ],
  },
  business: {
    id: "business",
    label: "Business & Entrepreneurship",
    icon: "📊",
    subdomains: [
      "sales_trading", "negotiation", "inventory_management", "accounting",
      "entrepreneurship", "customer_service", "digital_payments", "marketing",
    ],
  },
  agricultural: {
    id: "agricultural",
    label: "Agricultural Skills",
    icon: "🌾",
    subdomains: [
      "crop_farming", "animal_husbandry", "irrigation", "fishing",
      "agro_processing", "greenhouse", "organic_farming",
    ],
  },
  soft: {
    id: "soft",
    label: "Soft & Transferable Skills",
    icon: "🤝",
    subdomains: [
      "multilingual", "teaching", "leadership", "community_engagement",
      "childcare", "healthcare", "communication", "problem_solving",
    ],
  },
};

// Keyword-based fallback classifier (works without LLM)
const DOMAIN_KEYWORDS = {
  technical: [
    "repair", "fix", "weld", "electric", "plumb", "carpent", "mechanic",
    "engine", "motor", "sew", "tailor", "cook", "bak", "hair", "barber",
    "build", "construct", "mason", "driv", "solar", "panel",
  ],
  digital: [
    "python", "javascript", "java", "code", "coding", "programming",
    "html", "css", "web", "website", "excel", "spreadsheet", "computer",
    "laptop", "software", "app", "design", "photoshop", "canva",
  ],
  business: [
    "sell", "sales", "market", "trad", "vendor", "shop", "negotiat",
    "inventory", "stock", "account", "bookkeep", "business", "enterprise",
    "customer", "client", "mobile money", "payment",
  ],
  agricultural: [
    "farm", "plant", "crop", "harvest", "livestock", "cattle", "poultry",
    "goat", "irrigat", "fish", "aquaculture", "tractor",
  ],
  soft: [
    "language", "speak", "teach", "tutor", "train", "lead", "supervise",
    "communit", "volunteer", "child care", "health", "first aid",
  ],
};

/**
 * Classify skills into domains using Gemini (with keyword fallback)
 * @param {string} skillsText - Raw free-text skill description
 * @param {string} countryCode - Country context (GHA, IND, etc.)
 * @returns {Promise<Array<{skill: string, domain: string, claimedLevel: string}>>}
 */
export async function classifySkills(skillsText, countryCode) {
  // Try LLM classification first
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("No API key");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze the following self-description from a worker in ${countryCode === "IND" ? "India" : "Ghana"}.
Extract each distinct skill claim and classify it.

User said: "${skillsText}"

Return ONLY valid JSON array:
[
  {
    "skill": "Human readable skill name",
    "domain": "technical|digital|business|agricultural|soft|unknown",
    "subdomain": "specific_area",
    "claimedLevel": "beginner|intermediate|advanced|expert",
    "evidence": "What in the text suggests this skill"
  }
]

Rules:
- Extract EVERY skill, including implicit ones
- "I help my aunt sell clothes" implies: sales, customer_service, inventory
- Assess claimed level from context: "since I was 17" (5+ years) = advanced
- Mark as "unknown" domain ONLY if it truly doesn't fit any category
- Be generous with informal/practical skills`,
      config: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });

    let text = response.text;
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.log("LLM classification failed, using keyword fallback:", err.message?.slice(0, 80));
    return classifyWithKeywords(skillsText);
  }
}

/**
 * Fallback keyword-based classifier
 */
function classifyWithKeywords(skillsText) {
  const lower = skillsText.toLowerCase();
  const results = [];
  const matched = new Set();

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw) && !matched.has(kw)) {
        matched.add(kw);
        const skillName = kw.charAt(0).toUpperCase() + kw.slice(1);
        results.push({
          skill: skillName.replace(/_/g, " "),
          domain,
          subdomain: kw.replace(/\s+/g, "_"),
          claimedLevel: "intermediate", // default when we can't assess
          evidence: `Keyword "${kw}" found in text`,
        });
      }
    }
  }

  // If nothing matched, create an "unknown" entry
  if (results.length === 0) {
    results.push({
      skill: "General Skills",
      domain: "unknown",
      subdomain: "unclassified",
      claimedLevel: "beginner",
      evidence: "No specific keywords matched",
    });
  }

  return results;
}

/**
 * Group classified skills by domain for agent dispatch
 */
export function groupByDomain(classifiedSkills) {
  const groups = {};
  for (const skill of classifiedSkills) {
    const domain = skill.domain === "unknown" ? "catchall" : skill.domain;
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(skill);
  }
  return groups;
}
