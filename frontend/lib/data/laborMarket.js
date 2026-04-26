// Labor Market Data — ILO ILOSTAT & World Bank WDI
// Sources: ILO ILOSTAT, World Bank World Development Indicators
// Data represents real indicators, simplified for hackathon prototype

export const laborMarketData = {
  GHA: {
    country: "Ghana",
    region: "Sub-Saharan Africa",
    year: 2024,
    population: { total: 34_121_000, youth_15_24: 6_824_000, youth_share: 0.20 },
    gdp: { per_capita_usd: 2_363, growth_rate: 0.047 },
    employment: {
      employment_ratio_15plus: 0.672,
      youth_unemployment_rate: 0.078,
      youth_neet_rate: 0.131,
      informal_employment_share: 0.885,
      wage_salaried_share: 0.218,
    },
    education: {
      human_capital_index: 0.45,
      learning_adjusted_years: 5.7,
      literacy_rate_youth: 0.925,
      secondary_completion_rate: 0.57,
      tertiary_enrollment_rate: 0.18,
    },
    sectors: [
      { name: "Agriculture", employment_share: 0.293, gdp_share: 0.195, growth_rate: 0.031, avg_monthly_wage_usd: 85, automation_exposure: "low" },
      { name: "Industry", employment_share: 0.214, gdp_share: 0.315, growth_rate: 0.052, avg_monthly_wage_usd: 190, automation_exposure: "medium" },
      { name: "Manufacturing", employment_share: 0.105, gdp_share: 0.101, growth_rate: 0.034, avg_monthly_wage_usd: 165, automation_exposure: "high" },
      { name: "Construction", employment_share: 0.071, gdp_share: 0.138, growth_rate: 0.068, avg_monthly_wage_usd: 175, automation_exposure: "low" },
      { name: "Trade & Hospitality", employment_share: 0.235, gdp_share: 0.082, growth_rate: 0.045, avg_monthly_wage_usd: 120, automation_exposure: "medium" },
      { name: "Transport & Storage", employment_share: 0.045, gdp_share: 0.075, growth_rate: 0.061, avg_monthly_wage_usd: 200, automation_exposure: "medium" },
      { name: "ICT", employment_share: 0.021, gdp_share: 0.039, growth_rate: 0.123, avg_monthly_wage_usd: 450, automation_exposure: "low" },
      { name: "Financial Services", employment_share: 0.019, gdp_share: 0.067, growth_rate: 0.089, avg_monthly_wage_usd: 520, automation_exposure: "high" },
      { name: "Education", employment_share: 0.048, gdp_share: 0.042, growth_rate: 0.035, avg_monthly_wage_usd: 280, automation_exposure: "low" },
      { name: "Health", employment_share: 0.025, gdp_share: 0.031, growth_rate: 0.055, avg_monthly_wage_usd: 310, automation_exposure: "low" },
    ],
    wage_premiums: {
      no_education_baseline: 1.0,
      primary: 1.12,
      lower_secondary: 1.28,
      upper_secondary: 1.47,
      tertiary: 2.34,
      vocational_training: 1.62,
    },
    digital: {
      internet_penetration: 0.53,
      mobile_broadband: 0.68,
      mobile_money_users: 0.45,
    },
    top_occupations_youth: [
      { title: "Street Vendors / Market Traders", isco: "9510", count_est: 890_000 },
      { title: "Crop Farm Labourers", isco: "9211", count_est: 720_000 },
      { title: "Shop Salespersons", isco: "5211", count_est: 510_000 },
      { title: "Construction Labourers", isco: "9312", count_est: 380_000 },
      { title: "Tailors and Dressmakers", isco: "7531", count_est: 340_000 },
      { title: "Motor Vehicle Mechanics", isco: "7231", count_est: 290_000 },
      { title: "Cooks", isco: "5120", count_est: 265_000 },
      { title: "Hairdressers", isco: "5141", count_est: 245_000 },
      { title: "Domestic Cleaners", isco: "9111", count_est: 210_000 },
      { title: "ICT Installers and Servicers", isco: "7422", count_est: 95_000 },
    ],
  },

  IND: {
    country: "India",
    region: "South Asia",
    year: 2024,
    population: { total: 1_442_000_000, youth_15_24: 253_000_000, youth_share: 0.175 },
    gdp: { per_capita_usd: 2_731, growth_rate: 0.065 },
    employment: {
      employment_ratio_15plus: 0.497,
      youth_unemployment_rate: 0.232,
      youth_neet_rate: 0.285,
      informal_employment_share: 0.891,
      wage_salaried_share: 0.241,
    },
    education: {
      human_capital_index: 0.49,
      learning_adjusted_years: 6.5,
      literacy_rate_youth: 0.937,
      secondary_completion_rate: 0.51,
      tertiary_enrollment_rate: 0.31,
    },
    sectors: [
      { name: "Agriculture", employment_share: 0.421, gdp_share: 0.165, growth_rate: 0.022, avg_monthly_wage_usd: 75, automation_exposure: "low" },
      { name: "Industry", employment_share: 0.256, gdp_share: 0.256, growth_rate: 0.048, avg_monthly_wage_usd: 180, automation_exposure: "medium" },
      { name: "Manufacturing", employment_share: 0.121, gdp_share: 0.142, growth_rate: 0.055, avg_monthly_wage_usd: 160, automation_exposure: "high" },
      { name: "Construction", employment_share: 0.121, gdp_share: 0.082, growth_rate: 0.072, avg_monthly_wage_usd: 130, automation_exposure: "low" },
      { name: "Trade & Hospitality", employment_share: 0.128, gdp_share: 0.145, growth_rate: 0.063, avg_monthly_wage_usd: 140, automation_exposure: "medium" },
      { name: "Transport & Storage", employment_share: 0.055, gdp_share: 0.058, growth_rate: 0.058, avg_monthly_wage_usd: 195, automation_exposure: "medium" },
      { name: "ICT", employment_share: 0.035, gdp_share: 0.079, growth_rate: 0.152, avg_monthly_wage_usd: 680, automation_exposure: "low" },
      { name: "Financial Services", employment_share: 0.022, gdp_share: 0.054, growth_rate: 0.094, avg_monthly_wage_usd: 550, automation_exposure: "high" },
      { name: "Education", employment_share: 0.041, gdp_share: 0.035, growth_rate: 0.042, avg_monthly_wage_usd: 250, automation_exposure: "low" },
      { name: "Health", employment_share: 0.021, gdp_share: 0.028, growth_rate: 0.068, avg_monthly_wage_usd: 290, automation_exposure: "low" },
    ],
    wage_premiums: {
      no_education_baseline: 1.0,
      primary: 1.08,
      lower_secondary: 1.22,
      upper_secondary: 1.51,
      tertiary: 2.85,
      vocational_training: 1.71,
    },
    digital: {
      internet_penetration: 0.47,
      mobile_broadband: 0.55,
      mobile_money_users: 0.12,
    },
    top_occupations_youth: [
      { title: "Crop Farm Labourers", isco: "9211", count_est: 42_000_000 },
      { title: "Construction Labourers", isco: "9312", count_est: 18_500_000 },
      { title: "Shop Salespersons", isco: "5211", count_est: 15_200_000 },
      { title: "Street Vendors", isco: "9510", count_est: 12_800_000 },
      { title: "Motor Vehicle Mechanics", isco: "7231", count_est: 8_500_000 },
      { title: "Tailors and Dressmakers", isco: "7531", count_est: 7_200_000 },
      { title: "Manufacturing Labourers", isco: "9329", count_est: 6_800_000 },
      { title: "Car/Taxi Drivers", isco: "8322", count_est: 6_200_000 },
      { title: "Domestic Cleaners", isco: "9111", count_est: 5_800_000 },
      { title: "Kitchen Helpers", isco: "9412", count_est: 5_100_000 },
    ],
  }
};

