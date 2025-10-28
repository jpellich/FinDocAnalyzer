import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { parseExcelFile, generateSampleTemplate } from "./excel-parser";
import { parseDocumentFile } from "./document-parser";
import { calculateFinancialRatios, evaluateRatios } from "./financial-calculator";
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

      // Step 2: Calculate financial ratios
      const ratios = calculateFinancialRatios(financialData);
      console.log("✓ Financial ratios calculated");

      // Step 3: Evaluate ratios and assign status
      const evaluatedRatios = evaluateRatios(ratios);
      console.log("✓ Ratios evaluated");

      // Step 4: Generate AI analysis
      const aiAnalysis = await generateFinancialAnalysis(financialData, ratios);
      console.log("✓ AI analysis generated");

      // Step 5: Create complete analysis result
      const analysisResult: FinancialAnalysisResult = {
        data: financialData,
        ratios: evaluatedRatios,
        aiAnalysis,
        timestamp: new Date().toISOString(),
      };

      // Step 6: Save analysis to storage
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
