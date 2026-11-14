'use client';

import React, { useRef } from 'react';
import { Paperclip, X, File as FileIcon } from 'lucide-react';
import { UploadedFile } from '@/types';

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  uploadedFiles?: UploadedFile[];
  pendingFiles?: File[];
  onRemovePending?: (index: number) => void;
  disabled?: boolean;
}

export function FileUploader({ onFilesChange, uploadedFiles = [], pendingFiles = [], onRemovePending, disabled }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesChange(Array.from(e.target.files));
    }
    // reset
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col gap-2">
      {(pendingFiles.length > 0 || uploadedFiles.length > 0) && (
        <div className="flex flex-wrap gap-2 px-2 pb-2">
          {uploadedFiles.map(file => (
            <div key={file.id} className="flex items-center gap-2 bg-surface border border-border rounded-md px-2 py-1 text-xs">
              <FileIcon className="w-3 h-3 text-accent" />
              <span className="truncate max-w-[100px] text-foreground">{file.filename}</span>
              <span className="text-muted">{formatSize(file.size)}</span>
            </div>
          ))}
          {pendingFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-md px-2 py-1 text-xs group">
              <FileIcon className="w-3 h-3 text-accent" />
              <span className="truncate max-w-[100px] text-accent font-medium">{file.name}</span>
              <span className="text-muted">{formatSize(file.size)}</span>
              {onRemovePending && (
                <button onClick={() => onRemovePending(idx)} className="ml-1 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept=".pdf,.docx,.txt,.csv,.xlsx,.pptx,.md,.png,.jpg,.jpeg"
          disabled={disabled}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="p-2 text-muted hover:text-foreground hover:bg-surface rounded-md transition-colors disabled:opacity-50"
          title="Attach files"
        >
          <Paperclip className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
