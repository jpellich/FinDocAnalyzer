import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface LoadingModalProps {
  isOpen: boolean;
  stage: string;
  progress: number;
}

export function LoadingModal({ isOpen, stage, progress }: LoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-md [&>button]:hidden"
        data-testid="modal-loading"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Обработка документа
          </DialogTitle>
          <DialogDescription>
            Пожалуйста, подождите, пока мы анализируем ваши финансовые данные
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Progress value={progress} className="h-2" data-testid="progress-bar" />
          
          <div className="space-y-2">
            <p className="text-sm font-medium" data-testid="text-stage">
              {stage}
            </p>
            <p className="text-xs text-muted-foreground">
              {progress}% завершено
            </p>
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            <p>✓ Парсинг Excel файла</p>
            <p className={progress >= 30 ? "" : "opacity-50"}>
              {progress >= 30 ? "✓" : "○"} Расчёт финансовых коэффициентов
            </p>
            <p className={progress >= 60 ? "" : "opacity-50"}>
              {progress >= 60 ? "✓" : "○"} Генерация AI анализа
            </p>
            <p className={progress >= 90 ? "" : "opacity-50"}>
              {progress >= 90 ? "✓" : "○"} Подготовка результатов
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
