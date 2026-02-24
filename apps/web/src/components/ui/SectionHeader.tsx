import React from 'react';

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function SectionHeader({ title, subtitle, right }: Props) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="text-base font-semibold text-[#111827]">{title}</div>
        {subtitle ? <div className="text-sm opacity-70">{subtitle}</div> : null}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}
