// API Route: Start Mirror Test Assessment
// POST /api/assess — Classifies skills, matches tasks, returns first card
import { classifySkills } from "../../../lib/agents/assessment/agentRegistry.js";
import { createSession, getNextCard } from "../../../lib/agents/assessment/adaptiveEngine.js";
import { setSession } from "../../../lib/agents/assessment/sessionStore.js";

export async function POST(request) {
  try {
    const { skillsText, countryCode, education, skills } = await request.json();

    if (!skillsText && (!skills || skills.length === 0)) {
      return Response.json({ error: "No skills provided" }, { status: 400 });
    }

    // Step 1: Classify skills into domains
    let classifiedSkills;
    if (skills && skills.length > 0) {
      classifiedSkills = skills.map(s => ({
        skill: s.name || s.skill,
        domain: s.category || s.domain || "unknown",
        subdomain: s.subcategory || s.subdomain || "unknown",
        claimedLevel: s.level || "intermediate",
        isco_codes: s.isco_codes || [],
      }));
    } else {
      classifiedSkills = await classifySkills(skillsText, countryCode);
    }

    // Step 2: Create Mirror Test session (matches skills → task cards)
    const session = createSession(classifiedSkills, countryCode, skillsText || "");
    setSession(session.id, session);

    // Step 3: Get first card
    const firstCard = getNextCard(session);

    return Response.json({
      success: true,
      sessionId: session.id,
      totalSkills: session.skillQueues.length,
      skills: session.skillQueues.map(q => ({
        skill: q.skillName,
        label: q.label,
        domain: q.domain,
        taskCount: q.cards.length,
      })),
      ...firstCard,
    });
  } catch (error) {
    console.error("Assessment start error:", error);
    return Response.json({
      error: "Failed to start assessment",
      details: error.message,
    }, { status: 500 });
  }
}
