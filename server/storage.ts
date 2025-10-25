import type { FinancialAnalysisResult } from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for financial analysis results
// This is in-memory storage for the MVP - data is not persisted across restarts

export interface IStorage {
  saveAnalysis(analysis: FinancialAnalysisResult): Promise<{ id: string; analysis: FinancialAnalysisResult }>;
  getAnalysis(id: string): Promise<FinancialAnalysisResult | undefined>;
  getAllAnalyses(): Promise<FinancialAnalysisResult[]>;
}

export class MemStorage implements IStorage {
  private analyses: Map<string, FinancialAnalysisResult>;

  constructor() {
    this.analyses = new Map();
  }

  async saveAnalysis(analysis: FinancialAnalysisResult): Promise<{ id: string; analysis: FinancialAnalysisResult }> {
    const id = randomUUID();
    this.analyses.set(id, analysis);
    return { id, analysis };
  }

  async getAnalysis(id: string): Promise<FinancialAnalysisResult | undefined> {
    return this.analyses.get(id);
  }

  async getAllAnalyses(): Promise<FinancialAnalysisResult[]> {
    return Array.from(this.analyses.values());
  }
}

export const storage = new MemStorage();
