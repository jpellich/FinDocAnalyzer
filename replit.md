# Financial Document Analysis Platform

## Overview
This project is a professional platform for intelligent financial document analysis using AI. It supports the upload of Excel (.xlsx, .xls), Word (.docx), and PDF files containing financial data. The platform automatically calculates key financial ratios and provides detailed analysis using OpenAI GPT-5, with a robust fallback to rule-based analysis. The business vision is to provide a comprehensive tool for financial professionals to quickly gain insights from various financial documents, enhancing decision-making and efficiency.

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
A universal document parser employs a dual parsing strategy:
-   Multi-line format: "Field → Code (4 digits) → Value" on separate lines.
-   Single-line format: "Field Code Value1 Value2" on one line.
The parser includes robust number handling for zeros, negative values (minus and parentheses), and various thousands/decimal separators.
Core financial calculations include liquidity ratios (current, quick, absolute) and financial stability indicators (autonomy, debt, financial leverage).
AI analysis is integrated with OpenAI GPT-5, featuring a graceful fallback to rule-based analysis if the API encounters issues. Data validation is performed using Zod schemas.

### Feature Specifications
-   **File Upload & Parsing**: Supports Excel, DOCX (via Mammoth), and PDF (via pdf-parse) with intelligent content extraction.
-   **Financial Data Display**: Comprehensive display of the balance sheet (ASSETS/LIABILITIES with sections I-V) and Profit & Loss statement.
-   **Ratio Calculation**: Automatic calculation and display of key financial ratios with color-coded status indicators (excellent/good/warning/critical).
-   **AI Analysis**: A dedicated section for AI-generated insights, including strengths, weaknesses, and recommendations.
-   **Data Visualization**: Interactive charts (bar, radar) using Recharts.
-   **Report Export**: Export of detailed financial reports to TXT format, including balance sheet, ratios, and AI analysis.
-   **User Interface**: Responsive design, professional financial styling, and dark/light theme support. Loading states include progress bars and stage indicators.

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
-   **pdf-parse**: Library for extracting text from PDF files.
-   **OpenAI SDK**: Integration with OpenAI GPT-5 for AI analysis.
-   **Zod**: Schema declaration and validation library.