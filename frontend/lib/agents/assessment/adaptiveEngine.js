// Mirror Test Engine — Swipe-based skill verification
// Replaces MCQ quiz with task card recognition + micro-verification

import { matchTasksForSkills } from "../../data/taskBank.js";
import { laborMarketData } from "../../data/laborMarket.js";

// ─── Evidence Tiers ─────────────────────────────────────────────────
export const EVIDENCE_TIERS = {
  SELF_REPORTED: { level: 1, label: "Self-Reported", color: "#60a5fa", confidence: [0.3, 0.5] },
  RECOGNIZED:    { level: 2, label: "Recognized",    color: "#fbbf24", confidence: [0.6, 0.8] },
  DEMONSTRATED:  { level: 3, label: "Demonstrated",  color: "#34d399", confidence: [0.85, 0.95] },
};

// ─── Sector → ISCO major-group mapping (mirrors opportunityMatcher.getSectorISCOGroups) ──
const SECTOR_TO_MAJOR = {
  "Agriculture": [6, 9],
  "Industry": [7, 8],
  "Manufacturing": [7, 8],
  "Construction": [7, 9],
  "Trade & Hospitality": [5, 9],
  "Transport & Storage": [8],
  "ICT": [2, 3, 7],
  "Financial Services": [2, 3, 4],
  "Education": [2],
  "Health": [2, 3, 5],
};

