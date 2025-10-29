import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, AlertCircle, Lightbulb, ShieldAlert, TrendingUp, Building2 } from "lucide-react";
import type { FinancialAnalysisResult } from "@shared/schema";

interface AIAnalysisProps {
  analysis: FinancialAnalysisResult["aiAnalysis"];
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

  return (
    <Card className="border-2" data-testid="card-ai-analysis">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Интеллектуальный анализ AI
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
        {/* Summary */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Общая оценка</h3>
          <p className="text-base leading-relaxed" data-testid="text-summary">
            {analysis.summary}
          </p>
        </div>

        {/* Strengths */}
        {analysis.strengths.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-semibold">Сильные стороны</h3>
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

        {/* Weaknesses */}
        {analysis.weaknesses.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-semibold">Области для улучшения</h3>
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

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold">Рекомендации</h3>
            </div>
            <ol className="space-y-2" data-testid="list-recommendations">
              {analysis.recommendations.map((recommendation, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-md bg-blue-500/5 border border-blue-500/10"
                >
                  <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 dark:bg-blue-400 text-white dark:text-blue-900 text-xs font-semibold flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Creditworthiness Analysis */}
        {analysis.creditworthinessAnalysis && (
          <div className="space-y-4 p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold">Анализ кредитоспособности</h3>
            </div>
            
            <div className="space-y-3">
              {analysis.creditworthinessAnalysis.borrowerReliability && (
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-muted-foreground">Надежность заемщика</h4>
                  <p className="text-sm leading-relaxed">
                    {analysis.creditworthinessAnalysis.borrowerReliability}
                  </p>
                </div>
              )}
              
              {analysis.creditworthinessAnalysis.debtRepaymentCapacity && (
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-muted-foreground">Способность возврата кредита</h4>
                  <p className="text-sm leading-relaxed">
                    {analysis.creditworthinessAnalysis.debtRepaymentCapacity}
                  </p>
                </div>
              )}
              
              {analysis.creditworthinessAnalysis.creditRating && (
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-muted-foreground">Кредитный рейтинг</h4>
                  <p className="text-sm leading-relaxed font-medium">
                    {analysis.creditworthinessAnalysis.creditRating}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Industry Analysis */}
        {analysis.industryAnalysis && (
          <div className="space-y-4 p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold">Отраслевой анализ</h3>
            </div>
            
            <div className="space-y-3">
              {analysis.industryAnalysis.sector && (
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-muted-foreground">Отрасль</h4>
                  <p className="text-sm leading-relaxed">
                    {analysis.industryAnalysis.sector}
                  </p>
                </div>
              )}
              
              {analysis.industryAnalysis.competitivePosition && (
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-muted-foreground">Конкурентная позиция</h4>
                  <p className="text-sm leading-relaxed">
                    {analysis.industryAnalysis.competitivePosition}
                  </p>
                </div>
              )}
              
              {analysis.industryAnalysis.industryRisks && analysis.industryAnalysis.industryRisks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Отраслевые риски</h4>
                  <ul className="space-y-2">
                    {analysis.industryAnalysis.industryRisks.map((risk, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <ShieldAlert className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
