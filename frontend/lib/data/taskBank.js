// O*NET-style Task Bank — Real work activity descriptions mapped to ISCO codes
// Each task describes actual work someone does, used for the Mirror Test
// Source pattern: O*NET Task Statements adapted for LMIC contexts

const taskBank = {
  // ─── PHONE/ELECTRONICS REPAIR (ISCO 7421, 7422) ────────────────
  "phone_repair": {
    label: "Phone & Electronics Repair",
    isco_codes: ["7421", "7422"],
    domain: "technical",
    tasks: [
      { id: "pr_1", text: "Diagnose hardware problems by testing individual phone components", complexity: "routine", category: "diagnosis" },
      { id: "pr_2", text: "Replace cracked or broken screens on smartphones and tablets", complexity: "routine", category: "repair" },
      { id: "pr_3", text: "Fix charging port issues — cleaning, re-soldering, or replacing the port", complexity: "routine", category: "repair" },
      { id: "pr_4", text: "Troubleshoot software problems and perform factory resets", complexity: "routine", category: "software" },
      { id: "pr_5", text: "Replace phone batteries and test for proper charging cycles", complexity: "routine", category: "repair" },
      { id: "pr_6", text: "Solder small components on circuit boards using a soldering station", complexity: "complex", category: "advanced_repair" },
      { id: "pr_7", text: "Repair water-damaged phones — disassemble, clean, dry, and test each component", complexity: "complex", category: "advanced_repair" },
      { id: "pr_8", text: "Read circuit board schematics to trace faulty connections", complexity: "complex", category: "diagnosis" },
      { id: "pr_9", text: "Manage customer repair orders, provide cost estimates and timelines", complexity: "routine", category: "business" },
      { id: "pr_10", text: "Train apprentices in phone repair techniques", complexity: "expert", category: "teaching" },
      { id: "pr_11", text: "Source replacement parts from wholesale suppliers and manage inventory", complexity: "complex", category: "business" },
      { id: "pr_12", text: "Perform motherboard-level (IC) repairs using a hot air rework station", complexity: "expert", category: "advanced_repair" },
    ],
  },

  // ─── PROGRAMMING / WEB DEV (ISCO 2512, 2513) ──────────────────
  "programming": {
    label: "Programming & Web Development",
    isco_codes: ["2512", "2513"],
    domain: "digital",
    tasks: [
      { id: "pg_1", text: "Write basic programs that take input and produce output", complexity: "routine", category: "coding" },
      { id: "pg_2", text: "Build web pages with HTML and style them with CSS", complexity: "routine", category: "web" },
      { id: "pg_3", text: "Use variables, loops, and conditions to solve problems in code", complexity: "routine", category: "coding" },
      { id: "pg_4", text: "Find and fix bugs in existing code (debugging)", complexity: "complex", category: "debugging" },
      { id: "pg_5", text: "Connect a website or app to a database to store and retrieve data", complexity: "complex", category: "backend" },
      { id: "pg_6", text: "Use Git or version control to manage code changes", complexity: "complex", category: "tools" },
      { id: "pg_7", text: "Build interactive features using JavaScript (forms, buttons, dynamic content)", complexity: "complex", category: "web" },
      { id: "pg_8", text: "Deploy a website or application to a hosting service", complexity: "complex", category: "deployment" },
      { id: "pg_9", text: "Design and consume REST APIs for data exchange between services", complexity: "expert", category: "architecture" },
      { id: "pg_10", text: "Optimize code performance — reducing load times, caching, efficient queries", complexity: "expert", category: "optimization" },
    ],
  },

  // ─── SALES & TRADING (ISCO 5211, 5221, 9510) ──────────────────
  "sales_trading": {
    label: "Sales, Trading & Market Commerce",
    isco_codes: ["5211", "5221", "9510"],
    domain: "business",
    tasks: [
      { id: "st_1", text: "Sell products directly to customers at a market stall or shop", complexity: "routine", category: "sales" },
      { id: "st_2", text: "Handle cash transactions and give correct change", complexity: "routine", category: "transactions" },
      { id: "st_3", text: "Arrange and display products to attract customers", complexity: "routine", category: "merchandising" },
      { id: "st_4", text: "Negotiate prices with customers while maintaining profit margins", complexity: "complex", category: "negotiation" },
      { id: "st_5", text: "Track inventory — know what's in stock, what's selling, what to reorder", complexity: "complex", category: "inventory" },
      { id: "st_6", text: "Negotiate with suppliers for better prices on bulk purchases", complexity: "complex", category: "sourcing" },
      { id: "st_7", text: "Accept mobile money payments (M-Pesa, MTN Mobile Money)", complexity: "routine", category: "digital_payments" },
      { id: "st_8", text: "Calculate profit margins and adjust pricing based on costs", complexity: "complex", category: "finance" },
      { id: "st_9", text: "Build relationships with repeat customers to ensure loyalty", complexity: "complex", category: "customer_relations" },
      { id: "st_10", text: "Manage multiple staff or helpers at busy trading periods", complexity: "expert", category: "management" },
    ],
  },

  // ─── TAILORING / DRESSMAKING (ISCO 7531) ───────────────────────
  "tailoring": {
    label: "Tailoring & Dressmaking",
    isco_codes: ["7531"],
    domain: "technical",
    tasks: [
      { id: "tl_1", text: "Take body measurements for custom garment fitting", complexity: "routine", category: "measurement" },
      { id: "tl_2", text: "Cut fabric according to a pattern or design", complexity: "routine", category: "cutting" },
      { id: "tl_3", text: "Operate a sewing machine for straight seams and hems", complexity: "routine", category: "sewing" },
      { id: "tl_4", text: "Create custom patterns from scratch based on customer requests", complexity: "complex", category: "design" },
      { id: "tl_5", text: "Alter and resize existing garments for a better fit", complexity: "complex", category: "alteration" },
      { id: "tl_6", text: "Apply decorative elements — embroidery, beadwork, or appliqué", complexity: "complex", category: "decoration" },
      { id: "tl_7", text: "Select appropriate fabrics for different garment types and seasons", complexity: "complex", category: "materials" },
      { id: "tl_8", text: "Design original clothing styles for events or fashion shows", complexity: "expert", category: "design" },
    ],
  },

  // ─── FARMING / AGRICULTURE (ISCO 6111, 6121, 6130) ────────────
  "farming": {
    label: "Farming & Crop Production",
    isco_codes: ["6111", "6121", "6130"],
    domain: "agricultural",
    tasks: [
      { id: "fm_1", text: "Prepare land for planting — clearing, tilling, or creating beds", complexity: "routine", category: "land_prep" },
      { id: "fm_2", text: "Plant seeds or seedlings at the right spacing and depth", complexity: "routine", category: "planting" },
      { id: "fm_3", text: "Apply fertilizer or organic compost to improve soil nutrition", complexity: "routine", category: "nutrition" },
      { id: "fm_4", text: "Water crops using manual, drip, or channel irrigation methods", complexity: "routine", category: "irrigation" },
      { id: "fm_5", text: "Identify and manage crop pests and diseases", complexity: "complex", category: "pest_management" },
      { id: "fm_6", text: "Plan crop rotation schedules to maintain soil health", complexity: "complex", category: "planning" },
      { id: "fm_7", text: "Harvest crops at the right time and handle post-harvest storage", complexity: "complex", category: "harvest" },
      { id: "fm_8", text: "Keep records of inputs, yields, and expenses per growing season", complexity: "complex", category: "record_keeping" },
      { id: "fm_9", text: "Manage farm workers during peak planting or harvest seasons", complexity: "expert", category: "management" },
      { id: "fm_10", text: "Estimate yield potential and plan market sales strategy", complexity: "expert", category: "business" },
    ],
  },

  // ─── DRIVING / TRANSPORT (ISCO 8322, 8332) ────────────────────
  "driving": {
    label: "Driving & Transport Services",
    isco_codes: ["8322", "8332"],
    domain: "technical",
    tasks: [
      { id: "dr_1", text: "Drive passengers or goods safely through city traffic", complexity: "routine", category: "driving" },
      { id: "dr_2", text: "Perform daily vehicle checks — oil, water, tires, brakes, lights", complexity: "routine", category: "maintenance" },
      { id: "dr_3", text: "Navigate routes efficiently using maps or GPS", complexity: "routine", category: "navigation" },
      { id: "dr_4", text: "Handle customer payments including mobile money and ride apps", complexity: "routine", category: "business" },
      { id: "dr_5", text: "Manage vehicle documentation — license, insurance, permits", complexity: "complex", category: "compliance" },
      { id: "dr_6", text: "Handle minor mechanical breakdowns on the road", complexity: "complex", category: "repair" },
      { id: "dr_7", text: "Coordinate deliveries and manage pickup/drop-off schedules", complexity: "complex", category: "logistics" },
      { id: "dr_8", text: "Drive long-distance routes requiring fuel and rest planning", complexity: "complex", category: "planning" },
    ],
  },

  // ─── HAIRDRESSING / BEAUTY (ISCO 5141) ────────────────────────
  "hairdressing": {
    label: "Hairdressing & Beauty Services",
    isco_codes: ["5141"],
    domain: "technical",
    tasks: [
      { id: "hd_1", text: "Wash, condition, and blow-dry hair for clients", complexity: "routine", category: "basic_care" },
      { id: "hd_2", text: "Cut hair to different styles based on client preferences", complexity: "routine", category: "cutting" },
      { id: "hd_3", text: "Apply hair treatments — relaxers, perms, or keratin treatments", complexity: "complex", category: "chemical" },
      { id: "hd_4", text: "Create braided styles — cornrows, box braids, twists", complexity: "complex", category: "styling" },
      { id: "hd_5", text: "Install and maintain hair extensions or weaves", complexity: "complex", category: "extensions" },
      { id: "hd_6", text: "Advise clients on hair care routines for their hair type", complexity: "complex", category: "consultation" },
      { id: "hd_7", text: "Mix and apply hair coloring products safely", complexity: "complex", category: "coloring" },
      { id: "hd_8", text: "Manage salon appointments and maintain a client base", complexity: "expert", category: "business" },
    ],
  },

  // ─── CONSTRUCTION / BUILDING (ISCO 7111, 7112, 7115) ──────────
  "construction": {
    label: "Construction & Building",
    isco_codes: ["7111", "7112", "7115"],
    domain: "technical",
    tasks: [
      { id: "cn_1", text: "Mix concrete or mortar to the correct consistency", complexity: "routine", category: "materials" },
      { id: "cn_2", text: "Lay bricks or blocks in straight, level courses", complexity: "routine", category: "masonry" },
      { id: "cn_3", text: "Measure and cut building materials accurately", complexity: "routine", category: "preparation" },
      { id: "cn_4", text: "Install roofing — corrugated sheets, tiles, or other materials", complexity: "complex", category: "roofing" },
      { id: "cn_5", text: "Read basic building plans and follow construction specifications", complexity: "complex", category: "planning" },
      { id: "cn_6", text: "Install doors, windows, and frames in walls", complexity: "complex", category: "finishing" },
      { id: "cn_7", text: "Apply plaster or render to walls and ceilings", complexity: "complex", category: "finishing" },
      { id: "cn_8", text: "Estimate material quantities and costs for a building project", complexity: "expert", category: "estimating" },
      { id: "cn_9", text: "Supervise a team of workers on a construction site", complexity: "expert", category: "supervision" },
    ],
  },

  // ─── TEACHING / TUTORING (ISCO 2320, 2330) ────────────────────
  "teaching": {
    label: "Teaching & Training",
    isco_codes: ["2320", "2330"],
    domain: "soft",
    tasks: [
      { id: "tc_1", text: "Explain concepts clearly in ways different learners can understand", complexity: "routine", category: "instruction" },
      { id: "tc_2", text: "Prepare lesson plans or training materials before a session", complexity: "complex", category: "planning" },
      { id: "tc_3", text: "Assess learner progress and give constructive feedback", complexity: "complex", category: "assessment" },
      { id: "tc_4", text: "Adapt teaching methods when a student struggles with a concept", complexity: "complex", category: "adaptation" },
      { id: "tc_5", text: "Manage classroom behavior and keep learners engaged", complexity: "complex", category: "management" },
      { id: "tc_6", text: "Mentor or counsel students on career and personal development", complexity: "expert", category: "mentoring" },
    ],
  },

  // ─── COOKING / FOOD PREP (ISCO 5120, 7512) ────────────────────
  "cooking": {
    label: "Cooking & Food Preparation",
    isco_codes: ["5120", "7512"],
    domain: "technical",
    tasks: [
      { id: "ck_1", text: "Prepare ingredients — washing, peeling, cutting, and measuring", complexity: "routine", category: "prep" },
      { id: "ck_2", text: "Cook basic meals using common techniques (boiling, frying, grilling)", complexity: "routine", category: "cooking" },
      { id: "ck_3", text: "Follow recipes and adjust seasoning to taste", complexity: "routine", category: "cooking" },
      { id: "ck_4", text: "Maintain kitchen hygiene and food safety standards", complexity: "routine", category: "safety" },
      { id: "ck_5", text: "Plan menus for events or daily service with cost awareness", complexity: "complex", category: "planning" },
      { id: "ck_6", text: "Prepare specialized dishes — pastries, traditional recipes, or international cuisine", complexity: "complex", category: "specialization" },
      { id: "ck_7", text: "Manage food inventory and minimize waste", complexity: "complex", category: "inventory" },
      { id: "ck_8", text: "Cook for large groups (50+ people) — catering or events", complexity: "expert", category: "scale" },
    ],
  },

  // ─── ELECTRICAL WORK (ISCO 7411) ──────────────────────────────
  "electrical": {
    label: "Electrical Installation & Repair",
    isco_codes: ["7411", "7412"],
    domain: "technical",
    tasks: [
      { id: "el_1", text: "Install basic household wiring — lights, switches, and outlets", complexity: "routine", category: "installation" },
      { id: "el_2", text: "Use a multimeter to test circuits for faults", complexity: "routine", category: "testing" },
      { id: "el_3", text: "Replace faulty switches, sockets, or light fittings", complexity: "routine", category: "repair" },
      { id: "el_4", text: "Install and connect circuit breaker panels", complexity: "complex", category: "distribution" },
      { id: "el_5", text: "Wire a building from scratch following electrical codes", complexity: "complex", category: "installation" },
      { id: "el_6", text: "Install solar panels and connect to battery/inverter systems", complexity: "complex", category: "solar" },
      { id: "el_7", text: "Diagnose and fix intermittent electrical faults", complexity: "expert", category: "diagnosis" },
      { id: "el_8", text: "Design electrical layouts for new buildings", complexity: "expert", category: "design" },
    ],
  },

  // ─── MOTOR VEHICLE REPAIR (ISCO 7231) ─────────────────────────
  "motor_vehicle_repair": {
    label: "Motor Vehicle Repair & Diagnostics",
    isco_codes: ["7231"],
    domain: "technical",
    tasks: [
      { id: "mv_1", text: "Change engine oil, oil filters, and air filters during routine service", complexity: "routine", category: "service" },
      { id: "mv_2", text: "Replace worn brake pads, brake shoes, and check brake fluid", complexity: "routine", category: "brakes" },
      { id: "mv_3", text: "Diagnose engine problems by listening, checking compression, and reading fault codes", complexity: "complex", category: "diagnosis" },
      { id: "mv_4", text: "Strip and rebuild a car or motorcycle engine — pistons, rings, gaskets, head", complexity: "complex", category: "engine_overhaul" },
      { id: "mv_5", text: "Repair gearbox, clutch, and transmission problems", complexity: "expert", category: "drivetrain" },
    ],
  },

  // ─── AGRICULTURAL MACHINERY (ISCO 7233, 8341) ────────────────
  "agricultural_machinery": {
    label: "Agricultural Machinery & Equipment",
    isco_codes: ["7233", "8341"],
    domain: "technical",
    tasks: [
      { id: "ag_1", text: "Service tractor engines — change oil, filters, coolant, and grease the chassis", complexity: "routine", category: "service" },
      { id: "ag_2", text: "Operate a tractor for ploughing, harrowing, and trailer haulage", complexity: "routine", category: "operation" },
      { id: "ag_3", text: "Diagnose diesel engine faults — fuel injection, glow plugs, smoke colour", complexity: "complex", category: "diagnosis" },
      { id: "ag_4", text: "Repair hydraulic systems on tractors and harvesters — pumps, rams, hoses", complexity: "complex", category: "hydraulics" },
      { id: "ag_5", text: "Overhaul a tractor transmission and align the PTO shaft", complexity: "expert", category: "drivetrain" },
    ],
  },

  // ─── GARMENT OPERATOR (ISCO 8153) ────────────────────────────
  "garment_operator": {
    label: "Garment Sewing Machine Operation",
    isco_codes: ["8153"],
    domain: "technical",
    tasks: [
      { id: "go_1", text: "Operate an industrial sewing machine for long, straight production seams", complexity: "routine", category: "machine_op" },
      { id: "go_2", text: "Hit daily piece-rate targets for a single garment operation (collar, sleeve, hem)", complexity: "routine", category: "production" },
      { id: "go_3", text: "Adjust machine tension, needle, and thread for different fabric weights", complexity: "complex", category: "machine_setup" },
      { id: "go_4", text: "Switch between operations on a line — overlocker, flatlock, buttonhole machine", complexity: "complex", category: "multi_machine" },
      { id: "go_5", text: "Inspect finished garments for stitching defects and rework rejected pieces", complexity: "expert", category: "quality" },
    ],
  },

  // ─── DIGITAL MARKETING (ISCO 2431, 2434) ─────────────────────
  "digital_marketing": {
    label: "Digital Marketing & Social Media",
    isco_codes: ["2431", "2434"],
    domain: "digital",
    tasks: [
      { id: "dm_1", text: "Post product photos and short captions to Instagram, Facebook, or TikTok", complexity: "routine", category: "posting" },
      { id: "dm_2", text: "Design simple promotional graphics in Canva for a sale or new arrival", complexity: "routine", category: "design" },
      { id: "dm_3", text: "Plan a weekly content calendar mixing posts, stories, and reels", complexity: "complex", category: "planning" },
      { id: "dm_4", text: "Run a paid ad on Facebook or Instagram with a defined budget and audience", complexity: "complex", category: "paid_ads" },
      { id: "dm_5", text: "Read engagement metrics and adjust posting strategy based on what performs", complexity: "expert", category: "analytics" },
    ],
  },

  // ─── GENERIC UNKNOWN — honest catch-all ───────────────────────
  // key === "generic_unknown" is the contract the UI uses to render the
  // "we don't have specialised cards for this yet" warning. Don't rename.
  "generic_unknown": {
    label: "General Work (unspecialized)",
    isco_codes: [],
    domain: "catchall",
    tasks: [
      { id: "gu_1", text: "Show up on time and complete the routine tasks your job needs each day", complexity: "routine", category: "general" },
      { id: "gu_2", text: "Talk with customers or co-workers about what needs to get done", complexity: "routine", category: "communication" },
      { id: "gu_3", text: "Solve unexpected problems that come up while you are working", complexity: "complex", category: "problem_solving" },
      { id: "gu_4", text: "Coordinate with other people to finish a task that takes more than one person", complexity: "complex", category: "coordination" },
      { id: "gu_5", text: "Train or guide a new worker through the parts of the job you know best", complexity: "expert", category: "leadership" },
    ],
  },
};

