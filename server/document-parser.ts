import mammoth from "mammoth";
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
 * Extract text from DOCX file
 */
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // pdf-parse uses CommonJS, use dynamic import
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Parse a numeric value from string, handling common formats:
 * - Thousands separators (spaces, commas)
 * - Parentheses for negative numbers: (123) -> -123
 * - Plus/minus signs
 * - Decimal separators
 */
function parseNumericValue(str: string): number | null {
  if (!str) return null;
  
  // Remove whitespace
  let cleaned = str.trim();
  
  // Check for parentheses (negative number)
  const isNegative = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isNegative) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  
  // Remove thousand separators (spaces, commas, non-breaking spaces)
  cleaned = cleaned.replace(/[\s,\u00A0\u202F]/g, '');
  
  // Handle explicit negative sign
  const hasNegativeSign = cleaned.startsWith('-');
  if (hasNegativeSign) {
    cleaned = cleaned.slice(1);
  }
  
  // Remove any remaining non-digit characters except decimal point
  cleaned = cleaned.replace(/[^\d.]/g, '');
  
  const value = parseFloat(cleaned);
  
  if (isNaN(value)) {
    return null;
  }
  
  // Apply negative sign if needed
  return (isNegative || hasNegativeSign) ? -value : value;
}

/**
 * Parse financial data from text content
 * Looks for common patterns in Russian financial statements
 */
function parseFinancialDataFromText(text: string): FinancialData {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  // Create a map to store found values
  const dataMap = new Map<string, number>();
  const foundKeys: string[] = [];

  // Pattern to match: "Name of item" followed by numbers (possibly with spaces/parentheses)
  const patterns = [
    // Pattern: "Item name" Code Value1 Value2 Value3 (with potential parentheses and separators)
    /^(.+?)\s+(\d{4})\s+([\d\s,.()\-+]+?)(?:\s+([\d\s,.()\-+]+?))?(?:\s+([\d\s,.()\-+]+?))?$/,
    // Pattern: "Item name" Value (with potential parentheses and separators)
    /^(.+?)\s+([\d\s,.()\-+]{3,})$/,
  ];

  for (const line of lines) {
    // Try each pattern
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const itemName = match[1].trim();
        // Get the first numeric value (most recent period)
        const valueStr = match[3] || match[2];
        const value = parseNumericValue(valueStr);
        
        // Accept any valid number, including zero and negative
        if (value !== null && !isNaN(value)) {
          const normalizedKey = normalizeKey(itemName);
          if (normalizedKey) {
            dataMap.set(normalizedKey, value);
            foundKeys.push(itemName);
          }
        }
        break;
      }
    }
  }

  console.log('Найдены следующие поля в документе:', foundKeys.slice(0, 20));

  // Map the parsed data to our FinancialData structure
  const financialData: FinancialData = {
    currentAssets: findValue(dataMap, foundKeys, [
      "ii оборотные активы",
      "оборотные активы",
      "оборотные активы всего",
      "итого по разделу ii",
      "current assets",
      "текущие активы",
    ]),
    cashAndEquivalents: findValue(dataMap, foundKeys, [
      "денежные средства и денежные эквиваленты",
      "денежные средства",
      "cash and equivalents",
      "cash",
      "деньги"
    ]),
    shortTermInvestments: findValue(dataMap, foundKeys, [
      "финансовые вложения исключая денежные эквиваленты",
      "краткосрочные финансовые вложения",
      "финансовые вложения",
      "краткосрочные инвестиции",
      "short term investments",
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
      "товарноматериальные запасы",
      "тмз"
    ]),
    totalAssets: findValue(dataMap, foundKeys, [
      "баланс",
      "активы баланс",
      "всего активов",
      "активы всего",
      "total assets",
      "активы",
      "итого активов"
    ]),
    currentLiabilities: findValue(dataMap, foundKeys, [
      "v краткосрочные обязательства",
      "краткосрочные обязательства",
      "итого по разделу v",
      "current liabilities",
      "текущие обязательства",
    ]),
    shortTermDebt: findValue(dataMap, foundKeys, [
      "заемные средства",
      "краткосрочные заемные средства",
      "краткосрочный долг",
      "short term debt",
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
      "iii капитал и резервы",
      "капитал и резервы",
      "итого по разделу iii",
      "собственный капитал",
      "equity",
      "капитал",
      "собственные средства"
    ]),
    longTermDebt: findValue(dataMap, foundKeys, [
      "iv долгосрочные обязательства",
      "долгосрочные обязательства",
      "итого по разделу iv",
      "долгосрочные заемные средства",
      "долгосрочный долг",
      "long term debt"
    ]),
    revenue: findValue(dataMap, foundKeys, [
      "выручка",
      "revenue",
      "доход",
      "выручка от продаж"
    ], true),
    netIncome: findValue(dataMap, foundKeys, [
      "чистая прибыль убыток",
      "чистая прибыль",
      "net income",
      "прибыль",
      "чп"
    ], true),
    operatingIncome: findValue(dataMap, foundKeys, [
      "прибыль убыток от продаж",
      "операционная прибыль",
      "operating income",
      "прибыль от продаж"
    ], true),
  };

  // Validate the parsed data using Zod schema
  const validatedData = financialDataSchema.parse(financialData);
  
  return validatedData;
}

/**
 * Find a value in the data map by checking multiple possible key names
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
      console.log(`Найдено точное совпадение: "${normalizedKey}"`);
      return dataMap.get(normalizedKey)!;
    }
  }
  
  // Then try partial matches
  for (const key of possibleKeys) {
    const normalizedSearchKey = normalizeKey(key);
    const words = normalizedSearchKey.split(' ').filter(w => w.length > 2);
    
    for (const [mapKey, value] of dataMap.entries()) {
      const allWordsPresent = words.every(word => mapKey.includes(word));
      
      if (allWordsPresent && words.length > 0) {
        console.log(`Найдено частичное совпадение: "${mapKey}" для поиска "${normalizedSearchKey}"`);
        return value;
      }
    }
  }
  
  if (optional) {
    return 0;
  }
  
  const errorMsg = `Не найдено обязательное поле: "${possibleKeys[0]}". 
Попробуйте использовать одно из этих названий: ${possibleKeys.slice(0, 3).join(', ')}.
Найденные поля в файле: ${foundKeys.slice(0, 15).join(', ')}${foundKeys.length > 15 ? '...' : ''}`;
  
  throw new Error(errorMsg);
}

/**
 * Parse a document file (DOCX or PDF) and extract financial data
 */
export async function parseDocumentFile(buffer: Buffer, mimeType: string): Promise<FinancialData> {
  try {
    let text: string;

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      console.log("Parsing DOCX file...");
      text = await extractTextFromDocx(buffer);
    } else if (mimeType === "application/pdf") {
      console.log("Parsing PDF file...");
      text = await extractTextFromPdf(buffer);
    } else {
      throw new Error("Unsupported document type");
    }

    console.log(`Extracted ${text.length} characters from document`);
    
    // Parse financial data from the extracted text
    const financialData = parseFinancialDataFromText(text);
    
    return financialData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Ошибка парсинга документа: ${error.message}`);
    }
    throw new Error("Не удалось прочитать документ. Проверьте формат данных.");
  }
}
