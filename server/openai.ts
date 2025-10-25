import OpenAI from "openai";
import type { FinancialData, FinancialRatios } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// Reference: javascript_openai blueprint integration

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface AIAnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  riskLevel: "low" | "medium" | "high";
}

export async function generateFinancialAnalysis(
  data: FinancialData,
  ratios: FinancialRatios
): Promise<AIAnalysisResult> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY not configured, using fallback analysis");
      return generateFallbackAnalysis(data, ratios);
    }

    const prompt = `Вы финансовый аналитик-эксперт. Проанализируйте следующие финансовые данные и коэффициенты компании:

ФИНАНСОВЫЕ ДАННЫЕ:
- Оборотные активы: ${data.currentAssets.toLocaleString()}
- Денежные средства: ${data.cashAndEquivalents.toLocaleString()}
- Краткосрочные инвестиции: ${data.shortTermInvestments.toLocaleString()}
- Дебиторская задолженность: ${data.accountsReceivable.toLocaleString()}
- Запасы: ${data.inventory.toLocaleString()}
- Всего активов: ${data.totalAssets.toLocaleString()}
- Краткосрочные обязательства: ${data.currentLiabilities.toLocaleString()}
- Всего обязательств: ${data.totalLiabilities.toLocaleString()}
- Собственный капитал: ${data.equity.toLocaleString()}
- Долгосрочный долг: ${data.longTermDebt.toLocaleString()}

РАССЧИТАННЫЕ КОЭФФИЦИЕНТЫ:
- Коэффициент текущей ликвидности: ${ratios.currentRatio.toFixed(2)} (норма ≥ 2.0)
- Коэффициент быстрой ликвидности: ${ratios.quickRatio.toFixed(2)} (норма ≥ 1.0)
- Коэффициент абсолютной ликвидности: ${ratios.cashRatio.toFixed(2)} (норма ≥ 0.2)
- Коэффициент автономии: ${ratios.equityRatio.toFixed(2)} (норма ≥ 0.5)
- Коэффициент задолженности: ${ratios.debtRatio.toFixed(2)} (норма < 0.5)
- Соотношение долга к капиталу: ${ratios.debtToEquityRatio.toFixed(2)} (норма < 1.0)
- Финансовый рычаг: ${ratios.financialLeverageRatio.toFixed(2)}
- Оборотный капитал: ${ratios.workingCapital.toLocaleString()}

Предоставьте профессиональный анализ в формате JSON со следующими полями:
{
  "summary": "краткое резюме финансового состояния компании (2-3 предложения)",
  "strengths": ["массив из 3-5 сильных сторон"],
  "weaknesses": ["массив из 2-4 слабых сторон или областей для улучшения"],
  "recommendations": ["массив из 3-5 конкретных рекомендаций"],
  "riskLevel": "low/medium/high - оценка общего уровня финансового риска"
}

Анализ должен быть:
- Профессиональным и основанным на реальных финансовых показателях
- На русском языке
- Конкретным с упоминанием конкретных цифр
- Практичным с действенными рекомендациями`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Вы опытный финансовый аналитик. Предоставляйте точный, профессиональный анализ в формате JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn("Empty response from OpenAI, using fallback");
      return generateFallbackAnalysis(data, ratios);
    }

    const result = JSON.parse(content);

    // Validate and sanitize the response with strict schema checking
    const validated: AIAnalysisResult = {
      summary: typeof result.summary === "string" && result.summary.length > 0
        ? result.summary 
        : "Анализ финансового состояния компании основан на рассчитанных показателях.",
      strengths: Array.isArray(result.strengths) && result.strengths.length > 0
        ? result.strengths.filter((s: any) => typeof s === "string")
        : ["Данные успешно проанализированы"],
      weaknesses: Array.isArray(result.weaknesses) && result.weaknesses.length > 0
        ? result.weaknesses.filter((w: any) => typeof w === "string")
        : [],
      recommendations: Array.isArray(result.recommendations) && result.recommendations.length > 0
        ? result.recommendations.filter((r: any) => typeof r === "string")
        : ["Рекомендуется регулярный мониторинг финансовых показателей"],
      riskLevel: ["low", "medium", "high"].includes(result.riskLevel) 
        ? result.riskLevel 
        : determineRiskLevel(ratios)
    };

    return validated;
  } catch (error) {
    console.error("Error generating AI analysis:", error);
    console.warn("Falling back to rule-based analysis");
    
    // Return fallback analysis instead of throwing
    return generateFallbackAnalysis(data, ratios);
  }
}