// Primary keyword per task set — used as the weakest signal in the score.
// One word per set; the matcher does substring containment, so "sew" hits
// "sewing", "drive" hits "driver", etc.
const TASK_SET_PRIMARY_KEYWORD = {
  phone_repair: "phone",
  programming: "code",
  sales_trading: "sell",
  tailoring: "sew",
  farming: "farm",
  driving: "driv",
  hairdressing: "hair",
  construction: "build",
  teaching: "teach",
  cooking: "cook",
  electrical: "electric",
  motor_vehicle_repair: "engine",
  agricultural_machinery: "tractor",
  garment_operator: "garment",
  digital_marketing: "social media",
  generic_unknown: "",
};

// Words mined from each label so a subdomain like "automotive" can match
// the "Motor Vehicle Repair" set without a 4-digit ISCO hit.
function labelKeywords(label) {
  return label.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 4);
}

/**
 * Score one (skill, taskSet) candidate.
 * 100 × overlap_count favours an exact 4-digit hit over a 3-digit major-group
 * hit; subdomain equality is the second-strongest signal because it's the
 * extractor's own taxonomy; label-keyword and primary-keyword fall behind.
 */
function scoreCandidate(skill, key, set) {
  let score = 0;

  const skillIsco = Array.isArray(skill.isco_codes) ? skill.isco_codes : [];
  const setIsco = Array.isArray(set.isco_codes) ? set.isco_codes : [];
  const overlap = skillIsco.filter(c => setIsco.includes(c)).length;
  score += 100 * overlap;

  const subdomain = (skill.subdomain || "").toLowerCase();
  if (subdomain && subdomain === key) score += 40;

  if (subdomain) {
    const lk = labelKeywords(set.label);
    if (lk.some(w => subdomain.includes(w) || w.includes(subdomain))) score += 20;
  }

  const primary = TASK_SET_PRIMARY_KEYWORD[key];
  const skillText = ((skill.skill || "") + " " + (skill.name || "")).toLowerCase();
  if (primary && skillText.includes(primary)) score += 10;

  return score;
}