// ─── Pure helpers (deterministic, offline) ──────────────────────────
function clamp01(x) {
  if (typeof x !== "number" || Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function median(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Whether any of the skill's ISCO codes is locally prevalent in the country.
 * Boost-only signal: returns true/false but never penalises rare skills.
 */
function isLocallyPrevalent(iscos, countryCode) {
  if (!iscos || iscos.length === 0) return false;
  const data = laborMarketData[countryCode];
  if (!data) return false;

  // 1. Direct match against top youth occupations (4-digit ISCO).
  const topYouthCodes = (data.top_occupations_youth || []).map(o => String(o.isco));
  if (iscos.some(c => topYouthCodes.includes(String(c)))) return true;

  // 2. Major-group prevalence via above-median sector growth.
  const sectors = data.sectors || [];
  if (sectors.length === 0) return false;
  const medianGrowth = median(sectors.map(s => s.growth_rate));
  const aboveMedianMajors = sectors
    .filter(s => s.growth_rate >= medianGrowth)
    .flatMap(s => SECTOR_TO_MAJOR[s.name] || []);
  return iscos.some(c => {
    const firstDigit = parseInt(String(c).slice(0, 1), 10);
    return Number.isFinite(firstDigit) && aboveMedianMajors.includes(firstDigit);
  });
}

/**
 * Compute a continuous, multi-signal confidence score for a skill queue.
 * Pure function — deterministic, offline-safe. No Math.random / Date.now in math.
 *
 * Components & weights (sum = 1.0):
 *   evidence_density     0.25
 *   taxonomy_specificity 0.20
 *   mirror_confirm_rate  0.20
 *   complexity_breadth   0.15
 *   local_prevalence     0.10
 *   learning_source      0.05
 *   micro_verify         0.05
 */
function computeGroundedConfidence(queue, session) {
  // 1. mirror_confirm_rate — (yes + sometimes×0.5) / total_answered
  const totalAnswered = queue.cards.filter(c => c.response !== null).length || 1;
  const confirmedWeight = queue.yesCount + queue.sometimesCount * 0.5;
  const mirror_confirm_rate = clamp01(confirmedWeight / totalAnswered);

  // 2. complexity_breadth — fraction of complexity tiers with ≥1 confirmation
  const tiers = [
    queue.routineConfirmed > 0,
    queue.complexConfirmed > 0,
    queue.expertConfirmed > 0,
  ];
  const complexity_breadth = tiers.filter(Boolean).length / 3;

  // 3. taxonomy_specificity — 1.0 for any 4-digit ISCO, 0.5 for 3-digit, else 0
  const iscos = (queue.isco_codes || []).map(c => String(c));
  const taxonomy_specificity =
    iscos.some(c => /^\d{4}$/.test(c)) ? 1.0 :
    iscos.some(c => /^\d{3}$/.test(c)) ? 0.5 :
    0.0;

  // 4. evidence_density — distinct supporting phrases in narrative, cap 4 → /4
  const narrative = (session && session.narrative ? session.narrative : "").toLowerCase();
  const confirmedFirstWords = new Set();
  for (const card of queue.cards) {
    if (card.response !== "yes" && card.response !== "sometimes") continue;
    const cat = (card.category || "").replace(/_/g, " ").trim();
    if (!cat) continue;
    const firstWord = cat.split(" ")[0];
    if (firstWord && narrative.includes(firstWord)) {
      confirmedFirstWords.add(firstWord);
    }
  }
  const evidence_density = clamp01(Math.min(confirmedFirstWords.size, 4) / 4);

  // 5. local_prevalence — boost-only signal (never negative)
  const local_prevalence = isLocallyPrevalent(iscos, session && session.countryCode) ? 1.0 : 0.0;

  // 6. learning_source — apprenticeship > work > formal > self-taught > informal > self-reported
  const sourceMap = {
    apprenticeship: 1.0,
    work_experience: 0.9,
    formal_education: 0.8,
    self_taught: 0.6,
    informal_experience: 0.5,
    self_reported: 0.3,
  };
  const learning_source = sourceMap[queue.source] != null ? sourceMap[queue.source] : 0.5;

  // 7. micro_verify — 1.0 pass / 0.0 fail / 0.5 not yet attempted
  const micro_verify =
    queue.microVerifyPassed === true  ? 1.0 :
    queue.microVerifyPassed === false ? 0.0 :
    0.5;

  const components = {
    evidence_density,
    taxonomy_specificity,
    mirror_confirm_rate,
    complexity_breadth,
    local_prevalence,
    learning_source,
    micro_verify,
  };
  const weights = {
    evidence_density:     0.25,
    taxonomy_specificity: 0.20,
    mirror_confirm_rate:  0.20,
    complexity_breadth:   0.15,
    local_prevalence:     0.10,
    learning_source:      0.05,
    micro_verify:         0.05,
  };

  const raw = Object.keys(weights).reduce(
    (s, k) => s + components[k] * weights[k],
    0
  );

  return { score: clamp01(raw), components, weights };
}

/**
 * Create a Mirror Test session
 * @param {Array} classifiedSkills - Skills from agentRegistry
 * @param {string} countryCode - Country context
 * @param {string} narrative - The user's free-text skills description (for evidence density)
 */
export function createSession(classifiedSkills, countryCode, narrative = "") {
  // Match skills to task card sets
  const taskSets = matchTasksForSkills(classifiedSkills);

  // Build the session with task cards grouped by skill
  const skillQueues = taskSets.map((set) => {
    // Sort tasks: routine first, then complex, then expert
    const complexityOrder = { routine: 0, complex: 1, expert: 2 };
    const sortedTasks = [...set.tasks].sort(
      (a, b) => (complexityOrder[a.complexity] || 0) - (complexityOrder[b.complexity] || 0)
    );

    return {
      key: set.key,
      skillName: set.skill,
      label: set.label,
      domain: set.domain,
      isco_codes: set.isco_codes,
      claimedLevel: set.claimedLevel,
      source: set.source,
      // Card state
      cards: sortedTasks.map((task) => ({
        ...task,
        response: null, // "yes" | "sometimes" | "no" | null
      })),
      currentCardIndex: 0,
      isComplete: false,
      // Scoring
      yesCount: 0,
      sometimesCount: 0,
      noCount: 0,
      routineConfirmed: 0,
      complexConfirmed: 0,
      expertConfirmed: 0,
      // Results
      evidenceTier: null,
      confidence: 0,
      confidenceComponents: null,
      confidenceWeights: null,
      needsMicroVerify: false,
      microVerifyPassed: null,
    };
  });

  return {
    id: `mirror_${Date.now()}`,
    countryCode,
    narrative,
    phase: "mirror", // "mirror" | "micro_verify" | "complete"
    skillQueues,
    currentSkillIndex: 0,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

/**
 * Get the next card to show
 */
export function getNextCard(session) {
  const { skillQueues, currentSkillIndex } = session;

  // Find current active skill
  let idx = currentSkillIndex;
  while (idx < skillQueues.length && skillQueues[idx].isComplete) {
    idx++;
  }

  if (idx >= skillQueues.length) {
    // All Mirror Test cards done — check for micro-verification
    return checkMicroVerifyPhase(session);
  }

  session.currentSkillIndex = idx;
  const queue = skillQueues[idx];
  const card = queue.cards[queue.currentCardIndex];

  if (!card) {
    // No more cards for this skill — complete it
    completeSkill(queue, session);
    return getNextCard(session);
  }

  return {
    type: "card",
    phase: "mirror",
    skillIndex: idx,
    skillName: queue.label,
    domain: queue.domain,
    cardIndex: queue.currentCardIndex,
    totalCards: queue.cards.length,
    totalSkills: skillQueues.length,
    currentSkillNumber: idx + 1,
    card: {
      id: card.id,
      text: card.text,
      complexity: card.complexity,
      category: card.category,
    },
    // Progress
    progress: {
      confirmed: queue.yesCount + queue.sometimesCount,
      total: queue.currentCardIndex,
      remaining: queue.cards.length - queue.currentCardIndex,
    },
  };
}

/**
 * Process a swipe response
 * @param {object} session
 * @param {number} skillIndex
 * @param {number} cardIndex
 * @param {string} response - "yes" | "sometimes" | "no"
 */
export function processSwipe(session, skillIndex, cardIndex, response) {
  const queue = session.skillQueues[skillIndex];
  if (!queue) return { error: "Invalid skill index" };

  const card = queue.cards[cardIndex];
  if (!card) return { error: "Invalid card index" };

  // Record response
  card.response = response;

  // Update counts
  if (response === "yes") {
    queue.yesCount++;
    if (card.complexity === "routine") queue.routineConfirmed++;
    else if (card.complexity === "complex") queue.complexConfirmed++;
    else if (card.complexity === "expert") queue.expertConfirmed++;
  } else if (response === "sometimes") {
    queue.sometimesCount++;
    if (card.complexity === "routine") queue.routineConfirmed += 0.5;
    else if (card.complexity === "complex") queue.complexConfirmed += 0.5;
  }

  if (response === "no") {
    queue.noCount++;
  }

  // Adaptive routing: if they say "no" to multiple routine tasks,
  // skip the complex/expert ones for this skill
  const routineTasks = queue.cards.filter(c => c.complexity === "routine");
  const routineNos = routineTasks.filter(c => c.response === "no").length;
  const routineAnswered = routineTasks.filter(c => c.response !== null).length;

  if (routineAnswered >= 3 && routineNos >= 2) {
    // Skip remaining complex/expert cards — they clearly don't do this skill
    completeSkill(queue, session);
    return { skipped: true, next: getNextCard(session) };
  }

  // Move to next card
  queue.currentCardIndex = cardIndex + 1;

  // Check if all cards answered
  if (queue.currentCardIndex >= queue.cards.length) {
    completeSkill(queue, session);
  }

  return { next: getNextCard(session) };
}

/**
 * Complete a skill assessment and compute scores using the multi-signal model.
 */
function completeSkill(queue, session) {
  queue.isComplete = true;

  const { score, components, weights } = computeGroundedConfidence(queue, session);
  queue.confidence = round2(score);
  queue.confidenceComponents = components;
  queue.confidenceWeights = weights;

  // Continuous-score → tier mapping
  queue.evidenceTier =
    score >= 0.80 ? "DEMONSTRATED" :
    score >= 0.60 ? "RECOGNIZED"   :
    "SELF_REPORTED";

  // Micro-verify window: borderline scores benefit most from a single verify task
  queue.needsMicroVerify = (score >= 0.55 && score < 0.78);
}

/**
 * Check if we need to do micro-verification
 */
function checkMicroVerifyPhase(session) {
  const needsVerify = session.skillQueues.filter(q => q.needsMicroVerify && q.microVerifyPassed === null);

  if (needsVerify.length > 0 && session.phase !== "complete") {
    session.phase = "micro_verify";
    const skill = needsVerify[0];
    const skillIdx = session.skillQueues.indexOf(skill);

    return {
      type: "micro_verify",
      phase: "micro_verify",
      skillIndex: skillIdx,
      skillName: skill.label,
      domain: skill.domain,
      totalToVerify: needsVerify.length,
      currentVerifyNumber: session.skillQueues.filter(q => q.needsMicroVerify && q.microVerifyPassed !== null).length + 1,
    };
  }

  // All done
  session.phase = "complete";
  session.completedAt = new Date().toISOString();
  return {
    type: "complete",
    phase: "complete",
    results: generateFinalResults(session),
  };
}

/**
 * Process micro-verification result.
 * Re-computes the score so the explainer stays accurate (no `+0.15` additive).
 */
export function processMicroVerify(session, skillIndex, passed) {
  const queue = session.skillQueues[skillIndex];
  if (!queue) return { error: "Invalid skill index" };

  queue.microVerifyPassed = passed;

  // Re-run the multi-signal score; flipping micro_verify (0.5 → 1.0 or 0.0)
  // shifts the result naturally, preserving determinism.
  const { score, components, weights } = computeGroundedConfidence(queue, session);
  queue.confidence = round2(score);
  queue.confidenceComponents = components;
  queue.confidenceWeights = weights;
  queue.evidenceTier =
    score >= 0.80 ? "DEMONSTRATED" :
    score >= 0.60 ? "RECOGNIZED"   :
    "SELF_REPORTED";

  // Check for more micro-verifications needed
  return { next: checkMicroVerifyPhase(session) };
}

/**
 * Generate final results
 */
function generateFinalResults(session) {
  const skills = session.skillQueues.map((q) => {
    const tier = EVIDENCE_TIERS[q.evidenceTier] || EVIDENCE_TIERS.SELF_REPORTED;

    // Determine verified level from task confirmations
    let verifiedLevel = "awareness";
    if (q.expertConfirmed >= 1 && q.complexConfirmed >= 2) verifiedLevel = "expert";
    else if (q.complexConfirmed >= 2) verifiedLevel = "advanced";
    else if (q.routineConfirmed >= 2 && q.complexConfirmed >= 1) verifiedLevel = "intermediate";
    else if (q.routineConfirmed >= 2) verifiedLevel = "basic";

    // Collect confirmed task descriptions
    const confirmedTasks = q.cards
      .filter(c => c.response === "yes" || c.response === "sometimes")
      .map(c => ({
        text: c.text,
        complexity: c.complexity,
        confirmed: c.response === "yes" ? "fully" : "partially",
      }));

    return {
      skill: q.skillName,
      label: q.label,
      domain: q.domain,
      isco_codes: q.isco_codes,
      claimedLevel: q.claimedLevel,
      verifiedLevel,
      evidenceTier: q.evidenceTier,
      evidenceLabel: tier.label,
      evidenceColor: tier.color,
      confidence: Math.round(q.confidence * 100) / 100,
      confidenceComponents: q.confidenceComponents,
      confidenceWeights: q.confidenceWeights,
      usedGenericFallback: q.key === "generic_unknown",
      confirmedTasks,
      taskCounts: {
        yes: q.yesCount,
        sometimes: q.sometimesCount,
        no: q.noCount,
        total: q.cards.filter(c => c.response !== null).length,
      },
      microVerified: q.microVerifyPassed,
    };
  });

  // Filter out skills with zero confirmed tasks
  const meaningful = skills.filter(s => s.taskCounts.yes > 0 || s.taskCounts.sometimes > 0);

  const avgConfidence = meaningful.length > 0
    ? meaningful.reduce((sum, s) => sum + s.confidence, 0) / meaningful.length
    : 0;

  return {
    sessionId: session.id,
    completedAt: session.completedAt,
    totalSkillsAssessed: meaningful.length,
    overallConfidence: Math.round(avgConfidence * 100) / 100,
    evidenceDistribution: {
      demonstrated: meaningful.filter(s => s.evidenceTier === "DEMONSTRATED").length,
      recognized: meaningful.filter(s => s.evidenceTier === "RECOGNIZED").length,
      selfReported: meaningful.filter(s => s.evidenceTier === "SELF_REPORTED").length,
    },
    skills: meaningful,
  };
}
