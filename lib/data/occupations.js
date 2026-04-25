// ISCO-08 Occupation Classification with Frey-Osborne Automation Scores
// Source: ILO ISCO-08, Frey & Osborne (2017) "The Future of Employment"
// Calibrated with LMIC adjustment factors

const occupations = [
  // Major Group 1: Managers
  { isco_code: "1111", title: "Legislators", major_group: 1, automation_risk: 0.04, tasks_routine: 0.15, tasks_cognitive: 0.85, tasks_manual: 0.05 },
  { isco_code: "1120", title: "Managing Directors and Chief Executives", major_group: 1, automation_risk: 0.015, tasks_routine: 0.18, tasks_cognitive: 0.82, tasks_manual: 0.05 },
  { isco_code: "1211", title: "Finance Managers", major_group: 1, automation_risk: 0.069, tasks_routine: 0.35, tasks_cognitive: 0.75, tasks_manual: 0.05 },
  { isco_code: "1213", title: "Policy and Planning Managers", major_group: 1, automation_risk: 0.05, tasks_routine: 0.2, tasks_cognitive: 0.88, tasks_manual: 0.03 },
  { isco_code: "1219", title: "Business Services Managers", major_group: 1, automation_risk: 0.08, tasks_routine: 0.3, tasks_cognitive: 0.78, tasks_manual: 0.08 },
  { isco_code: "1311", title: "Agricultural Production Managers", major_group: 1, automation_risk: 0.12, tasks_routine: 0.3, tasks_cognitive: 0.6, tasks_manual: 0.3 },
  { isco_code: "1321", title: "Manufacturing Managers", major_group: 1, automation_risk: 0.11, tasks_routine: 0.35, tasks_cognitive: 0.65, tasks_manual: 0.2 },
  { isco_code: "1330", title: "ICT Service Managers", major_group: 1, automation_risk: 0.035, tasks_routine: 0.2, tasks_cognitive: 0.9, tasks_manual: 0.03 },

  // Major Group 2: Professionals
  { isco_code: "2111", title: "Physicists and Astronomers", major_group: 2, automation_risk: 0.1, tasks_routine: 0.2, tasks_cognitive: 0.95, tasks_manual: 0.1 },
  { isco_code: "2120", title: "Mathematicians and Statisticians", major_group: 2, automation_risk: 0.21, tasks_routine: 0.4, tasks_cognitive: 0.92, tasks_manual: 0.02 },
  { isco_code: "2132", title: "Farming, Forestry Advisers", major_group: 2, automation_risk: 0.08, tasks_routine: 0.25, tasks_cognitive: 0.7, tasks_manual: 0.2 },
  { isco_code: "2141", title: "Industrial Engineers", major_group: 2, automation_risk: 0.12, tasks_routine: 0.35, tasks_cognitive: 0.85, tasks_manual: 0.1 },
  { isco_code: "2152", title: "Electronics Engineers", major_group: 2, automation_risk: 0.1, tasks_routine: 0.3, tasks_cognitive: 0.88, tasks_manual: 0.12 },
  { isco_code: "2166", title: "Graphic Designers", major_group: 2, automation_risk: 0.083, tasks_routine: 0.25, tasks_cognitive: 0.8, tasks_manual: 0.1 },
  { isco_code: "2211", title: "Generalist Medical Practitioners", major_group: 2, automation_risk: 0.004, tasks_routine: 0.15, tasks_cognitive: 0.9, tasks_manual: 0.2 },
  { isco_code: "2221", title: "Nursing Professionals", major_group: 2, automation_risk: 0.009, tasks_routine: 0.25, tasks_cognitive: 0.65, tasks_manual: 0.4 },
  { isco_code: "2310", title: "University Professors", major_group: 2, automation_risk: 0.032, tasks_routine: 0.15, tasks_cognitive: 0.95, tasks_manual: 0.03 },
  { isco_code: "2320", title: "Vocational Education Teachers", major_group: 2, automation_risk: 0.048, tasks_routine: 0.2, tasks_cognitive: 0.85, tasks_manual: 0.15 },
  { isco_code: "2330", title: "Secondary Education Teachers", major_group: 2, automation_risk: 0.017, tasks_routine: 0.2, tasks_cognitive: 0.9, tasks_manual: 0.05 },
  { isco_code: "2411", title: "Accountants", major_group: 2, automation_risk: 0.94, tasks_routine: 0.75, tasks_cognitive: 0.7, tasks_manual: 0.02 },
  { isco_code: "2431", title: "Marketing Professionals", major_group: 2, automation_risk: 0.061, tasks_routine: 0.3, tasks_cognitive: 0.85, tasks_manual: 0.03 },
  { isco_code: "2511", title: "Systems Analysts", major_group: 2, automation_risk: 0.065, tasks_routine: 0.3, tasks_cognitive: 0.92, tasks_manual: 0.02 },
  { isco_code: "2512", title: "Software Developers", major_group: 2, automation_risk: 0.042, tasks_routine: 0.25, tasks_cognitive: 0.95, tasks_manual: 0.02 },
  { isco_code: "2513", title: "Web Developers", major_group: 2, automation_risk: 0.21, tasks_routine: 0.4, tasks_cognitive: 0.85, tasks_manual: 0.02 },
  { isco_code: "2519", title: "Database Designers", major_group: 2, automation_risk: 0.098, tasks_routine: 0.4, tasks_cognitive: 0.9, tasks_manual: 0.02 },
  { isco_code: "2521", title: "Database Administrators", major_group: 2, automation_risk: 0.096, tasks_routine: 0.5, tasks_cognitive: 0.85, tasks_manual: 0.02 },

  // Major Group 3: Technicians and Associate Professionals
  { isco_code: "3112", title: "Civil Engineering Technicians", major_group: 3, automation_risk: 0.35, tasks_routine: 0.45, tasks_cognitive: 0.6, tasks_manual: 0.3 },
  { isco_code: "3113", title: "Electrical Engineering Technicians", major_group: 3, automation_risk: 0.34, tasks_routine: 0.45, tasks_cognitive: 0.6, tasks_manual: 0.35 },
  { isco_code: "3114", title: "Electronics Engineering Technicians", major_group: 3, automation_risk: 0.36, tasks_routine: 0.5, tasks_cognitive: 0.55, tasks_manual: 0.35 },
  { isco_code: "3121", title: "Mining Technicians", major_group: 3, automation_risk: 0.42, tasks_routine: 0.5, tasks_cognitive: 0.4, tasks_manual: 0.55 },
  { isco_code: "3141", title: "Life Science Technicians", major_group: 3, automation_risk: 0.46, tasks_routine: 0.55, tasks_cognitive: 0.5, tasks_manual: 0.4 },
  { isco_code: "3211", title: "Medical Imaging Technicians", major_group: 3, automation_risk: 0.41, tasks_routine: 0.5, tasks_cognitive: 0.5, tasks_manual: 0.35 },
  { isco_code: "3312", title: "Credit and Loan Officers", major_group: 3, automation_risk: 0.91, tasks_routine: 0.7, tasks_cognitive: 0.5, tasks_manual: 0.02 },
  { isco_code: "3322", title: "Sales Representatives", major_group: 3, automation_risk: 0.25, tasks_routine: 0.35, tasks_cognitive: 0.55, tasks_manual: 0.15 },
  { isco_code: "3323", title: "Buyers and Procurement Officers", major_group: 3, automation_risk: 0.39, tasks_routine: 0.5, tasks_cognitive: 0.55, tasks_manual: 0.05 },
  { isco_code: "3511", title: "ICT Operations Technicians", major_group: 3, automation_risk: 0.47, tasks_routine: 0.55, tasks_cognitive: 0.6, tasks_manual: 0.2 },
  { isco_code: "3521", title: "Broadcasting Technicians", major_group: 3, automation_risk: 0.48, tasks_routine: 0.5, tasks_cognitive: 0.45, tasks_manual: 0.3 },

  // Major Group 4: Clerical Support Workers
  { isco_code: "4110", title: "General Office Clerks", major_group: 4, automation_risk: 0.96, tasks_routine: 0.85, tasks_cognitive: 0.3, tasks_manual: 0.1 },
  { isco_code: "4120", title: "Secretaries (General)", major_group: 4, automation_risk: 0.96, tasks_routine: 0.8, tasks_cognitive: 0.35, tasks_manual: 0.1 },
  { isco_code: "4131", title: "Typists and Word Processors", major_group: 4, automation_risk: 0.98, tasks_routine: 0.9, tasks_cognitive: 0.15, tasks_manual: 0.1 },
  { isco_code: "4211", title: "Bank Tellers", major_group: 4, automation_risk: 0.98, tasks_routine: 0.85, tasks_cognitive: 0.25, tasks_manual: 0.1 },
  { isco_code: "4221", title: "Travel Agents", major_group: 4, automation_risk: 0.91, tasks_routine: 0.7, tasks_cognitive: 0.4, tasks_manual: 0.02 },
  { isco_code: "4311", title: "Accounting Clerks", major_group: 4, automation_risk: 0.97, tasks_routine: 0.85, tasks_cognitive: 0.3, tasks_manual: 0.02 },
  { isco_code: "4321", title: "Stock Clerks", major_group: 4, automation_risk: 0.93, tasks_routine: 0.8, tasks_cognitive: 0.2, tasks_manual: 0.3 },

  // Major Group 5: Service and Sales Workers
  { isco_code: "5111", title: "Travel Attendants", major_group: 5, automation_risk: 0.35, tasks_routine: 0.4, tasks_cognitive: 0.3, tasks_manual: 0.4 },
  { isco_code: "5120", title: "Cooks", major_group: 5, automation_risk: 0.96, tasks_routine: 0.7, tasks_cognitive: 0.15, tasks_manual: 0.8 },
  { isco_code: "5131", title: "Waiters", major_group: 5, automation_risk: 0.94, tasks_routine: 0.65, tasks_cognitive: 0.15, tasks_manual: 0.6 },
  { isco_code: "5141", title: "Hairdressers", major_group: 5, automation_risk: 0.11, tasks_routine: 0.3, tasks_cognitive: 0.25, tasks_manual: 0.8 },
  { isco_code: "5151", title: "Cleaning Supervisors", major_group: 5, automation_risk: 0.37, tasks_routine: 0.5, tasks_cognitive: 0.3, tasks_manual: 0.5 },
  { isco_code: "5211", title: "Shop Salespersons", major_group: 5, automation_risk: 0.92, tasks_routine: 0.6, tasks_cognitive: 0.25, tasks_manual: 0.3 },
  { isco_code: "5221", title: "Shopkeepers", major_group: 5, automation_risk: 0.31, tasks_routine: 0.4, tasks_cognitive: 0.45, tasks_manual: 0.25 },
  { isco_code: "5230", title: "Cashiers", major_group: 5, automation_risk: 0.97, tasks_routine: 0.85, tasks_cognitive: 0.1, tasks_manual: 0.2 },
  { isco_code: "5241", title: "Fashion Models", major_group: 5, automation_risk: 0.04, tasks_routine: 0.2, tasks_cognitive: 0.2, tasks_manual: 0.5 },
  { isco_code: "5311", title: "Child Care Workers", major_group: 5, automation_risk: 0.08, tasks_routine: 0.25, tasks_cognitive: 0.4, tasks_manual: 0.5 },
  { isco_code: "5321", title: "Health Care Assistants", major_group: 5, automation_risk: 0.39, tasks_routine: 0.35, tasks_cognitive: 0.35, tasks_manual: 0.55 },
  { isco_code: "5411", title: "Firefighters", major_group: 5, automation_risk: 0.17, tasks_routine: 0.25, tasks_cognitive: 0.3, tasks_manual: 0.75 },
  { isco_code: "5414", title: "Security Guards", major_group: 5, automation_risk: 0.84, tasks_routine: 0.6, tasks_cognitive: 0.2, tasks_manual: 0.4 },

  // Major Group 6: Skilled Agricultural Workers
  { isco_code: "6111", title: "Field Crop Growers", major_group: 6, automation_risk: 0.56, tasks_routine: 0.55, tasks_cognitive: 0.2, tasks_manual: 0.85 },
  { isco_code: "6112", title: "Tree and Shrub Crop Growers", major_group: 6, automation_risk: 0.52, tasks_routine: 0.5, tasks_cognitive: 0.2, tasks_manual: 0.85 },
  { isco_code: "6121", title: "Livestock and Dairy Producers", major_group: 6, automation_risk: 0.49, tasks_routine: 0.45, tasks_cognitive: 0.25, tasks_manual: 0.8 },
  { isco_code: "6130", title: "Mixed Crop and Livestock Farmers", major_group: 6, automation_risk: 0.51, tasks_routine: 0.5, tasks_cognitive: 0.25, tasks_manual: 0.8 },
  { isco_code: "6210", title: "Forestry Workers", major_group: 6, automation_risk: 0.61, tasks_routine: 0.55, tasks_cognitive: 0.15, tasks_manual: 0.9 },
  { isco_code: "6221", title: "Aquaculture Workers", major_group: 6, automation_risk: 0.48, tasks_routine: 0.45, tasks_cognitive: 0.2, tasks_manual: 0.85 },

  // Major Group 7: Craft and Related Trades Workers
  { isco_code: "7111", title: "House Builders", major_group: 7, automation_risk: 0.71, tasks_routine: 0.55, tasks_cognitive: 0.2, tasks_manual: 0.9 },
  { isco_code: "7112", title: "Bricklayers", major_group: 7, automation_risk: 0.73, tasks_routine: 0.6, tasks_cognitive: 0.1, tasks_manual: 0.95 },
  { isco_code: "7115", title: "Carpenters", major_group: 7, automation_risk: 0.72, tasks_routine: 0.55, tasks_cognitive: 0.15, tasks_manual: 0.9 },
  { isco_code: "7121", title: "Roofers", major_group: 7, automation_risk: 0.78, tasks_routine: 0.6, tasks_cognitive: 0.1, tasks_manual: 0.95 },
  { isco_code: "7126", title: "Plumbers", major_group: 7, automation_risk: 0.35, tasks_routine: 0.35, tasks_cognitive: 0.3, tasks_manual: 0.85 },
  { isco_code: "7127", title: "Air Conditioning Mechanics", major_group: 7, automation_risk: 0.33, tasks_routine: 0.35, tasks_cognitive: 0.35, tasks_manual: 0.8 },
  { isco_code: "7211", title: "Metal Moulders", major_group: 7, automation_risk: 0.83, tasks_routine: 0.7, tasks_cognitive: 0.1, tasks_manual: 0.85 },
  { isco_code: "7231", title: "Motor Vehicle Mechanics", major_group: 7, automation_risk: 0.59, tasks_routine: 0.5, tasks_cognitive: 0.3, tasks_manual: 0.8 },
  { isco_code: "7233", title: "Agricultural Machinery Mechanics", major_group: 7, automation_risk: 0.57, tasks_routine: 0.5, tasks_cognitive: 0.3, tasks_manual: 0.8 },
  { isco_code: "7311", title: "Precision Instrument Makers", major_group: 7, automation_risk: 0.67, tasks_routine: 0.55, tasks_cognitive: 0.3, tasks_manual: 0.8 },
  { isco_code: "7411", title: "Electricians", major_group: 7, automation_risk: 0.15, tasks_routine: 0.3, tasks_cognitive: 0.35, tasks_manual: 0.8 },
  { isco_code: "7412", title: "Electrical Line Installers", major_group: 7, automation_risk: 0.49, tasks_routine: 0.45, tasks_cognitive: 0.2, tasks_manual: 0.85 },
  { isco_code: "7421", title: "Electronics Mechanics", major_group: 7, automation_risk: 0.53, tasks_routine: 0.5, tasks_cognitive: 0.35, tasks_manual: 0.7 },
  { isco_code: "7422", title: "ICT Installers and Servicers", major_group: 7, automation_risk: 0.64, tasks_routine: 0.55, tasks_cognitive: 0.35, tasks_manual: 0.65 },
  { isco_code: "7511", title: "Butchers and Fishmongers", major_group: 7, automation_risk: 0.83, tasks_routine: 0.65, tasks_cognitive: 0.1, tasks_manual: 0.9 },
  { isco_code: "7512", title: "Bakers and Pastry Cooks", major_group: 7, automation_risk: 0.89, tasks_routine: 0.65, tasks_cognitive: 0.15, tasks_manual: 0.85 },
  { isco_code: "7531", title: "Tailors and Dressmakers", major_group: 7, automation_risk: 0.84, tasks_routine: 0.6, tasks_cognitive: 0.15, tasks_manual: 0.85 },

  // Major Group 8: Plant and Machine Operators
  { isco_code: "8111", title: "Miners and Quarriers", major_group: 8, automation_risk: 0.68, tasks_routine: 0.6, tasks_cognitive: 0.1, tasks_manual: 0.95 },
  { isco_code: "8160", title: "Food Processing Machine Operators", major_group: 8, automation_risk: 0.87, tasks_routine: 0.75, tasks_cognitive: 0.1, tasks_manual: 0.7 },
  { isco_code: "8171", title: "Pulp and Paper Plant Operators", major_group: 8, automation_risk: 0.82, tasks_routine: 0.7, tasks_cognitive: 0.15, tasks_manual: 0.6 },
  { isco_code: "8211", title: "Mechanical Machinery Assemblers", major_group: 8, automation_risk: 0.93, tasks_routine: 0.8, tasks_cognitive: 0.1, tasks_manual: 0.8 },
  { isco_code: "8311", title: "Locomotive Engine Drivers", major_group: 8, automation_risk: 0.67, tasks_routine: 0.6, tasks_cognitive: 0.2, tasks_manual: 0.5 },
  { isco_code: "8322", title: "Car, Taxi and Van Drivers", major_group: 8, automation_risk: 0.89, tasks_routine: 0.7, tasks_cognitive: 0.15, tasks_manual: 0.5 },
  { isco_code: "8331", title: "Bus Drivers", major_group: 8, automation_risk: 0.87, tasks_routine: 0.7, tasks_cognitive: 0.15, tasks_manual: 0.45 },
  { isco_code: "8332", title: "Truck Drivers", major_group: 8, automation_risk: 0.79, tasks_routine: 0.65, tasks_cognitive: 0.15, tasks_manual: 0.5 },
  { isco_code: "8341", title: "Mobile Farm Machinery Operators", major_group: 8, automation_risk: 0.72, tasks_routine: 0.6, tasks_cognitive: 0.15, tasks_manual: 0.6 },

  // Major Group 9: Elementary Occupations
  { isco_code: "9111", title: "Domestic Cleaners", major_group: 9, automation_risk: 0.69, tasks_routine: 0.6, tasks_cognitive: 0.05, tasks_manual: 0.95 },
  { isco_code: "9112", title: "Office Cleaners", major_group: 9, automation_risk: 0.72, tasks_routine: 0.65, tasks_cognitive: 0.05, tasks_manual: 0.95 },
  { isco_code: "9211", title: "Crop Farm Labourers", major_group: 9, automation_risk: 0.58, tasks_routine: 0.55, tasks_cognitive: 0.05, tasks_manual: 0.95 },
  { isco_code: "9212", title: "Livestock Farm Labourers", major_group: 9, automation_risk: 0.55, tasks_routine: 0.5, tasks_cognitive: 0.1, tasks_manual: 0.95 },
  { isco_code: "9311", title: "Mining Labourers", major_group: 9, automation_risk: 0.72, tasks_routine: 0.65, tasks_cognitive: 0.05, tasks_manual: 0.95 },
  { isco_code: "9312", title: "Construction Labourers", major_group: 9, automation_risk: 0.71, tasks_routine: 0.6, tasks_cognitive: 0.05, tasks_manual: 0.95 },
  { isco_code: "9321", title: "Hand Packers", major_group: 9, automation_risk: 0.95, tasks_routine: 0.85, tasks_cognitive: 0.05, tasks_manual: 0.85 },
  { isco_code: "9329", title: "Manufacturing Labourers", major_group: 9, automation_risk: 0.84, tasks_routine: 0.7, tasks_cognitive: 0.05, tasks_manual: 0.9 },
  { isco_code: "9411", title: "Fast Food Preparers", major_group: 9, automation_risk: 0.92, tasks_routine: 0.75, tasks_cognitive: 0.05, tasks_manual: 0.85 },
  { isco_code: "9412", title: "Kitchen Helpers", major_group: 9, automation_risk: 0.87, tasks_routine: 0.7, tasks_cognitive: 0.05, tasks_manual: 0.9 },
  { isco_code: "9510", title: "Street Vendors", major_group: 9, automation_risk: 0.38, tasks_routine: 0.35, tasks_cognitive: 0.3, tasks_manual: 0.5 },
  { isco_code: "9520", title: "Street Service Workers", major_group: 9, automation_risk: 0.42, tasks_routine: 0.4, tasks_cognitive: 0.2, tasks_manual: 0.6 },
  { isco_code: "9612", title: "Refuse Collectors", major_group: 9, automation_risk: 0.66, tasks_routine: 0.6, tasks_cognitive: 0.05, tasks_manual: 0.9 },
  { isco_code: "9621", title: "Messengers and Deliverers", major_group: 9, automation_risk: 0.68, tasks_routine: 0.6, tasks_cognitive: 0.1, tasks_manual: 0.6 },
  { isco_code: "9622", title: "Odd-job Persons", major_group: 9, automation_risk: 0.49, tasks_routine: 0.4, tasks_cognitive: 0.15, tasks_manual: 0.8 },
];