/**
 * Find matching task sets for a list of classified skills.
 * ISCO-first scoring: each input skill is scored against every task set,
 * the highest-scoring set wins, and a min threshold of 30 routes weak
 * matches to generic_unknown (the UI keys off that exact string).
 * @param {Array} classifiedSkills - Skills from agentRegistry
 * @returns {Array} Matched task sets with cards to show
 */
export function matchTasksForSkills(classifiedSkills) {
  const matched = [];
  const MIN_SCORE = 30;

  for (const skill of classifiedSkills) {
    let best = { key: null, score: -1, set: null };
    for (const [key, set] of Object.entries(taskBank)) {
      if (key === "generic_unknown") continue; // never compete on score; only fallthrough
      const score = scoreCandidate(skill, key, set);
      if (score > best.score) best = { key, score, set };
    }

    let chosenKey;
    let chosenSet;
    if (best.score >= MIN_SCORE) {
      chosenKey = best.key;
      chosenSet = best.set;
    } else {
      chosenKey = "generic_unknown";
      chosenSet = taskBank.generic_unknown;
    }

    // De-dupe: one card per task-set key, even if multiple skills routed there.
    if (matched.some(m => m.key === chosenKey)) continue;

    matched.push({
      key: chosenKey,
      skill: skill.skill || skill.name,
      claimedLevel: skill.claimedLevel,
      ...chosenSet,
    });
  }

  if (matched.length === 0) {
    matched.push({
      key: "generic_unknown",
      skill: classifiedSkills[0]?.skill || classifiedSkills[0]?.name || "General Skills",
      claimedLevel: "intermediate",
      ...taskBank.generic_unknown,
    });
  }

  return matched;
}

export { taskBank };
