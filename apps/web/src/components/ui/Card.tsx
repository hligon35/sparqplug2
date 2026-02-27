import React from 'react';
import { useDebug } from '../../hooks/useDebug';

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: Props) {
  const debug = useDebug();
  const showBounds = Boolean(debug?.enabled && debug.toggles.showLayoutBounds);

  return (
    <div
      className={`rounded-2xl border bg-white p-4 ${
        showBounds ? 'border-red-500 border-dashed' : 'border-gray-200'
      } ${className}`}
    >
      {children}
    </div>
  );
}
