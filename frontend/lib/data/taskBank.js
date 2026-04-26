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
};

/**
 * Find matching task sets for a list of classified skills
 * @param {Array} classifiedSkills - Skills from agentRegistry
 * @returns {Array} Matched task sets with cards to show
 */
export function matchTasksForSkills(classifiedSkills) {
  const matched = [];

  for (const skill of classifiedSkills) {
    const skillLower = skill.skill.toLowerCase();
    const subdomain = (skill.subdomain || "").toLowerCase();

    // Try direct subdomain match first
    let taskSet = taskBank[subdomain];

    // Try skill name keyword matching
    if (!taskSet) {
      for (const [key, set] of Object.entries(taskBank)) {
        const labelLower = set.label.toLowerCase();
        if (
          skillLower.includes(key.replace(/_/g, " ")) ||
          labelLower.includes(skillLower) ||
          key.includes(skillLower.replace(/\s+/g, "_")) ||
          // Check ISCO code overlap
          (skill.isco_codes && skill.isco_codes.some(c => set.isco_codes.includes(c)))
        ) {
          taskSet = set;
          break;
        }
      }
    }

    // Broader keyword matching
    if (!taskSet) {
      const keywordMap = {
        phone_repair: ["phone", "mobile", "repair", "screen", "fix", "tablet", "electronic"],
        programming: ["python", "javascript", "html", "css", "code", "coding", "programming", "web", "software", "developer"],
        sales_trading: ["sell", "sales", "trade", "market", "shop", "vendor", "store", "commerce", "negotiat"],
        tailoring: ["sew", "tailor", "dress", "fabric", "garment", "cloth", "fashion"],
        farming: ["farm", "crop", "plant", "harvest", "agriculture", "soil", "livestock"],
        driving: ["driv", "taxi", "transport", "vehicle", "car", "truck", "bus"],
        hairdressing: ["hair", "barber", "salon", "beauty", "braid", "style"],
        construction: ["build", "construct", "mason", "brick", "carpenter", "plumb", "roof"],
        teaching: ["teach", "tutor", "train", "mentor", "instruct", "lesson", "educate"],
        cooking: ["cook", "food", "kitchen", "bak", "chef", "cater", "restaurant"],
        electrical: ["electric", "wiring", "solar", "panel", "circuit", "voltage"],
      };

      for (const [key, keywords] of Object.entries(keywordMap)) {
        if (keywords.some(kw => skillLower.includes(kw) || subdomain.includes(kw))) {
          taskSet = taskBank[key];
          break;
        }
      }
    }

    if (taskSet) {
      // Don't duplicate task sets
      if (!matched.some(m => m.key === Object.keys(taskBank).find(k => taskBank[k] === taskSet))) {
        matched.push({
          key: Object.keys(taskBank).find(k => taskBank[k] === taskSet),
          skill: skill.skill,
          claimedLevel: skill.claimedLevel,
          ...taskSet,
        });
      }
    }
  }

  // If nothing matched, create a generic fallback
  if (matched.length === 0) {
    matched.push({
      key: "generic",
      skill: classifiedSkills[0]?.skill || "General Skills",
      claimedLevel: "intermediate",
      label: classifiedSkills[0]?.skill || "General Skills",
      isco_codes: [],
      domain: "catchall",
      tasks: [
        { id: "gen_1", text: "Perform routine daily tasks in your work with minimal supervision", complexity: "routine", category: "general" },
        { id: "gen_2", text: "Communicate with customers or clients about their needs", complexity: "routine", category: "communication" },
        { id: "gen_3", text: "Solve unexpected problems that come up during your work", complexity: "complex", category: "problem_solving" },
        { id: "gen_4", text: "Train or guide new workers in your line of work", complexity: "expert", category: "leadership" },
      ],
    });
  }

  return matched;
}

export { taskBank };
