import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
