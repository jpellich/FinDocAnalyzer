import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FinancialData } from "@shared/schema";

interface DataPreviewProps {
  data: FinancialData;
}

export function DataPreview({ data }: DataPreviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Структурированное отображение бухгалтерского баланса
  const balanceSheet = [
    {
      section: "АКТИВ",
      items: [
        { 
          subsection: "I. Внеоборотные активы",
          value: data.totalAssets - data.currentAssets,
          indent: 0,
          bold: true
        },
        {
          subsection: "II. Оборотные активы",
          value: data.currentAssets,
          indent: 0,
          bold: true
        },
        { label: "Запасы", value: data.inventory, indent: 1 },
        { label: "Дебиторская задолженность", value: data.accountsReceivable, indent: 1 },
        { label: "Финансовые вложения (краткосрочные)", value: data.shortTermInvestments, indent: 1 },
        { label: "Денежные средства и эквиваленты", value: data.cashAndEquivalents, indent: 1 },
        { 
          label: "БАЛАНС (АКТИВ)", 
          value: data.totalAssets, 
          indent: 0, 
          bold: true, 
          highlight: true 
        },
      ]
    },
    {
      section: "ПАССИВ",
      items: [
        {
          subsection: "III. Капитал и резервы",
          value: data.equity,
          indent: 0,
          bold: true
        },
        {
          subsection: "IV. Долгосрочные обязательства",
          value: data.longTermDebt,
          indent: 0,
          bold: true
        },
        {
          subsection: "V. Краткосрочные обязательства",
          value: data.currentLiabilities,
          indent: 0,
          bold: true
        },
        { label: "Заемные средства", value: data.shortTermDebt, indent: 1 },
        { 
          label: "БАЛАНС (ПАССИВ)", 
          value: data.totalLiabilities + data.equity, 
          indent: 0, 
          bold: true, 
          highlight: true 
        },
      ]
    }
  ];

  // Отчёт о прибылях и убытках (если есть данные)
  const incomeStatement = [];
  if (data.revenue || data.netIncome || data.operatingIncome) {
    incomeStatement.push({
      section: "ОТЧЁТ О ПРИБЫЛЯХ И УБЫТКАХ",
      items: [
        data.revenue ? { label: "Выручка", value: data.revenue, indent: 0, bold: true } : null,
        data.operatingIncome ? { label: "Прибыль от продаж", value: data.operatingIncome, indent: 0 } : null,
        data.netIncome ? { label: "Чистая прибыль (убыток)", value: data.netIncome, indent: 0, bold: true, highlight: true } : null,
      ].filter(Boolean)
    });
  }

  const allSections = [...balanceSheet, ...incomeStatement];

  return (
    <Card data-testid="card-data-preview">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">
          Бухгалтерский баланс
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {allSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-1">
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 pb-2 border-b">
                  {section.section}
                </div>
                {section.items.map((item: any, itemIndex) => (
                  <div
                    key={itemIndex}
                    className={`flex justify-between items-center py-2.5 px-4 rounded-md transition-colors ${
                      item.highlight
                        ? "bg-primary/10 border border-primary/20"
                        : item.bold
                        ? "bg-muted/50"
                        : "hover-elevate"
                    }`}
                    style={{ paddingLeft: `${1 + item.indent * 1.5}rem` }}
                    data-testid={`row-data-${sectionIndex}-${itemIndex}`}
                  >
                    <span className={`${item.bold ? "font-semibold" : "text-sm"} ${item.subsection ? "text-sm" : ""}`}>
                      {item.label || item.subsection}
                    </span>
                    <span className={`font-mono ${item.bold ? "font-semibold" : ""}`}>
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
