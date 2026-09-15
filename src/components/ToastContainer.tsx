import { motion, AnimatePresence } from 'motion/react';
import { useToastStore } from '../toastStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast, confirm, closeConfirm } = useToastStore();

  return (
    <>
      {/* Toast Notifications */}
      <div id="toast-root" className="fixed top-4 left-4 sm:left-6 z-[9999] flex flex-col gap-2 max-w-[320px] w-auto pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.95 }}
                transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                className={`p-2.5 px-3.5 rounded-xl border backdrop-blur-lg shadow-xl flex items-center gap-2.5 pointer-events-auto text-right ${
                  isSuccess
                    ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-200'
                    : isError
                    ? 'bg-rose-950/85 border-rose-500/30 text-rose-200'
                    : 'bg-slate-900/90 border-indigo-500/30 text-indigo-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {isSuccess ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : isError ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Info className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 text-xs font-semibold text-gray-100 leading-snug break-words">
                  {t.message}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-white transition p-0.5 rounded-md hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirm.isOpen && (
          <div id="confirm-root" className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => closeConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-md bg-gradient-to-br from-[#12141c] to-[#0c0d12] border border-indigo-500/15 rounded-3xl p-6 shadow-2xl text-right overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <h3 className="font-bold text-lg text-white mb-2">{confirm.title}</h3>
              <p className="text-sm text-gray-300 mb-6 leading-relaxed">{confirm.message}</p>
              <div className="flex gap-3 flex-row-reverse">
                <button
                  onClick={() => closeConfirm(true)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/10 active:scale-95 transition cursor-pointer"
                >
                  تأكيد
                </button>
                <button
                  onClick={() => closeConfirm(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-semibold active:scale-95 transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
