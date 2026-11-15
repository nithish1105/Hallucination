import { toast as sonnerToast } from 'sonner';

type ToastOptions = Parameters<typeof sonnerToast.error>[1];

function safeToastContent(value: unknown, seen = new WeakSet<object>()): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return String(value);
  if (value instanceof Error) return value.message || 'The request could not be completed.';

  if (Array.isArray(value)) {
    if (seen.has(value)) return '';
    seen.add(value);
    return value.map((part) => safeToastContent(part, seen)).filter(Boolean).join(' · ');
  }

  if (value && typeof value === 'object') {
    if (seen.has(value)) return '';
    seen.add(value);
    const record = value as Record<string, unknown>;
    for (const key of ['msg', 'message', 'detail', 'reason']) {
      const message = record[key];
      if (message !== undefined && message !== value) {
        const content = safeToastContent(message, seen);
        if (content) return content;
      }
    }
    return '';
  }

  return '';
}

function safeOptions(options?: ToastOptions): ToastOptions | undefined {
  if (!options || options.description === undefined) return options;
  return {
    ...options,
    description: safeToastContent(options.description) || 'The request could not be completed.',
  };
}

/** Keep structured API errors from reaching Sonner as invalid React children. */
export const toast = {
  error: (message: unknown, options?: ToastOptions) =>
    sonnerToast.error(safeToastContent(message) || 'The request could not be completed.', safeOptions(options)),
  info: (message: unknown, options?: ToastOptions) =>
    sonnerToast.info(safeToastContent(message) || 'Information', safeOptions(options)),
  success: (message: unknown, options?: ToastOptions) =>
    sonnerToast.success(safeToastContent(message) || 'Done', safeOptions(options)),
};
