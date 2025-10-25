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

  const rows = [
    { label: "Оборотные активы", value: data.currentAssets, category: "assets" },
    { label: "Денежные средства и эквиваленты", value: data.cashAndEquivalents, category: "assets" },
    { label: "Краткосрочные инвестиции", value: data.shortTermInvestments, category: "assets" },
    { label: "Дебиторская задолженность", value: data.accountsReceivable, category: "assets" },
    { label: "Запасы", value: data.inventory, category: "assets" },
    { label: "Всего активов", value: data.totalAssets, category: "assets", highlight: true },
    { label: "Краткосрочные обязательства", value: data.currentLiabilities, category: "liabilities" },
    { label: "Краткосрочный долг", value: data.shortTermDebt, category: "liabilities" },
    { label: "Всего обязательств", value: data.totalLiabilities, category: "liabilities", highlight: true },
    { label: "Собственный капитал", value: data.equity, category: "equity", highlight: true },
    { label: "Долгосрочный долг", value: data.longTermDebt, category: "liabilities" },
  ];

  if (data.revenue) {
    rows.push({ label: "Выручка", value: data.revenue, category: "income" });
  }
  if (data.netIncome) {
    rows.push({ label: "Чистая прибыль", value: data.netIncome, category: "income" });
  }

  return (
    <Card data-testid="card-data-preview">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">
          Загруженные данные
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-1">
            {rows.map((row, index) => (
              <div
                key={index}
                className={`flex justify-between items-center py-3 px-4 rounded-md transition-colors ${
                  row.highlight
                    ? "bg-muted font-semibold"
                    : "hover-elevate"
                }`}
                data-testid={`row-data-${index}`}
              >
                <span className={row.highlight ? "font-semibold" : "text-sm"}>
                  {row.label}
                </span>
                <span className="font-mono">
                  {formatCurrency(row.value)}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
