import { z } from "zod";

// Financial data from uploaded Excel file
export interface FinancialData {
  // Company information
  okved?: string; // ОКВЭД 2 code for industry classification
  companyName?: string; // Company name if available
  
  // Balance Sheet items
  currentAssets: number;
  cashAndEquivalents: number;
  shortTermInvestments: number;
  accountsReceivable: number;
  inventory: number;
  totalAssets: number;
  currentLiabilities: number;
  shortTermDebt: number;
  totalLiabilities: number;
  equity: number;
  longTermDebt: number;
  
  // Income Statement items (optional for extended analysis)
  revenue?: number;
  netIncome?: number;
  operatingIncome?: number;
  grossProfit?: number;
  profitBeforeTax?: number;
  
  // Detailed balance sheet line items (optional)
  // Section I - Non-current assets
  intangibleAssets?: number; // 1110
  rdResults?: number; // 1120
  intangibleExplorationAssets?: number; // 1130
  tangibleExplorationAssets?: number; // 1140
  fixedAssets?: number; // 1150
  profitableInvestmentsInTangibleAssets?: number; // 1160
  financialInvestments?: number; // 1170
  deferredTaxAssets?: number; // 1180
  otherNonCurrentAssets?: number; // 1190
  
  // Section II - Current assets (already have main items above)
  otherCurrentAssets?: number;
  
  // Section III - Capital and reserves
  authorizedCapital?: number;
  retainedEarnings?: number;
  revaluationReserve?: number;
  additionalCapital?: number;
  
  // Section IV - Long-term liabilities (already have longTermDebt)
  borrowedFundsLongTerm?: number;
  deferredTaxLiabilities?: number;
  estimatedLiabilities?: number;
  otherLongTermLiabilities?: number;
  
  // Section V - Current liabilities (already have shortTermDebt, currentLiabilities)
  accountsPayable?: number;
  deferredIncome?: number;
  estimatedLiabilitiesShortTerm?: number;
  otherCurrentLiabilities?: number;
}

// Financial ratios calculated from the data
export interface FinancialRatios {
  // Liquidity ratios
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  
  // Financial stability ratios
  debtToEquityRatio: number;
  equityRatio: number;
  debtRatio: number;
  financialLeverageRatio: number;
  
  // Profitability ratios
  roa?: number; // Return on Assets
  roe?: number; // Return on Equity
  ros?: number; // Return on Sales
  grossProfitMargin?: number; // Gross Profit Margin
  operatingProfitMargin?: number; // Operating Profit Margin (ROS based on operating income)
  netProfitMargin?: number; // Net Profit Margin
  
  // Additional ratios
  workingCapital: number;
  equityManeuverability?: number;
}

// Status indicators for ratios
export type RatioStatus = "excellent" | "good" | "warning" | "critical";

export interface RatioWithStatus {
  value: number;
  status: RatioStatus;
  benchmark: string;
  description: string;
  formula: string;
}

// Reporting period with year-specific data and ratios
export interface ReportingPeriod {
  year: number;
  data: FinancialData;
  ratios: {
    currentRatio: RatioWithStatus;
    quickRatio: RatioWithStatus;
    cashRatio: RatioWithStatus;
    debtToEquityRatio: RatioWithStatus;
    equityRatio: RatioWithStatus;
    debtRatio: RatioWithStatus;
    financialLeverageRatio: RatioWithStatus;
    workingCapital: RatioWithStatus;
    roa?: RatioWithStatus;
    roe?: RatioWithStatus;
    ros?: RatioWithStatus;
    grossProfitMargin?: RatioWithStatus;
    operatingProfitMargin?: RatioWithStatus;
    netProfitMargin?: RatioWithStatus;
  };
}

// Bank-style credit report structure
export interface BankCreditReport {
  // 1. Industry Analysis
  industrySector: {
    description: string; // Description of the industry sector
    marketConditions?: string; // Current market state and trends (optional)
  };
  
