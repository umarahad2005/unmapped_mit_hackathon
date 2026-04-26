// Risk Analyzer Agent — AI Readiness & Displacement Risk Lens
// Calculates LMIC-adjusted automation risk using Frey-Osborne scores
// Incorporates Wittgenstein Centre education projections

import { occupations, lmicCalibration } from '../data/occupations';
import { educationProjections } from '../data/laborMarket';
import { getConfig } from './orchestrator';

// Calculate LMIC-adjusted automation risk for a set of occupations
export function analyzeRisk(mappedOccupations, countryCode) {
  const config = getConfig(countryCode);
  const calibration = config?.automation_calibration || lmicCalibration[countryCode] || { factor: 0.7, digital_penetration: 0.5 };
  const factor = calibration.adjustment_factor || calibration.factor || 0.7;
  
  const ituRate = calibration.digital_penetration || 0.5;
  const fineTune = 0.5 + (ituRate * 0.5);
  let multiplier = factor;
  if (calibration.infrastructure_level === "low") multiplier = 0.5;
  if (calibration.infrastructure_level === "medium") multiplier = 0.72;
  if (calibration.infrastructure_level === "high") multiplier = 0.9;
  
  return mappedOccupations.map(occ => {
    const baseRisk = occ.automation_risk;
    let adjustedRisk = baseRisk * multiplier * fineTune;
    adjustedRisk = Math.max(0.0, Math.min(1.0, adjustedRisk));
    
    // Decompose tasks
    const durableSkills = [];
    const atRiskTasks = [];
    const adjacentSkills = [];

    // Analyze task composition
    if (occ.tasks_cognitive > 0.5) {
      durableSkills.push("Problem solving & critical thinking");
      durableSkills.push("Decision making under uncertainty");
    }
    if (occ.tasks_manual > 0.6 && occ.tasks_routine < 0.5) {
      durableSkills.push("Complex manual dexterity");
      durableSkills.push("Situational physical judgment");
    }
    if (occ.tasks_routine > 0.5) {
      atRiskTasks.push("Routine data processing");
      atRiskTasks.push("Repetitive manual operations");
    }
    if (occ.tasks_routine > 0.6) {
      atRiskTasks.push("Standardized record keeping");
    }
    if (occ.tasks_manual > 0.7 && occ.tasks_routine > 0.5) {
      atRiskTasks.push("Assembly-line type work");
    }

    // Interpersonal skills are always durable
    if (occ.major_group <= 5) {
      durableSkills.push("Interpersonal communication");
    }

    // Generate adjacent skill suggestions
    adjacentSkills.push(...getAdjacentSkills(occ));

    // Risk level classification
    let riskLevel;
    if (adjustedRisk < 0.3) riskLevel = "low";
    else if (adjustedRisk < 0.6) riskLevel = "medium";
    else riskLevel = "high";

    // Resilience score (inverse of risk, boosted by skill diversity)
    const resilience = Math.max(0.1, 1 - adjustedRisk + (durableSkills.length * 0.05));

    return {
      isco_code: occ.isco_code,
      title: occ.title,
      base_risk: baseRisk,
      lmic_adjusted_risk: Math.round(adjustedRisk * 100) / 100,
      risk_level: riskLevel,
      calibration_factor: multiplier,
      calibration_note: calibration.notes || "Adjusted based on global LMIC benchmarks.",
      tasks: {
        routine: occ.tasks_routine,
        cognitive: occ.tasks_cognitive,
        manual: occ.tasks_manual,
      },
      durable_skills: durableSkills,
      at_risk_tasks: atRiskTasks,
      adjacent_skills: adjacentSkills,
      resilience_score: Math.min(Math.round(resilience * 100) / 100, 1.0),
    };
  });
}

