import React from 'react';
import { AlertTriangle } from 'lucide-react';
import ModalWrapper from './ModalWrapper';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-5 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
          <AlertTriangle size={24} />
        </div>
        <p className="text-brown-500 text-sm mb-6">{message}</p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-brown-600 bg-brown-50 hover:bg-brown-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ConfirmModal;