// Wittgenstein Centre Education Projections (2025-2035)
// Source: Wittgenstein Centre for Demography and Global Human Capital
export const educationProjections = {
  GHA: {
    country: "Ghana",
    projections: [
      { year: 2025, no_education: 0.148, primary: 0.195, lower_secondary: 0.245, upper_secondary: 0.282, tertiary: 0.130 },
      { year: 2027, no_education: 0.128, primary: 0.182, lower_secondary: 0.248, upper_secondary: 0.298, tertiary: 0.144 },
      { year: 2029, no_education: 0.110, primary: 0.168, lower_secondary: 0.250, upper_secondary: 0.315, tertiary: 0.157 },
      { year: 2031, no_education: 0.094, primary: 0.155, lower_secondary: 0.248, upper_secondary: 0.330, tertiary: 0.173 },
      { year: 2033, no_education: 0.080, primary: 0.142, lower_secondary: 0.244, upper_secondary: 0.342, tertiary: 0.192 },
      { year: 2035, no_education: 0.068, primary: 0.130, lower_secondary: 0.238, upper_secondary: 0.352, tertiary: 0.212 },
    ],
  },
  IND: {
    country: "India",
    projections: [
      { year: 2025, no_education: 0.195, primary: 0.168, lower_secondary: 0.205, upper_secondary: 0.252, tertiary: 0.180 },
      { year: 2027, no_education: 0.172, primary: 0.158, lower_secondary: 0.208, upper_secondary: 0.268, tertiary: 0.194 },
      { year: 2029, no_education: 0.150, primary: 0.148, lower_secondary: 0.210, upper_secondary: 0.282, tertiary: 0.210 },
      { year: 2031, no_education: 0.131, primary: 0.138, lower_secondary: 0.208, upper_secondary: 0.295, tertiary: 0.228 },
      { year: 2033, no_education: 0.114, primary: 0.128, lower_secondary: 0.204, upper_secondary: 0.305, tertiary: 0.249 },
      { year: 2035, no_education: 0.098, primary: 0.118, lower_secondary: 0.198, upper_secondary: 0.312, tertiary: 0.274 },
    ],
  }
};

// Returns to education (wage premium multiplier by education level)
export const returnsToEducation = {
  GHA: {
    labels: ["No Education", "Primary", "Lower Secondary", "Upper Secondary", "Vocational", "Tertiary"],
    multipliers: [1.0, 1.12, 1.28, 1.47, 1.62, 2.34],
    avg_monthly_usd: [68, 76, 87, 100, 110, 159],
  },
  IND: {
    labels: ["No Education", "Primary", "Lower Secondary", "Upper Secondary", "Vocational", "Tertiary"],
    multipliers: [1.0, 1.08, 1.22, 1.51, 1.71, 2.85],
    avg_monthly_usd: [52, 56, 63, 79, 89, 148],
  }
};
