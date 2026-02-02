import { useCallback, useState } from 'react';
import { Upload, FileJson, Archive, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function FileUploader({ onFileSelect, isLoading }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/json',
    ];
    const validExtensions = ['.zip', '.json'];

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType && !hasValidExtension) {
      setError('Будь ласка, завантажте ZIP або JSON файл з експортом Telegram');
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div className="file-uploader">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Обробка файлу...</p>
          </div>
        ) : (
          <>
            <Upload size={48} className="upload-icon" />
            <h3>Перетягніть файл сюди</h3>
            <p>або</p>
            <label className="file-input-label">
              <input
                type="file"
                accept=".zip,.json"
                onChange={handleFileInput}
                className="file-input"
              />
              Виберіть файл
            </label>
            <div className="supported-formats">
              <span className="format">
                <Archive size={16} /> ZIP архів
              </span>
              <span className="format">
                <FileJson size={16} /> JSON файл
              </span>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
