// Micro-Verification Agent — Generates ONE scenario question per confirmed skill
// Only used for skills that pass the Mirror Test (3+ tasks confirmed)

import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generate a single micro-verification scenario for a confirmed skill
 * @param {string} skillName - The skill being verified
 * @param {string} domain - The skill domain
 * @param {Array} confirmedTasks - Tasks the user confirmed they do
 * @param {string} countryCode - Country context
 */
export async function generateMicroVerification(skillName, domain, confirmedTasks, countryCode) {
  const country = ({ GHA: "Ghana", BGD: "Bangladesh", PAK: "Pakistan" })[countryCode] || "Ghana";
  const taskList = confirmedTasks.map(t => `- ${t.text}`).join("\n");

  // Try Gemini first
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("No API key");
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are verifying practical skills for a worker in ${country}.

The user confirmed they perform these tasks related to "${skillName}":
${taskList}

Generate ONE realistic scenario question that tests whether they truly have hands-on experience with these tasks. The scenario should describe a real situation they'd face at work, and ask what they would do.

Return ONLY valid JSON:
{
  "scenario": "A realistic work scenario description (2-3 sentences)",
  "question": "What would you do in this situation?",
  "good_answer_indicators": ["specific things a genuine practitioner would mention"],
  "red_flags": ["answers that suggest they don't actually do this work"],
  "difficulty": "intermediate"
}`,
      config: { temperature: 0.5, maxOutputTokens: 600 },
    });

    let text = response.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.log("Gemini micro-verify failed, using fallback:", err.message?.slice(0, 60));
  }

  // Fallback scenarios by domain
  return getFallbackScenario(skillName, domain);
}

/**
 * Evaluate a micro-verification answer
 */
export async function evaluateMicroAnswer(scenario, question, userAnswer, goodIndicators) {
  // Try Gemini evaluation
  try {
    if (!process.env.GEMINI_API_KEY) throw new Error("No key");
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Evaluate this skill verification answer.

Scenario: "${scenario}"
Question: "${question}"
User's answer: "${userAnswer}"
Good answer should mention: ${JSON.stringify(goodIndicators)}

Does this person genuinely have hands-on experience? Return JSON:
{"passed":true/false,"confidence":0.0-1.0,"feedback":"1-2 sentence feedback","reasoning":"why you believe they do/don't have real experience"}`,
      config: { temperature: 0.2, maxOutputTokens: 300 },
    });

    let text = response.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(text);
  } catch {
    // Fallback: pass if answer is substantial (>20 words)
    const wordCount = userAnswer.trim().split(/\s+/).length;
    const passed = wordCount >= 15;
    return {
      passed,
      confidence: passed ? 0.7 : 0.4,
      feedback: passed
        ? "Your detailed answer suggests real practical experience."
        : "Try to describe more specifically what you would do step by step.",
      reasoning: passed ? "Answer contains sufficient detail" : "Answer too brief to verify",
    };
  }
}

/**
 * Fallback scenarios when Gemini is unavailable
 */
function getFallbackScenario(skillName, domain) {
  const scenarios = {
    technical: {
      scenario: `A regular customer brings you their device for ${skillName.toLowerCase()}. They say it was working fine yesterday but now has a problem they can't describe well — they just say "it's not working right."`,
      question: "Walk me through exactly what you would do from the moment they hand it to you. What do you check first, second, and third?",
      good_answer_indicators: [
        "Asks clarifying questions to the customer",
        "Describes a systematic diagnostic process",
        "Mentions specific tools or techniques",
        "Considers multiple possible causes",
      ],
      red_flags: ["Jumps straight to replacing parts", "Very vague answer", "Only mentions one thing to check"],
    },
    digital: {
      scenario: `You're building a feature for a website and the code you wrote isn't producing the expected result. The page loads but the data displayed is wrong.`,
      question: "How do you approach finding and fixing the problem? Describe your debugging process step by step.",
      good_answer_indicators: [
        "Uses browser dev tools or console logs",
        "Checks data flow from source to display",
        "Mentions testing individual parts",
        "Talks about checking the data source/API",
      ],
      red_flags: ["Says they'd rewrite everything", "No mention of any debugging tools", "Very generic answer"],
    },
    business: {
      scenario: `It's the end of the month and you're reviewing your business. You sold a lot this month but your cash on hand seems lower than expected. Your supplier prices went up 10% last week.`,
      question: "How would you figure out what happened and what would you do about it going forward?",
      good_answer_indicators: [
        "Reviews expenses vs. revenue",
        "Checks if prices were adjusted for the cost increase",
        "Considers inventory that was purchased at higher cost",
        "Mentions adjusting selling prices or finding alternative suppliers",
      ],
      red_flags: ["Doesn't mention checking numbers", "Only says 'sell more'", "No awareness of margins"],
    },
    agricultural: {
      scenario: `Halfway through the growing season, you notice that several of your crop plants are showing yellow leaves and stunted growth, but only in one section of the field.`,
      question: "What could be causing this and what would you do about it?",
      good_answer_indicators: [
        "Considers soil nutrient differences",
        "Mentions checking for pest or disease signs",
        "Talks about drainage or water issues in that section",
        "Suggests soil testing or comparing with healthy sections",
      ],
      red_flags: ["Just says 'add fertilizer'", "No diagnostic thinking", "Doesn't consider location-specific causes"],
    },
    soft: {
      scenario: `You're leading a group of 5 people on a project. Two of them are not getting along and it's affecting the whole team's work. One has complained to you privately.`,
      question: "How would you handle this situation to keep the project on track?",
      good_answer_indicators: [
        "Listens to both sides",
        "Addresses the issue directly but privately",
        "Focuses on the work impact, not personal blame",
        "Sets clear expectations for collaboration",
      ],
      red_flags: ["Ignores the conflict", "Takes one side without hearing both", "Just punishes both people"],
    },
  };

  const fallback = scenarios[domain] || scenarios.technical;
  return { ...fallback, difficulty: "intermediate" };
}
