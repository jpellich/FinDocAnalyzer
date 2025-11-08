import OpenAI from "openai";
import type { FinancialData, FinancialRatios, BankCreditReport } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// Reference: javascript_openai blueprint integration

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

/**
 * Get sector name from OKVED code using OpenAI
 */
async function getOkvedSectorName(okvedCode: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return `Отрасль по ОКВЭД ${okvedCode}`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Вы эксперт по классификации ОКВЭД 2 (Общероссийский классификатор видов экономической деятельности). Предоставляйте точные названия видов деятельности."
        },
        {
          role: "user",
          content: `Какой вид экономической деятельности соответствует коду ОКВЭД 2: ${okvedCode}? Ответьте кратко, только название отрасли без дополнительных объяснений. Формат ответа: "ОКВЭД ${okvedCode} - [Название отрасли]"`
        }
      ],
      max_completion_tokens: 100,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (content) {
      return content;
    }
    return `Отрасль по ОКВЭД ${okvedCode}`;
  } catch (error) {
    console.error("Error getting OKVED sector name:", error);
    return `Отрасль по ОКВЭД ${okvedCode}`;
  }
}

export async function generateFinancialAnalysis(
  data: FinancialData,
  ratios: FinancialRatios
): Promise<BankCreditReport> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY not configured, using fallback analysis");
      return generateFallbackAnalysis(data, ratios);
    }

    console.log('Starting AI analysis with OpenAI API...');
    
    // Get full sector name from OKVED code with timeout
    let okvedInfo = '';
    let sectorName = '';
    if (data.okved) {
      try {
        console.log(`Fetching OKVED sector name for code: ${data.okved}`);
        sectorName = await Promise.race([
          getOkvedSectorName(data.okved),
          new Promise<string>((_, reject) => 
            setTimeout(() => reject(new Error('OKVED lookup timeout')), 10000)
          )
        ]);
        okvedInfo = `\n- ${sectorName}`;
        console.log(`OKVED sector resolved: ${sectorName}`);
      } catch (error) {
        console.warn(`OKVED lookup failed or timed out, using code as-is:`, error);
        sectorName = `Отрасль по ОКВЭД ${data.okved}`;
        okvedInfo = `\n- ${sectorName}`;
      }
    } else {
      sectorName = "Отрасль не указана";
      okvedInfo = "\n- Отрасль не указана в документах";
    }
    
    const companyInfo = data.companyName ? `\nНаименование компании: ${data.companyName}` : '';
    const revenueInfo = data.revenue ? `\n- Выручка: ${data.revenue.toLocaleString()}` : '';
    const netIncomeInfo = data.netIncome ? `\n- Чистая прибыль: ${data.netIncome.toLocaleString()}` : '';
    
    const profitabilityInfo = ratios.roa || ratios.roe || ratios.ros ? `

ПОКАЗАТЕЛИ РЕНТАБЕЛЬНОСТИ:${ratios.roa ? `\n- ROA (рентабельность активов): ${(ratios.roa * 100).toFixed(2)}%` : ''}${ratios.roe ? `\n- ROE (рентабельность капитала): ${(ratios.roe * 100).toFixed(2)}%` : ''}${ratios.ros ? `\n- ROS (рентабельность продаж): ${(ratios.ros * 100).toFixed(2)}%` : ''}${ratios.grossProfitMargin ? `\n- Валовая рентабельность: ${(ratios.grossProfitMargin * 100).toFixed(2)}%` : ''}${ratios.netProfitMargin ? `\n- Чистая рентабельность: ${(ratios.netProfitMargin * 100).toFixed(2)}%` : ''}` : '';

    const prompt = `Вы финансовый аналитик-эксперт, специализирующийся на оценке кредитоспособности юридических лиц. Подготовьте детальный банковский кредитный отчет о финансовом состоянии компании.${companyInfo}${okvedInfo}

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
- Долгосрочный долг: ${data.longTermDebt.toLocaleString()}${revenueInfo}${netIncomeInfo}

РАССЧИТАННЫЕ КОЭФФИЦИЕНТЫ:
- Коэффициент текущей ликвидности: ${ratios.currentRatio.toFixed(2)} (норма ≥ 2.0)
- Коэффициент быстрой ликвидности: ${ratios.quickRatio.toFixed(2)} (норма ≥ 1.0)
- Коэффициент абсолютной ликвидности: ${ratios.cashRatio.toFixed(2)} (норма ≥ 0.2)
- Коэффициент автономии: ${ratios.equityRatio.toFixed(2)} (норма ≥ 0.5)
- Коэффициент задолженности: ${ratios.debtRatio.toFixed(2)} (норма < 0.5)
- Соотношение долга к капиталу: ${ratios.debtToEquityRatio.toFixed(2)} (норма < 1.0)
- Финансовый рычаг: ${ratios.financialLeverageRatio.toFixed(2)}
- Оборотный капитал: ${ratios.workingCapital.toLocaleString()}${profitabilityInfo}

ТРЕБУЕТСЯ БАНКОВСКИЙ КРЕДИТНЫЙ ОТЧЕТ В ФОРМАТЕ JSON:
{
  "industrySector": {
    "description": "${sectorName ? `Подробное описание отрасли "${sectorName}": специфика деятельности, основные характеристики, факторы успеха` : 'Подробное описание отрасли на основе профиля активов компании'}",
    "marketConditions": "Текущее состояние рынка, тренды, прогнозы развития отрасли (или пустая строка если данных недостаточно)"
  },
  "financialCondition": {
    "liquidity": {
      "analysis": "Детальный анализ ликвидности с указанием всех трех коэффициентов (текущей ${ratios.currentRatio.toFixed(2)}, быстрой ${ratios.quickRatio.toFixed(2)}, абсолютной ${ratios.cashRatio.toFixed(2)}), сравнением с нормами, оценкой способности погашать краткосрочные обязательства",
      "conclusion": "Краткий вывод об уровне ликвидности (1 предложение)"
    },
    "stability": {
      "analysis": "Детальный анализ финансовой устойчивости: коэффициент автономии ${ratios.equityRatio.toFixed(2)}, соотношение долга к капиталу ${ratios.debtToEquityRatio.toFixed(2)}, финансовый рычаг ${ratios.financialLeverageRatio.toFixed(2)}, оценка зависимости от заемных средств",
      "conclusion": "Краткий вывод о финансовой устойчивости (1 предложение)"
    },
    "profitability": {
      "analysis": "${ratios.roa || ratios.roe || ratios.ros ? `Детальный анализ рентабельности: ${ratios.roa ? `ROA ${(ratios.roa * 100).toFixed(2)}%, ` : ''}${ratios.roe ? `ROE ${(ratios.roe * 100).toFixed(2)}%, ` : ''}${ratios.ros ? `ROS ${(ratios.ros * 100).toFixed(2)}%, ` : ''}оценка эффективности использования активов и капитала` : 'Данные о прибыльности отсутствуют, рекомендуется запросить отчет о финансовых результатах'}",
      "conclusion": "${ratios.roa || ratios.roe || ratios.ros ? 'Краткий вывод о рентабельности (1 предложение)' : 'Невозможно оценить без данных о прибыли'}"
    }
  },
  "strengths": ["массив из 4-6 конкретных сильных сторон компании с указанием показателей"],
  "weaknesses": ["массив из 3-5 слабых сторон или рисков с указанием показателей"],
  "recommendations": {
    "items": ["массив из 4-6 конкретных рекомендаций для улучшения кредитоспособности"],
    "creditDecision": "✅ Одобрить / ❌ Отклонить / ⚠️ Условно одобрить",
    "comment": "Общая оценка кредитоспособности и условия кредитования (2-3 предложения)"
  },
  "riskLevel": "low/medium/high"
}

ВАЖНО:
- Все анализы должны содержать конкретные числовые показатели из предоставленных данных
- Стиль должен быть профессиональным, как в банковском кредитном заключении
- В разделе ликвидности обязательно упомянуть все три коэффициента и их соответствие нормам
- В разделе устойчивости обязательно оценить структуру капитала и уровень долговой нагрузки
- Кредитное решение должно логически следовать из анализа всех разделов
- Весь анализ строго на русском языке`;

    console.log('Sending request to OpenAI API...');
    
    // Add timeout to OpenAI API call (30 seconds)
    const response = await Promise.race([
      openai.chat.completions.create({
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
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OpenAI API timeout after 30 seconds')), 30000)
      )
    ]) as Awaited<ReturnType<typeof openai.chat.completions.create>>;

    console.log('Received response from OpenAI API');

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn("Empty response from OpenAI, using fallback");
      return generateFallbackAnalysis(data, ratios);
    }

    console.log('Parsing OpenAI response...');
    const result = JSON.parse(content);

    // Validate and sanitize the response with strict BankCreditReport schema
    const validated: BankCreditReport = {
      industrySector: {
        description: result.industrySector?.description && typeof result.industrySector.description === "string"
          ? result.industrySector.description
          : (sectorName || "Отрасль не указана"),
        marketConditions: result.industrySector?.marketConditions && typeof result.industrySector.marketConditions === "string"
          ? result.industrySector.marketConditions
          : ""
      },
      financialCondition: {
        liquidity: {
          analysis: result.financialCondition?.liquidity?.analysis && typeof result.financialCondition.liquidity.analysis === "string"
            ? result.financialCondition.liquidity.analysis
            : `Коэффициент текущей ликвидности: ${ratios.currentRatio.toFixed(2)} (норма ≥ 2.0), быстрой ликвидности: ${ratios.quickRatio.toFixed(2)} (норма ≥ 1.0), абсолютной ликвидности: ${ratios.cashRatio.toFixed(2)} (норма ≥ 0.2).`,
          conclusion: result.financialCondition?.liquidity?.conclusion && typeof result.financialCondition.liquidity.conclusion === "string"
            ? result.financialCondition.liquidity.conclusion
            : ratios.currentRatio >= 2.0 ? "Ликвидность на высоком уровне" : ratios.currentRatio >= 1.0 ? "Ликвидность удовлетворительная" : "Ликвидность требует улучшения"
        },
        stability: {
          analysis: result.financialCondition?.stability?.analysis && typeof result.financialCondition.stability.analysis === "string"
            ? result.financialCondition.stability.analysis
            : `Коэффициент автономии: ${ratios.equityRatio.toFixed(2)} (норма ≥ 0.5), соотношение долга к капиталу: ${ratios.debtToEquityRatio.toFixed(2)} (норма < 1.0), финансовый рычаг: ${ratios.financialLeverageRatio.toFixed(2)}.`,
          conclusion: result.financialCondition?.stability?.conclusion && typeof result.financialCondition.stability.conclusion === "string"
            ? result.financialCondition.stability.conclusion
            : ratios.equityRatio >= 0.5 ? "Финансовая устойчивость высокая" : ratios.equityRatio >= 0.3 ? "Финансовая устойчивость средняя" : "Финансовая устойчивость низкая"
        },
        profitability: {
          analysis: result.financialCondition?.profitability?.analysis && typeof result.financialCondition.profitability.analysis === "string"
            ? result.financialCondition.profitability.analysis
            : ratios.roa || ratios.roe || ratios.ros 
              ? `Показатели рентабельности: ${ratios.roa ? `ROA ${(ratios.roa * 100).toFixed(2)}%, ` : ''}${ratios.roe ? `ROE ${(ratios.roe * 100).toFixed(2)}%, ` : ''}${ratios.ros ? `ROS ${(ratios.ros * 100).toFixed(2)}%` : ''}.`
              : "Данные о прибыльности отсутствуют в предоставленной отчетности",
          conclusion: result.financialCondition?.profitability?.conclusion && typeof result.financialCondition.profitability.conclusion === "string"
            ? result.financialCondition.profitability.conclusion
            : ratios.roa || ratios.roe || ratios.ros 
              ? "Рентабельность требует дополнительной оценки"
              : "Невозможно оценить без данных о прибыли"
        }
      },
      strengths: Array.isArray(result.strengths) && result.strengths.length > 0
        ? result.strengths.filter((s: any) => typeof s === "string")
        : ["Финансовая отчетность предоставлена и проанализирована"],
      weaknesses: Array.isArray(result.weaknesses) && result.weaknesses.length > 0
        ? result.weaknesses.filter((w: any) => typeof w === "string")
        : ["Требуется дополнительный анализ для полной оценки"],
      recommendations: {
        items: Array.isArray(result.recommendations?.items) && result.recommendations.items.length > 0
          ? result.recommendations.items.filter((r: any) => typeof r === "string")
          : ["Рекомендуется регулярный мониторинг финансовых показателей"],
        creditDecision: result.recommendations?.creditDecision && typeof result.recommendations.creditDecision === "string"
          ? result.recommendations.creditDecision
          : determineRiskLevel(ratios) === "low" ? "✅ Одобрить" : determineRiskLevel(ratios) === "high" ? "❌ Отклонить" : "⚠️ Условно одобрить",
        comment: result.recommendations?.comment && typeof result.recommendations.comment === "string"
          ? result.recommendations.comment
          : "Решение основано на текущих финансовых показателях и требует дополнительной проверки обеспечения"
      },
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
function generateFallbackAnalysis(data: FinancialData, ratios: FinancialRatios): BankCreditReport {
  const riskLevel = determineRiskLevel(ratios);
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendationItems: string[] = [];

  // Analyze liquidity
  if (ratios.currentRatio >= 2.0) {
    strengths.push(`Отличная текущая ликвидность (коэффициент ${ratios.currentRatio.toFixed(2)}), предприятие способно погашать краткосрочные обязательства`);
  } else if (ratios.currentRatio >= 1.0) {
    strengths.push(`Удовлетворительная текущая ликвидность (коэффициент ${ratios.currentRatio.toFixed(2)})`);
  } else {
    weaknesses.push(`Низкая текущая ликвидность (коэффициент ${ratios.currentRatio.toFixed(2)} ниже нормы)`);
    recommendationItems.push("Увеличить оборотные активы или сократить краткосрочные обязательства для улучшения ликвидности");
  }

  // Analyze quick ratio
  if (ratios.quickRatio >= 1.0) {
    strengths.push(`Высокая быстрая ликвидность (коэффициент ${ratios.quickRatio.toFixed(2)}), достаточно ликвидных активов для покрытия текущих обязательств`);
  } else if (ratios.quickRatio < 0.7) {
    weaknesses.push(`Недостаточная быстрая ликвидность (коэффициент ${ratios.quickRatio.toFixed(2)})`);
  }

  // Analyze financial stability
  if (ratios.equityRatio >= 0.5) {
    strengths.push(`Высокая финансовая независимость (коэффициент автономии ${ratios.equityRatio.toFixed(2)}), низкая зависимость от заемных средств`);
  } else if (ratios.equityRatio >= 0.3) {
    strengths.push(`Средняя финансовая устойчивость (коэффициент автономии ${ratios.equityRatio.toFixed(2)})`);
  } else {
    weaknesses.push(`Низкий коэффициент автономии (${ratios.equityRatio.toFixed(2)}), высокая зависимость от заемных средств`);
    recommendationItems.push("Укрепить капитальную базу компании для повышения финансовой устойчивости");
  }

  // Analyze debt levels
  if (ratios.debtToEquityRatio < 1.0) {
    strengths.push(`Умеренная долговая нагрузка (соотношение долга к капиталу ${ratios.debtToEquityRatio.toFixed(2)})`);
  } else if (ratios.debtToEquityRatio >= 2.0) {
    weaknesses.push(`Высокая долговая нагрузка (соотношение долга к капиталу ${ratios.debtToEquityRatio.toFixed(2)})`);
    recommendationItems.push("Рассмотреть возможность снижения долговой нагрузки");
  }

  // Analyze working capital
  if (ratios.workingCapital > 0) {
    strengths.push(`Положительный оборотный капитал (${ratios.workingCapital.toLocaleString()}) обеспечивает финансовую гибкость`);
  } else {
    weaknesses.push(`Отрицательный оборотный капитал (${ratios.workingCapital.toLocaleString()}) указывает на дефицит оборотных средств`);
    recommendationItems.push("Срочно пересмотреть структуру активов и обязательств");
  }

  // Analyze profitability if available
  if (ratios.roa && ratios.roa > 0.05) {
    strengths.push(`Положительная рентабельность активов (ROA ${(ratios.roa * 100).toFixed(2)}%)`);
  } else if (ratios.roa && ratios.roa < 0) {
    weaknesses.push(`Отрицательная рентабельность активов (ROA ${(ratios.roa * 100).toFixed(2)}%)`);
  }

  // Add general recommendations
  if (recommendationItems.length === 0) {
    recommendationItems.push("Продолжать мониторинг финансовых показателей для поддержания стабильности");
  }
  recommendationItems.push("Обеспечить своевременное предоставление финансовой отчетности");
  recommendationItems.push("Поддерживать коэффициент текущей ликвидности не ниже 1.5");

  // Ensure we have minimum required items
  if (strengths.length === 0) {
    strengths.push("Финансовая отчетность предоставлена в полном объеме");
  }
  if (weaknesses.length === 0) {
    weaknesses.push("Требуется дополнительный анализ отраслевых рисков");
  }

  // Determine credit decision
  let creditDecision: string;
  let creditComment: string;
  
  if (riskLevel === "low") {
    creditDecision = "✅ Одобрить";
    creditComment = `Компания демонстрирует устойчивое финансовое положение с коэффициентом текущей ликвидности ${ratios.currentRatio.toFixed(2)} и коэффициентом автономии ${ratios.equityRatio.toFixed(2)}. Кредитные риски оцениваются как низкие.`;
  } else if (riskLevel === "medium") {
    creditDecision = "⚠️ Условно одобрить";
    creditComment = `Финансовое состояние компании оценивается как удовлетворительное. Рекомендуется кредитование с дополнительным обеспечением и регулярным мониторингом показателей ликвидности и финансовой устойчивости.`;
  } else {
    creditDecision = "❌ Отклонить";
    creditComment = `Финансовые показатели компании указывают на высокие кредитные риски. Коэффициенты ликвидности и финансовой устойчивости ниже нормативных значений. Рекомендуется отклонить кредитную заявку до улучшения финансового положения.`;
  }

  // Build liquidity analysis
  const liquidityAnalysis = `Коэффициент текущей ликвидности составляет ${ratios.currentRatio.toFixed(2)} ${ratios.currentRatio >= 2.0 ? '(выше нормы ≥2.0)' : ratios.currentRatio >= 1.0 ? '(ниже нормы, но приемлемо)' : '(значительно ниже нормы)'}, быстрой ликвидности ${ratios.quickRatio.toFixed(2)} ${ratios.quickRatio >= 1.0 ? '(соответствует норме)' : '(ниже нормы ≥1.0)'}, абсолютной ликвидности ${ratios.cashRatio.toFixed(2)} ${ratios.cashRatio >= 0.2 ? '(соответствует норме)' : '(ниже нормы ≥0.2)'}. ${ratios.workingCapital > 0 ? `Положительный оборотный капитал ${ratios.workingCapital.toLocaleString()} обеспечивает способность погашать текущие обязательства.` : 'Отрицательный оборотный капитал свидетельствует о проблемах с краткосрочной платежеспособностью.'}`;

  const liquidityConclusion = ratios.currentRatio >= 2.0 && ratios.quickRatio >= 1.0 
    ? "Ликвидность на высоком уровне, компания способна своевременно погашать обязательства"
    : ratios.currentRatio >= 1.0 
      ? "Ликвидность удовлетворительная, требуется мониторинг"
      : "Ликвидность низкая, существуют риски невыполнения обязательств";

  // Build stability analysis
  const stabilityAnalysis = `Коэффициент автономии ${ratios.equityRatio.toFixed(2)} ${ratios.equityRatio >= 0.5 ? '(выше нормы ≥0.5)' : '(ниже нормативного значения)'}, соотношение долга к капиталу ${ratios.debtToEquityRatio.toFixed(2)} ${ratios.debtToEquityRatio < 1.0 ? '(в пределах нормы <1.0)' : '(превышает норму)'}, финансовый рычаг ${ratios.financialLeverageRatio.toFixed(2)}. Доля заемных средств составляет ${(ratios.debtRatio * 100).toFixed(1)}% от общей суммы активов.`;

  const stabilityConclusion = ratios.equityRatio >= 0.5 
    ? "Финансовая устойчивость высокая, компания финансово независима"
    : ratios.equityRatio >= 0.3 
      ? "Финансовая устойчивость средняя, умеренная зависимость от кредиторов"
      : "Финансовая устойчивость низкая, высокая зависимость от заемных средств";

  // Build profitability analysis
  let profitabilityAnalysis: string;
  let profitabilityConclusion: string;

  if (ratios.roa || ratios.roe || ratios.ros) {
    const metrics: string[] = [];
    if (ratios.roa) metrics.push(`ROA ${(ratios.roa * 100).toFixed(2)}%`);
    if (ratios.roe) metrics.push(`ROE ${(ratios.roe * 100).toFixed(2)}%`);
    if (ratios.ros) metrics.push(`ROS ${(ratios.ros * 100).toFixed(2)}%`);
    
    profitabilityAnalysis = `Показатели рентабельности: ${metrics.join(', ')}. ${ratios.roa && ratios.roa > 0 ? 'Компания генерирует прибыль от использования активов.' : 'Рентабельность требует улучшения.'}`;
    profitabilityConclusion = ratios.roa && ratios.roa > 0.05 
      ? "Рентабельность на приемлемом уровне"
      : ratios.roa && ratios.roa > 0 
        ? "Рентабельность низкая, требуется оптимизация"
        : "Убыточная деятельность, высокие финансовые риски";
  } else {
    profitabilityAnalysis = "Данные о финансовых результатах (выручка, прибыль) отсутствуют в предоставленной отчетности. Для полной оценки кредитоспособности необходим отчет о финансовых результатах.";
    profitabilityConclusion = "Невозможно оценить без данных о прибыли и убытках";
  }

  return {
    industrySector: {
      description: data.okved 
        ? `Компания осуществляет деятельность в соответствии с ОКВЭД ${data.okved}. Для детальной оценки отраслевых рисков требуется дополнительная информация о рынке и конкурентах.`
        : "Информация об отрасли не указана в документах. Рекомендуется предоставить данные о виде экономической деятельности (ОКВЭД) для оценки отраслевых рисков.",
      marketConditions: ""
    },
    financialCondition: {
      liquidity: {
        analysis: liquidityAnalysis,
        conclusion: liquidityConclusion
      },
      stability: {
        analysis: stabilityAnalysis,
        conclusion: stabilityConclusion
      },
      profitability: {
        analysis: profitabilityAnalysis,
        conclusion: profitabilityConclusion
      }
    },
    strengths: strengths.length > 0 ? strengths : ["Финансовая отчетность предоставлена"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["Требуется дополнительный анализ"],
    recommendations: {
      items: recommendationItems,
      creditDecision,
      comment: creditComment
    },
    riskLevel
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
