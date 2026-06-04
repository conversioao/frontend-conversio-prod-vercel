import React from 'react';
import { UploadCloud } from 'lucide-react';

interface UploadZoneProps {
  onFileSelect?: (file: File) => void;
  label?: string;
  helperText?: string;
}

export function UploadZone({ 
  onFileSelect, 
  label = "Upload Image", 
  helperText = "Drag & drop or click to browse" 
}: UploadZoneProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect?.(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className="w-full border-2 border-dashed border-border-subtle rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-surface/50 hover:bg-surface hover:border-accent/50 transition-all cursor-pointer group"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="w-12 h-12 rounded-full bg-bg-base flex items-center justify-center text-text-secondary group-hover:text-accent transition-colors">
        <UploadCloud size={24} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-tertiary mt-1">{helperText}</p>
      </div>
    </div>
  );
}
