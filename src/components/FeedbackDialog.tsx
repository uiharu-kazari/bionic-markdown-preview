import { useState, useCallback } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEEDBACK_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSe7mHo47nveeSDXLTPIba4BBI_qcIORTk4ObJMY-Slf8xrrOQ/viewform?usp=dialog';

export function FeedbackDialog({ isOpen, onClose }: FeedbackDialogProps) {
  const { t } = useLanguage();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(FEEDBACK_URL);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      console.error('Failed to copy URL');
    }
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
      />
      <div 
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            {t.feedbackPrompt}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            {t.feedbackDescription}
          </p>
          <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 break-all flex-1">
                {FEEDBACK_URL}
              </p>
              <button
                onClick={handleCopyUrl}
                className={`flex-shrink-0 p-1.5 rounded transition-colors ${
                  copySuccess
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={copySuccess ? t.copied : 'Copy URL'}
              >
                {copySuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {t.feedbackCancel}
            </button>
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              {t.feedbackOpenForm}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
