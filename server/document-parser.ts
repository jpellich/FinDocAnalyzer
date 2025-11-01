import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import Tesseract from "tesseract.js";
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
 * Extract text from a PDF page using OCR (Tesseract)
 */
async function extractTextFromPdfPageWithOCR(
  page: any,
  pageNum: number
): Promise<string> {
  try {
    console.log(`Using OCR for page ${pageNum}...`);
    
    // Render page to canvas
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
    
    // Create canvas - note: in Node.js we need to handle this differently
    // We'll render to an image buffer that Tesseract can process
    const canvas = {
      width: viewport.width,
      height: viewport.height,
      getContext: () => ({
        fillStyle: '',
        fillRect: () => {},
        save: () => {},
        restore: () => {},
        transform: () => {},
        setTransform: () => {},
        drawImage: () => {},
        getImageData: (x: number, y: number, w: number, h: number) => ({
          data: new Uint8ClampedArray(w * h * 4),
          width: w,
          height: h
        })
      })
    };
    
    const renderContext = {
      canvasContext: canvas.getContext(),
      viewport: viewport,
    };
    
    await page.render(renderContext).promise;
    
    // For now, we'll skip OCR on scanned PDFs and return empty
    // Full OCR implementation would require canvas library (node-canvas)
    console.log(`OCR skipped for page ${pageNum} - requires additional setup`);
    return '';
  } catch (error) {
    console.error(`OCR failed for page ${pageNum}:`, error);
    return '';
  }
}

/**
 * Extract text from PDF file using pdfjs-dist
 * Groups text items by their Y-coordinate to preserve line structure
 * Falls back to OCR for scanned PDFs
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Convert Buffer to Uint8Array
    const data = new Uint8Array(buffer);
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    console.log(`PDF has ${pdf.numPages} pages`);
    
    // Extract text from all pages
    const allPages: string[] = [];
    let totalTextItems = 0;
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      totalTextItems += textContent.items.length;
      
      // If no text items, this might be a scanned PDF - try OCR
      if (textContent.items.length === 0) {
        const ocrText = await extractTextFromPdfPageWithOCR(page, pageNum);
        if (ocrText) {
          allPages.push(ocrText);
        }
        continue;
      }
      
      // Group text items by their Y-coordinate (same line)
      const lineMap = new Map<number, string[]>();
      
      for (const item of textContent.items) {
        if (!('str' in item)) continue;
        
        const textItem = item as any;
        const y = Math.round(textItem.transform[5]); // Y coordinate
        const text = textItem.str.trim();
        
        if (!text) continue;
        
        if (!lineMap.has(y)) {
          lineMap.set(y, []);
        }
        lineMap.get(y)!.push(text);
      }
      
      // Sort lines by Y-coordinate (top to bottom) and join
      const sortedLines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0]) // PDF Y-axis goes bottom-to-top, so reverse
        .map(([_, texts]) => texts.join(' '))
        .filter(line => line.trim());
      
      allPages.push(sortedLines.join('\n'));
    }
    
    console.log(`Extracted text from ${totalTextItems} text items across ${pdf.numPages} pages`);
    
    const finalText = allPages.join('\n\n');
    
    // If PDF appears to be scanned (very little text), show helpful message
    if (totalTextItems === 0) {
      throw new Error(
        'Загруженный PDF-файл является отсканированным документом (содержит только изображения без текстового слоя).\n\n' +
        'Автоматическое распознавание текста (OCR) на данный момент недоступно из-за технических ограничений платформы.\n\n' +
        'РЕШЕНИЕ: Загрузите документ в одном из поддерживаемых форматов:\n' +
        '  • Excel (.xlsx или .xls) — рекомендуется для лучших результатов\n' +
        '  • Word (.docx) — с текстовым содержимым\n\n' +
        'Если у вас есть только сканированный PDF, запросите оригинальный файл в формате Excel у бухгалтерии или финансового отдела.'
      );
    }
    
    return finalText;
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
 * Supports two document layouts:
 * 1. Multi-line: Field name → Code (4 digits) → Value (on separate lines)
 * 2. Single-line: Field name Code Value1 Value2 ... (all on one line)
 */
