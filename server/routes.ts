import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { parseExcelFile, generateSampleTemplate } from "./excel-parser";
import { parseDocumentFile } from "./document-parser";
import { calculateFinancialRatios, evaluateRatios, validateAndNormalizeFinancialData } from "./financial-calculator";
import { generateFinancialAnalysis } from "./openai";
import type { FinancialAnalysisResult } from "@shared/schema";

// Configure multer for file upload (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Только Excel (.xlsx, .xls), Word (.docx) и PDF файлы разрешены"));
    }
  },
});

// Generate text report from analysis result
function generateTextReport(result: FinancialAnalysisResult): string {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatRatio = (value: number) => {
    return value.toFixed(2);
  };

  const date = new Date(result.timestamp).toLocaleString("ru-RU");
  
  let report = `═══════════════════════════════════════════════════════════════════════
ФИНАНСОВЫЙ ОТЧЁТ
═══════════════════════════════════════════════════════════════════════

Дата формирования: ${date}

───────────────────────────────────────────────────────────────────────
БУХГАЛТЕРСКИЙ БАЛАНС
───────────────────────────────────────────────────────────────────────

АКТИВ:
  I. Внеоборотные активы         ${formatCurrency(result.data.totalAssets - result.data.currentAssets)}
  
  II. Оборотные активы           ${formatCurrency(result.data.currentAssets)}
    - Запасы                     ${formatCurrency(result.data.inventory)}
    - Дебиторская задолженность  ${formatCurrency(result.data.accountsReceivable)}
    - Финансовые вложения        ${formatCurrency(result.data.shortTermInvestments)}
    - Денежные средства          ${formatCurrency(result.data.cashAndEquivalents)}
  
  БАЛАНС (АКТИВ)                 ${formatCurrency(result.data.totalAssets)}

ПАССИВ:
  III. Капитал и резервы         ${formatCurrency(result.data.equity)}
  
  IV. Долгосрочные обязательства ${formatCurrency(result.data.longTermDebt)}
  
  V. Краткосрочные обязательства ${formatCurrency(result.data.currentLiabilities)}
    - Заемные средства           ${formatCurrency(result.data.shortTermDebt)}
  
  БАЛАНС (ПАССИВ)                ${formatCurrency(result.data.equity + result.data.longTermDebt + result.data.currentLiabilities)}

`;

  if (result.data.revenue || result.data.netIncome) {
    report += `───────────────────────────────────────────────────────────────────────
ОТЧЁТ О ПРИБЫЛЯХ И УБЫТКАХ
───────────────────────────────────────────────────────────────────────

`;
    if (result.data.revenue) {
      report += `  Выручка                        ${formatCurrency(result.data.revenue)}\n`;
    }
    if (result.data.operatingIncome) {
      report += `  Прибыль от продаж              ${formatCurrency(result.data.operatingIncome)}\n`;
    }
    if (result.data.netIncome) {
      report += `  Чистая прибыль (убыток)        ${formatCurrency(result.data.netIncome)}\n`;
    }
    report += '\n';
  }

  report += `───────────────────────────────────────────────────────────────────────
ФИНАНСОВЫЕ КОЭФФИЦИЕНТЫ
───────────────────────────────────────────────────────────────────────

КОЭФФИЦИЕНТЫ ЛИКВИДНОСТИ:
  Текущей ликвидности            ${formatRatio(result.ratios.currentRatio.value)}    [${result.ratios.currentRatio.status.toUpperCase()}]
  Быстрой ликвидности            ${formatRatio(result.ratios.quickRatio.value)}    [${result.ratios.quickRatio.status.toUpperCase()}]
  Абсолютной ликвидности         ${formatRatio(result.ratios.cashRatio.value)}    [${result.ratios.cashRatio.status.toUpperCase()}]

ПОКАЗАТЕЛИ ФИНАНСОВОЙ УСТОЙЧИВОСТИ:
  Коэффициент автономии          ${formatRatio(result.ratios.equityRatio.value)}    [${result.ratios.equityRatio.status.toUpperCase()}]
  Коэффициент задолженности      ${formatRatio(result.ratios.debtRatio.value)}    [${result.ratios.debtRatio.status.toUpperCase()}]
  Финансовый рычаг               ${formatRatio(result.ratios.financialLeverageRatio.value)}    [${result.ratios.financialLeverageRatio.status.toUpperCase()}]

ДОПОЛНИТЕЛЬНЫЕ ПОКАЗАТЕЛИ:
  Оборотный капитал              ${formatCurrency(result.ratios.workingCapital.value)}
  Соотношение долга к капиталу   ${formatRatio(result.ratios.debtToEquityRatio.value)}    [${result.ratios.debtToEquityRatio.status.toUpperCase()}]
`;

  // Add profitability ratios if available
  if (result.ratios.roa || result.ratios.roe || result.ratios.grossProfitMargin || result.ratios.operatingProfitMargin || result.ratios.netProfitMargin) {
    report += `
ПОКАЗАТЕЛИ РЕНТАБЕЛЬНОСТИ:`;
    
    if (result.ratios.roa) {
      report += `\n  ROA (Рентабельность активов)       ${(result.ratios.roa.value * 100).toFixed(2)}%    [${result.ratios.roa.status.toUpperCase()}]`;
    }
    if (result.ratios.roe) {
      report += `\n  ROE (Рентабельность капитала)      ${(result.ratios.roe.value * 100).toFixed(2)}%    [${result.ratios.roe.status.toUpperCase()}]`;
    }
    if (result.ratios.ros) {
      report += `\n  ROS (Рентабельность продаж)        ${(result.ratios.ros.value * 100).toFixed(2)}%    [${result.ratios.ros.status.toUpperCase()}]`;
    }
    if (result.ratios.grossProfitMargin) {
      report += `\n  Рентабельность по валовой прибыли  ${(result.ratios.grossProfitMargin.value * 100).toFixed(2)}%    [${result.ratios.grossProfitMargin.status.toUpperCase()}]`;
    }
    if (result.ratios.operatingProfitMargin) {
      report += `\n  Рентабельность по прибыли от продаж ${(result.ratios.operatingProfitMargin.value * 100).toFixed(2)}%    [${result.ratios.operatingProfitMargin.status.toUpperCase()}]`;
    }
    if (result.ratios.netProfitMargin) {
      report += `\n  Рентабельность по чистой прибыли   ${(result.ratios.netProfitMargin.value * 100).toFixed(2)}%    [${result.ratios.netProfitMargin.status.toUpperCase()}]`;
    }
    report += '\n';
  }

  report += `
───────────────────────────────────────────────────────────────────────
AI АНАЛИЗ
───────────────────────────────────────────────────────────────────────

РЕЗЮМЕ:
${result.aiAnalysis.summary}

УРОВЕНЬ РИСКА: ${result.aiAnalysis.riskLevel.toUpperCase()}

СИЛЬНЫЕ СТОРОНЫ:
${result.aiAnalysis.strengths.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

СЛАБЫЕ СТОРОНЫ:
${result.aiAnalysis.weaknesses.map((w, i) => `  ${i + 1}. ${w}`).join('\n')}

РЕКОМЕНДАЦИИ:
${result.aiAnalysis.recommendations.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}

═══════════════════════════════════════════════════════════════════════
Конец отчёта
═══════════════════════════════════════════════════════════════════════
`;

  return report;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // POST /api/analyze - Upload and analyze Excel file
  app.post("/api/analyze", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: "Файл не загружен. Пожалуйста, загрузите файл Excel (.xlsx, .xls), Word (.docx) или PDF." 
        });
      }

      console.log(`Processing file: ${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})`);

      // Step 1: Parse file based on type
      let financialData;
      
      if (
        req.file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        req.file.mimetype === "application/vnd.ms-excel"
      ) {
        financialData = parseExcelFile(req.file.buffer);
        console.log("✓ Excel file parsed successfully");
      } else if (
        req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        req.file.mimetype === "application/pdf"
      ) {
        financialData = await parseDocumentFile(req.file.buffer, req.file.mimetype);
        console.log("✓ Document file parsed successfully");
      } else {
        throw new Error("Неподдерживаемый формат файла");
      }

      // Step 2: Validate and normalize financial data
      const normalizedData = validateAndNormalizeFinancialData(financialData);
      console.log("✓ Financial data validated and normalized");

      // Step 3: Calculate financial ratios
      const ratios = calculateFinancialRatios(normalizedData);
      console.log("✓ Financial ratios calculated");

      // Step 4: Evaluate ratios and assign status
      const evaluatedRatios = evaluateRatios(ratios);
      console.log("✓ Ratios evaluated");

      // Step 5: Generate AI analysis
      const aiAnalysis = await generateFinancialAnalysis(normalizedData, ratios);
      console.log("✓ AI analysis generated");

      // Step 6: Create complete analysis result
      const analysisResult: FinancialAnalysisResult = {
        data: normalizedData,
        ratios: evaluatedRatios,
        aiAnalysis,
        timestamp: new Date().toISOString(),
      };

      // Step 7: Save analysis to storage
      const saved = await storage.saveAnalysis(analysisResult);
      console.log(`✓ Analysis saved with ID: ${saved.id}`);

      // Return the complete analysis
      res.json({
        success: true,
        id: saved.id,
        result: analysisResult,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      
      if (error instanceof Error) {
        res.status(400).json({ 
          error: error.message 
        });
      } else {
        res.status(500).json({ 
          error: "Произошла ошибка при обработке файла" 
        });
      }
    }
  });

  // GET /api/analysis/:id - Get saved analysis by ID
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const analysis = await storage.getAnalysis(id);

      if (!analysis) {
        return res.status(404).json({ 
          error: "Анализ не найден" 
        });
      }

      res.json({
        success: true,
        result: analysis,
      });
    } catch (error) {
      console.error("Error retrieving analysis:", error);
      res.status(500).json({ 
        error: "Не удалось получить анализ" 
      });
    }
  });

  // GET /api/analyses - Get all saved analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllAnalyses();
      
      res.json({
        success: true,
        count: analyses.length,
        results: analyses,
      });
    } catch (error) {
      console.error("Error retrieving analyses:", error);
      res.status(500).json({ 
        error: "Не удалось получить список анализов" 
      });
    }
  });

  // POST /api/download-report - Generate and download financial report
  app.post("/api/download-report", async (req, res) => {
    try {
      const analysisResult: FinancialAnalysisResult = req.body;
      
      if (!analysisResult || !analysisResult.data || !analysisResult.ratios) {
        return res.status(400).json({ 
          error: "Недостаточно данных для генерации отчёта" 
        });
      }

      // Generate text report
      const report = generateTextReport(analysisResult);
      
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=financial-report-${new Date().toISOString().split('T')[0]}.txt`
      );
      
      res.send(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ 
        error: "Не удалось создать отчёт" 
      });
    }
  });

  // GET /api/template - Download sample Excel template
  app.get("/api/template", (req, res) => {
    try {
      const template = generateSampleTemplate();
      
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=financial-template.xlsx"
      );
      
      res.send(template);
    } catch (error) {
      console.error("Error generating template:", error);
      res.status(500).json({ 
        error: "Не удалось создать шаблон" 
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      openai: !!process.env.OPENAI_API_KEY,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
