import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { ConfirmModal, ConfirmModalProps } from '../components/ConfirmModal';

export interface ConfirmOptions {
  title?: string;
  message: React.ReactNode | string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode | string;
    confirmText: string;
    cancelText: string;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: 'Konfirmasi',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    variant: 'danger',
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;

      if (typeof options === 'string') {
        setModalState({
          isOpen: true,
          title: 'Konfirmasi Tindakan',
          message: options,
          confirmText: 'Ya, Lanjutkan',
          cancelText: 'Batal',
          variant: 'danger',
        });
      } else {
        setModalState({
          isOpen: true,
          title: options.title || 'Konfirmasi Tindakan',
          message: options.message,
          confirmText: options.confirmText || 'Ya, Lanjutkan',
          cancelText: options.cancelText || 'Batal',
          variant: options.variant || 'danger',
        });
      }
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