// Major group labels
const majorGroups = {
  1: "Managers",
  2: "Professionals",
  3: "Technicians and Associate Professionals",
  4: "Clerical Support Workers",
  5: "Service and Sales Workers",
  6: "Skilled Agricultural Workers",
  7: "Craft and Related Trades Workers",
  8: "Plant and Machine Operators",
  9: "Elementary Occupations"
};

// LMIC automation calibration factors
// Adjusts Frey-Osborne scores based on local infrastructure, digital penetration, labor cost
const lmicCalibration = {
  "GHA": { factor: 0.65, digital_penetration: 0.53, labor_cost_index: 0.18, notes: "Lower automation adoption due to infrastructure gaps and low labor costs" },
  "IND": { factor: 0.72, digital_penetration: 0.47, labor_cost_index: 0.22, notes: "Rapid digitization in urban areas, but rural economy largely manual" },
  "KEN": { factor: 0.60, digital_penetration: 0.40, labor_cost_index: 0.15, notes: "Strong mobile money infrastructure, but limited industrial automation" },
  "BGD": { factor: 0.58, digital_penetration: 0.35, labor_cost_index: 0.12, notes: "Garment sector mechanizing but most economy remains manual" },
  "NGA": { factor: 0.62, digital_penetration: 0.42, labor_cost_index: 0.20, notes: "Oil sector automated, but informal economy dominates employment" },
  "ETH": { factor: 0.50, digital_penetration: 0.25, labor_cost_index: 0.10, notes: "Predominantly agricultural, very low automation penetration" },
  "PHL": { factor: 0.75, digital_penetration: 0.60, labor_cost_index: 0.28, notes: "BPO sector at high risk, manufacturing modernizing" },
  "VNM": { factor: 0.78, digital_penetration: 0.70, labor_cost_index: 0.25, notes: "Rapid industrialization with significant FDI in manufacturing" },
  "ZAF": { factor: 0.80, digital_penetration: 0.72, labor_cost_index: 0.35, notes: "Most industrialized African economy, higher automation adoption" },
  "IDN": { factor: 0.70, digital_penetration: 0.55, labor_cost_index: 0.24, notes: "Large informal sector, digital economy growing fast" },
};

export { occupations, majorGroups, lmicCalibration };
