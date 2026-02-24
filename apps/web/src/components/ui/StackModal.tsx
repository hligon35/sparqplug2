import React from 'react';
import { ModalSurface } from './ModalSurface';

export function StackModal({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50">
      <button type="button" aria-label="Close" className="flex-1" onClick={onClose} />
      <div className="px-4 pb-6">
        <div className="flex justify-center">
          <ModalSurface title={title} onClose={onClose}>
            {children}
          </ModalSurface>
        </div>
      </div>
    </div>
  );
}
