import * as XLSX from "xlsx";
import type { FinancialData } from "@shared/schema";
import { financialDataSchema } from "@shared/schema";

/**
 * Parse an Excel file and extract financial data
 * Expects the Excel file to have specific row structure with financial items
 */
export function parseExcelFile(buffer: Buffer): FinancialData {
  try {
    // Read the Excel file from buffer
    const workbook = XLSX.read(buffer, { type: "buffer" });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("Excel файл не содержит листов");
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!jsonData || jsonData.length < 2) {
      throw new Error("Excel файл содержит недостаточно данных");
    }

    // Parse the data based on expected structure
    // This assumes a simple two-column format: [Item Name, Value]
    const dataMap = new Map<string, number>();
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row.length >= 2) {
        const key = String(row[0]).trim().toLowerCase();
        const value = parseFloat(row[1]);
        
        if (!isNaN(value)) {
          dataMap.set(key, value);
        }
      }
    }

    // Map the parsed data to our FinancialData structure
    // Support multiple possible naming conventions
    const financialData: FinancialData = {
      currentAssets: findValue(dataMap, [
        "оборотные активы",
        "current assets",
        "текущие активы"
      ]),
      cashAndEquivalents: findValue(dataMap, [
        "денежные средства",
        "cash and equivalents",
        "денежные средства и эквиваленты",
        "cash"
      ]),
      shortTermInvestments: findValue(dataMap, [
        "краткосрочные инвестиции",
        "short term investments",
        "краткосрочные финансовые вложения"
      ]),
      accountsReceivable: findValue(dataMap, [
        "дебиторская задолженность",
        "accounts receivable",
        "дебиторы"
      ]),
      inventory: findValue(dataMap, [
        "запасы",
        "inventory",
        "товарно-материальные запасы"
      ]),
      totalAssets: findValue(dataMap, [
        "всего активов",
        "total assets",
        "активы",
        "баланс"
      ]),
      currentLiabilities: findValue(dataMap, [
        "краткосрочные обязательства",
        "current liabilities",
        "текущие обязательства"
      ]),
      shortTermDebt: findValue(dataMap, [
        "краткосрочный долг",
        "short term debt",
        "краткосрочные займы"
      ]),
      totalLiabilities: findValue(dataMap, [
        "всего обязательств",
        "total liabilities",
        "обязательства",
        "пассивы"
      ]),
      equity: findValue(dataMap, [
        "собственный капитал",
        "equity",
        "капитал",
        "собственные средства"
      ]),
      longTermDebt: findValue(dataMap, [
        "долгосрочный долг",
        "long term debt",
        "долгосрочные займы"
      ]),
      revenue: findValue(dataMap, [
        "выручка",
        "revenue",
        "доход"
      ], true),
      netIncome: findValue(dataMap, [
        "чистая прибыль",
        "net income",
        "прибыль"
      ], true),
      operatingIncome: findValue(dataMap, [
        "операционная прибыль",
        "operating income",
        "прибыль от продаж"
      ], true),
    };

    // Validate the parsed data using Zod schema
    const validatedData = financialDataSchema.parse(financialData);
    
    return validatedData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Ошибка парсинга Excel файла: ${error.message}`);
    }
    throw new Error("Не удалось прочитать Excel файл. Проверьте формат данных.");
  }
}

/**
 * Find a value in the data map by checking multiple possible key names
 */
function findValue(
  dataMap: Map<string, number>,
  possibleKeys: string[],
  optional: boolean = false
): number {
  for (const key of possibleKeys) {
    if (dataMap.has(key)) {
      return dataMap.get(key)!;
    }
  }
  
  if (optional) {
    return 0;
  }
  
  throw new Error(`Не найдено обязательное поле: ${possibleKeys[0]}`);
}

/**
 * Generate a sample Excel template for users
 */
export function generateSampleTemplate(): Buffer {
  const sampleData = [
    ["Показатель", "Значение"],
    ["Оборотные активы", 150000],
    ["Денежные средства", 45000],
    ["Краткосрочные инвестиции", 20000],
    ["Дебиторская задолженность", 50000],
    ["Запасы", 35000],
    ["Всего активов", 300000],
    ["Краткосрочные обязательства", 60000],
    ["Краткосрочный долг", 15000],
    ["Всего обязательств", 120000],
    ["Собственный капитал", 180000],
    ["Долгосрочный долг", 60000],
    ["Выручка", 500000],
    ["Чистая прибыль", 45000],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Финансовые данные");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
