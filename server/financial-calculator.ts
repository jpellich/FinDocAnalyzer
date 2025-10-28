import type { FinancialData, FinancialRatios, RatioWithStatus, RatioStatus } from "@shared/schema";

/**
 * Validate and normalize financial data to ensure accounting equation holds:
 * ASSETS = EQUITY + LIABILITIES
 * 
 * This function:
 * 1. Recalculates totalLiabilities from components (longTermDebt + currentLiabilities)
 * 2. Validates that totalAssets ≈ equity + totalLiabilities (within 1% tolerance)
 * 3. Returns normalized data with corrected values
 */
export function validateAndNormalizeFinancialData(data: FinancialData): FinancialData {
  // Recalculate totalLiabilities from sections IV + V
  const calculatedTotalLiabilities = data.longTermDebt + data.currentLiabilities;
  
  // Calculate passive (equity + liabilities) - this should equal totalAssets
  const calculatedPassive = data.equity + calculatedTotalLiabilities;
  
  // Check if accounting equation holds (with 1% tolerance for rounding)
  const difference = Math.abs(data.totalAssets - calculatedPassive);
  const tolerance = data.totalAssets * 0.01; // 1% tolerance
  
  if (difference > tolerance) {
    console.warn(`⚠️ Бухгалтерское уравнение не сошлось:`);
    console.warn(`   АКТИВ: ${data.totalAssets.toFixed(2)}`);
    console.warn(`   ПАССИВ: ${calculatedPassive.toFixed(2)}`);
    console.warn(`   Разница: ${difference.toFixed(2)} (${(difference / data.totalAssets * 100).toFixed(2)}%)`);
  } else {
    console.log(`✓ Бухгалтерское уравнение сошлось: АКТИВ = ПАССИВ = ${data.totalAssets.toFixed(2)}`);
  }
  
  // Return normalized data with corrected totalLiabilities
  return {
    ...data,
    totalLiabilities: calculatedTotalLiabilities
  };
}

/**
 * Calculate all financial ratios from the provided financial data
 */
export function calculateFinancialRatios(data: FinancialData): FinancialRatios {
  // Liquidity Ratios
  const currentRatio = data.currentLiabilities > 0 
    ? data.currentAssets / data.currentLiabilities 
    : 0;

  const quickRatio = data.currentLiabilities > 0
    ? (data.currentAssets - data.inventory) / data.currentLiabilities
    : 0;

  const cashRatio = data.currentLiabilities > 0
    ? (data.cashAndEquivalents + data.shortTermInvestments) / data.currentLiabilities
    : 0;

  // Financial Stability Ratios
  const equityRatio = data.totalAssets > 0
    ? data.equity / data.totalAssets
    : 0;

  const debtRatio = data.totalAssets > 0
    ? data.totalLiabilities / data.totalAssets
    : 0;

  const debtToEquityRatio = data.equity > 0
    ? data.totalLiabilities / data.equity
    : 0;

  const financialLeverageRatio = data.equity > 0
    ? data.totalAssets / data.equity
    : 0;

  // Working Capital
  const workingCapital = data.currentAssets - data.currentLiabilities;

  // Equity Maneuverability (optional)
  const equityManeuverability = data.equity > 0
    ? (data.equity - (data.totalAssets - data.currentAssets)) / data.equity
    : undefined;

  return {
    currentRatio,
    quickRatio,
    cashRatio,
    debtToEquityRatio,
    equityRatio,
    debtRatio,
    financialLeverageRatio,
    workingCapital,
    equityManeuverability,
  };
}

/**
 * Evaluate the status of each ratio based on industry benchmarks
 */
export function evaluateRatios(ratios: FinancialRatios): {
  currentRatio: RatioWithStatus;
  quickRatio: RatioWithStatus;
  cashRatio: RatioWithStatus;
  debtToEquityRatio: RatioWithStatus;
  equityRatio: RatioWithStatus;
  debtRatio: RatioWithStatus;
  financialLeverageRatio: RatioWithStatus;
  workingCapital: RatioWithStatus;
} {
  return {
    currentRatio: {
      value: ratios.currentRatio,
      status: getRatioStatus(ratios.currentRatio, { excellent: 2.5, good: 2.0, warning: 1.5 }),
      benchmark: "≥ 2.0",
      description: "Способность компании погашать краткосрочные обязательства оборотными активами"
    },
    quickRatio: {
      value: ratios.quickRatio,
      status: getRatioStatus(ratios.quickRatio, { excellent: 1.5, good: 1.0, warning: 0.8 }),
      benchmark: "≥ 1.0",
      description: "Способность быстро погасить краткосрочные обязательства ликвидными активами"
    },
    cashRatio: {
      value: ratios.cashRatio,
      status: getRatioStatus(ratios.cashRatio, { excellent: 0.5, good: 0.2, warning: 0.1 }),
      benchmark: "≥ 0.2",
      description: "Способность погасить обязательства только за счет денежных средств"
    },
    debtToEquityRatio: {
      value: ratios.debtToEquityRatio,
      status: getRatioStatus(ratios.debtToEquityRatio, { excellent: 0.5, good: 1.0, warning: 1.5 }, true),
      benchmark: "< 1.0",
      description: "Соотношение заемного капитала к собственному"
    },
    equityRatio: {
      value: ratios.equityRatio,
      status: getRatioStatus(ratios.equityRatio, { excellent: 0.6, good: 0.5, warning: 0.4 }),
      benchmark: "≥ 0.5",
      description: "Доля собственного капитала в общей сумме активов"
    },
    debtRatio: {
      value: ratios.debtRatio,
      status: getRatioStatus(ratios.debtRatio, { excellent: 0.3, good: 0.5, warning: 0.6 }, true),
      benchmark: "< 0.5",
      description: "Доля заемного капитала в общей сумме активов"
    },
    financialLeverageRatio: {
      value: ratios.financialLeverageRatio,
      status: getRatioStatus(ratios.financialLeverageRatio, { excellent: 1.5, good: 2.0, warning: 2.5 }, true),
      benchmark: "1.0 - 2.0",
      description: "Показывает эффективность использования заемного капитала"
    },
    workingCapital: {
      value: ratios.workingCapital,
      status: ratios.workingCapital > 0 ? "excellent" : "critical",
      benchmark: "> 0",
      description: "Разница между оборотными активами и краткосрочными обязательствами"
    }
  };
}

/**
 * Determine the status of a ratio based on benchmark thresholds
 * @param value - The calculated ratio value
 * @param thresholds - Thresholds for excellent, good, and warning
 * @param reverse - If true, lower values are better (for debt ratios)
 */
function getRatioStatus(
  value: number,
  thresholds: { excellent: number; good: number; warning: number },
  reverse: boolean = false
): RatioStatus {
  if (reverse) {
    if (value <= thresholds.excellent) return "excellent";
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.warning) return "warning";
    return "critical";
  } else {
    if (value >= thresholds.excellent) return "excellent";
    if (value >= thresholds.good) return "good";
    if (value >= thresholds.warning) return "warning";
    return "critical";
  }
}
