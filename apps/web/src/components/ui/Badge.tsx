import React from 'react';

type Variant = 'default' | 'danger' | 'indigo';

export function Badge({ label, variant = 'default' }: { label: string; variant?: Variant }) {
  const cls =
    variant === 'danger'
      ? 'bg-[#DC2626] text-white'
      : variant === 'indigo'
        ? 'bg-[#4F46E5] text-white'
        : 'bg-gray-200 text-[#111827]';

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}
