// Opportunity Matcher Agent
// Matches skills profiles against real labor market signals
// Surfaces econometric signals (wage premiums, sector growth)

import { laborMarketData, returnsToEducation } from '../data/laborMarket';

// Match a skills profile to real opportunities
export function matchOpportunities(skills, mappedOccupations, countryCode, educationLevel) {
  const marketData = laborMarketData[countryCode];
  if (!marketData) return { opportunities: [], signals: {} };

  const educationReturns = returnsToEducation[countryCode];

  // Find matching sectors based on occupation ISCO major groups
  const relevantSectors = identifyRelevantSectors(mappedOccupations, marketData);

  // Generate opportunity matches
  const opportunities = relevantSectors.map(sector => {
    const matchScore = calculateMatchScore(skills, mappedOccupations, sector);
    const wageInUSD = sector.avg_monthly_wage_usd;
    const wageLocal = Math.round(wageInUSD * getExchangeRate(countryCode));

    return {
      sector: sector.name,
      match_score: matchScore,
      employment_share: sector.employment_share,
      gdp_share: sector.gdp_share,
      growth_rate: sector.growth_rate,
      growth_label: `${sector.growth_rate > 0 ? '+' : ''}${(sector.growth_rate * 100).toFixed(1)}% YoY`,
      wage_floor_usd: wageInUSD,
      wage_floor_local: wageLocal,
      automation_exposure: sector.automation_exposure,
      opportunity_types: getOpportunityTypes(sector, skills),
      pathway: suggestPathway(sector, educationLevel, matchScore),
    };
  }).sort((a, b) => b.match_score - a.match_score);

  // Econometric signals (≥2 required by challenge)
  const signals = {
    returns_to_education: {
      label: "Returns to Education (Wage Premium)",
      description: `In ${marketData.country}, a ${getEducationLabel(educationLevel)} holder earns ${getWagePremium(educationLevel, educationReturns)}× the baseline wage. Moving to the next level increases earnings by ${getNextLevelGain(educationLevel, educationReturns)}%.`,
      data: educationReturns,
      type: "wage_premium",
    },
    sector_employment_growth: {
      label: "Sector Employment Growth",
      description: `Top growing sectors: ${getTopGrowingSectors(marketData).map(s => `${s.name} (${(s.growth_rate * 100).toFixed(1)}%)`).join(', ')}`,
      data: marketData.sectors.map(s => ({ name: s.name, growth: s.growth_rate, employment: s.employment_share })),
      type: "sector_growth",
    },
    youth_indicators: {
      label: "Youth Labor Market Indicators",
      neet_rate: marketData.employment.youth_neet_rate,
      unemployment_rate: marketData.employment.youth_unemployment_rate,
      informal_share: marketData.employment.informal_employment_share,
      description: `${(marketData.employment.youth_neet_rate * 100).toFixed(1)}% of youth are NEET. ${(marketData.employment.informal_employment_share * 100).toFixed(1)}% of employment is informal.`,
      type: "youth_indicators",
    },
    digital_readiness: {
      label: "Digital Infrastructure",
      internet: marketData.digital.internet_penetration,
      mobile: marketData.digital.mobile_broadband,
      description: `Internet penetration: ${(marketData.digital.internet_penetration * 100).toFixed(0)}%. Mobile broadband: ${(marketData.digital.mobile_broadband * 100).toFixed(0)}%.`,
      type: "digital",
    },
  };

  return { opportunities, signals, marketData };
}

function identifyRelevantSectors(mappedOccupations, marketData) {
  // Map ISCO major groups to sector relevance
  const sectorMapping = {
    1: ["Financial Services", "ICT", "Trade & Hospitality"],
    2: ["ICT", "Education", "Health", "Financial Services"],
    3: ["ICT", "Industry", "Health", "Financial Services"],
    4: ["Financial Services", "Trade & Hospitality", "Industry"],
    5: ["Trade & Hospitality", "Health", "Education"],
    6: ["Agriculture"],
    7: ["Industry", "Construction", "Manufacturing", "ICT"],
    8: ["Industry", "Manufacturing", "Transport & Storage", "Agriculture"],
    9: ["Agriculture", "Construction", "Trade & Hospitality", "Manufacturing"],
  };

  const relevantSectorNames = new Set();
  mappedOccupations.forEach(occ => {
    const sectors = sectorMapping[occ.major_group] || [];
    sectors.forEach(s => relevantSectorNames.add(s));
  });

  // Always include top-growth sectors
  const topGrowth = marketData.sectors
    .sort((a, b) => b.growth_rate - a.growth_rate)
    .slice(0, 3);
  topGrowth.forEach(s => relevantSectorNames.add(s.name));

  return marketData.sectors.filter(s => relevantSectorNames.has(s.name));
}

