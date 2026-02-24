import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ className = '', variant = 'primary', ...rest }: Props) {
  const base = 'rounded-2xl px-4 py-3 font-semibold disabled:opacity-50';
  const variantClass =
    variant === 'primary'
      ? 'bg-[#4F46E5] text-white'
      : variant === 'secondary'
        ? 'bg-white border border-gray-200 text-[#111827]'
        : 'bg-transparent text-[#111827]';
  return <button className={`${base} ${variantClass} ${className}`} {...rest} />;
}
