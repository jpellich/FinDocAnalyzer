# Financial Document Analysis Platform

## Overview
This project is a professional platform for intelligent financial document analysis using AI. It supports the upload of Excel (.xlsx, .xls), Word (.docx), and PDF files containing financial data. The platform automatically calculates key financial ratios and provides comprehensive analysis using OpenAI GPT-5, with a robust fallback to rule-based analysis. 

**Key Value Proposition**: The platform delivers bank-level creditworthiness assessment, including borrower reliability evaluation, debt repayment capacity analysis, credit rating assignment (A+ to D), and industry-specific risk analysis based on OKVED 2 classification. This enables financial professionals, credit analysts, and investors to make informed decisions about lending, investment, and partnership opportunities.

## User Preferences
I prefer simple language and clear, concise explanations.
I want iterative development with frequent, small updates.
Please ask before making any major architectural changes or introducing new external dependencies.
I prefer detailed explanations for complex logic or decisions.
Ensure all new UI components support both dark and light themes.
All interactive elements should have `data-testid` attributes for easier testing.

## System Architecture

### UI/UX Decisions
The platform features a professional financial design with a consistent color palette:
-   **Primary**: Blue (#2563eb) for accents and graphs.
-   **Secondary**: Gray for secondary elements.
-   **Success**: Emerald for positive indicators.
-   **Warning**: Amber for warnings.
-   **Destructive**: Red for critical indicators.
Typography uses 'Inter' for text and UI, and 'JetBrains Mono' for financial figures. A consistent spacing system (2, 4, 6, 8, 12, 16, 20) is applied. The design is adaptive for all screen sizes and supports dark/light themes. Interactive elements utilize `hover-elevate` and `active-elevate-2` classes.

### Technical Implementations
The platform supports drag-and-drop file uploads for .xlsx, .xls, .docx, and .pdf files (up to 10 MB).
A universal document parser employs a dual parsing strategy with **multi-year data extraction**:
-   **Multi-line format**: "Field → Code (4 digits) → Value1 → Value2 → Value3" on separate lines (extracts up to 3 years of data).
-   **Single-line format**: "Field Code Value1 Value2 Value3" on one line (extracts up to 3 years of data).
-   **Multi-Year Support**: Parser automatically detects and extracts data for current year and up to 2 historical years from DOCX files.
-   **Data Storage**: yearlyData field stores historical year data as Maps (yearlyData[0] = year -1, yearlyData[1] = year -2).
The parser includes robust number handling for zeros, negative values (minus and parentheses), and various thousands/decimal separators.
Core financial calculations include liquidity ratios (current, quick, absolute) and financial stability indicators (autonomy, debt, financial leverage).
**Balance Sheet Validation**: The system enforces the fundamental accounting equation (ASSETS = LIABILITIES + EQUITY) by:
-   Using the correct formula for БАЛАНС (ПАССИВ): `equity + longTermDebt + currentLiabilities` (Sections III + IV + V)
-   Automatically recalculating totalLiabilities from component sections to ensure consistency
-   Validating that АКТИВ ≈ ПАССИВ within 1% tolerance before displaying results
-   Logging validation results to help identify data inconsistencies
AI analysis is integrated with OpenAI GPT-5, featuring a graceful fallback to rule-based analysis if the API encounters issues. Data validation is performed using Zod schemas.

### Feature Specifications
-   **File Upload & Parsing**: 
    -   Supports Excel (.xlsx, .xls), DOCX (via Mammoth), and PDF (via pdfjs-dist legacy build) with intelligent content extraction.
    -   Parser recognizes all standard balance sheet line items with codes (1110-1190 for Section I, etc.).
    -   **Company Information Extraction**: Automatically extracts OKVED 2 code and company name from document headers (searches first 30 lines for patterns like "ОКВЭД:", "Организация:", quoted text).
    -   **OCR Infrastructure**: tesseract.js installed for future OCR support. Currently provides helpful error messages for scanned PDFs, directing users to use Excel/Word formats.
-   **Financial Data Display**: 
    -   Comprehensive display of the balance sheet (ASSETS/LIABILITIES with sections I-V) and Profit & Loss statement.
    -   **Expandable/Collapsible Sections**: All balance sheet sections (I-V) are initially collapsed and can be clicked to reveal detailed line items with their corresponding codes.
    -   Section I (Внеоборотные активы) includes: Нематериальные активы (1110), Результаты исследований и разработок (1120), Нематериальные поисковые активы (1130), Материальные поисковые активы (1140), Основные средства (1150), Доходные вложения в материальные ценности (1160), Финансовые вложения (1170), Отложенные налоговые активы (1180), Прочие внеоборотные активы (1190).
    -   Sections III, IV, and V also show detailed breakdowns when expanded.
-   **Ratio Calculation**: Automatic calculation and display of key financial ratios with color-coded status indicators (excellent/good/warning/critical).
    -   **Visual Fraction Formulas**: Calculation formulas display with proper mathematical fractions (numerator over denominator) instead of slash division symbols.
-   **Profitability Metrics**:
    -   Six profitability ratios: ROA, ROE, ROS, Gross Profit Margin, Operating Profit Margin, Net Profit Margin.
    -   **Percentage Display**: All profitability values shown as percentages with two decimal places (e.g., "15.20%").
-   **Enhanced AI Analysis** (Bank-Level Credit Assessment):
    -   **Creditworthiness Analysis**:
        -   Borrower Reliability: Detailed evaluation of financial stability, solvency, and payment history with specific metrics
        -   Debt Repayment Capacity: Analysis of cash flows, liquidity, obligation coverage with estimated repayment timeline
        -   Credit Rating: A+ (excellent) to D (high risk) rating with justification based on key factors
    -   **Industry Analysis by OKVED 2**:
        -   Sector Description: Industry characteristics and current market conditions
        -   Industry-Specific Risks: 4-6 risks affecting debt repayment (macroeconomic, competition, regulatory, seasonality, technology)
        -   Competitive Position: Company's position within industry based on financial metrics
    -   **General Analysis**: Summary, strengths, weaknesses, recommendations, overall risk level
    -   **Fallback Analysis**: Rule-based creditworthiness and industry assessment when OpenAI API unavailable
-   **Data Visualization**: 
    -   Interactive charts (bar, radar) using Recharts.
    -   **Multi-Year Grouped Bar Charts**: When 2+ years of data available, charts display grouped bars showing trends across periods (2023, 2024, 2025).
    -   **Dynamic Bar Rendering**: Charts dynamically render bars based on available periods (2 or 3 years) with proper legends and colors.
    -   **Profitability Chart**: Dedicated bar chart for profitability ratios (conditionally displayed when income data exists).
-   **Report Export**: Export of detailed financial reports to TXT format, including balance sheet, ratios, profitability metrics, creditworthiness assessment, and industry analysis.
-   **User Interface**: 
    -   Responsive design with professional financial styling and dark/light theme support.
    -   **New Sections**: Purple-themed creditworthiness card, indigo-themed industry analysis card with defensive rendering for optional fields.
    -   Loading states with generic "Parsing document" text (supports multi-format uploads).
    -   Progress bars and stage indicators during processing.

### System Design Choices
-   **Frontend Framework**: React 18 with TypeScript, Vite for bundling, Tailwind CSS for styling, and shadcn/ui for UI components. Recharts is used for data visualization.
-   **Backend Framework**: Express.js handles API routes for analysis, report generation, and health checks.
-   **Data Storage**: In-memory storage (`MemStorage`) is used for temporary data handling.
-   **API Endpoints**:
    -   `POST /api/analyze`: Upload and analyze financial files.
    -   `POST /api/download-report`: Generate and download TXT financial reports.
    -   `GET /api/health`: Server health check.

## External Dependencies

### Frontend
-   **React 18**: UI library.
-   **TypeScript**: Type safety.
-   **Vite**: Build tool and dev server.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **shadcn/ui**: Component library.
-   **Recharts**: Data visualization library.
-   **React Query**: Data fetching and state management.
-   **Wouter**: Client-side routing.
-   **Lucide React**: Icon library.

### Backend
-   **Express.js**: Web server framework.
-   **Multer**: Middleware for handling `multipart/form-data` (file uploads).
-   **XLSX**: Library for parsing Excel files.
-   **Mammoth**: Library for extracting text from DOCX files.
-   **pdfjs-dist**: Library for extracting text from PDF files (using legacy build for Node.js compatibility).
-   **tesseract.js**: OCR library for future scanned PDF support (infrastructure in place).
-   **OpenAI SDK**: Integration with OpenAI GPT-5 for bank-level creditworthiness analysis.
-   **Zod**: Schema declaration and validation library.