function calculateMatchScore(skills, mappedOccupations, sector) {
  let score = 0.3; // Base score

  // Bonus for having skills that match sector occupations
  const sectorISCOGroups = getSectorISCOGroups(sector.name);
  const matchingOccs = mappedOccupations.filter(o => sectorISCOGroups.includes(o.major_group));
  score += Math.min(matchingOccs.length * 0.15, 0.4);

  // Bonus for digital skills in tech sectors
  const hasDigital = skills.some(s => s.category === "digital");
  if (hasDigital && ["ICT", "Financial Services"].includes(sector.name)) {
    score += 0.15;
  }

  // Bonus for business skills in trade sectors
  const hasBusiness = skills.some(s => s.category === "business");
  if (hasBusiness && ["Trade & Hospitality", "Financial Services"].includes(sector.name)) {
    score += 0.1;
  }

  return Math.min(Math.round(score * 100) / 100, 0.98);
}

function getSectorISCOGroups(sectorName) {
  const mapping = {
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
  return mapping[sectorName] || [];
}

function getOpportunityTypes(sector, skills) {
  const types = [];
  types.push({ type: "Formal Employment", feasibility: sector.employment_share > 0.05 ? "available" : "limited" });
  
  if (["Trade & Hospitality", "Agriculture"].includes(sector.name)) {
    types.push({ type: "Self-Employment", feasibility: "strong" });
  }
  if (["ICT", "Trade & Hospitality"].includes(sector.name)) {
    types.push({ type: "Gig / Platform Work", feasibility: "growing" });
  }
  if (["Construction", "Manufacturing", "ICT"].includes(sector.name)) {
    types.push({ type: "Apprenticeship", feasibility: "available" });
  }
  types.push({ type: "Training Program", feasibility: "recommended" });
  
  return types;
}

function suggestPathway(sector, educationLevel, matchScore) {
  if (matchScore > 0.7) return "Direct entry — your skills align well with this sector";
  if (matchScore > 0.5) return "Short upskilling recommended (1-3 months) to strengthen your match";
  return "Training pathway needed (3-6 months) — consider vocational programs";
}

function getExchangeRate(countryCode) {
  const rates = { GHA: 15.8, IND: 83.5, KEN: 153, BGD: 110, NGA: 1580 };
  return rates[countryCode] || 1;
}

function getEducationLabel(level) {
  const labels = {
    none: "no formal education",
    primary: "primary education",
    jss: "junior secondary", lower_secondary: "lower secondary",
    sss: "senior secondary", upper_secondary: "upper secondary",
    secondary: "secondary education", higher_secondary: "higher secondary",
    vocational: "vocational training", iti: "ITI certificate",
    tertiary: "tertiary education", graduate: "graduate degree",
  };
  return labels[level] || level;
}

function getWagePremium(educationLevel, returns) {
  const levelMap = { none: 0, primary: 1, jss: 2, lower_secondary: 2, sss: 3, upper_secondary: 3, secondary: 3, higher_secondary: 3, vocational: 4, iti: 4, tertiary: 5, graduate: 5 };
  const idx = levelMap[educationLevel] ?? 0;
  return returns?.multipliers?.[idx] || 1.0;
}

function getNextLevelGain(educationLevel, returns) {
  const levelMap = { none: 0, primary: 1, jss: 2, lower_secondary: 2, sss: 3, upper_secondary: 3, secondary: 3, higher_secondary: 3, vocational: 4, iti: 4, tertiary: 5, graduate: 5 };
  const idx = levelMap[educationLevel] ?? 0;
  if (!returns?.multipliers || idx >= returns.multipliers.length - 1) return 0;
  const current = returns.multipliers[idx];
  const next = returns.multipliers[idx + 1];
  return Math.round(((next - current) / current) * 100);
}

function getTopGrowingSectors(marketData) {
  return marketData.sectors
    .sort((a, b) => b.growth_rate - a.growth_rate)
    .slice(0, 3);
}

// Aggregate dashboard data for policymakers
export function generateDashboardData(countryCode) {
  const marketData = laborMarketData[countryCode];
  if (!marketData) return null;

  return {
    country: marketData.country,
    year: marketData.year,
    headline_stats: [
      { label: "Youth Population (15-24)", value: formatNumber(marketData.population.youth_15_24), change: null },
      { label: "Youth Unemployment", value: `${(marketData.employment.youth_unemployment_rate * 100).toFixed(1)}%`, change: null },
      { label: "Youth NEET Rate", value: `${(marketData.employment.youth_neet_rate * 100).toFixed(1)}%`, change: null },
      { label: "Informal Employment", value: `${(marketData.employment.informal_employment_share * 100).toFixed(1)}%`, change: null },
      { label: "GDP per Capita", value: `$${formatNumber(marketData.gdp.per_capita_usd)}`, change: `+${(marketData.gdp.growth_rate * 100).toFixed(1)}%` },
      { label: "Human Capital Index", value: marketData.education.human_capital_index.toFixed(2), change: null },
      { label: "Internet Penetration", value: `${(marketData.digital.internet_penetration * 100).toFixed(0)}%`, change: null },
      { label: "Learning-Adj. Years", value: marketData.education.learning_adjusted_years.toFixed(1), change: null },
    ],
    sectors: marketData.sectors,
    top_youth_occupations: marketData.top_occupations_youth,
    education_returns: returnsToEducation[countryCode],
  };
}

function formatNumber(num) {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
