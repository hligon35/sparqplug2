import React from 'react';
import bg from '../../assets/sparqplugbg.png';
import { useDebug } from '../../hooks/useDebug';

type Props = {
  title?: string;
  statusText?: string | null;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
};

export function WebScreen({ title, statusText, headerRight, children, className = '' }: Props) {
  const debug = useDebug();
  const showBounds = Boolean(debug?.enabled && debug.toggles.showLayoutBounds);

  return (
    <div
      className={`min-h-screen ${className}`}
      style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div
        className={`px-4 pt-3 pb-8 max-w-[1200px] mx-auto flex flex-col gap-4 ${
          showBounds ? 'outline outline-1 outline-red-500' : ''
        }`}
      >
        {title ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[22px] font-bold text-[#111827]">{title}</div>
              {statusText ? <div className="text-sm opacity-70">{statusText}</div> : null}
            </div>
            {headerRight ? <div>{headerRight}</div> : null}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