  // 2. Financial Condition Analysis
  financialCondition: {
    liquidity: {
      analysis: string; // Detailed analysis with specific ratios
      conclusion: string; // Brief summary conclusion
    };
    stability: {
      analysis: string; // Detailed analysis with specific ratios
      conclusion: string; // Brief summary conclusion
    };
    profitability: {
      analysis: string; // Detailed analysis with specific ratios
      conclusion: string; // Brief summary conclusion
    };
  };
  
  // 3. Strengths & Weaknesses
  strengths: string[];
  weaknesses: string[];
  
  // 4. Recommendations & Credit Decision
  recommendations: {
    items: string[];
    creditDecision: string; // ✅ Approved / ❌ Declined / ⚠️ Conditional
    comment: string; // Overall assessment and conditions
  };
  
  riskLevel: "low" | "medium" | "high";
}

export interface FinancialAnalysisResult {
  data: FinancialData;
  ratios: {
    currentRatio: RatioWithStatus;
    quickRatio: RatioWithStatus;
    cashRatio: RatioWithStatus;
    debtToEquityRatio: RatioWithStatus;
    equityRatio: RatioWithStatus;
    debtRatio: RatioWithStatus;
    financialLeverageRatio: RatioWithStatus;
    workingCapital: RatioWithStatus;
    // Profitability ratios (optional)
    roa?: RatioWithStatus;
    roe?: RatioWithStatus;
    ros?: RatioWithStatus;
    grossProfitMargin?: RatioWithStatus;
    operatingProfitMargin?: RatioWithStatus;
    netProfitMargin?: RatioWithStatus;
  };
  // Historical periods (3 years of data)
  periods?: ReportingPeriod[];
  // AI Analysis in bank credit report format
  aiAnalysis: BankCreditReport;
  timestamp: string;
}

// Schema for file upload validation
export const uploadFileSchema = z.object({
  filename: z.string(),
  size: z.number().max(10 * 1024 * 1024, "File size must be less than 10MB"),
  mimetype: z.string().refine(
    (type) => 
      type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      type === "application/vnd.ms-excel",
    "File must be an Excel file (.xlsx or .xls)"
  ),
});

// Parsed Excel data schema
export const financialDataSchema = z.object({
  // Company information
  okved: z.string().optional(),
  companyName: z.string().optional(),
  
  currentAssets: z.number().positive(),
  cashAndEquivalents: z.number().nonnegative(),
  shortTermInvestments: z.number().nonnegative(),
  accountsReceivable: z.number().nonnegative(),
  inventory: z.number().nonnegative(),
  totalAssets: z.number().positive(),
  currentLiabilities: z.number().nonnegative(),
  shortTermDebt: z.number().nonnegative(),
  totalLiabilities: z.number().nonnegative(),
  equity: z.number().positive(),
  longTermDebt: z.number().nonnegative(),
  revenue: z.number().optional(),
  netIncome: z.number().optional(),
  operatingIncome: z.number().optional(),
  grossProfit: z.number().optional(),
  profitBeforeTax: z.number().optional(),
  // Detailed line items
  intangibleAssets: z.number().optional(),
  rdResults: z.number().optional(),
  intangibleExplorationAssets: z.number().optional(),
  tangibleExplorationAssets: z.number().optional(),
  fixedAssets: z.number().optional(),
  profitableInvestmentsInTangibleAssets: z.number().optional(),
  financialInvestments: z.number().optional(),
  deferredTaxAssets: z.number().optional(),
  otherNonCurrentAssets: z.number().optional(),
  otherCurrentAssets: z.number().optional(),
  authorizedCapital: z.number().optional(),
  retainedEarnings: z.number().optional(),
  revaluationReserve: z.number().optional(),
  additionalCapital: z.number().optional(),
  borrowedFundsLongTerm: z.number().optional(),
  deferredTaxLiabilities: z.number().optional(),
  estimatedLiabilities: z.number().optional(),
  otherLongTermLiabilities: z.number().optional(),
  accountsPayable: z.number().optional(),
  deferredIncome: z.number().optional(),
  estimatedLiabilitiesShortTerm: z.number().optional(),
  otherCurrentLiabilities: z.number().optional(),
});

export type InsertFinancialData = z.infer<typeof financialDataSchema>;
