// Gemini API Route — Server-side skill extraction using Gemini
// Tries multiple models with fallback for rate limit resilience
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are UNMAPPED Skills Signal Engine — an AI that extracts structured skills from informal, free-text descriptions by youth in low- and middle-income countries.

Your task: Given a user's natural language description of what they can do, extract ALL skills and map them to structured data.

RULES:
1. Extract every skill mentioned, including implicit ones
2. Categorize each as: technical, digital, business, agricultural, or soft
3. Map to ISCO-08 codes where possible (use the 4-digit code)
4. Assess confidence (0.0-1.0) based on how explicitly the skill was described
5. Identify the learning source: self_taught, formal_education, apprenticeship, work_experience, community, informal_experience
6. Extract any languages mentioned
7. Be generous — informal skills matter. "I help my aunt sell clothes" = sales, customer_service, inventory_management

Respond ONLY with valid JSON in this exact format:
{
  "skills": [
    {
      "name": "Skill Name",
      "category": "technical|digital|business|agricultural|soft",
      "subcategory": "specific_type",
      "source": "self_taught|formal_education|apprenticeship|work_experience|community|informal_experience",
      "isco_codes": ["7422"],
      "confidence": 0.85,
      "reasoning": "Brief explanation of why this skill was extracted"
    }
  ],
  "languages": ["English", "Twi"],
  "summary": "Brief 1-sentence summary of this person's skill profile"
}`;

// Models to try in order (each has its own rate limit quota)
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

async function tryExtract(model, userPrompt) {
  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  });

  let text = response.text;
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(text);
  return { parsed, model };
}

export async function POST(request) {
  try {
    const { skillsText, countryCode, education } = await request.json();

    if (!skillsText) {
      return Response.json({ error: "No skills text provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const COUNTRY_NAMES = { GHA: 'Ghana', BGD: 'Bangladesh', PAK: 'Pakistan' };
    const countryName = COUNTRY_NAMES[countryCode] || 'Ghana';

    const userPrompt = `Country context: ${countryName}
Education level: ${education || 'not specified'}

User's description of their skills and experience:
"${skillsText}"

Extract all skills from the above text and return structured JSON.`;

    // Try each model in sequence until one succeeds
    let lastError = null;
    for (const model of MODELS) {
      try {
        console.log(`Trying model: ${model}`);
        const { parsed, model: usedModel } = await tryExtract(model, userPrompt);

        const skills = parsed.skills.map((skill, i) => ({
          ...skill,
          id: `gemini_skill_${Date.now()}_${i}`,
          matched_keywords: [],
          ai_extracted: true,
        }));

        return Response.json({
          success: true,
          skills,
          languages: parsed.languages || [],
          summary: parsed.summary || "",
          model: usedModel,
          extracted_at: new Date().toISOString(),
        });
      } catch (err) {
        console.log(`Model ${model} failed: ${err.message?.slice(0, 100)}`);
        lastError = err;
        // If it's not a rate limit error, don't try other models
        if (!err.message?.includes('429') && !err.message?.includes('RESOURCE_EXHAUSTED') && !err.message?.includes('quota')) {
          break;
        }
        // Otherwise, try next model
      }
    }

    // All models failed
    console.error("All Gemini models exhausted:", lastError?.message?.slice(0, 200));
    return Response.json({
      error: "Gemini extraction failed — all models rate limited",
      details: lastError?.message?.slice(0, 200),
      fallback: true,
    }, { status: 429 });

  } catch (error) {
    console.error("Gemini extraction error:", error);
    return Response.json({
      error: "Gemini extraction failed",
      details: error.message,
      fallback: true,
    }, { status: 500 });
  }
}
