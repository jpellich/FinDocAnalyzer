import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { FinancialData } from "@shared/schema";

interface DataPreviewProps {
  data: FinancialData;
}

export function DataPreview({ data }: DataPreviewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Структурированное отображение бухгалтерского баланса с раскрывающимися разделами
  const balanceSheet = [
    {
      section: "АКТИВ",
      items: [
        { 
          subsection: "I. Внеоборотные активы",
          value: data.totalAssets - data.currentAssets,
          indent: 0,
          bold: true,
          expandable: true,
          key: "nonCurrentAssets",
          details: [
            data.intangibleAssets !== undefined && data.intangibleAssets !== 0 
              ? { label: "Нематериальные активы (1110)", value: data.intangibleAssets, indent: 1 } : null,
            data.rdResults !== undefined && data.rdResults !== 0
              ? { label: "Результаты исследований и разработок (1120)", value: data.rdResults, indent: 1 } : null,
            data.intangibleExplorationAssets !== undefined && data.intangibleExplorationAssets !== 0
              ? { label: "Нематериальные поисковые активы (1130)", value: data.intangibleExplorationAssets, indent: 1 } : null,
            data.tangibleExplorationAssets !== undefined && data.tangibleExplorationAssets !== 0
              ? { label: "Материальные поисковые активы (1140)", value: data.tangibleExplorationAssets, indent: 1 } : null,
            data.fixedAssets !== undefined && data.fixedAssets !== 0
              ? { label: "Основные средства (1150)", value: data.fixedAssets, indent: 1 } : null,
            data.profitableInvestmentsInTangibleAssets !== undefined && data.profitableInvestmentsInTangibleAssets !== 0
              ? { label: "Доходные вложения в материальные ценности (1160)", value: data.profitableInvestmentsInTangibleAssets, indent: 1 } : null,
            data.financialInvestments !== undefined && data.financialInvestments !== 0
              ? { label: "Финансовые вложения (1170)", value: data.financialInvestments, indent: 1 } : null,
            data.deferredTaxAssets !== undefined && data.deferredTaxAssets !== 0
              ? { label: "Отложенные налоговые активы (1180)", value: data.deferredTaxAssets, indent: 1 } : null,
            data.otherNonCurrentAssets !== undefined && data.otherNonCurrentAssets !== 0
              ? { label: "Прочие внеоборотные активы (1190)", value: data.otherNonCurrentAssets, indent: 1 } : null,
          ].filter(Boolean)
        },
        {
          subsection: "II. Оборотные активы",
          value: data.currentAssets,
          indent: 0,
          bold: true,
          expandable: true,
          key: "currentAssets",
          details: [
            { label: "Запасы", value: data.inventory, indent: 1 },
            { label: "Дебиторская задолженность", value: data.accountsReceivable, indent: 1 },
            { label: "Финансовые вложения (краткосрочные)", value: data.shortTermInvestments, indent: 1 },
            { label: "Денежные средства и эквиваленты", value: data.cashAndEquivalents, indent: 1 },
            data.otherCurrentAssets !== undefined && data.otherCurrentAssets !== 0
              ? { label: "Прочие оборотные активы", value: data.otherCurrentAssets, indent: 1 } : null,
          ].filter(Boolean)
        },
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
          bold: true,
          expandable: true,
          key: "equity",
          details: [
            data.authorizedCapital !== undefined && data.authorizedCapital !== 0
              ? { label: "Уставный капитал", value: data.authorizedCapital, indent: 1 } : null,
            data.additionalCapital !== undefined && data.additionalCapital !== 0
              ? { label: "Добавочный капитал", value: data.additionalCapital, indent: 1 } : null,
            data.revaluationReserve !== undefined && data.revaluationReserve !== 0
              ? { label: "Резервный капитал", value: data.revaluationReserve, indent: 1 } : null,
            data.retainedEarnings !== undefined && data.retainedEarnings !== 0
              ? { label: "Нераспределенная прибыль (непокрытый убыток)", value: data.retainedEarnings, indent: 1 } : null,
          ].filter(Boolean)
        },
        {
          subsection: "IV. Долгосрочные обязательства",
          value: data.longTermDebt,
          indent: 0,
          bold: true,
          expandable: true,
          key: "longTermLiabilities",
          details: [
            data.borrowedFundsLongTerm !== undefined && data.borrowedFundsLongTerm !== 0
              ? { label: "Заемные средства (1410)", value: data.borrowedFundsLongTerm, indent: 1 } : null,
            data.deferredTaxLiabilities !== undefined && data.deferredTaxLiabilities !== 0
              ? { label: "Отложенные налоговые обязательства (1420)", value: data.deferredTaxLiabilities, indent: 1 } : null,
            data.estimatedLiabilities !== undefined && data.estimatedLiabilities !== 0
              ? { label: "Оценочные обязательства (1430)", value: data.estimatedLiabilities, indent: 1 } : null,
            data.otherLongTermLiabilities !== undefined && data.otherLongTermLiabilities !== 0
              ? { label: "Прочие долгосрочные обязательства (1450)", value: data.otherLongTermLiabilities, indent: 1 } : null,
            // If no detailed breakdown exists, show longTermDebt as a single item
            (!data.borrowedFundsLongTerm || data.borrowedFundsLongTerm === 0) &&
            (!data.deferredTaxLiabilities || data.deferredTaxLiabilities === 0) &&
            (!data.estimatedLiabilities || data.estimatedLiabilities === 0) &&
            (!data.otherLongTermLiabilities || data.otherLongTermLiabilities === 0)
              ? { label: "Заемные средства", value: data.longTermDebt, indent: 1 } : null,
          ].filter(Boolean)
        },
        {
          subsection: "V. Краткосрочные обязательства",
          value: data.currentLiabilities,
          indent: 0,
          bold: true,
          expandable: true,
          key: "currentLiabilities",
          details: [
            { label: "Заемные средства", value: data.shortTermDebt, indent: 1 },
            data.accountsPayable !== undefined && data.accountsPayable !== 0
              ? { label: "Кредиторская задолженность", value: data.accountsPayable, indent: 1 } : null,
            data.deferredIncome !== undefined && data.deferredIncome !== 0
              ? { label: "Доходы будущих периодов", value: data.deferredIncome, indent: 1 } : null,
            data.estimatedLiabilitiesShortTerm !== undefined && data.estimatedLiabilitiesShortTerm !== 0
              ? { label: "Оценочные обязательства", value: data.estimatedLiabilitiesShortTerm, indent: 1 } : null,
            data.otherCurrentLiabilities !== undefined && data.otherCurrentLiabilities !== 0
              ? { label: "Прочие краткосрочные обязательства", value: data.otherCurrentLiabilities, indent: 1 } : null,
          ].filter(Boolean)
        },
        { 
          label: "БАЛАНС (ПАССИВ)", 
          value: data.equity + data.longTermDebt + data.currentLiabilities, 
          indent: 0, 
          bold: true, 
          highlight: true 
        },
      ]
    }
  ];

  // Отчёт о прибылях и убытках (если есть данные)
  const incomeStatement = [];
  if (data.revenue || data.netIncome || data.operatingIncome || data.grossProfit) {
    incomeStatement.push({
      section: "ОТЧЁТ О ФИНАНСОВЫХ РЕЗУЛЬТАТАХ",
      items: [
        data.revenue ? { label: "Выручка", value: data.revenue, indent: 0, bold: true } : null,
        data.grossProfit ? { label: "Валовая прибыль (убыток)", value: data.grossProfit, indent: 0 } : null,
        data.operatingIncome ? { label: "Прибыль (убыток) от продаж", value: data.operatingIncome, indent: 0 } : null,
        data.profitBeforeTax ? { label: "Прибыль (убыток) до налогообложения", value: data.profitBeforeTax, indent: 0 } : null,
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
                {section.items.map((item: any, itemIndex) => {
                  const isExpanded = item.key && expandedSections.has(item.key);
                  const hasDetails = item.details && item.details.length > 0;
                  
                  return (
                    <div key={itemIndex}>
                      <div
                        className={`flex justify-between items-center py-2.5 px-4 rounded-md transition-colors ${
                          item.highlight
                            ? "bg-primary/10 border border-primary/20"
                            : item.bold
                            ? "bg-muted/50"
                            : "hover-elevate"
                        } ${item.expandable && hasDetails ? "cursor-pointer" : ""}`}
                        style={{ paddingLeft: `${1 + item.indent * 1.5}rem` }}
                        data-testid={`row-data-${sectionIndex}-${itemIndex}`}
                        onClick={() => item.expandable && hasDetails && toggleSection(item.key)}
                      >
                        <div className="flex items-center gap-2">
                          {item.expandable && hasDetails && (
                            <div className="text-muted-foreground">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" data-testid={`icon-chevron-down-${item.key}`} />
                              ) : (
                                <ChevronRight className="h-4 w-4" data-testid={`icon-chevron-right-${item.key}`} />
                              )}
                            </div>
                          )}
                          <span className={`${item.bold ? "font-semibold" : "text-sm"} ${item.subsection ? "text-sm" : ""}`}>
                            {item.label || item.subsection}
                          </span>
                        </div>
                        <span className={`font-mono ${item.bold ? "font-semibold" : ""}`}>
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                      
                      {/* Раскрываемые детали */}
                      {item.expandable && hasDetails && isExpanded && (
                        <div className="ml-4 mt-1 space-y-1" data-testid={`details-${item.key}`}>
                          {item.details.map((detail: any, detailIndex: number) => (
                            <div
                              key={detailIndex}
                              className="flex justify-between items-center py-2 px-4 rounded-md hover-elevate"
                              style={{ paddingLeft: `${1 + detail.indent * 1.5}rem` }}
                              data-testid={`detail-${item.key}-${detailIndex}`}
                            >
                              <span className="text-sm text-muted-foreground">
                                {detail.label}
                              </span>
                              <span className="font-mono text-sm">
                                {formatCurrency(detail.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
