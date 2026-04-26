// Orchestrator Workflow — Coordinates all agents
// This is the main entry point that chains: Extract → Map → Analyze Risk → Match Opportunities

import { extractSkills, mapToOccupations, generateProfile } from './skillExtractor';
import { analyzeRisk, generateRiskSummary, getEducationTrends } from './riskAnalyzer';
import { matchOpportunities, generateDashboardData } from './opportunityMatcher';
import ghanaConfig from '../config/ghana';
import indiaConfig from '../config/india';

const configs = {
  GHA: ghanaConfig,
  IND: indiaConfig,
};

// Main orchestration — runs the full pipeline
export function processProfile(inputData) {
  const { name, age, location, education, skillsText, countryCode } = inputData;
  const config = configs[countryCode] || ghanaConfig;

  // Step 1: Extract skills from free text
  const extractedSkills = extractSkills(skillsText);

  // Step 2: Map skills to ISCO-08 occupations
  const mappedOccupations = mapToOccupations(extractedSkills);

  // Step 3: Analyze automation risk (LMIC-adjusted)
  const riskAssessments = analyzeRisk(mappedOccupations, countryCode);
  const riskSummary = generateRiskSummary(riskAssessments);

  // Step 4: Match opportunities against labor market
  const { opportunities, signals, marketData } = matchOpportunities(
    extractedSkills, mappedOccupations, countryCode, education
  );

  // Step 5: Get education projections
  const educationTrends = getEducationTrends(countryCode);

  // Step 6: Generate portable profile
  const profile = generateProfile(
    { name, age, location, education },
    extractedSkills,
    mappedOccupations,
    config
  );

  return {
    config,
    profile,
    skills: extractedSkills,
    occupations: mappedOccupations,
    riskAssessments,
    riskSummary,
    opportunities,
    signals,
    marketData,
    educationTrends,
    timestamp: new Date().toISOString(),
  };
}

// Get dashboard data for policymakers
export function getDashboard(countryCode) {
  return generateDashboardData(countryCode);
}

// Get country config
export function getConfig(countryCode) {
  return configs[countryCode] || ghanaConfig;
}

// List available countries
export function getAvailableCountries() {
  return Object.entries(configs).map(([code, config]) => ({
    code,
    name: config.country_name,
    flag: config.flag_emoji,
    region: config.region,
    context: config.context,
  }));
}
