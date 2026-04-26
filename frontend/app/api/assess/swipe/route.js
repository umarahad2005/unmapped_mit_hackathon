// API Route: Process Swipe / Micro-Verification
// POST /api/assess/swipe — Handles task card swipes and micro-verify answers
import { processSwipe, processMicroVerify, getNextCard } from "../../../../lib/agents/assessment/adaptiveEngine.js";
import { generateMicroVerification, evaluateMicroAnswer } from "../../../../lib/agents/assessment/specialistAgents.js";
import { getSession, setSession } from "../../../../lib/agents/assessment/sessionStore.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, action } = body;

    if (!sessionId) {
      return Response.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return Response.json({ error: "Session not found — please restart" }, { status: 404 });
    }

    let result;

    if (action === "swipe") {
      // Mirror Test swipe: yes / sometimes / no
      const { skillIndex, cardIndex, response } = body;
      if (skillIndex === undefined || cardIndex === undefined || !response) {
        return Response.json({ error: "Missing swipe fields" }, { status: 400 });
      }
      result = processSwipe(session, skillIndex, cardIndex, response);

    } else if (action === "get_micro_verify") {
      // Generate micro-verification scenario for a skill
      const { skillIndex } = body;
      const queue = session.skillQueues[skillIndex];
      if (!queue) {
        return Response.json({ error: "Invalid skill index" }, { status: 400 });
      }

      const confirmedTasks = queue.cards
        .filter(c => c.response === "yes" || c.response === "sometimes")
        .map(c => ({ text: c.text, complexity: c.complexity }));

      const scenario = await generateMicroVerification(
        queue.label, queue.domain, confirmedTasks, session.countryCode
      );

      result = { scenario, skillIndex };

    } else if (action === "micro_verify_answer") {
      // Evaluate micro-verification answer
      const { skillIndex, scenario, question, answer, goodIndicators } = body;

      const evaluation = await evaluateMicroAnswer(scenario, question, answer, goodIndicators || []);
      const microResult = processMicroVerify(session, skillIndex, evaluation.passed);

      result = {
        evaluation,
        ...microResult,
      };

    } else {
      return Response.json({ error: "Invalid action" }, { status: 400 });
    }

    // Save updated session
    setSession(sessionId, session);

    return Response.json({ success: true, ...result });

  } catch (error) {
    console.error("Swipe processing error:", error);
    return Response.json({
      error: "Failed to process action",
      details: error.message,
    }, { status: 500 });
  }
}
