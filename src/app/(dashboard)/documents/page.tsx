'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { FileText, LoaderCircle, RefreshCw, Trash2, Upload } from 'lucide-react';
import { toast } from '@/lib/safeToast';
import { getApiErrorMessage, uploadApi } from '@/lib/api';
import type { UploadedDocument } from '@/types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshDocuments = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await uploadApi.listDocuments();
      setDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Could not load your documents.'));
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    uploadApi.listDocuments()
      .then((response) => {
        if (active) setDocuments(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error: unknown) => {
        if (active) toast.error(getApiErrorMessage(error, 'Could not load your documents.'));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    setIsUploading(true);
    try {
      const uploaded = await uploadApi.uploadFiles(files);
      setDocuments((current) => [...uploaded, ...current]);
      toast.success(`${uploaded.length} document${uploaded.length === 1 ? '' : 's'} added to your private library.`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'One or more documents could not be processed.'));
      await refreshDocuments(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (document: UploadedDocument) => {
    if (!window.confirm(`Delete “${document.filename}” and its indexed passages?`)) return;
    setDeletingId(document.id);
    try {
      await uploadApi.deleteDocument(document.id);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      toast.success('Document deleted.');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'The document could not be deleted.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#20242a]">Uploaded documents</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#697386]">
            Extracted passages and file details stay in your private library; the original upload is discarded after processing. MAYA searches those passages only when you turn on “Use uploaded documents.”
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refreshDocuments()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#e5e5e5] px-3 py-2 text-sm text-[#404040] hover:bg-[#f4f4f4] disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0d0d0d] px-3 py-2 text-sm font-medium text-white hover:bg-[#262626] disabled:opacity-50"
          >
            {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {isUploading ? 'Processing…' : 'Upload documents'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.pptx,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </div>
      </div>

      <section className="mt-7 overflow-hidden rounded-xl border border-[#e5e5e5] bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-[#697386]">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Loading documents…
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center p-10 text-center">
            <FileText className="h-8 w-8 text-[#9aa4b2]" />
            <h2 className="mt-3 text-sm font-semibold text-[#20242a]">No documents yet</h2>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#697386]">
              Upload a PDF, Word document, spreadsheet, presentation, text file, or image to build your private searchable library.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#eeeeee]">
            {documents.map((document) => (
              <li key={document.id} className="flex items-start justify-between gap-4 p-4">
                <div className="flex min-w-0 gap-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#326fe5]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#20242a]">{document.filename}</p>
                    <p className="mt-1 text-xs text-[#697386]">
                      {formatSize(document.size)} · {document.chunks} passages · {new Date(document.created_at).toLocaleDateString()}
                    </p>
                    {document.status === 'failed' && document.error && (
                      <p className="mt-2 text-xs text-red-700">{document.error}</p>
                    )}
                    {document.status === 'ready' && (
                      <p className="mt-2 text-xs text-emerald-700">Ready for private retrieval</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(document)}
                  disabled={deletingId === document.id}
                  aria-label={`Delete ${document.filename}`}
                  className="rounded-md p-2 text-[#697386] hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  {deletingId === document.id
                    ? <LoaderCircle className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-3 text-xs leading-relaxed text-[#8e8e8e]">
        Matching excerpts are sent to the configured AI provider only for an answer where you enable document use. Uploading a file by itself does not send it to that provider.
      </p>
    </main>
  );
}
