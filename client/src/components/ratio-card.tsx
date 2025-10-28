import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { RatioWithStatus } from "@shared/schema";
import { FractionFormula } from "./fraction-formula";

interface RatioCardProps {
  title: string;
  ratio: RatioWithStatus;
  trend?: "up" | "down" | "stable";
  isPercentage?: boolean;
}

export function RatioCard({ title, ratio, trend, isPercentage = false }: RatioCardProps) {
  const getStatusColor = (status: RatioWithStatus["status"]) => {
    switch (status) {
      case "excellent":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "good":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "critical":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    }
  };

  const getStatusIcon = (status: RatioWithStatus["status"]) => {
    switch (status) {
      case "excellent":
        return <CheckCircle className="h-4 w-4" />;
      case "good":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "critical":
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: RatioWithStatus["status"]) => {
    switch (status) {
      case "excellent":
        return "Отлично";
      case "good":
        return "Хорошо";
      case "warning":
        return "Внимание";
      case "critical":
        return "Критично";
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case "stable":
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`card-ratio-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {getTrendIcon()}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold font-mono" data-testid="text-ratio-value">
          {isPercentage ? `${(ratio.value * 100).toFixed(2)}%` : ratio.value.toFixed(2)}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`${getStatusColor(ratio.status)} flex items-center gap-1`}
            data-testid="badge-status"
          >
            {getStatusIcon(ratio.status)}
            {getStatusLabel(ratio.status)}
          </Badge>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Норматив: {ratio.benchmark}
          </p>
          <p className="text-sm">
            {ratio.description}
          </p>
          {ratio.formula && (
            <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Формула:</span>
              <FractionFormula formula={ratio.formula} className="text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
