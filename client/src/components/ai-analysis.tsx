import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, AlertCircle, Lightbulb, ShieldAlert, Building2, FileText, XCircle, AlertTriangle } from "lucide-react";
import type { BankCreditReport } from "@shared/schema";

interface AIAnalysisProps {
  analysis: BankCreditReport;
}

export function AIAnalysis({ analysis }: AIAnalysisProps) {
  const getRiskColor = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "high":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    }
  };

  const getRiskLabel = (level: "low" | "medium" | "high") => {
    switch (level) {
      case "low":
        return "Низкий риск";
      case "medium":
        return "Средний риск";
      case "high":
        return "Высокий риск";
    }
  };

  const getCreditDecisionData = (decision: string) => {
    const isApproved = decision.toLowerCase().includes("одобр") && !decision.toLowerCase().includes("откл");
    const isDeclined = decision.toLowerCase().includes("откл");
    
    if (isApproved) {
      return { Icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" };
    } else if (isDeclined) {
      return { Icon: XCircle, color: "text-red-600 dark:text-red-400" };
    } else {
      return { Icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400" };
    }
  };

  return (
    <Card className="border-2" data-testid="card-ai-analysis">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Кредитный отчет
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          className={getRiskColor(analysis.riskLevel)}
          data-testid="badge-risk-level"
        >
          <ShieldAlert className="h-3 w-3 mr-1" />
          {getRiskLabel(analysis.riskLevel)}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* 1. Industry Sector Analysis */}
        <div className="space-y-4 p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold">1. Состояние отрасли</h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <p className="leading-relaxed">{analysis.industrySector.description}</p>
            {analysis.industrySector.marketConditions && (
              <p className="leading-relaxed text-muted-foreground">
                {analysis.industrySector.marketConditions}
              </p>
            )}
          </div>
        </div>

        {/* 2. Financial Condition */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">2. Финансовое состояние предприятия</h3>
          </div>

          {/* Liquidity */}
          <div className="space-y-3 p-4 rounded-md bg-card border">
            <h4 className="font-semibold text-base">Ликвидность</h4>
            <p className="text-sm leading-relaxed">{analysis.financialCondition.liquidity.analysis}</p>
            <div className="pt-2 border-t">
              <p className="text-sm font-medium italic text-muted-foreground">
                Вывод: {analysis.financialCondition.liquidity.conclusion}
              </p>
            </div>
          </div>

          {/* Stability */}
          <div className="space-y-3 p-4 rounded-md bg-card border">
            <h4 className="font-semibold text-base">Финансовая устойчивость</h4>
            <p className="text-sm leading-relaxed">{analysis.financialCondition.stability.analysis}</p>
            <div className="pt-2 border-t">
              <p className="text-sm font-medium italic text-muted-foreground">
                Вывод: {analysis.financialCondition.stability.conclusion}
              </p>
            </div>
          </div>

          {/* Profitability */}
          <div className="space-y-3 p-4 rounded-md bg-card border">
            <h4 className="font-semibold text-base">Рентабельность</h4>
            <p className="text-sm leading-relaxed">{analysis.financialCondition.profitability.analysis}</p>
            <div className="pt-2 border-t">
              <p className="text-sm font-medium italic text-muted-foreground">
                Вывод: {analysis.financialCondition.profitability.conclusion}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Strengths */}
        {analysis.strengths.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-semibold">3. Сильные стороны</h3>
            </div>
            <ul className="space-y-2" data-testid="list-strengths">
              {analysis.strengths.map((strength, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-md bg-emerald-500/5 border border-emerald-500/10"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Weaknesses */}
        {analysis.weaknesses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-semibold">4. Слабые стороны</h3>
            </div>
            <ul className="space-y-2" data-testid="list-weaknesses">
              {analysis.weaknesses.map((weakness, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-md bg-amber-500/5 border border-amber-500/10"
                >
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{weakness}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. Recommendations & Credit Decision */}
        <div className="space-y-4 p-5 rounded-lg bg-blue-500/5 border-2 border-blue-500/20">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold">5. Рекомендации и заключение</h3>
          </div>
          
          {/* Recommendations */}
          {analysis.recommendations.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Рекомендации:
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations.items.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Credit Decision */}
          <div className="pt-4 mt-4 border-t border-blue-500/20 space-y-3">
            <div className="flex items-center gap-3">
              {(() => {
                const { Icon, color } = getCreditDecisionData(analysis.recommendations.creditDecision);
                return <Icon className={`h-6 w-6 ${color} flex-shrink-0`} />;
              })()}
              <div className="space-y-1">
                <h4 className="font-semibold text-base">Кредитное решение</h4>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {analysis.recommendations.creditDecision}
                </p>
              </div>
            </div>
            
            {analysis.recommendations.comment && (
              <div className="pt-2">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold">Комментарий: </span>
                  {analysis.recommendations.comment}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