/**
 * Generate a fallback analysis based on rules when OpenAI is unavailable
 */
function generateFallbackAnalysis(data: FinancialData, ratios: FinancialRatios): AIAnalysisResult {
  const riskLevel = determineRiskLevel(ratios);
  
  const summary = `Финансовый анализ показывает коэффициент текущей ликвидности ${ratios.currentRatio.toFixed(2)}, коэффициент автономии ${ratios.equityRatio.toFixed(2)}. Общий уровень риска оценивается как ${riskLevel === "low" ? "низкий" : riskLevel === "medium" ? "средний" : "высокий"}.`;
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // Analyze liquidity
  if (ratios.currentRatio >= 2.0) {
    strengths.push(`Отличная текущая ликвидность (${ratios.currentRatio.toFixed(2)}), предприятие способно погашать краткосрочные обязательства`);
  } else if (ratios.currentRatio < 1.5) {
    weaknesses.push(`Низкая текущая ликвидность (${ratios.currentRatio.toFixed(2)}), требуется улучшение`);
    recommendations.push("Рассмотреть меры по увеличению оборотных активов или сокращению краткосрочных обязательств");
  }

  // Analyze financial stability
  if (ratios.equityRatio >= 0.5) {
    strengths.push(`Высокая финансовая независимость (коэффициент автономии ${ratios.equityRatio.toFixed(2)})`);
  } else {
    weaknesses.push(`Низкий коэффициент автономии (${ratios.equityRatio.toFixed(2)}), высокая зависимость от заемных средств`);
    recommendations.push("Укрепить капитальную базу компании для повышения финансовой устойчивости");
  }

  // Analyze working capital
  if (ratios.workingCapital > 0) {
    strengths.push(`Положительный оборотный капитал (${ratios.workingCapital.toLocaleString()}) обеспечивает финансовую гибкость`);
  } else {
    weaknesses.push("Отрицательный оборотный капитал указывает на проблемы с ликвидностью");
    recommendations.push("Срочно пересмотреть структуру активов и обязательств");
  }

  // Add general recommendation
  if (recommendations.length === 0) {
    recommendations.push("Продолжать мониторинг финансовых показателей для поддержания стабильности");
  }

  return {
    summary,
    strengths: strengths.length > 0 ? strengths : ["Финансовые показатели рассчитаны корректно"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["Рекомендуется дополнительный анализ для выявления областей улучшения"],
    recommendations,
    riskLevel,
  };
}

/**
 * Determine risk level based on financial ratios
 */
function determineRiskLevel(ratios: FinancialRatios): "low" | "medium" | "high" {
  let score = 0;

  // Good liquidity
  if (ratios.currentRatio >= 2.0) score += 2;
  else if (ratios.currentRatio >= 1.5) score += 1;
  else if (ratios.currentRatio < 1.0) score -= 2;

  // Good equity ratio
  if (ratios.equityRatio >= 0.6) score += 2;
  else if (ratios.equityRatio >= 0.5) score += 1;
  else if (ratios.equityRatio < 0.3) score -= 2;

  // Low debt
  if (ratios.debtRatio < 0.3) score += 1;
  else if (ratios.debtRatio > 0.6) score -= 1;

  // Positive working capital
  if (ratios.workingCapital > 0) score += 1;
  else score -= 2;

  if (score >= 4) return "low";
  if (score <= 0) return "high";
  return "medium";
}
