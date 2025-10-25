import { z } from "zod";

// Financial data from uploaded Excel file
export interface FinancialData {
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
  };
  aiAnalysis: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    riskLevel: "low" | "medium" | "high";
  };
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
});

export type InsertFinancialData = z.infer<typeof financialDataSchema>;
