import React from 'react';
import { AlertTriangle, Info, HelpCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'danger' | 'warning';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = '确定',
  cancelText = '取消',
  type = 'info'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertTriangle className="text-red-500" size={32} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={32} />;
      default: return <Info className="text-brand-500" size={32} />;
    }
  };

  const getConfirmBtnColor = () => {
    switch (type) {
      case 'danger': return 'bg-red-500 hover:bg-red-600 focus:ring-red-200';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-200';
      default: return 'bg-brand-500 hover:bg-brand-600 focus:ring-brand-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">

        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className={`p-4 rounded-full ${type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-amber-50' : 'bg-brand-50'}`}>
            {getIcon()}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-white font-bold shadow-lg shadow-opacity-20 transition-all transform active:scale-95 focus:outline-none focus:ring-2 ${getConfirmBtnColor()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