function parseFinancialDataFromText(text: string): FinancialData {
  const lines = text.split('\n').map(line => line.trim());
  const nonEmptyLines: string[] = [];
  
  // Filter out empty lines while preserving order
  for (const line of lines) {
    if (line) {
      nonEmptyLines.push(line);
    }
  }
  
  // Extract OKVED code and company name from document header (first 30 lines)
  let okved: string | undefined;
  let companyName: string | undefined;
  
  const headerLines = nonEmptyLines.slice(0, 30);
  for (const line of headerLines) {
    // Search for OKVED code: "08.1", "46.51", etc.
    // Pattern matches: "ОКВЭД 2: 08.1" or "Код по ОКВЭД: 46.51"
    // The code itself is digits with optional dots/periods
    if (!okved) {
      // First try to match pattern with colon separator
      const okvedMatch = line.match(/оквэд\s*\d*[:\s]+([0-9][0-9.]*)/i);
      if (okvedMatch) {
        okved = okvedMatch[1].trim();
        console.log(`Found OKVED: ${okved}`);
      }
    }
    
    // Search for company name: "Организация:", "Наименование:", lines with quotes, etc.
    if (!companyName) {
      const companyMatch = line.match(/(?:организация|наименование|компания|предприятие)[:\s]+(.+)/i);
      if (companyMatch) {
        companyName = companyMatch[1].trim().replace(/[\"«»]/g, '');
        console.log(`Found company name: ${companyName}`);
      } else if (line.includes('"') || line.includes('«')) {
        // Try to extract quoted text as company name
        const quotedMatch = line.match(/[\"«]([^\"»]+)[\"»]/);
        if (quotedMatch && quotedMatch[1].length > 3 && quotedMatch[1].length < 100) {
          companyName = quotedMatch[1].trim();
          console.log(`Found company name from quotes: ${companyName}`);
        }
      }
    }
    
    // Stop early if both found
    if (okved && companyName) break;
  }
  
  // Create a map to store found values
  const dataMap = new Map<string, number>();
  const foundKeys: string[] = [];

  // Pattern to detect 4-digit codes (used to identify multi-line structure)
  const codePattern = /^\d{4}$/;
  
  // Single-line patterns for when data is all on one line
  const singleLinePatterns = [
    // Pattern: "Item name" Code Value1 Value2 Value3 (with potential parentheses and separators)
    /^(.+?)\s+(\d{4})\s+([\d\s,.()\-+]+?)(?:\s+([\d\s,.()\-+]+?))?(?:\s+([\d\s,.()\-+]+?))?$/,
    // Pattern: "Item name" Value (with potential parentheses and separators)
    /^(.+?)\s+([\d\s,.()\-+]{3,})$/,
  ];
  
  // Strategy 1: Try multi-line parsing (Field → Code → Value on separate lines)
  for (let i = 0; i < nonEmptyLines.length; i++) {
    const currentLine = nonEmptyLines[i];
    const normalizedCurrent = normalizeKey(currentLine);
    
    // Skip if this looks like a code line itself
    if (codePattern.test(currentLine)) {
      continue;
    }
    
    // Check if next line is a code (4 digits)
    if (i + 2 < nonEmptyLines.length && codePattern.test(nonEmptyLines[i + 1])) {
      // Next line is code, so line after that should be the value
      const valueStr = nonEmptyLines[i + 2];
      const value = parseNumericValue(valueStr);
      
      // Accept any valid number, including zero and negative
      if (value !== null && !isNaN(value)) {
        if (normalizedCurrent) {
          dataMap.set(normalizedCurrent, value);
          foundKeys.push(currentLine);
        }
      }
    }
  }
  
  // Strategy 2: Fall back to single-line parsing if multi-line found nothing
  if (foundKeys.length === 0) {
    console.log('Multi-line parsing found no fields, falling back to single-line parsing');
    
    for (const line of nonEmptyLines) {
      // Try each single-line pattern
      for (const pattern of singleLinePatterns) {
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
  }
  
  // Strategy 3: Parse by standard balance sheet codes (fallback for broken text)
  // Map of standard Russian balance sheet codes to field names
  const codeToFieldMap = new Map<string, string>([
    ['1250', 'денежные средства и денежные эквиваленты'],
    ['1240', 'финансовые вложения исключая денежные эквиваленты'],
    ['1230', 'финансовые вложения'],
    ['1220', 'налог на добавленную стоимость'],
    ['1210', 'запасы'],
    ['1260', 'прочие оборотные активы'],
    ['1200', 'итого по разделу ii'],
    ['1100', 'итого по разделу i'],
    ['1110', 'нематериальные активы'],
    ['1120', 'результаты исследований и разработок'],
    ['1130', 'нематериальные поисковые активы'],
    ['1140', 'материальные поисковые активы'],
    ['1150', 'основные средства'],
    ['1160', 'доходные вложения в материальные ценности'],
    ['1170', 'финансовые вложения'],
    ['1180', 'отложенные налоговые активы'],
    ['1190', 'прочие внеоборотные активы'],
    ['1300', 'итого по разделу iii'],
    ['1310', 'уставный капитал'],
    ['1360', 'резервный капитал'],
    ['1370', 'нераспределенная прибыль'],
    ['1400', 'итого по разделу iv'],
    ['1410', 'заемные средства'],
    ['1420', 'отложенные налоговые обязательства'],
    ['1500', 'итого по разделу v'],
    ['1510', 'заемные средства'],
    ['1520', 'кредиторская задолженность'],
    ['1600', 'баланс'],
    ['1700', 'баланс'],
  ]);
  
  for (let i = 0; i < nonEmptyLines.length; i++) {
    const line = nonEmptyLines[i];
    // Check if this line is a 4-digit code
    if (codePattern.test(line)) {
      const code = line;
      const fieldName = codeToFieldMap.get(code);
      
      if (fieldName && i + 1 < nonEmptyLines.length) {
        // Next line should be the value
        const valueStr = nonEmptyLines[i + 1];
        const value = parseNumericValue(valueStr);
        
        console.log(`Strategy 3: Found code ${code} for "${fieldName}", next line: "${valueStr}", parsed value: ${value}`);
        
        if (value !== null && !isNaN(value)) {
          const normalizedKey = normalizeKey(fieldName);
          if (normalizedKey && !dataMap.has(normalizedKey)) {
            dataMap.set(normalizedKey, value);
            foundKeys.push(`${fieldName} (код ${code})`);
            console.log(`Strategy 3: Added ${fieldName} = ${value}`);
          } else if (normalizedKey && dataMap.has(normalizedKey)) {
            console.log(`Strategy 3: Skipped ${fieldName} (already exists with value ${dataMap.get(normalizedKey)})`);
          }
        }
      }
    }
  }

  console.log(`Найдены следующие поля в документе (${foundKeys.length} полей):`, foundKeys.slice(0, 30));

  // Map the parsed data to our FinancialData structure
  const financialData: FinancialData = {
    // Company information
    okved,
    companyName,
    
    currentAssets: findValue(dataMap, foundKeys, [
      "итого по разделу ii",
      "ii оборотные активы",
      "оборотные активы",
      "оборотные активы всего",
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
      "итого по разделу v",
      "v краткосрочные обязательства",
      "краткосрочные обязательства",
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
      "итого по разделу iii",
      "iii капитал и резервы",
      "капитал и резервы",
      "собственный капитал",
      "equity",
      "капитал",
      "собственные средства"
    ]),
    longTermDebt: findValue(dataMap, foundKeys, [
      "итого по разделу iv",
      "iv долгосрочные обязательства",
      "долгосрочные обязательства",
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
    grossProfit: findValue(dataMap, foundKeys, [
      "валовая прибыль убыток",
      "валовая прибыль",
      "gross profit"
    ], true),
    // Section I - Non-current assets details
    intangibleAssets: findValue(dataMap, foundKeys, [
      "нематериальные активы",
      "intangible assets",
      "нма"
    ], true),
    rdResults: findValue(dataMap, foundKeys, [
      "результаты исследований и разработок",
      "research and development results",
      "ниокр"
    ], true),
    intangibleExplorationAssets: findValue(dataMap, foundKeys, [
      "нематериальные поисковые активы",
      "intangible exploration assets"
    ], true),
    tangibleExplorationAssets: findValue(dataMap, foundKeys, [
      "материальные поисковые активы",
      "tangible exploration assets"
    ], true),
    fixedAssets: findValue(dataMap, foundKeys, [
      "основные средства",
      "fixed assets",
      "ос"
    ], true),
    profitableInvestmentsInTangibleAssets: findValue(dataMap, foundKeys, [
      "доходные вложения в материальные ценности",
      "profitable investments in tangible assets"
    ], true),
    financialInvestments: findValue(dataMap, foundKeys, [
      "финансовые вложения",
      "financial investments",
      "долгосрочные финансовые вложения"
    ], true),
    deferredTaxAssets: findValue(dataMap, foundKeys, [
      "отложенные налоговые активы",
      "deferred tax assets",
      "она"
    ], true),
    otherNonCurrentAssets: findValue(dataMap, foundKeys, [
      "прочие внеоборотные активы",
      "other non current assets"
    ], true),
    // Section II - Current assets details
    otherCurrentAssets: findValue(dataMap, foundKeys, [
      "прочие оборотные активы",
      "other current assets"
    ], true),
    // Section III - Capital and reserves details
    authorizedCapital: findValue(dataMap, foundKeys, [
      "уставный капитал складочный капитал уставный фонд вклады товарищей",
      "уставный капитал",
      "authorized capital"
    ], true),
    retainedEarnings: findValue(dataMap, foundKeys, [
      "нераспределенная прибыль непокрытый убыток",
      "нераспределенная прибыль",
      "retained earnings"
    ], true),
    revaluationReserve: findValue(dataMap, foundKeys, [
      "переоценка внеоборотных активов",
      "revaluation reserve"
    ], true),
    additionalCapital: findValue(dataMap, foundKeys, [
      "добавочный капитал без переоценки",
      "добавочный капитал",
      "additional capital"
    ], true),
    // Section IV - Long-term liabilities details
    borrowedFundsLongTerm: findValue(dataMap, foundKeys, [
      "заемные средства долгосрочные",
      "long term borrowed funds"
    ], true),
    deferredTaxLiabilities: findValue(dataMap, foundKeys, [
      "отложенные налоговые обязательства",
      "deferred tax liabilities",
      "оно"
    ], true),
    estimatedLiabilities: findValue(dataMap, foundKeys, [
      "оценочные обязательства",
      "estimated liabilities"
    ], true),
    otherLongTermLiabilities: findValue(dataMap, foundKeys, [
      "прочие долгосрочные обязательства",
      "прочие обязательства",
      "other long term liabilities"
    ], true),
    // Section V - Current liabilities details
    accountsPayable: findValue(dataMap, foundKeys, [
      "кредиторская задолженность",
      "accounts payable",
      "кредиторы"
    ], true),
    deferredIncome: findValue(dataMap, foundKeys, [
      "доходы будущих периодов",
      "deferred income"
    ], true),
    estimatedLiabilitiesShortTerm: findValue(dataMap, foundKeys, [
      "оценочные обязательства краткосрочные",
      "short term estimated liabilities"
    ], true),
    otherCurrentLiabilities: findValue(dataMap, foundKeys, [
      "прочие краткосрочные обязательства",
      "other current liabilities"
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