// Get adjacent/upskilling paths based on current occupation
function getAdjacentSkills(occupation) {
  const adjacentMap = {
    "7422": [ // ICT Installers
      { skill: "Network Administration", path: "Training", time: "3-6 months", demand_growth: "+18%" },
      { skill: "Solar Panel Installation", path: "Apprenticeship", time: "2-4 months", demand_growth: "+24%" },
      { skill: "Cybersecurity Basics", path: "Online Course", time: "4-6 months", demand_growth: "+31%" },
    ],
    "7421": [ // Electronics Mechanics
      { skill: "IoT Device Maintenance", path: "Training", time: "3-6 months", demand_growth: "+22%" },
      { skill: "Drone Repair", path: "Specialized Training", time: "4-8 months", demand_growth: "+35%" },
      { skill: "Medical Equipment Repair", path: "Certification", time: "6-12 months", demand_growth: "+15%" },
    ],
    "7231": [ // Motor Vehicle Mechanics
      { skill: "Electric Vehicle Repair", path: "Training", time: "4-8 months", demand_growth: "+42%" },
      { skill: "Hybrid Engine Diagnostics", path: "Certification", time: "3-6 months", demand_growth: "+28%" },
      { skill: "Agricultural Machinery Repair", path: "Cross-training", time: "2-4 months", demand_growth: "+12%" },
    ],
    "5211": [ // Shop Salespersons
      { skill: "E-commerce Management", path: "Online Course", time: "2-3 months", demand_growth: "+38%" },
      { skill: "Digital Marketing", path: "Online Course", time: "3-4 months", demand_growth: "+25%" },
      { skill: "Supply Chain Management", path: "Training", time: "4-6 months", demand_growth: "+15%" },
    ],
    "9510": [ // Street Vendors
      { skill: "Digital Payments / Mobile Money", path: "Short Course", time: "1-2 weeks", demand_growth: "+45%" },
      { skill: "Online Marketplace Selling", path: "Self-learning", time: "1-3 months", demand_growth: "+35%" },
      { skill: "Basic Bookkeeping", path: "Short Course", time: "1-2 months", demand_growth: "+10%" },
    ],
    "2513": [ // Web Developers
      { skill: "Mobile App Development", path: "Online Course", time: "3-6 months", demand_growth: "+28%" },
      { skill: "Cloud Services (AWS/GCP)", path: "Certification", time: "4-6 months", demand_growth: "+32%" },
      { skill: "AI/ML Fundamentals", path: "Online Course", time: "6-9 months", demand_growth: "+45%" },
    ],
    "6111": [ // Field Crop Growers
      { skill: "Precision Agriculture / GPS", path: "Training", time: "2-4 months", demand_growth: "+20%" },
      { skill: "Organic Certification", path: "Program", time: "3-6 months", demand_growth: "+18%" },
      { skill: "Agricultural Drone Operation", path: "Training", time: "2-4 months", demand_growth: "+30%" },
    ],
    "9211": [ // Crop Farm Labourers
      { skill: "Irrigation Technology", path: "Training", time: "1-3 months", demand_growth: "+15%" },
      { skill: "Greenhouse Management", path: "Apprenticeship", time: "3-6 months", demand_growth: "+22%" },
      { skill: "Agro-processing", path: "Training", time: "2-4 months", demand_growth: "+18%" },
    ],
    "7531": [ // Tailors
      { skill: "Fashion Design (Digital)", path: "Online Course", time: "3-6 months", demand_growth: "+20%" },
      { skill: "Industrial Sewing Machine Operation", path: "Training", time: "1-3 months", demand_growth: "+8%" },
      { skill: "Sustainable Fashion Practices", path: "Short Course", time: "1-2 months", demand_growth: "+25%" },
    ],
  };

  // Default adjacent skills if occupation not specifically mapped
  const defaults = [
    { skill: "Digital Literacy", path: "Short Course", time: "1-2 months", demand_growth: "+20%" },
    { skill: "Financial Literacy", path: "Short Course", time: "1 month", demand_growth: "+15%" },
    { skill: "English Communication", path: "Course", time: "3-6 months", demand_growth: "+18%" },
  ];

  return adjacentMap[occupation.isco_code] || defaults;
}

// Generate aggregate risk assessment for a profile
export function generateRiskSummary(riskAssessments) {
  if (!riskAssessments.length) return null;

  const avgRisk = riskAssessments.reduce((sum, r) => sum + r.lmic_adjusted_risk, 0) / riskAssessments.length;
  const avgResilience = riskAssessments.reduce((sum, r) => sum + r.resilience_score, 0) / riskAssessments.length;
  
  const allDurable = [...new Set(riskAssessments.flatMap(r => r.durable_skills))];
  const allAtRisk = [...new Set(riskAssessments.flatMap(r => r.at_risk_tasks))];
  const allAdjacent = riskAssessments.flatMap(r => r.adjacent_skills);

  // Deduplicate adjacent skills
  const uniqueAdjacent = allAdjacent.reduce((acc, skill) => {
    if (!acc.find(s => s.skill === skill.skill)) acc.push(skill);
    return acc;
  }, []);

  let overallLevel;
  if (avgRisk < 0.3) overallLevel = "low";
  else if (avgRisk < 0.6) overallLevel = "medium";
  else overallLevel = "high";

  return {
    overall_risk: Math.round(avgRisk * 100) / 100,
    overall_level: overallLevel,
    overall_resilience: Math.round(avgResilience * 100) / 100,
    durable_skills: allDurable,
    at_risk_tasks: allAtRisk,
    recommended_upskilling: uniqueAdjacent.sort((a, b) => 
      parseFloat(b.demand_growth) - parseFloat(a.demand_growth)
    ).slice(0, 5),
    occupations_assessed: riskAssessments.length,
  };
}

// Get education projections for a country
export function getEducationTrends(countryCode) {
  return educationProjections[countryCode] || null;
}
