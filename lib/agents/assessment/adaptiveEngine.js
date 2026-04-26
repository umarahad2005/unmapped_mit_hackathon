// Mirror Test Engine — Swipe-based skill verification
// Replaces MCQ quiz with task card recognition + micro-verification

import { matchTasksForSkills } from "../../data/taskBank.js";

// ─── Evidence Tiers ─────────────────────────────────────────────────
export const EVIDENCE_TIERS = {
  SELF_REPORTED: { level: 1, label: "Self-Reported", color: "#60a5fa", confidence: [0.3, 0.5] },
  RECOGNIZED:    { level: 2, label: "Recognized",    color: "#fbbf24", confidence: [0.6, 0.8] },
  DEMONSTRATED:  { level: 3, label: "Demonstrated",  color: "#34d399", confidence: [0.85, 0.95] },
};

/**
 * Create a Mirror Test session
 * @param {Array} classifiedSkills - Skills from agentRegistry
 * @param {string} countryCode - Country context
 */
export function createSession(classifiedSkills, countryCode) {
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
      needsMicroVerify: false,
      microVerifyPassed: null,
    };
  });

  return {
    id: `mirror_${Date.now()}`,
    countryCode,
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
    completeSkill(queue);
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
    completeSkill(queue);
    return { skipped: true, next: getNextCard(session) };
  }

  // Move to next card
  queue.currentCardIndex = cardIndex + 1;

  // Check if all cards answered
  if (queue.currentCardIndex >= queue.cards.length) {
    completeSkill(queue);
  }

  return { next: getNextCard(session) };
}

/**
 * Complete a skill assessment and compute scores
 */
function completeSkill(queue) {
  queue.isComplete = true;

  const totalConfirmed = queue.yesCount + (queue.sometimesCount * 0.5);
  const totalCards = queue.cards.filter(c => c.response !== null).length;

  // Determine evidence tier
  if (totalConfirmed >= 3 && queue.complexConfirmed >= 1) {
    queue.needsMicroVerify = true; // Eligible for upgrade to "Demonstrated"
    queue.evidenceTier = "RECOGNIZED";
    queue.confidence = 0.6 + Math.min(totalConfirmed * 0.03, 0.15);
  } else if (totalConfirmed >= 1) {
    queue.evidenceTier = "SELF_REPORTED";
    queue.confidence = 0.3 + Math.min(totalConfirmed * 0.05, 0.2);
  } else {
    queue.evidenceTier = "SELF_REPORTED";
    queue.confidence = 0.2;
  }

  // Boost for expert-level confirmations
  if (queue.expertConfirmed >= 1) {
    queue.confidence = Math.min(queue.confidence + 0.1, 0.85);
  }
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
 * Process micro-verification result
 */
export function processMicroVerify(session, skillIndex, passed) {
  const queue = session.skillQueues[skillIndex];
  if (!queue) return { error: "Invalid skill index" };

  queue.microVerifyPassed = passed;

  if (passed) {
    queue.evidenceTier = "DEMONSTRATED";
    queue.confidence = Math.min(queue.confidence + 0.15, 0.95);
  }

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
