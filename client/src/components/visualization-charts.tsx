import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import type { FinancialAnalysisResult } from "@shared/schema";

interface VisualizationChartsProps {
  result: FinancialAnalysisResult;
}

export function VisualizationCharts({ result }: VisualizationChartsProps) {
  const liquidityData = [
    {
      name: "Текущая ликвидность",
      value: result.ratios.currentRatio.value,
      benchmark: 2.0,
    },
    {
      name: "Быстрая ликвидность",
      value: result.ratios.quickRatio.value,
      benchmark: 1.0,
    },
    {
      name: "Абсолютная ликвидность",
      value: result.ratios.cashRatio.value,
      benchmark: 0.2,
    },
  ];

  const stabilityData = [
    {
      name: "Коэф. автономии",
      value: result.ratios.equityRatio.value,
      benchmark: 0.5,
    },
    {
      name: "Коэф. задолженности",
      value: result.ratios.debtRatio.value,
      benchmark: 0.5,
    },
    {
      name: "Финансовый рычаг",
      value: result.ratios.financialLeverageRatio.value,
      benchmark: 1.0,
    },
  ];

  const radarData = [
    {
      metric: "Текущая ликвидность",
      score: Math.min((result.ratios.currentRatio.value / 2.0) * 100, 100),
    },
    {
      metric: "Быстрая ликвидность",
      score: Math.min((result.ratios.quickRatio.value / 1.0) * 100, 100),
    },
    {
      metric: "Автономия",
      score: Math.min((result.ratios.equityRatio.value / 0.5) * 100, 100),
    },
    {
      metric: "Стабильность",
      score: Math.min((1 - result.ratios.debtRatio.value) * 100, 100),
    },
  ];

  // Profitability data - only if profitability ratios exist
  const profitabilityData = [];
  if (result.ratios.roa) {
    profitabilityData.push({ name: "ROA", value: result.ratios.roa.value * 100 });
  }
  if (result.ratios.roe) {
    profitabilityData.push({ name: "ROE", value: result.ratios.roe.value * 100 });
  }
  if (result.ratios.ros) {
    profitabilityData.push({ name: "ROS", value: result.ratios.ros.value * 100 });
  }
  if (result.ratios.grossProfitMargin) {
    profitabilityData.push({ name: "Валовая рент.", value: result.ratios.grossProfitMargin.value * 100 });
  }
  if (result.ratios.operatingProfitMargin) {
    profitabilityData.push({ name: "Опер. рент.", value: result.ratios.operatingProfitMargin.value * 100 });
  }
  if (result.ratios.netProfitMargin) {
    profitabilityData.push({ name: "Чистая рент.", value: result.ratios.netProfitMargin.value * 100 });
  }

  const hasProfitabilityData = profitabilityData.length > 0;

  return (
    <div className="space-y-6">
      {/* Liquidity Chart */}
      <Card data-testid="card-liquidity-chart">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Показатели ликвидности
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={liquidityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Bar dataKey="value" fill="hsl(var(--chart-1))" name="Фактическое значение" />
              <Bar dataKey="benchmark" fill="hsl(var(--chart-3))" name="Норматив" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Stability Chart */}
      <Card data-testid="card-stability-chart">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Показатели финансовой устойчивости
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stabilityData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="name"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              <Bar dataKey="value" fill="hsl(var(--chart-2))" name="Фактическое значение" />
              <Bar dataKey="benchmark" fill="hsl(var(--chart-3))" name="Норматив" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Profitability Chart - только если есть данные */}
      {hasProfitabilityData && (
        <Card data-testid="card-profitability-chart">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold">
              Показатели рентабельности
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitabilityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  label={{ value: '%', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Значение']}
                />
                <Legend />
                <Bar dataKey="value" fill="hsl(var(--chart-4))" name="Рентабельность (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Radar Chart */}
      <Card data-testid="card-radar-chart">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-xl font-semibold">
            Общая финансовая оценка
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid className="stroke-border" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Radar
                name="Оценка (%)"
                dataKey="score"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.6}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
