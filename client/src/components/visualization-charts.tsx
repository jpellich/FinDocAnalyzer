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
  ReferenceLine,
} from "recharts";
import type { FinancialAnalysisResult } from "@shared/schema";

interface VisualizationChartsProps {
  result: FinancialAnalysisResult;
}

export function VisualizationCharts({ result }: VisualizationChartsProps) {
  // Extract and filter periods to handle sparse/partial arrays safely
  const periods = result.periods?.slice(0, 3).filter(Boolean) || [];
  const hasHistoricalData = periods.length >= 3;

  // Prepare liquidity data with multi-year support
  const liquidityData = hasHistoricalData
    ? [
        {
          name: "Текущая ликвидность",
          ...(periods[0] && { [periods[0].year]: periods[0].ratios.currentRatio.value }),
          ...(periods[1] && { [periods[1].year]: periods[1].ratios.currentRatio.value }),
          ...(periods[2] && { [periods[2].year]: periods[2].ratios.currentRatio.value }),
        },
        {
          name: "Быстрая ликвидность",
          ...(periods[0] && { [periods[0].year]: periods[0].ratios.quickRatio.value }),
          ...(periods[1] && { [periods[1].year]: periods[1].ratios.quickRatio.value }),
          ...(periods[2] && { [periods[2].year]: periods[2].ratios.quickRatio.value }),
        },
        {
          name: "Абсолютная ликвидность",
          ...(periods[0] && { [periods[0].year]: periods[0].ratios.cashRatio.value }),
          ...(periods[1] && { [periods[1].year]: periods[1].ratios.cashRatio.value }),
          ...(periods[2] && { [periods[2].year]: periods[2].ratios.cashRatio.value }),
        },
      ]
    : [
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

  // Prepare stability data with multi-year support
  const stabilityData = hasHistoricalData
    ? [
        {
          name: "Коэф. автономии",
          ...(periods[0] && { [periods[0].year]: periods[0].ratios.equityRatio.value }),
          ...(periods[1] && { [periods[1].year]: periods[1].ratios.equityRatio.value }),
          ...(periods[2] && { [periods[2].year]: periods[2].ratios.equityRatio.value }),
        },
        {
          name: "Коэф. задолженности",
          ...(periods[0] && { [periods[0].year]: periods[0].ratios.debtRatio.value }),
          ...(periods[1] && { [periods[1].year]: periods[1].ratios.debtRatio.value }),
          ...(periods[2] && { [periods[2].year]: periods[2].ratios.debtRatio.value }),
        },
        {
          name: "Финансовый рычаг",
          ...(periods[0] && { [periods[0].year]: periods[0].ratios.financialLeverageRatio.value }),
          ...(periods[1] && { [periods[1].year]: periods[1].ratios.financialLeverageRatio.value }),
          ...(periods[2] && { [periods[2].year]: periods[2].ratios.financialLeverageRatio.value }),
        },
      ]
    : [
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

  // Radar data - use current year data only
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

  // Profitability data - with multi-year support if available
  const profitabilityData = [];
  
  if (hasHistoricalData) {
    // Multi-year profitability - reversed order so latest year is first
    const sortedPeriods = [...periods].reverse(); // Reverse to show oldest to newest
    
    if (sortedPeriods[0]?.ratios.roa) {
      profitabilityData.push({
        name: "ROA",
        ...(sortedPeriods[2] && sortedPeriods[2].ratios.roa && { [sortedPeriods[2].year]: sortedPeriods[2].ratios.roa.value * 100 }),
        ...(sortedPeriods[1] && sortedPeriods[1].ratios.roa && { [sortedPeriods[1].year]: sortedPeriods[1].ratios.roa.value * 100 }),
        ...(sortedPeriods[0] && sortedPeriods[0].ratios.roa && { [sortedPeriods[0].year]: sortedPeriods[0].ratios.roa.value * 100 }),
      });
    }
    if (sortedPeriods[0]?.ratios.roe) {
      profitabilityData.push({
        name: "ROE",
        ...(sortedPeriods[2] && sortedPeriods[2].ratios.roe && { [sortedPeriods[2].year]: sortedPeriods[2].ratios.roe.value * 100 }),
        ...(sortedPeriods[1] && sortedPeriods[1].ratios.roe && { [sortedPeriods[1].year]: sortedPeriods[1].ratios.roe.value * 100 }),
        ...(sortedPeriods[0] && sortedPeriods[0].ratios.roe && { [sortedPeriods[0].year]: sortedPeriods[0].ratios.roe.value * 100 }),
      });
    }
    if (sortedPeriods[0]?.ratios.ros) {
      profitabilityData.push({
        name: "ROS",
        ...(sortedPeriods[2] && sortedPeriods[2].ratios.ros && { [sortedPeriods[2].year]: sortedPeriods[2].ratios.ros.value * 100 }),
        ...(sortedPeriods[1] && sortedPeriods[1].ratios.ros && { [sortedPeriods[1].year]: sortedPeriods[1].ratios.ros.value * 100 }),
        ...(sortedPeriods[0] && sortedPeriods[0].ratios.ros && { [sortedPeriods[0].year]: sortedPeriods[0].ratios.ros.value * 100 }),
      });
    }
    if (sortedPeriods[0]?.ratios.grossProfitMargin) {
      profitabilityData.push({
        name: "Валовая рент.",
        ...(sortedPeriods[2] && sortedPeriods[2].ratios.grossProfitMargin && { [sortedPeriods[2].year]: sortedPeriods[2].ratios.grossProfitMargin.value * 100 }),
        ...(sortedPeriods[1] && sortedPeriods[1].ratios.grossProfitMargin && { [sortedPeriods[1].year]: sortedPeriods[1].ratios.grossProfitMargin.value * 100 }),
        ...(sortedPeriods[0] && sortedPeriods[0].ratios.grossProfitMargin && { [sortedPeriods[0].year]: sortedPeriods[0].ratios.grossProfitMargin.value * 100 }),
      });
    }
    if (sortedPeriods[0]?.ratios.operatingProfitMargin) {
      profitabilityData.push({
        name: "Опер. рент.",
        ...(sortedPeriods[2] && sortedPeriods[2].ratios.operatingProfitMargin && { [sortedPeriods[2].year]: sortedPeriods[2].ratios.operatingProfitMargin.value * 100 }),
        ...(sortedPeriods[1] && sortedPeriods[1].ratios.operatingProfitMargin && { [sortedPeriods[1].year]: sortedPeriods[1].ratios.operatingProfitMargin.value * 100 }),
        ...(sortedPeriods[0] && sortedPeriods[0].ratios.operatingProfitMargin && { [sortedPeriods[0].year]: sortedPeriods[0].ratios.operatingProfitMargin.value * 100 }),
      });
    }
    if (sortedPeriods[0]?.ratios.netProfitMargin) {
      profitabilityData.push({
        name: "Чистая рент.",
        ...(sortedPeriods[2] && sortedPeriods[2].ratios.netProfitMargin && { [sortedPeriods[2].year]: sortedPeriods[2].ratios.netProfitMargin.value * 100 }),
        ...(sortedPeriods[1] && sortedPeriods[1].ratios.netProfitMargin && { [sortedPeriods[1].year]: sortedPeriods[1].ratios.netProfitMargin.value * 100 }),
        ...(sortedPeriods[0] && sortedPeriods[0].ratios.netProfitMargin && { [sortedPeriods[0].year]: sortedPeriods[0].ratios.netProfitMargin.value * 100 }),
      });
    }
  } else {
    // Single year profitability
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
              {hasHistoricalData ? (
                <>
                  {periods[0] && <Bar dataKey={periods[0].year} fill="hsl(var(--chart-1))" name={`${periods[0].year} год`} />}
                  {periods[1] && <Bar dataKey={periods[1].year} fill="hsl(var(--chart-2))" name={`${periods[1].year} год`} />}
                  {periods[2] && <Bar dataKey={periods[2].year} fill="hsl(var(--chart-5))" name={`${periods[2].year} год`} />}
                  <ReferenceLine y={2.0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Норматив (Текущая)" />
                  <ReferenceLine y={1.0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Норматив (Быстрая)" />
                  <ReferenceLine y={0.2} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Норматив (Абс.)" />
                </>
              ) : (
                <>
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" name="Фактическое значение" />
                  <Bar dataKey="benchmark" fill="hsl(var(--chart-3))" name="Норматив" />
                </>
              )}
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
              {hasHistoricalData ? (
                <>
                  {periods[0] && <Bar dataKey={periods[0].year} fill="hsl(var(--chart-1))" name={`${periods[0].year} год`} />}
                  {periods[1] && <Bar dataKey={periods[1].year} fill="hsl(var(--chart-2))" name={`${periods[1].year} год`} />}
                  {periods[2] && <Bar dataKey={periods[2].year} fill="hsl(var(--chart-5))" name={`${periods[2].year} год`} />}
                  <ReferenceLine y={0.5} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Норматив" />
                  <ReferenceLine y={1.0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Норматив (Рычаг)" />
                </>
              ) : (
                <>
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" name="Фактическое значение" />
                  <Bar dataKey="benchmark" fill="hsl(var(--chart-3))" name="Норматив" />
                </>
              )}
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
                {hasHistoricalData ? (
                  <>
                    {periods[0] && <Bar dataKey={periods[0].year} fill="hsl(var(--chart-1))" name={`${periods[0].year} год`} />}
                    {periods[1] && <Bar dataKey={periods[1].year} fill="hsl(var(--chart-2))" name={`${periods[1].year} год`} />}
                    {periods[2] && <Bar dataKey={periods[2].year} fill="hsl(var(--chart-5))" name={`${periods[2].year} год`} />}
                  </>
                ) : (
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" name="Рентабельность (%)" />
                )}
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
