'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onUploadComplete: (data: { url: string; path: string; base64: string }) => void;
  disabled?: boolean;
}

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadZone({ onUploadComplete, disabled }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((f: File): string | null => {
    if (f.type !== 'application/pdf') {
      return 'Only PDF files are accepted';
    }
    if (f.size > MAX_SIZE) {
      return `File is too large (${formatFileSize(f.size)}). Maximum is 20MB.`;
    }
    return null;
  }, []);

  function handleSelect(f: File) {
    setError(null);
    const validationError = validateFile(f);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    if (disabled || uploading) return;

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleSelect(droppedFile);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled && !uploading) setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) handleSelect(selected);
    // Reset input so same file can be selected again
    e.target.value = '';
  }

  function clearFile() {
    setFile(null);
    setError(null);
    setProgress(0);
  }

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setUploading(true);
    setProgress(10);

    try {
      // Read file as base64 for OCR
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      setProgress(30);

      // Upload to storage
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      setProgress(70);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const { url, path } = await res.json();
      setProgress(100);

      onUploadComplete({ url, path, base64 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-400 bg-emerald-50'
              : disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInputChange}
            className="hidden"
          />
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
            dragActive ? 'bg-emerald-100' : 'bg-gray-100'
          }`}>
            <Upload className={`w-7 h-7 ${dragActive ? 'text-emerald-800' : 'text-gray-400'}`} />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">
            {dragActive ? 'Drop your PDF here' : 'Drag and drop your statement PDF'}
          </p>
          <p className="text-xs text-gray-400">
            or click to browse — PDF only, max 20MB
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>

              {uploading && (
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-800 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{progress}% uploaded</p>
                </div>
              )}
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={clearFile}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!uploading && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={disabled}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-800 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload & Analyze
            </button>
          )}

          {uploading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-800">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading statement...
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
