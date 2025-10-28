import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileUpload } from "@/components/file-upload";
import { DataPreview } from "@/components/data-preview";
import { RatioCard } from "@/components/ratio-card";
import { AIAnalysis } from "@/components/ai-analysis";
import { VisualizationCharts } from "@/components/visualization-charts";
import { LoadingModal } from "@/components/loading-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { FinancialAnalysisResult } from "@shared/schema";

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<FinancialAnalysisResult | null>(null);
  const [processingStage, setProcessingStage] = useState("");
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const analysisMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      setProgress(10);
      setProcessingStage("Отправка файла на сервер...");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      setProgress(30);
      setProcessingStage("Парсинг Excel данных...");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Ошибка обработки файла");
      }

      setProgress(50);
      setProcessingStage("Расчёт финансовых коэффициентов...");

      const data = await response.json();

      if (!data.success || !data.result) {
        throw new Error("Неверный формат ответа от сервера");
      }

      setProgress(70);
      setProcessingStage("Генерация AI анализа...");

      await new Promise(resolve => setTimeout(resolve, 800));

      setProgress(90);
      setProcessingStage("Подготовка результатов...");

      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(100);

      return data.result as FinancialAnalysisResult;
    },
    onSuccess: (result) => {
      setAnalysisResult(result);
      toast({
        title: "Анализ завершён",
        description: "Финансовые показатели успешно рассчитаны с помощью AI",
      });
    },
    onError: (error) => {
      console.error("Error processing file:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Не удалось обработать файл. Пожалуйста, попробуйте снова.";

      toast({
        title: "Ошибка обработки",
        description: errorMessage,
        variant: "destructive",
      });
      
      setProgress(0);
      setProcessingStage("");
    },
  });

  const handleFileSelect = async (file: File) => {
    setProgress(0);
    setProcessingStage("Загрузка файла...");
    analysisMutation.mutate(file);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setProgress(0);
    setProcessingStage("");
  };

  const handleDownloadReport = async () => {
    if (!analysisResult) return;

    try {
      const response = await fetch("/api/download-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(analysisResult),
      });

      if (!response.ok) {
        throw new Error("Ошибка при генерации отчёта");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `financial-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Отчёт скачан",
        description: "Файл успешно сохранён на вашем устройстве",
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось скачать отчёт",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Financial Analytics</h1>
                <p className="text-xs text-muted-foreground">
                  Интеллектуальный анализ документов
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {analysisResult && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  data-testid="button-reset"
                  className="hover-elevate active-elevate-2"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Новый анализ
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!analysisResult ? (
          /* Upload Section */
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Анализ финансовых документов
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Загрузите Excel файл с финансовыми данными и получите детальный
                анализ с рекомендациями от искусственного интеллекта
              </p>
            </div>

            <FileUpload
              onFileSelect={handleFileSelect}
              isProcessing={analysisMutation.isPending}
            />
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-12">
            {/* Header with actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Результаты анализа
                </h2>
                <p className="text-muted-foreground mt-1">
                  Анализ завершён {new Date(analysisResult.timestamp).toLocaleString("ru-RU")}
                </p>
              </div>
              <Button
                variant="default"
                onClick={handleDownloadReport}
                data-testid="button-download"
                className="hover-elevate active-elevate-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Скачать отчёт
              </Button>
            </div>

            {/* Data Preview */}
            <DataPreview data={analysisResult.data} />

            {/* Financial Ratios Grid */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Финансовые показатели</h3>
              
              {/* Liquidity Ratios */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-muted-foreground uppercase tracking-wide">
                  Коэффициенты ликвидности
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <RatioCard
                    title="Коэффициент текущей ликвидности"
                    ratio={analysisResult.ratios.currentRatio}
                    trend="up"
                  />
                  <RatioCard
                    title="Коэффициент быстрой ликвидности"
                    ratio={analysisResult.ratios.quickRatio}
                    trend="up"
                  />
                  <RatioCard
                    title="Коэффициент абсолютной ликвидности"
                    ratio={analysisResult.ratios.cashRatio}
                    trend="up"
                  />
                </div>
              </div>

              {/* Stability Ratios */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-muted-foreground uppercase tracking-wide">
                  Показатели финансовой устойчивости
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <RatioCard
                    title="Коэффициент автономии"
                    ratio={analysisResult.ratios.equityRatio}
                    trend="stable"
                  />
                  <RatioCard
                    title="Коэффициент задолженности"
                    ratio={analysisResult.ratios.debtRatio}
                    trend="stable"
                  />
                  <RatioCard
                    title="Финансовый рычаг"
                    ratio={analysisResult.ratios.financialLeverageRatio}
                    trend="stable"
                  />
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-muted-foreground uppercase tracking-wide">
                  Дополнительные показатели
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <RatioCard
                    title="Оборотный капитал"
                    ratio={analysisResult.ratios.workingCapital}
                    trend="up"
                  />
                  <RatioCard
                    title="Соотношение долга к капиталу"
                    ratio={analysisResult.ratios.debtToEquityRatio}
                    trend="stable"
                  />
                </div>
              </div>

              {/* Profitability Ratios */}
              {(analysisResult.ratios.roa || analysisResult.ratios.roe || analysisResult.ratios.grossProfitMargin || analysisResult.ratios.operatingProfitMargin || analysisResult.ratios.netProfitMargin) && (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-muted-foreground uppercase tracking-wide">
                    Показатели рентабельности
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analysisResult.ratios.roa && (
                      <RatioCard
                        title="Рентабельность активов (ROA)"
                        ratio={analysisResult.ratios.roa}
                        trend="up"
                      />
                    )}
                    {analysisResult.ratios.roe && (
                      <RatioCard
                        title="Рентабельность капитала (ROE)"
                        ratio={analysisResult.ratios.roe}
                        trend="up"
                      />
                    )}
                    {analysisResult.ratios.ros && (
                      <RatioCard
                        title="Рентабельность продаж (ROS)"
                        ratio={analysisResult.ratios.ros}
                        trend="up"
                      />
                    )}
                    {analysisResult.ratios.grossProfitMargin && (
                      <RatioCard
                        title="Рентабельность по валовой прибыли"
                        ratio={analysisResult.ratios.grossProfitMargin}
                        trend="up"
                      />
                    )}
                    {analysisResult.ratios.operatingProfitMargin && (
                      <RatioCard
                        title="Рентабельность по прибыли от продаж"
                        ratio={analysisResult.ratios.operatingProfitMargin}
                        trend="up"
                      />
                    )}
                    {analysisResult.ratios.netProfitMargin && (
                      <RatioCard
                        title="Рентабельность по чистой прибыли"
                        ratio={analysisResult.ratios.netProfitMargin}
                        trend="up"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Analysis */}
            <AIAnalysis analysis={analysisResult.aiAnalysis} />

            {/* Visualizations */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Визуализация показателей</h3>
              <VisualizationCharts result={analysisResult} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-12 mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-3">О платформе</h3>
              <p className="text-sm text-muted-foreground">
                Профессиональный инструмент для анализа финансовых документов
                с использованием искусственного интеллекта
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Возможности</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Автоматический расчёт коэффициентов</li>
                <li>AI-анализ от OpenAI</li>
                <li>Визуализация данных</li>
                <li>Экспорт отчётов</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Контакты</h3>
              <p className="text-sm text-muted-foreground">
                © 2025 Financial Analytics. Все права защищены.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Loading Modal */}
      <LoadingModal
        isOpen={analysisMutation.isPending}
        stage={processingStage}
        progress={progress}
      />
    </div>
  );
}
