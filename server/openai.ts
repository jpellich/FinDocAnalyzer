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
  creditworthinessAnalysis?: {
    borrowerReliability: string;
    debtRepaymentCapacity: string;
    creditRating: string;
  };
  industryAnalysis?: {
    sector: string;
    industryRisks: string[];
    competitivePosition: string;
  };
}

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
          content: "Вы эксперт по классификации ОКВЭД (Общероссийский классификатор видов экономической деятельности). Предоставляйте точные названия видов деятельности."
        },
        {
          role: "user",
          content: `Какой вид экономической деятельности соответствует коду ОКВЭД: ${okvedCode}? Ответьте кратко, только название отрасли без дополнительных объяснений. Формат ответа: "ОКВЭД ${okvedCode} - [Название отрасли]"`
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
): Promise<AIAnalysisResult> {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY not configured, using fallback analysis");
      return generateFallbackAnalysis(data, ratios);
    }

    // Get full sector name from OKVED code
    let okvedInfo = '';
    let sectorName = ''; // This will hold the full sector name from AI
    if (data.okved) {
      sectorName = await getOkvedSectorName(data.okved);
      okvedInfo = `\n- ${sectorName}`;
    }

    const companyInfo = data.companyName ? `\nНаименование компании: ${data.companyName}` : '';
    const revenueInfo = data.revenue ? `\n- Выручка: ${data.revenue.toLocaleString()}` : '';
    const netIncomeInfo = data.netIncome ? `\n- Чистая прибыль: ${data.netIncome.toLocaleString()}` : '';

    const profitabilityInfo = ratios.roa || ratios.roe || ratios.ros ? `

ПОКАЗАТЕЛИ РЕНТАБЕЛЬНОСТИ:${ratios.roa ? `\n- ROA (рентабельность активов): ${(ratios.roa * 100).toFixed(2)}%` : ''}${ratios.roe ? `\n- ROE (рентабельность капитала): ${(ratios.roe * 100).toFixed(2)}%` : ''}${ratios.ros ? `\n- ROS (рентабельность продаж): ${(ratios.ros * 100).toFixed(2)}%` : ''}${ratios.grossProfitMargin ? `\n- Валовая рентабельность: ${(ratios.grossProfitMargin * 100).toFixed(2)}%` : ''}${ratios.netProfitMargin ? `\n- Чистая рентабельность: ${(ratios.netProfitMargin * 100).toFixed(2)}%` : ''}` : '';

    const prompt = `Вы финансовый аналитик-эксперт, специализирующийся на оценке кредитоспособности юридических лиц. Проанализируйте финансовое состояние компании и предоставьте детальное заключение о способности заемщика к возврату кредита.${companyInfo}${okvedInfo}

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

ТРЕБУЕТСЯ ДЕТАЛЬНЫЙ АНАЛИЗ В ФОРМАТЕ JSON:
{
  "summary": "краткое резюме финансового состояния компании (2-3 предложения)",
  "strengths": ["массив из 4-6 сильных сторон компании"],
  "weaknesses": ["массив из 3-5 слабых сторон или областей для улучшения"],
  "recommendations": ["массив из 4-6 конкретных рекомендаций"],
  "riskLevel": "low/medium/high - общий уровень финансового риска",
  "creditworthinessAnalysis": {
    "borrowerReliability": "подробная оценка надежности заемщика: анализ финансовой устойчивости, платежеспособности, истории обязательств. Укажите конкретные показатели (2-3 предложения)",
    "debtRepaymentCapacity": "детальный анализ способности возврата кредита: оценка денежных потоков, ликвидности, покрытия обязательств. Рассчитайте примерный срок погашения при текущих показателях (2-3 предложения)",
    "creditRating": "итоговый кредитный рейтинг компании с обоснованием: A+ (отлично), A (хорошо), B (удовлетворительно), C (ниже среднего), D (высокий риск). Укажите ключевые факторы рейтинга"
  },
  "industryAnalysis": {
    "sector": "${sectorName ? `краткое описание отрасли "${sectorName}": основные характеристики, текущее состояние рынка (1-2 предложения)` : 'общая характеристика отрасли на основе профиля активов (1-2 предложения)'}",
    "industryRisks": ["массив из 4-6 отраслевых рисков, которые могут повлиять на способность компании погашать долги: макроэкономические факторы, конкуренция, регуляторные изменения, сезонность, технологические изменения"],
    "competitivePosition": "оценка конкурентного положения компании в отрасли на основе финансовых показателей (1-2 предложения)"
  }
}

ВАЖНО:
- Все анализы должны быть конкретными с упоминанием фактических показателей
- Кредитный анализ должен быть профессиональным, как для банковской оценки
- Отраслевые риски должны быть специфичными для данного сектора экономики
- Рекомендации должны быть практичными и направленными на улучшение кредитоспособности
- Весь анализ на русском языке`;

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

    // Use sectorName (fullOkvedName) when result.industryAnalysis.sector is empty
    const fullOkvedName = sectorName; 

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
        : determineRiskLevel(ratios),
      creditworthinessAnalysis: result.creditworthinessAnalysis && 
        typeof result.creditworthinessAnalysis === "object" ? {
          borrowerReliability: typeof result.creditworthinessAnalysis.borrowerReliability === "string"
            ? result.creditworthinessAnalysis.borrowerReliability
            : "",
          debtRepaymentCapacity: typeof result.creditworthinessAnalysis.debtRepaymentCapacity === "string"
            ? result.creditworthinessAnalysis.debtRepaymentCapacity
            : "",
          creditRating: typeof result.creditworthinessAnalysis.creditRating === "string"
            ? result.creditworthinessAnalysis.creditRating
            : ""
        } : undefined,
      industryAnalysis: result.industryAnalysis && 
        typeof result.industryAnalysis === "object" ? {
          sector: typeof result.industryAnalysis.sector === "string" && result.industryAnalysis.sector.length > 0
            ? result.industryAnalysis.sector
            : (fullOkvedName || ""), // Use fullOkvedName if AI sector is empty
          industryRisks: Array.isArray(result.industryAnalysis.industryRisks)
            ? result.industryAnalysis.industryRisks.filter((r: any) => typeof r === "string")
            : [],
          competitivePosition: typeof result.industryAnalysis.competitivePosition === "string"
            ? result.industryAnalysis.competitivePosition
            : ""
        } : undefined
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

  // Generate basic creditworthiness analysis
  let creditRating = "B";
  if (riskLevel === "low") creditRating = "A";
  else if (riskLevel === "high") creditRating = "C";

  const debtCoverageRatio = ratios.workingCapital > 0 && data.currentLiabilities > 0 
    ? (ratios.workingCapital / data.currentLiabilities).toFixed(2) 
    : "0";

  // Map common OKVED codes to sector names
  const getOkvedSectorNameLocal = (okvedCode: string): string => {
    const okvedMap: Record<string, string> = {
      "01": "Растениеводство и животноводство, охота и предоставление соответствующих услуг",
      "02": "Лесоводство и лесозаготовки",
      "2": "Лесоводство и лесозаготовки",
      "03": "Рыболовство и рыбоводство",
      "05": "Добыча угля",
      "06": "Добыча сырой нефти и природного газа",
      "07": "Добыча металлических руд",
      "08": "Добыча прочих полезных ископаемых",
      "08.1": "Добыча камня, песка и глины",
      "09": "Предоставление услуг в области добычи полезных ископаемых",
      "10": "Производство пищевых продуктов",
      "11": "Производство напитков",
      "12": "Производство табачных изделий",
      "13": "Производство текстильных изделий",
      "14": "Производство одежды",
      "15": "Производство кожи и изделий из кожи",
      "16": "Обработка древесины и производство изделий из дерева",
      "17": "Производство бумаги и бумажных изделий",
      "18": "Деятельность полиграфическая и копирование носителей информации",
      "19": "Производство кокса и нефтепродуктов",
      "20": "Производство химических веществ и химических продуктов",
      "21": "Производство лекарственных средств и материалов",
      "22": "Производство резиновых и пластмассовых изделий",
      "23": "Производство прочей неметаллической минеральной продукции",
      "24": "Производство металлургическое",
      "25": "Производство готовых металлических изделий",
      "26": "Производство компьютеров, электронных и оптических изделий",
      "27": "Производство электрического оборудования",
      "28": "Производство машин и оборудования",
      "29": "Производство автотранспортных средств, прицепов и полуприцепов",
      "30": "Производство прочих транспортных средств и оборудования",
      "31": "Производство мебели",
      "32": "Производство прочих готовых изделий",
      "33": "Ремонт и монтаж машин и оборудования",
      "35": "Обеспечение электрической энергией, газом и паром",
      "36": "Забор, очистка и распределение воды",
      "37": "Сбор и обработка сточных вод",
      "38": "Сбор, обработка и утилизация отходов",
      "39": "Предоставление услуг в области ликвидации загрязнений",
      "41": "Строительство зданий",
      "42": "Строительство инженерных сооружений",
      "43": "Работы строительные специализированные",
      "45": "Торговля оптовая и розничная автотранспортными средствами",
      "46": "Торговля оптовая",
      "47": "Торговля розничная",
      "49": "Деятельность сухопутного и трубопроводного транспорта",
      "50": "Деятельность водного транспорта",
      "51": "Деятельность воздушного и космического транспорта",
      "52": "Складское хозяйство и вспомогательная транспортная деятельность",
      "53": "Деятельность почтовой связи и курьерская деятельность",
      "55": "Деятельность по предоставлению мест для временного проживания",
      "56": "Деятельность по предоставлению продуктов питания и напитков",
      "58": "Деятельность издательская",
      "59": "Производство кинофильмов, видеофильмов и телевизионных программ",
      "60": "Деятельность в области телевизионного и радиовещания",
      "61": "Деятельность в сфере телекоммуникаций",
      "62": "Разработка компьютерного программного обеспечения",
      "63": "Деятельность в области информационных технологий",
      "64": "Деятельность по предоставлению финансовых услуг",
      "65": "Страхование, перестрахование, деятельность негосударственных пенсионных фондов",
      "66": "Деятельность вспомогательная в сфере финансовых услуг и страхования",
      "68": "Операции с недвижимым имуществом",
      "69": "Деятельность в области права и бухгалтерского учета",
      "70": "Деятельность головных офисов и консультирование по вопросам управления",
      "71": "Деятельность в области архитектуры и инженерно-технического проектирования",
      "72": "Научные исследования и разработки",
      "73": "Деятельность рекламная и исследование конъюнктуры рынка",
      "74": "Деятельность профессиональная научная и техническая прочая",
      "75": "Деятельность ветеринарная",
      "77": "Аренда и лизинг",
      "78": "Деятельность по трудоустройству и подбору персонала",
      "79": "Деятельность туристических агентств и прочих организаций",
      "80": "Деятельность по обеспечению безопасности и проведению расследований",
      "81": "Деятельность по обслуживанию зданий и территорий",
      "82": "Деятельность административно-хозяйственная, вспомогательная",
      "84": "Деятельность органов государственного управления",
      "85": "Образование",
      "86": "Деятельность в области здравоохранения",
      "87": "Деятельность по уходу с обеспечением проживания",
      "88": "Предоставление социальных услуг без обеспечения проживания",
      "90": "Деятельность творческая, деятельность в области искусства",
      "91": "Деятельность библиотек, архивов, музеев",
      "92": "Деятельность по организации и проведению азартных игр и заключению пари",
      "93": "Деятельность в области спорта, отдыха и развлечений",
      "94": "Деятельность общественных организаций",
      "95": "Ремонт компьютеров, предметов личного потребления",
      "96": "Деятельность по предоставлению прочих персональных услуг",
      "97": "Деятельность домашних хозяйств с наемными работниками",
      "99": "Деятельность экстерриториальных организаций и органов"
    };

    // Normalize the code (remove leading zeros, trim)
    const normalizedCode = okvedCode.trim();
    
    // Try exact match first
    if (okvedMap[normalizedCode]) {
      return `ОКВЭД ${normalizedCode} - ${okvedMap[normalizedCode]}`;
    }

    // Try matching with zero padding (e.g., "2" -> "02")
    const paddedCode = normalizedCode.length === 1 ? `0${normalizedCode}` : normalizedCode;
    if (okvedMap[paddedCode]) {
      return `ОКВЭД ${normalizedCode} - ${okvedMap[paddedCode]}`;
    }

    // Try matching the first 2 characters
    const shortCode = normalizedCode.substring(0, 2);
    if (okvedMap[shortCode]) {
      return `ОКВЭД ${normalizedCode} - ${okvedMap[shortCode]}`;
    }

    // Try matching just the first character with padding
    const firstChar = normalizedCode.substring(0, 1);
    const paddedFirstChar = `0${firstChar}`;
    if (okvedMap[paddedFirstChar]) {
      return `ОКВЭД ${normalizedCode} - ${okvedMap[paddedFirstChar]}`;
    }

    return `ОКВЭД ${normalizedCode}`;
  };

  const fallbackSectorName = data.okved ? getOkvedSectorNameLocal(data.okved) : "Отрасль не указана";

  console.log(`Fallback OKVED sector name: "${fallbackSectorName}" for code: "${data.okved}"`);

  return {
    summary,
    strengths: strengths.length > 0 ? strengths : ["Финансовые показатели рассчитаны корректно"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["Рекомендуется дополнительный анализ для выявления областей улучшения"],
    recommendations,
    riskLevel,
    creditworthinessAnalysis: {
      borrowerReliability: `На основе коэффициента автономии ${ratios.equityRatio.toFixed(2)} и текущей ликвидности ${ratios.currentRatio.toFixed(2)}, финансовая устойчивость компании оценивается как ${riskLevel === "low" ? "высокая" : riskLevel === "medium" ? "средняя" : "низкая"}. Платежеспособность ${ratios.currentRatio >= 1.5 ? "достаточная" : "требует улучшения"}.`,
      debtRepaymentCapacity: `Покрытие обязательств оборотным капиталом составляет ${debtCoverageRatio}. При текущих показателях ликвидности компания ${ratios.currentRatio >= 2.0 ? "способна своевременно" : ratios.currentRatio >= 1.0 ? "может с определенными ограничениями" : "имеет затруднения"} обслуживать краткосрочные обязательства.`,
      creditRating: `Кредитный рейтинг: ${creditRating}. ${creditRating === "A" ? "Низкий кредитный риск, высокая вероятность выполнения обязательств." : creditRating === "B" ? "Средний кредитный риск, требуется мониторинг финансового состояния." : "Повышенный кредитный риск, рекомендуется дополнительное обеспечение."}`
    },
    industryAnalysis: {
      sector: fallbackSectorName,
      industryRisks: [
        "Макроэкономические риски: изменение процентных ставок и инфляции",
        "Рыночные риски: колебания спроса и конкуренция",
        "Регуляторные риски: изменения в законодательстве и налогообложении",
        "Операционные риски: зависимость от поставщиков и дебиторов"
      ],
      competitivePosition: `На основе финансовых показателей, конкурентная позиция компании оценивается как ${riskLevel === "low" ? "устойчивая" : riskLevel === "medium" ? "средняя" : "слабая"}.`
    }
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