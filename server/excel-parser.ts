import * as XLSX from "xlsx";
import type { FinancialData } from "@shared/schema";
import { financialDataSchema } from "@shared/schema";

/**
 * Normalize a key by removing extra spaces, punctuation, and converting to lowercase
 */
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '') // Remove punctuation but keep letters, numbers, spaces
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

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
    const foundKeys: string[] = []; // Track what keys we found for better error messages

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row.length >= 2) {
        const rawKey = String(row[0]).trim();
        const key = normalizeKey(rawKey);
        const value = parseFloat(row[1]);

        if (key && !isNaN(value)) {
          dataMap.set(key, value);
          foundKeys.push(rawKey);
        }
      }
    }

    // Log found keys for debugging
    console.log('Найдены следующие поля в Excel:', foundKeys);

    // Map the parsed data to our FinancialData structure
    // Support multiple possible naming conventions
    const financialData: FinancialData = {
      currentAssets: findValue(dataMap, foundKeys, [
        "оборотные активы",
        "оборотные активы всего",
        "current assets",
        "текущие активы",
        "ii оборотные активы",
        "итого по разделу ii"
      ]),
      cashAndEquivalents: findValue(dataMap, foundKeys, [
        "денежные средства",
        "денежные средства и денежные эквиваленты",
        "cash and equivalents",
        "денежные средства и эквиваленты",
        "cash",
        "деньги"
      ]),
      shortTermInvestments: findValue(dataMap, foundKeys, [
        "краткосрочные инвестиции",
        "краткосрочные финансовые вложения",
        "short term investments",
        "финансовые вложения",
        "кфв"
      ]),
      accountsReceivable: findValue(dataMap, foundKeys, [
        "дебиторская задолженность",
        "accounts receivable",
        "дебиторы",
        "дебиторка"
      ]),
      inventory: findValue(dataMap, foundKeys, [
        "запасы",
        "inventory",
        "товарно материальные запасы",
        "товарноматериальные запасы",
        "тмз"
      ]),
      totalAssets: findValue(dataMap, foundKeys, [
        "всего активов",
        "активы всего",
        "total assets",
        "активы",
        "баланс",
        "итого активов"
      ]),
      currentLiabilities: findValue(dataMap, foundKeys, [
        "краткосрочные обязательства",
        "краткосрочные обязательства всего",
        "current liabilities",
        "текущие обязательства",
        "v краткосрочные обязательства",
        "итого по разделу v"
      ]),
      shortTermDebt: findValue(dataMap, foundKeys, [
        "краткосрочный долг",
        "краткосрочные займы",
        "short term debt",
        "краткосрочные кредиты",
        "займы и кредиты"
      ]),
      totalLiabilities: findValue(dataMap, foundKeys, [
        "всего обязательств",
        "обязательства всего",
        "total liabilities",
        "обязательства",
        "пассивы",
        "итого обязательств"
      ]),
      equity: findValue(dataMap, foundKeys, [
        "собственный капитал",
        "капитал и резервы",
        "equity",
        "капитал",
        "собственные средства",
        "iii капитал и резервы",
        "итого по разделу iii"
      ]),
      longTermDebt: findValue(dataMap, foundKeys, [
        "долгосрочный долг",
        "долгосрочные займы",
        "long term debt",
        "долгосрочные обязательства",
        "долгосрочные кредиты"
      ]),
      revenue: findValue(dataMap, foundKeys, [
        "выручка",
        "revenue",
        "доход",
        "выручка от продаж"
      ], true),
      netIncome: findValue(dataMap, foundKeys, [
        "чистая прибыль",
        "чистая прибыль убыток",
        "net income",
        "прибыль",
        "чп"
      ], true),
      operatingIncome: findValue(dataMap, foundKeys, [
        "операционная прибыль",
        "operating income",
        "прибыль от продаж",
        "операционный доход"
      ], true),
      grossProfit: findValue(dataMap, foundKeys, [
        "валовая прибыль убыток",
        "валовая прибыль",
        "gross profit"
      ], true),
      profitBeforeTax: findValue(dataMap, foundKeys, [
        "прибыль убыток до налогообложения",
        "прибыль до налогообложения",
        "profit before tax"
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
 * Uses flexible matching to handle different Excel formats
 */
function findValue(
  dataMap: Map<string, number>,
  foundKeys: string[],
  possibleKeys: string[],
  optional: boolean = false
): number {
  // First try exact matches
  for (const key of possibleKeys) {
    const normalizedKey = normalizeKey(key);
    if (dataMap.has(normalizedKey)) {
      return dataMap.get(normalizedKey)!;
    }
  }

  // Then try partial matches (key contains the search term)
  for (const key of possibleKeys) {
    const normalizedSearchKey = normalizeKey(key);
    const words = normalizedSearchKey.split(' ');

    // Look for keys that contain all the words from our search term
    for (const [mapKey, value] of dataMap.entries()) {
      const allWordsPresent = words.every(word => 
        word.length > 2 && mapKey.includes(word)
      );

      if (allWordsPresent) {
        console.log(`Найдено частичное совпадение: "${mapKey}" для поиска "${normalizedSearchKey}"`);
        return value;
      }
    }
  }

  if (optional) {
    return 0;
  }

  // Provide helpful error message with what was found
  const errorMsg = `Не найдено обязательное поле: "${possibleKeys[0]}". 
Попробуйте использовать одно из этих названий: ${possibleKeys.slice(0, 3).join(', ')}.
Найденные поля в файле: ${foundKeys.slice(0, 10).join(', ')}${foundKeys.length > 10 ? '...' : ''}`;

  throw new Error(errorMsg);
}

/**
 * Generate a sample Excel template for users
 */
export function generateSampleTemplate(): Buffer {
  const sampleData = [
    ["Показатель", "Значение"],
    // Section I: Non-current assets (implied, not explicitly listed in original sample but good to have for context)
    // "I. Внеоборотные активы" - This would be a header, not a data row.
    // Data points would follow, but are not in the original sample.
    // Assuming the user wants to see how these sections would be represented.

    // Section III: Capital and Reserves (implied)
    // "III. Капитал и резервы" - This would be a header.
    // Data points would follow.

    // Example data points that might fall under these sections, if they were expanded:
    // ["Основные средства", 150000], // Example for Non-current assets
    // ["Нематериальные активы", 20000], // Example for Non-current assets

    // Data points related to Equity (which is part of Capital and Reserves)
    ["Собственный капитал", 180000], // This is already present and maps to equity
    // ["Уставный капитал", 100000], // Example for Capital and Reserves
    // ["Добавочный капитал", 50000], // Example for Capital and Reserves
    // ["Резервный капитал", 30000], // Example for Capital and Reserves

    ["Оборотные активы", 150000], // Section II
    ["Денежные средства", 45000],
    ["Краткосрочные инвестиции", 20000],
    ["Дебиторская задолженность", 50000],
    ["Запасы", 35000],
    ["Всего активов", 300000], // Total Assets
    ["Краткосрочные обязательства", 60000], // Section V
    ["Краткосрочный долг", 15000],
    ["Всего обязательств", 120000], // Total Liabilities
    // ["Долгосрочные обязательства", 60000], // Section IV - implied by longTermDebt
    ["Долгосрочный долг", 60000], // This maps to longTermDebt, part of Section IV

    // Financial Performance Indicators
    ["Выручка", 500000],
    ["Валовая прибыль", 150000], // Added based on user request for "Валовая прибыль (убыток)"
    ["Прибыль от продаж", 80000], // Added based on user request for "Прибыль (убыток) от продаж"
    ["Прибыль до налогообложения", 65000], // Added based on user request for "Прибыль (убыток) до налогообложения"
    ["Чистая прибыль", 45000],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Финансовые данные");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}