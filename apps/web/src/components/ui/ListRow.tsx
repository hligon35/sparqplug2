import React from 'react';
import { useDebug } from '../../hooks/useDebug';

type Props = {
  title: string;
  subtitle?: string;
  rightText?: string;
  onClick?: () => void;
  showDivider?: boolean;
};

export function ListRow({ title, subtitle, rightText, onClick, showDivider = true }: Props) {
  const debug = useDebug();
  const showBounds = Boolean(debug?.enabled && debug.toggles.showLayoutBounds);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left py-3 ${showDivider ? 'border-b border-gray-100' : ''} ${
        showBounds ? 'outline outline-1 outline-red-500' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-[#111827] truncate">{title}</div>
          {subtitle ? <div className="text-sm opacity-70 truncate">{subtitle}</div> : null}
        </div>
        {rightText ? <div className="text-sm opacity-70">{rightText}</div> : null}
      </div>
    </button>
  );
}
