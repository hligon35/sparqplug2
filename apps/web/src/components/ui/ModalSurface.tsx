import React from 'react';

export function ModalSurface({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white border border-gray-200 overflow-hidden w-full max-w-[720px]">
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="text-base font-semibold text-[#111827]">{title}</div>
        <button type="button" onClick={onClose} className="px-3 py-2 font-semibold">
          Close
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}
