import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");

  const validateFile = (file: File): string | null => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!validTypes.includes(file.type)) {
      return "Пожалуйста, загрузите файл Excel (.xlsx или .xls)";
    }

    if (file.size > 10 * 1024 * 1024) {
      return "Размер файла не должен превышать 10 МБ";
    }

    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      setError("");
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    },
    []
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setError("");
  }, []);

  const handleAnalyze = useCallback(() => {
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  }, [selectedFile, onFileSelect]);

  const handleDownloadTemplate = useCallback(() => {
    window.open("/api/template", "_blank");
  }, []);

  return (
    <div className="space-y-6">
      <Card
        className={`relative transition-all duration-200 ${
          dragActive
            ? "border-primary scale-[1.02] shadow-lg"
            : "hover-elevate"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleChange}
          disabled={isProcessing}
          data-testid="input-file-upload"
        />

        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center min-h-[400px] p-8 cursor-pointer"
        >
          {!selectedFile ? (
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-6 rounded-full bg-primary/10">
                <Upload className="h-12 w-12 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">
                  Загрузите финансовый документ
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Перетащите файл Excel сюда или нажмите для выбора
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Поддерживаются форматы .xlsx, .xls</span>
              </div>

              <div className="text-xs text-muted-foreground">
                Максимальный размер файла: 10 МБ
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  handleDownloadTemplate();
                }}
                data-testid="button-download-template"
                className="hover-elevate active-elevate-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Скачать шаблон Excel
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6 w-full">
              <div className="p-6 rounded-full bg-primary/10">
                <FileSpreadsheet className="h-12 w-12 text-primary" />
              </div>

              <div className="space-y-2 text-center max-w-md">
                <h3 className="text-xl font-semibold truncate w-full">
                  {selectedFile.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} КБ
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove();
                  }}
                  disabled={isProcessing}
                  data-testid="button-remove-file"
                  className="hover-elevate active-elevate-2"
                >
                  <X className="h-4 w-4 mr-2" />
                  Удалить
                </Button>
                
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleAnalyze();
                  }}
                  disabled={isProcessing}
                  data-testid="button-analyze"
                  className="hover-elevate active-elevate-2"
                >
                  Анализировать документ
                </Button>
              </div>
            </div>
          )}
        </label>
      </Card>

      {error && (
        <Alert variant="destructive" data-testid="alert-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
